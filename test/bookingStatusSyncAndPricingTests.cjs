/**
 * Carrom Lottery Desk — Booking Status Synchronization & Pricing Test Suite
 *
 * Covers all 10 required scenarios:
 * 1. Employee submits booking -> Admin Pending list updates.
 * 2. Pending booking confirmed according to defined confirmation rule.
 * 3. Full payment recorded successfully -> booking becomes Confirmed.
 * 4. Partial payment does not incorrectly become Paid in Full.
 * 5. Dashboard counts match underlying bookings.
 * 6. Employee and Admin views show same booking status.
 * 7. Half Set total is ₹300.
 * 8. Full Set total is ₹570.
 * 9. Combined Half Set + Full Set total is ₹870.
 * 10. Duplicate submissions and repeated payment actions do not create duplicate records.
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Dynamically bundle lotteryService in-memory for testing
const esbuild = require('esbuild');
const bundled = esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, '../lottery-app/src/lottery/lotteryService.ts')],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  external: ['firebase/auth', 'firebase/firestore', 'firebase/app'],
});
const code = bundled.outputFiles[0].text;
const mod = { exports: {} };
const wrapped = new Function('module', 'exports', 'require', '__dirname', '__filename', code);
wrapped(mod, mod.exports, require, __dirname, path.resolve(__dirname, 'bundleLotteryService.cjs'));
const { lotteryService, DEFAULT_CONFIG } = mod.exports;

const testResults = [];
function recordTest(testNumber, name, passed, detail) {
  testResults.push({ testNumber, name, passed, detail });
  const tag = passed ? '[PASS]' : '[FAIL]';
  console.log(`${tag} Test ${testNumber}: ${name} — ${detail}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('CARROM LOTTERY DESK — BOOKING STATUS SYNC & PRICING TEST SUITE');
  console.log('================================================================\n');

  const drawDate = '29 Oct 2026';
  const seriesId = 'col-1';

  // Seed clean environment state with updated authoritative pricing: Half ₹300, Full ₹570
  lotteryService.updateConfig(
    {
      businessDate: drawDate,
      seriesTitle: 'CARROM GOLD',
      halfTicketPrice: 300,
      fullTicketPrice: 570,
    },
    'admin'
  );

  // Publish 100 tickets (0001 to 0100)
  const initialTicketNumbers = [];
  for (let i = 1; i <= 100; i++) {
    initialTicketNumbers.push(String(i).padStart(4, '0'));
  }
  lotteryService.addTicketInventory(
    initialTicketNumbers,
    drawDate,
    seriesId,
    'CARROM GOLD',
    'PUBLISHED',
    { id: 'ADM001', name: 'Super Admin', role: 'admin' }
  );

  // -------------------------------------------------------------
  // Test 7: Half Set total is ₹300
  // -------------------------------------------------------------
  const t7HalfOnly = lotteryService.bookTicketsTransaction(
    [{ ticketNumber: '0001', half: true, full: false }],
    'Ramesh Kumar',
    '9876543210',
    'Sasikaran',
    'employee',
    drawDate,
    { lockedByUid: 'EMP001', idempotencyKey: 'idem_test_7' }
  );
  const b7 = t7HalfOnly.bookings && t7HalfOnly.bookings[0];
  const t7Passed =
    t7HalfOnly.success === true &&
    b7 &&
    b7.halfSelected === true &&
    b7.fullSelected === false &&
    b7.halfAmount === 300 &&
    b7.fullAmount === 0 &&
    b7.totalAmount === 300 &&
    b7.remainingBalance === 300;
  recordTest(
    7,
    'Half Set total is ₹300',
    t7Passed,
    `Booking for #0001: halfSelected=${b7?.halfSelected}, halfAmount=₹${b7?.halfAmount}, totalAmount=₹${b7?.totalAmount}, remainingBalance=₹${b7?.remainingBalance}`
  );

  // -------------------------------------------------------------
  // Test 8: Full Set total is ₹570
  // -------------------------------------------------------------
  const t8FullOnly = lotteryService.bookTicketsTransaction(
    [{ ticketNumber: '0002', half: false, full: true }],
    'Priya Sharma',
    '9876543211',
    'Sasikaran',
    'employee',
    drawDate,
    { lockedByUid: 'EMP001', idempotencyKey: 'idem_test_8' }
  );
  const b8 = t8FullOnly.bookings && t8FullOnly.bookings[0];
  const t8Passed =
    t8FullOnly.success === true &&
    b8 &&
    b8.halfSelected === false &&
    b8.fullSelected === true &&
    b8.halfAmount === 0 &&
    b8.fullAmount === 570 &&
    b8.totalAmount === 570 &&
    b8.remainingBalance === 570;
  recordTest(
    8,
    'Full Set total is ₹570',
    t8Passed,
    `Booking for #0002: fullSelected=${b8?.fullSelected}, fullAmount=₹${b8?.fullAmount}, totalAmount=₹${b8?.totalAmount}, remainingBalance=₹${b8?.remainingBalance}`
  );

  // -------------------------------------------------------------
  // Test 9: Combined Half Set + Full Set total is ₹870
  // -------------------------------------------------------------
  const t9Both = lotteryService.bookTicketsTransaction(
    [{ ticketNumber: '0003', half: true, full: true }],
    'Karthik Raja',
    '9876543212',
    'Sasikaran',
    'employee',
    drawDate,
    { lockedByUid: 'EMP001', idempotencyKey: 'idem_test_9' }
  );
  const b9 = t9Both.bookings && t9Both.bookings[0];
  const t9Passed =
    t9Both.success === true &&
    b9 &&
    b9.halfSelected === true &&
    b9.fullSelected === true &&
    b9.ticketType === 'both' &&
    b9.halfAmount === 300 &&
    b9.fullAmount === 570 &&
    b9.totalAmount === 870 &&
    b9.remainingBalance === 870;
  recordTest(
    9,
    'Combined Half Set + Full Set total is ₹870',
    t9Passed,
    `Booking for #0003: ticketType="${b9?.ticketType}", halfAmount=₹${b9?.halfAmount}, fullAmount=₹${b9?.fullAmount}, totalAmount=₹${b9?.totalAmount}, remainingBalance=₹${b9?.remainingBalance}`
  );

  // -------------------------------------------------------------
  // Test 1: Employee submits booking -> Admin Pending list updates
  // -------------------------------------------------------------
  // Employee submits booking for ticket 0004
  const t1Res = lotteryService.bookTicketsTransaction(
    [{ ticketNumber: '0004', half: true, full: true }],
    'Anbu Selvan',
    '9845112233',
    'Sasikaran',
    'employee',
    drawDate,
    { lockedByUid: 'EMP001', idempotencyKey: 'idem_test_1' }
  );
  const allBookingsAfterT1 = lotteryService.getBookings(drawDate);
  const pendingList = allBookingsAfterT1.filter((b) => b.bookingStatus === 'Pending Confirmation');
  const confirmedList = allBookingsAfterT1.filter((b) => b.bookingStatus === 'Booked');
  const booking0004 = allBookingsAfterT1.find((b) => b.ticketNumber === '0004');
  const t1Passed =
    t1Res.success === true &&
    booking0004 &&
    booking0004.bookingStatus === 'Pending Confirmation' &&
    pendingList.some((b) => b.ticketNumber === '0004') &&
    !confirmedList.some((b) => b.ticketNumber === '0004');
  recordTest(
    1,
    'Employee submits booking -> Admin Pending list updates',
    t1Passed,
    `Ticket #0004 bookingStatus="${booking0004?.bookingStatus}", present in pendingList (${pendingList.length} items), absent from confirmedList`
  );

  // -------------------------------------------------------------
  // Test 2: Pending booking confirmed according to defined confirmation rule
  // -------------------------------------------------------------
  // Admin confirms booking #0004
  const t2Confirm = lotteryService.confirmPendingBooking(booking0004.id, {
    id: 'ADM001',
    name: 'Super Admin',
    role: 'admin',
  });
  const allBookingsAfterT2 = lotteryService.getBookings(drawDate);
  const pendingListAfterT2 = allBookingsAfterT2.filter((b) => b.bookingStatus === 'Pending Confirmation');
  const confirmedListAfterT2 = allBookingsAfterT2.filter((b) => b.bookingStatus === 'Booked');
  const booking0004AfterT2 = allBookingsAfterT2.find((b) => b.ticketNumber === '0004');
  const t2Passed =
    t2Confirm.success === true &&
    booking0004AfterT2 &&
    booking0004AfterT2.bookingStatus === 'Booked' &&
    confirmedListAfterT2.some((b) => b.ticketNumber === '0004') &&
    !pendingListAfterT2.some((b) => b.ticketNumber === '0004');
  recordTest(
    2,
    'Pending booking confirmed according to defined confirmation rule',
    t2Passed,
    `Admin confirmed #0004: bookingStatus transitioned to "${booking0004AfterT2?.bookingStatus}", moved to Confirmed list, removed from Pending list`
  );

  // -------------------------------------------------------------
  // Test 4: Partial payment does not incorrectly become Paid in Full
  // -------------------------------------------------------------
  // Ticket #0003 has totalAmount ₹870. Pay partial ₹400.
  const t4Pay = lotteryService.confirmPaymentTransaction(
    '0003',
    drawDate,
    400,
    'Cash',
    'PARTIAL-REF-01',
    'Super Admin',
    'admin',
    'Customer made partial advance payment'
  );
  const allBookingsAfterT4 = lotteryService.getBookings(drawDate);
  const booking0003 = allBookingsAfterT4.find((b) => b.ticketNumber === '0003');
  const paidInFullListT4 = allBookingsAfterT4.filter(
    (b) => b.paymentStatus === 'Paid' && (b.remainingBalance === 0 || b.amountPaid >= b.totalAmount)
  );
  const t4Passed =
    t4Pay.success === true &&
    booking0003 &&
    booking0003.amountPaid === 400 &&
    booking0003.remainingBalance === 470 &&
    booking0003.paymentStatus === 'Partial' &&
    !paidInFullListT4.some((b) => b.ticketNumber === '0003');
  recordTest(
    4,
    'Partial payment does not incorrectly become Paid in Full',
    t4Passed,
    `Ticket #0003: amountPaid=₹${booking0003?.amountPaid}, remainingBalance=₹${booking0003?.remainingBalance}, paymentStatus="${booking0003?.paymentStatus}", excluded from Paid in Full list`
  );

  // -------------------------------------------------------------
  // Test 3: Full payment recorded successfully -> booking becomes Confirmed
  // -------------------------------------------------------------
  // Ticket #0001 (Half Set, ₹300) is currently 'Pending Confirmation' and 'Unpaid'.
  // Recording full payment of ₹300 MUST transition booking to 'Booked' (Confirmed) and 'Paid'
  const booking0001Before = allBookingsAfterT4.find((b) => b.ticketNumber === '0001');
  const t3Pay = lotteryService.confirmPaymentTransaction(
    '0001',
    drawDate,
    300,
    'UPI',
    'UPI-FULL-01',
    'Super Admin',
    'admin',
    'Full payment recorded via UPI'
  );
  const allBookingsAfterT3 = lotteryService.getBookings(drawDate);
  const booking0001After = allBookingsAfterT3.find((b) => b.ticketNumber === '0001');
  const pendingListT3 = allBookingsAfterT3.filter((b) => b.bookingStatus === 'Pending Confirmation');
  const confirmedListT3 = allBookingsAfterT3.filter((b) => b.bookingStatus === 'Booked');
  const paidListT3 = allBookingsAfterT3.filter(
    (b) => b.bookingStatus === 'Booked' && b.paymentStatus === 'Paid'
  );
  const t3Passed =
    t3Pay.success === true &&
    booking0001Before.bookingStatus === 'Pending Confirmation' &&
    booking0001After &&
    booking0001After.bookingStatus === 'Booked' &&
    booking0001After.paymentStatus === 'Paid' &&
    booking0001After.remainingBalance === 0 &&
    !pendingListT3.some((b) => b.ticketNumber === '0001') &&
    confirmedListT3.some((b) => b.ticketNumber === '0001') &&
    paidListT3.some((b) => b.ticketNumber === '0001');
  recordTest(
    3,
    'Full payment recorded successfully -> booking becomes Confirmed',
    t3Passed,
    `Ticket #0001 (was "${booking0001Before?.bookingStatus}") -> after full payment: bookingStatus="${booking0001After?.bookingStatus}", paymentStatus="${booking0001After?.paymentStatus}", moved from Pending to Confirmed & Paid in Full`
  );

  // -------------------------------------------------------------
  // Test 5: Dashboard counts match underlying bookings
  // -------------------------------------------------------------
  // Inspect dashboard counts logic
  const allBookingsCurrent = lotteryService.getBookings(drawDate);
  const inventoryCurrent = lotteryService.getInventory(drawDate, undefined, 'admin');

  const bookedOrPendingNumbers = new Set(
    allBookingsCurrent
      .filter((b) => b.bookingStatus === 'Booked' || b.bookingStatus === 'Pending Confirmation')
      .map((b) => b.ticketNumber)
  );

  const totalPublished = inventoryCurrent.filter((t) => t.status === 'PUBLISHED').length;
  const availableCount = inventoryCurrent.filter(
    (t) =>
      t.status === 'PUBLISHED' &&
      t.bookingStatus !== 'Booked' &&
      t.bookingStatus !== 'Pending Confirmation' &&
      !bookedOrPendingNumbers.has(t.ticketNumber)
  ).length;

  const pendingCount = allBookingsCurrent.filter(
    (b) => b.bookingStatus === 'Pending Confirmation'
  ).length;
  const confirmedCount = allBookingsCurrent.filter(
    (b) => b.bookingStatus === 'Booked'
  ).length;
  const paidCountActual = allBookingsCurrent.filter(
    (b) =>
      b.bookingStatus === 'Booked' &&
      b.paymentStatus === 'Paid' &&
      (b.remainingBalance === 0 || b.amountPaid >= b.totalAmount)
  ).length;

  // Verify mathematical consistency: Available + Pending + Confirmed === Total Published
  const totalAccountedFor = availableCount + pendingCount + confirmedCount;
  const t5Passed =
    totalPublished === 100 &&
    totalAccountedFor === 100 &&
    confirmedCount === 2 && // 0004 (confirmed by admin), 0001 (confirmed by full payment)
    pendingCount === 2 &&   // 0002 (unpaid pending), 0003 (partial pending)
    paidCountActual === 1 && // 0001 (confirmed & paid in full)
    availableCount === 96;  // 100 - 4 booked/pending = 96 available
  recordTest(
    5,
    'Dashboard counts match underlying bookings',
    t5Passed,
    `Total Published: ${totalPublished}, Available: ${availableCount}, Pending: ${pendingCount}, Confirmed: ${confirmedCount}, Paid in Full: ${paidCountActual}. (Total Accounted = ${totalAccountedFor}/100, zero discrepancies)`
  );

  // -------------------------------------------------------------
  // Test 6: Employee and Admin views show same booking status
  // -------------------------------------------------------------
  // Ticket #0001: Confirmed (Booked)
  // Ticket #0002: Pending Confirmation
  // Ticket #0003: Pending Confirmation (Partial)
  // Ticket #0004: Confirmed (Booked)
  // Ticket #0005: Available
  const adminInventory = lotteryService.getInventory(drawDate, undefined, 'admin');
  const employeeInventory = lotteryService.getInventory(drawDate, undefined, 'employee');

  const inv0001Admin = adminInventory.find((t) => t.ticketNumber === '0001');
  const inv0001Emp = employeeInventory.find((t) => t.ticketNumber === '0001');
  const inv0002Admin = adminInventory.find((t) => t.ticketNumber === '0002');
  const inv0002Emp = employeeInventory.find((t) => t.ticketNumber === '0002');
  const inv0005Admin = adminInventory.find((t) => t.ticketNumber === '0005');
  const inv0005Emp = employeeInventory.find((t) => t.ticketNumber === '0005');

  const t6Passed =
    inv0001Admin?.bookingStatus === 'Booked' &&
    inv0001Emp?.bookingStatus === 'Booked' &&
    inv0002Admin?.bookingStatus === 'Pending Confirmation' &&
    inv0002Emp?.bookingStatus === 'Pending Confirmation' &&
    inv0005Admin?.bookingStatus === 'Available' &&
    inv0005Emp?.bookingStatus === 'Available';
  recordTest(
    6,
    'Employee and Admin views show same booking status',
    t6Passed,
    `#0001: Admin="${inv0001Admin?.bookingStatus}", Emp="${inv0001Emp?.bookingStatus}"; #0002: Admin="${inv0002Admin?.bookingStatus}", Emp="${inv0002Emp?.bookingStatus}"; #0005: Admin="${inv0005Admin?.bookingStatus}", Emp="${inv0005Emp?.bookingStatus}"`
  );

  // -------------------------------------------------------------
  // Test 10: Duplicate submissions and repeated payment actions do not create duplicate records
  // -------------------------------------------------------------
  // Part A: Duplicate booking submission with same idempotency key
  const dupBooking = lotteryService.bookTicketsTransaction(
    [{ ticketNumber: '0001', half: true, full: false }],
    'Ramesh Kumar',
    '9876543210',
    'Sasikaran',
    'employee',
    drawDate,
    { lockedByUid: 'EMP001', idempotencyKey: 'idem_test_7' }
  );
  // Part B: Attempting to book already booked ticket without idempotency key
  const conflictBooking = lotteryService.bookTicketsTransaction(
    [{ ticketNumber: '0001', half: true, full: false }],
    'Intruder',
    '9999999999',
    'Other Staff',
    'employee',
    drawDate,
    { lockedByUid: 'EMP002', idempotencyKey: 'idem_test_10_conflict' }
  );
  // Part C: Repeated payment attempt on already fully paid ticket
  const repeatedPay = lotteryService.confirmPaymentTransaction(
    '0001',
    drawDate,
    300,
    'UPI',
    'UPI-FULL-01-RETRY',
    'Super Admin',
    'admin',
    'Repeated payment retry'
  );

  const bookingsFor0001 = lotteryService.getBookings(drawDate).filter((b) => b.ticketNumber === '0001');
  const t10Passed =
    dupBooking.idempotentReplay === true &&
    conflictBooking.success === false &&
    conflictBooking.error.includes('already booked') &&
    repeatedPay.remainingBalance === 0 &&
    bookingsFor0001.length === 1; // Only 1 record exists, no duplicates created
  recordTest(
    10,
    'Duplicate submissions and repeated payment actions do not create duplicate records',
    t10Passed,
    `Idempotent replay=${dupBooking.idempotentReplay}, conflicting submission rejected="${conflictBooking.error}", exact 1 record exists for #0001`
  );

  console.log('\n----------------------------------------------------------------');
  const passedCount = testResults.filter((r) => r.passed).length;
  console.log(`TOTAL TESTS: ${testResults.length} | PASSED: ${passedCount} | FAILED: ${testResults.length - passedCount}`);
  console.log('----------------------------------------------------------------');

  if (passedCount === testResults.length) {
    console.log('\n*** ALL 10 STATUS SYNCHRONIZATION AND PRICING TESTS PASSED ***\n');
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
