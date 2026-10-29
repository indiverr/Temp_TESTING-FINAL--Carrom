const fs = require('fs');
const path = require('path');
const https = require('https');

async function getAccessToken() {
  const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(raw);
  return config.tokens?.access_token;
}

function httpsRequest(options, postData = null) {
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
    if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
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
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(decodeFirestoreValue);
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
  return { id, path: doc.name, rawFields: doc.fields, ...fields };
}

async function getDoc(token, projectId, docPath) {
  const options = {
    hostname: 'firestore.googleapis.com',
    port: 443,
    path: `/v1/projects/${projectId}/databases/(default)/documents/${encodeURI(docPath)}`,
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

async function patchDoc(token, projectId, docPath, fieldsToUpdate, updateMaskKeys) {
  const queryParams = updateMaskKeys.map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const path = `/v1/projects/${projectId}/databases/(default)/documents/${encodeURI(docPath)}?${queryParams}`;
  const options = {
    hostname: 'firestore.googleapis.com',
    port: 443,
    path,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  const firestoreFields = {};
  for (const [k, v] of Object.entries(fieldsToUpdate)) {
    if (typeof v === 'string') firestoreFields[k] = { stringValue: v };
    else if (typeof v === 'number') firestoreFields[k] = { integerValue: String(v) };
    else if (typeof v === 'boolean') firestoreFields[k] = { booleanValue: v };
  }

  const res = await httpsRequest(options, { fields: firestoreFields });
  return res;
}

const TARGETS = [
  {
    bookingId: 'booking_02_Oct_2026_0098',
    ticketNumber: '0098',
    paymentDocId: 'pay_pq_booking_02_Oct_2026_0098_REC-160910',
    expectedReceipt: 'REC-160910',
    canonicalInvId: '02 Oct 2026_c0_0098',
    companionInvId: '02_Oct_2026_default_0098',
    subTicketPath: 'draws/02 Oct 2026/series/default/tickets/0098'
  },
  {
    bookingId: 'booking_02_Oct_2026_0099',
    ticketNumber: '0099',
    paymentDocId: 'pay_pq_booking_02_Oct_2026_0099_REC-556317',
    expectedReceipt: 'REC-556317',
    canonicalInvId: '02 Oct 2026_c0_0099',
    companionInvId: '02_Oct_2026_default_0099',
    subTicketPath: 'draws/02 Oct 2026/series/default/tickets/0099'
  },
  {
    bookingId: 'booking_02_Oct_2026_0105',
    ticketNumber: '0105',
    paymentDocId: 'pay_pq_booking_02_Oct_2026_0105_REC-104989',
    expectedReceipt: 'REC-104989',
    canonicalInvId: '02 Oct 2026_c0_0105',
    companionInvId: '02_Oct_2026_default_0105',
    subTicketPath: 'draws/02 Oct 2026/series/default/tickets/0105'
  }
];

async function main() {
  const projectId = 'carrom-df56a';
  const executeReconciliation = process.argv.includes('--execute');
  console.log(`======================================================`);
  console.log(`CARROM PRODUCTION RECONCILIATION (${executeReconciliation ? 'EXECUTION MODE' : 'VERIFICATION / DRY-RUN MODE'})`);
  console.log(`======================================================\n`);

  const token = await getAccessToken();

  // Phase 1: Re-read and independently verify all 3 bookings and payments
  console.log('--- PHASE 1: PRE-RECONCILIATION VERIFICATION ---');
  let allPreconditionsMet = true;
  const verifiedRecords = [];

  for (const t of TARGETS) {
    console.log(`\nVerifying Booking ${t.bookingId} (Ticket #${t.ticketNumber})...`);
    const booking = await getDoc(token, projectId, `bookings/${t.bookingId}`);
    if (!booking) {
      console.error(`  [FAIL] Booking doc ${t.bookingId} not found!`);
      allPreconditionsMet = false;
      continue;
    }

    const payment = await getDoc(token, projectId, `payments/${t.paymentDocId}`);
    if (!payment) {
      console.error(`  [FAIL] Payment doc ${t.paymentDocId} not found!`);
      allPreconditionsMet = false;
      continue;
    }

    const canonicalInv = await getDoc(token, projectId, `ticketInventory/${t.canonicalInvId}`);
    if (!canonicalInv) {
      console.error(`  [FAIL] Canonical inventory doc ${t.canonicalInvId} not found!`);
      allPreconditionsMet = false;
      continue;
    }

    const companionInv = await getDoc(token, projectId, `ticketInventory/${t.companionInvId}`);
    const subTicket = await getDoc(token, projectId, t.subTicketPath);

    // Verify conditions:
    const checks = [
      { name: 'booking.paymentStatus === "Paid"', pass: booking.paymentStatus === 'Paid', val: booking.paymentStatus },
      { name: 'booking.bookingStatus === "Pending Confirmation"', pass: booking.bookingStatus === 'Pending Confirmation', val: booking.bookingStatus },
      { name: 'booking.amountPaid === 50', pass: booking.amountPaid === 50, val: booking.amountPaid },
      { name: 'booking.totalAmount === 50', pass: booking.totalAmount === 50, val: booking.totalAmount },
      { name: 'booking.remainingBalance === 0', pass: booking.remainingBalance === 0, val: booking.remainingBalance },
      { name: 'payment.paymentStatus === "Paid"', pass: payment.paymentStatus === 'Paid', val: payment.paymentStatus },
      { name: 'payment.amount === 50', pass: payment.amount === 50, val: payment.amount },
      { name: `payment.paymentRef === "${t.expectedReceipt}"`, pass: payment.paymentRef === t.expectedReceipt, val: payment.paymentRef },
      { name: 'canonicalInv.status === "PUBLISHED"', pass: canonicalInv.status === 'PUBLISHED', val: canonicalInv.status },
      { name: 'canonicalInv.bookingStatus === "Available"', pass: canonicalInv.bookingStatus === 'Available', val: canonicalInv.bookingStatus }
    ];

    let tPass = true;
    for (const c of checks) {
      if (c.pass) {
        console.log(`  [OK] ${c.name} -> (Value: ${JSON.stringify(c.val)})`);
      } else {
        console.error(`  [FAIL] ${c.name} -> (Expected pass, got: ${JSON.stringify(c.val)})`);
        tPass = false;
        allPreconditionsMet = false;
      }
    }

    if (tPass) {
      verifiedRecords.push({
        target: t,
        booking,
        payment,
        canonicalInv,
        companionInv,
        subTicket
      });
    }
  }

  console.log(`\nPreconditions check result: ${allPreconditionsMet ? 'ALL 3 TARGETS 100% VERIFIED' : 'FAILED CHECKS FOUND'}`);
  if (!allPreconditionsMet) {
    console.error('Halting. Not all preconditions met.');
    process.exit(1);
  }

  // Phase 2: Execution (if --execute flag passed)
  if (!executeReconciliation) {
    console.log('\n[DRY RUN COMPLETE] To execute the guarded reconciliation, run with --execute');
    return;
  }

  console.log('\n--- PHASE 2: EXECUTING GUARDED RECONCILIATION ---');
  const auditLog = [];

  for (const rec of verifiedRecords) {
    const t = rec.target;
    console.log(`\nReconciling Ticket #${t.ticketNumber} (Booking ${t.bookingId})...`);

    // 1. Reconcile Booking doc: update bookingStatus to 'Booked'
    console.log(`  1) Updating /bookings/${t.bookingId} bookingStatus -> 'Booked'...`);
    const bRes = await patchDoc(token, projectId, `bookings/${t.bookingId}`, {
      bookingStatus: 'Booked'
    }, ['bookingStatus']);
    if (bRes.status !== 200) {
      throw new Error(`Failed to update booking ${t.bookingId}: ${JSON.stringify(bRes)}`);
    }
    auditLog.push({
      doc: `bookings/${t.bookingId}`,
      field: 'bookingStatus',
      oldValue: 'Pending Confirmation',
      newValue: 'Booked',
      httpStatus: bRes.status
    });

    // 2. Reconcile Canonical Inventory doc: update bookingStatus to 'Booked' and bookedTicketId
    console.log(`  2) Updating /ticketInventory/${t.canonicalInvId} bookingStatus -> 'Booked', bookedTicketId -> '${t.bookingId}'...`);
    const invRes = await patchDoc(token, projectId, `ticketInventory/${t.canonicalInvId}`, {
      bookingStatus: 'Booked',
      bookedTicketId: t.bookingId
    }, ['bookingStatus', 'bookedTicketId']);
    if (invRes.status !== 200) {
      throw new Error(`Failed to update canonical inventory ${t.canonicalInvId}: ${JSON.stringify(invRes)}`);
    }
    auditLog.push({
      doc: `ticketInventory/${t.canonicalInvId}`,
      fields: {
        bookingStatus: { oldValue: 'Available', newValue: 'Booked' },
        bookedTicketId: { oldValue: rec.canonicalInv.bookedTicketId || null, newValue: t.bookingId }
      },
      httpStatus: invRes.status
    });

    // 3. Reconcile Companion Inventory doc (if exists): update bookingStatus to 'Booked'
    if (rec.companionInv) {
      console.log(`  3) Updating /ticketInventory/${t.companionInvId} bookingStatus -> 'Booked'...`);
      const compRes = await patchDoc(token, projectId, `ticketInventory/${t.companionInvId}`, {
        bookingStatus: 'Booked'
      }, ['bookingStatus']);
      auditLog.push({
        doc: `ticketInventory/${t.companionInvId}`,
        field: 'bookingStatus',
        oldValue: 'Pending Confirmation',
        newValue: 'Booked',
        httpStatus: compRes.status
      });
    }

    // 4. Reconcile Subcollection Ticket doc: update bookingStatus to 'Booked'
    if (rec.subTicket) {
      console.log(`  4) Updating /${t.subTicketPath} bookingStatus -> 'Booked'...`);
      const subRes = await patchDoc(token, projectId, t.subTicketPath, {
        bookingStatus: 'Booked'
      }, ['bookingStatus']);
      auditLog.push({
        doc: t.subTicketPath,
        field: 'bookingStatus',
        oldValue: 'Pending Confirmation',
        newValue: 'Booked',
        httpStatus: subRes.status
      });
    }
  }

  console.log('\n--- PHASE 3: RECONCILIATION AUDIT LOG ---');
  console.log(JSON.stringify(auditLog, null, 2));

  fs.writeFileSync('scratch/production-reconciliation-audit.json', JSON.stringify({
    reconciledAt: new Date().toISOString(),
    projectId,
    auditLog
  }, null, 2));

  console.log('\nReconciliation completed successfully. Audit log saved to scratch/production-reconciliation-audit.json');
}

main().catch(err => {
  console.error('[RECONCILIATION ERROR]', err);
  process.exit(1);
});
