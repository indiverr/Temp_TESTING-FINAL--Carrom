/**
 * Automated Verification Suite for Carrom Lottery Desk
 * - Draw Date screen: Only 2 buttons (Customer Report & Employee List), custom date removed
 * - Employee List: L1, L2, ... directory with remove employee capability
 * - Customer Report: Small boxes for L1, L2... with strictly 3 details (#0000, Customer Name, Phone)
 * - Ticket Grid: Weekly Presets & Schedules buttons removed
 * - Add Collections: Stackable collections, First Collection (default, no timer), 2nd+ with timer preset & delete
 * - Centralized Overview: Paid in Full, Download Customer Report, and Weekly Presets removed
 * - Report Screen: Unique report for each employee with 6 columns (Employee ID, Customer Name, Booked Ticket Numbers, Ticket Count, Half Set Count, Full Set Count)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('CARROM LOTTERY DESK — ADMIN EMPLOYEE & REPORT ENHANCEMENTS SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${name}`);
    console.error(`       Error: ${err.message}\n`);
  }
}

// Read component files
const enterDrawDatePath = path.resolve(__dirname, '../lottery-app/src/lottery/components/EnterDrawDateScreen.tsx');
const enterDrawDateContent = fs.readFileSync(enterDrawDatePath, 'utf8');

const ticketInventoryPath = path.resolve(__dirname, '../lottery-app/src/lottery/components/TicketInventoryHeaderScreen.tsx');
const ticketInventoryContent = fs.readFileSync(ticketInventoryPath, 'utf8');

const dashboardPath = path.resolve(__dirname, '../lottery-app/src/lottery/components/BookedTicketsDashboardScreen.tsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

const paymentQueuePath = path.resolve(__dirname, '../lottery-app/src/lottery/components/PaymentQueueScreen.tsx');
const paymentQueueContent = fs.readFileSync(paymentQueuePath, 'utf8');

const lotteryAppMainPath = path.resolve(__dirname, '../lottery-app/src/lottery/LotteryAppMain.tsx');
const lotteryAppMainContent = fs.readFileSync(lotteryAppMainPath, 'utf8');

// Test 1: EnterDrawDateScreen removes custom date option
runTest('EnterDrawDateScreen has custom date input removed', () => {
  assert(!enterDrawDateContent.includes('Or custom date:'), 'Custom date label should be removed');
  assert(!enterDrawDateContent.includes('handleCustomDateSubmit'), 'Custom date handler should be removed');
});

// Test 2: EnterDrawDateScreen contains ONLY two admin buttons (Customer Report & Employee List)
runTest('EnterDrawDateScreen contains Customer Report & Employee List buttons only', () => {
  assert(enterDrawDateContent.includes('Customer Report'), 'Must contain Customer Report button');
  assert(enterDrawDateContent.includes('Employee List'), 'Must contain Employee List button');
  assert(!enterDrawDateContent.includes('View Available Numbers Sheet'), 'Should not have extraneous gallery button on main page');
  assert(!enterDrawDateContent.includes('Quick Report'), 'Should not have extraneous Quick Report button');
});

// Test 3: Employee List Modal allows viewing and removing employees
runTest('Employee List modal provides employee removal for Admin', () => {
  assert(enterDrawDateContent.includes('handleRemoveEmployee'), 'Must have handleRemoveEmployee handler');
  assert(enterDrawDateContent.includes('isEmployeeListOpen'), 'Must have isEmployeeListOpen state');
  assert(enterDrawDateContent.includes('removeEmployeeFirestore'), 'Must call removeEmployeeFirestore');
});

// Test 4: Customer Report has small boxes for L1, L2... and displays strictly 3 details (#0000, Name, Phone)
runTest('Customer Report has small employee boxes and displays strictly 3 details', () => {
  assert(enterDrawDateContent.includes('availableEmployeeBoxes'), 'Must have employee boxes');
  assert(enterDrawDateContent.includes('Permanent Number'), 'Must have Permanent Number header');
  assert(enterDrawDateContent.includes('Customer Name'), 'Must have Customer Name header');
  assert(enterDrawDateContent.includes('Phone Number'), 'Must have Phone Number header');
  // Check format: '#' + padStart(4, '0')
  assert(enterDrawDateContent.includes("padStart(4, '0')"), 'Must format ticket number as #0000');
});

// Test 5: Ticket Grid Header removes Weekly Presets and Schedules buttons
runTest('Ticket Grid Header removes Weekly Presets and Schedules buttons', () => {
  const legendIdx = ticketInventoryContent.indexOf('{/* Visual Ticket State Legend */}');
  assert(legendIdx !== -1, 'Must find Visual Ticket State Legend');
  const headerSnippet = ticketInventoryContent.substring(legendIdx - 1500, legendIdx);
  assert(!headerSnippet.includes('<span>Weekly Presets</span>'), 'Weekly Presets button must be removed from header');
  assert(!headerSnippet.includes('<span>Schedules'), 'Schedules button must be removed from header');
});

