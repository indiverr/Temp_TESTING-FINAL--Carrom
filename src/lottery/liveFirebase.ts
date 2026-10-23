/**
 * Real Firebase Service Bridge
 * 
 * Provides live Cloud Firestore listeners, Firestore atomic transactions,
 * Firebase Storage uploads, and Firebase Auth session handling.
 * Explicitly exposes backend status without silent mock fallback in production mode.
 */

import { initFirebase, isFirebaseConfigured } from './firebaseConfig';
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
} from 'firebase/firestore';
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import {
  TicketBooking,
  SystemConfig,
  TodayWinnerRecord,
  ResultPaperDocument,
  SelectedTicketItem,
  LoginType,
  PaymentAuditEntry,
} from './types';
import { DEFAULT_CONFIG, createInitialSeedBookings } from './lotteryService';

export interface FirebaseConnectionStatus {
  isConfigured: boolean;
  isOnline: boolean;
  projectId: string;
  currentUser: { uid: string; phone: string; role: LoginType } | null;
  errorMessage?: string;
}

class LiveFirebaseService {
  private status: FirebaseConnectionStatus = {
    isConfigured: false,
    isOnline: false,
    projectId: '',
    currentUser: null,
  };

  constructor() {
    this.refreshStatus();
  }

  public refreshStatus(): FirebaseConnectionStatus {
    const { auth, db, configured } = initFirebase();
    this.status.isConfigured = configured;
    this.status.isOnline = Boolean(db);

    if (auth) {
      onAuthStateChanged(auth, (user: User | null) => {
        if (user) {
          // Token claims or profile record
          user.getIdTokenResult().then((tokenResult) => {
            const role = (tokenResult.claims.role as LoginType) || 'employee';
            this.status.currentUser = {
              uid: user.uid,
              phone: user.phoneNumber || '',
              role,
            };
          });
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

  /**
   * Atomic Ticket Booking via live Firestore transaction
   */
  public async bookTicketsFirestore(
    items: SelectedTicketItem[],
    customerName: string,
    customerPhone: string,
    performedBy: string,
    role: LoginType,
    drawDate: string,
    seriesId: string = 'default'
  ): Promise<{ success: boolean; bookedCount: number; error?: string }> {
    const { db } = initFirebase();
    if (!db) {
      return {
        success: false,
        bookedCount: 0,
        error: 'Firestore is not connected. Configure environment variables or enable Development Mode.',
      };
    }

    try {
      const result = await runTransaction(db, async (transaction) => {
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
            customerName: customerName || 'Walk-in Customer',
            customerPhone: customerPhone || '',
            bookedBy: performedBy,
            bookedAt: serverTimestamp(),
          });

          // Write booking item
          const bookingDocRef = doc(db, 'bookings', `${bookingBatchId}_${normNum}`);
          transaction.set(bookingDocRef, {
            id: `${bookingBatchId}_${normNum}`,
            ticketNumber: normNum,
            seriesTitle: configData.seriesTitle,
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
                notes: `Counter booking by ${performedBy}`,
              },
            ],
          });
        });

        // Audit Event
        const auditDocRef = doc(collection(db, 'auditEvents'));
        transaction.set(auditDocRef, {
          action: 'BOOKING_BATCH_CREATED',
          bookingBatchId,
          ticketCount: items.length,
          drawDate,
          performedBy,
          role,
          timestamp: serverTimestamp(),
        });

        return { success: true, bookedCount: items.length };
      });

      return result;
    } catch (err: any) {
      console.error('[Firestore] Booking Transaction Error:', err);
      return { success: false, bookedCount: 0, error: err.message };
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

    const { db } = initFirebase();
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
          ticketNumber,
          drawDate,
          customerName: data.customerName,
          amount,
          paymentMethod,
          paymentRef,
          confirmedBy,
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
}

export const liveFirebase = new LiveFirebaseService();
