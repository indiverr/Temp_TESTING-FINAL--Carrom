/**
 * Cloud Functions for Privileged Carrom Lottery Operations
 * 
 * Provides server-side transaction safety and security for:
 * 1. bookTickets (atomic ticket reservation across draws & series)
 * 2. confirmPayment (privileged payment recording & balance updates)
 * 3. cancelOrReverseBooking (audited cancellation & ticket release)
 * 4. setUserRoleClaims (secure custom claim assignment & username directory management by Admin only)
 * 5. authenticateUsername (server-side username-to-Firebase-Auth login without public directory exposure)
 * 6. requestFirstLoginOtp (server-side 6-digit OTP generation, rate limiting, and email delivery from carromlotterydesk@gmail.com)
 * 7. verifyFirstLoginOtp (constant-time OTP verification, 5-min expiry, attempt limiting, and permanent verification claim)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
import * as tls from 'tls';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'demo-carrom-lottery',
  });
}
const db = admin.firestore();

export const OTP_SENDER_EMAIL = 'carromlotterydesk@gmail.com';
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_SENDS_PER_HOUR = 5;

function maskEmailAddress(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const [local, domain] = parts;
  const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function hashOtpWithSalt(otpCode: string, salt: string): string {
  return crypto
    .createHash('sha256')
    .update(`${salt}:${otpCode.trim()}`)
    .digest('hex');
}

/**
 * Sends an OTP email over authenticated SMTPS (smtp.gmail.com:465)
 * using sender account carromlotterydesk@gmail.com and server-side secret SMTP_APP_PASSWORD.
 * Never logs OTP codes, passwords, or SMTP credentials.
 */
async function sendOtpEmailViaSmtp(
  recipientEmail: string,
  otpCode: string,
  displayName: string
): Promise<void> {
  const appPassword = process.env.SMTP_APP_PASSWORD || '';
  const isEmulator =
    process.env.FUNCTIONS_EMULATOR === 'true' ||
    Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  if (!appPassword) {
    if (isEmulator) {
      // In local emulator mode without live SMTP secret, do not fail emulator tests
      return;
    }
    throw new functions.https.HttpsError(
      'failed-precondition',
      `Email delivery is not configured on the server. Configure the server-side secret SMTP_APP_PASSWORD for sender ${OTP_SENDER_EMAIL}.`
    );
  }

  return new Promise<void>((resolve, reject) => {
    const socket = tls.connect(
      {
        host: 'smtp.gmail.com',
        port: 465,
        servername: 'smtp.gmail.com',
        rejectUnauthorized: true,
      },
      () => {
        // Connected over TLS
      }
    );

    socket.setTimeout(15000);

    let step = 0;
    let buffer = '';

    const sendLine = (cmd: string) => {
      socket.write(`${cmd}\r\n`);
    };

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      if (!buffer.endsWith('\r\n')) return;
      const lines = buffer.trim().split('\r\n');
      const lastLine = lines[lines.length - 1];
      // Wait if multi-line response continues (e.g. "250-...")
      if (/^\d{3}-/.test(lastLine)) return;
      buffer = '';

      const code = parseInt(lastLine.slice(0, 3), 10);

      if (step === 0 && code === 220) {
        step = 1;
        sendLine('EHLO carromlotterydesk.local');
      } else if (step === 1 && code === 250) {
        step = 2;
        sendLine('AUTH LOGIN');
      } else if (step === 2 && code === 334) {
        step = 3;
        sendLine(Buffer.from(OTP_SENDER_EMAIL, 'utf8').toString('base64'));
      } else if (step === 3 && code === 334) {
        step = 4;
        sendLine(Buffer.from(appPassword, 'utf8').toString('base64'));
      } else if (step === 4 && code === 235) {
        step = 5;
        sendLine(`MAIL FROM:<${OTP_SENDER_EMAIL}>`);
      } else if (step === 5 && code === 250) {
        step = 6;
        sendLine(`RCPT TO:<${recipientEmail}>`);
      } else if (step === 6 && code === 250) {
        step = 7;
        sendLine('DATA');
      } else if (step === 7 && code === 354) {
        step = 8;
        const subject = 'Carrom Lottery Desk - First-Login Verification Code';
        const messageBody = [
          `From: "Carrom Lottery Desk" <${OTP_SENDER_EMAIL}>`,
          `To: <${recipientEmail}>`,
          `Subject: ${subject}`,
          'MIME-Version: 1.0',
          'Content-Type: text/plain; charset=UTF-8',
          '',
          `Hello ${displayName || 'Operator'},`,
          '',
          `Your one-time verification code for first-time login to Carrom Lottery Desk is: ${otpCode}`,
          '',
          'This verification code expires in 5 minutes. Do not share this code with anyone.',
          '',
          'Regards,',
          'Carrom Lottery Desk Security',
          '.',
        ].join('\r\n');
        sendLine(messageBody);
      } else if (step === 8 && code === 250) {
        step = 9;
        sendLine('QUIT');
        socket.end();
        resolve();
      } else {
        socket.destroy();
        reject(
          new functions.https.HttpsError(
            'internal',
            `SMTP delivery failed at step ${step} (code ${code}).`
          )
        );
      }
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new functions.https.HttpsError('deadline-exceeded', 'SMTP server connection timed out.'));
    });

    socket.on('error', () => {
      socket.destroy();
      reject(new functions.https.HttpsError('internal', 'SMTP connection error while sending verification email.'));
    });
  });
}

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
      paymentStatus: newStatus,
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

