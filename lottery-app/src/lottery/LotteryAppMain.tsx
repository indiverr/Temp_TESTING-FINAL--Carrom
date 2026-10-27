import React, { useState, useEffect } from 'react';
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

import { lotteryService } from './lotteryService';
import { liveFirebase } from './liveFirebase';
import { isFirebaseConfigured } from './firebaseConfig';
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
} from './types';
import {
  Smartphone,
  RotateCcw,
  Settings,
  Shield,
  Download,
  CheckCircle,
  Database,
  Cloud,
} from 'lucide-react';

export const LotteryAppMain: React.FC = () => {
  // Navigation Screens:
  // 'login' | 'enter-date' | 'inventory' | 'dashboard' | 'unpaid' | 'paid' | 'winners' | 'papers' | 'settings'
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
  >('login');
  const [authInitialMode, setAuthInitialMode] = useState<'credentials' | 'signup'>('credentials');

  // Backend Mode: 'firebase' (when configured) or 'development' (explicit mock)
  const [isLiveFirebaseMode, setIsLiveFirebaseMode] = useState<boolean>(() => isFirebaseConfigured());

  // Configuration state
  const [config, setConfig] = useState<SystemConfig>(lotteryService.getConfig());
  const [inventoryTickets, setInventoryTickets] = useState<TicketInventoryItem[]>([]);
  const [gridAppearance, setGridAppearance] = useState<GridAppearanceConfig>(DEFAULT_GRID_APPEARANCE);
  const [weeklyPresets, setWeeklyPresets] = useState<WeeklyTicketPresetsConfig>(DEFAULT_WEEKLY_PRESETS);

  // Staff and Role state
  const [currentStaff, setCurrentStaff] = useState<EmployeeProfile>({
    id: 'EMP001',
    name: 'Sasikaran',
    phone: '9949311900',
    role: 'employee',
  });
  const [currentRole, setCurrentRole] = useState<LoginType>('employee');
  const [isAuthenticatedAndVerified, setIsAuthenticatedAndVerified] = useState<boolean>(false);

  // Bookings state
  const [allBookings, setAllBookings] = useState<TicketBooking[]>(() =>
    lotteryService.getBookings()
  );

  // Real-time Ticket Locks state
  const [activeLocks, setActiveLocks] = useState<TicketLock[]>(() =>
    lotteryService.getActiveLocks(config.businessDate)
  );

  // Cross-screen filter query
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState<string>('');

  // Winners and Papers state
  const [winners, setWinners] = useState<TodayWinnerRecord[]>(() =>
    lotteryService.getWinners()
  );
  const [papers, setPapers] = useState<ResultPaperDocument[]>(() =>
    lotteryService.getResultPapers()
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
    if (isLiveFirebaseMode) {
      try {
        const [fbBookings, fbWinners, fbPapers, fbConfig] = await Promise.all([
          liveFirebase.fetchBookingsFirestore(config.businessDate),
          liveFirebase.fetchWinnersFirestore(config.businessDate),
          liveFirebase.fetchResultPapersFirestore(config.businessDate),
          liveFirebase.fetchConfigFirestore(),
        ]);
        if (fbBookings.length > 0) setAllBookings(fbBookings);
        if (fbWinners.length > 0) setWinners(fbWinners);
        if (fbPapers.length > 0) setPapers(fbPapers);
        if (fbConfig) setConfig(fbConfig);
      } catch (err: any) {
        showToast(`[Firestore Sync Error] ${err.message}`);
      }
      return;
    }

    setAllBookings(lotteryService.getBookings());
    setActiveLocks(lotteryService.getActiveLocks(config.businessDate));
    setWinners(lotteryService.getWinners());
    setPapers(lotteryService.getResultPapers());
    setConfig(lotteryService.getConfig());
  };

  // Real-time Firestore sync listener when in live Firebase mode and verified
  useEffect(() => {
    if (!isLiveFirebaseMode || !isAuthenticatedAndVerified) return;
    const unsubscribe = liveFirebase.subscribeBookingsFirestore(
      config.businessDate,
      (bookings) => {
        setAllBookings(bookings);
      },
      (err) => {
        showToast(`[Firestore Sync Error] ${err.message}`);
      }
    );
    return () => unsubscribe();
  }, [isLiveFirebaseMode, isAuthenticatedAndVerified, config.businessDate]);


  // Real-time Inventory & Appearance subscription
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
      return () => {
        unsubInv();
        unsubApp();
        unsubPresets();
      };
    }
    const unsubLocal = lotteryService.subscribeRealtimeSync(() => {
      setInventoryTickets(lotteryService.getInventory(config.businessDate, undefined, currentRole));
      setGridAppearance(lotteryService.getGridAppearance());
      setWeeklyPresets(lotteryService.getWeeklyPresets());
    });
    setInventoryTickets(lotteryService.getInventory(config.businessDate, undefined, currentRole));
    setGridAppearance(lotteryService.getGridAppearance());
    setWeeklyPresets(lotteryService.getWeeklyPresets());
    return () => unsubLocal();
  }, [isLiveFirebaseMode, isAuthenticatedAndVerified, config.businessDate, currentRole]);

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
  ) => {
    if (targetScreen === 'login') {
      liveFirebase.signOutUser();
      setIsAuthenticatedAndVerified(false);
      setAuthInitialMode('credentials');
      setCurrentScreen('login');
      return;
    }
    if (!isAuthenticatedAndVerified) {
      showToast('Please sign in and complete verification first');
      setCurrentScreen('login');
      return;
    }
    setCurrentScreen(targetScreen);
  };

  // Handlers
  const handleLoginSuccess = (type: LoginType, name: string) => {
    setCurrentRole(type);
    setCurrentStaff({
      id: type === 'admin' ? 'ADM001' : type === 'paid_employee' ? 'PEM001' : 'EMP001',
      name: name || (type === 'admin' ? 'Sasikaran' : 'Sasikaran'),
      phone: '9949311900',
      role: type,
      otpVerified: true,
    });
    setIsAuthenticatedAndVerified(true);
    // Advance to Enter Date screen
    setCurrentScreen('enter-date');
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
          `[Firestore] Booked ${fbRes.bookedCount} Ticket(s) • Customer ID ${fbRes.customerId || '#5316'}`
        );
        reloadData();
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
      reloadData();
      showToast(`Booked ${res.bookedCount} Ticket(s) • Customer ID ${res.customerId || '#5316'}`);
      return res;
    } else {
      showToast(res.error || 'Failed to book');
      return res;
    }
  };

  const handleConfirmPayment = async (
    ticketNum: string,
    amount: number,
    paymentMethod: string,
    paymentRef: string,
    notes?: string
  ) => {
    if (isLiveFirebaseMode) {
      const fbRes = await liveFirebase.confirmPaymentFirestore(
        ticketNum,
        config.businessDate,
        amount,
        paymentMethod,
        paymentRef,
        currentStaff.name,
        currentRole,
        notes
      );
      if (fbRes.success) {
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
    if (isLiveFirebaseMode) {
      const fbRes = await liveFirebase.addWinnerFirestore(
        {
          drawDate: config.businessDate,
          seriesTitle: config.seriesTitle,
          winningNumber,
          prizeCategory,
          prizeAmount,
          verifiedBy: currentStaff.name,
          status: 'Official',
          notes,
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
        showToast(`[Firestore] Announced Winner #${winningNumber}`);
        reloadData();
      } else {
        showToast(`[Firestore Error] ${fbRes.error}`);
      }
      return;
    }

    const res = lotteryService.addWinnerRecord(
      {
        drawDate: config.businessDate,
        seriesTitle: config.seriesTitle,
        winningNumber,
        prizeCategory,
        prizeAmount,
        verifiedBy: currentStaff.name,
        status: 'Official',
        notes,
      },
      currentRole
    );
    if (res.success) {
      reloadData();
      showToast(`Announced Winner #${winningNumber}`);
    } else {
      showToast(res.error || 'Failed to add winner');
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

  const handleUpdateGridAppearance = async (newConfig: Partial<GridAppearanceConfig>) => {
    if (isLiveFirebaseMode) {
      const res = await liveFirebase.updateGridAppearanceFirestore(newConfig, currentRole);
      if (res.success) {
        showToast('Appearance settings saved');
      }
      return res;
    }
    const localRes = lotteryService.updateGridAppearance(newConfig, currentRole);
    if (localRes.success) {
      showToast('Appearance settings saved');
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
                {unpaidList.length}
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
                {paidList.length}
              </span>
            </button>
            <button
              onClick={() => navigateProtected('winners')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentScreen === 'winners'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Winners
            </button>
            <button
              onClick={() => navigateProtected('papers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentScreen === 'papers'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Result Sheets
            </button>
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
          </nav>

          {/* Operator identity & Backend Mode */}
          <div className="flex items-center space-x-2">
            <span
              className={`text-[10px] uppercase font-bold px-2 py-1 rounded border flex items-center space-x-1 ${
                isLiveFirebaseMode
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={
                isLiveFirebaseMode
                  ? 'Connected to Firebase Firestore & Cloud Functions backend'
                  : 'Operating in client-side simulated demonstration mode'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLiveFirebaseMode ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{isLiveFirebaseMode ? 'Firebase Live' : 'Demo Mode'}</span>
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
                  onEnterDraw={(selectedDate) => {
                    handleSaveConfig({ businessDate: selectedDate });
                    setCurrentScreen('inventory');
                  }}
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
                  onAddTicketInventory={handleAddTicketInventory}
                  onUpdateGridAppearance={handleUpdateGridAppearance}
                  onUpdateWeeklyPresets={handleUpdateWeeklyPresets}
                  onPublishWeeklyPresetForDate={handlePublishWeeklyPresetForDate}
                  onAcquireTicketLock={handleAcquireTicketLock}
                  onRenewTicketLock={handleRenewTicketLock}
                  onReleaseTicketLock={handleReleaseTicketLock}
                  onBookSingleTicket={handleBookSingleTicket}
                  onBookMultipleTickets={handleBookMultipleTickets}
                  onOpenBookedTicketsDashboard={() => setCurrentScreen('dashboard')}
                  onOpenAvailableGallery={() => setIsGalleryOpen(true)}
                  onExportRecords={handleExportRecords}
                />
              )}
              {isAuthenticatedAndVerified && currentScreen === 'dashboard' && (
                <BookedTicketsDashboardScreen
                  config={config}
                  allBookings={allBookings}
                  unpaidCount={unpaidList.length}
                  paidCount={paidList.length}
                  winnersCount={winners.length}
                  papersCount={papers.length}
                  onNavigate={(view) => setCurrentScreen(view)}
                  onBack={() => setCurrentScreen('inventory')}
                  onSearchTicket={(queryStr) => {
                    setDashboardSearchQuery(queryStr);
                    setCurrentScreen('unpaid');
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
                  onBack={() => setCurrentScreen('dashboard')}
                />
              )}
              {isAuthenticatedAndVerified && currentScreen === 'paid' && (
                <PaidTicketsScreen
                  paidBookings={paidList}
                  allBookings={allBookings}
                  initialSearchQuery={dashboardSearchQuery}
                  currentRole={currentRole}
                  onBack={() => setCurrentScreen('dashboard')}
                  onReversePayment={(ticketNum, reason) => {
                    handleCancelBooking(ticketNum, reason);
                  }}
                />
              )}
              {isAuthenticatedAndVerified && currentScreen === 'winners' && (
                <TodayWinnerScreen
                  winners={winners}
                  currentRole={currentRole}
                  businessDate={config.businessDate}
                  seriesTitle={config.seriesTitle}
                  onAddWinner={handleAddWinner}
                  onBack={() => setCurrentScreen('dashboard')}
                />
              )}
              {isAuthenticatedAndVerified && currentScreen === 'papers' && (
                <ResultPaperScreen
                  papers={papers}
                  currentRole={currentRole}
                  businessDate={config.businessDate}
                  seriesTitle={config.seriesTitle}
                  onUploadPaper={handleUploadPaper}
                  onBack={() => setCurrentScreen('dashboard')}
                />
              )}
              {isAuthenticatedAndVerified && currentScreen === 'settings' && (
                <ConfigSettingsScreen
                  config={config}
                  currentRole={currentRole}
                  onSaveConfig={handleSaveConfig}
                  onBack={() => setCurrentScreen('dashboard')}
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
                onEnterDraw={(selectedDate) => {
                  handleSaveConfig({ businessDate: selectedDate });
                  setCurrentScreen('inventory');
                }}
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
                onAddTicketInventory={handleAddTicketInventory}
                onUpdateGridAppearance={handleUpdateGridAppearance}
                onUpdateWeeklyPresets={handleUpdateWeeklyPresets}
                onPublishWeeklyPresetForDate={handlePublishWeeklyPresetForDate}
                onAcquireTicketLock={handleAcquireTicketLock}
                onRenewTicketLock={handleRenewTicketLock}
                onReleaseTicketLock={handleReleaseTicketLock}
                onBookSingleTicket={handleBookSingleTicket}
                onBookMultipleTickets={handleBookMultipleTickets}
                onOpenBookedTicketsDashboard={() => setCurrentScreen('dashboard')}
                onOpenAvailableGallery={() => setIsGalleryOpen(true)}
                onExportRecords={handleExportRecords}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'dashboard' && (
              <BookedTicketsDashboardScreen
                config={config}
                allBookings={allBookings}
                unpaidCount={unpaidList.length}
                paidCount={paidList.length}
                winnersCount={winners.length}
                papersCount={papers.length}
                onNavigate={(view) => setCurrentScreen(view)}
                onBack={() => setCurrentScreen('inventory')}
                onSearchTicket={(queryStr) => {
                  setDashboardSearchQuery(queryStr);
                  setCurrentScreen('unpaid');
                }}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'unpaid' && (
              <UnpaidTicketsScreen
                unpaidBookings={unpaidList}
                initialSearchQuery={dashboardSearchQuery}
                currentRole={currentRole}
                currentStaffName={currentStaff.name}
                onConfirmPayment={handleConfirmPayment}
                onCancelBooking={handleCancelBooking}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'paid' && (
              <PaidTicketsScreen
                paidBookings={paidList}
                allBookings={allBookings}
                initialSearchQuery={dashboardSearchQuery}
                currentRole={currentRole}
                onBack={() => setCurrentScreen('dashboard')}
                onReversePayment={(ticketNum, reason) => {
                  handleCancelBooking(ticketNum, reason);
                }}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'winners' && (
              <TodayWinnerScreen
                winners={winners}
                currentRole={currentRole}
                businessDate={config.businessDate}
                seriesTitle={config.seriesTitle}
                onAddWinner={handleAddWinner}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'papers' && (
              <ResultPaperScreen
                papers={papers}
                currentRole={currentRole}
                businessDate={config.businessDate}
                seriesTitle={config.seriesTitle}
                onUploadPaper={handleUploadPaper}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}
            {isAuthenticatedAndVerified && currentScreen === 'settings' && (
              <ConfigSettingsScreen
                config={config}
                currentRole={currentRole}
                onSaveConfig={handleSaveConfig}
                onBack={() => setCurrentScreen('dashboard')}
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
      />
    </div>
  );
};
