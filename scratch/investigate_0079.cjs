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

async function main() {
  const token = await getAccessToken();
  const projectId = 'carrom-df56a';

  console.log('=== INVESTIGATING TICKET 0079 & ALL BOOKINGS IN carrom-df56a ===\n');

  // 1. Fetch all bookings
  const bookings = await fetchAllDocuments(token, projectId, 'bookings');
  console.log(`Total documents in /bookings: ${bookings.length}`);
  bookings.forEach(b => {
    console.log(`Booking ID: ${b.id}`);
    console.log(`  ticketNumber: ${b.ticketNumber}, date: ${b.date}, drawDate: ${b.drawDate}`);
    console.log(`  bookingStatus: ${b.bookingStatus}, paymentStatus: ${b.paymentStatus}`);
    console.log(`  bookedBy: ${b.bookedBy}, bookedByRole: ${b.bookedByRole}, bookedByUid: ${b.bookedByUid}`);
    console.log(`  ticketType: ${b.ticketType}, halfSelected: ${b.halfSelected}, fullSelected: ${b.fullSelected}`);
    console.log(`  totalAmount: ${b.totalAmount}, amountPaid: ${b.amountPaid}, remainingBalance: ${b.remainingBalance}`);
    console.log(`  customerId: ${b.customerId}, customerName: ${b.customerName}`);
    console.log('---');
  });

  // 2. Fetch ticket 0079 specifically in draws
  console.log('\n--- Checking draws/02 Oct 2026/series/default/tickets/0079 ---');
  const ticket0079 = await fetchSingleDoc(token, projectId, 'draws/02%20Oct%202026/series/default/tickets/0079');
  console.log('ticket 0079 in draws:', JSON.stringify(ticket0079, null, 2));

  // 3. Fetch ticketLocks
  console.log('\n--- Checking ticketLocks ---');
  const locks = await fetchAllDocuments(token, projectId, 'ticketLocks');
  console.log(`Total locks: ${locks.length}`);
  locks.forEach(l => console.log('Lock:', JSON.stringify(l, null, 2)));

  // 4. Fetch ticketInventory
  console.log('\n--- Checking ticketInventory for 0079 ---');
  const inv0079 = await fetchSingleDoc(token, projectId, 'ticketInventory/0079');
  console.log('ticketInventory/0079:', JSON.stringify(inv0079, null, 2));

  // 5. Check draws/02 Oct 2026/series/default/tickets all
  console.log('\n--- Checking all tickets in draws/02 Oct 2026/series/default/tickets ---');
  const drawTickets = await fetchAllDocuments(token, projectId, 'draws/02%20Oct%202026/series/default/tickets');
  console.log(`Total draw tickets count: ${drawTickets.length}`);
  const nonAvailable = drawTickets.filter(t => t.bookingStatus !== 'Available' || t.status !== 'Available');
  console.log(`Non-available draw tickets: ${nonAvailable.length}`);
  nonAvailable.forEach(t => console.log(`  Ticket #${t.ticketNumber}: bookingStatus=${t.bookingStatus}, status=${t.status}, customerId=${t.customerId}, bookedBy=${t.bookedBy}`));
}

main().catch(console.error);
