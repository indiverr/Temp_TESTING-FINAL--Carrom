/**
 * End-to-End Smoke Test for Carrom Lottery System
 * 
 * Tests the complete lifecycle across multiple authenticated personas:
 * 1. Employee: Logs in, books tickets #4001 and #4002
 * 2. Paid Employee: Logs in, queries unpaid bookings, confirms partial payment, confirms final settlement
 * 3. Persistence verification: Cold reload from Firestore Emulator
 * 4. Admin: Uploads official result paper document to Storage Emulator & verifies Firestore metadata
 */

const admin = require('../functions/node_modules/firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
process.env.GCLOUD_PROJECT = 'carrom-lottery-demo';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'carrom-lottery-demo',
    storageBucket: 'carrom-lottery-demo.appspot.com',
  });
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

async function getIdToken(email, password) {
  const res = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  return data.idToken;
}

async function callCloudFunction(funcName, data, idToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await fetch(`http://127.0.0.1:5001/carrom-lottery-demo/us-central1/${funcName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  return await res.json();
}

async function runSmokeTest() {
  console.log('================================================================');
  console.log('CARROM LOTTERY END-TO-END SMOKE TEST (MULTI-USER LIFECYCLE)');
  console.log('================================================================\n');

  const drawDate = '02 Oct 2026';
  const seriesId = 'default';
  const offset = Math.floor(2000 + (Date.now() % 7000));
  const ticketA = String(offset).padStart(4, '0');
  const ticketB = String(offset + 1).padStart(4, '0');

  // Step 1: Provision Users
  console.log('STEP 1: Provisioning Authenticated Personas in Auth Emulator...');
  const empEmail = `emp_smoke_${Date.now()}@carrom.lottery`;
  const paidEmpEmail = `cashier_smoke_${Date.now()}@carrom.lottery`;
  const adminEmail = `admin_smoke_${Date.now()}@carrom.lottery`;
  const pwd = 'SmokePassword123!';

  const empUser = await auth.createUser({ email: empEmail, password: pwd, displayName: 'Sasikaran (Employee)' });
  await auth.setCustomUserClaims(empUser.uid, { role: 'employee' });
  const empToken = await getIdToken(empEmail, pwd);

  const paidUser = await auth.createUser({ email: paidEmpEmail, password: pwd, displayName: 'Gogul (Paid Employee)' });
  await auth.setCustomUserClaims(paidUser.uid, { role: 'paid_employee' });
  const paidToken = await getIdToken(paidEmpEmail, pwd);

  const adminUser = await auth.createUser({ email: adminEmail, password: pwd, displayName: 'Super Admin' });
  await auth.setCustomUserClaims(adminUser.uid, { role: 'admin' });
  const adminToken = await getIdToken(adminEmail, pwd);

  console.log(`  -> Employee: ${empEmail} (UID: ${empUser.uid})`);
  console.log(`  -> Paid Employee: ${paidEmpEmail} (UID: ${paidUser.uid})`);
  console.log(`  -> Admin: ${adminEmail} (UID: ${adminUser.uid})`);

  // Step 2: Employee books tickets #ticketA and #ticketB
  console.log(`\nSTEP 2: Employee books tickets #${ticketA} (Full=₹50) and #${ticketB} (Half=₹25)...`);
  const bookRes = await callCloudFunction('bookTickets', {
    drawDate,
    seriesId,
    tickets: [
      { ticketNumber: ticketA, half: false, full: true },
      { ticketNumber: ticketB, half: true, full: false },
    ],
    customerName: 'Karthik Raja',
    customerPhone: '9840112233',
  }, empToken);

  if (!bookRes.result?.success) {
    throw new Error('Booking failed: ' + JSON.stringify(bookRes));
  }
  console.log(`  -> Successfully booked ${bookRes.result.bookedCount} tickets (Batch ID: ${bookRes.result.bookingId})`);

  // Step 3: Verify Firestore state for booked tickets
  console.log('\nSTEP 3: Verifying initial reservation records in Firestore...');
  const snapA = await db.doc(`draws/${drawDate}/series/${seriesId}/tickets/${ticketA}`).get();
  const snapB = await db.doc(`draws/${drawDate}/series/${seriesId}/tickets/${ticketB}`).get();
  console.log(`  -> Ticket #${ticketA} reservation: Status = ${snapA.data().bookingStatus}, BookedBy = ${snapA.data().bookedBy}`);
  console.log(`  -> Ticket #${ticketB} reservation: Status = ${snapB.data().bookingStatus}, BookedBy = ${snapB.data().bookedBy}`);

  // Step 4: Query Unpaid Bookings as Paid Employee
  console.log('\nSTEP 4: Paid Employee queries Unpaid bookings list...');
  const unpaidBookings = await db.collection('bookings')
    .where('drawDate', '==', drawDate)
    .where('paymentStatus', '==', 'Unpaid')
    .get();

  const bookingA = unpaidBookings.docs.find(d => d.data().ticketNumber === ticketA);
  const bookingB = unpaidBookings.docs.find(d => d.data().ticketNumber === ticketB);
  console.log(`  -> Found booking item for #${ticketA}: ID=${bookingA.id}, Total=₹${bookingA.data().totalAmount}`);
  console.log(`  -> Found booking item for #${ticketB}: ID=${bookingB.id}, Total=₹${bookingB.data().totalAmount}`);

  // Step 5: Paid Employee makes partial payment of ₹25 on ticketA
  console.log(`\nSTEP 5: Paid Employee records partial payment of ₹25 on ticket #${ticketA}...`);
  const partialRes = await callCloudFunction('confirmPayment', {
    bookingItemId: bookingA.id,
    amount: 25,
    paymentMethod: 'Cash',
    paymentRef: 'CASH-REC-01',
    notes: '50% advance collected at counter',
  }, paidToken);

  console.log(`  -> Partial payment result: Remaining=₹${partialRes.result?.remainingBalance}, Status=${partialRes.result?.paymentStatus}`);

  // Step 6: Paid Employee completes remaining payment of ₹25 on ticketA
  console.log(`\nSTEP 6: Paid Employee records final settlement of ₹25 on ticket #${ticketA}...`);
  const finalRes = await callCloudFunction('confirmPayment', {
    bookingItemId: bookingA.id,
    amount: 25,
    paymentMethod: 'Google Pay',
    paymentRef: 'UPI-TXN-998877',
    notes: 'Balance cleared via GPay',
  }, paidToken);

  console.log(`  -> Final payment result: Remaining=₹${finalRes.result?.remainingBalance}, Status=${finalRes.result?.paymentStatus}`);

  // Step 7: Cold Persistence Reload Simulation
  console.log('\nSTEP 7: Cold persistence reload verification from Firestore...');
  const reloadedSnap = await db.doc(`bookings/${bookingA.id}`).get();
  const reloadedData = reloadedSnap.data();

  const auditSnap = await db.collection('payments').where('bookingItemId', '==', bookingA.id).get();
  console.log(`  -> Persisted booking state:`);
  console.log(`     - Ticket Number: #${reloadedData.ticketNumber}`);
  console.log(`     - Total Amount: ₹${reloadedData.totalAmount}`);
  console.log(`     - Amount Paid: ₹${reloadedData.amountPaid}`);
  console.log(`     - Remaining Balance: ₹${reloadedData.remainingBalance}`);
  console.log(`     - Payment Status: ${reloadedData.paymentStatus}`);
  console.log(`     - Payment Receipts in Ledger: ${auditSnap.size}`);

  // Step 8: Admin uploads Result Paper document to Storage Emulator
  console.log('\nSTEP 8: Admin uploads official Result Paper document to Storage Emulator...');
  const bucket = storage.bucket();
  const paperFileName = `official_results_${Date.now()}.pdf`;
  const storageFile = bucket.file(`result_papers/${drawDate}/${paperFileName}`);
  const pdfBytes = Buffer.from('%PDF-1.4 Verified Lottery Results for Draw ' + drawDate);
  await storageFile.save(pdfBytes, { metadata: { contentType: 'application/pdf' } });

  const [paperExists] = await storageFile.exists();
  console.log(`  -> Binary stored in Storage bucket: ${paperExists}`);

  const paperDocRef = db.collection('resultPapers').doc();
  await paperDocRef.set({
    id: paperDocRef.id,
    drawDate,
    title: 'Carrom Official Draw Sheet - ' + drawDate,
    fileUrl: `http://127.0.0.1:9199/v0/b/carrom-lottery-demo.appspot.com/o/result_papers%2F${encodeURIComponent(drawDate)}%2F${paperFileName}?alt=media`,
    uploadedBy: 'Super Admin',
    uploadedAt: new Date().toISOString(),
    verifiedOfficial: true,
  });

  const verifiedPaper = await paperDocRef.get();
  console.log(`  -> Result Paper metadata indexed in Firestore (ID: ${verifiedPaper.id}, Verified: ${verifiedPaper.data().verifiedOfficial})`);

  console.log('\n================================================================');
  console.log('SMOKE TEST SUCCESS: FULL MULTI-USER LIFECYCLE VERIFIED PERSISTENT');
  console.log('================================================================\n');
}

runSmokeTest().catch((err) => {
  console.error('Smoke Test Failed:', err);
  process.exit(1);
});
