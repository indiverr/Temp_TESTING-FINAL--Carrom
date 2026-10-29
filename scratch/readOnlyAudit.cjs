const fs = require('fs');
const path = require('path');
const https = require('https');

async function getAccessToken() {
  const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(raw);
  return config.tokens?.access_token;
}

function httpsRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function decodeFirestoreValue(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(decodeFirestoreValue);
  }
  if ('mapValue' in val) {
    const obj = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      obj[k] = decodeFirestoreValue(v);
    }
    return obj;
  }
  return val;
}

function decodeFirestoreDoc(doc) {
  const id = doc.name.split('/').pop();
  const fields = {};
  for (const [k, v] of Object.entries(doc.fields || {})) {
    fields[k] = decodeFirestoreValue(v);
  }
  return { id, path: doc.name, ...fields };
}

async function fetchAllDocuments(token, projectId, collectionPath) {
  let allDocs = [];
  let pageToken = '';
  do {
    const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
    const options = {
      hostname: 'firestore.googleapis.com',
      port: 443,
      path: `/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}?pageSize=300${pageParam}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    };
    const res = await httpsRequest(options);
    if (res.status === 200 && res.body && res.body.documents) {
      for (const d of res.body.documents) {
        allDocs.push(decodeFirestoreDoc(d));
      }
      pageToken = res.body.nextPageToken || '';
    } else {
      pageToken = '';
    }
  } while (pageToken);
  return allDocs;
}

async function fetchSingleDoc(token, projectId, docPath) {
  const options = {
    hostname: 'firestore.googleapis.com',
    port: 443,
    path: `/v1/projects/${projectId}/databases/(default)/documents/${docPath}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  };
  const res = await httpsRequest(options);
  if (res.status === 200 && res.body) {
    return decodeFirestoreDoc(res.body);
  }
  return null;
}

function maskPII(name, phone) {
  let maskedName = 'N/A';
  if (name) {
    const trimmed = name.trim();
    if (trimmed.length <= 2) maskedName = trimmed[0] + '*';
    else maskedName = trimmed.substring(0, 2) + '*'.repeat(Math.max(1, trimmed.length - 2));
  }
  let maskedPhone = 'N/A';
  if (phone) {
    const str = String(phone).trim();
    if (str.length >= 4) {
      maskedPhone = '*'.repeat(str.length - 4) + str.slice(-4);
    } else {
      maskedPhone = '****';
    }
  }
  return { maskedName, maskedPhone };
}

async function main() {
  const projectId = 'carrom-df56a';
  console.log(`[READ-ONLY AUDIT] Querying production Firestore project '${projectId}'...`);
  const token = await getAccessToken();

  // 1. Fetch all bookings
  const bookings = await fetchAllDocuments(token, projectId, 'bookings');
  console.log(`Total bookings found in /bookings: ${bookings.length}`);

  // Inspect all bookings summary
  const summaryByStatus = {};
  for (const b of bookings) {
    const key = `paymentStatus: "${b.paymentStatus}" | bookingStatus: "${b.bookingStatus}"`;
    summaryByStatus[key] = (summaryByStatus[key] || 0) + 1;
  }
  console.log('\nStatus Distribution in /bookings:', JSON.stringify(summaryByStatus, null, 2));

  // 2. Filter for target inconsistency:
  // paymentStatus == "Paid" && bookingStatus == "Pending Confirmation"
  const inconsistentBookings = bookings.filter(b => 
    b.paymentStatus === 'Paid' && b.bookingStatus === 'Pending Confirmation'
  );

  console.log(`\nInconsistent records count: ${inconsistentBookings.length}`);

  // 3. For each inconsistent record, inspect tickets and inventory status
  const auditResults = [];
  for (const b of inconsistentBookings) {
    const { maskedName, maskedPhone } = maskPII(b.customerName, b.customerPhone);

    // Extract ticket numbers
    let ticketNumbers = [];
    if (Array.isArray(b.tickets)) {
      ticketNumbers = b.tickets.map(t => typeof t === 'string' ? t : (t.ticketNumber || t.id));
    } else if (b.ticketNumber) {
      ticketNumbers = [b.ticketNumber];
    } else if (b.ticketNumbers && Array.isArray(b.ticketNumbers)) {
      ticketNumbers = b.ticketNumbers;
    }

    // Inspect inventory for each ticket
    const inventoryDetails = [];
    const drawDate = b.drawDate || '02 Oct 2026';
    const seriesId = b.seriesId || 'default';

    for (const tNum of ticketNumbers) {
      // Check /ticketInventory/{drawDate}_col-1_{tNum} or similar formats
      // Also check subcollection /draws/{drawDate}/series/{seriesId}/tickets/{tNum}
      const encDrawDate = encodeURIComponent(drawDate);
      const encSeriesId = encodeURIComponent(seriesId);
      const encTNum = encodeURIComponent(tNum);
      const subDocPath = `draws/${encDrawDate}/series/${encSeriesId}/tickets/${encTNum}`;
      const subDoc = await fetchSingleDoc(token, projectId, subDocPath);

      // Also check root collection ticketInventory
      // Common pattern: `${drawDate}_col-1_${tNum}` or search all ticketInventory
      inventoryDetails.push({
        ticketNumber: tNum,
        drawDate,
        seriesTicketDoc: subDoc ? {
          status: subDoc.status,
          bookingStatus: subDoc.bookingStatus,
          bookedTicketId: subDoc.bookedTicketId,
          lockedByUid: subDoc.lockedByUid,
          isLocked: subDoc.isLocked
        } : null
      });
    }

    auditResults.push({
      bookingId: b.id,
      customerMasked: `${maskedName} (${maskedPhone})`,
      ticketNumbers,
      paymentStatus: b.paymentStatus,
      bookingStatus: b.bookingStatus,
      totalAmount: b.totalAmount,
      amountPaid: b.amountPaid,
      remainingBalance: b.remainingBalance ?? (b.totalAmount - (b.amountPaid || 0)),
      paymentMethod: b.paymentMethod,
      createdAt: b.createdAt,
      submittedBy: b.submittedBy || b.createdBy || b.employeeId,
      inventoryDetails
    });
  }

  // Also query ticketInventory root collection to see all items there
  const ticketInventoryDocs = await fetchAllDocuments(token, projectId, 'ticketInventory');
  console.log(`\nTotal ticketInventory root docs: ${ticketInventoryDocs.length}`);

  // Cross check if any ticketInventory doc corresponds to the ticket numbers
  for (const r of auditResults) {
    for (const tNum of r.ticketNumbers) {
      const matchingInv = ticketInventoryDocs.filter(inv => 
        inv.ticketNumber === tNum || inv.id.endsWith(`_${tNum}`) || inv.id.includes(tNum)
      );
      if (matchingInv.length > 0) {
        r.ticketInventoryRootDocs = matchingInv.map(m => ({
          id: m.id,
          ticketNumber: m.ticketNumber,
          status: m.status,
          bookingStatus: m.bookingStatus,
          bookedTicketId: m.bookedTicketId
        }));
      }
    }
  }

  // Output full detailed report JSON
  console.log('\n======================================================');
  console.log('AUDIT REPORT DETAILS (JSON FORMAT):');
  console.log('======================================================');
  console.log(JSON.stringify(auditResults, null, 2));

  // Write to scratch file for record
  fs.writeFileSync('scratch/production-audit-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    projectId,
    totalBookings: bookings.length,
    statusDistribution: summaryByStatus,
    inconsistentCount: inconsistentBookings.length,
    inconsistentRecords: auditResults,
    allBookingsRawPreview: bookings.map(b => ({
      id: b.id,
      ticketNumbers: b.tickets?.map(t => t.ticketNumber || t) || b.ticketNumber,
      paymentStatus: b.paymentStatus,
      bookingStatus: b.bookingStatus,
      totalAmount: b.totalAmount,
      amountPaid: b.amountPaid,
      remainingBalance: b.remainingBalance
    }))
  }, null, 2));

  console.log('\nAudit report written to scratch/production-audit-results.json');
}

main().catch(err => {
  console.error('[AUDIT ERROR]', err);
  process.exit(1);
});
