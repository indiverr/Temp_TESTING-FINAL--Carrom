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
  EmployeeProfile,
  TicketBooking,
  SelectedTicketItem,
  SystemConfig,
  TodayWinnerRecord,
  ResultPaperDocument,
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

  // Backend Mode: 'firebase' (when configured) or 'development' (explicit mock)
  const [isLiveFirebaseMode, setIsLiveFirebaseMode] = useState<boolean>(() => isFirebaseConfigured());

  // Configuration state
  const [config, setConfig] = useState<SystemConfig>(lotteryService.getConfig());

  // Staff and Role state
  const [currentStaff, setCurrentStaff] = useState<EmployeeProfile>({
    id: 'EMP001',
    name: 'Sasikaran',
    phone: '9949311900',
    role: 'employee',
  });
  const [currentRole, setCurrentRole] = useState<LoginType>('employee');

  // Bookings state
  const [allBookings, setAllBookings] = useState<TicketBooking[]>(() =>
    lotteryService.getBookings()
  );

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
  const reloadData = () => {
    setAllBookings(lotteryService.getBookings());
    setWinners(lotteryService.getWinners());
    setPapers(lotteryService.getResultPapers());
    setConfig(lotteryService.getConfig());
  };

  // Handlers
  const handleLoginSuccess = (type: LoginType, name: string) => {
    setCurrentRole(type);
    setCurrentStaff({
      id: type === 'admin' ? 'ADM001' : type === 'paid_employee' ? 'PEM001' : 'EMP001',
      name: name || (type === 'admin' ? 'Super Admin' : 'Sasikaran'),
      phone: '9949311900',
      role: type,
    });
    // Advance to Enter Date screen
    setCurrentScreen('enter-date');
  };

  const handleBookSingleTicket = async (
    ticketNum: string,
    customerName: string,
    customerPhone: string
  ) => {
    if (isLiveFirebaseMode) {
      const fbRes = await liveFirebase.bookTicketsFirestore(
        [{ ticketNumber: ticketNum, half: false, full: true }],
        customerName,
        customerPhone,
        currentStaff.name,
        currentRole,
        config.businessDate
      );
      if (fbRes.success) {
        showToast(`[Firestore] Booked Ticket #${ticketNum}`);
        reloadData();
      } else {
        showToast(`[Firestore Error] ${fbRes.error}`);
      }
      return;
    }

    const res = lotteryService.bookTicketsTransaction(
      [{ ticketNumber: ticketNum, half: false, full: true }],
      customerName,
      customerPhone,
      currentStaff.name,
      currentRole,
      config.businessDate
    );
    if (res.success) {
      reloadData();
      showToast(`Booked Ticket #${ticketNum}`);
    } else {
      showToast(res.error || 'Failed to book');
    }
  };

  const handleBookMultipleTickets = async (
    items: SelectedTicketItem[],
    customerName: string,
    customerPhone: string
  ) => {
    if (isLiveFirebaseMode) {
      const fbRes = await liveFirebase.bookTicketsFirestore(
        items,
        customerName,
        customerPhone,
        currentStaff.name,
        currentRole,
        config.businessDate
      );
      if (fbRes.success) {
        showToast(`[Firestore] Booked ${fbRes.bookedCount} Tickets atomically!`);
        reloadData();
      } else {
        showToast(`[Firestore Error] ${fbRes.error}`);
      }
      return;
    }

    const res = lotteryService.bookTicketsTransaction(
      items,
      customerName,
      customerPhone,
      currentStaff.name,
      currentRole,
      config.businessDate
    );
    if (res.success) {
      reloadData();
      showToast(`Booked ${res.bookedCount} Tickets`);
    } else {
      showToast(res.error || 'Failed to book');
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

  const handleCancelBooking = (ticketNum: string, reason: string) => {
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

  const handleAddWinner = (
    winningNumber: string,
    prizeCategory: string,
    prizeAmount: number,
    notes?: string
  ) => {
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

  const handleUploadPaper = (title: string, fileUrl: string) => {
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

  const handleSaveConfig = (updated: Partial<SystemConfig>) => {
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

  const handleResetData = () => {
    lotteryService.resetAllToSeed();
    reloadData();
    showToast('Reset to Clean Demo State');
  };

  const unpaidList = allBookings.filter((b) => b.paymentStatus !== 'Paid');
  const paidList = allBookings.filter((b) => b.paymentStatus === 'Paid');

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
              onClick={() => setCurrentScreen('login')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentScreen === 'login'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setCurrentScreen('enter-date')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentScreen === 'enter-date'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Draw Date
            </button>
            <button
              onClick={() => setCurrentScreen('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentScreen === 'inventory'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Ticket Grid
            </button>
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentScreen === 'dashboard'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentScreen('unpaid')}
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
              onClick={() => setCurrentScreen('paid')}
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
              onClick={() => setCurrentScreen('winners')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentScreen === 'winners'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Winners
            </button>
            <button
              onClick={() => setCurrentScreen('papers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentScreen === 'papers'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Result Sheets
            </button>
            <button
              onClick={() => setCurrentScreen('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentScreen === 'settings'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Settings
            </button>
          </nav>

          {/* Operator identity */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-800">{currentStaff.name}</span>
            <span className="text-[10px] uppercase font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {currentRole === 'paid_employee' ? 'Supervisor' : currentRole}
            </span>
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
              {currentScreen === 'login' && (
                <LoginScreen onLoginSuccess={handleLoginSuccess} />
              )}
              {currentScreen === 'enter-date' && (
                <EnterDrawDateScreen
                  currentStaff={currentStaff}
                  onEnterDraw={() => setCurrentScreen('inventory')}
                  onOpenAvailableGallery={() => setIsGalleryOpen(true)}
                />
              )}
              {currentScreen === 'inventory' && (
                <TicketInventoryHeaderScreen
                  config={config}
                  bookedTickets={allBookings}
                  currentRole={currentRole}
                  onBookSingleTicket={handleBookSingleTicket}
                  onBookMultipleTickets={handleBookMultipleTickets}
                  onOpenBookedTicketsDashboard={() => setCurrentScreen('dashboard')}
                  onOpenAvailableGallery={() => setIsGalleryOpen(true)}
                  onExportRecords={handleExportRecords}
                />
              )}
              {currentScreen === 'dashboard' && (
                <BookedTicketsDashboardScreen
                  config={config}
                  unpaidCount={unpaidList.length}
                  paidCount={paidList.length}
                  winnersCount={winners.length}
                  papersCount={papers.length}
                  onNavigate={(view) => setCurrentScreen(view)}
                  onBack={() => setCurrentScreen('inventory')}
                  onSearchTicket={(num) => setCurrentScreen('unpaid')}
                />
              )}
              {currentScreen === 'unpaid' && (
                <UnpaidTicketsScreen
                  unpaidBookings={unpaidList}
                  currentRole={currentRole}
                  currentStaffName={currentStaff.name}
                  onConfirmPayment={handleConfirmPayment}
                  onCancelBooking={handleCancelBooking}
                  onBack={() => setCurrentScreen('dashboard')}
                />
              )}
              {currentScreen === 'paid' && (
                <PaidTicketsScreen
                  paidBookings={paidList}
                  currentRole={currentRole}
                  onBack={() => setCurrentScreen('dashboard')}
                  onReversePayment={(ticketNum, reason) => {
                    handleCancelBooking(ticketNum, reason);
                  }}
                />
              )}
              {currentScreen === 'winners' && (
                <TodayWinnerScreen
                  winners={winners}
                  currentRole={currentRole}
                  businessDate={config.businessDate}
                  seriesTitle={config.seriesTitle}
                  onAddWinner={handleAddWinner}
                  onBack={() => setCurrentScreen('dashboard')}
                />
              )}
              {currentScreen === 'papers' && (
                <ResultPaperScreen
                  papers={papers}
                  currentRole={currentRole}
                  businessDate={config.businessDate}
                  seriesTitle={config.seriesTitle}
                  onUploadPaper={handleUploadPaper}
                  onBack={() => setCurrentScreen('dashboard')}
                />
              )}
              {currentScreen === 'settings' && (
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
            {currentScreen === 'login' && (
              <LoginScreen onLoginSuccess={handleLoginSuccess} />
            )}
            {currentScreen === 'enter-date' && (
              <EnterDrawDateScreen
                currentStaff={currentStaff}
                onEnterDraw={() => setCurrentScreen('inventory')}
                onOpenAvailableGallery={() => setIsGalleryOpen(true)}
              />
            )}
            {currentScreen === 'inventory' && (
              <TicketInventoryHeaderScreen
                config={config}
                bookedTickets={allBookings}
                currentRole={currentRole}
                onBookSingleTicket={handleBookSingleTicket}
                onBookMultipleTickets={handleBookMultipleTickets}
                onOpenBookedTicketsDashboard={() => setCurrentScreen('dashboard')}
                onOpenAvailableGallery={() => setIsGalleryOpen(true)}
                onExportRecords={handleExportRecords}
              />
            )}
            {currentScreen === 'dashboard' && (
              <BookedTicketsDashboardScreen
                config={config}
                unpaidCount={unpaidList.length}
                paidCount={paidList.length}
                winnersCount={winners.length}
                papersCount={papers.length}
                onNavigate={(view) => setCurrentScreen(view)}
                onBack={() => setCurrentScreen('inventory')}
                onSearchTicket={(num) => setCurrentScreen('unpaid')}
              />
            )}
            {currentScreen === 'unpaid' && (
              <UnpaidTicketsScreen
                unpaidBookings={unpaidList}
                currentRole={currentRole}
                currentStaffName={currentStaff.name}
                onConfirmPayment={handleConfirmPayment}
                onCancelBooking={handleCancelBooking}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}
            {currentScreen === 'paid' && (
              <PaidTicketsScreen
                paidBookings={paidList}
                currentRole={currentRole}
                onBack={() => setCurrentScreen('dashboard')}
                onReversePayment={(ticketNum, reason) => {
                  handleCancelBooking(ticketNum, reason);
                }}
              />
            )}
            {currentScreen === 'winners' && (
              <TodayWinnerScreen
                winners={winners}
                currentRole={currentRole}
                businessDate={config.businessDate}
                seriesTitle={config.seriesTitle}
                onAddWinner={handleAddWinner}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}
            {currentScreen === 'papers' && (
              <ResultPaperScreen
                papers={papers}
                currentRole={currentRole}
                businessDate={config.businessDate}
                seriesTitle={config.seriesTitle}
                onUploadPaper={handleUploadPaper}
                onBack={() => setCurrentScreen('dashboard')}
              />
            )}
            {currentScreen === 'settings' && (
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
      />
    </div>
  );
};
