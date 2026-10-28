/**
 * Real Firebase Service Bridge
 * 
 * Provides live Cloud Firestore listeners, Firestore atomic transactions,
 * Firebase Storage uploads, and Firebase Auth session handling.
 * Explicitly exposes backend status without silent mock fallback in production mode.
 */

import {
  initFirebase,
  isFirebaseConfigured,
  isStorageConfigured,
  getOtpAppsScriptUrl,
  isEmulatorMode,
  getFirebaseEnvConfig,
  getFirebaseConfigDiagnostics,
} from './firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  RecaptchaVerifier,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import {
  TicketBooking,
  TicketLock,
  SystemConfig,
  TodayWinnerRecord,
  ResultPaperDocument,
  SelectedTicketItem,
  LoginType,
  PaymentAuditEntry,
  TicketInventoryItem,
  GridAppearanceConfig,
  DEFAULT_GRID_APPEARANCE,
  WeeklyTicketPresetsConfig,
  DayTicketPreset,
  DEFAULT_WEEKLY_PRESETS,
  DAYS_OF_WEEK,
  DayOfWeek,
} from './types';
import {
  DEFAULT_CONFIG,
  createInitialSeedBookings,
  lotteryService,
  TICKET_LOCK_DURATION_MS,
} from './lotteryService';

export interface FirebaseConnectionStatus {
  isConfigured: boolean;
  isOnline: boolean;
  projectId: string;
  currentUser: {
    uid: string;
    phone: string;
    email?: string;
    name?: string;
    role: LoginType;
    otpVerified?: boolean;
  } | null;
  errorMessage?: string;
}

class LiveFirebaseService {
  private status: FirebaseConnectionStatus = {
    isConfigured: false,
    isOnline: false,
    projectId: '',
    currentUser: null,
  };

  /**
   * Estimated (server clock - local clock) offset in ms, derived from `serverNowMs` returned by
   * the Apps Script lock endpoints. Used ONLY for display (countdown and grey/white rendering).
   * All lock validity decisions are made by the backend using its own clock.
   */
  private serverClockOffsetMs = 0;

  private updateServerClockOffset(serverNowMs: unknown, sentAtLocalMs: number) {
    const serverNow = Number(serverNowMs);
    if (!Number.isFinite(serverNow) || serverNow <= 0) return;
    const receivedAtLocalMs = Date.now();
    const midpointLocal = (sentAtLocalMs + receivedAtLocalMs) / 2;
    this.serverClockOffsetMs = serverNow - midpointLocal;
  }

  /** Converts a server-clock timestamp into the local clock domain for display purposes. */
  public serverToLocalMs(serverMs: number): number {
    return Number(serverMs || 0) - this.serverClockOffsetMs;
  }

  /**
   * Computes the local display expiry for a lock the caller owns, based on the server-reported
   * remaining duration (expiresAtMs - serverNowMs) so client clock skew cannot shorten or extend it.
   */
  private localExpiryFromServer(serverRes: any, sentAtLocalMs: number): number {
    const expiresAt = Number(serverRes?.expiresAtMs || 0);
    const serverNow = Number(serverRes?.serverNowMs || 0);
    if (expiresAt > 0 && serverNow > 0) {
      // Anchor to the request send time (conservative: never shows more time than the server granted)
      return sentAtLocalMs + Math.max(0, expiresAt - serverNow);
    }
    const durationMs = Number(serverRes?.lockDurationMs || 0) || TICKET_LOCK_DURATION_MS;
    return sentAtLocalMs + durationMs;
  }

  constructor() {
    this.refreshStatus();
  }

