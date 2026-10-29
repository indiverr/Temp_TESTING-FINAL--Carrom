import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Trophy,
  FileSpreadsheet,
  Search,
  ArrowLeft,
  ChevronRight,
  Copy,
  Hash,
  Phone,
  User,
  X,
  Layers,
  Calendar,
  Clock,
  AlertCircle,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Upload,
  ExternalLink,
  ShieldAlert,
  Sliders,
  DollarSign,
  FileDown,
  Download,
  Loader2,
} from 'lucide-react';
import {
  SystemConfig,
  TicketBooking,
  TodayWinnerRecord,
  ResultPaperDocument,
  TicketInventoryItem,
  WeeklyTicketPresetsConfig,
  DayOfWeek,
  DayTicketPreset,
  DAYS_OF_WEEK,
  DEFAULT_WEEKLY_PRESETS,
  LoginType,
} from '../types';
import { lotteryService } from '../lotteryService';
import { liveFirebase } from '../liveFirebase';
import { generateCustomerPdfReport } from '../utils/customerPdfReport';

interface BookedTicketsDashboardProps {
  config: SystemConfig;
  allBookings?: TicketBooking[];
  unpaidCount?: number;
  paidCount?: number;
  winnersCount?: number;
  papersCount?: number;
  pendingBookings?: TicketBooking[];
  unpaidBookings?: TicketBooking[];
  paidBookings?: TicketBooking[];
  winners?: TodayWinnerRecord[];
  papers?: ResultPaperDocument[];
  inventoryTickets?: TicketInventoryItem[];
  weeklyPresets?: WeeklyTicketPresetsConfig;
  currentRole?: LoginType;
  currentStaffName?: string;
  onConfirmPendingBooking?: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  onCancelBooking?: (ticketNum: string, reason: string) => Promise<void>;
  onConfirmPayment?: (ticketNum: string, amount: number, paymentMethod: string, paymentRef: string, notes?: string) => Promise<void>;
  onAddWinner?: (winningNumber: string, prizeCategory: string, prizeAmount: number, notes?: string) => Promise<void>;
  onUploadPaper?: (title: string, fileUrl: string) => Promise<void>;
  onUpdateWeeklyPresets?: (newPresets: WeeklyTicketPresetsConfig) => Promise<{ success: boolean; presets?: WeeklyTicketPresetsConfig; error?: string }>;
  onPublishWeeklyPresetForDate?: (drawDate: string, dayName: DayOfWeek) => Promise<{ success: boolean; addedCount: number; error?: string }>;
  onNavigate?: (view: 'unpaid' | 'paid' | 'winners' | 'papers') => void;
  onBack: () => void;
  onSearchTicket?: (queryStr: string) => void;
}

// Helper to enforce canonical pricing: Half Set ₹300, Full Set ₹570, Both ₹870
const getBookingAmount = (b: TicketBooking): number => {
  if (b.halfSelected && b.fullSelected) return 870;
  if (b.fullSelected || b.ticketType === 'full') return 570;
  if (b.halfSelected || b.ticketType === 'half') return 300;
  if (b.totalAmount && b.totalAmount > 75) return b.totalAmount;
  return 570;
};

