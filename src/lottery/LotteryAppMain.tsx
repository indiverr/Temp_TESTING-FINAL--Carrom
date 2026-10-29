import React, { useState, useEffect, useRef } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { LoginScreen } from './components/LoginScreen';
import { EnterDrawDateScreen } from './components/EnterDrawDateScreen';
import { TicketInventoryHeaderScreen } from './components/TicketInventoryHeaderScreen';
import { BookedTicketsDashboardScreen } from './components/BookedTicketsDashboardScreen';
import { UnpaidTicketsScreen } from './components/UnpaidTicketsScreen';
import { PaidTicketsScreen } from './components/PaidTicketsScreen';
import { TodayWinnerScreen } from './components/TodayWinnerScreen';
import { ResultPaperScreen } from './components/ResultPaperScreen';
import { ConfigSettingsScreen } from './components/ConfigSettingsScreen';
import { AvailableTicketsGalleryModal } from './components/AvailableTicketsGalleryModal';
import { PaymentQueueScreen } from './components/PaymentQueueScreen';

import { lotteryService } from './lotteryService';
import { liveFirebase } from './liveFirebase';
import { isFirebaseConfigured, getFirebaseConfigDiagnostics, isEmulatorMode } from './firebaseConfig';
import {
  LoginType,
  formatRoleLabel,
  EmployeeProfile,
  TicketBooking,
  TicketLock,
  SelectedTicketItem,
  SystemConfig,
  TodayWinnerRecord,
  ResultPaperDocument,
  TicketInventoryItem,
  GridAppearanceConfig,
  DEFAULT_GRID_APPEARANCE,
  WeeklyTicketPresetsConfig,
  DEFAULT_WEEKLY_PRESETS,
  DayOfWeek,
  PaymentQueueTask,
  ScheduledPublication,
} from './types';
import {
  Smartphone,
  RotateCcw,
  Settings,
  Shield,
  Download,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Database,
  Cloud,
} from 'lucide-react';