// 3. Transactional Cancellation & Reversal (Admin or Paid Employee)
export const cancelOrReverseBooking = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const userRole = context.auth.token.role;
  if (userRole !== 'admin' && userRole !== 'paid_employee') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Permission Denied: Only Admin or Paid Employee can cancel or reverse bookings.'
    );
  }

  const { ticketNumber, drawDate, seriesId, reason, bookingItemId } = data;
  if (!ticketNumber || !drawDate) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required ticketNumber or drawDate.'
    );
  }

  const normTicket = String(ticketNumber).padStart(4, '0');
  const targetSeries = seriesId || 'default';

  return await db.runTransaction(async (transaction) => {
    // A. Locate the ticket reservation doc
    const ticketRef = db.doc(`draws/${drawDate}/series/${targetSeries}/tickets/${normTicket}`);
    const ticketSnap = await transaction.get(ticketRef);

    // B. Locate the booking document
    let bookingRef = bookingItemId ? db.doc(`bookings/${bookingItemId}`) : null;
    let bookingData: any = null;

    if (bookingRef) {
      const bSnap = await transaction.get(bookingRef);
      if (bSnap.exists) {
        bookingData = bSnap.data();
      }
    }

    if (!bookingData) {
      const q = await db
        .collection('bookings')
        .where('ticketNumber', '==', normTicket)
        .where('drawDate', '==', drawDate)
        .where('bookingStatus', '==', 'Booked')
        .limit(1)
        .get();

      if (!q.empty) {
        bookingRef = q.docs[0].ref;
        bookingData = q.docs[0].data();
      }
    }

    if (!bookingData || !bookingRef) {
      throw new functions.https.HttpsError('not-found', `Active booking for ticket #${normTicket} not found.`);
    }

    if (bookingData.bookingStatus === 'Cancelled') {
      throw new functions.https.HttpsError('failed-precondition', 'Ticket booking is already cancelled.');
    }

    const nowTimestamp = FieldValue.serverTimestamp();
    const cancellationReason = reason || 'Customer requested cancellation';

    // C. Release the ticket lock so it becomes available on the grid and available sheet
    if (ticketSnap.exists) {
      transaction.delete(ticketRef);
    }

    // D. Mark booking as cancelled
    transaction.update(bookingRef, {
      bookingStatus: 'Cancelled',
      remainingBalance: 0,
      cancellationReason,
      cancelledBy: context.auth?.uid,
      cancelledByRole: userRole,
      cancelledAt: nowTimestamp,
    });

    // E. Record audit log
    transaction.set(db.collection('auditEvents').doc(), {
      action: 'BOOKING_CANCELLED',
      ticketNumber: normTicket,
      bookingId: bookingData.bookingId || bookingData.id,
      drawDate,
      reason: cancellationReason,
      refundAmount: bookingData.amountPaid || 0,
      performedBy: context.auth?.uid,
      role: userRole,
      timestamp: nowTimestamp,
    });

    return {
      success: true,
      ticketNumber: normTicket,
      bookingStatus: 'Cancelled',
      released: true,
    };
  });
});

