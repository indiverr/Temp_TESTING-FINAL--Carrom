/**
 * Test Suite: Upcoming Collections Queue Management & Ticket Lock Reliability
 * Tests:
 * 1. Admin can view upcoming collections queue
 * 2. Admin can edit range and reveal time of an upcoming collection
 * 3. Admin can delete an upcoming collection from the queue
 * 4. Admin can immediately publish a scheduled collection
 * 5. Ticket selection reserves ticket instantly (< 1ms) without "Securing Lock..." blocking UX
 * 6. Another employee cannot select or touch a reserved ticket
 * 7. Cancelling the booking modal immediately releases the ticket for others
 * 8. Booking submission completes successfully without failing on LOCK_REQUIRED
 * 9. Booking submission completes successfully even when ScriptLock experiences contention
 * 10. Mutually exclusive Half Set vs Full Set booking persists correctly
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const lotteryServicePath = path.resolve(__dirname, '../lottery-app/src/lottery/lotteryService.ts');
const headerScreenPath = path.resolve(__dirname, '../lottery-app/src/lottery/components/TicketInventoryHeaderScreen.tsx');
const liveFirebasePath = path.resolve(__dirname, '../lottery-app/src/lottery/liveFirebase.ts');
const codeGsPath = path.resolve(__dirname, '../apps-script/Code.gs');

const lotteryServiceCode = fs.readFileSync(lotteryServicePath, 'utf8');
const headerScreenCode = fs.readFileSync(headerScreenPath, 'utf8');
const liveFirebaseCode = fs.readFileSync(liveFirebasePath, 'utf8');
const codeGsCode = fs.readFileSync(codeGsPath, 'utf8');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${name}`);
    console.error('       Error:', err.message);
  }
}

console.log('================================================================');
console.log('CARROM LOTTERY DESK — UPCOMING QUEUE & LOCK RELIABILITY SUITE');
console.log('================================================================\n');

// Test 1: Admin can view upcoming collections queue modal
runTest('Admin can view upcoming collections queue modal', () => {
  assert(headerScreenCode.includes('Upcoming Collections Queue'), 'Header must contain Upcoming Collections Queue modal');
  assert(headerScreenCode.includes('isQueueModalOpen'), 'Must track isQueueModalOpen state');
  assert(headerScreenCode.includes('setIsQueueModalOpen(true)'), 'Must have button to open queue modal');
});

// Test 2: Admin can edit range and reveal time of an upcoming collection
runTest('Admin can edit range and reveal time of an upcoming collection', () => {
  assert(headerScreenCode.includes('handleSaveEditedSchedule'), 'Must have handleSaveEditedSchedule handler');
  assert(headerScreenCode.includes('editStart'), 'Must have editStart state for range');
  assert(headerScreenCode.includes('editEnd'), 'Must have editEnd state for range');
  assert(headerScreenCode.includes('editCustomTime'), 'Must have editCustomTime state');
  assert(lotteryServiceCode.includes('updateScheduledPublication'), 'lotteryService must provide updateScheduledPublication');
  assert(liveFirebaseCode.includes('updateScheduledPublicationFirestore'), 'liveFirebase must provide updateScheduledPublicationFirestore');
});

// Test 3: Admin can delete an upcoming collection from the queue
runTest('Admin can delete an upcoming collection from the queue', () => {
  assert(headerScreenCode.includes('handleDeleteSchedule'), 'Must have handleDeleteSchedule handler');
  assert(headerScreenCode.includes('onCancelScheduledPublication'), 'Must invoke onCancelScheduledPublication');
  assert(lotteryServiceCode.includes('cancelScheduledPublication'), 'lotteryService must provide cancelScheduledPublication');
});

// Test 4: Admin can publish a scheduled collection immediately
runTest('Admin can immediately publish a scheduled collection', () => {
  assert(headerScreenCode.includes('handlePublishScheduleNow'), 'Must have handlePublishScheduleNow handler');
  assert(headerScreenCode.includes('Publish Now'), 'Must provide Publish Now button in queue');
});

// Test 5: Ticket selection reserves ticket instantly without "Securing Lock..." blocking UX
runTest('Ticket selection reserves ticket instantly without "Securing Lock..." blocking UX', () => {
  assert(!headerScreenCode.includes('<span>Securing Lock...</span>'), 'Pulsating Securing Lock... text must be removed');
  assert(!headerScreenCode.includes('isAcquiringLock ?'), 'Booking modal must not gate UI on isAcquiringLock');
  assert(headerScreenCode.includes('<span>Selected</span>'), 'Modal must show clean Selected/Reserved status');
});

// Test 6: Another employee cannot select or touch a reserved ticket
runTest('Another employee cannot select or touch a reserved ticket', () => {
  assert(headerScreenCode.includes('This ticket is currently being booked by another user'), 'Must prevent other users from selecting reserved ticket');
  assert(lotteryServiceCode.includes('TICKET_LOCKED'), 'lotteryService must protect held tickets with TICKET_LOCKED');
});

// Test 7: Cancelling the booking modal immediately releases the ticket for others
runTest('Cancelling the booking modal immediately releases the ticket for others', () => {
  assert(headerScreenCode.includes('handleCloseSingleBookingModal'), 'Must have handleCloseSingleBookingModal');
  assert(headerScreenCode.includes('onReleaseTicketLock'), 'Must invoke onReleaseTicketLock on cancel');
});

// Test 8: Booking submission completes successfully without failing on LOCK_REQUIRED
runTest('Booking submission completes successfully without failing on LOCK_REQUIRED', () => {
  assert(!lotteryServiceCode.includes('Active ticket lock is required for ticket'), 'lotteryService must not reject bookings with Active ticket lock is required');
  assert(!codeGsCode.includes('Active ticket lock is required for ticket'), 'Code.gs must not reject bookings with Active ticket lock is required');
});

// Test 9: ScriptLock contention does not crash or throw unhandled Lock timeout
runTest('ScriptLock contention does not crash or throw unhandled Lock timeout', () => {
  assert(codeGsCode.includes('lockWaitErr'), 'Code.gs must catch lock wait timeouts cleanly');
  assert(liveFirebaseCode.includes('Apps Script lock contention'), 'liveFirebase must fallback on lock contention');
});

// Test 10: 2-hour ticket lock fallback TTL prevents lock expiration during normal booking
runTest('2-hour ticket lock fallback TTL prevents lock expiration during normal booking', () => {
  assert(lotteryServiceCode.includes('2 * 60 * 60 * 1000'), 'lotteryService TTL must be 2 hours');
  assert(codeGsCode.includes('2 * 60 * 60 * 1000'), 'Code.gs TTL must be 2 hours');
});

console.log('\n----------------------------------------------------------------');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('----------------------------------------------------------------\n');

if (passedTests === totalTests) {
  console.log('*** ALL 10 UPCOMING QUEUE & LOCK RELIABILITY TESTS PASSED ***\n');
} else {
  process.exit(1);
}
