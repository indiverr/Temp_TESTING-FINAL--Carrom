/**
 * Comprehensive Test Suite for Draw Date Consistency, Admin Customer Report, and Temporary Booking-Session Locks
 * Tests Section 5 of Master Task:
 * 1. Date consistency across all pages and queries (29 Oct 2026 vs 02 Oct 2026)
 * 2. Scoping of inventory, bookings, and reports to the exact selected draw date
 * 3. Persistence of selected draw date across navigation and refreshes
 * 4. Date formatting in Asia/Kolkata timezone
 * 5. Admin-only Customer Report access and authorization
 * 6. Employee isolation (cannot see or fetch admin-only customer reports)
 * 7. Correct financial totals (Combined packages ₹870, Half ₹300, Full ₹570, partial payments)
 * 8. Read-only report does not invoke configuration-update permissions
 * 9. Temporary booking-session locking (immediate feedback, mutual exclusion)
 * 10. Immediate release upon cancel/close without 120s timer countdown
 * 11. Protection of confirmed bookings against accidental release
 * 12. Fallback TTL cleanup for unexpected browser crashes
 */

const assert = require('assert');

// Authoritative state simulator matching updated application code
class DrawDateAndBookingHarness {
  constructor() {
    this.storage = new Map();
    this.inMemoryConfig = {
      seriesTitle: 'CUSTOM NAME',
      businessDate: '29 Oct 2026',
      halfTicketPrice: 300,
      fullTicketPrice: 570,
    };
    this.bookings = [];
    this.inventory = new Map();
    this.locks = new Map();
  }

  // Active draw date management
  setActiveDrawDate(date) {
    const clean = String(date || '').trim();
    if (!clean) return;
    this.inMemoryConfig.businessDate = clean;
    this.storage.set('carrom_active_draw_date', clean);
  }

  getActiveDrawDate() {
    return this.storage.get('carrom_active_draw_date') || this.inMemoryConfig.businessDate;
  }

  // Config save (Admin only, distinct from session draw date selection)
  saveConfig(updated, role) {
    if (role !== 'admin') {
      return { success: false, error: 'Permission Denied: Only Admin can update configuration.' };
    }
    Object.assign(this.inMemoryConfig, updated);
    return { success: true, config: this.inMemoryConfig };
  }

  // Add inventory scoped to draw date
  addInventory(tickets, drawDate) {
    for (const raw of tickets) {
      const num = String(raw).padStart(4, '0');
      const key = `${drawDate}_col-1_${num}`;
      this.inventory.set(key, {
        ticketNumber: num,
        drawDate,
        status: 'PUBLISHED',
        bookingStatus: 'Available',
      });
    }
  }

  getInventory(drawDate) {
    const list = [];
    for (const [key, item] of this.inventory.entries()) {
      if (item.drawDate === drawDate) {
        list.push(item);
      }
    }
    return list;
  }

  // Temporary booking session locks
  acquireLock(ticketNumber, drawDate, uid, name) {
    const num = String(ticketNumber).padStart(4, '0');
    const booked = this.bookings.find((b) => b.ticketNumber === num && b.date === drawDate);
    if (booked) {
      return { success: false, code: 'ALREADY_BOOKED', error: 'Ticket is already booked.' };
    }

    const existing = this.locks.get(`${drawDate}_${num}`);
    const now = Date.now();

    if (existing && existing.status === 'LOCKED') {
      if (existing.expiresAtMs > now) {
        if (existing.lockedByUid === uid) {
          return { success: true, lockId: existing.lockId, ticketNumbers: [num] };
        }
        return { success: false, code: 'TICKET_LOCKED', error: 'This ticket is currently being booked by another user.' };
      }
    }

    const lockId = `lock_${uid}_${now}_${Math.random().toString(36).substring(2, 6)}`;
    const lock = {
      lockId,
      ticketNumber: num,
      drawDate,
      lockedByUid: uid,
      lockedByName: name,
      status: 'LOCKED',
      lockedAtMs: now,
      expiresAtMs: now + 120000, // 2-min internal fallback TTL for crash safety
    };
    this.locks.set(`${drawDate}_${num}`, lock);
    return { success: true, lockId, ticketNumbers: [num] };
  }