// 4. Secure Custom User Claims Assignment & Directory Mapping (Admin Only)
export const setUserRoleClaims = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const callerRole = context.auth.token.role;
  if (callerRole !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Permission Denied: Only Admin can assign user roles.'
    );
  }

  const { targetUid, role, displayName, phone, username, email } = data;
  if (!targetUid || !role || !['admin', 'employee', 'paid_employee'].includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Valid targetUid and role (admin | employee | paid_employee) required.'
    );
  }

  const userRecord = await admin.auth().getUser(targetUid);
  const existingClaims = userRecord.customClaims || {};

  // Set Auth Custom User Claims while preserving verification claims
  await admin.auth().setCustomUserClaims(targetUid, { ...existingClaims, role });

  const nowTimestamp = FieldValue.serverTimestamp();
  const resolvedEmail = email || userRecord.email || '';
  const resolvedUsername = (username || displayName || '').trim();

  // Update Firestore user document
  await db.doc(`users/${targetUid}`).set(
    {
      uid: targetUid,
      role,
      displayName: displayName || userRecord.displayName || '',
      username: resolvedUsername,
      usernameLower: resolvedUsername.toLowerCase(),
      email: resolvedEmail,
      phone: phone || '',
      updatedAt: nowTimestamp,
      assignedBy: context.auth.uid,
    },
    { merge: true }
  );

  // Maintain private server-only username-to-account lookup directory
  if (resolvedUsername && resolvedEmail) {
    await db.doc(`userDirectory/${resolvedUsername.toLowerCase()}`).set({
      uid: targetUid,
      email: resolvedEmail,
      role,
      displayName: displayName || resolvedUsername,
      updatedAt: nowTimestamp,
    });
  }

  // Audit event
  await db.collection('auditEvents').add({
    action: 'USER_ROLE_ASSIGNED',
    targetUid,
    assignedRole: role,
    performedBy: context.auth.uid,
    timestamp: nowTimestamp,
  });

  return { success: true, targetUid, assignedRole: role };
});

// 5. Server-Side Username-to-Account Login (Never exposes public username-to-email directory)
export const authenticateUsername = functions.https.onCall(async (data) => {
  const { username, password } = data || {};
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Username and password are required.');
  }

  const normUsername = username.trim().toLowerCase();

  // Look up in private server-only userDirectory or users collection
  let targetUid = '';
  let targetEmail = '';
  let targetRole = 'employee';
  let targetName = username.trim();

  const dirSnap = await db.doc(`userDirectory/${normUsername}`).get();
  if (dirSnap.exists) {
    const dirData = dirSnap.data()!;
    targetUid = dirData.uid;
    targetEmail = dirData.email;
    targetRole = dirData.role || 'employee';
    targetName = dirData.displayName || targetName;
  } else {
    const userQuery = await db
      .collection('users')
      .where('usernameLower', '==', normUsername)
      .limit(1)
      .get();
    if (!userQuery.empty) {
      const uData = userQuery.docs[0].data();
      targetUid = userQuery.docs[0].id;
      targetEmail = uData.email || '';
      targetRole = uData.role || 'employee';
      targetName = uData.displayName || uData.name || targetName;
    }
  }

  if (!targetEmail || !targetUid) {
    throw new functions.https.HttpsError('not-found', 'Invalid username or password.');
  }

  // Verify password against Firebase Auth Identity Toolkit REST endpoint
  const apiKey = process.env.FIREBASE_WEB_API_KEY || 'fake-emulator-api-key';
  const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const signInUrl = authEmulatorHost
    ? `http://${authEmulatorHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`
    : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

  const authRes = await fetch(signInUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: targetEmail,
      password,
      returnSecureToken: true,
    }),
  });

  if (!authRes.ok) {
    throw new functions.https.HttpsError('unauthenticated', 'Invalid username or password.');
  }

  const userRecord = await admin.auth().getUser(targetUid);
  const claims = userRecord.customClaims || {};
  const otpVerified = Boolean(claims.otpVerified);
  const customToken = await admin.auth().createCustomToken(targetUid, {
    ...claims,
    role: claims.role || targetRole,
    otpVerified,
  });

  return {
    success: true,
    customToken,
    otpVerified,
    role: claims.role || targetRole,
    displayName: targetName,
    maskedEmail: maskEmailAddress(targetEmail),
  };
});

