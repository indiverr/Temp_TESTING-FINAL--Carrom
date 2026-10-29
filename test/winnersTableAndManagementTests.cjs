/**
 * Test Suite: Winners Table, Employee Filtering, Editable Winning Amount, Grand Sum, Permanent Code Lookup, and Mutually Exclusive Booking
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('CARROM LOTTERY DESK — WINNERS & EXCLUSIVE BOOKING SUITE');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`[PASS] ${testName}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${testName}`);
    console.error(`       Error: ${err.message}`);
    failCount++;
  }
}

// Read relevant files
const todayWinnerScreenPath = path.join(__dirname, '../lottery-app/src/lottery/components/TodayWinnerScreen.tsx');
const todayWinnerContent = fs.readFileSync(todayWinnerScreenPath, 'utf8');

const ticketInventoryHeaderScreenPath = path.join(__dirname, '../lottery-app/src/lottery/components/TicketInventoryHeaderScreen.tsx');
const ticketInventoryContent = fs.readFileSync(ticketInventoryHeaderScreenPath, 'utf8');

const ticketBookingDeskScreenPath = path.join(__dirname, '../lottery-app/src/lottery/components/TicketBookingDeskScreen.tsx');
const ticketBookingDeskContent = fs.readFileSync(ticketBookingDeskScreenPath, 'utf8');

const lotteryServicePath = path.join(__dirname, '../lottery-app/src/lottery/lotteryService.ts');
const lotteryServiceContent = fs.readFileSync(lotteryServicePath, 'utf8');

const liveFirebasePath = path.join(__dirname, '../lottery-app/src/lottery/liveFirebase.ts');
const liveFirebaseContent = fs.readFileSync(liveFirebasePath, 'utf8');

const lotteryAppMainPath = path.join(__dirname, '../lottery-app/src/lottery/LotteryAppMain.tsx');
const lotteryAppMainContent = fs.readFileSync(lotteryAppMainPath, 'utf8');

// Test 1: TodayWinnerScreen renders table view with employee as first column
runTest('Test 1: TodayWinnerScreen renders table view with employee as first column', () => {
  assert(todayWinnerContent.includes('<table'), 'Must contain <table> element');
  assert(todayWinnerContent.includes('<th className="py-3 px-3">Employee</th>'), 'First column header must be Employee');
  assert(todayWinnerContent.includes('Permanent Code</th>'), 'Must contain Permanent Code column header');
  assert(todayWinnerContent.includes('Name of Winner</th>'), 'Must contain Name of Winner column header');
  assert(todayWinnerContent.includes('No. of Tickets</th>'), 'Must contain No. of Tickets column header');
  assert(todayWinnerContent.includes('Winned Tickets & Sets</th>'), 'Must contain Winned Tickets & Sets column header');
  assert(todayWinnerContent.includes('Winned Ticket Amount</th>'), 'Must contain Winned Ticket Amount column header');
  assert(todayWinnerContent.includes('Total Winning Amount</th>'), 'Must contain Total Winning Amount column header');
  assert(todayWinnerContent.includes('Action</th>'), 'Must contain Action column header');
});

// Test 2: Category and Notes removed from Declare Draw Winner modal
runTest('Test 2: Category and Notes are completely removed from Declare Draw Winner modal', () => {
  assert(!todayWinnerContent.includes('formPrizeCategory'), 'Category state must be removed');
  assert(!todayWinnerContent.includes('Notes (Optional)'), 'Notes field must be removed');
  assert(!todayWinnerContent.includes('Consolation Prize'), 'Prize category options must be removed');
});

// Test 3: Permanent Code input auto-updates customer name, employee, tickets booked, and set type
runTest('Test 3: Permanent Code input auto-updates customer details, employee, and set type', () => {
  assert(todayWinnerContent.includes('Permanent Customer Code:'), 'Must have Permanent Customer Code as primary input');
  assert(todayWinnerContent.includes('handleCustomerCodeChange'), 'Must have handleCustomerCodeChange handler');
  assert(todayWinnerContent.includes('Name of Customer:'), 'Must display Name of Customer');
  assert(todayWinnerContent.includes('Under Whom Booked:'), 'Must display Under Whom Booked');
  assert(todayWinnerContent.includes('No. of Tickets Booked:'), 'Must display No. of Tickets Booked');
  assert(todayWinnerContent.includes('Type of Set:'), 'Must display Type of Set');
});

// Test 4: Selection of winning lottery tickets sums up the winned ticket amount
runTest('Test 4: Selection of winning lottery tickets dynamically sums up ticket amount received', () => {
  assert(todayWinnerContent.includes('toggleWinningTicket'), 'Must support toggling winning ticket selection');
  assert(todayWinnerContent.includes('selectedWinningTickets'), 'Must track selected winning tickets');
  assert(todayWinnerContent.includes('Winned Ticket Amount Received:'), 'Must display Winned Ticket Amount Received');
  assert(todayWinnerContent.includes('Sum of'), 'Must show summed winning tickets notice');
});

// Test 5: Final Winning Amount input is present for Admin
runTest('Test 5: Final Winning Amount input is present for Admin', () => {
  assert(todayWinnerContent.includes('Final Winning Amount (₹):'), 'Must have Final Winning Amount input');
  assert(todayWinnerContent.includes('formWinningAmount'), 'Must track formWinningAmount');
});

// Test 6: Employee filter small boxes allow viewing L1, L2... separately
runTest('Test 6: Employee filter small boxes allow viewing L1, L2... separately', () => {
  assert(todayWinnerContent.includes("selectedEmployeeFilter === 'ALL'"), 'Must have All filter tab/box');
  assert(todayWinnerContent.includes('selectedEmployeeFilter === emp.label'), 'Must have employee filter tab/box');
  assert(todayWinnerContent.includes('allEmployees.map'), 'Must map all employees to small filter boxes');
});

// Test 7: Whole amount received and winning amount grand sums in table and stat cards
runTest('Test 7: Whole amount received and winning amount calculated and displayed', () => {
  assert(todayWinnerContent.includes('totalAmountReceived'), 'Must calculate totalAmountReceived');
  assert(todayWinnerContent.includes('totalWinningAmount'), 'Must calculate totalWinningAmount');
  assert(todayWinnerContent.includes('Whole Amount Received'), 'Must display Whole Amount Received summary');
  assert(todayWinnerContent.includes('Total Winning Amount'), 'Must display Total Winning Amount summary');
  assert(todayWinnerContent.includes('<tfoot'), 'Must render table footer with grand totals');
});

// Test 8: Ticket booking correction - Customer cannot book Half Set and Full Set at the same time (Single Booking)
runTest('Test 8: Single Booking desk enforces mutually exclusive Half Set and Full Set', () => {
  assert(!ticketInventoryContent.includes('Select Both (Half + Full)'), 'Must remove Select Both button');
  assert(ticketInventoryContent.includes('setSingleHalf(true);\n                      setSingleFull(false);'), 'Selecting Half must deselect Full');
  assert(ticketInventoryContent.includes('setSingleFull(true);\n                      setSingleHalf(false);'), 'Selecting Full must deselect Half');
});

// Test 9: Ticket booking correction - Multi Booking desk enforces mutually exclusive Half Set and Full Set
runTest('Test 9: Multi Booking desk enforces mutually exclusive Half Set and Full Set', () => {
  assert(!ticketInventoryContent.includes('All Both (Half + Full)'), 'Must remove All Both button from multi booking');
  assert(ticketInventoryContent.includes('half: true, full: false'), 'Must support Half Only in multi booking');
  assert(ticketInventoryContent.includes('full: true, half: false'), 'Must support Full Only in multi booking');
  assert(ticketBookingDeskContent.includes('full: !item.half ? false : item.full'), 'TicketBookingDeskScreen must enforce exclusivity in toggleHalf');
  assert(ticketBookingDeskContent.includes('half: !item.full ? false : item.half'), 'TicketBookingDeskScreen must enforce exclusivity in toggleFull');
});

// Test 10: Inline editing and deletion of winners are preserved
runTest('Test 10: Inline editing and deletion of winners are preserved', () => {
  assert(todayWinnerContent.includes('editingWinnerId === winner.id'), 'Must support inline editing');
  assert(todayWinnerContent.includes('handleSaveEdit(winner.id)'), 'Must support saving edit');
  assert(todayWinnerContent.includes('handleConfirmDelete(winner.id)'), 'Must support deleting winner');
});

console.log('\n----------------------------------------------------------------');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('----------------------------------------------------------------\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('*** ALL 10 WINNER & BOOKING EXCLUSIVITY TESTS PASSED ***\n');
}
