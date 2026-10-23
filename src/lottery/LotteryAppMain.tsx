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
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-2.5 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center font-black text-white text-lg shadow-md shadow-blue-500/20">
              🎟️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900">
                  Carrom Lottery Desk
                </h1>
                <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                  {config.seriesTitle}
                </span>
                <span className="hidden md:inline-flex items-center text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                  📅 {config.businessDate}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Professional Ticket Booking, Payments & Prize Management Portal
              </p>
            </div>
          </div>

          {/* Quick Flow Navigator */}
          <div className="flex items-center space-x-1 overflow-x-auto py-1">
            <button
              onClick={() => setCurrentScreen('login')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentScreen === 'login'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setCurrentScreen('enter-date')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentScreen === 'enter-date'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Draw Date
            </button>
            <button
              onClick={() => setCurrentScreen('inventory')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentScreen === 'inventory'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Ticket Grid
            </button>
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentScreen === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentScreen('unpaid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                currentScreen === 'unpaid'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 bg-rose-50/70 hover:bg-rose-100/80'
              }`}
            >
              <span>Unpaid</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  currentScreen === 'unpaid'
                    ? 'bg-white/25 text-white'
                    : 'bg-rose-200 text-rose-800'
                }`}
              >
                {unpaidList.length}
              </span>
            </button>
            <button
              onClick={() => setCurrentScreen('paid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                currentScreen === 'paid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/80'
              }`}
            >
              <span>Paid</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  currentScreen === 'paid'
                    ? 'bg-white/25 text-white'
                    : 'bg-emerald-200 text-emerald-800'
                }`}
              >
                {paidList.length}
              </span>
            </button>
            <button
              onClick={() => setCurrentScreen('winners')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentScreen === 'winners'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-amber-800 bg-amber-50/70 hover:bg-amber-100/80'
              }`}
            >
              Winners
            </button>
            <button
              onClick={() => setCurrentScreen('papers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentScreen === 'papers'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80'
              }`}
            >
              Papers
            </button>
            <button
              onClick={() => setCurrentScreen('settings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentScreen === 'settings'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Settings
            </button>
          </div>

          {/* Action buttons & Staff identity */}
          <div className="flex items-center space-x-2">
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-700">{currentStaff.name}</span>
              <span className="text-[10px] uppercase font-black text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {currentRole}
              </span>
            </div>

            <button
              onClick={handleResetData}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all text-xs flex items-center space-x-1"
              title="Reset Database to clean demo state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline font-bold">Reset Demo</span>
            </button>

            <button
              onClick={() => setIsPhoneFramed(!isPhoneFramed)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                isPhoneFramed
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={
                isPhoneFramed
                  ? 'Exit phone preview and return to standard desktop website'
                  : 'Preview screen inside mobile phone frame'
              }
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isPhoneFramed ? 'Exit Phone Preview' : 'Phone Preview'}</span>
            </button>
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
