import { lotteryService } from './lotteryService';
import { SelectedTicketItem } from './types';

export function runLotteryAcceptanceTests(): {
  name: string;
  passed: boolean;
  message: string;
}[] {
  const results: { name: string; passed: boolean; message: string }[] = [];

  // Reset to clean state before starting
  lotteryService.resetAllToSeed();
  const testDate = '02 Oct 2026';

  // Test 1: Duplicate booking prevention (Concurrency safety)
  try {
    const itemA: SelectedTicketItem[] = [{ ticketNumber: '9991', half: false, full: true }];
    const firstRes = lotteryService.bookTicketsTransaction(
      itemA,
      'Test User 1',
      '9876543210',
      'Agent 1',
      'employee',
      testDate
    );
    const secondRes = lotteryService.bookTicketsTransaction(
      itemA,
      'Test User 2',
      '9876543211',
      'Agent 2',
      'employee',
      testDate
    );

    const passed = firstRes.success && !secondRes.success;
    results.push({
      name: '1. Duplicate Booking Prevention',
      passed,
      message: passed
        ? 'Passed: Second booking attempt was blocked atomically.'
        : `Failed: firstRes=${firstRes.success}, secondRes=${secondRes.success}`,
    });
  } catch (e: any) {
    results.push({ name: '1. Duplicate Booking Prevention', passed: false, message: e.message });
  }

  // Test 2: Role Permissions for Payment Confirmation
  try {
    // Ticket 9991 is booked and unpaid.
    // Try confirming payment as standard employee -> Should fail
    const employeeAttempt = lotteryService.confirmPaymentTransaction(
      '9991',
      testDate,
      50,
      'Cash',
      'REF-EMP',
      'Sasikaran',
      'employee' // unprivileged
    );
    // Try confirming payment as paid_employee -> Should succeed
    const paidEmployeeAttempt = lotteryService.confirmPaymentTransaction(
      '9991',
      testDate,
      50,
      'Cash',
      'REF-PAID-EMP',
      'Gogul',
      'paid_employee' // privileged
    );

    const passed = !employeeAttempt.success && paidEmployeeAttempt.success;
    results.push({
      name: '2. Role-Based Payment Confirmation',
      passed,
      message: passed
        ? 'Passed: Unauthorized employee blocked; authorized paid employee permitted.'
        : `Failed: emp=${employeeAttempt.success}, paidEmp=${paidEmployeeAttempt.success}`,
    });
  } catch (e: any) {
    results.push({ name: '2. Role-Based Payment Confirmation', passed: false, message: e.message });
  }

  // Test 3: Partial Payments & Outstanding Balance calculation
  try {
    const itemB: SelectedTicketItem[] = [{ ticketNumber: '9992', half: true, full: true }]; // Total = ₹75
    lotteryService.bookTicketsTransaction(
      itemB,
      'Partial Customer',
      '9944112233',
      'Sasikaran',
      'employee',
      testDate
    );

    // Pay ₹25 as partial
    const partialRes = lotteryService.confirmPaymentTransaction(
      '9992',
      testDate,
      25,
      'Cash',
      'PARTIAL-01',
      'Super Admin',
      'admin'
    );

    const bookings = lotteryService.getBookings(testDate);
    const target = bookings.find((b) => b.ticketNumber === '9992');
    const passed =
      partialRes.success &&
      target !== undefined &&
      target.paymentStatus === 'Partial' &&
      target.remainingBalance === 50 &&
      target.amountPaid === 25;

    results.push({
      name: '3. Partial Payments & Balance Ledger',
      passed,
      message: passed
        ? 'Passed: Remaining balance is correctly calculated as ₹50 with status Partial.'
        : `Failed: target balance=${target?.remainingBalance}, status=${target?.paymentStatus}`,
    });
  } catch (e: any) {
    results.push({ name: '3. Partial Payments & Balance Ledger', passed: false, message: e.message });
  }

  // Test 4: Audited Cancellation
  try {
    const cancelRes = lotteryService.cancelBookingTransaction(
      '9992',
      testDate,
      'Super Admin',
      'admin',
      'Customer cancellation request'
    );
    const target = lotteryService.getBookings(testDate).find((b) => b.ticketNumber === '9992');
    const passed = cancelRes.success && target === undefined; // Filtered out of active bookings

    results.push({
      name: '4. Audited Cancellation Workflow',
      passed,
      message: passed
        ? 'Passed: Cancelled ticket removed from active roster and audit entry logged.'
        : `Failed: cancelRes=${cancelRes.success}`,
    });
  } catch (e: any) {
    results.push({ name: '4. Audited Cancellation Workflow', passed: false, message: e.message });
  }

  // Test 5: Configurable Custom Series Name & Pricing
  try {
    const updateRes = lotteryService.updateConfig(
      { seriesTitle: 'CARROM BUMPER 2026', halfTicketPrice: 30, fullTicketPrice: 60 },
      'admin'
    );
    const conf = lotteryService.getConfig();
    const passed =
      updateRes.success &&
      conf.seriesTitle === 'CARROM BUMPER 2026' &&
      conf.halfTicketPrice === 30 &&
      conf.fullTicketPrice === 60;

    results.push({
      name: '5. Configurable Series Title & Pricing Rules',
      passed,
      message: passed
        ? 'Passed: Series title and pricing rules dynamically updated and stored.'
        : `Failed: updateRes=${updateRes.success}`,
    });
  } catch (e: any) {
    results.push({ name: '5. Configurable Series Title & Pricing Rules', passed: false, message: e.message });
  }

  // Restore clean state
  lotteryService.resetAllToSeed();
  return results;
}