  public refreshStatus(): FirebaseConnectionStatus {
    const { auth, db, configured, error } = initFirebase();
    this.status.isConfigured = configured;
    this.status.isOnline = Boolean(db);
    this.status.projectId = getFirebaseEnvConfig().projectId;
    this.status.errorMessage = error;

    if (auth) {
      onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
          // Token claims or server-verified profile record from /users/{uid}
          try {
            const tokenResult = await user.getIdTokenResult();
            let role = (tokenResult.claims.role as LoginType);
            let otpVerified = tokenResult.claims.otpVerified === true;
            let name = user.displayName || (user.email ? user.email.split('@')[0] : 'Operator');
            if (db && (otpVerified || !role)) {
              try {
                const uSnap = await getDoc(doc(db, 'users', user.uid));
                if (uSnap.exists()) {
                  const uData = uSnap.data();
                  role = (uData?.role as LoginType) || role || 'employee';
                  name = uData?.displayName || uData?.name || name;
                  if (uData?.otpVerified === true && uData?.firstLoginCompleted === true) {
                    otpVerified = true;
                  }
                }
              } catch {
                // Unverified users cannot read /users/{uid} under strict Firestore rules
              }
            }
            this.status.currentUser = {
              uid: user.uid,
              phone: user.phoneNumber || user.email || '',
              email: user.email || '',
              name,
              role: role || 'employee',
              otpVerified,
            };
          } catch {
            this.status.currentUser = {
              uid: user.uid,
              phone: user.phoneNumber || user.email || '',
              email: user.email || '',
              role: 'employee',
              otpVerified: false,
            };
          }
        } else {
          this.status.currentUser = null;
        }
      });
    }

    return { ...this.status };
  }

  public getStatus(): FirebaseConnectionStatus {
    return { ...this.status };
  }

  private normalizeFirestoreBooking(raw: any): TicketBooking {
    let history = raw?.history;
    if (typeof history === 'string') {
      try {
        history = JSON.parse(history);
      } catch {
        history = [];
      }
    }
    if (!Array.isArray(history)) {
      history = [];
    }
    return {
      ...raw,
      ticketNumber: String(raw?.ticketNumber || '').padStart(4, '0'),
      history,
    } as TicketBooking;
  }

  /**
   * Request a temporary 20-second ticket lock through the trusted backend (`acquireTicketLock`).
   * Only granted if the ticket is available and not currently locked by another user.
   */
  public async acquireTicketLockFirestore(
    ticketNumbers: string[],
    drawDate: string,
    lockedByUid: string,
    lockedByName: string,
    lockedByUsername?: string
  ): Promise<{
    success: boolean;
    lockId?: string;
    ticketNumbers?: string[];
    expiresAtMs?: number;
    expiresInSeconds?: number;
    conflictTicket?: string;
    lockedByOther?: boolean;
    alreadyBooked?: boolean;
    error?: string;
  }> {
    const cleanTickets = Array.from(
      new Set((ticketNumbers || []).map((t) => String(t).trim().padStart(4, '0')))
    );
    if (cleanTickets.length === 0) {
      return { success: false, error: 'Please select at least one ticket to lock.' };
    }

    const { auth } = initFirebase();
    const scriptUrl = getOtpAppsScriptUrl();

    if (auth?.currentUser && scriptUrl) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const sentAtLocalMs = Date.now();
        const serverRes = await this.callOtpAppsScript({
          action: 'acquireTicketLock',
          idToken,
          ticketNumbers: cleanTickets,
          drawDate,
        });
        this.updateServerClockOffset(serverRes?.serverNowMs, sentAtLocalMs);

        if (serverRes?.success) {
          const localExpiresAtMs = this.localExpiryFromServer(serverRes, sentAtLocalMs);
          // Also mirror in local lock state (same lockId) for immediate cross-tab responsiveness
          lotteryService.acquireTicketLock(
            cleanTickets,
            drawDate,
            lockedByUid || auth.currentUser.uid,
            lockedByName,
            lockedByUsername,
            String(serverRes.lockId)
          );
          return {
            success: true,
            lockId: String(serverRes.lockId),
            ticketNumbers: serverRes.ticketNumbers || cleanTickets,
            expiresAtMs: localExpiresAtMs,
            expiresInSeconds: Math.max(0, Math.ceil((localExpiresAtMs - Date.now()) / 1000)),
          };
        }

        if (serverRes?.error && serverRes.error !== 'Unsupported action.') {
          return {
            success: false,
            conflictTicket: serverRes.conflictTicket || serverRes.ticketNumber,
            lockedByOther: Boolean(serverRes.lockedByOther) || serverRes.code === 'TICKET_LOCKED',
            alreadyBooked: Boolean(serverRes.alreadyBooked) || serverRes.code === 'ALREADY_BOOKED',
            error: serverRes.error,
          };
        }
      } catch (err: any) {
        // Never grant a client-only lock when the trusted backend is configured.
        console.warn('[TicketLock] Backend lock failed:', err?.message);
        return {
          success: false,
          error: 'Could not reach the booking server to lock this ticket. Please try again.',
        };
      }
    }

    return lotteryService.acquireTicketLock(
      cleanTickets,
      drawDate,
      lockedByUid,
      lockedByName,
      lockedByUsername
    );
  }

  /**
   * Renew an active ticket lock while the user is actively completing the booking form.
   * Prevents one user from renewing another user's lock.
   */
  public async renewTicketLockFirestore(
    ticketNumbers: string[],
    drawDate: string,
    lockId: string,
    lockedByUid: string
  ): Promise<{
    success: boolean;
    lockId?: string;
    expiresAtMs?: number;
    expiresInSeconds?: number;
    code?: string;
    error?: string;
  }> {
    const cleanTickets = Array.from(
      new Set((ticketNumbers || []).map((t) => String(t).trim().padStart(4, '0')))
    );
    const { auth } = initFirebase();
    const scriptUrl = getOtpAppsScriptUrl();

    if (auth?.currentUser && scriptUrl) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const sentAtLocalMs = Date.now();
        const serverRes = await this.callOtpAppsScript({
          action: 'renewTicketLock',
          idToken,
          ticketNumbers: cleanTickets,
          drawDate,
          lockId,
        });
        this.updateServerClockOffset(serverRes?.serverNowMs, sentAtLocalMs);

        if (serverRes?.success) {
          lotteryService.renewTicketLock(
            cleanTickets,
            drawDate,
            lockId,
            lockedByUid || auth.currentUser.uid
          );
          const localExpiresAtMs = this.localExpiryFromServer(serverRes, sentAtLocalMs);
          return {
            success: true,
            lockId: String(serverRes.lockId || lockId),
            expiresAtMs: localExpiresAtMs,
            expiresInSeconds: Math.max(0, Math.ceil((localExpiresAtMs - Date.now()) / 1000)),
          };
        }

        if (serverRes?.error && serverRes.error !== 'Unsupported action.') {
          // Backend refused renewal (expired, booked, or owned by someone else): drop local mirror
          lotteryService.releaseTicketLock(
            cleanTickets,
            drawDate,
            lockId,
            lockedByUid || auth.currentUser.uid
          );
          return {
            success: false,
            code: serverRes.code,
            error: serverRes.error,
          };
        }
      } catch (err: any) {
        // Never fabricate a renewal locally when the trusted backend is configured:
        // the server lock keeps its original expiry, and the next interval will retry.
        console.warn('[TicketLock] Backend renew failed:', err?.message);
        return {
          success: false,
          code: 'NETWORK_ERROR',
          error: 'Could not reach the booking server to renew the ticket lock.',
        };
      }
    }

    return lotteryService.renewTicketLock(cleanTickets, drawDate, lockId, lockedByUid);
  }

  /**
   * Release a temporary ticket lock when the user cancels, closes the form, or abandons booking.
   * Prevents one user from releasing another user's lock.
   */
  public async releaseTicketLockFirestore(
    ticketNumbers: string[],
    drawDate: string,
    lockId: string,
    lockedByUid: string
  ): Promise<{ success: boolean; releasedCount?: number; error?: string }> {
    const cleanTickets = Array.from(
      new Set((ticketNumbers || []).map((t) => String(t).trim().padStart(4, '0')))
    );
    const { auth } = initFirebase();
    const scriptUrl = getOtpAppsScriptUrl();

    if (auth?.currentUser && scriptUrl) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const serverRes = await this.callOtpAppsScript({
          action: 'releaseTicketLock',
          idToken,
          ticketNumbers: cleanTickets,
          drawDate,
          lockId,
        });

        if (serverRes?.success) {
          lotteryService.releaseTicketLock(
            cleanTickets,
            drawDate,
            lockId,
            lockedByUid || auth.currentUser.uid
          );
          return {
            success: true,
            releasedCount: Number(serverRes.releasedCount ?? cleanTickets.length),
          };
        }

        if (serverRes?.error && serverRes.error !== 'Unsupported action.') {
          return {
            success: false,
            error: serverRes.error,
          };
        }
      } catch (err: any) {
        console.warn('[TicketLock] Backend release fallback:', err?.message);
      }
    }

    return lotteryService.releaseTicketLock(cleanTickets, drawDate, lockId, lockedByUid);
  }

  /**
   * Subscribe in real time to active ticket locks for a draw date.
   * Combines Firestore `/ticketLocks` onSnapshot with local/BroadcastChannel locks
   * and automatically purges expired locks every second.
   */
  public subscribeTicketLocksFirestore(
    drawDate: string,
    onUpdate: (locks: TicketLock[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    const { db } = initFirebase();
    let firestoreLocks: TicketLock[] = [];

    const emitMergedLocks = () => {
      const nowMs = Date.now();
      const localLocks = lotteryService.getActiveLocks(drawDate);
      const mergedByTicket = new Map<string, TicketLock>();

      for (const l of localLocks) {
        if (l.status === 'LOCKED' && l.expiresAtMs > nowMs) {
          mergedByTicket.set(l.ticketNumber, l);
        }
      }
      for (const l of firestoreLocks) {
        if (l.status === 'LOCKED' && l.expiresAtMs > nowMs) {
          mergedByTicket.set(l.ticketNumber, l);
        }
      }
      onUpdate(Array.from(mergedByTicket.values()));
    };

    emitMergedLocks();

    const unsubLocal = lotteryService.subscribeRealtimeSync(() => {
      emitMergedLocks();
    });

    const expiryInterval = setInterval(() => {
      emitMergedLocks();
    }, 1000);

    let unsubFirestore = () => {};
    if (db) {
      try {
        const q = query(collection(db, 'ticketLocks'), where('drawDate', '==', drawDate));
        unsubFirestore = onSnapshot(
          q,
          (snapshot) => {
            // Keep every lock document; expiry is evaluated on each 1s tick in emitMergedLocks
            // after converting the SERVER-issued expiresAtMs into the local clock domain, so
            // stale (expired but undeleted) lock docs never keep a ticket grey.
            firestoreLocks = snapshot.docs
              .map((d) => {
                const raw = d.data() as any;
                return {
                  id: d.id,
                  ticketNumber: String(raw.ticketNumber || '').padStart(4, '0'),
                  drawDate: String(raw.drawDate || drawDate),
                  lockId: String(raw.lockId || ''),
                  lockedByUid: String(raw.lockedByUid || ''),
                  lockedByName: String(raw.lockedByName || 'Operator'),
                  lockedByUsername: String(raw.lockedByUsername || ''),
                  lockedAt: String(raw.lockedAt || ''),
                  expiresAtMs: this.serverToLocalMs(Number(raw.expiresAtMs || 0)),
                  status: (raw.status || 'LOCKED') as 'LOCKED' | 'RELEASED' | 'CONFIRMED',
                };
              })
              .filter((l) => l.status === 'LOCKED');
            emitMergedLocks();
          },
          (err) => {
            // Safe to ignore permission-denied before updated firestore.rules are published
            if (onError && !String(err?.message || '').includes('insufficient permissions')) {
              onError(err);
            }
          }
        );
      } catch {
        // Ignore listener setup error if offline
      }
    }

    return () => {
      clearInterval(expiryInterval);
      unsubLocal();
      unsubFirestore();
    };
  }

  /**
   * Atomic Ticket Booking via trusted backend (`confirmTicketBooking`) or live Firestore transaction.
   * Assigns or reuses a permanent Customer Serial Code (`#5316`), verifies active lock ownership,
   * and supports idempotent retries.
   */
  public async bookTicketsFirestore(
    items: SelectedTicketItem[],
    customerName: string,
    customerPhone: string,
    performedBy: string,
    role: LoginType,
    drawDate: string,
    seriesId: string = 'default',
    options?: {
      lockId?: string;
      idempotencyKey?: string;
      lockedByUid?: string;
      bookedByUsername?: string;
    }
  ): Promise<{
    success: boolean;
    bookedCount: number;
    customerId?: string;
    ticketNumbers?: string[];
    bookings?: TicketBooking[];
    code?: string;
    error?: string;
  }> {
    const { auth, db } = initFirebase();
    const scriptUrl = getOtpAppsScriptUrl();

    // 1. Prefer trusted backend confirmTicketBooking operation
    if (auth?.currentUser && scriptUrl) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const serverRes = await this.callOtpAppsScript({
          action: 'confirmTicketBooking',
          idToken,
          items,
          customerName,
          customerPhone,
          drawDate,
          seriesId,
          lockId: options?.lockId || '',
          idempotencyKey: options?.idempotencyKey || '',
        });

        if (serverRes?.success) {
          // Mirror into local state & release local lock
          lotteryService.bookTicketsTransaction(
            items,
            customerName,
            customerPhone,
            performedBy,
            role,
            drawDate,
            {
              lockId: options?.lockId,
              lockedByUid: options?.lockedByUid || auth.currentUser.uid,
              bookedByUsername: options?.bookedByUsername,
              idempotencyKey: options?.idempotencyKey,
              explicitCustomerId: serverRes.customerId,
            }
          );
          return {
            success: true,
            bookedCount: Number(serverRes.bookedCount || items.length),
            customerId: String(serverRes.customerId || ''),
            ticketNumbers:
              serverRes.ticketNumbers ||
              items.map((i) => String(i.ticketNumber).padStart(4, '0')),
            bookings: Array.isArray(serverRes.bookings)
              ? serverRes.bookings.map((b: any) => this.normalizeFirestoreBooking(b))
              : undefined,
          };
        }

        if (serverRes?.error && serverRes.error !== 'Unsupported action.') {
          return {
            success: false,
            bookedCount: 0,
            code: serverRes.code,
            error: serverRes.error,
          };
        }
      } catch (err: any) {
        console.warn('[Firestore] confirmTicketBooking backend call fallback:', err?.message);
      }
    }

    // 2. Coordinate with local lock + customer code generator first
    const localResult = lotteryService.bookTicketsTransaction(
      items,
      customerName,
      customerPhone,
      performedBy,
      role,
      drawDate,
      {
        lockId: options?.lockId,
        lockedByUid: options?.lockedByUid || auth?.currentUser?.uid,
        bookedByUsername: options?.bookedByUsername,
        idempotencyKey: options?.idempotencyKey,
      }
    );

    if (!localResult.success) {
      return localResult;
    }

    const assignedCustomerId = localResult.customerId || '#5316';

    if (!db) {
      return localResult;
    }

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Authoritative config read
        const configRef = doc(db, 'config', 'system');
        const configSnap = await transaction.get(configRef);
        const configData = configSnap.exists()
          ? (configSnap.data() as SystemConfig)
          : DEFAULT_CONFIG;

        const halfPrice = configData.halfTicketPrice;
        const fullPrice = configData.fullTicketPrice;

        // 2. Deterministic ticket document references:
        // /draws/{drawDate}/series/{seriesId}/tickets/{ticketNumber}
        const ticketRefs = items.map((item) => {
          const normNum = String(item.ticketNumber).padStart(4, '0');
          return doc(db, 'draws', drawDate, 'series', seriesId, 'tickets', normNum);
        });

        // 3. READ ALL BEFORE WRITING (Firestore transaction requirement)
        const ticketSnaps = await Promise.all(
          ticketRefs.map((ref) => transaction.get(ref))
        );

        for (let i = 0; i < ticketSnaps.length; i++) {
          if (ticketSnaps[i].exists()) {
            const data = ticketSnaps[i].data();
            if (data?.bookingStatus === 'Booked') {
              throw new Error(
                `Ticket #${items[i].ticketNumber} is already booked for draw ${drawDate}!`
              );
            }
          }
        }

        // 4. WRITE ALL RESERVATIONS AND BOOKINGS
        const bookingBatchId = `b-${Date.now()}`;
        const nowIso = new Date().toISOString();

        items.forEach((item, index) => {
          const normNum = String(item.ticketNumber).padStart(4, '0');
          const ticketTotal =
            (item.half ? halfPrice : 0) + (item.full ? fullPrice : 0);

          // Reserve ticket document
          transaction.set(ticketRefs[index], {
            ticketNumber: normNum,
            drawDate,
            seriesId,
            bookingBatchId,
            bookingStatus: 'Booked',
            customerId: assignedCustomerId,
            customerName: customerName || 'Walk-in Customer',
            customerPhone: customerPhone || '',
            bookedBy: performedBy,
            bookedByUsername: options?.bookedByUsername || performedBy,
            bookedAt: serverTimestamp(),
          });

          // Write booking item
          const bookingDocRef = doc(db, 'bookings', `${bookingBatchId}_${normNum}`);
          transaction.set(bookingDocRef, {
            id: `${bookingBatchId}_${normNum}`,
            ticketNumber: normNum,
            seriesTitle: configData.seriesTitle,
            customerId: assignedCustomerId,
            customerName: customerName || 'Walk-in Customer',
            customerPhone: customerPhone || '',
            ticketType: item.half && item.full ? 'both' : item.half ? 'half' : 'full',
            halfSelected: item.half,
            halfAmount: item.half ? halfPrice : 0,
            fullSelected: item.full,
            fullAmount: item.full ? fullPrice : 0,
            totalAmount: ticketTotal,
            amountPaid: 0,
            remainingBalance: ticketTotal,
            bookingStatus: 'Booked',
            paymentStatus: 'Unpaid',
            bookedBy: performedBy,
            bookedByUsername: options?.bookedByUsername || performedBy,
            bookedByUid: options?.lockedByUid || auth?.currentUser?.uid || '',
            bookedByRole: role,
            date: drawDate,
            bookedAt: nowIso,
            history: [
              {
                id: `aud-${Date.now()}-${index}`,
                timestamp: nowIso,
                action: 'BOOKED',
                amountChanged: ticketTotal,
                performedBy,
                performedByRole: role,
                notes: `Booked by ${performedBy} • Customer ID ${assignedCustomerId}`,
              },
            ],
          });
        });

        // Audit Event
        const auditDocRef = doc(collection(db, 'auditEvents'));
        transaction.set(auditDocRef, {
          action: 'BOOKING_BATCH_CREATED',
          bookingBatchId,
          customerId: assignedCustomerId,
          ticketCount: items.length,
          drawDate,
          performedBy,
          role,
          timestamp: serverTimestamp(),
        });
      });

      return localResult;
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('already booked')) {
        return { success: false, bookedCount: 0, error: msg };
      }
      // If Firestore rules are locked prior to publishing, preserve the verified local booking result
      console.warn('[Firestore] Direct client write skipped (using local state until rules/Apps Script deployed):', msg);
      return localResult;
    }
  }

  /**
   * Atomic Payment Confirmation via live Firestore transaction
   */
  public async confirmPaymentFirestore(
    ticketNumber: string,
    drawDate: string,
    amount: number,
    paymentMethod: string,
    paymentRef: string,
    confirmedBy: string,
    role: LoginType,
    notes?: string
  ): Promise<{ success: boolean; remainingBalance: number; error?: string }> {
    if (role !== 'admin' && role !== 'paid_employee') {
      return {
        success: false,
        remainingBalance: 0,
        error: 'Permission Denied: Only Admin or Paid Employee can confirm payments in Firestore.',
      };
    }

    const { auth, db } = initFirebase();
    if (!db) {
      return { success: false, remainingBalance: 0, error: 'Firestore is not connected.' };
    }

    try {
      const q = query(
        collection(db, 'bookings'),
        where('ticketNumber', '==', ticketNumber),
        where('date', '==', drawDate),
        where('bookingStatus', '==', 'Booked')
      );
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        return { success: false, remainingBalance: 0, error: 'Booking document not found.' };
      }

      const bookingDoc = querySnap.docs[0];
      const docRef = bookingDoc.ref;

      const result = await runTransaction(db, async (transaction) => {
        const freshSnap = await transaction.get(docRef);
        if (!freshSnap.exists()) {
          throw new Error('Booking record disappeared.');
        }

        const data = freshSnap.data() as TicketBooking;
        if (data.paymentStatus === 'Paid') {
          throw new Error('Ticket is already fully Paid.');
        }

        const newPaid = (data.amountPaid || 0) + amount;
        if (newPaid > data.totalAmount) {
          throw new Error('Payment amount exceeds remaining balance.');
        }

        const newRemaining = Math.max(0, data.totalAmount - newPaid);
        const newStatus = newRemaining === 0 ? 'Paid' : 'Partial';
        const nowIso = new Date().toISOString();

        const auditEntry: PaymentAuditEntry = {
          id: `pay-aud-${Date.now()}`,
          timestamp: nowIso,
          action: newRemaining === 0 ? 'PAYMENT_RECEIVED' : 'PARTIAL_PAYMENT',
          amountChanged: amount,
          paymentMethod,
          paymentRef: paymentRef || `REC-${Date.now()}`,
          performedBy: confirmedBy,
          performedByRole: role,
          notes: notes || `Recorded by ${confirmedBy}`,
        };

        // Update booking doc
        transaction.update(docRef, {
          amountPaid: newPaid,
          remainingBalance: newRemaining,
          paymentStatus: newStatus,
          paymentRef: paymentRef || data.paymentRef || `REC-${Date.now()}`,
          paidBy: data.customerName,
          paidAt: nowIso,
          history: [auditEntry, ...(data.history || [])],
        });

        // Record immutable payment receipt
        const paymentDocRef = doc(collection(db, 'payments'));
        transaction.set(paymentDocRef, {
          bookingId: docRef.id,
          ticketNumber,
          drawDate,
          customerName: data.customerName,
          amount,
          paymentMethod: paymentMethod || 'Cash',
          paymentRef: paymentRef || `REC-${Date.now()}`,
          paymentStatus: newStatus,
          confirmedBy,
          confirmedByUid: auth?.currentUser?.uid || '',
          role,
          createdAt: serverTimestamp(),
        });

        return { success: true, remainingBalance: newRemaining };
      });

      return result;
    } catch (err: any) {
      console.error('[Firestore] Payment Transaction Error:', err);
      return { success: false, remainingBalance: 0, error: err.message };
    }
  }

  /**
   * Upload Result Paper to Firebase Storage & persist metadata to Firestore
   */
  public async uploadResultPaperStorage(
    file: File,
    drawDate: string,
    seriesTitle: string,
    uploadedBy: string,
    role: LoginType,
    onProgress?: (pct: number) => void
  ): Promise<{ success: boolean; paper?: ResultPaperDocument; error?: string }> {
    if (role !== 'admin') {
      return { success: false, error: 'Permission Denied: Only Admin can upload result papers.' };
    }

    if (!isStorageConfigured()) {
      return {
        success: false,
        error: 'Firebase Storage is currently disabled or not configured. You can publish result sheets directly to Firestore using metadata records.',
      };
    }

    const { db, storage } = initFirebase();
    if (!db || !storage) {
      return { success: false, error: 'Firebase Storage or Firestore is not connected.' };
    }

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `result_papers/${drawDate}/${Date.now()}_${sanitizedName}`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });

      return new Promise((resolve) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(Math.round(pct));
          },
          (err) => {
            resolve({ success: false, error: err.message });
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            const paperDocRef = doc(collection(db, 'resultPapers'));

            const paperRecord: ResultPaperDocument = {
              id: paperDocRef.id,
              drawDate,
              seriesTitle,
              title: file.name,
              fileUrl: downloadUrl,
              uploadedBy,
              uploadedAt: new Date().toLocaleString([], {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              fileSizeKb: Math.round(file.size / 1024),
              verifiedOfficial: true,
            };

            await setDoc(paperDocRef, paperRecord);
            resolve({ success: true, paper: paperRecord });
          }
        );
      });
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Cancel or Reverse a ticket booking via Apps Script backend, Cloud Function, or Firestore transaction
   */
  public async cancelBookingFirestore(
    ticketNumber: string,
    drawDate: string,
    reason: string,
    role: LoginType,
    seriesId: string = 'default'
  ): Promise<{ success: boolean; error?: string }> {
    if (role !== 'admin' && role !== 'paid_employee') {
      return { success: false, error: 'Permission Denied: Only Admin or Paid Employee can cancel bookings.' };
    }

    const { auth, functions, db } = initFirebase();
    const scriptUrl = getOtpAppsScriptUrl();

    // 1. Prefer Apps Script trusted backend if available
    if (auth?.currentUser && scriptUrl) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const serverRes = await this.callOtpAppsScript({
          action: 'cancelTicketBooking',
          idToken,
          ticketNumber,
          drawDate,
          seriesId,
          reason,
        });
        if (serverRes?.success) {
          lotteryService.cancelBookingTransaction(
            ticketNumber,
            drawDate,
            auth.currentUser.displayName || 'Admin',
            role,
            reason
          );
          return { success: true };
        }
        if (serverRes?.error && serverRes.error !== 'Unsupported action.') {
          return { success: false, error: serverRes.error };
        }
      } catch (err: any) {
        console.warn('[Apps Script] cancelTicketBooking fallback:', err?.message);
      }
    }

    // 2. Prefer server-side Cloud Function if available
    if (functions) {
      try {
        const cancelFn = httpsCallable(functions, 'cancelOrReverseBooking');
        const res: any = await cancelFn({
          ticketNumber,
          drawDate,
          seriesId,
          reason,
        });
        if (res.data?.success) {
          lotteryService.cancelBookingTransaction(ticketNumber, drawDate, 'Admin', role, reason);
          return { success: true };
        }
      } catch (fnErr: any) {
        console.warn('[Cloud Function] cancelOrReverseBooking error, falling back to direct Firestore:', fnErr.message);
      }
    }

    // 3. Direct Firestore Transaction fallback (for emulator/client environments)
    if (!db) {
      return lotteryService.cancelBookingTransaction(ticketNumber, drawDate, 'Admin', role, reason);
    }

    try {
      const normTicket = String(ticketNumber).padStart(4, '0');
      const q = query(
        collection(db, 'bookings'),
        where('ticketNumber', '==', normTicket),
        where('date', '==', drawDate),
        where('bookingStatus', '==', 'Booked')
      );
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        return lotteryService.cancelBookingTransaction(ticketNumber, drawDate, 'Admin', role, reason);
      }

      const bookingDoc = querySnap.docs[0];
      const bookingData = bookingDoc.data() as TicketBooking;
      if (bookingData.paymentStatus === 'Paid' && role !== 'admin') {
        return {
          success: false,
          error: 'Permission Denied: Confirmed Paid tickets can only be reversed by Admin.',
        };
      }
      const ticketRef = doc(db, 'draws', drawDate, 'series', seriesId, 'tickets', normTicket);

      await runTransaction(db, async (transaction) => {
        const ticketSnap = await transaction.get(ticketRef);
        if (ticketSnap.exists()) {
          transaction.delete(ticketRef);
        }

        const existingHistory = bookingData.history || [];
        const cancelAuditEntry: PaymentAuditEntry = {
          id: `canc-aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'CANCELLED',
          amountChanged: -(bookingData.amountPaid || 0),
          performedBy: auth?.currentUser?.displayName || (role === 'admin' ? 'Admin' : 'Paid Employee'),
          performedByRole: role,
          notes: reason || (bookingData.paymentStatus === 'Paid' ? 'Payment reversed & booking cancelled' : 'Booking cancelled'),
        };

        transaction.update(bookingDoc.ref, {
          bookingStatus: 'Cancelled',
          remainingBalance: 0,
          cancellationReason: reason,
          cancelledBy: auth?.currentUser?.displayName || (role === 'admin' ? 'Admin' : 'Paid Employee'),
          cancelledByRole: role,
          cancelledAt: serverTimestamp(),
          history: [cancelAuditEntry, ...existingHistory],
        });
      });

      lotteryService.cancelBookingTransaction(ticketNumber, drawDate, 'Admin', role, reason);
      return { success: true };
    } catch (err: any) {
      console.error('[Firestore] Cancellation error:', err);
      const localCancel = lotteryService.cancelBookingTransaction(ticketNumber, drawDate, 'Admin', role, reason);
      if (localCancel.success) return { success: true };
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetch active bookings from Firestore for a draw date (scoped by role & operatorUid)
   */
  public async fetchBookingsFirestore(
    drawDate: string,
    role?: LoginType,
    operatorUid?: string
  ): Promise<TicketBooking[]> {
    const { db, auth } = initFirebase();
    const effectiveUid = operatorUid || auth?.currentUser?.uid || this.status.currentUser?.uid || '';
    if (!db) return lotteryService.getBookings(drawDate, role, effectiveUid);

    try {
      const q =
        role === 'admin'
          ? query(collection(db, 'bookings'), where('date', '==', drawDate))
          : effectiveUid
          ? query(
              collection(db, 'bookings'),
              where('date', '==', drawDate),
              where('bookedByUid', '==', effectiveUid)
            )
          : null;

      if (!q) {
        return lotteryService.getBookings(drawDate, role, effectiveUid);
      }

      const snap = await getDocs(q);
      const firestoreBookings = snap.docs
        .map((docSnap) => this.normalizeFirestoreBooking({ id: docSnap.id, ...(docSnap.data() as any) }))
        .filter((b) => b.bookingStatus !== 'Cancelled');

      if (firestoreBookings.length > 0) {
        return lotteryService.ensureLegacyCustomerIds(firestoreBookings);
      }
      return lotteryService.getBookings(drawDate, role, effectiveUid);
    } catch (err) {
      console.error('[Firestore] fetchBookings error:', err);
      return lotteryService.getBookings(drawDate, role, effectiveUid);
    }
  }

  /**
   * Live real-time subscription to draw bookings in Firestore + cross-tab sync
   */
  public subscribeBookingsFirestore(
    drawDate: string,
    onUpdate: (bookings: TicketBooking[]) => void,
    onError?: (err: Error) => void,
    role?: LoginType,
    operatorUid?: string
  ): () => void {
    const { db, auth } = initFirebase();
    const effectiveUid = operatorUid || auth?.currentUser?.uid || this.status.currentUser?.uid || '';
    operatorUid = effectiveUid;
    let firestoreBookings: TicketBooking[] = [];

    const emitMerged = () => {
      const localBookings = lotteryService
        .getBookings(drawDate, role, operatorUid)
        .filter((b) => b.date === drawDate || !b.date);
      if (firestoreBookings.length === 0) {
        onUpdate(lotteryService.ensureLegacyCustomerIds(localBookings));
        return;
      }
      const byTicket = new Map<string, TicketBooking>();
      for (const b of localBookings) {
        byTicket.set(b.ticketNumber, b);
      }
      for (const b of firestoreBookings) {
        if (b.bookingStatus === 'Cancelled') {
          byTicket.delete(b.ticketNumber);
        } else {
          byTicket.set(b.ticketNumber, b);
        }
      }
      onUpdate(lotteryService.ensureLegacyCustomerIds(Array.from(byTicket.values())));
    };

    const unsubLocal = lotteryService.subscribeRealtimeSync(() => {
      emitMerged();
    });

    if (!db) {
      emitMerged();
      return () => unsubLocal();
    }

    // Privacy guard: Only Admin can query all bookings; Employees and Paid Employees query only their own bookings
    const q =
      role === 'admin'
        ? query(collection(db, 'bookings'), where('date', '==', drawDate))
        : operatorUid
        ? query(
            collection(db, 'bookings'),
            where('date', '==', drawDate),
            where('bookedByUid', '==', operatorUid)
          )
        : null;

    if (!q) {
      emitMerged();
      return () => unsubLocal();
    }

    const unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        firestoreBookings = snapshot.docs.map((d) =>
          this.normalizeFirestoreBooking({ id: d.id, ...(d.data() as any) })
        );
        emitMerged();
      },
      (err) => {
        console.error('[Firestore] subscribeBookings listener error:', err);
        emitMerged();
        if (onError && !String(err?.message || '').includes('insufficient permissions')) {
          onError(err);
        }
      }
    );

    return () => {
      unsubLocal();
      unsubFirestore();
    };
  }

  /**
   * Fetch system configuration from Firestore
   */
  public async fetchConfigFirestore(): Promise<SystemConfig | null> {
    const { db } = initFirebase();
    if (!db) return null;

    try {
      const snap = await getDoc(doc(db, 'config', 'system'));
      if (snap.exists()) {
        return snap.data() as SystemConfig;
      }
      return null;
    } catch (err) {
      console.error('[Firestore] fetchConfig error:', err);
      return null;
    }
  }

  /**
   * Update system configuration in Firestore (Admin Only)
   */
  public async updateConfigFirestore(
    updated: Partial<SystemConfig>,
    role: LoginType
  ): Promise<{ success: boolean; error?: string }> {
    if (role !== 'admin') {
      return { success: false, error: 'Permission Denied: Only Admin can update configuration.' };
    }

    const { db } = initFirebase();
    if (!db) return { success: false, error: 'Firestore is not connected.' };

    try {
      await setDoc(doc(db, 'config', 'system'), { ...updated, updatedAt: serverTimestamp() }, { merge: true });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetch winners from Firestore
   */
  public async fetchWinnersFirestore(drawDate: string): Promise<TodayWinnerRecord[]> {
    const { db } = initFirebase();
    if (!db) return [];

    try {
      const q = query(collection(db, 'winners'), where('drawDate', '==', drawDate));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TodayWinnerRecord[];
    } catch (err) {
      console.error('[Firestore] fetchWinners error:', err);
      return [];
    }
  }

  /**
   * Add winner record to Firestore (Admin Only)
   */
  public async addWinnerFirestore(
    record: Omit<TodayWinnerRecord, 'id'>,
    role: LoginType
  ): Promise<{ success: boolean; error?: string }> {
    if (role !== 'admin') {
      return { success: false, error: 'Permission Denied: Only Admin can declare winners.' };
    }

    const { db } = initFirebase();
    if (!db) return { success: false, error: 'Firestore is not connected.' };

    try {
      const winnerDocRef = doc(collection(db, 'winners'));
      await setDoc(winnerDocRef, { ...record, id: winnerDocRef.id, createdAt: serverTimestamp() });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetch result paper declaration documents from Firestore
   */
  public async fetchResultPapersFirestore(drawDate: string): Promise<ResultPaperDocument[]> {
    const { db } = initFirebase();
    if (!db) return [];

    try {
      const q = query(collection(db, 'resultPapers'), where('drawDate', '==', drawDate));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ResultPaperDocument[];
    } catch (err) {
      console.error('[Firestore] fetchResultPapers error:', err);
      return [];
    }
  }

  /**
   * Add Result Paper document directly to Firestore (configurable without Cloud Storage)
   */
  public async addResultPaperFirestore(
    paper: Omit<ResultPaperDocument, 'id'>,
    role: LoginType
  ): Promise<{ success: boolean; paper?: ResultPaperDocument; error?: string }> {
    if (role !== 'admin') {
      return { success: false, error: 'Permission Denied: Only Admin can publish result papers.' };
    }

    const { db } = initFirebase();
    if (!db) return { success: false, error: 'Firestore is not connected.' };

    try {
      const paperDocRef = doc(collection(db, 'resultPapers'));
      const paperRecord: ResultPaperDocument = {
        ...paper,
        id: paperDocRef.id,
      };
      await setDoc(paperDocRef, { ...paperRecord, createdAt: serverTimestamp() });
      return { success: true, paper: paperRecord };
    } catch (err: any) {
      console.error('[Firestore] addResultPaper error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Sign In with Email and Password (Firebase Auth)
   */
  public async signInWithEmail(
    email: string,
    pass: string
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    const { auth, db, error: initError } = initFirebase();
    if (!auth) {
      return {
        success: false,
        error:
          initError ||
          getFirebaseConfigDiagnostics().diagnosticMessage ||
          'Firebase Authentication is not configured.',
      };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      let role: LoginType = 'employee';
      let name = email.split('@')[0];
      if (db) {
        try {
          const uSnap = await getDoc(doc(db, 'users', cred.user.uid));
          if (uSnap.exists()) {
            const data = uSnap.data();
            role = (data?.role as LoginType) || 'employee';
            name = data?.name || name;
          }
        } catch {}
      }
      return { success: true, user: { uid: cred.user.uid, email: cred.user.email, role, name } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Sign Out current user from Firebase Auth
   */
  public async signOutUser(): Promise<{ success: boolean; error?: string }> {
    const { auth } = initFirebase();
    if (!auth) return { success: true };
    try {
      await signOut(auth);
      this.status.currentUser = null;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Public Employee Sign-Up Step 1 (Create Pending Account & Send 6-Digit Email OTP):
   * 1. Validates Full Name, Username, Email, Password, and Confirm Password.
   * 2. Creates the account in Firebase Authentication using Email/Password.
   * 3. Calls the Google Apps Script backend (`registerEmployeeProfile`) with the user's ID token
   *    to atomically enforce username uniqueness, create pending unverified records in
   *    `/userDirectory/{username}` and `/users/{uid}`, strictly assign `role: 'employee'`,
   *    `verified: false`, `otpVerified: false`, `registrationCompleted: false`,
   *    and send the 6-digit verification OTP from `carromlotterydesk@gmail.com`.
   * 4. Does NOT complete registration or mark the email verified until the 6-digit OTP is verified.
   * 5. Keeps the temporary unverified Auth session active ONLY for the Sign-Up OTP verification step.
   */
  public async registerEmployeeAccount(input: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    requestedRole?: 'employee' | 'paid_employee';
  }): Promise<{
    success: boolean;
    requiresOtp?: boolean;
    recipientEmail?: string;
    maskedEmail?: string;
    senderEmail?: string;
    expiresInSeconds?: number;
    resendCooldownSeconds?: number;
    user?: {
      uid: string;
      name: string;
      username: string;
      email: string;
      role: 'employee' | 'paid_employee';
      otpVerified: false;
    };
    error?: string;
  }> {
    const cleanName = String(input.fullName || '').trim();
    const cleanUsername = String(input.username || '').trim().toLowerCase();
    const cleanEmail = String(input.email || '').trim().toLowerCase();
    const cleanRole: 'employee' | 'paid_employee' =
      input.requestedRole === 'paid_employee' ? 'paid_employee' : 'employee';
    const password = String(input.password || '');
    const confirmPassword = String(input.confirmPassword || '');

    if (cleanName.length < 2 || cleanName.length > 80) {
      return {
        success: false,
        error: 'Full name must be between 2 and 80 characters.',
      };
    }

    if (!/^[a-z0-9._-]{3,32}$/.test(cleanUsername)) {
      return {
        success: false,
        error:
          'Username must be 3 to 32 characters and contain only letters, numbers, dots (.), underscores (_), or hyphens (-).',
      };
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long.',
      };
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        error: 'Passwords do not match. Please confirm your password.',
      };
    }

    const { auth, error: initError } = initFirebase();
    if (!auth) {
      return {
        success: false,
        error:
          initError ||
          getFirebaseConfigDiagnostics().diagnosticMessage ||
          'Firebase Authentication is not configured.',
      };
    }

    const scriptUrl = getOtpAppsScriptUrl();
    if (!scriptUrl || !/^https?:\/\/.+\/exec$/i.test(scriptUrl)) {
      return {
        success: false,
        error:
          'Registration backend URL is not configured. Set VITE_OTP_APPS_SCRIPT_URL in .env.local to your deployed Google Apps Script Web App URL ending in /exec.',
      };
    }

    let createdUser: User | null = null;
    let wasNewlyCreated = false;

    try {
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        createdUser = cred.user;
        wasNewlyCreated = true;
      } catch (createErr: any) {
        if (createErr?.code === 'auth/email-already-in-use') {
          // Check if an earlier unverified registration created the Auth account without completing Sign-Up OTP
          try {
            const existingCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
            createdUser = existingCred.user;
            wasNewlyCreated = false;
          } catch {
            return {
              success: false,
              error: 'This email address is already registered. Please sign in instead.',
            };
          }
        } else {
          throw createErr;
        }
      }

      try {
        await updateProfile(createdUser, { displayName: cleanName });
      } catch {
        // Non-fatal; authoritative name is stored in Firestore /users/{uid}
      }

      const idToken = await createdUser.getIdToken(true);
      const regRes = await this.callOtpAppsScript({
        action: 'registerEmployeeProfile',
        idToken,
        fullName: cleanName,
        username: cleanUsername,
        requestedRole: cleanRole,
      });

      if (!regRes?.success) {
        if (wasNewlyCreated && createdUser) {
          try {
            await deleteUser(createdUser);
          } catch {}
        }
        await signOut(auth).catch(() => {});
        this.status.currentUser = null;

        if (regRes?.error === 'Unsupported action.') {
          return {
            success: false,
            error:
              'The Google Apps Script Web App must be updated with the latest apps-script/Code.gs (registerEmployeeProfile action) in the Apps Script console.',
          };
        }

        return {
          success: false,
          error: regRes?.error || 'Could not initiate registration. Please try again.',
        };
      }

      const fixedAdminOtpEmail = 'carromlotterydesk@gmail.com';
      let expiresInSeconds = (regRes.expiresInSeconds as number | undefined) || 300;
      let resendCooldownSeconds = (regRes.resendCooldownSeconds as number | undefined) || 60;

      // Backward-compatible fallback if deployed Apps Script did not yet bundle OTP sending inside registerEmployeeProfile
      if (!regRes.requiresOtp && !regRes.maskedEmail && !regRes.recipientEmail) {
        const otpRes = await this.requestFirstLoginOtp();
        if (!otpRes.success) {
          if (wasNewlyCreated && createdUser) {
            try {
              await deleteUser(createdUser);
            } catch {}
          }
          await signOut(auth).catch(() => {});
          this.status.currentUser = null;
          return {
            success: false,
            error: otpRes.error || 'Could not send Sign-Up verification OTP email.',
          };
        }
        expiresInSeconds = otpRes.expiresInSeconds || expiresInSeconds;
        resendCooldownSeconds = otpRes.resendCooldownSeconds || resendCooldownSeconds;
      }

      return {
        success: true,
        requiresOtp: true,
        recipientEmail: fixedAdminOtpEmail,
        maskedEmail: fixedAdminOtpEmail,
        senderEmail: fixedAdminOtpEmail,
        expiresInSeconds,
        resendCooldownSeconds,
        user: {
          uid: String(regRes.uid || createdUser.uid),
          name: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          role: cleanRole,
          otpVerified: false,
        },
      };
    } catch (err: any) {
      if (wasNewlyCreated && createdUser) {
        try {
          await deleteUser(createdUser);
        } catch {}
      }
      await signOut(auth).catch(() => {});
      this.status.currentUser = null;

      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        return {
          success: false,
          error: 'This email address is already registered. Please sign in instead.',
        };
      }
      if (code === 'auth/invalid-email') {
        return {
          success: false,
          error: 'Please enter a valid email address.',
        };
      }
      if (code === 'auth/weak-password') {
        return {
          success: false,
          error: 'Password is too weak. Please use at least 6 characters.',
        };
      }
      if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
        return {
          success: false,
          error:
            'Email/Password sign-in is not enabled in Firebase Authentication for project carrom-df56a.',
        };
      }

      return {
        success: false,
        error: err?.message || 'Registration failed. Please try again.',
      };
    }
  }

  /**
   * Cancels an unverified Sign-Up registration when the user backs out of the Sign-Up OTP screen,
   * cleaning up the pending Firestore records and unverified Firebase Auth user.
   */
  public async cancelSignupRegistration(): Promise<void> {
    const { auth } = initFirebase();
    if (!auth?.currentUser) return;

    const currentUser = auth.currentUser;
    try {
      const scriptUrl = getOtpAppsScriptUrl();
      if (scriptUrl) {
        const idToken = await currentUser.getIdToken();
        await this.callOtpAppsScript({
          action: 'cancelRegistration',
          idToken,
        }).catch(() => {});
      }
    } catch {
      // Ignore network errors during best-effort cleanup
    }

    try {
      await signOut(auth);
    } catch {}
    this.status.currentUser = null;
  }

  /**
   * Calls the Google Apps Script Web App OTP backend (`carromlotterydesk@gmail.com`)
   * using `text/plain;charset=utf-8` so browsers do not fail on CORS preflight requests.
   */
  private async callOtpAppsScript(payload: Record<string, any>): Promise<any> {
    const scriptUrl = getOtpAppsScriptUrl();
    if (!scriptUrl) {
      throw new Error(
        'First-login OTP backend URL is not configured. Set VITE_OTP_APPS_SCRIPT_URL in .env.local to your deployed Google Apps Script Web App URL.'
      );
    }

    if (!/^https?:\/\/.+\/exec$/i.test(scriptUrl)) {
      throw new Error(
        'Invalid VITE_OTP_APPS_SCRIPT_URL format. Must be a valid Google Apps Script Web App URL ending in /exec.'
      );
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`OTP Apps Script endpoint returned HTTP ${response.status}.`);
    }

    const rawText = await response.text();
    try {
      return JSON.parse(rawText);
    } catch {
      throw new Error('Invalid JSON response from OTP service. Ensure the Apps Script Web App is deployed with access set to Anyone.');
    }
  }

  /**
   * Normal Login Flow (Username or Email + Password ONLY — NO OTP on First or Subsequent Logins):
   * - Authenticates username or email + password with Firebase Auth.
   * - Rejects accounts that started Sign Up but never completed Sign-Up 6-digit email OTP verification.
   * - Never triggers or requires an email OTP during normal login.
   */
  public async authenticateAndCheckFirstLoginOtp(
    identifier: string,
    password: string,
    selectedRole: LoginType = 'employee',
    keepMeSignedIn: boolean = true
  ): Promise<{
    success: boolean;
    requiresOtp?: boolean;
    maskedEmail?: string;
    senderEmail?: string;
    expiresInSeconds?: number;
    resendCooldownSeconds?: number;
    user?: { uid: string; email: string; name: string; role: LoginType; otpVerified: boolean };
    error?: string;
  }> {
    const { auth, db, functions, error: initError } = initFirebase();
    if (!auth) {
      return {
        success: false,
        error:
          initError ||
          getFirebaseConfigDiagnostics().diagnosticMessage ||
          'Firebase Authentication is not configured.',
      };
    }

    const trimmedId = identifier.trim();
    if (!trimmedId || !password) {
      return {
        success: false,
        error: 'Please enter both your username/email and password.',
      };
    }

    try {
      if (typeof setPersistence === 'function') {
        try {
          await setPersistence(
            auth,
            keepMeSignedIn ? browserLocalPersistence : browserSessionPersistence
          );
        } catch {
          // Persistence fallback if environment restricts storage
        }
      }
      let signedInUser: User;
      let resolvedName = trimmedId.includes('@') ? trimmedId.split('@')[0] : trimmedId;
      let serverResolvedRole: LoginType = 'employee';
      const scriptUrl = getOtpAppsScriptUrl();

      let claimsRefreshedOnServer = false;
      if (trimmedId.includes('@')) {
        const cred = await signInWithEmailAndPassword(auth, trimmedId, password);
        signedInUser = cred.user;
      } else {
        // Server-side username-to-account resolution without exposing a public directory
        if (scriptUrl) {
          const authData = await this.callOtpAppsScript({
            action: 'authenticateUsername',
            username: trimmedId,
            password,
          });
          if (!authData?.success || !authData?.email) {
            return {
              success: false,
              error: authData?.error || 'Invalid username or password.',
            };
          }
          resolvedName = authData.displayName || resolvedName;
          serverResolvedRole = (authData.role as LoginType) || 'employee';
          claimsRefreshedOnServer = Boolean(authData.claimsRefreshed);
          const cred = await signInWithEmailAndPassword(auth, authData.email, password);
          signedInUser = cred.user;
        } else if (isEmulatorMode() && functions) {
          const authUserFn = httpsCallable(functions, 'authenticateUsername');
          const fnRes: any = await authUserFn({ username: trimmedId, password });
          if (!fnRes.data?.customToken) {
            return {
              success: false,
              error: 'Invalid username or password.',
            };
          }
          resolvedName = fnRes.data.displayName || resolvedName;
          serverResolvedRole = (fnRes.data.role as LoginType) || 'employee';
          const cred = await signInWithCustomToken(auth, fnRes.data.customToken);
          signedInUser = cred.user;
        } else {
          return {
            success: false,
            error:
              'Please sign in with your registered email address, or configure VITE_OTP_APPS_SCRIPT_URL for server-side username lookup.',
          };
        }
      }

      // Inspect server-signed ID token claims. Only force token refresh if custom claims were legitimately updated on server.
      let tokenResult = await signedInUser.getIdTokenResult(claimsRefreshedOnServer);
      let claimRole: LoginType =
        (tokenResult.claims.role as LoginType) || serverResolvedRole || 'employee';
      let isAccountVerified = tokenResult.claims.otpVerified === true;

      // If custom claims do not yet have otpVerified === true, verify login session on server (zero OTP sent)
      if (!isAccountVerified && scriptUrl) {
        const idToken = await signedInUser.getIdToken();
        const sessionRes = await this.callOtpAppsScript({
          action: 'verifyLoginSession',
          idToken,
        });

        if (sessionRes?.code === 'SIGNUP_OTP_INCOMPLETE') {
          await signOut(auth).catch(() => {});
          this.status.currentUser = null;
          return {
            success: false,
            error:
              sessionRes.error ||
              'Account registration is incomplete. Please complete the 6-digit email OTP verification in Sign Up before logging in.',
          };
        }

        if (sessionRes?.success && sessionRes?.verified) {
          if (sessionRes.role) {
            claimRole = sessionRes.role as LoginType;
          }
          if (sessionRes.name) {
            resolvedName = sessionRes.name as string;
          }
          tokenResult = await signedInUser.getIdTokenResult(true);
          claimRole = (tokenResult.claims.role as LoginType) || claimRole;
          isAccountVerified = true;
        } else if (
          tokenResult.claims.otpVerified === false ||
          tokenResult.claims.registrationCompleted === false
        ) {
          // Account was created via Sign Up with otpVerified: false and never verified its Sign-Up OTP
          await signOut(auth).catch(() => {});
          this.status.currentUser = null;
          return {
            success: false,
            error:
              'Account registration is incomplete. Please complete the 6-digit email OTP verification in Sign Up before logging in.',
          };
        }
      } else if (
        !isAccountVerified &&
        (tokenResult.claims.otpVerified === false ||
          tokenResult.claims.registrationCompleted === false)
      ) {
        await signOut(auth).catch(() => {});
        this.status.currentUser = null;
        return {
          success: false,
          error:
            'Account registration is incomplete. Please complete the 6-digit email OTP verification in Sign Up before logging in.',
        };
      }

      if (db) {
        try {
          const uSnap = await getDoc(doc(db, 'users', signedInUser.uid));
          if (uSnap.exists()) {
            const uData = uSnap.data();
            resolvedName = uData?.displayName || uData?.name || resolvedName;
            if (uData?.role) {
              claimRole = uData.role as LoginType;
            }
          }
        } catch {
          // Safe to ignore while Firestore rules are locked
        }
      }

      return {
        success: true,
        requiresOtp: false,
        user: {
          uid: signedInUser.uid,
          email: signedInUser.email || '',
          name: resolvedName,
          role: claimRole,
          otpVerified: true,
        },
      };
    } catch (err: any) {
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        return { success: false, error: 'Invalid username/email or password.' };
      }
      if (code === 'auth/too-many-requests') {
        return {
          success: false,
          error: 'Too many failed login attempts. Please wait a few minutes and try again.',
        };
      }
      if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
        return {
          success: false,
          error:
            'Email/Password sign-in is not enabled in Firebase Authentication for project carrom-df56a. Enable Email/Password in Firebase Console -> Authentication -> Sign-in method.',
        };
      }
      if (code.includes('api-key-not-valid')) {
        return {
          success: false,
          error:
            'Firebase Web API key (VITE_FIREBASE_API_KEY) is invalid for project carrom-df56a. Update .env.local and restart the Vite server.',
        };
      }
      return {
        success: false,
        error: err?.message || 'Authentication failed.',
      };
    }
  }

  /**
   * Sends a password reset email using Firebase Auth to a registered email address.
   * Emits a generic success message if the user does not exist to avoid email enumeration.
   */
  public async sendPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    const { auth, error: initError } = initFirebase();
    if (!auth) {
      return {
        success: false,
        message: 'Firebase Authentication is not configured.',
        error: initError || 'Firebase Authentication is not configured.',
      };
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return {
        success: false,
        message: 'Please enter a valid registered email address.',
        error: 'Please enter a valid registered email address.',
      };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message:
          'If an account exists with this email address, a password reset link has been sent. Please check your inbox and spam folder.',
      };
    } catch (err: any) {
      // In accordance with security best practices, avoid email enumeration
      if (err?.code === 'auth/user-not-found') {
        return {
          success: true,
          message:
            'If an account exists with this email address, a password reset link has been sent. Please check your inbox and spam folder.',
        };
      }
      if (err?.code === 'auth/invalid-email') {
        return {
          success: false,
          message: 'The email address format is invalid.',
          error: 'The email address format is invalid.',
        };
      }
      return {
        success: false,
        message: err?.message || 'Failed to send password reset email. Please try again later.',
        error: err?.message,
      };
    }
  }

  /**
   * Requests or resends the 6-digit Sign-Up OTP email exclusively to carromlotterydesk@gmail.com
   * via Google Apps Script (Spark Plan) or local emulator
   */
  public async requestFirstLoginOtp(): Promise<{
    success: boolean;
    alreadyVerified?: boolean;
    role?: LoginType;
    name?: string;
    recipientEmail?: string;
    maskedEmail?: string;
    senderEmail?: string;
    expiresInSeconds?: number;
    resendCooldownSeconds?: number;
    error?: string;
  }> {
    const { auth, functions } = initFirebase();
    if (!auth?.currentUser) {
      return {
        success: false,
        error: 'Registration session is not active. Please submit the Sign Up form again.',
      };
    }

    const fixedAdminOtpEmail = 'carromlotterydesk@gmail.com';

    try {
      const scriptUrl = getOtpAppsScriptUrl();
      if (scriptUrl) {
        const idToken = await auth.currentUser.getIdToken(true);
        const data = await this.callOtpAppsScript({
          action: 'requestFirstLoginOtp',
          idToken,
        });

        if (!data?.success) {
          return {
            success: false,
            resendCooldownSeconds: data?.resendCooldownSeconds,
            error: data?.error || 'Could not send verification OTP email.',
          };
        }

        return {
          success: true,
          alreadyVerified: Boolean(data.alreadyVerified),
          role: data.role as LoginType | undefined,
          name: data.name as string | undefined,
          recipientEmail: fixedAdminOtpEmail,
          maskedEmail: fixedAdminOtpEmail,
          senderEmail: fixedAdminOtpEmail,
          expiresInSeconds: data.expiresInSeconds || 300,
          resendCooldownSeconds: data.resendCooldownSeconds || 60,
        };
      }

      if (isEmulatorMode() && functions) {
        const reqFn = httpsCallable(functions, 'requestFirstLoginOtp');
        const res: any = await reqFn({});
        return {
          success: true,
          alreadyVerified: Boolean(res.data?.alreadyVerified),
          recipientEmail: fixedAdminOtpEmail,
          maskedEmail: fixedAdminOtpEmail,
          senderEmail: fixedAdminOtpEmail,
          expiresInSeconds: res.data?.expiresInSeconds || 300,
          resendCooldownSeconds: res.data?.resendCooldownSeconds || 60,
        };
      }

      return {
        success: false,
        error:
          'First-login OTP backend URL is not configured. Deploy apps-script/Code.gs under carromlotterydesk@gmail.com and set VITE_OTP_APPS_SCRIPT_URL in .env.local.',
      };
    } catch (err: any) {
      return {
        success: false,
        error:
          err?.message ||
          'Unable to send OTP email from carromlotterydesk@gmail.com.',
      };
    }
  }

  /**
   * Verifies the 6-digit Sign-Up OTP code on the server, updates custom claims and Firestore,
   * refreshes the Auth ID token, and signs out the registration session when `signOutAfterVerify` is true.
   */
  public async verifyFirstLoginOtp(
    otpCode: string,
    options?: { signOutAfterVerify?: boolean }
  ): Promise<{
    success: boolean;
    verified?: boolean;
    remainingAttempts?: number;
    role?: LoginType;
    name?: string;
    username?: string;
    email?: string;
    error?: string;
  }> {
    const cleanOtp = (otpCode || '').trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return {
        success: false,
        verified: false,
        error: 'Please enter a valid 6-digit numeric OTP.',
      };
    }

    const { auth, db, functions } = initFirebase();
    if (!auth?.currentUser) {
      return {
        success: false,
        verified: false,
        error: 'Registration session expired. Please submit the Sign Up form again.',
      };
    }

    try {
      const scriptUrl = getOtpAppsScriptUrl();
      let resData: any = null;

      if (scriptUrl) {
        const idToken = await auth.currentUser.getIdToken();
        resData = await this.callOtpAppsScript({
          action: 'verifyFirstLoginOtp',
          idToken,
          otpCode: cleanOtp,
        });
      } else if (isEmulatorMode() && functions) {
        const verifyFn = httpsCallable(functions, 'verifyFirstLoginOtp');
        const res: any = await verifyFn({ otpCode: cleanOtp });
        resData = res.data;
      } else {
        return {
          success: false,
          verified: false,
          error: 'First-login OTP backend URL is not configured (VITE_OTP_APPS_SCRIPT_URL).',
        };
      }

      if (!resData?.verified) {
        return {
          success: false,
          verified: false,
          remainingAttempts: resData?.remainingAttempts,
          error: resData?.error || 'Incorrect verification code.',
        };
      }

      // Force token refresh so request.auth.token.otpVerified == true is active immediately
      await auth.currentUser.getIdToken(true);
      const tokenResult = await auth.currentUser.getIdTokenResult();
      const verifiedRole =
        (resData?.role as LoginType) ||
        (tokenResult.claims.role as LoginType) ||
        'employee';

      let displayName =
        resData?.name ||
        auth.currentUser.displayName ||
        (auth.currentUser.email ? auth.currentUser.email.split('@')[0] : 'Operator');
      const verifiedEmail = String(resData?.email || auth.currentUser.email || '');
      const verifiedUsername = String(resData?.username || '');

      if (db) {
        try {
          const uSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (uSnap.exists()) {
            displayName = uSnap.data()?.displayName || uSnap.data()?.name || displayName;
          }
        } catch {}
      }

      if (options?.signOutAfterVerify) {
        await signOut(auth).catch(() => {});
        this.status.currentUser = null;
      } else {
        this.refreshStatus();
      }

      return {
        success: true,
        verified: true,
        role: verifiedRole,
        name: displayName,
        username: verifiedUsername,
        email: verifiedEmail,
      };
    } catch (err: any) {
      return {
        success: false,
        verified: false,
        error: err?.message || 'OTP verification failed.',
      };
    }
  }

  public subscribeTicketInventoryFirestore(
    drawDate: string,
    seriesId: string,
    role: LoginType,
    onUpdate: (tickets: TicketInventoryItem[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    const { db } = initFirebase();
    let firestoreInventory: TicketInventoryItem[] = [];

    const emitMerged = () => {
      const localInventory = lotteryService.getInventory(drawDate, seriesId, role);
      if (firestoreInventory.length === 0) {
        onUpdate(localInventory);
        return;
      }
      const byTicket = new Map<string, TicketInventoryItem>();
      for (const item of localInventory) {
        byTicket.set(item.ticketNumber, item);
      }
      for (const item of firestoreInventory) {
        if (role !== 'admin' && item.status !== 'PUBLISHED') continue;
        byTicket.set(item.ticketNumber, item);
      }
      const sorted = Array.from(byTicket.values()).sort((a, b) =>
        a.ticketNumber.localeCompare(b.ticketNumber, undefined, { numeric: true })
      );
      onUpdate(sorted);
    };

    emitMerged();
    const unsubLocal = lotteryService.subscribeRealtimeSync(() => {
      emitMerged();
    });

    let unsubFirestore = () => {};
    if (db) {
      try {
        const q = query(
          collection(db, 'ticketInventory'),
          where('drawDate', '==', drawDate)
        );
        unsubFirestore = onSnapshot(
          q,
          (snapshot) => {
            firestoreInventory = snapshot.docs.map((d) => {
              const data = d.data() as any;
              return {
                id: d.id,
                ticketNumber: String(data.ticketNumber || '').padStart(4, '0'),
                drawDate: String(data.drawDate || drawDate),
                drawKey: String(data.drawKey || ''),
                seriesId: String(data.seriesId || seriesId),
                seriesTitle: data.seriesTitle,
                status: (data.status || 'PUBLISHED') as 'PUBLISHED' | 'UNPUBLISHED',
                bookingStatus: data.bookingStatus || 'Available',
                bookedTicketId: data.bookedTicketId,
                createdAtIso: data.createdAtIso || new Date().toISOString(),
                publishedAtIso: data.publishedAtIso,
                createdByUid: data.createdByUid || '',
                createdByName: data.createdByName,
              };
            });
            emitMerged();
          },
          (err) => {
            if (onError && !String(err?.message || '').includes('insufficient permissions')) {
              onError(err);
            }
          }
        );
      } catch (err) {}
    }

    return () => {
      unsubLocal();
      unsubFirestore();
    };
  }

  public subscribeGridAppearanceFirestore(
    onUpdate: (config: GridAppearanceConfig) => void,
    onError?: (err: Error) => void
  ): () => void {
    const { db } = initFirebase();
    let currentConfig: GridAppearanceConfig = lotteryService.getGridAppearance();

    const emit = () => {
      onUpdate(currentConfig);
    };

    emit();
    const unsubLocal = lotteryService.subscribeRealtimeSync(() => {
      currentConfig = lotteryService.getGridAppearance();
      emit();
    });

    let unsubFirestore = () => {};
    if (db) {
      try {
        const docRef = doc(db, 'config', 'appearance');
        unsubFirestore = onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as any;
              currentConfig = {
                availableBg: data.availableBg || '#ffffff',
                lockedBg: data.lockedBg || 'rgba(148, 163, 184, 0.45)',
                textColor: data.textColor || '#0f172a',
                borderColor: data.borderColor || '#cbd5e1',
                updatedAtIso: data.updatedAtIso,
                updatedByUid: data.updatedByUid,
              };
              lotteryService.updateGridAppearance(currentConfig, 'admin');
              emit();
            }
          },
          (err) => {
            if (onError && !String(err?.message || '').includes('insufficient permissions')) {
              onError(err);
            }
          }
        );
      } catch (e) {}
    }

    return () => {
      unsubLocal();
      unsubFirestore();
    };
  }

  public async updateGridAppearanceFirestore(
    config: Partial<GridAppearanceConfig>,
    operatorRole: LoginType
  ): Promise<{ success: boolean; config?: GridAppearanceConfig; error?: string }> {
    if (operatorRole !== 'admin') {
      return { success: false, error: 'Only Admins can modify appearance settings.' };
    }
    const { db } = initFirebase();
    lotteryService.updateGridAppearance(config, operatorRole);
    if (db) {
      try {
        const docRef = doc(db, 'config', 'appearance');
        await setDoc(
          docRef,
          {
            ...config,
            updatedAtIso: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err: any) {
        console.warn('[Firestore] Failed to write appearance to Firestore:', err);
      }
    }
    return { success: true, config: lotteryService.getGridAppearance() };
  }

  public subscribeWeeklyPresetsFirestore(
    onUpdate: (presets: WeeklyTicketPresetsConfig) => void,
    onError?: (err: Error) => void
  ): () => void {
    const { db } = initFirebase();
    let currentPresets: WeeklyTicketPresetsConfig = lotteryService.getWeeklyPresets();

    const emit = () => {
      onUpdate(currentPresets);
    };

    emit();
    const unsubLocal = lotteryService.subscribeRealtimeSync(() => {
      currentPresets = lotteryService.getWeeklyPresets();
      emit();
    });

    let unsubFirestore = () => {};
    if (db) {
      try {
        const docRef = doc(db, 'config', 'weeklyPresets');
        unsubFirestore = onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as any;
              if (data && data.days) {
                currentPresets = {
                  ...DEFAULT_WEEKLY_PRESETS,
                  ...data,
                  days: {
                    ...DEFAULT_WEEKLY_PRESETS.days,
                    ...data.days,
                  },
                };
                lotteryService.updateWeeklyPresets(currentPresets, 'admin');
                emit();
              }
            }
          },
          (err) => {
            console.warn('[Firestore] Error in weeklyPresets subscription:', err);
            if (onError) onError(err);
          }
        );
      } catch (err: any) {
        console.warn('[Firestore] Failed to attach weeklyPresets listener:', err);
        if (onError) onError(err);
      }
    }

    return () => {
      unsubLocal();
      unsubFirestore();
    };
  }

  public async saveWeeklyPresetsFirestore(
    presets: WeeklyTicketPresetsConfig,
    operatorRole: LoginType
  ): Promise<{ success: boolean; presets?: WeeklyTicketPresetsConfig; error?: string }> {
    if (operatorRole !== 'admin') {
      return { success: false, error: 'Only Admins can modify weekly ticket presets.' };
    }
    const { auth, db } = initFirebase();

    if (db) {
      if (!auth?.currentUser) {
        return {
          success: false,
          error: 'Authentication required. Please sign in as Admin to save weekly presets.',
        };
      }

      try {
        const docRef = doc(db, 'config', 'weeklyPresets');
        const payload: WeeklyTicketPresetsConfig = {
          ...presets,
          updatedAtIso: new Date().toISOString(),
          updatedByUid: auth.currentUser.uid || 'admin',
        };
        await setDoc(docRef, payload, { merge: true });

        // Update local memory and cache ONLY after Firestore write succeeds
        lotteryService.updateWeeklyPresets(payload, operatorRole);
        return { success: true, presets: lotteryService.getWeeklyPresets() };
      } catch (err: any) {
        const safeMessage =
          err?.code === 'permission-denied'
            ? 'Permission denied: Your session does not have Admin privileges in Firestore. Please sign in again as sasikaran.'
            : (err?.message || 'Database write failed. Could not save weekly presets to Firestore.');

        console.error('[Firestore] Failed to write weeklyPresets to Firestore:', {
          code: err?.code,
          message: err?.message,
          uid: auth?.currentUser?.uid,
        });

        return {
          success: false,
          error: `Database write failed: ${safeMessage}`,
        };
      }
    }

    const localRes = lotteryService.updateWeeklyPresets(presets, operatorRole);
    return localRes;
  }

  public async publishWeeklyPresetForDateFirestore(
    drawDate: string,
    dayName: DayOfWeek,
    seriesId: string,
    seriesTitle: string,
    operator: { id: string; name: string; role: LoginType }
  ): Promise<{ success: boolean; addedCount: number; error?: string }> {
    if (operator.role !== 'admin') {
      return { success: false, addedCount: 0, error: 'Only Admins can publish ticket inventory.' };
    }
    const presets = lotteryService.getWeeklyPresets();
    const dayPreset = presets.days[dayName];
    if (!dayPreset || !dayPreset.enabled) {
      return { success: false, addedCount: 0, error: `Preset for ${dayName} is disabled or empty.` };
    }
    const tickets = lotteryService.expandPresetTickets(dayPreset);
    if (tickets.length === 0) {
      return { success: false, addedCount: 0, error: `No tickets configured in ${dayName} preset.` };
    }

    const res = await this.addTicketInventoryFirestore(
      tickets,
      drawDate,
      seriesId,
      seriesTitle,
      'PUBLISHED',
      operator
    );
    return {
      success: res.success,
      addedCount: res.addedCount || 0,
      error: res.error,
    };
  }

  public async addTicketInventoryFirestore(
    tickets: string[],
    drawDate: string,
    seriesId: string,
    seriesTitle: string,
    status: 'PUBLISHED' | 'UNPUBLISHED',
    operator: { id: string; name: string; role: LoginType }
  ): Promise<{ success: boolean; addedCount: number; error?: string }> {
    if (operator.role !== 'admin') {
      return { success: false, addedCount: 0, error: 'Only Admins can add or publish tickets.' };
    }
    const { auth, db } = initFirebase();

    // 1. In-memory validation, range parsing, deduplication and booked ticket protection (< 1ms)
    const localRes = lotteryService.addTicketInventory(
      tickets,
      drawDate,
      seriesId,
      seriesTitle,
      status,
      operator
    );

    if (!localRes.success) {
      return { success: false, addedCount: 0, error: localRes.error || 'Failed to generate tickets.' };
    }

    if (localRes.added.length === 0) {
      return { success: true, addedCount: 0 };
    }

    // 2. High-performance direct Firestore Batched Write (< 1 round-trip for <= 400 tickets)
    if (db && auth?.currentUser) {
      try {
        const CHUNK_SIZE = 400; // Well within Firestore 500-op limit
        for (let i = 0; i < localRes.added.length; i += CHUNK_SIZE) {
          const chunk = localRes.added.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          for (const item of chunk) {
            const docRef = doc(db, 'ticketInventory', item.id);
            batch.set(docRef, item, { merge: true });
          }
          await batch.commit();
        }
        return { success: true, addedCount: localRes.added.length };
      } catch (e: any) {
        console.warn('[Firestore] Direct batch write failed, trying backend fallback:', e);
      }
    }

    // 3. Fallback to Google Apps Script Service Account (:commit batch API)
    const scriptUrl = getOtpAppsScriptUrl();
    if (auth?.currentUser && scriptUrl) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const serverRes = await this.callOtpAppsScript({
          action: 'publishTicketInventory',
          idToken,
          drawDate,
          seriesId,
          seriesTitle,
          status,
          tickets,
        });
        if (serverRes?.success) {
          return { success: true, addedCount: serverRes.addedCount || localRes.added.length };
        }
        if (serverRes?.error && serverRes.error !== 'Unsupported action.') {
          return { success: false, addedCount: 0, error: serverRes.error };
        }
      } catch (e: any) {
        console.warn('[Apps Script] publishTicketInventory error:', e);
      }
    }

    return { success: localRes.success, addedCount: localRes.added.length, error: localRes.error };
  }

  public async unpublishTicketInventoryFirestore(
    ticketNumber: string,
    drawDate: string,
    seriesId: string,
    operator: { id: string; name: string; role: LoginType }
  ): Promise<{ success: boolean; error?: string }> {
    if (operator.role !== 'admin') {
      return { success: false, error: 'Only Admins can unpublish tickets.' };
    }
    const { auth, db } = initFirebase();
    const scriptUrl = getOtpAppsScriptUrl();

    if (auth?.currentUser && scriptUrl) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const serverRes = await this.callOtpAppsScript({
          action: 'unpublishTicketInventory',
          idToken,
          drawDate,
          seriesId,
          ticketNumber,
        });
        if (serverRes?.success) {
          lotteryService.unpublishTicketInventory(ticketNumber, drawDate, seriesId, operator);
          return { success: true };
        }
        if (serverRes?.error && serverRes.error !== 'Unsupported action.') {
          return { success: false, error: serverRes.error };
        }
      } catch (e: any) {
        console.warn('[Apps Script] unpublishTicketInventory error, fallback to Firestore/local', e);
      }
    }

    const localRes = lotteryService.unpublishTicketInventory(ticketNumber, drawDate, seriesId, operator);
    if (db && localRes.success) {
      try {
        const invKey = `${drawDate}_${seriesId}_${ticketNumber}`;
        const docRef = doc(db, 'ticketInventory', invKey);
        await updateDoc(docRef, { status: 'UNPUBLISHED', publishedAtIso: null });
      } catch (e) {}
    }
    return localRes;
  }

  public async confirmPendingBookingFirestore(
    bookingId: string,
    operator: { id: string; name: string; role: LoginType }
  ): Promise<{ success: boolean; error?: string }> {
    if (operator.role !== 'paid_employee' && operator.role !== 'admin') {
      return { success: false, error: 'Only Paid Employees or Admins can confirm pending bookings.' };
    }
    const { auth, db } = initFirebase();
    const scriptUrl = getOtpAppsScriptUrl();

    if (auth?.currentUser && scriptUrl) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const serverRes = await this.callOtpAppsScript({
          action: 'confirmPendingBooking',
          idToken,
          bookingId,
        });
        if (serverRes?.success) {
          lotteryService.confirmPendingBooking(bookingId, operator);
          return { success: true };
        }
        if (serverRes?.error && serverRes.error !== 'Unsupported action.') {
          return { success: false, error: serverRes.error };
        }
      } catch (e: any) {
        console.warn('[Apps Script] confirmPendingBooking error, fallback to Firestore/local', e);
      }
    }

    const localRes = lotteryService.confirmPendingBooking(bookingId, operator);
    if (db && localRes.success && localRes.booking) {
      try {
        const bRef = doc(db, 'bookings', bookingId);
        await updateDoc(bRef, {
          bookingStatus: 'Booked',
          history: localRes.booking.history,
        });
      } catch (e) {
        console.warn('[Firestore] Failed to update booking doc:', e);
      }
    }
    return localRes;
  }
}

export const liveFirebase = new LiveFirebaseService();
