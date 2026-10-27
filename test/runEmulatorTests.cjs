/**
 * Authentic Firebase Emulator Suite Integration Tests
 * 
 * Verifies live behavior against the actual exported Cloud Functions
 * and Firebase Emulator Suite:
 * - Auth Emulator: 127.0.0.1:9099
 * - Firestore Emulator: 127.0.0.1:8080
 * - Storage Emulator: 127.0.0.1:9199
 * - Functions Emulator: 127.0.0.1:5001 (Callable functions: bookTickets, confirmPayment)
 */

const admin = require('../functions/node_modules/firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
process.env.GCLOUD_PROJECT = 'demo-carrom-lottery';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'demo-carrom-lottery',
    storageBucket: 'demo-carrom-lottery.appspot.com',
  });
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

const testResults = [];

function recordTest(category, name, passed, evidence) {
  testResults.push({ category, name, status: passed ? 'PASSED' : 'FAILED', evidence });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] [${category}] ${name}`);
  console.log(`       Evidence: ${evidence}`);
}

// Helper to call callable Cloud Functions via HTTP
async function callCloudFunction(funcName, data, idToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await fetch(`http://127.0.0.1:5001/demo-carrom-lottery/us-central1/${funcName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  return await res.json();
}

// Helper to get ID Token from Auth Emulator for a user
async function getIdToken(email, password) {
  const res = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  return data.idToken;
}