export const BookedTicketsDashboardScreen: React.FC<BookedTicketsDashboardProps> = ({
  config,
  allBookings = [],
  unpaidCount = 0,
  paidCount = 0,
  winnersCount = 0,
  papersCount = 0,
  pendingBookings = [],
  unpaidBookings = [],
  paidBookings = [],
  winners = [],
  papers = [],
  inventoryTickets = [],
  weeklyPresets = DEFAULT_WEEKLY_PRESETS,
  currentRole = 'admin',
  currentStaffName = 'Sasikaran',
  onConfirmPendingBooking,
  onCancelBooking,
  onConfirmPayment,
  onAddWinner,
  onUploadPaper,
  onUpdateWeeklyPresets,
  onPublishWeeklyPresetForDate,
  onNavigate,
  onBack,
  onSearchTicket,
}) => {
  // Navigation / active section within Admin Overview:
  // 'summary' | 'pending' | 'confirmed' | 'winners' | 'presets'
  const [activeTab, setActiveTab] = useState<'summary' | 'pending' | 'confirmed' | 'winners' | 'presets'>('summary');
  const [searchTicket, setSearchTicket] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Winner Entry State
  const [newWinnerTicket, setNewWinnerTicket] = useState('');
  const [newWinnerPrize, setNewWinnerPrize] = useState('');
  const [newWinnerAmount, setNewWinnerAmount] = useState('500');
  const [isAddingWinner, setIsAddingWinner] = useState(false);

  // Result Paper State
  const [isUploadingPaper, setIsUploadingPaper] = useState(false);

  // Weekly Presets Editing State
  const [editingPresets, setEditingPresets] = useState<WeeklyTicketPresetsConfig>(weeklyPresets);
  const [selectedPresetDay, setSelectedPresetDay] = useState<DayOfWeek>('Monday');
  const [isSavingPresets, setIsSavingPresets] = useState(false);
  const [presetFeedback, setPresetFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPublishingPreset, setIsPublishingPreset] = useState(false);

  // Customer PDF Report State
  const [isCustomerReportModalOpen, setIsCustomerReportModalOpen] = useState(false);
  const [reportFilterMode, setReportFilterMode] = useState<'all' | 'specific' | 'range'>('all');
  const [reportSpecificDate, setReportSpecificDate] = useState(config.businessDate);
  const [reportStartDate, setReportStartDate] = useState(config.businessDate);
  const [reportEndDate, setReportEndDate] = useState(config.businessDate);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleGenerateCustomerReport = async () => {
    if (currentRole !== 'admin') {
      setReportFeedback({ type: 'error', message: 'Unauthorized: Only Administrators can download customer reports.' });
      return;
    }
    setIsGeneratingReport(true);
    setReportFeedback(null);
    try {
      const filter =
        reportFilterMode === 'specific'
          ? { mode: 'specific' as const, date: reportSpecificDate }
          : reportFilterMode === 'range'
          ? { mode: 'range' as const, startDate: reportStartDate, endDate: reportEndDate }
          : { mode: 'all' as const };

      const filterLabel =
        reportFilterMode === 'specific'
          ? `Date: ${reportSpecificDate}`
          : reportFilterMode === 'range'
          ? `Range: ${reportStartDate} to ${reportEndDate}`
          : 'All Recorded Dates';

      const bookings = await liveFirebase.fetchCustomerReportBookings(currentRole, filter);

      if (!bookings || bookings.length === 0) {
        setReportFeedback({
          type: 'error',
          message: `No completed customer bookings found for ${filterLabel}.`,
        });
        setIsGeneratingReport(false);
        return;
      }

      const res = generateCustomerPdfReport({
        bookings,
        drawDateFilterLabel: filterLabel,
        adminName: currentStaffName || 'Administrator',
        adminId: 'ADM001',
        saveToFile: true,
      });

      if (res.success) {
        setReportFeedback({
          type: 'success',
          message: `Report generated successfully! Downloaded ${res.recordCount} records across ${res.pageCount} page(s).`,
        });
        setTimeout(() => {
          setIsCustomerReportModalOpen(false);
          setReportFeedback(null);
        }, 2200);
      } else {
        setReportFeedback({
          type: 'error',
          message: res.error || 'Failed to generate customer PDF report.',
        });
      }
    } catch (err: any) {
      setReportFeedback({
        type: 'error',
        message: err?.message || 'Error fetching customer booking records.',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Sync incoming weekly presets
  React.useEffect(() => {
    if (weeklyPresets) {
      setEditingPresets(weeklyPresets);
    }
  }, [weeklyPresets]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(code);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopiedId(code);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const normalizedQuery = searchTicket.trim().toLowerCase();
  const normalizedDigits = normalizedQuery.replace(/^#/, '');

  // Filter bookings across all views
  const filterBookingList = (list: TicketBooking[]) => {
    if (!normalizedQuery) return list;
    return list.filter((b) => {
      const cid = String(b.customerId || '').toLowerCase();
      const cidDigits = cid.replace(/^#/, '');
      const tnum = String(b.ticketNumber || '').toLowerCase();
      const cname = String(b.customerName || '').toLowerCase();
      const cphone = String(b.customerPhone || '').toLowerCase();
      const buser = String(b.bookedByUsername || b.bookedBy || '').toLowerCase();
      return (
        cid.includes(normalizedQuery) ||
        (normalizedDigits.length > 0 && cidDigits === normalizedDigits) ||
        tnum.includes(normalizedQuery) ||
        cname.includes(normalizedQuery) ||
        cphone.includes(normalizedQuery) ||
        buser.includes(normalizedQuery)
      );
    });
  };

  const allFilteredBookings = filterBookingList(allBookings);
  const effectivePendingList = allBookings.filter((b) => b.bookingStatus === 'Pending Confirmation');
  const filteredPendingList = filterBookingList(effectivePendingList);

  const effectiveConfirmedList = allBookings.filter((b) => b.bookingStatus === 'Booked');
  const filteredConfirmedList = filterBookingList(effectiveConfirmedList);

  // Set of ticket numbers that are currently booked or pending confirmation for the current draw date
  const bookedOrPendingNumbers = new Set(
    allBookings
      .filter((b) => b.bookingStatus === 'Booked' || b.bookingStatus === 'Pending Confirmation')
      .map((b) => b.ticketNumber)
  );

  // Inventory stats for selected draw date
  const totalPublished = inventoryTickets.filter((t) => t.status === 'PUBLISHED').length;
  const availableCount = inventoryTickets.filter(
    (t) =>
      t.status === 'PUBLISHED' &&
      t.bookingStatus !== 'Booked' &&
      t.bookingStatus !== 'Pending Confirmation' &&
      !bookedOrPendingNumbers.has(t.ticketNumber)
  ).length;
  const bookedCount = allBookings.filter((b) => b.bookingStatus === 'Booked').length;
  const pendingCount = effectivePendingList.length;
  const paidCountActual = allBookings.filter(
    (b) =>
      b.bookingStatus === 'Booked' &&
      b.paymentStatus === 'Paid' &&
      (b.remainingBalance === 0 || b.amountPaid >= b.totalAmount)
  ).length;

  // Actions
  const handleConfirmPending = async (bookingId: string) => {
    if (!onConfirmPendingBooking) return;
    setActionLoadingId(bookingId);
    setActionMessage(null);
    try {
      const res = await onConfirmPendingBooking(bookingId);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Booking successfully confirmed!' });
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to confirm booking.' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e?.message || 'Error confirming booking.' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleCancel = async (ticketNumber: string) => {
    const reason = window.prompt(`Enter cancellation reason for ticket #${ticketNumber}:`, 'Cancelled by Admin');
    if (!reason) return;
    if (!onCancelBooking) return;
    setActionLoadingId(ticketNumber);
    setActionMessage(null);
    try {
      await onCancelBooking(ticketNumber, reason);
      setActionMessage({ type: 'success', text: `Ticket #${ticketNumber} cancelled successfully.` });
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e?.message || 'Error cancelling ticket.' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleAddWinnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWinnerTicket.trim() || !newWinnerPrize.trim()) return;
    if (!onAddWinner) return;
    setIsAddingWinner(true);
    setActionMessage(null);
    try {
      await onAddWinner(newWinnerTicket.trim(), newWinnerPrize.trim(), parseFloat(newWinnerAmount) || 0);
      setActionMessage({ type: 'success', text: `Winner for ticket #${newWinnerTicket} recorded!` });
      setNewWinnerTicket('');
      setNewWinnerPrize('');
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e?.message || 'Error adding winner.' });
    } finally {
      setIsAddingWinner(false);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadPaper) return;
    setIsUploadingPaper(true);
    setActionMessage(null);
    try {
      // In this environment, paper documents are uploaded with a safe title and local/storage URL
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          await onUploadPaper(file.name, dataUrl);
          setActionMessage({ type: 'success', text: `Result sheet "${file.name}" uploaded successfully!` });
        } catch (e: any) {
          setActionMessage({ type: 'error', text: e?.message || 'Error uploading file.' });
        } finally {
          setIsUploadingPaper(false);
          setTimeout(() => setActionMessage(null), 3500);
        }
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      setIsUploadingPaper(false);
      setActionMessage({ type: 'error', text: e?.message || 'Error uploading file.' });
      setTimeout(() => setActionMessage(null), 3500);
    } finally {
      e.target.value = '';
    }
  };

  // Preset Handlers
  const activeDayPreset = editingPresets.days[selectedPresetDay] || DEFAULT_WEEKLY_PRESETS.days[selectedPresetDay];

  const updateCurrentDayPreset = (updates: Partial<DayTicketPreset>) => {
    setEditingPresets((prev) => {
      const current = prev.days[selectedPresetDay] || DEFAULT_WEEKLY_PRESETS.days[selectedPresetDay];
      const merged: DayTicketPreset = {
        ...current,
        ...updates,
        dayName: selectedPresetDay,
      };
      merged.tickets = lotteryService.expandPresetTickets(merged);
      return {
        ...prev,
        days: {
          ...prev.days,
          [selectedPresetDay]: merged,
        },
      };
    });
  };

  const handleSaveAllPresets = async () => {
    setIsSavingPresets(true);
    setPresetFeedback(null);
    try {
      if (onUpdateWeeklyPresets) {
        const res = await onUpdateWeeklyPresets(editingPresets);
        if (res && !res.success) {
          setPresetFeedback({ type: 'error', text: res.error || 'Database write failed. Presets not saved.' });
          setIsSavingPresets(false);
          return;
        }
      } else {
        lotteryService.updateWeeklyPresets(editingPresets, currentRole);
      }
      setPresetFeedback({ type: 'success', text: 'Weekly presets saved and verified in database!' });
      setTimeout(() => setPresetFeedback(null), 4000);
    } catch (e: any) {
      setPresetFeedback({ type: 'error', text: e?.message || 'Error saving presets.' });
    } finally {
      setIsSavingPresets(false);
    }
  };

  const handlePublishDayPreset = async () => {
    if (!onPublishWeeklyPresetForDate) return;
    setIsPublishingPreset(true);
    setPresetFeedback(null);
    try {
      const res = await onPublishWeeklyPresetForDate(config.businessDate, selectedPresetDay);
      if (res.success) {
        setPresetFeedback({
          type: 'success',
          text: `Published ${res.addedCount} tickets from ${selectedPresetDay} preset to ${config.businessDate}!`,
        });
      } else {
        setPresetFeedback({ type: 'error', text: res.error || 'Failed to publish preset.' });
      }
      setTimeout(() => setPresetFeedback(null), 4000);
    } catch (e: any) {
      setPresetFeedback({ type: 'error', text: e?.message || 'Error publishing preset.' });
    } finally {
      setIsPublishingPreset(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4 select-none pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Back to Ticket Grid"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Admin Centralized Overview
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {config.seriesTitle || 'CARROM GOLD'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unified command center: Inventory, Pending Approvals, Confirmed Records, Winners &amp; 7-Day Presets
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto flex-wrap gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Draw: <strong className="text-slate-900">{config.businessDate}</strong></span>
          </div>
        </div>
      </div>

      {/* Real-time Inventory Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Published</div>
          <div className="text-xl font-black text-slate-900 mt-0.5">{totalPublished}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">For {config.businessDate}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Available</div>
          <div className="text-xl font-black text-emerald-700 mt-0.5">{availableCount}</div>
          <div className="text-[10px] text-emerald-600/70 mt-0.5">Ready for booking</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Pending</div>
          <div className="text-xl font-black text-amber-700 mt-0.5">{pendingCount}</div>
          <div className="text-[10px] text-amber-600/70 mt-0.5">Awaiting confirmation</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Confirmed</div>
          <div className="text-xl font-black text-blue-700 mt-0.5">{bookedCount}</div>
          <div className="text-[10px] text-blue-600/70 mt-0.5">Officially booked</div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 border transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {actionMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Centralized Overview Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex flex-wrap items-center gap-1.5 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'summary' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Bookings</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-white/20 text-white">
            {allBookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Approvals</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-500/30 text-white">
            {effectivePendingList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('confirmed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'confirmed' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Confirmed &amp; Paid</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-500/30 text-white">
            {effectiveConfirmedList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('winners')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'winners' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Winners &amp; Results</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-purple-500/30 text-white">
            {winners.length + papers.length}
          </span>
        </button>
      </div>

      {/* Global Filter Bar (Available on Tables) */}
      <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by Ticket #, Customer Name, Phone, or Employee..."
            value={searchTicket}
            onChange={(e) => setSearchTicket(e.target.value)}
            className="w-full pl-10 pr-24 py-2 text-xs bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:border-slate-900 font-medium text-slate-800"
          />
          {searchTicket && (
            <button
              type="button"
              onClick={() => setSearchTicket('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      {/* TAB 1: SUMMARY (ALL BOOKINGS) */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center space-x-2">
              <Hash className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                All Customer Bookings ({allFilteredBookings.length})
              </h3>
            </div>
            {onNavigate && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onNavigate('unpaid')}
                  className="text-[11px] font-bold text-amber-700 hover:underline"
                >
                  Open Pending Screen →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('paid')}
                  className="text-[11px] font-bold text-blue-700 hover:underline"
                >
                  Open Confirmed Screen →
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider whitespace-nowrap sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Ticket #</th>
                  <th className="py-2.5 px-3">Set Type</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Draw Date</th>
                  <th className="py-2.5 px-3">Booked By</th>
                  <th className="py-2.5 px-3 text-center">Amount</th>
                  <th className="py-2.5 px-3 text-center">Booking Status</th>
                  <th className="py-2.5 px-3 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {allFilteredBookings.map((b) => {
                  const isConfirmed = b.bookingStatus === 'Booked';
                  const isPaid = b.paymentStatus === 'Paid';
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-200">
                          #{b.ticketNumber}
                        </span>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {b.halfSelected && b.fullSelected ? (
                          <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                            Both (Half + Full)
                          </span>
                        ) : b.halfSelected ? (
                          <span className="font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                            Half Set
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                            Full Set
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900">{b.customerName || 'Walk-in Customer'}</div>
                        {b.customerPhone && <div className="text-[10px] text-slate-500">{b.customerPhone}</div>}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-slate-600">{b.date}</td>
                      <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                        {b.bookedByUsername || b.bookedBy}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap font-mono font-bold text-xs text-slate-900">
                        ₹{getBookingAmount(b)}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isConfirmed
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {b.paymentStatus || 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {allFilteredBookings.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-500">No bookings match the search criteria.</div>
          )}
        </div>
      )}

      {/* TAB 2: PENDING BOOKINGS */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-amber-50/50">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                Pending Bookings Requiring Confirmation ({filteredPendingList.length})
              </h3>
            </div>
            <span className="text-[11px] text-amber-800 font-semibold">
              Admin &amp; Paid Employee Confirmation Authority
            </span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider whitespace-nowrap sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Ticket #</th>
                  <th className="py-2.5 px-3">Set Type</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Draw Date</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3 text-center">Amount</th>
                  <th className="py-2.5 px-3">Booking Time</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredPendingList.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                        #{b.ticketNumber}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {b.halfSelected && b.fullSelected ? (
                        <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                          Both (Half + Full)
                        </span>
                      ) : b.halfSelected ? (
                        <span className="font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                          Half Set
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                          Full Set
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{b.customerName || 'Walk-in Customer'}</div>
                      {b.customerPhone && <div className="text-[10px] text-slate-500">{b.customerPhone}</div>}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">{b.date}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                      {b.bookedByUsername || b.bookedBy}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono font-bold text-xs text-slate-900">
                      ₹{getBookingAmount(b)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-slate-500">
                      {b.bookedAt ? new Date(b.bookedAt).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Pending
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          type="button"
                          disabled={actionLoadingId === b.id}
                          onClick={() => handleConfirmPending(b.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded text-xs font-bold transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === b.ticketNumber}
                          onClick={() => handleCancel(b.ticketNumber)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-bold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPendingList.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-500">
              No pending booking requests awaiting confirmation.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONFIRMED & PAID BOOKINGS */}
      {activeTab === 'confirmed' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-blue-50/50">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                Confirmed Bookings &amp; Payment Settlements ({filteredConfirmedList.length})
              </h3>
            </div>
            <span className="text-[11px] text-blue-800 font-semibold">
              Booking Confirmation Separated From Payment Status
            </span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider whitespace-nowrap sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Ticket #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Draw Date</th>
                  <th className="py-2.5 px-3 text-right">Total / Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3 text-center">Booking Status</th>
                  <th className="py-2.5 px-3 text-center">Payment Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredConfirmedList.map((b) => {
                  const isPaid = b.paymentStatus === 'Paid';
                  const total = getBookingAmount(b);
                  const remaining = isPaid ? 0 : (b.remainingBalance !== undefined && b.totalAmount > 75 ? b.remainingBalance : Math.max(0, total - (b.amountPaid || 0)));
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 border border-slate-200 px-2 py-0.5 rounded">
                          #{b.ticketNumber}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{b.customerName || 'Walk-in Customer'}</div>
                        {b.customerPhone && <div className="text-[10px] text-slate-500">{b.customerPhone}</div>}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">{b.date}</td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono">
                        ₹{total} / <strong className="text-emerald-700">₹{b.amountPaid || 0}</strong>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold">
                        {remaining > 0 ? (
                          <span className="text-amber-700">₹{remaining}</span>
                        ) : (
                          <span className="text-emerald-700">₹0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {b.paymentStatus || 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          disabled={actionLoadingId === b.ticketNumber}
                          onClick={() => handleCancel(b.ticketNumber)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-bold transition-colors"
                          title="Authorized Cancel / Reverse"
                        >
                          {isPaid ? 'Reverse Payment' : 'Cancel'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredConfirmedList.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-500">No confirmed bookings found.</div>
          )}
        </div>
      )}

      {/* TAB 4: WINNERS & RESULT SHEETS */}
      {activeTab === 'winners' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Winners Column */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 bg-purple-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-purple-700" />
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  Draw Winners ({winners.length})
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-purple-800">Date: {config.businessDate}</span>
            </div>

            {/* Quick Add Winner Form */}
            {currentRole === 'admin' && onAddWinner && (
              <form onSubmit={handleAddWinnerSubmit} className="p-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Ticket # (e.g. 0015)"
                  value={newWinnerTicket}
                  onChange={(e) => setNewWinnerTicket(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg w-28 bg-white font-mono"
                />
                <input
                  type="text"
                  placeholder="Prize Name (e.g. 1st Prize)"
                  value={newWinnerPrize}
                  onChange={(e) => setNewWinnerPrize(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg flex-1 min-w-[120px] bg-white"
                />
                <input
                  type="number"
                  placeholder="Amount ₹"
                  value={newWinnerAmount}
                  onChange={(e) => setNewWinnerAmount(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg w-20 bg-white"
                />
                <button
                  type="submit"
                  disabled={isAddingWinner}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
                >
                  {isAddingWinner ? 'Adding...' : '+ Add'}
                </button>
              </form>
            )}

            <div className="overflow-x-auto max-h-72 flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Ticket #</th>
                    <th className="py-2 px-3">Prize</th>
                    <th className="py-2 px-3 text-right">Prize Amount</th>
                    <th className="py-2 px-3 text-center">Draw Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {winners.map((w, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 whitespace-nowrap font-mono font-bold text-purple-700">
                        #{w.winningNumber}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{w.prizeCategory}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">₹{w.prizeAmount}</td>
                      <td className="py-2 px-3 text-center text-slate-500">{w.drawDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {winners.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">No winners recorded for this draw.</div>
              )}
            </div>
          </div>

          {/* Result Sheets Column */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 bg-emerald-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  Uploaded Result Sheets ({papers.length})
                </h3>
              </div>
              {onUploadPaper && (
                <label className="cursor-pointer px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center space-x-1">
                  <Upload className="w-3 h-3" />
                  <span>{isUploadingPaper ? 'Uploading...' : 'Upload Sheet'}</span>
                  <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" disabled={isUploadingPaper} />
                </label>
              )}
            </div>

            <div className="p-3 overflow-y-auto max-h-80 space-y-2 flex-1">
              {papers.map((paper, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-semibold text-slate-900">{paper.title || `Result Sheet - ${paper.drawDate}`}</div>
                      <div className="text-[10px] text-slate-500">Draw Date: {paper.drawDate}</div>
                    </div>
                  </div>
                  {paper.fileUrl && (
                    <a
                      href={paper.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold flex items-center space-x-1"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
              {papers.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">No result sheets uploaded yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WEEKLY PRESETS MANAGEMENT */}
      {activeTab === 'presets' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <span>1-Week Daily Ticket Presets Manager</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure ticket generation schedules for all 7 days. Saves directly to <code>/config/weeklyPresets</code>.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={isSavingPresets}
                onClick={handleSaveAllPresets}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingPresets ? 'Saving Presets...' : 'Save All Weekly Presets'}</span>
              </button>
            </div>
          </div>

          {presetFeedback && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center space-x-2 border transition-all ${
                presetFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}
            >
              {presetFeedback.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{presetFeedback.text}</span>
            </div>
          )}

          {/* Day of Week Selector */}
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS_OF_WEEK.map((day) => {
              const dp = editingPresets.days[day] || DEFAULT_WEEKLY_PRESETS.days[day];
              const tCount = dp.tickets ? dp.tickets.length : lotteryService.expandPresetTickets(dp).length;
              const isSelected = selectedPresetDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedPresetDay(day)}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`text-[11px] font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                    {day.slice(0, 3)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {dp.enabled ? `${tCount} tkts` : 'Off'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Day Configuration Editor */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900">Configuring: {selectedPresetDay}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    activeDayPreset.enabled
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}
                >
                  {activeDayPreset.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <label className="inline-flex items-center space-x-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={activeDayPreset.enabled}
                  onChange={(e) => updateCurrentDayPreset({ enabled: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Enable Preset</span>
              </label>
            </div>

            {/* Mode selection: Range | List | Single */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-600 text-xs">Mode:</span>
              <button
                type="button"
                onClick={() => updateCurrentDayPreset({ mode: 'range' })}
                className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                  activeDayPreset.mode === 'range' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Range (Start–End)
              </button>
              <button
                type="button"
                onClick={() => updateCurrentDayPreset({ mode: 'list' })}
                className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                  activeDayPreset.mode === 'list' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Comma List
              </button>
              <button
                type="button"
                onClick={() => updateCurrentDayPreset({ mode: 'single' })}
                className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                  activeDayPreset.mode === 'single' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Single Number
              </button>
            </div>

            {/* Range Inputs */}
            {activeDayPreset.mode === 'range' && (
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Start (0000–9999)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={activeDayPreset.rangeStart || '0000'}
                    onChange={(e) => updateCurrentDayPreset({ rangeStart: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">End (0000–9999)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={activeDayPreset.rangeEnd || '0099'}
                    onChange={(e) => updateCurrentDayPreset({ rangeEnd: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Comma List Inputs */}
            {activeDayPreset.mode === 'list' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Comma-separated ticket numbers</label>
                <textarea
                  rows={2}
                  value={activeDayPreset.ticketList || ''}
                  onChange={(e) => updateCurrentDayPreset({ ticketList: e.target.value })}
                  placeholder="0015, 0022, 0045, 0100"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded font-mono text-slate-800"
                />
              </div>
            )}

            {/* Single Number Input */}
            {activeDayPreset.mode === 'single' && (
              <div className="max-w-xs">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Single Ticket Number</label>
                <input
                  type="text"
                  maxLength={4}
                  value={activeDayPreset.singleTicket || ''}
                  onChange={(e) => updateCurrentDayPreset({ singleTicket: e.target.value })}
                  placeholder="0777"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded font-mono font-bold text-slate-800"
                />
              </div>
            )}

            {/* Actions for this Day */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                Tickets in preset: <strong className="text-slate-900 font-mono">{lotteryService.expandPresetTickets(activeDayPreset).length}</strong>
              </div>

              {onPublishWeeklyPresetForDate && (
                <button
                  type="button"
                  disabled={isPublishingPreset || !activeDayPreset.enabled}
                  onClick={handlePublishDayPreset}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded text-xs font-bold transition-colors shadow-2xs"
                >
                  {isPublishingPreset ? 'Publishing...' : `Publish to Draw: ${config.businessDate}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Report Download Modal */}
      {isCustomerReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Download Customer Report (PDF)</h3>
                  <p className="text-[11px] text-slate-500">Official verified customer records from completed bookings</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isGeneratingReport) setIsCustomerReportModalOpen(false);
                }}
                disabled={isGeneratingReport}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">Select Date Filter:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReportFilterMode('all')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    reportFilterMode === 'all'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Dates
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilterMode('specific')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    reportFilterMode === 'specific'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Single Date
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilterMode('range')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    reportFilterMode === 'range'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Date Range
                </button>
              </div>

              {reportFilterMode === 'specific' && (
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Draw Date</label>
                  <input
                    type="date"
                    value={reportSpecificDate}
                    onChange={(e) => setReportSpecificDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium text-slate-800"
                  />
                </div>
              )}

              {reportFilterMode === 'range' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Info notice */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-700">Report details included:</div>
              <ul className="list-disc list-inside text-slate-500 space-y-0.5">
                <li>Customer full name and mobile phone number</li>
                <li>Draw date, ticket number(s), and verified status</li>
                <li>Paid staff identifier / label and collected amounts</li>
                <li>Multi-page PDF with headers, KPIs, and confidentiality footers</li>
              </ul>
            </div>

            {/* Feedback alert */}
            {reportFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                  reportFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {reportFeedback.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{reportFeedback.message}</span>
              </div>
            )}

            {/* Modal actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCustomerReportModalOpen(false)}
                disabled={isGeneratingReport}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateCustomerReport}
                disabled={isGeneratingReport}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Querying &amp; Assembling PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