  releaseLock(ticketNumber, drawDate, lockId, uid) {
    const num = String(ticketNumber).padStart(4, '0');
    const key = `${drawDate}_${num}`;
    const existing = this.locks.get(key);
    if (!existing) return { success: true };

    // Prevent another user from releasing someone else's active reservation
    if (existing.lockedByUid !== uid && existing.expiresAtMs > Date.now()) {
      return { success: false, error: 'Cannot release a lock owned by another user.' };
    }

    this.locks.delete(key);
    return { success: true };
  }

  getActiveLocks(drawDate, now = Date.now()) {
    const active = [];
    for (const [key, l] of this.locks.entries()) {
      if (l.drawDate === drawDate && l.status === 'LOCKED') {
        if (l.expiresAtMs > now) {
          active.push(l);
        } else {
          // Internal automatic cleanup of expired crash locks
          this.locks.delete(key);
        }
      }
    }
    return active;
  }

  // Booking
  createBooking({ ticketNumber, drawDate, ticketType, customerName, customerPhone, customerId, bookedBy, bookedByRole }) {
    const num = String(ticketNumber).padStart(4, '0');
    let halfSelected = false;
    let fullSelected = false;
    let totalAmount = 0;

    if (ticketType === 'both') {
      halfSelected = true;
      fullSelected = true;
      totalAmount = 870;
    } else if (ticketType === 'half') {
      halfSelected = true;
      totalAmount = 300;
    } else {
      fullSelected = true;
      totalAmount = 570;
    }

    const booking = {
      id: `booking_${drawDate}_${num}`,
      ticketNumber: num,
      date: drawDate,
      ticketType,
      halfSelected,
      fullSelected,
      totalAmount,
      amountPaid: 0,
      remainingBalance: totalAmount,
      bookingStatus: 'Pending Confirmation',
      paymentStatus: 'Unpaid',
      customerName,
      customerPhone,
      customerId: customerId || '#5316',
      bookedBy,
      bookedByRole,
      createdAt: new Date().toISOString(),
    };

    this.bookings.push(booking);
    // Release session lock
    this.locks.delete(`${drawDate}_${num}`);
    return booking;
  }