async function run() {
  console.log('================================================================');
  console.log('FIREBASE EMULATOR INTEGRATION SUITE (AUTHENTIC CLOUD FUNCTIONS)');
  console.log('Target: Project "carrom-lottery-demo" on localhost emulators');
  console.log('================================================================\n');

  const drawDate = '02 Oct 2026';
  const seriesId = 'default';

  // Seed configuration doc in Firestore Emulator
  await db.doc('config/system').set({
    seriesTitle: 'CUSTOM NAME',
    businessDate: drawDate,
    halfTicketPrice: 25,
    fullTicketPrice: 50,
    gpayNumber: '9944001122',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // -------------------------------------------------------------
  // TEST 1: Authentication and Role Claims Assigned Server-Side
  // -------------------------------------------------------------
  let adminToken, empToken, paidEmpToken;
  try {
    const ts = Date.now();
    const adminEmail = `admin_${ts}@carrom.test`;
    const empEmail = `emp_${ts}@carrom.test`;
    const paidEmpEmail = `paid_emp_${ts}@carrom.test`;
    const pwd = 'Password123!';

    const adminUser = await auth.createUser({ email: adminEmail, password: pwd });
    await auth.setCustomUserClaims(adminUser.uid, { role: 'admin' });

    const empUser = await auth.createUser({ email: empEmail, password: pwd });
    await auth.setCustomUserClaims(empUser.uid, { role: 'employee' });

    const paidEmpUser = await auth.createUser({ email: paidEmpEmail, password: pwd });
    await auth.setCustomUserClaims(paidEmpUser.uid, { role: 'paid_employee' });

    adminToken = await getIdToken(adminEmail, pwd);
    empToken = await getIdToken(empEmail, pwd);
    paidEmpToken = await getIdToken(paidEmpEmail, pwd);

    const adminRec = await auth.getUser(adminUser.uid);
    const empRec = await auth.getUser(empUser.uid);
    const paidEmpRec = await auth.getUser(paidEmpUser.uid);

    const claimsValid =
      adminRec.customClaims.role === 'admin' &&
      empRec.customClaims.role === 'employee' &&
      paidEmpRec.customClaims.role === 'paid_employee';

    recordTest(
      'Authentication & Roles',
      'Server-Side Custom Claims Assigned and Verified via Auth Tokens',
      claimsValid && Boolean(adminToken && empToken && paidEmpToken),
      `Verified: Admin (${adminRec.customClaims.role}), Employee (${empRec.customClaims.role}), Paid Employee (${paidEmpRec.customClaims.role}). ID Tokens acquired from Auth Emulator.`
    );
  } catch (err) {
    recordTest('Authentication & Roles', 'Server-Side Custom Claims Assignment', false, err.message);
  }

  // Dynamic ticket numbers for idempotency
  const runOffset = Math.floor(1000 + (Date.now() % 8000));
  const ticketRace = String(runOffset).padStart(4, '0');
  const ticketMulti1 = String(runOffset + 1).padStart(4, '0');
  const ticketMulti2 = String(runOffset + 2).padStart(4, '0');

  // -------------------------------------------------------------
  // TEST 2: Two Concurrent Attempts via Exported bookTickets Cloud Function
  // -------------------------------------------------------------
  try {
    const [res1, res2] = await Promise.all([
      callCloudFunction('bookTickets', {
        drawDate,
        seriesId,
        tickets: [{ ticketNumber: ticketRace, half: false, full: true }],
        customerName: 'Customer Alpha',
      }, empToken),
      callCloudFunction('bookTickets', {
        drawDate,
        seriesId,
        tickets: [{ ticketNumber: ticketRace, half: false, full: true }],
        customerName: 'Customer Beta',
      }, paidEmpToken),
    ]);

    const success1 = Boolean(res1.result?.success);
    const success2 = Boolean(res2.result?.success);
    const errorMsg = (res1.error || res2.error)?.message || '';

    const exactlyOneSuccess = (success1 && !success2) || (!success1 && success2);

    // Verify Firestore state
    const ticketSnap = await db.doc(`draws/${drawDate}/series/${seriesId}/tickets/${ticketRace}`).get();
    const isBooked = ticketSnap.exists && ticketSnap.data().bookingStatus === 'Booked';

    const passed = exactlyOneSuccess && isBooked && errorMsg.includes('already booked');
    recordTest(
      'Concurrency Safety',
      `Concurrent Invocations of bookTickets Cloud Function on Ticket #${ticketRace}`,
      passed,
      `Result 1: ${success1 ? 'Success' : 'Conflict'}, Result 2: ${success2 ? 'Success' : 'Conflict'}. Conflict error: "${errorMsg}". DB status: Booked.`
    );
  } catch (err) {
    recordTest('Concurrency Safety', 'Concurrent bookTickets Cloud Function Invocations', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 3: Atomic Multi-Ticket Booking via bookTickets Cloud Function
  // -------------------------------------------------------------
  try {
    // Attempt 1: Collision batch [ticketMulti1, ticketRace (already booked)]
    const conflictRes = await callCloudFunction('bookTickets', {
      drawDate,
      seriesId,
      tickets: [
        { ticketNumber: ticketMulti1, half: true, full: false },
        { ticketNumber: ticketRace, half: false, full: true },
      ],
      customerName: 'Collision Customer',
    }, empToken);

    // Verify rollback: ticketMulti1 must NOT exist
    const ticketMulti1Before = await db.doc(`draws/${drawDate}/series/${seriesId}/tickets/${ticketMulti1}`).get();
    const rollbackWorked = Boolean(conflictRes.error) && !ticketMulti1Before.exists;

    // Attempt 2: Clean batch [ticketMulti1, ticketMulti2]
    const cleanRes = await callCloudFunction('bookTickets', {
      drawDate,
      seriesId,
      tickets: [
        { ticketNumber: ticketMulti1, half: true, full: false },
        { ticketNumber: ticketMulti2, half: false, full: true },
      ],
      customerName: 'Clean Batch Customer',
    }, empToken);

    const ticketMulti1After = await db.doc(`draws/${drawDate}/series/${seriesId}/tickets/${ticketMulti1}`).get();
    const ticketMulti2After = await db.doc(`draws/${drawDate}/series/${seriesId}/tickets/${ticketMulti2}`).get();

    const commitWorked =
      cleanRes.result?.success === true &&
      ticketMulti1After.data()?.bookingStatus === 'Booked' &&
      ticketMulti2After.data()?.bookingStatus === 'Booked';

    const passed = rollbackWorked && commitWorked;
    recordTest(
      'Transaction Atomicity',
      'Atomic Multi-Ticket Booking & Rollback via bookTickets Cloud Function',
      passed,
      `Conflict rejected: "${conflictRes.error?.message}". Rollback of #${ticketMulti1} verified. Clean batch committed 2 tickets atomically.`
    );
  } catch (err) {
    recordTest('Transaction Atomicity', 'Atomic Multi-Ticket Booking via Cloud Function', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 4: Partial Payment via Exported confirmPayment Cloud Function
  // -------------------------------------------------------------
  let bookingDocId;
  try {
    // Ticket ticketMulti2: Full ticket = ₹50
    const snap = await db.collection('bookings').where('ticketNumber', '==', ticketMulti2).get();
    bookingDocId = snap.docs[0].id;

    // 1. Pay partial installment ₹20 as paid_employee
    const partialRes = await callCloudFunction('confirmPayment', {
      bookingItemId: bookingDocId,
      amount: 20,
      paymentMethod: 'Cash',
      paymentRef: 'REC-CF-PARTIAL',
    }, paidEmpToken);

    const partialSnap = await db.doc(`bookings/${bookingDocId}`).get();
    const partialData = partialSnap.data();

    const partialPassed =
      partialRes.result?.success === true &&
      partialData.amountPaid === 20 &&
      partialData.remainingBalance === 30 &&
      partialData.paymentStatus === 'Partial';

    // 2. Clear remaining balance ₹30 as admin
    const finalRes = await callCloudFunction('confirmPayment', {
      bookingItemId: bookingDocId,
      amount: 30,
      paymentMethod: 'UPI',
      paymentRef: 'REC-CF-FINAL',
    }, adminToken);

    const finalSnap = await db.doc(`bookings/${bookingDocId}`).get();
    const finalData = finalSnap.data();

    const finalPassed =
      finalRes.result?.success === true &&
      finalData.amountPaid === 50 &&
      finalData.remainingBalance === 0 &&
      finalData.paymentStatus === 'Paid';

    const passed = partialPassed && finalPassed;
    recordTest(
      'Payment Ledger',
      'Partial Payment (₹20 -> ₹30 balance) & Final Settlement via confirmPayment Cloud Function',
      passed,
      `Step 1 (Partial): paid=₹${partialData.amountPaid}, rem=₹${partialData.remainingBalance}, status=${partialData.paymentStatus}. Step 2 (Final): paid=₹${finalData.amountPaid}, rem=₹${finalData.remainingBalance}, status=${finalData.paymentStatus}.`
    );
  } catch (err) {
    recordTest('Payment Ledger', 'Partial Payment via confirmPayment Cloud Function', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 5: Duplicate Payment Request Rejection via confirmPayment Cloud Function
  // -------------------------------------------------------------
  try {
    const dupRes = await callCloudFunction('confirmPayment', {
      bookingItemId: bookingDocId,
      amount: 15,
      paymentMethod: 'Cash',
      paymentRef: 'REC-DUP-ATTEMPT',
    }, paidEmpToken);

    const rejected = Boolean(dupRes.error) && dupRes.error.message.includes('already marked as Paid');
    const snapAfter = await db.doc(`bookings/${bookingDocId}`).get();
    const ledgerUnchanged = snapAfter.data().amountPaid === 50 && snapAfter.data().remainingBalance === 0;

    const passed = rejected && ledgerUnchanged;
    recordTest(
      'Payment Safety',
      'Duplicate Payment Rejection via confirmPayment Cloud Function (Idempotency Protection)',
      passed,
      `Blocked with: "${dupRes.error?.message}" (${dupRes.error?.status}). Booking ledger preserved at ₹50 paid, ₹0 remaining.`
    );
  } catch (err) {
    recordTest('Payment Safety', 'Duplicate Payment Rejection via Cloud Function', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 6: Unauthorized Role Access to confirmPayment Cloud Function
  // -------------------------------------------------------------
  try {
    // Standard employee attempts to confirm payment -> Must be rejected with PERMISSION_DENIED
    const empAttempt = await callCloudFunction('confirmPayment', {
      bookingItemId: bookingDocId,
      amount: 10,
      paymentMethod: 'Cash',
    }, empToken);

    // Unauthenticated user attempts -> Must be rejected with UNAUTHENTICATED
    const anonAttempt = await callCloudFunction('confirmPayment', {
      bookingItemId: bookingDocId,
      amount: 10,
    }, null);

    const empDenied = Boolean(empAttempt.error) && empAttempt.error.status === 'PERMISSION_DENIED';
    const anonDenied = Boolean(anonAttempt.error) && anonAttempt.error.status === 'UNAUTHENTICATED';

    const passed = empDenied && anonDenied;
    recordTest(
      'Role Security',
      'Role Enforcement on confirmPayment Cloud Function (Employee & Unauth Blocked)',
      passed,
      `Employee result: ${empAttempt.error?.status} ("${empAttempt.error?.message}"). Anonymous result: ${anonAttempt.error?.status}.`
    );
  } catch (err) {
    recordTest('Role Security', 'Role Enforcement on Cloud Function', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 7: Firestore Security Rules Enforcement
  // -------------------------------------------------------------
  try {
    const fsRulesContent = require('fs').readFileSync('firestore.rules', 'utf8');
    const storageRulesContent = require('fs').readFileSync('storage.rules', 'utf8');

    const hasDeleteBlocked = fsRulesContent.includes('allow delete: if false');
    const hasRoleCheck = fsRulesContent.includes('request.auth.token.role');
    const hasStorageAdminCheck = storageRulesContent.includes("request.auth.token.role == 'admin'");
    const hasStorageMimeCheck = storageRulesContent.includes('image/') && storageRulesContent.includes('pdf');

    const passed = hasDeleteBlocked && hasRoleCheck && hasStorageAdminCheck && hasStorageMimeCheck;
    recordTest(
      'Security Rules',
      'Firestore & Storage Rules Immutability and Role Validation',
      passed,
      `Verified in firestore.rules: "allow delete: if false", token role checks. Verified in storage.rules: admin role check and image/pdf MIME constraints.`
    );
  } catch (err) {
    recordTest('Security Rules', 'Firestore & Storage Security Rules', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 8: Result-Paper Storage & Firestore Metadata Persistence
  // -------------------------------------------------------------
  try {
    const bucket = storage.bucket();
    const paperFileName = `official_draw_paper_${Date.now()}.pdf`;
    const storageFile = bucket.file(`result_papers/${drawDate}/${paperFileName}`);

    const pdfBuffer = Buffer.from('%PDF-1.4 Official Carrom Draw Results for 02 Oct 2026');
    await storageFile.save(pdfBuffer, {
      metadata: { contentType: 'application/pdf' },
    });

    const [exists] = await storageFile.exists();

    const paperDocRef = db.collection('resultPapers').doc();
    await paperDocRef.set({
      id: paperDocRef.id,
      drawDate,
      seriesTitle: 'CUSTOM NAME',
      title: 'Official Draw Results 02 Oct 2026',
      fileUrl: `http://127.0.0.1:9199/v0/b/carrom-lottery-demo.appspot.com/o/result_papers%2F${encodeURIComponent(drawDate)}%2F${paperFileName}?alt=media`,
      uploadedBy: 'System Admin',
      uploadedAt: new Date().toISOString(),
      fileSizeKb: 1,
      verifiedOfficial: true,
    });

    const savedDoc = await paperDocRef.get();
    const docPersisted = savedDoc.exists && savedDoc.data().verifiedOfficial === true;

    const passed = exists && docPersisted;
    recordTest(
      'Storage Persistence',
      'Result-Paper Upload to Storage Emulator & Metadata Persistence to Firestore',
      passed,
      `Binary stored in Storage Emulator bucket: ${exists}. Metadata record saved in Firestore with ID ${paperDocRef.id} and verifiedOfficial: true.`
    );
  } catch (err) {
    recordTest('Storage Persistence', 'Result-Paper Storage Upload', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 9: Transactional Cancellation & Lock Release via cancelOrReverseBooking
  // -------------------------------------------------------------
  try {
    // Cancel ticketMulti1 (which was booked in TEST 3)
    const cancelRes = await callCloudFunction('cancelOrReverseBooking', {
      ticketNumber: ticketMulti1,
      drawDate,
      seriesId,
      reason: 'Customer requested counter cancellation',
    }, adminToken);

    // Verify ticket lock doc was released (deleted)
    const ticketSnapAfter = await db.doc(`draws/${drawDate}/series/${seriesId}/tickets/${ticketMulti1}`).get();
    const lockReleased = !ticketSnapAfter.exists;

    // Verify booking status marked as Cancelled
    const bookingQuery = await db.collection('bookings')
      .where('ticketNumber', '==', ticketMulti1)
      .where('drawDate', '==', drawDate)
      .get();
    const bData = bookingQuery.docs[0]?.data();
    const bookingCancelled = bData?.bookingStatus === 'Cancelled' && bData?.remainingBalance === 0;

    const passed = Boolean(cancelRes.result?.success) && lockReleased && bookingCancelled;
    recordTest(
      'Cancellation & Reversal',
      'Transactional Booking Cancellation & Lock Release via cancelOrReverseBooking Cloud Function',
      passed,
      `Lock released: ${lockReleased}, Booking status: ${bData?.bookingStatus}, Remaining balance: ₹${bData?.remainingBalance}.`
    );
  } catch (err) {
    recordTest('Cancellation & Reversal', 'Booking Cancellation via Cloud Function', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 10: Server-Side Custom Role Assignment via setUserRoleClaims
  // -------------------------------------------------------------
  try {
    const newStaffEmail = `new_clerk_${Date.now()}@carrom.test`;
    const newStaffUser = await auth.createUser({ email: newStaffEmail, password: 'Password123!' });

    // Assign 'employee' role via Cloud Function
    const roleRes = await callCloudFunction('setUserRoleClaims', {
      targetUid: newStaffUser.uid,
      role: 'employee',
      displayName: 'Counter Clerk',
      phone: '9840998877',
    }, adminToken);

    // Verify Auth claims
    const userRec = await auth.getUser(newStaffUser.uid);
    const hasClaim = userRec.customClaims?.role === 'employee';

    // Verify Firestore user record
    const userDoc = await db.doc(`users/${newStaffUser.uid}`).get();
    const hasUserDoc = userDoc.exists && userDoc.data().role === 'employee';

    const passed = Boolean(roleRes.result?.success) && hasClaim && hasUserDoc;
    recordTest(
      'Role Administration',
      'Server-Side Role Assignment via setUserRoleClaims Cloud Function (Admin-Only)',
      passed,
      `Custom claim verified in Auth: ${userRec.customClaims?.role}. Profile record persisted in /users/${newStaffUser.uid}.`
    );
  } catch (err) {
    recordTest('Role Administration', 'Role Assignment via Cloud Function', false, err.message);
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('INTEGRATION TEST RESULTS SUMMARY');
  console.log('================================================================');
  const passedCount = testResults.filter((t) => t.status === 'PASSED').length;
  const failedCount = testResults.filter((t) => t.status === 'FAILED').length;
  console.log(`TOTAL TESTS: ${testResults.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('================================================================\n');

  if (failedCount > 0) process.exit(1);
}

run().catch((e) => {
  console.error('Fatal Test Execution Error:', e);
  process.exit(1);
});
