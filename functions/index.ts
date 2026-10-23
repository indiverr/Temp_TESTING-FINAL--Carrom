/**
 * Cloud Functions for Privileged Carrom Lottery Operations
 * 
 * Provides server-side transaction safety for:
 * 1. bookTicketsTransactional (atomic ticket reservation across draws & series)
 * 2. confirmPaymentTransactional (privileged payment recording & balance updates)
 * 3. cancelOrReverseBookingTransactional (audited admin reversal)
 * 4. setUserRoleClaims (secure custom claim assignment by Admin only)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

admin.initializeApp();
const db = admin.firestore();

// 1. Transactional Ticket Booking
export const bookTickets = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const userRole = context.auth.token.role || 'employee';
  if (!['admin', 'employee', 'paid_employee'].includes(userRole)) {
    throw new functions.https.HttpsError('permission-denied', 'User lacks booking permissions.');
  }

  const { drawDate, seriesId, tickets, customerName, customerPhone } = data;
  if (!drawDate || !tickets || !Array.isArray(tickets) || tickets.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required drawDate or tickets array.');
  }

  return await db.runTransaction(async (transaction) => {
    // A. Read config for authoritative pricing
    const configDoc = await transaction.get(db.doc('config/system'));
    const configData = configDoc.exists ? configDoc.data() : { halfTicketPrice: 25, fullTicketPrice: 50, seriesTitle: 'CUSTOM NAME' };
    const halfPrice = configData?.halfTicketPrice || 25;
    const fullPrice = configData?.fullTicketPrice || 50;

    // B. Check ticket availability deterministically
    const ticketRefs = tickets.map((t: { ticketNumber: string }) => {
      const normTicket = String(t.ticketNumber).padStart(4, '0');
      return db.doc(`draws/${drawDate}/series/${seriesId || 'default'}/tickets/${normTicket}`);
    });

    const ticketSnapshots = await Promise.all(ticketRefs.map((ref) => transaction.get(ref)));

    for (let i = 0; i < ticketSnapshots.length; i++) {
      if (ticketSnapshots[i].exists && ticketSnapshots[i].data()?.bookingStatus === 'Booked') {
        throw new functions.https.HttpsError(
          'already-exists',
          `Ticket #${tickets[i].ticketNumber} is already booked for draw ${drawDate}!`
        );
      }
    }

    // C. Perform atomic reservation writes
    const bookingId = `b-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowTimestamp = FieldValue.serverTimestamp();

    tickets.forEach((t: { ticketNumber: string; half: boolean; full: boolean }, i: number) => {
      const normTicket = String(t.ticketNumber).padStart(4, '0');
      const ticketTotal = (t.half ? halfPrice : 0) + (t.full ? fullPrice : 0);

      // Lock ticket document
      transaction.set(ticketRefs[i], {
        ticketNumber: normTicket,
        drawDate,
        seriesId: seriesId || 'default',
        bookingId,
        bookingStatus: 'Booked',
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || '',
        bookedBy: context.auth?.uid,
        bookedAt: nowTimestamp,
      });

      // Write booking item
      transaction.set(db.doc(`bookings/${bookingId}_${normTicket}`), {
        id: `${bookingId}_${normTicket}`,
        bookingId,
        ticketNumber: normTicket,
        drawDate,
        seriesId: seriesId || 'default',
        seriesTitle: configData?.seriesTitle || 'CUSTOM NAME',
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || '',
        halfSelected: Boolean(t.half),
        fullSelected: Boolean(t.full),
        totalAmount: ticketTotal,
        amountPaid: 0,
        remainingBalance: ticketTotal,
        bookingStatus: 'Booked',
        paymentStatus: 'Unpaid',
        bookedBy: context.auth?.uid,
        createdAt: nowTimestamp,
      });
    });

    // Write audit event
    transaction.set(db.collection('auditEvents').doc(), {
      action: 'BOOKING_CREATED',
      bookingId,
      ticketCount: tickets.length,
      performedBy: context.auth?.uid,
      role: userRole,
      timestamp: nowTimestamp,
    });

    return { success: true, bookingId, bookedCount: tickets.length };
  });
});

// 2. Transactional Payment Confirmation (Only Admin or Paid Employee)
export const confirmPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const userRole = context.auth.token.role;
  if (userRole !== 'admin' && userRole !== 'paid_employee') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Permission Denied: Only Admin or Paid Employee can confirm payments.'
    );
  }

  const { bookingItemId, amount, paymentMethod, paymentRef, notes } = data;
  if (!bookingItemId || !amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid bookingItemId and positive amount required.');
  }

  return await db.runTransaction(async (transaction) => {
    const itemRef = db.doc(`bookings/${bookingItemId}`);
    const itemDoc = await transaction.get(itemRef);

    if (!itemDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Booking item not found.');
    }

    const itemData = itemDoc.data()!;
    if (itemData.paymentStatus === 'Paid') {
      throw new functions.https.HttpsError('failed-precondition', 'Ticket is already marked as Paid.');
    }

    const currentPaid = itemData.amountPaid || 0;
    const totalAmount = itemData.totalAmount || 0;
    const newPaid = currentPaid + amount;
    if (newPaid > totalAmount) {
      throw new functions.https.HttpsError('invalid-argument', 'Payment amount exceeds remaining balance.');
    }

    const newRemaining = totalAmount - newPaid;
    const newStatus = newRemaining === 0 ? 'Paid' : 'Partial';
    const nowTimestamp = FieldValue.serverTimestamp();

    // Update booking item
    transaction.update(itemRef, {
      amountPaid: newPaid,
      remainingBalance: newRemaining,
      paymentStatus: newStatus,
      paymentRef: paymentRef || `REC-${Date.now()}`,
      paidAt: nowTimestamp,
    });

    // Record immutable payment receipt
    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    transaction.set(db.doc(`payments/${paymentId}`), {
      paymentId,
      bookingItemId,
      ticketNumber: itemData.ticketNumber,
      customerName: itemData.customerName,
      amount,
      paymentMethod: paymentMethod || 'Cash',
      paymentRef: paymentRef || `REC-${Date.now()}`,
      confirmedBy: context.auth?.uid,
      notes: notes || '',
      createdAt: nowTimestamp,
    });

    // Audit log
    transaction.set(db.collection('auditEvents').doc(), {
      action: newStatus === 'Paid' ? 'PAYMENT_CONFIRMED' : 'PARTIAL_PAYMENT_CONFIRMED',
      paymentId,
      bookingItemId,
      amount,
      remainingBalance: newRemaining,
      performedBy: context.auth?.uid,
      timestamp: nowTimestamp,
    });

    return { success: true, remainingBalance: newRemaining, paymentStatus: newStatus };
  });
});