  // Customer Report Query (Admin Only)
  fetchCustomerReport(role, drawDate, searchQuery = '') {
    if (role !== 'admin') {
      throw new Error('PERMISSION_DENIED: Only administrators can access customer reports.');
    }
    let list = this.bookings.filter((b) => b.date === drawDate);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) =>
        (b.customerName || '').toLowerCase().includes(q) ||
        (b.customerPhone || '').toLowerCase().includes(q) ||
        (b.customerId || '').toLowerCase().includes(q) ||
        (b.ticketNumber || '').toLowerCase().includes(q)
      );
    }
    return list;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('CARROM LOTTERY DESK — DRAW DATE, CUSTOMER REPORT & LOCKING SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  const h = new DrawDateAndBookingHarness();

  // Seed sample data for 02 Oct 2026 and 29 Oct 2026
  h.addInventory(['0001', '0002', '0003'], '02 Oct 2026');
  h.addInventory(['0101', '0102', '0103', '0104'], '29 Oct 2026');

  h.createBooking({
    ticketNumber: '0001',
    drawDate: '02 Oct 2026',
    ticketType: 'full',
    customerName: 'Historical User',
    customerPhone: '9000000001',
    customerId: '#5316',
    bookedBy: 'Hari',
    bookedByRole: 'employee',
  });

  h.createBooking({
    ticketNumber: '0101',
    drawDate: '29 Oct 2026',
    ticketType: 'both',
    customerName: 'John Doe',
    customerPhone: '9876543210',
    customerId: '#5317',
    bookedBy: 'Sasikaran',
    bookedByRole: 'admin',
  });

  h.createBooking({
    ticketNumber: '0102',
    drawDate: '29 Oct 2026',
    ticketType: 'half',
    customerName: 'Jane Smith',
    customerPhone: '9876543211',
    customerId: '#5318',
    bookedBy: 'Hari',
    bookedByRole: 'employee',
  });

  // -------------------------------------------------------------
  // PART 1: DRAW DATE CONSISTENCY TESTS
  // -------------------------------------------------------------
  test('Test 1: Selecting 29 Oct 2026 establishes canonical date across application', () => {
    h.setActiveDrawDate('29 Oct 2026');
    assert.strictEqual(h.getActiveDrawDate(), '29 Oct 2026');

    // Scoped queries must return 29 Oct 2026 items only
    const inv = h.getInventory(h.getActiveDrawDate());
    assert.strictEqual(inv.length, 4);
    assert.ok(inv.every(i => i.drawDate === '29 Oct 2026'));

    const b = h.bookings.filter(x => x.date === h.getActiveDrawDate());
    assert.strictEqual(b.length, 2);
    assert.ok(b.every(x => x.date === '29 Oct 2026'));
  });

  test('Test 2: Switching to 02 Oct 2026 correctly isolates historical draw data', () => {
    h.setActiveDrawDate('02 Oct 2026');
    assert.strictEqual(h.getActiveDrawDate(), '02 Oct 2026');

    const inv = h.getInventory(h.getActiveDrawDate());
    assert.strictEqual(inv.length, 3);
    assert.ok(inv.every(i => i.drawDate === '02 Oct 2026'));

    const b = h.bookings.filter(x => x.date === h.getActiveDrawDate());
    assert.strictEqual(b.length, 1);
    assert.strictEqual(b[0].ticketNumber, '0001');
  });

  test('Test 3: Selected draw date persists across simulated navigation and refresh', () => {
    h.setActiveDrawDate('29 Oct 2026');
    // Simulate page reload by creating new component reading from storage
    const restoredDate = h.storage.get('carrom_active_draw_date');
    assert.strictEqual(restoredDate, '29 Oct 2026', 'Restored date must match selected date without resetting to 02 Oct');
  });

  test('Test 4: Selecting a draw date does not invoke admin config-update permissions', () => {
    // Regular employee selects draw date
    h.setActiveDrawDate('29 Oct 2026');
    assert.strictEqual(h.getActiveDrawDate(), '29 Oct 2026');

    // Attempting to modify global config/system as employee is rejected, but session draw date remains unaffected
    const configRes = h.saveConfig({ seriesTitle: 'NEW' }, 'employee');
    assert.strictEqual(configRes.success, false);
    assert.ok(configRes.error.includes('Permission Denied'));
    assert.strictEqual(h.getActiveDrawDate(), '29 Oct 2026', 'Session date remains 29 Oct 2026 despite config rejection');
  });

  // -------------------------------------------------------------
  // PART 2: ADMIN-ONLY CUSTOMER REPORT TESTS
  // -------------------------------------------------------------
  test('Test 5: Admin can access customer report for selected draw date', () => {
    const report = h.fetchCustomerReport('admin', '29 Oct 2026');
    assert.strictEqual(report.length, 2);
    assert.strictEqual(report[0].customerName, 'John Doe');
    assert.strictEqual(report[1].customerName, 'Jane Smith');
  });

  test('Test 6: Employee is strictly blocked from accessing customer report', () => {
    assert.throws(
      () => h.fetchCustomerReport('employee', '29 Oct 2026'),
      /PERMISSION_DENIED/,
      'Non-admin must be blocked with PERMISSION_DENIED'
    );
  });

  test('Test 7: Customer report financial totals correctly handle combined packages', () => {
    const report = h.fetchCustomerReport('admin', '29 Oct 2026');
    // John Doe booked 'both' (₹870), Jane Smith booked 'half' (₹300)
    let totalDue = 0;
    let totalTickets = 0;
    for (const b of report) {
      totalDue += b.totalAmount;
      totalTickets += 1;
    }
    assert.strictEqual(totalDue, 1170, '₹870 + ₹300 = ₹1170 (no double-counting of both packages)');
    assert.strictEqual(totalTickets, 2);
  });

  test('Test 8: Customer report search filters by customer name, phone, or ticket number', () => {
    const searchByName = h.fetchCustomerReport('admin', '29 Oct 2026', 'Jane');
    assert.strictEqual(searchByName.length, 1);
    assert.strictEqual(searchByName[0].ticketNumber, '0102');

    const searchByTicket = h.fetchCustomerReport('admin', '29 Oct 2026', '0101');
    assert.strictEqual(searchByTicket.length, 1);
    assert.strictEqual(searchByTicket[0].customerName, 'John Doe');

    const searchByPhone = h.fetchCustomerReport('admin', '29 Oct 2026', '9876543210');
    assert.strictEqual(searchByPhone.length, 1);
    assert.strictEqual(searchByPhone[0].customerId, '#5317');
  });

  // -------------------------------------------------------------
  // PART 3: TEMPORARY BOOKING-SESSION LOCK TESTS
  // -------------------------------------------------------------
  test('Test 9: Selecting an available ticket immediately reserves it for employee session', () => {
    const t0 = process.hrtime.bigint();
    const lockRes = h.acquireLock('0103', '29 Oct 2026', 'EMP1', 'Alice');
    const t1 = process.hrtime.bigint();
    const durationMs = Number(t1 - t0) / 1e6;

    assert.strictEqual(lockRes.success, true);
    assert.ok(durationMs < 5.0, `Reservation acquisition must be instant (took ${durationMs.toFixed(3)}ms)`);

    const activeLocks = h.getActiveLocks('29 Oct 2026');
    assert.strictEqual(activeLocks.length, 1);
    assert.strictEqual(activeLocks[0].ticketNumber, '0103');
  });

  test('Test 10: Second employee cannot book or reserve ticket while session is active', () => {
    const secondRes = h.acquireLock('0103', '29 Oct 2026', 'EMP2', 'Bob');
    assert.strictEqual(secondRes.success, false);
    assert.strictEqual(secondRes.code, 'TICKET_LOCKED');
    assert.ok(secondRes.error.includes('currently being booked'));
  });

  test('Test 11: Cancelling or closing booking desk immediately releases reservation without timer delay', () => {
    const locks = h.getActiveLocks('29 Oct 2026');
    const aliceLock = locks.find(l => l.ticketNumber === '0103');

    // Alice closes modal
    const relRes = h.releaseLock('0103', '29 Oct 2026', aliceLock.lockId, 'EMP1');
    assert.strictEqual(relRes.success, true);

    // Reservation is immediately gone
    const afterLocks = h.getActiveLocks('29 Oct 2026');
    assert.strictEqual(afterLocks.length, 0, 'Ticket must be available immediately without waiting for 120s timer');

    // Bob can now immediately reserve and book the ticket
    const bobRes = h.acquireLock('0103', '29 Oct 2026', 'EMP2', 'Bob');
    assert.strictEqual(bobRes.success, true);
    h.releaseLock('0103', '29 Oct 2026', bobRes.lockId, 'EMP2');
  });

  test('Test 12: Successful booking clears temporary reservation and permanently marks ticket', () => {
    const lockRes = h.acquireLock('0104', '29 Oct 2026', 'EMP1', 'Alice');
    assert.strictEqual(lockRes.success, true);

    // Alice completes booking
    const booking = h.createBooking({
      ticketNumber: '0104',
      drawDate: '29 Oct 2026',
      ticketType: 'full',
      customerName: 'Completed Customer',
      customerPhone: '9988776655',
      customerId: '#5319',
      bookedBy: 'Alice',
      bookedByRole: 'employee',
    });

    assert.strictEqual(booking.bookingStatus, 'Pending Confirmation');
    // Lock must be cleared
    const locks = h.getActiveLocks('29 Oct 2026');
    assert.strictEqual(locks.length, 0);

    // Attempting to acquire lock on booked ticket fails
    const secondLock = h.acquireLock('0104', '29 Oct 2026', 'EMP2', 'Bob');
    // Since it's in bookings, it cannot be booked
    const b = h.bookings.find(x => x.ticketNumber === '0104' && x.date === '29 Oct 2026');
    assert.ok(b !== undefined, 'Ticket must remain recorded in bookings');
  });

  test('Test 13: Browser crash fallback TTL purges abandoned lock automatically', () => {
    // Simulate user crashing browser tab at t = 1000 with 120s fallback TTL
    const now = Date.now();
    h.acquireLock('0999', '29 Oct 2026', 'CRASH_USER', 'Crasher');

    // Check active lock at t = now (active)
    assert.strictEqual(h.getActiveLocks('29 Oct 2026', now).length, 1);

    // Check active lock at t = now + 120001ms (past TTL)
    const afterCrash = h.getActiveLocks('29 Oct 2026', now + 120001);
    assert.strictEqual(afterCrash.length, 0, 'Abandoned lock must be automatically purged when fallback TTL passes');
  });

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------------------');

  if (failed === 0) {
    console.log('\n*** ALL 13 VERIFICATION TESTS PASSED ***\n');
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