// Test 6: Add Tickets Modal supports stackable Collections with First Collection as default (no timer)
runTest('Add Tickets Modal supports Collections with First Collection default (no timer)', () => {
  assert(ticketInventoryContent.includes('First Collection'), 'Must have First Collection');
  assert(ticketInventoryContent.includes('No Timer'), 'First collection must have No Timer tag');
  assert(ticketInventoryContent.includes('handleAddCollection'), 'Must have handleAddCollection');
  assert(ticketInventoryContent.includes('handleRemoveCollection'), 'Must have handleRemoveCollection');
  assert(ticketInventoryContent.includes('Timer Preset'), 'From second collection must have Timer Preset');
});

// Test 7: Employee notice banner shows upcoming collections reveal time
runTest('Employee grid displays upcoming collections reveal time until execution', () => {
  assert(ticketInventoryContent.includes('Upcoming Collections:'), 'Must show Upcoming Collections banner');
  assert(ticketInventoryContent.toLowerCase().includes('reveals at'), 'Must display collection reveal time');
});

// Test 8: Overview Dashboard removes Paid in Full card, Download Customer Report, and Weekly Presets
runTest('Overview Dashboard removes Paid in Full card, Download Report, and Weekly Presets', () => {
  assert(!dashboardContent.includes('<span>Download Customer Report (PDF)</span>'), 'Must remove Download Customer Report button');
  assert(!dashboardContent.includes('>Paid in Full</div>'), 'Must remove Paid in Full card');
  assert(!dashboardContent.includes('<span>Weekly Presets</span>'), 'Must remove Weekly Presets tab');
});

// Test 9: Navigation bar changes Payment Queue to Report
runTest('Top navigation bar changes Payment Queue to Report', () => {
  assert(lotteryAppMainContent.includes('<span>Report</span>'), 'Navigation bar must show Report');
});

// Test 10: Report Screen renders unique reports for each L1, L2... with 6 columns
runTest('Report Screen provides small boxes for L1, L2... and 6-column table', () => {
  assert(paymentQueueContent.includes('allEmployees'), 'Must discover all employees');
  assert(paymentQueueContent.includes('selectedEmployeeLabel'), 'Must track selected employee label');
  assert(paymentQueueContent.includes('Employee ID'), 'Must have Employee ID column');
  assert(paymentQueueContent.includes('Customer Name'), 'Must have Customer Name column');
  assert(paymentQueueContent.includes('Booked Ticket Numbers'), 'Must have Booked Ticket Numbers column');
  assert(paymentQueueContent.includes('Number of Tickets'), 'Must have Number of Tickets column');
  assert(paymentQueueContent.includes('Number of Half Set'), 'Must have Number of Half Set column');
  assert(paymentQueueContent.includes('Number of Full Set'), 'Must have Number of Full Set column');
});

console.log('\n----------------------------------------------------------------');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('----------------------------------------------------------------\n');

if (passedTests === totalTests) {
  console.log('*** ALL 10 ENHANCEMENT TESTS PASSED ***\n');
} else {
  process.exit(1);
}