// 6. Request First-Login Email OTP (5-min expiry, 60s resend cooldown, hourly rate limit)
export const requestFirstLoginOtp = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in before requesting verification.');
  }

  const uid = context.auth.uid;
  const userRecord = await admin.auth().getUser(uid);
  const userDocRef = db.doc(`users/${uid}`);
  const userDoc = await userDocRef.get();
  const userData = userDoc.exists ? userDoc.data() : {};

  // Check if already verified
  const alreadyVerified =
    userRecord.customClaims?.otpVerified === true &&
    userData?.otpVerified === true;

  if (alreadyVerified) {
    return {
      success: true,
      alreadyVerified: true,
      role: userRecord.customClaims?.role || userData?.role || 'employee',
    };
  }

  const recipientEmail = userRecord.email || userData?.email;
  if (!recipientEmail) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'No registered email address found for this account. Contact Administrator to link your email.'
    );
  }

  const displayName = userRecord.displayName || userData?.displayName || userData?.name || 'Operator';
  const now = Date.now();
  const otpCode = crypto.randomInt(100000, 1000000).toString();
  const salt = crypto.randomBytes(16).toString('hex');
  const otpHash = hashOtpWithSalt(otpCode, salt);

  const challengeRef = db.doc(`otpChallenges/${uid}`);

  await db.runTransaction(async (transaction) => {
    const challengeSnap = await transaction.get(challengeRef);
    let windowStart = now;
    let sendCount = 0;

    if (challengeSnap.exists) {
      const prev = challengeSnap.data()!;
      const elapsedSinceLastSend = now - (prev.lastSentAt || 0);

      if (elapsedSinceLastSend < OTP_RESEND_COOLDOWN_MS) {
        const waitSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsedSinceLastSend) / 1000);
        throw new functions.https.HttpsError(
          'resource-exhausted',
          `Please wait ${waitSec} seconds before requesting another verification code.`
        );
      }

      if (prev.windowStart && now - prev.windowStart < 60 * 60 * 1000) {
        windowStart = prev.windowStart;
        sendCount = prev.sendCount || 0;
        if (sendCount >= OTP_MAX_SENDS_PER_HOUR) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            'Maximum hourly OTP requests reached (5 per hour). Please try again later.'
          );
        }
      }
    }

    transaction.set(challengeRef, {
      uid,
      otpHash,
      salt,
      expiresAt: now + OTP_EXPIRY_MS,
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      lastSentAt: now,
      windowStart,
      sendCount: sendCount + 1,
      used: false,
      senderEmail: OTP_SENDER_EMAIL,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  // Deliver OTP via server-side SMTP from carromlotterydesk@gmail.com to user's registered email
  await sendOtpEmailViaSmtp(recipientEmail, otpCode, displayName);

  return {
    success: true,
    alreadyVerified: false,
    maskedEmail: maskEmailAddress(recipientEmail),
    senderEmail: OTP_SENDER_EMAIL,
    expiresInSeconds: 300,
    resendCooldownSeconds: 60,
  };
});