export const LotteryAppMain: React.FC = () => {
  // Navigation Screens:
  // 'login' | 'enter-date' | 'inventory' | 'dashboard' | 'unpaid' | 'paid' | 'winners' | 'papers' | 'settings' | 'payment-queue'
  const [currentScreen, setCurrentScreen] = useState<
    | 'login'
    | 'enter-date'
    | 'inventory'
    | 'dashboard'
    | 'unpaid'
    | 'paid'
    | 'winners'
    | 'papers'
    | 'settings'
    | 'payment-queue'
  >('login');
  const [authInitialMode, setAuthInitialMode] = useState<'credentials' | 'signup'>('credentials');

  // Backend Mode: 'firebase' (when configured) or 'development' (explicit mock)
  const [isLiveFirebaseMode, setIsLiveFirebaseMode] = useState<boolean>(() => isFirebaseConfigured());

  // Configuration state
  const [config, setConfig] = useState<SystemConfig>(lotteryService.getConfig());
  const [inventoryTickets, setInventoryTickets] = useState<TicketInventoryItem[]>([]);
  const [gridAppearance, setGridAppearance] = useState<GridAppearanceConfig>(DEFAULT_GRID_APPEARANCE);
  const [weeklyPresets, setWeeklyPresets] = useState<WeeklyTicketPresetsConfig>(DEFAULT_WEEKLY_PRESETS);
  const [scheduledPublications, setScheduledPublications] = useState<ScheduledPublication[]>([]);
  const paymentSubmissionKeysRef = useRef<Record<string, string>>({});

  // Staff and Role state
  const [currentStaff, setCurrentStaff] = useState<EmployeeProfile>({
    id: 'EMP001',
    name: 'Sasikaran',
    phone: '9949311900',
    role: 'employee',
  });
  const [currentRole, setCurrentRole] = useState<LoginType>('employee');
  const [isAuthenticatedAndVerified, setIsAuthenticatedAndVerified] = useState<boolean>(false);

  // Bookings state - isolated to authenticated operator session (empty on initial mount)
  const [allBookings, setAllBookings] = useState<TicketBooking[]>([]);

  // Real-time Ticket Locks state
  const [activeLocks, setActiveLocks] = useState<TicketLock[]>([]);

  // Restricted Payment Queue state (Paid Employee and Admin only)
  const [paymentQueueTasks, setPaymentQueueTasks] = useState<PaymentQueueTask[]>([]);

  // Persistent Employee Label mapping (Admin only)
  const [employeeLabelMap, setEmployeeLabelMap] = useState<Record<string, string>>({});

  // Cross-screen filter query
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState<string>('');

  // Winners and Papers state
  const [winners, setWinners] = useState<TodayWinnerRecord[]>(() =>
    isFirebaseConfigured() ? [] : lotteryService.getWinners()
  );
  const [papers, setPapers] = useState<ResultPaperDocument[]>(() =>
    isFirebaseConfigured() ? [] : lotteryService.getResultPapers()
  );

  // Gallery modal
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Device frame toggle (default false for responsive website display)
  const [isPhoneFramed, setIsPhoneFramed] = useState(false);

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync state helper
  const reloadData = async () => {
    const effectiveUid = currentStaff.id || liveFirebase.getStatus().currentUser?.uid || '';
    if (isLiveFirebaseMode) {
      try {
        const [fbBookings, fbWinners, fbPapers, fbConfig, fbAppearance] = await Promise.all([
          liveFirebase.fetchBookingsFirestore(config.businessDate, currentRole, effectiveUid),
          liveFirebase.fetchWinnersFirestore(config.businessDate),
          liveFirebase.fetchResultPapersFirestore(config.businessDate),
          liveFirebase.fetchConfigFirestore(),
          liveFirebase.fetchGridAppearanceFirestore(),
        ]);
        if (fbBookings !== undefined) setAllBookings(fbBookings);
        if (fbWinners !== undefined) setWinners(fbWinners);
        if (fbPapers !== undefined) setPapers(fbPapers);
        if (fbConfig) {
          const storedDate =
            (typeof window !== 'undefined' && localStorage.getItem('carrom_active_draw_date')) ||
            config.businessDate ||
            fbConfig.businessDate ||
            '29 Oct 2026';
          const mergedConfig: SystemConfig = {
            ...lotteryService.getConfig(),
            ...fbConfig,
            businessDate: storedDate,
            halfTicketPrice: (fbConfig.halfTicketPrice != null && Number(fbConfig.halfTicketPrice) >= 300) ? Number(fbConfig.halfTicketPrice) : 300,
            fullTicketPrice: (fbConfig.fullTicketPrice != null && Number(fbConfig.fullTicketPrice) >= 570) ? Number(fbConfig.fullTicketPrice) : 570,
          };
          setConfig(mergedConfig);
        }
        if (fbAppearance) setGridAppearance(fbAppearance);
      } catch (err: any) {
        showToast(`[Firestore Sync Error] ${err.message}`);
      }
      return;
    }

    setAllBookings(lotteryService.getBookings(config.businessDate, currentRole, effectiveUid));
    setActiveLocks(lotteryService.getActiveLocks(config.businessDate));
    setWinners(lotteryService.getWinners());
    setPapers(lotteryService.getResultPapers());
    setConfig(lotteryService.getConfig());
  };

  // Hardware back button support for Android native
  useEffect(() => {
    const handleBackButton = (e: Event) => {
      e.preventDefault();
      if (isGalleryOpen) {
        setIsGalleryOpen(false);
      } else if (['dashboard', 'unpaid', 'paid', 'winners', 'papers', 'settings'].includes(currentScreen)) {
        setCurrentScreen('inventory');
      } else if (currentScreen === 'inventory') {
        setCurrentScreen('enter-date');
      }
    };

    document.addEventListener('backbutton', handleBackButton);
    return () => {
      document.removeEventListener('backbutton', handleBackButton);
    };
  }, [isGalleryOpen, currentScreen]);

  // Restore authenticated session on page refresh (refresh-login persistence)
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('carrom_auth_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.role && parsed.name) {
          setIsAuthenticatedAndVerified(true);
          setCurrentRole(parsed.role);
          setCurrentStaff({
            id: parsed.uid || parsed.id || '',
            name: parsed.name,
            phone: parsed.phone || '9949311900',
            role: parsed.role,
            otpVerified: true,
          });
          setCurrentScreen((prev) => {
            if (prev === 'login') {
              return parsed.role === 'paid_employee'
                ? 'payment-queue'
                : parsed.role === 'admin'
                ? 'dashboard'
                : 'enter-date';
            }
            return prev;
          });
        }
      }
    } catch {}

    if (isLiveFirebaseMode) {
      const unsub = liveFirebase.subscribeAuthState((user) => {
        if (user && user.otpVerified) {
          setIsAuthenticatedAndVerified(true);
          setCurrentRole(user.role);
          setCurrentStaff({
            id: user.uid,
            name: user.name || 'Operator',
            phone: user.phone || '9949311900',
            role: user.role,
            otpVerified: true,
          });
          setCurrentScreen((prev) => {
            if (prev === 'login') {
              return user.role === 'paid_employee'
                ? 'payment-queue'
                : user.role === 'admin'
                ? 'dashboard'
                : 'enter-date';
            }
            return prev;
          });
        }
      });
      return () => unsub();
    }
  }, [isLiveFirebaseMode]);

  // Real-time Firestore sync listener when in live Firebase mode and verified
  useEffect(() => {
    if (!isAuthenticatedAndVerified) {
      setAllBookings([]);
      return;
    }
    const effectiveUid = currentStaff.id || liveFirebase.getStatus().currentUser?.uid || '';
    if (isLiveFirebaseMode) {
      const unsubscribe = liveFirebase.subscribeBookingsFirestore(
        config.businessDate,
        (bookings) => {
          setAllBookings(bookings);
        },
        (err) => {
          showToast(`[Firestore Sync Error] ${err.message}`);
        },
        currentRole,
        effectiveUid
      );
      return () => unsubscribe();
    }
    const unsubLocal = lotteryService.subscribeRealtimeSync(() => {
      setAllBookings(lotteryService.getBookings(config.businessDate, currentRole, effectiveUid));
    });
    setAllBookings(lotteryService.getBookings(config.businessDate, currentRole, effectiveUid));
    return () => unsubLocal();
  }, [isLiveFirebaseMode, isAuthenticatedAndVerified, config.businessDate, currentRole, currentStaff.id]);


  // Real-time Inventory & Appearance & Winners & Papers subscription
  useEffect(() => {
    if (isLiveFirebaseMode && isAuthenticatedAndVerified) {
      const unsubInv = liveFirebase.subscribeTicketInventoryFirestore(
        config.businessDate,
        'col-1',
        currentRole,
        (items) => setInventoryTickets(items)
      );
      const unsubApp = liveFirebase.subscribeGridAppearanceFirestore(
        (app) => setGridAppearance(app)
      );
      const unsubPresets = liveFirebase.subscribeWeeklyPresetsFirestore(
        (presets) => setWeeklyPresets(presets)
      );
      const unsubWinners = liveFirebase.subscribeWinnersFirestore(
        config.businessDate,
        (w) => setWinners(w)
      );
      const unsubPapers = liveFirebase.subscribeResultPapersFirestore(
        config.businessDate,
        (p) => setPapers(p)
      );
      const unsubSchedules = liveFirebase.subscribeScheduledPublicationsFirestore(
        (schedules) => setScheduledPublications(schedules)
      );
      return () => {
        unsubInv();
        unsubApp();
        unsubPresets();
        unsubWinners();
        unsubPapers();
        unsubSchedules();
      };
    }
    const unsubLocal = lotteryService.subscribeRealtimeSync(() => {
      setInventoryTickets(lotteryService.getInventory(config.businessDate, undefined, currentRole));
      setGridAppearance(lotteryService.getGridAppearance());
      setWeeklyPresets(lotteryService.getWeeklyPresets());
      setWinners(lotteryService.getWinners());
      setPapers(lotteryService.getResultPapers());
      setScheduledPublications(lotteryService.getScheduledPublications());
    });
    setInventoryTickets(lotteryService.getInventory(config.businessDate, undefined, currentRole));
    setGridAppearance(lotteryService.getGridAppearance());
    setWeeklyPresets(lotteryService.getWeeklyPresets());
    setWinners(lotteryService.getWinners());
    setPapers(lotteryService.getResultPapers());
    setScheduledPublications(lotteryService.getScheduledPublications());
    return () => unsubLocal();
  }, [isLiveFirebaseMode, isAuthenticatedAndVerified, config.businessDate, currentRole]);

  // Auto-process due scheduled ticket publications every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        if (isLiveFirebaseMode) {
          const res = await liveFirebase.processScheduledPublicationsFirestore();
          if (res?.processedCount && res.processedCount > 0) {
            showToast(`Auto-published ${res.processedCount} scheduled ticket release(s)!`);
          }
        } else {
          const res = lotteryService.processScheduledPublications();
          if (res?.processedCount && res.processedCount > 0) {
            setScheduledPublications(lotteryService.getScheduledPublications());
            showToast(`Auto-published ${res.processedCount} scheduled ticket release(s)!`);
          }
        }
      } catch (err) {
        console.warn('[AutoScheduleCheck] Error:', err);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isLiveFirebaseMode]);

  // Real-time Ticket Locks subscription
  useEffect(() => {
    if (isLiveFirebaseMode) {
      const unsub = liveFirebase.subscribeTicketLocksFirestore(
        config.businessDate,
        (locks) => setActiveLocks(locks),
        (err) => console.warn('[Locks Listener Error]', err.message)
      );
      return () => unsub();
    }
    const unsubLocal = lotteryService.subscribeRealtimeSync(() => {
      setActiveLocks(lotteryService.getActiveLocks(config.businessDate));
    });
    return () => unsubLocal();
  }, [isLiveFirebaseMode, config.businessDate]);

  // Real-time Payment Queue subscription (Paid Employee and Admin only)
  useEffect(() => {
    if (!isAuthenticatedAndVerified) {
      setPaymentQueueTasks([]);
      return;
    }
    if (currentRole !== 'paid_employee' && currentRole !== 'admin') {
      setPaymentQueueTasks([]);
      return;
    }
    if (isLiveFirebaseMode) {
      const unsub = liveFirebase.subscribePaymentQueueFirestore(
        config.businessDate,
        (tasks) => setPaymentQueueTasks(tasks),
        (err) => console.warn('[PaymentQueue Error]', err.message),
        currentRole
      );
      return () => unsub();
    }
    const unsubLocal = lotteryService.subscribeRealtimeSync(() => {
      setPaymentQueueTasks(lotteryService.getPaymentQueue(config.businessDate));
    });
    setPaymentQueueTasks(lotteryService.getPaymentQueue(config.businessDate, undefined, currentRole));
    return () => unsubLocal();
  }, [isLiveFirebaseMode, isAuthenticatedAndVerified, config.businessDate, currentRole]);

  // Real-time Employee Label mapping subscription (Admin only)
  useEffect(() => {
    if (!isAuthenticatedAndVerified || currentRole !== 'admin') {
      setEmployeeLabelMap({});
      return;
    }
    if (isLiveFirebaseMode) {
      const unsub = liveFirebase.subscribeEmployeeLabelsFirestore((map) => {
        setEmployeeLabelMap(map);
      });
      return () => unsub();
    }
    const unsubLocal = lotteryService.subscribeRealtimeSync(() => {
      setEmployeeLabelMap(lotteryService.getEmployeeLabelMap('admin'));
    });
    setEmployeeLabelMap(lotteryService.getEmployeeLabelMap('admin'));
    return () => unsubLocal();
  }, [isLiveFirebaseMode, isAuthenticatedAndVerified, currentRole]);

  // Guard against unauthorized screen states for non-admin roles
  useEffect(() => {
    if (!isAuthenticatedAndVerified) return;
    if (currentRole === 'paid_employee') {
      if (
        currentScreen !== 'payment-queue' &&
        currentScreen !== 'enter-date' &&
        currentScreen !== 'winners' &&
        currentScreen !== 'login'
      ) {
        setCurrentScreen('payment-queue');
      }
    } else if (currentRole === 'employee') {
      if (
        currentScreen === 'dashboard' ||
        currentScreen === 'papers' ||
        currentScreen === 'settings' ||
        currentScreen === 'payment-queue'
      ) {
        setCurrentScreen('inventory');
      }
    }
  }, [isAuthenticatedAndVerified, currentRole, currentScreen]);

  const navigateProtected = (
    targetScreen:
      | 'login'
      | 'enter-date'
      | 'inventory'
      | 'dashboard'
      | 'unpaid'
      | 'paid'
      | 'winners'
      | 'papers'
      | 'settings'
      | 'payment-queue'
  ) => {
    if (targetScreen === 'login') {
      try {
        localStorage.removeItem('carrom_auth_session');
      } catch {}
      liveFirebase.signOutUser();
      setIsAuthenticatedAndVerified(false);
      setAuthInitialMode('credentials');
      setCurrentScreen('login');
      // Wipe session state so previous user's records never linger
      setAllBookings([]);
      setActiveLocks([]);
      setPaymentQueueTasks([]);
      setEmployeeLabelMap({});
      setCurrentRole('employee');
      setCurrentStaff({
        id: '',
        name: '',
        phone: '',
        role: 'employee',
      });
      return;
    }
    if (!isAuthenticatedAndVerified) {
      showToast('Please sign in and complete verification first');
      setCurrentScreen('login');
      return;
    }

    // Role-based route authorization guards
    if (currentRole === 'paid_employee') {
      // Paid Employee: strictly restricted to Payment Queue, Enter Date, and Winners
      if (
        targetScreen !== 'payment-queue' &&
        targetScreen !== 'enter-date' &&
        targetScreen !== 'winners'
      ) {
        showToast('Access denied: Unauthorized view for your role');
        setCurrentScreen('payment-queue');
        return;
      }
    } else if (currentRole === 'employee') {
      // Regular Employee: can access Ticket Grid, Pending, Confirmed, Enter Date, Winners
      if (
        targetScreen === 'dashboard' ||
        targetScreen === 'papers' ||
        targetScreen === 'settings' ||
        targetScreen === 'payment-queue'
      ) {
        showToast('Access denied: Unauthorized view for your role');
        setCurrentScreen('inventory');
        return;
      }
    } else {
      // Admin: Legacy sub-screens route centrally into Overview
      if (
        targetScreen === 'unpaid' ||
        targetScreen === 'paid' ||
        targetScreen === 'papers'
      ) {
        setCurrentScreen('dashboard');
        return;
      }
    }

    setCurrentScreen(targetScreen);
  };

  // Handlers
  const handleLoginSuccess = (type: LoginType, name: string, uid?: string) => {
    const authUid =
      uid ||
      liveFirebase.getStatus().currentUser?.uid ||
      (type === 'admin' ? 'ADM001' : type === 'paid_employee' ? 'PEM001' : 'EMP001');

    setCurrentRole(type);
    setCurrentStaff({
      id: authUid,
      name: name || (type === 'admin' ? 'Sasikaran' : type === 'paid_employee' ? 'Gogul (Paid)' : 'Sasikaran'),
      phone: '9949311900',
      role: type,
      otpVerified: true,
    });
    try {
      localStorage.setItem(
        'carrom_auth_session',
        JSON.stringify({
          uid: authUid,
          name: name || (type === 'admin' ? 'Sasikaran' : type === 'paid_employee' ? 'Gogul (Paid)' : 'Sasikaran'),
          role: type,
          phone: '9949311900',
        })
      );
    } catch {}
    setIsAuthenticatedAndVerified(true);
    // Explicitly reset operational state so no stale records from any previous session linger
    setAllBookings([]);
    setPaymentQueueTasks([]);
    if (isLiveFirebaseMode) {
      setWinners([]);
      setPapers([]);
    }
    if (type === 'paid_employee') {
      setCurrentScreen('payment-queue');
    } else if (type === 'admin') {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('enter-date');
    }
  };

  const handleAcquireTicketLock = async (ticketNumbers: string[]) => {
    if (isLiveFirebaseMode) {
      return liveFirebase.acquireTicketLockFirestore(
        ticketNumbers,
        config.businessDate,
        currentStaff.id,
        currentStaff.name,
        currentStaff.name
      );
    }
    return lotteryService.acquireTicketLock(
      ticketNumbers,
      config.businessDate,
      currentStaff.id,
      currentStaff.name,
      currentStaff.name
    );
  };

  const handleRenewTicketLock = async (ticketNumbers: string[], lockId: string) => {
    if (isLiveFirebaseMode) {
      return liveFirebase.renewTicketLockFirestore(
        ticketNumbers,
        config.businessDate,
        lockId,
        currentStaff.id
      );
    }
    return lotteryService.renewTicketLock(
      ticketNumbers,
      config.businessDate,
      lockId,
      currentStaff.id
    );
  };

  const handleReleaseTicketLock = async (ticketNumbers: string[], lockId: string) => {
    if (isLiveFirebaseMode) {
      return liveFirebase.releaseTicketLockFirestore(
        ticketNumbers,
        config.businessDate,
        lockId,
        currentStaff.id
      );
    }
    return lotteryService.releaseTicketLock(
      ticketNumbers,
      config.businessDate,
      lockId,
      currentStaff.id
    );
  };

  const handleBookSingleTicket = async (
    ticketNum: string,
    customerName: string,
    customerPhone: string,
    options?: { lockId?: string; idempotencyKey?: string }
  ) => {
    return handleBookMultipleTickets(
      [{ ticketNumber: ticketNum, half: false, full: true }],
      customerName,
      customerPhone,
      options
    );
  };

  const handleBookMultipleTickets = async (
    items: SelectedTicketItem[],
    customerName: string,
    customerPhone: string,
    options?: { lockId?: string; idempotencyKey?: string }
  ) => {
    if (isLiveFirebaseMode) {
      const fbRes = await liveFirebase.bookTicketsFirestore(
        items,
        customerName,
        customerPhone,
        currentStaff.name,
        currentRole,
        config.businessDate,
        'default',
        {
          lockId: options?.lockId,
          idempotencyKey: options?.idempotencyKey,
          lockedByUid: currentStaff.id,
          bookedByUsername: currentStaff.name,
        }
      );
      if (fbRes.success) {
        showToast(
          `[Firestore] Booked ${fbRes.bookedCount} Ticket(s) successfully`
        );
        if (fbRes.bookings && fbRes.bookings.length > 0) {
          setAllBookings((prev) => [...(fbRes.bookings || []), ...prev]);
        }
        return fbRes;
      } else {
        showToast(`[Firestore Error] ${fbRes.error}`);
        return fbRes;
      }
    }

    const res = lotteryService.bookTicketsTransaction(
      items,
      customerName,
      customerPhone,
      currentStaff.name,
      currentRole,
      config.businessDate,
      {
        lockId: options?.lockId,
        lockedByUid: currentStaff.id,
        bookedByUsername: currentStaff.name,
        idempotencyKey: options?.idempotencyKey,
      }
    );
    if (res.success) {
      if (res.bookings && res.bookings.length > 0) {
        setAllBookings((prev) => [...(res.bookings || []), ...prev]);
      }
      setActiveLocks(lotteryService.getActiveLocks(config.businessDate));
      showToast(`Booked ${res.bookedCount} Ticket(s) successfully`);
      return res;
    } else {
      showToast(res.error || 'Failed to book');
      return res;
    }
  };

  const getDurableSubmissionKey = (ticketNum: string): string | undefined => {
    if (paymentSubmissionKeysRef.current[ticketNum]) {
      return paymentSubmissionKeysRef.current[ticketNum];
    }
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(`CARROM_PENDING_SUBMISSION_${ticketNum}`) || undefined;
      }
    } catch {}
    return undefined;
  };

  const setDurableSubmissionKey = (ticketNum: string, key: string): void => {
    paymentSubmissionKeysRef.current[ticketNum] = key;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(`CARROM_PENDING_SUBMISSION_${ticketNum}`, key);
      }
    } catch {}
  };

  const clearDurableSubmissionKey = (ticketNum: string): void => {
    delete paymentSubmissionKeysRef.current[ticketNum];
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(`CARROM_PENDING_SUBMISSION_${ticketNum}`);
      }
    } catch {}
  };

  const handleConfirmPayment = async (
    ticketNum: string,
    amount: number,
    paymentMethod: string,
    paymentRef: string,
    notes?: string,
    options?: { idempotencyKey?: string; newPayment?: boolean }
  ) => {
    if (isLiveFirebaseMode) {
      const recoveredKey = !options?.newPayment ? getDurableSubmissionKey(ticketNum) : undefined;
      const activeKey =
        options?.idempotencyKey ||
        (paymentRef && paymentRef.trim()) ||
        recoveredKey ||
        `idem_pay_${ticketNum}_${config.businessDate}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      setDurableSubmissionKey(ticketNum, activeKey);

      const fbRes = await liveFirebase.confirmPaymentFirestore(
        ticketNum,
        config.businessDate,
        amount,
        paymentMethod,
        paymentRef,
        currentStaff.name,
        currentRole,
        notes,
        { idempotencyKey: activeKey, newPayment: options?.newPayment }
      );
      if (fbRes.success) {
        clearDurableSubmissionKey(ticketNum);
        showToast(`[Firestore] Settlement confirmed for #${ticketNum}`);
        reloadData();
      } else {
        showToast(`[Firestore Error] ${fbRes.error}`);
      }
      return;
    }

    const res = lotteryService.confirmPaymentTransaction(
      ticketNum,
      config.businessDate,
      amount,
      paymentMethod,
      paymentRef,
      currentStaff.name,
      currentRole,
      notes
    );
    if (res.success) {
      reloadData();
      showToast(`Settlement confirmed for #${ticketNum}`);
    } else {
      showToast(res.error || 'Payment confirmation failed');
    }
  };

  const handleCompletePaymentTask = async (
    taskId: string,
    bookingId: string,
    amountPaid: number,
    paymentMethod: string,
    paymentRef: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (isLiveFirebaseMode) {
      const fbRes = await liveFirebase.completePaymentTask(
        taskId,
        bookingId,
        amountPaid,
        paymentMethod,
        paymentRef,
        currentStaff
      );
      if (fbRes.success) {
        showToast('Payment task completed.');
        reloadData();
        return { success: true };
      } else {
        showToast(`[Error] ${fbRes.error || 'Failed to complete task'}`);
        return { success: false, error: fbRes.error };
      }
    }

    const localRes = lotteryService.completePaymentTask(
      taskId,
      bookingId,
      amountPaid,
      paymentMethod,
      paymentRef,
      currentStaff,
      { idempotencyKey: `idem_pq_${taskId}_${Date.now()}` }
    );
    if (localRes.success) {
      showToast('Payment task completed.');
      reloadData();
      return { success: true };
    } else {
      showToast(localRes.error || 'Failed to complete task');
      return { success: false, error: localRes.error };
    }
  };

  const handleCancelBooking = async (ticketNum: string, reason: string) => {
    if (isLiveFirebaseMode) {
      const fbRes = await liveFirebase.cancelBookingFirestore(
        ticketNum,
        config.businessDate,
        reason,
        currentRole
      );
      if (fbRes.success) {
        showToast(`[Firestore] Cancelled Ticket #${ticketNum}`);
        reloadData();
      } else {
        showToast(`[Firestore Error] ${fbRes.error}`);
      }
      return;
    }

    const res = lotteryService.cancelBookingTransaction(
      ticketNum,
      config.businessDate,
      currentStaff.name,
      currentRole,
      reason
    );
    if (res.success) {
      reloadData();
      showToast(`Cancelled Ticket #${ticketNum}`);
    } else {
      showToast(res.error || 'Cancellation failed');
    }
  };

  const handleAddWinner = async (
    winningNumber: string,
    prizeCategory: string,
    prizeAmount: number,
    notes?: string
  ) => {
    return handleAddWinnerRecord({
      drawDate: config.businessDate,
      seriesTitle: config.seriesTitle,
      winningNumber,
      prizeCategory,
      prizeAmount,
      winningAmount: prizeAmount,
      notes,
    });
  };

  const handleAddWinnerRecord = async (
    record: Omit<TodayWinnerRecord, 'id' | 'enteredAt'>
  ) => {
    if (isLiveFirebaseMode) {
      const fbRes = await liveFirebase.addWinnerFirestore(
        {
          ...record,
          drawDate: record.drawDate || config.businessDate,
          seriesTitle: record.seriesTitle || config.seriesTitle,
          verifiedBy: record.verifiedBy || currentStaff.name,
          status: record.status || 'Official',
          enteredAt: new Date().toLocaleString([], {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        currentRole
      );
      if (fbRes.success) {
        showToast(`Announced Winner #${record.winningNumber}`);
        reloadData();
      } else {
        showToast(`[Firestore Error] ${fbRes.error}`);
      }
      return;
    }

    const res = lotteryService.addWinnerRecord(
      {
        ...record,
        drawDate: record.drawDate || config.businessDate,
        seriesTitle: record.seriesTitle || config.seriesTitle,
        verifiedBy: record.verifiedBy || currentStaff.name,
        status: record.status || 'Official',
      },
      currentRole
    );
    if (res.success) {
      reloadData();
      showToast(`Announced Winner #${record.winningNumber}`);
    } else {
      showToast(res.error || 'Failed to add winner');
    }
  };

  const handleUpdateWinnerAmount = async (winnerId: string, winningAmount: number) => {
    if (isLiveFirebaseMode) {
      const fbRes = await liveFirebase.updateWinnerAmountFirestore(winnerId, winningAmount, currentRole);
      if (fbRes.success) {
        showToast(`Updated winning amount: ₹${winningAmount.toLocaleString('en-IN')}`);
        reloadData();
      } else {
        showToast(`Update failed: ${fbRes.error}`);
      }
      return;
    }

    const res = lotteryService.updateWinnerAmount(winnerId, winningAmount, currentRole);
    if (res.success) {
      reloadData();
      showToast(`Updated winning amount: ₹${winningAmount.toLocaleString('en-IN')}`);
    } else {
      showToast(res.error || 'Failed to update winning amount');
    }
  };

  const handleDeleteWinner = async (winnerId: string) => {
    if (isLiveFirebaseMode) {
      const fbRes = await liveFirebase.deleteWinnerFirestore(winnerId, currentRole);
      if (fbRes.success) {
        showToast('Winner deleted successfully');
        reloadData();
      } else {
        showToast(`Delete failed: ${fbRes.error}`);
      }
      return;
    }

    const res = lotteryService.deleteWinnerRecord(winnerId, currentRole);
    if (res.success) {
      reloadData();
      showToast('Winner deleted successfully');
    } else {
      showToast(res.error || 'Failed to delete winner');
    }
  };

  const handleUploadPaper = async (title: string, fileUrl: string) => {
    if (isLiveFirebaseMode) {
      const fbRes = await liveFirebase.addResultPaperFirestore(
        {
          drawDate: config.businessDate,
          seriesTitle: config.seriesTitle,
          title,
          fileUrl,
          uploadedBy: currentStaff.name,
          uploadedAt: new Date().toLocaleString([], {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          fileSizeKb: 342,
          verifiedOfficial: true,
        },
        currentRole
      );
      if (fbRes.success) {
        showToast('Result Sheet Published to Firestore');
        reloadData();
      } else {
        showToast(fbRes.error || 'Publish failed');
      }
      return;
    }

    const res = lotteryService.addResultPaper(
      {
        drawDate: config.businessDate,
        seriesTitle: config.seriesTitle,
        title,
        fileUrl,
        uploadedBy: currentStaff.name,
        fileSizeKb: 342,
        verifiedOfficial: true,
      },
      currentRole
    );
    if (res.success) {
      reloadData();
      showToast('Result Paper Uploaded');
    } else {
      showToast(res.error || 'Upload failed');
    }
  };

  const handleSelectDrawDate = (selectedDate: string) => {
    const cleanDate = selectedDate.trim();
    if (!cleanDate) return;
    // 1. Establish canonical active draw date in config state immediately
    setConfig((prev) => ({ ...prev, businessDate: cleanDate }));
    // 2. Persist in localStorage so reloads and navigation restore this exact date
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('carrom_active_draw_date', cleanDate);
      }
    } catch {}
    // 3. Keep lotteryService aligned
    lotteryService.setActiveDrawDate(cleanDate);
    // 4. Navigate directly to ticket inventory
    setCurrentScreen('inventory');
  };

  const handleSaveConfig = async (updated: Partial<SystemConfig>) => {
    if (isLiveFirebaseMode) {
      const fbRes = await liveFirebase.updateConfigFirestore(updated, currentRole);
      if (fbRes.success) {
        showToast('[Firestore] System Configuration Updated');
        reloadData();
      } else {
        showToast(`[Firestore Error] ${fbRes.error}`);
      }
      return;
    }

    const res = lotteryService.updateConfig(updated, currentRole);
    if (res.success) {
      reloadData();
      showToast('System Configuration Updated');
    } else {
      showToast(res.error || 'Config update failed');
    }
  };

  const handleExportRecords = () => {
    // Generate CSV data for authorized download
    const rows = [
      ['Ticket Number', 'Series', 'Customer', 'Phone', 'Type', 'Status', 'Date'],
      ...allBookings.map((b) => [
        b.ticketNumber,
        b.seriesTitle,
        b.customerName,
        b.customerPhone,
        b.ticketType,
        b.paymentStatus,
        b.date,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lottery_Records_${config.businessDate.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Records CSV');
  };


  const handleAddTicketInventory = async (
    tickets: string[],
    drawDate: string,
    seriesId: string,
    seriesTitle: string,
    status: 'PUBLISHED' | 'UNPUBLISHED'
  ) => {
    if (isLiveFirebaseMode) {
      const res = await liveFirebase.addTicketInventoryFirestore(
        tickets,
        drawDate,
        seriesId,
        seriesTitle,
        status,
        { id: currentStaff.id, name: currentStaff.name, role: currentRole }
      );
      if (res.success) {
        showToast(`Added ${res.addedCount} tickets to inventory`);
        reloadData();
      } else {
        showToast(`[Error] ${res.error}`);
      }
      return res;
    }
    const localRes = lotteryService.addTicketInventory(
      tickets,
      drawDate,
      seriesId,
      seriesTitle,
      status,
      { id: currentStaff.id, name: currentStaff.name, role: currentRole }
    );
    if (localRes.success) {
      showToast(`Added ${localRes.added.length} tickets to inventory`);
      reloadData();
    } else {
      showToast(localRes.error || 'Failed to add tickets');
    }
    return { success: localRes.success, addedCount: localRes.added.length, error: localRes.error };
  };

  const handleSchedulePublication = async (params: {
    drawDate: string;
    seriesId: string;
    seriesTitle: string;
    tickets: string[];
    scheduledForMs: number;
    scheduledForIso?: string;
    scheduledForDisplay?: string;
    timezone?: string;
  }) => {
    if (isLiveFirebaseMode) {
      const res = await liveFirebase.scheduleTicketPublicationFirestore({
        ...params,
        operator: { id: currentStaff.id, name: currentStaff.name, role: currentRole },
      });
      if (res.success) {
        showToast(`Scheduled ${params.tickets.length} tickets for ${params.scheduledForDisplay || 'future release'}`);
        reloadData();
      } else {
        showToast(`[Error] ${res.error}`);
      }
      return res;
    }
    const localRes = lotteryService.schedulePublication({
      ...params,
      createdBy: currentStaff.name,
      createdByUid: currentStaff.id,
    });
    if (localRes.success) {
      setScheduledPublications(lotteryService.getScheduledPublications());
      showToast(`Scheduled ${params.tickets.length} tickets for ${params.scheduledForDisplay || 'future release'}`);
      reloadData();
    }
    return localRes;
  };

  const handleCancelScheduledPublication = async (scheduleId: string) => {
    if (isLiveFirebaseMode) {
      const res = await liveFirebase.cancelScheduledPublicationFirestore(scheduleId, {
        id: currentStaff.id,
        name: currentStaff.name,
        role: currentRole,
      });
      if (res.success) {
        showToast('Scheduled ticket publication cancelled');
        reloadData();
      } else {
        showToast(`[Error] ${res.error}`);
      }
      return res;
    }
    const localRes = lotteryService.cancelScheduledPublication(scheduleId);
    if (localRes.success) {
      setScheduledPublications(lotteryService.getScheduledPublications());
      showToast('Scheduled ticket publication cancelled');
      reloadData();
    } else {
      showToast(localRes.error || 'Failed to cancel schedule');
    }
    return localRes;
  };

  const handleUpdateScheduledPublication = async (
    scheduleId: string,
    params: {
      tickets: string[];
      scheduledForMs: number;
      scheduledForIso?: string;
      scheduledForDisplay?: string;
    }
  ) => {
    if (isLiveFirebaseMode) {
      const res = await liveFirebase.updateScheduledPublicationFirestore(scheduleId, params, {
        id: currentStaff.id,
        name: currentStaff.name,
        role: currentRole,
      });
      if (res.success) {
        showToast('Scheduled collection updated successfully');
        reloadData();
      } else {
        showToast(`[Error] ${res.error}`);
      }
      return res;
    }
    const localRes = lotteryService.updateScheduledPublication(scheduleId, params);
    if (localRes.success) {
      setScheduledPublications(lotteryService.getScheduledPublications());
      showToast('Scheduled collection updated successfully');
      reloadData();
    } else {
      showToast(localRes.error || 'Failed to update schedule');
    }
    return localRes;
  };

  const handleProcessScheduledPublications = async (): Promise<{ success: boolean; processedCount?: number }> => {
    if (isLiveFirebaseMode) {
      const res = await liveFirebase.processScheduledPublicationsFirestore();
      if (res.processedCount && res.processedCount > 0) {
        showToast(`Auto-published ${res.processedCount} scheduled release(s)!`);
        reloadData();
      }
      return res;
    }
    const localRes = lotteryService.processScheduledPublications();
    if (localRes.processedCount > 0) {
      setScheduledPublications(lotteryService.getScheduledPublications());
      showToast(`Auto-published ${localRes.processedCount} scheduled release(s)!`);
      reloadData();
    }
    return { success: localRes.success, processedCount: localRes.processedCount };
  };

  const handleUpdateGridAppearance = async (newConfig: Partial<GridAppearanceConfig>) => {
    setGridAppearance((prev) => ({ ...prev, ...newConfig }));
    if (isLiveFirebaseMode) {
      const res = await liveFirebase.updateGridAppearanceFirestore(newConfig, currentRole);
      if (res.success) {
        showToast('Appearance settings saved');
        if (res.config) setGridAppearance(res.config);
      }
      return res;
    }
    const localRes = lotteryService.updateGridAppearance(newConfig, currentRole);
    if (localRes.success) {
      showToast('Appearance settings saved');
      if (localRes.config) setGridAppearance(localRes.config);
    }
    return localRes;
  };

  const handleUpdateWeeklyPresets = async (newPresets: WeeklyTicketPresetsConfig) => {
    if (isLiveFirebaseMode) {
      const res = await liveFirebase.saveWeeklyPresetsFirestore(newPresets, currentRole);
      if (res.success) {
        showToast('Weekly ticket presets saved');
      } else {
        showToast(res.error || 'Failed to save presets');
      }
      return res;
    }
    const localRes = lotteryService.updateWeeklyPresets(newPresets, currentRole);
    if (localRes.success) {
      showToast('Weekly ticket presets saved');
    } else {
      showToast(localRes.error || 'Failed to save presets');
    }
    return localRes;
  };

  const handlePublishWeeklyPresetForDate = async (
    drawDate: string,
    dayName: DayOfWeek
  ): Promise<{ success: boolean; addedCount: number; error?: string }> => {
    if (currentRole !== 'admin') {
      showToast('Only Admins can publish ticket presets');
      return { success: false, addedCount: 0, error: 'Unauthorized' };
    }
    const operator = {
      id: currentStaff.id,
      name: currentStaff.name,
      role: currentRole,
    };
    if (isLiveFirebaseMode) {
      const res = await liveFirebase.publishWeeklyPresetForDateFirestore(
        drawDate,
        dayName,
        'col-1',
        config.seriesTitle || 'CARROM GOLD',
        operator
      );
      if (res.success) {
        showToast(`Published ${res.addedCount} tickets for ${dayName} (${drawDate})`);
      } else {
        showToast(res.error || 'Failed to publish preset');
      }
      return res;
    }
    const dayPreset = weeklyPresets.days[dayName];
    if (!dayPreset || !dayPreset.enabled) {
      showToast(`Preset for ${dayName} is disabled`);
      return { success: false, addedCount: 0, error: 'Disabled' };
    }
    const tickets = lotteryService.expandPresetTickets(dayPreset);
    const localRes = lotteryService.addTicketInventory(
      tickets,
      drawDate,
      'col-1',
      config.seriesTitle || 'CARROM GOLD',
      'PUBLISHED',
      operator
    );
    if (localRes.success) {
      showToast(`Published ${localRes.added.length} tickets for ${dayName} (${drawDate})`);
    } else {
      showToast(localRes.error || 'Failed to publish preset');
    }
    return { success: localRes.success, addedCount: localRes.added.length, error: localRes.error };
  };

  const handleConfirmPendingBooking = async (bookingId: string) => {
    if (isLiveFirebaseMode) {
      const res = await liveFirebase.confirmPendingBookingFirestore(bookingId, {
        id: currentStaff.id,
        name: currentStaff.name,
        role: currentRole,
      });
      if (res.success) {
        showToast('Booking successfully confirmed by Paid Employee!');
        reloadData();
      } else {
        showToast(`[Error] ${res.error}`);
      }
      return res;
    }
    const localRes = lotteryService.confirmPendingBooking(bookingId, {
      id: currentStaff.id,
      name: currentStaff.name,
      role: currentRole,
    });
    if (localRes.success) {
      showToast('Booking successfully confirmed by Paid Employee!');
      reloadData();
    } else {
      showToast(localRes.error || 'Failed to confirm');
    }
    return localRes;
  };

  const handleResetData = () => {
    lotteryService.resetAllToSeed();
    reloadData();
    showToast('Reset to Clean Demo State');
  };

  const unpaidList = allBookings.filter((b) => b.bookingStatus === 'Booked' && b.paymentStatus !== 'Paid');
  const confirmedList = allBookings.filter((b) => b.bookingStatus === 'Booked');
  const paidList = allBookings.filter((b) => b.bookingStatus === 'Booked' && b.paymentStatus === 'Paid');
  const pendingList = allBookings.filter((b) => b.bookingStatus === 'Pending Confirmation');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none selection:bg-blue-600 selection:text-white antialiased">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-white text-sm tracking-tight">
              CL
            </div>
            <div className="flex items-center space-x-2.5">
              <h1 className="font-bold text-sm sm:text-base tracking-tight text-slate-900">
                Carrom Lottery Desk
              </h1>
              <span className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-semibold">
                {config.seriesTitle}
              </span>
              <span className="hidden md:inline-flex items-center text-[11px] text-slate-500 font-medium border-l border-slate-200 pl-2.5">
                {config.businessDate}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-1 overflow-x-auto py-0.5">
            <button
              onClick={() => navigateProtected('login')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentScreen === 'login' && authInitialMode === 'credentials'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {isAuthenticatedAndVerified ? 'Sign Out' : 'Login'}
            </button>
            {!isAuthenticatedAndVerified && (
              <button
                onClick={() => {
                  setAuthInitialMode('signup');
                  setCurrentScreen('login');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  currentScreen === 'login' && authInitialMode === 'signup'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                Sign Up
              </button>
            )}
            <button
              onClick={() => navigateProtected('enter-date')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentScreen === 'enter-date'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Draw Date
            </button>

            {/* Ticket Grid: Admin and Regular Employee only (Paid Employee blocked from inventory) */}
            {currentRole !== 'paid_employee' && (
              <button
                onClick={() => navigateProtected('inventory')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  currentScreen === 'inventory'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Ticket Grid
              </button>
            )}

            {/* Admin Overview (Admin only) */}
            {currentRole === 'admin' && (
              <button
                onClick={() => navigateProtected('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  currentScreen === 'dashboard'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Overview
              </button>
            )}

            {/* Report: Paid Employee and Admin only */}
            {(currentRole === 'paid_employee' || currentRole === 'admin') && (
              <button
                onClick={() => navigateProtected('payment-queue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                  currentScreen === 'payment-queue'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Report</span>
                {paymentQueueTasks.filter((t) => t.status === 'PENDING').length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      currentScreen === 'payment-queue'
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-500 text-white animate-pulse'
                    }`}
                  >
                    {paymentQueueTasks.filter((t) => t.status === 'PENDING').length}
                  </span>
                )}
              </button>
            )}

            {/* Regular Employee Tabs: Pending and Confirmed */}
            {currentRole === 'employee' && (
              <>
                <button
                  onClick={() => navigateProtected('unpaid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                    currentScreen === 'unpaid'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>Pending</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      currentScreen === 'unpaid'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {pendingList.length}
                  </span>
                </button>
                <button
                  onClick={() => navigateProtected('paid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                    currentScreen === 'paid'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>Confirmed</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      currentScreen === 'paid'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {confirmedList.length}
                  </span>
                </button>
              </>
            )}

            {/* Winners Tab: Available to ALL verified roles (Requirement 7) */}
            <button
              onClick={() => navigateProtected('winners')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                currentScreen === 'winners'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Winners</span>
              {winners.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    currentScreen === 'winners'
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {winners.length}
                </span>
              )}
            </button>

            {/* Admin Settings (Admin only) */}
            {currentRole === 'admin' && (
              <button
                onClick={() => navigateProtected('settings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  currentScreen === 'settings'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Settings
              </button>
            )}
          </nav>

          {/* Operator identity & Backend Mode */}
          <div className="flex items-center space-x-2">
            <span
              className={`text-[10px] uppercase font-bold px-2 py-1 rounded border flex items-center space-x-1 ${
                isLiveFirebaseMode
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isEmulatorMode()
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={
                isLiveFirebaseMode
                  ? 'Connected to Firebase Firestore & Cloud Functions backend'
                  : isEmulatorMode()
                  ? 'Operating in local Firebase Emulator mode'
                  : getFirebaseConfigDiagnostics().diagnosticMessage || 'Operating in client-side simulated demonstration mode'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLiveFirebaseMode
                    ? 'bg-emerald-500 animate-pulse'
                    : isEmulatorMode()
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
              />
              <span>
                {isLiveFirebaseMode
                  ? 'Firebase Live'
                  : isEmulatorMode()
                  ? 'Emulator Mode'
                  : 'Demo (Unconfigured)'}
              </span>
            </span>

            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-800">{currentStaff.name}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {formatRoleLabel(currentRole)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Startup Safe Check Alert Banner if unconfigured in live mode */}
      {!isLiveFirebaseMode && !isEmulatorMode() && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 px-4 py-2.5 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Production Configuration Incomplete: </span>
              <span>
                {getFirebaseConfigDiagnostics().diagnosticMessage ||
                  'Firebase credentials for project "carrom-df56a" are missing. Live authentication is disabled.'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
            Auth Offline
          </span>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-2 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-start">
        {isPhoneFramed ? (
          <div className="w-full flex justify-center py-4">
            <PhoneFrame>
              {(!isAuthenticatedAndVerified || currentScreen === 'login') && (
                <LoginScreen
                  onLoginSuccess={handleLoginSuccess}
                  initialMode={authInitialMode}
                />
              )}
              {isAuthenticatedAndVerified && currentScreen === 'enter-date' && (
                <EnterDrawDateScreen
                  currentStaff={currentStaff}
                  currentDrawDate={config.businessDate}
                  allBookings={allBookings}
                  onEnterDraw={handleSelectDrawDate}
                  onOpenAvailableGallery={() => setIsGalleryOpen(true)}
                  weeklyPresets={weeklyPresets}
                />
              )}
              {isAuthenticatedAndVerified && currentScreen === 'inventory' && (
                <TicketInventoryHeaderScreen
                  config={config}
                  bookedTickets={allBookings}
                  activeLocks={activeLocks}
                  currentUserUid={currentStaff.id}
                  currentRole={currentRole}
                  inventoryTickets={inventoryTickets}
                  gridAppearance={gridAppearance}
                  weeklyPresets={weeklyPresets}
                  scheduledPublications={scheduledPublications}
                  onSchedulePublication={handleSchedulePublication}
                  onUpdateScheduledPublication={handleUpdateScheduledPublication}
                  onCancelScheduledPublication={handleCancelScheduledPublication}
                  onProcessScheduledPublications={handleProcessScheduledPublications}
                  onAddTicketInventory={handleAddTicketInventory}
                  onUpdateGridAppearance={handleUpdateGridAppearance}
                  onUpdateWeeklyPresets={handleUpdateWeeklyPresets}
                  onPublishWeeklyPresetForDate={handlePublishWeeklyPresetForDate}
                  onAcquireTicketLock={handleAcquireTicketLock}
                  onRenewTicketLock={handleRenewTicketLock}
                  onReleaseTicketLock={handleReleaseTicketLock}
                  onBookSingleTicket={handleBookSingleTicket}
                  onBookMultipleTickets={handleBookMultipleTickets}
                  onOpenBookedTicketsDashboard={() =>
                    navigateProtected(currentRole === 'admin' ? 'dashboard' : 'unpaid')
                  }
                  onOpenAvailableGallery={() => setIsGalleryOpen(true)}
                  onExportRecords={handleExportRecords}
                />
              )}
              {isAuthenticatedAndVerified && currentScreen === 'dashboard' && currentRole === 'admin' && (
                <BookedTicketsDashboardScreen
                  config={config}
                  allBookings={allBookings}
                  unpaidCount={unpaidList.length}
                  paidCount={paidList.length}
                  winnersCount={winners.length}
                  papersCount={papers.length}
                  pendingBookings={pendingList}
                  unpaidBookings={unpaidList}
                  paidBookings={paidList}
                  winners={winners}
                  papers={papers}
                  inventoryTickets={inventoryTickets}
                  weeklyPresets={weeklyPresets}
                  currentRole={currentRole}
                  currentStaffName={currentStaff.name}
                  onConfirmPendingBooking={handleConfirmPendingBooking}
                  onCancelBooking={handleCancelBooking}
                  onConfirmPayment={handleConfirmPayment}
                  onAddWinner={handleAddWinner}
                  onUploadPaper={handleUploadPaper}
                  onUpdateWeeklyPresets={handleUpdateWeeklyPresets}
                  onPublishWeeklyPresetForDate={handlePublishWeeklyPresetForDate}
                  onNavigate={(view) => navigateProtected(view)}
                  onBack={() => navigateProtected('inventory')}
                  onSearchTicket={(queryStr) => {
                    setDashboardSearchQuery(queryStr);
                    navigateProtected('unpaid');
                  }}
                />
              )}
              {isAuthenticatedAndVerified && currentScreen === 'unpaid' && (
                <UnpaidTicketsScreen
                  unpaidBookings={unpaidList}
                  pendingBookings={pendingList}
                  initialSearchQuery={dashboardSearchQuery}
                  currentRole={currentRole}
                  currentStaffName={currentStaff.name}
                  onConfirmPayment={handleConfirmPayment}
                  onCancelBooking={handleCancelBooking}
                  onConfirmPendingBooking={handleConfirmPendingBooking}
                  onBack={() => navigateProtected(currentRole === 'admin' ? 'dashboard' : 'inventory')}
                />
              )}
              {isAuthenticatedAndVerified && currentScreen === 'paid' && (
                <PaidTicketsScreen
                  paidBookings={currentRole === 'employee' ? confirmedList : paidList}
                  allBookings={allBookings}
                  initialSearchQuery={dashboardSearchQuery}
                  currentRole={currentRole}
                  onBack={() => navigateProtected(currentRole === 'admin' ? 'dashboard' : 'inventory')}
                  onReversePayment={(ticketNum, reason) => {
                    handleCancelBooking(ticketNum, reason);
                  }}
                />
              )}
              {isAuthenticatedAndVerified && currentScreen === 'payment-queue' && (
                <PaymentQueueScreen
                  tasks={paymentQueueTasks}
                  drawDate={config.businessDate}
                  allBookings={allBookings}
                  currentRole={currentRole}
                  currentStaffName={currentStaff.name}
                  employeeLabelMap={employeeLabelMap}
                  onCompleteTask={handleCompletePaymentTask}
                  onRefresh={() => reloadData()}
                  onBack={currentRole === 'admin' ? () => navigateProtected('dashboard') : undefined}
                />
              )}
              {isAuthenticatedAndVerified && currentScreen === 'winners' && (
                <TodayWinnerScreen
                  winners={winners}
                  allBookings={allBookings}
                  employeeLabelMap={employeeLabelMap}
                  currentRole={currentRole}
                  businessDate={config.businessDate}
                  seriesTitle={config.seriesTitle}
                  onAddWinner={handleAddWinner}
                  onAddWinnerRecord={handleAddWinnerRecord}
                  onUpdateWinnerAmount={handleUpdateWinnerAmount}
                  onDeleteWinner={handleDeleteWinner}
                  onBack={() => {
                    if (currentRole === 'admin') navigateProtected('dashboard');
                    else if (currentRole === 'paid_employee') navigateProtected('payment-queue');
                    else navigateProtected('inventory');
                  }}
                />
              )}
              {isAuthenticatedAndVerified && currentScreen === 'papers' && currentRole === 'admin' && (
                <ResultPaperScreen
                  papers={papers}
                  currentRole={currentRole}
                  businessDate={config.businessDate}
                  seriesTitle={config.seriesTitle}
                  onUploadPaper={handleUploadPaper}
                  onBack={() => navigateProtected('dashboard')}
                />
              )}
              {isAuthenticatedAndVerified && currentScreen === 'settings' && currentRole === 'admin' && (
                <ConfigSettingsScreen
                  config={config}
                  currentRole={currentRole}
                  onSaveConfig={handleSaveConfig}
                  onBack={() => navigateProtected('dashboard')}
                />
              )}
            </PhoneFrame>
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col">
            {(!isAuthenticatedAndVerified || currentScreen === 'login') && (
              <LoginScreen
                onLoginSuccess={handleLoginSuccess}
                initialMode={authInitialMode}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'enter-date' && (
              <EnterDrawDateScreen
                currentStaff={currentStaff}
                currentDrawDate={config.businessDate}
                allBookings={allBookings}
                onEnterDraw={handleSelectDrawDate}
                onOpenAvailableGallery={() => setIsGalleryOpen(true)}
                weeklyPresets={weeklyPresets}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'inventory' && (
              <TicketInventoryHeaderScreen
                config={config}
                bookedTickets={allBookings}
                activeLocks={activeLocks}
                currentUserUid={currentStaff.id}
                currentRole={currentRole}
                inventoryTickets={inventoryTickets}
                gridAppearance={gridAppearance}
                weeklyPresets={weeklyPresets}
                scheduledPublications={scheduledPublications}
                onSchedulePublication={handleSchedulePublication}
                onUpdateScheduledPublication={handleUpdateScheduledPublication}
                onCancelScheduledPublication={handleCancelScheduledPublication}
                onProcessScheduledPublications={handleProcessScheduledPublications}
                onAddTicketInventory={handleAddTicketInventory}
                onUpdateGridAppearance={handleUpdateGridAppearance}
                onUpdateWeeklyPresets={handleUpdateWeeklyPresets}
                onPublishWeeklyPresetForDate={handlePublishWeeklyPresetForDate}
                onAcquireTicketLock={handleAcquireTicketLock}
                onRenewTicketLock={handleRenewTicketLock}
                onReleaseTicketLock={handleReleaseTicketLock}
                onBookSingleTicket={handleBookSingleTicket}
                onBookMultipleTickets={handleBookMultipleTickets}
                onOpenBookedTicketsDashboard={() =>
                  navigateProtected(currentRole === 'admin' ? 'dashboard' : 'unpaid')
                }
                onOpenAvailableGallery={() => setIsGalleryOpen(true)}
                onExportRecords={handleExportRecords}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'dashboard' && currentRole === 'admin' && (
              <BookedTicketsDashboardScreen
                config={config}
                allBookings={allBookings}
                unpaidCount={unpaidList.length}
                paidCount={paidList.length}
                winnersCount={winners.length}
                papersCount={papers.length}
                pendingBookings={pendingList}
                unpaidBookings={unpaidList}
                paidBookings={paidList}
                winners={winners}
                papers={papers}
                inventoryTickets={inventoryTickets}
                weeklyPresets={weeklyPresets}
                currentRole={currentRole}
                currentStaffName={currentStaff.name}
                onConfirmPendingBooking={handleConfirmPendingBooking}
                onCancelBooking={handleCancelBooking}
                onConfirmPayment={handleConfirmPayment}
                onAddWinner={handleAddWinner}
                onUploadPaper={handleUploadPaper}
                onUpdateWeeklyPresets={handleUpdateWeeklyPresets}
                onPublishWeeklyPresetForDate={handlePublishWeeklyPresetForDate}
                onNavigate={(view) => navigateProtected(view)}
                onBack={() => navigateProtected('inventory')}
                onSearchTicket={(queryStr) => {
                  setDashboardSearchQuery(queryStr);
                  navigateProtected('unpaid');
                }}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'unpaid' && (
              <UnpaidTicketsScreen
                unpaidBookings={unpaidList}
                pendingBookings={pendingList}
                initialSearchQuery={dashboardSearchQuery}
                currentRole={currentRole}
                currentStaffName={currentStaff.name}
                onConfirmPayment={handleConfirmPayment}
                onCancelBooking={handleCancelBooking}
                onConfirmPendingBooking={handleConfirmPendingBooking}
                onBack={() => navigateProtected(currentRole === 'admin' ? 'dashboard' : 'inventory')}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'paid' && (
              <PaidTicketsScreen
                paidBookings={currentRole === 'employee' ? confirmedList : paidList}
                allBookings={allBookings}
                initialSearchQuery={dashboardSearchQuery}
                currentRole={currentRole}
                onBack={() => navigateProtected(currentRole === 'admin' ? 'dashboard' : 'inventory')}
                onReversePayment={(ticketNum, reason) => {
                  handleCancelBooking(ticketNum, reason);
                }}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'payment-queue' && (
              <PaymentQueueScreen
                tasks={paymentQueueTasks}
                drawDate={config.businessDate}
                allBookings={allBookings}
                currentRole={currentRole}
                currentStaffName={currentStaff.name}
                employeeLabelMap={employeeLabelMap}
                onCompleteTask={handleCompletePaymentTask}
                onRefresh={() => reloadData()}
                onBack={currentRole === 'admin' ? () => navigateProtected('dashboard') : undefined}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'winners' && (
              <TodayWinnerScreen
                winners={winners}
                allBookings={allBookings}
                employeeLabelMap={employeeLabelMap}
                currentRole={currentRole}
                businessDate={config.businessDate}
                seriesTitle={config.seriesTitle}
                onAddWinner={handleAddWinner}
                onAddWinnerRecord={handleAddWinnerRecord}
                onUpdateWinnerAmount={handleUpdateWinnerAmount}
                onDeleteWinner={handleDeleteWinner}
                onBack={() => {
                  if (currentRole === 'admin') navigateProtected('dashboard');
                  else if (currentRole === 'paid_employee') navigateProtected('payment-queue');
                  else navigateProtected('inventory');
                }}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'papers' && currentRole === 'admin' && (
              <ResultPaperScreen
                papers={papers}
                currentRole={currentRole}
                businessDate={config.businessDate}
                seriesTitle={config.seriesTitle}
                onUploadPaper={handleUploadPaper}
                onBack={() => navigateProtected('dashboard')}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'settings' && currentRole === 'admin' && (
              <ConfigSettingsScreen
                config={config}
                currentRole={currentRole}
                onSaveConfig={handleSaveConfig}
                onBack={() => navigateProtected('dashboard')}
              />
            )}
          </div>
        )}
      </main>

      {/* Available Tickets Gallery Modal */}
      <AvailableTicketsGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        bookedTickets={allBookings}
        activeLocks={activeLocks}
        inventoryTickets={inventoryTickets}
        drawDate={config.businessDate}
        seriesTitle={config.seriesTitle}
        appearance={gridAppearance}
      />
    </div>
  );
};