// 7. Verify First-Login Email OTP
export const verifyFirstLoginOtp = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in to verify OTP.');
  }

  const uid = context.auth.uid;
  const otpCode = typeof data?.otpCode === 'string' ? data.otpCode.trim() : '';

  if (!/^\d{6}$/.test(otpCode)) {
    throw new functions.https.HttpsError('invalid-argument', 'Verification code must be a 6-digit number.');
  }

  const challengeRef = db.doc(`otpChallenges/${uid}`);
  const userRef = db.doc(`users/${uid}`);
  const now = Date.now();

  const txResult = await db.runTransaction(async (transaction) => {
    const [challengeSnap, userSnap] = await Promise.all([
      transaction.get(challengeRef),
      transaction.get(userRef),
    ]);

    if (!challengeSnap.exists) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No active verification code found. Please request a new code.'
      );
    }

    const challenge = challengeSnap.data()!;
    if (challenge.used) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This verification code has already been used. Please request a new code.'
      );
    }

    if (now > challenge.expiresAt) {
      transaction.update(challengeRef, { used: true, expiredAt: FieldValue.serverTimestamp() });
      throw new functions.https.HttpsError(
        'deadline-exceeded',
        'Verification code has expired (5-minute limit). Please request a new code.'
      );
    }

    const currentAttempts = challenge.attempts || 0;
    const maxAttempts = challenge.maxAttempts || OTP_MAX_ATTEMPTS;

    if (currentAttempts >= maxAttempts) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Maximum incorrect attempts exceeded. Please request a new verification code.'
      );
    }

    const candidateHash = hashOtpWithSalt(otpCode, challenge.salt);
    const expectedBuf = Buffer.from(challenge.otpHash, 'hex');
    const candidateBuf = Buffer.from(candidateHash, 'hex');

    const isMatch =
      expectedBuf.length === candidateBuf.length &&
      crypto.timingSafeEqual(expectedBuf, candidateBuf);

    if (!isMatch) {
      const nextAttempts = currentAttempts + 1;
      transaction.update(challengeRef, {
        attempts: nextAttempts,
        lastAttemptAt: FieldValue.serverTimestamp(),
      });
      return {
        verified: false,
        remainingAttempts: Math.max(0, maxAttempts - nextAttempts),
        role: userSnap.exists ? userSnap.data()?.role || 'employee' : 'employee',
      };
    }

    // Valid OTP — invalidate challenge immediately to prevent reuse
    transaction.update(challengeRef, {
      used: true,
      otpHash: '',
      verifiedAt: FieldValue.serverTimestamp(),
    });

    const existingRole =
      (userSnap.exists && userSnap.data()?.role) ||
      context.auth?.token.role ||
      'employee';

    transaction.set(
      userRef,
      {
        uid,
        role: existingRole,
        otpVerified: true,
        firstLoginCompleted: true,
        otpVerifiedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(db.collection('auditEvents').doc(), {
      action: 'FIRST_LOGIN_OTP_VERIFIED',
      uid,
      role: existingRole,
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      verified: true,
      remainingAttempts: maxAttempts - currentAttempts,
      role: existingRole,
    };
  });

  if (!txResult.verified) {
    return {
      success: false,
      verified: false,
      remainingAttempts: txResult.remainingAttempts,
      error:
        txResult.remainingAttempts > 0
          ? `Incorrect verification code. ${txResult.remainingAttempts} attempt(s) remaining.`
          : 'Maximum incorrect attempts reached. Please request a new verification code.',
    };
  }

  // Persist permanent verification claim in Firebase Auth so OTP is not required on subsequent logins
  const userRecord = await admin.auth().getUser(uid);
  const existingClaims = userRecord.customClaims || {};
  const finalRole = existingClaims.role || txResult.role || 'employee';

  await admin.auth().updateUser(uid, { emailVerified: true });
  await admin.auth().setCustomUserClaims(uid, {
    ...existingClaims,
    role: finalRole,
    otpVerified: true,
  });

  return {
    success: true,
    verified: true,
    role: finalRole,
  };
});
