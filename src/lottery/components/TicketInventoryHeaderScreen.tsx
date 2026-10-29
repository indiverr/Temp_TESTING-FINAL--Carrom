import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Palette,
  Calendar,
  Image as ImageIcon,
  Search,
  Check,
  X,
  Download,
  Trash2,
  CheckSquare,
  Lock,
  Copy,
  Clock,
  AlertCircle,
  Sparkles,
  Loader2,
  Pencil,
  UploadCloud,
  List,
} from 'lucide-react';
import {
  TicketBooking,
  TicketLock,
  SelectedTicketItem,
  SystemConfig,
  LoginType,
  BookingConfirmationSummary,
  TicketInventoryItem,
  GridAppearanceConfig,
  DEFAULT_GRID_APPEARANCE,
  WeeklyTicketPresetsConfig,
  DayOfWeek,
  DayTicketPreset,
  DAYS_OF_WEEK,
  DEFAULT_WEEKLY_PRESETS,
  ScheduledPublication,
} from '../types';
import { lotteryService } from '../lotteryService';
import { LOTTERY_COLUMNS_SPEC } from '../mockData';

interface TicketInventoryHeaderProps {
  config: SystemConfig;
  bookedTickets: TicketBooking[];
  activeLocks?: TicketLock[];
  currentUserUid?: string;
  currentRole: LoginType;
  inventoryTickets?: TicketInventoryItem[];
  gridAppearance?: GridAppearanceConfig;
  weeklyPresets?: WeeklyTicketPresetsConfig;
  onAddTicketInventory?: (
    tickets: string[],
    drawDate: string,
    seriesId: string,
    seriesTitle: string,
    status: 'PUBLISHED' | 'UNPUBLISHED'
  ) => Promise<{ success: boolean; addedCount: number; error?: string }>;
  onUpdateGridAppearance?: (
    config: Partial<GridAppearanceConfig>
  ) => Promise<{ success: boolean; config?: GridAppearanceConfig; error?: string }>;
  onUpdateWeeklyPresets?: (
    newPresets: WeeklyTicketPresetsConfig
  ) => Promise<{ success: boolean; presets?: WeeklyTicketPresetsConfig; error?: string }>;
  onPublishWeeklyPresetForDate?: (
    drawDate: string,
    dayName: DayOfWeek
  ) => Promise<{ success: boolean; addedCount: number; error?: string }>;
  scheduledPublications?: ScheduledPublication[];
  onSchedulePublication?: (params: {
    drawDate: string;
    seriesId: string;
    seriesTitle: string;
    tickets: string[];
    scheduledForMs: number;
    scheduledForIso?: string;
    scheduledForDisplay?: string;
    timezone?: string;
  }) => Promise<{ success: boolean; schedule?: ScheduledPublication; error?: string }>;
  onUpdateScheduledPublication?: (
    scheduleId: string,
    params: {
      tickets: string[];
      scheduledForMs: number;
      scheduledForIso?: string;
      scheduledForDisplay?: string;
    }
  ) => Promise<{ success: boolean; schedule?: ScheduledPublication; error?: string }> | { success: boolean; schedule?: ScheduledPublication; error?: string };
  onCancelScheduledPublication?: (scheduleId: string) => Promise<{ success: boolean; error?: string }>;
  onProcessScheduledPublications?: () => Promise<{ success: boolean; processedCount?: number }>;
  onAcquireTicketLock?: (ticketNumbers: string[]) => Promise<{
    success: boolean;
    lockId?: string;
    ticketNumbers?: string[];
    expiresAtMs?: number;
    lockedByOther?: boolean;
    alreadyBooked?: boolean;
    error?: string;
  }>;
  onRenewTicketLock?: (
    ticketNumbers: string[],
    lockId: string
  ) => Promise<{
    success: boolean;
    lockId?: string;
    expiresAtMs?: number;
    error?: string;
  }>;
  onReleaseTicketLock?: (
    ticketNumbers: string[],
    lockId: string
  ) => Promise<{ success: boolean; error?: string }>;
  onBookSingleTicket: (
    ticketNum: string,
    name: string,
    phone: string,
    options?: { lockId?: string; idempotencyKey?: string }
  ) => Promise<{
    success: boolean;
    customerId?: string;
    ticketNumbers?: string[];
    error?: string;
  } | void>;
  onBookMultipleTickets: (
    items: SelectedTicketItem[],
    name: string,
    phone: string,
    options?: { lockId?: string; idempotencyKey?: string }
  ) => Promise<{
    success: boolean;
    bookedCount?: number;
    customerId?: string;
    ticketNumbers?: string[];
    error?: string;
  } | void>;
  onOpenBookedTicketsDashboard: () => void;
  onOpenAvailableGallery: () => void;
  onExportRecords: () => void;
}

export const TicketInventoryHeaderScreen: React.FC<TicketInventoryHeaderProps> = ({
  config,
  bookedTickets,
  activeLocks = [],
  currentUserUid = '',
  currentRole = 'employee',
  inventoryTickets,
  gridAppearance,
  weeklyPresets,
  onAddTicketInventory,
  onUpdateGridAppearance,
  onUpdateWeeklyPresets,
  onPublishWeeklyPresetForDate,
  scheduledPublications = [],
  onSchedulePublication,
  onUpdateScheduledPublication,
  onCancelScheduledPublication,
  onProcessScheduledPublications,
  onAcquireTicketLock,
  onRenewTicketLock,
  onReleaseTicketLock,
  onBookMultipleTickets,
  onOpenBookedTicketsDashboard,
  onOpenAvailableGallery,
  onExportRecords,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activePopupTicket, setActivePopupTicket] = useState<string | null>(null);
  const [singleHalf, setSingleHalf] = useState(false);
  const [singleFull, setSingleFull] = useState(true);
  const [customerName, setCustomerName] = useState('Sasikaran');
  const [customerPhone, setCustomerPhone] = useState('9949311900');

  // Lock tracking state for active booking form
  const [activeLockId, setActiveLockId] = useState<string>('');
  const [activeLockedTickets, setActiveLockedTickets] = useState<string[]>([]);
  const [optimisticLocks, setOptimisticLocks] = useState<string[]>([]);
  const [lockExpiresAtMs, setLockExpiresAtMs] = useState<number>(0);
  const [isAcquiringLock, setIsAcquiringLock] = useState<boolean>(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);

  // Automatic cleanup of held booking reservations on unmount, back navigation, or tab close
  const activeLockIdRef = useRef(activeLockId);
  const activeLockedTicketsRef = useRef(activeLockedTickets);
  useEffect(() => {
    activeLockIdRef.current = activeLockId;
  }, [activeLockId]);
  useEffect(() => {
    activeLockedTicketsRef.current = activeLockedTickets;
  }, [activeLockedTickets]);

  useEffect(() => {
    return () => {
      if (activeLockedTicketsRef.current.length > 0 && activeLockIdRef.current && onReleaseTicketLock) {
        onReleaseTicketLock(activeLockedTicketsRef.current, activeLockIdRef.current).catch(() => {});
      }
    };
  }, [onReleaseTicketLock]);
  const [activeIdempotencyKey, setActiveIdempotencyKey] = useState<string>('');
  const [bookingFormError, setBookingFormError] = useState<string | null>(null);

  // Multi-select
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [defaultSetType, setDefaultSetType] = useState<'full' | 'half' | 'both'>('full');
  const [selectedMultiTickets, setSelectedMultiTickets] = useState<SelectedTicketItem[]>([]);
  const [isMultiBookModalOpen, setIsMultiBookModalOpen] = useState(false);

  // Active series column from LOTTERY_COLUMNS_SPEC (default 0000 - 0024)
  const [selectedColumnId, setSelectedColumnId] = useState<string>(
    LOTTERY_COLUMNS_SPEC[0]?.id || 'c0'
  );

  // Success / error popups
  const [bookingConfirmation, setBookingConfirmation] =
    useState<BookingConfirmationSummary | null>(null);
  const [copiedCustomerId, setCopiedCustomerId] = useState(false);
  const [alreadyBookedNum, setAlreadyBookedNum] = useState<string | null>(null);
  const [lockedByOtherMessage, setLockedByOtherMessage] = useState<string | null>(null);

  const activeColumn =
    LOTTERY_COLUMNS_SPEC.find((c) => c.id === selectedColumnId) || LOTTERY_COLUMNS_SPEC[0];

  // Inventory & Appearance state
  const [internalInventory, setInternalInventory] = useState<TicketInventoryItem[]>(() =>
    lotteryService.getInventory(config.businessDate, undefined, currentRole)
  );
  const appearance: GridAppearanceConfig = gridAppearance || DEFAULT_GRID_APPEARANCE;

  useEffect(() => {
    if (inventoryTickets && inventoryTickets.length > 0) {
      setInternalInventory(inventoryTickets);
    }
  }, [inventoryTickets]);

  // Admin Modals state
  const [isAddTicketsModalOpen, setIsAddTicketsModalOpen] = useState(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);
  const [isWeeklyPresetsModalOpen, setIsWeeklyPresetsModalOpen] = useState(false);
  const [activePresetDay, setActivePresetDay] = useState<DayOfWeek>('Monday');
  const [editingWeeklyPresets, setEditingWeeklyPresets] = useState<WeeklyTicketPresetsConfig>(
    weeklyPresets || DEFAULT_WEEKLY_PRESETS
  );
  const [isSavingWeeklyPresets, setIsSavingWeeklyPresets] = useState(false);
  const [isPublishingWeek, setIsPublishingWeek] = useState(false);
  const [isApplyingDayPreset, setIsApplyingDayPreset] = useState(false);
  const [presetFeedback, setPresetFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Upcoming Collections Queue modal state (Edit & Delete)
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editCustomTime, setEditCustomTime] = useState('');
  const [editPresetMinutes, setEditPresetMinutes] = useState(0);
  const [editScheduleError, setEditScheduleError] = useState<string | null>(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(null);

  // Sync editing presets when weeklyPresets prop changes
  useEffect(() => {
    if (weeklyPresets) {
      setEditingWeeklyPresets(JSON.parse(JSON.stringify(weeklyPresets)));
    }
  }, [weeklyPresets]);

  // Helper to determine day of week from businessDate (e.g. "27 Oct 2026")
  const currentDayOfWeekName: DayOfWeek = React.useMemo(() => {
    try {
      const parts = String(config.businessDate || '').trim().split(' ');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = months.indexOf(parts[1]);
        if (mIdx !== -1) {
          const d = new Date(parseInt(parts[2], 10), mIdx, parseInt(parts[0], 10));
          const dayNames: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return dayNames[d.getDay()];
        }
      }
    } catch {}
    return 'Monday';
  }, [config.businessDate]);

  const activeDayPresetConfig: DayTicketPreset =
    editingWeeklyPresets.days[activePresetDay] || DEFAULT_WEEKLY_PRESETS.days[activePresetDay];

  const todayDayPresetConfig: DayTicketPreset =
    editingWeeklyPresets.days[currentDayOfWeekName] || DEFAULT_WEEKLY_PRESETS.days[currentDayOfWeekName];

  const handleUpdateActiveDayField = (fields: Partial<DayTicketPreset>) => {
    const updated: DayTicketPreset = {
      ...activeDayPresetConfig,
      ...fields,
      dayName: activePresetDay,
    };
    const expanded = lotteryService.expandPresetTickets(updated);
    updated.tickets = expanded;

    setEditingWeeklyPresets((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [activePresetDay]: updated,
      },
    }));
  };

  const handleSaveWeeklyPresets = async () => {
    setIsSavingWeeklyPresets(true);
    setPresetFeedback(null);
    try {
      if (onUpdateWeeklyPresets) {
        const res = await onUpdateWeeklyPresets(editingWeeklyPresets);
        if (res && !res.success) {
          setPresetFeedback({ type: 'error', message: res.error || 'Failed to save presets' });
          setIsSavingWeeklyPresets(false);
          return;
        }
      } else {
        lotteryService.updateWeeklyPresets(editingWeeklyPresets, currentRole);
      }
      setPresetFeedback({ type: 'success', message: 'All 7-day weekly presets successfully saved!' });
      setTimeout(() => setPresetFeedback(null), 3000);
    } catch (err: any) {
      setPresetFeedback({ type: 'error', message: err?.message || 'Error saving weekly presets' });
    } finally {
      setIsSavingWeeklyPresets(false);
    }
  };

  const handleApplyActiveDayPresetToCurrentDraw = async () => {
    setIsApplyingDayPreset(true);
    setPresetFeedback(null);
    try {
      const tickets = lotteryService.expandPresetTickets(activeDayPresetConfig);
      if (tickets.length === 0) {
        setPresetFeedback({ type: 'error', message: `Preset for ${activePresetDay} has no tickets configured.` });
        setIsApplyingDayPreset(false);
        return;
      }
      if (onAddTicketInventory) {
        const res = await onAddTicketInventory(
          tickets,
          config.businessDate,
          'col-1',
          config.seriesTitle || 'CARROM GOLD',
          'PUBLISHED'
        );
        if (res && !res.success) {
          setPresetFeedback({ type: 'error', message: res.error || 'Failed to publish preset tickets' });
          setIsApplyingDayPreset(false);
          return;
        }
      } else {
        lotteryService.addTicketInventory(
          tickets,
          config.businessDate,
          'col-1',
          config.seriesTitle || 'CARROM GOLD',
          'PUBLISHED',
          { id: currentUserUid, name: 'Admin', role: currentRole }
        );
      }
      setInternalInventory(lotteryService.getInventory(config.businessDate, undefined, currentRole));
      setPresetFeedback({
        type: 'success',
        message: `Published ${tickets.length} tickets from ${activePresetDay} preset to ${config.businessDate}!`,
      });
      setTimeout(() => setPresetFeedback(null), 4000);
    } catch (err: any) {
      setPresetFeedback({ type: 'error', message: err?.message || 'Error applying preset' });
    } finally {
      setIsApplyingDayPreset(false);
    }
  };

  const handlePublishFullWeek = async () => {
    setIsPublishingWeek(true);
    setPresetFeedback(null);
    try {
      if (onUpdateWeeklyPresets) {
        const saveRes = await onUpdateWeeklyPresets(editingWeeklyPresets);
        if (saveRes && !saveRes.success) {
          setPresetFeedback({
            type: 'error',
            message: saveRes.error || 'Failed to save weekly presets before publishing schedule.',
          });
          setIsPublishingWeek(false);
          return;
        }
      } else {
        lotteryService.updateWeeklyPresets(editingWeeklyPresets, currentRole);
      }

      let baseDate = new Date();
      try {
        const parts = String(config.businessDate || '').trim().split(' ');
        if (parts.length === 3) {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const mIdx = months.indexOf(parts[1]);
          if (mIdx !== -1) {
            const parsed = new Date(parseInt(parts[2], 10), mIdx, parseInt(parts[0], 10));
            if (!isNaN(parsed.getTime())) baseDate = parsed;
          }
        }
      } catch {}

      const dayNames: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      let totalPublishedAcrossWeek = 0;

      for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);

        const dayStr = String(d.getDate()).padStart(2, '0');
        const monthStr = months[d.getMonth()];
        const yearStr = d.getFullYear();
        const drawDateStr = `${dayStr} ${monthStr} ${yearStr}`;
        const dayOfWeek = dayNames[d.getDay()];

        const dayPreset = editingWeeklyPresets.days[dayOfWeek];
        if (dayPreset && dayPreset.enabled) {
          const tickets = lotteryService.expandPresetTickets(dayPreset);
          if (tickets.length > 0) {
            if (onAddTicketInventory) {
              const res = await onAddTicketInventory(
                tickets,
                drawDateStr,
                'col-1',
                config.seriesTitle || 'CARROM GOLD',
                'PUBLISHED'
              );
              if (res?.success) {
                totalPublishedAcrossWeek += res.addedCount || tickets.length;
              }
            } else {
              lotteryService.addTicketInventory(
                tickets,
                drawDateStr,
                'col-1',
                config.seriesTitle || 'CARROM GOLD',
                'PUBLISHED',
                { id: currentUserUid, name: 'Admin', role: currentRole }
              );
              totalPublishedAcrossWeek += tickets.length;
            }
          }
        }
      }

      setInternalInventory(lotteryService.getInventory(config.businessDate, undefined, currentRole));
      setPresetFeedback({
        type: 'success',
        message: `Successfully published full 1-week schedule (${totalPublishedAcrossWeek} tickets across 7 days)!`,
      });
      setTimeout(() => setPresetFeedback(null), 5000);
    } catch (err: any) {
      setPresetFeedback({ type: 'error', message: err?.message || 'Error publishing full week' });
    } finally {
      setIsPublishingWeek(false);
    }
  };

  const handleFillTodayPresetIntoAddModal = () => {
    if (!todayDayPresetConfig || !todayDayPresetConfig.enabled) return;
    setAddMode(todayDayPresetConfig.mode);
    if (todayDayPresetConfig.mode === 'range') {
      setAddRanges([
        {
          id: '1',
          start: todayDayPresetConfig.rangeStart || '0000',
          end: todayDayPresetConfig.rangeEnd || '0099',
        },
      ]);
    } else if (todayDayPresetConfig.mode === 'list') {
      setAddCommaList(todayDayPresetConfig.ticketList || '');
    } else if (todayDayPresetConfig.mode === 'single') {
      setAddSingleNumber(todayDayPresetConfig.singleTicket || '');
    }
  };

  interface TicketCollectionRow {
    id: string;
    name: string;
    start: string;
    end: string;
    hasTimer: boolean;
    presetMinutes: number;
    customTime: string;
  }

  const [collections, setCollections] = useState<TicketCollectionRow[]>([
    {
      id: '1',
      name: 'First Collection',
      start: '0001',
      end: '0025',
      hasTimer: false,
      presetMinutes: 0,
      customTime: '',
    },
  ]);

  const handleAddCollection = () => {
    const nextIdx = collections.length + 1;
    const lastRow = collections[collections.length - 1];
    let nextStart = '0026';
    let nextEnd = '0050';
    if (lastRow) {
      const lastEndVal = parseInt(lastRow.end, 10);
      if (!isNaN(lastEndVal)) {
        const width = lastRow.end.length || 4;
        nextStart = String(lastEndVal + 1).padStart(width, '0');
        nextEnd = String(lastEndVal + 25).padStart(width, '0');
      }
    }
    const now = new Date();
    const target = new Date(now.getTime() + 30 * 60 * 1000);
    const hrs = String(target.getHours()).padStart(2, '0');
    const mins = String(target.getMinutes()).padStart(2, '0');
    setCollections((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        name: `Collection ${nextIdx}`,
        start: nextStart,
        end: nextEnd,
        hasTimer: true,
        presetMinutes: 30,
        customTime: `${hrs}:${mins}`,
      },
    ]);
  };

  const handleRemoveCollection = (id: string) => {
    if (collections.length <= 1) return;
    setCollections((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      return filtered.map((c, idx) => ({
        ...c,
        name: idx === 0 ? 'First Collection' : `Collection ${idx + 1}`,
        hasTimer: idx > 0,
      }));
    });
  };

  const handleUpdateCollection = (id: string, updates: Partial<TicketCollectionRow>) => {
    setCollections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  interface TicketRangeRow {
    id: string;
    start: string;
    end: string;
  }

  const [addMode, setAddMode] = useState<'single' | 'list' | 'range'>('range');
  const [addSingleNumber, setAddSingleNumber] = useState('');
  const [addCommaList, setAddCommaList] = useState('');
  const [addRanges, setAddRanges] = useState<TicketRangeRow[]>([
    { id: '1', start: '0001', end: '0025' },
  ]);
  const [addSuccessMessage, setAddSuccessMessage] = useState<string | null>(null);
  const [addPublishImmediately, setAddPublishImmediately] = useState(true);
  const [publishActionType, setPublishActionType] = useState<'immediate' | 'schedule'>('immediate');
  const [scheduleDate, setScheduleDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [scheduleTime, setScheduleTime] = useState<string>('20:00');
  const [isProcessingSchedules, setIsProcessingSchedules] = useState(false);
  const [cancellingScheduleId, setCancellingScheduleId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [isAddingTickets, setIsAddingTickets] = useState(false);
  const [editAppearance, setEditAppearance] = useState<GridAppearanceConfig>(appearance);
  useEffect(() => {
    setEditAppearance(appearance);
  }, [appearance]);

  const handleAddRangeRow = () => {
    const nextId = String(Date.now() + Math.random());
    const lastRow = addRanges[addRanges.length - 1];
    let nextStart = '0026';
    let nextEnd = '0050';
    if (lastRow) {
      const lastEndVal = parseInt(lastRow.end, 10);
      if (!isNaN(lastEndVal)) {
        const width = lastRow.end.length || 4;
        nextStart = String(lastEndVal + 1).padStart(width, '0');
        nextEnd = String(lastEndVal + 50).padStart(width, '0');
      }
    }
    setAddRanges((prev) => [...prev, { id: nextId, start: nextStart, end: nextEnd }]);
  };

  const handleRemoveRangeRow = (id: string) => {
    if (addRanges.length <= 1) return;
    setAddRanges((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRangeRow = (id: string, field: 'start' | 'end', value: string) => {
    setAddRanges((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const allInventory = inventoryTickets && inventoryTickets.length > 0 ? inventoryTickets : internalInventory;

  const publishedTicketsForDate = React.useMemo(() => {
    return new Set(
      allInventory
        .filter((t) => t.drawDate === config.businessDate && t.status === 'PUBLISHED')
        .map((t) => t.ticketNumber)
    );
  }, [allInventory, config.businessDate]);

  const liveRangeCalculation = React.useMemo(() => {
    let totalTickets = 0;
    const errors: { [id: string]: string } = {};
    const numbersSet = new Set<string>();
    let hasOverlap = false;
    let overlapMessage = '';

    for (let idx = 0; idx < addRanges.length; idx++) {
      const row = addRanges[idx];
      const sStr = row.start.trim();
      const eStr = row.end.trim();

      if (!sStr && !eStr) {
        errors[row.id] = 'Start and End numbers required.';
        continue;
      }

      if (!/^\d+$/.test(sStr) || !/^\d+$/.test(eStr)) {
        errors[row.id] = 'Start and End must be positive numbers.';
        continue;
      }

      const s = parseInt(sStr, 10);
      const e = parseInt(eStr, 10);

      if (s > e) {
        errors[row.id] = `Start (${s}) must be ≤ End (${e}).`;
        continue;
      }

      const count = e - s + 1;
      if (count > 500) {
        errors[row.id] = `Range exceeds 500 tickets limit (${count}).`;
        continue;
      }

      const padLen = Math.max(sStr.length, eStr.length, 4);

      for (let num = s; num <= e; num++) {
        const ticketNum = String(num).padStart(padLen, '0');
        if (numbersSet.has(ticketNum)) {
          hasOverlap = true;
          overlapMessage = `Ticket #${ticketNum} overlaps across multiple range rows.`;
          errors[row.id] = `Overlaps on ticket #${ticketNum}.`;
          break;
        }
        numbersSet.add(ticketNum);
      }

      if (!errors[row.id]) {
        totalTickets += count;
      }
    }

    return {
      totalTickets,
      errors,
      hasOverlap,
      overlapMessage,
      generatedNumbers: Array.from(numbersSet),
    };
  }, [addRanges]);

  const confirmedSet = React.useMemo(() => {
    const set = new Set<string>();
    for (const b of bookedTickets) {
      if (b.bookingStatus === 'Booked') set.add(b.ticketNumber);
    }
    for (const inv of allInventory) {
      if (inv.bookingStatus === 'Booked') set.add(inv.ticketNumber);
    }
    return set;
  }, [bookedTickets, allInventory]);

  const pendingSet = React.useMemo(() => {
    const set = new Set<string>();
    for (const b of bookedTickets) {
      if (b.bookingStatus === 'Pending Confirmation') set.add(b.ticketNumber);
    }
    for (const inv of allInventory) {
      if (inv.bookingStatus === 'Pending Confirmation') set.add(inv.ticketNumber);
    }
    return set;
  }, [bookedTickets, allInventory]);

  const isTicketBooked = React.useCallback((num: string) => confirmedSet.has(num), [confirmedSet]);
  const isTicketPending = React.useCallback((num: string) => pendingSet.has(num), [pendingSet]);

  // Confirmed tickets MUST DISAPPEAR automatically from visible Ticket Grid!
  // Remaining tickets move upward to fill empty spaces immediately: visibleTickets = allInventory filtered
  const visibleTickets = React.useMemo(() => {
    return allInventory
      .filter((inv) => {
        if (currentRole !== 'admin' && inv.status !== 'PUBLISHED') return false;
        if (inv.bookingStatus === 'Booked' || confirmedSet.has(inv.ticketNumber)) return false;
        return true;
      })
      .sort((a, b) => a.ticketNumber.localeCompare(b.ticketNumber, undefined, { numeric: true }));
  }, [allInventory, confirmedSet, currentRole]);

  const quickNumbers = React.useMemo(() => visibleTickets.map((t) => t.ticketNumber), [visibleTickets]);

  const totalCollectionsTickets = React.useMemo(() => {
    let sum = 0;
    for (const c of collections) {
      const s = parseInt(c.start, 10);
      const e = parseInt(c.end, 10);
      if (!isNaN(s) && !isNaN(e) && e >= s) {
        sum += e - s + 1;
      }
    }
    return sum;
  }, [collections]);

  const handleExecuteCollectionsAdd = async () => {
    setAddError(null);
    setAddSuccessMessage(null);

    for (let idx = 0; idx < collections.length; idx++) {
      const col = collections[idx];
      const s = parseInt(col.start, 10);
      const e = parseInt(col.end, 10);
      if (isNaN(s) || isNaN(e)) {
        setAddError(`${col.name}: Please enter a valid number range.`);
        return;
      }
      if (s > e) {
        setAddError(`${col.name}: Start ticket cannot be greater than End ticket.`);
        return;
      }
      if (e - s + 1 > 500) {
        setAddError(`${col.name}: Range exceeds maximum 500 tickets.`);
        return;
      }
      if (col.hasTimer && !col.customTime) {
        setAddError(`${col.name}: Please select a timer preset or time.`);
        return;
      }
    }

    setIsAddingTickets(true);
    try {
      for (let idx = 0; idx < collections.length; idx++) {
        const col = collections[idx];
        const s = parseInt(col.start, 10);
        const e = parseInt(col.end, 10);
        const width = Math.max(col.start.length, col.end.length, 4);
        const tickets: string[] = [];
        for (let n = s; n <= e; n++) {
          tickets.push(String(n).padStart(width, '0'));
        }

        if (!col.hasTimer) {
          if (onAddTicketInventory) {
            await onAddTicketInventory(
              tickets,
              config.businessDate,
              activeColumn.id,
              config.seriesTitle,
              'PUBLISHED'
            );
          } else {
            lotteryService.addTicketInventory(
              tickets,
              config.businessDate,
              activeColumn.id,
              config.seriesTitle,
              'PUBLISHED',
              { id: currentUserUid || 'ADM001', name: 'Admin', role: 'admin' }
            );
          }
        } else {
          const [hours, minutes] = col.customTime.split(':').map(Number);
          const now = new Date();
          const target = new Date();
          target.setHours(hours, minutes, 0, 0);
          if (target.getTime() <= now.getTime()) {
            target.setDate(target.getDate() + 1);
          }
          const utcMs = target.getTime();
          const scheduledDateObj = new Date(utcMs);
          const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const displayHours = hours % 12 || 12;
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayTime = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
          const scheduledForDisplay = `${String(target.getDate()).padStart(2, '0')} ${monthsNames[target.getMonth()]} ${target.getFullYear()}, ${displayTime} IST`;

          if (onSchedulePublication) {
            await onSchedulePublication({
              drawDate: config.businessDate,
              seriesId: activeColumn.id,
              seriesTitle: config.seriesTitle,
              tickets,
              scheduledForMs: utcMs,
              scheduledForIso: scheduledDateObj.toISOString(),
              scheduledForDisplay,
              timezone: 'Asia/Kolkata',
            });
          } else {
            lotteryService.schedulePublication({
              drawDate: config.businessDate,
              seriesId: activeColumn.id,
              seriesTitle: config.seriesTitle,
              tickets,
              scheduledForMs: utcMs,
              scheduledForIso: scheduledDateObj.toISOString(),
              scheduledForDisplay,
              timezone: 'Asia/Kolkata',
              createdBy: 'Admin',
              createdByUid: currentUserUid,
            });
          }
        }
      }

      setInternalInventory(lotteryService.getInventory(config.businessDate, undefined, currentRole));
      setAddSuccessMessage('Collections entered successfully!');
      setTimeout(() => {
        setIsAddTicketsModalOpen(false);
        setAddSuccessMessage(null);
      }, 1200);
    } catch (err: any) {
      setAddError(err?.message || 'Error entering collections.');
    } finally {
      setIsAddingTickets(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!onCancelScheduledPublication) return;
    try {
      const res = await onCancelScheduledPublication(scheduleId);
      if (res && !res.success) {
        setEditScheduleError(res.error || 'Failed to delete collection from queue.');
      } else {
        setScheduleSuccessMsg('Collection deleted from queue successfully.');
        setTimeout(() => setScheduleSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setEditScheduleError(err?.message || 'Failed to delete collection.');
    }
  };

  const handleSaveEditedSchedule = async (
    scheduleId: string,
    seriesId: string,
    seriesTitle: string
  ) => {
    setEditScheduleError(null);
    const s = parseInt(editStart, 10);
    const e = parseInt(editEnd, 10);
    if (isNaN(s) || isNaN(e)) {
      setEditScheduleError('Please enter a valid ticket number range.');
      return;
    }
    if (s > e) {
      setEditScheduleError('Start ticket cannot be greater than End ticket.');
      return;
    }
    if (e - s + 1 > 500) {
      setEditScheduleError('Range cannot exceed 500 tickets.');
      return;
    }
    if (!editCustomTime) {
      setEditScheduleError('Please set a reveal time.');
      return;
    }

    const width = Math.max(editStart.length, editEnd.length, 4);
    const tickets: string[] = [];
    for (let n = s; n <= e; n++) {
      tickets.push(String(n).padStart(width, '0'));
    }

    const [hours, minutes] = editCustomTime.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    const utcMs = target.getTime();
    const scheduledDateObj = new Date(utcMs);
    const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const displayHours = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayTime = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
    const scheduledForDisplay = `${String(target.getDate()).padStart(2, '0')} ${monthsNames[target.getMonth()]} ${target.getFullYear()}, ${displayTime} IST`;

    setIsSavingSchedule(true);
    try {
      if (onUpdateScheduledPublication) {
        await onUpdateScheduledPublication(scheduleId, {
          tickets,
          scheduledForMs: utcMs,
          scheduledForIso: scheduledDateObj.toISOString(),
          scheduledForDisplay,
        } as any);
      } else {
        lotteryService.updateScheduledPublication(scheduleId, {
          tickets,
          scheduledForMs: utcMs,
          scheduledForIso: scheduledDateObj.toISOString(),
          scheduledForDisplay,
        });
      }
      setEditingScheduleId(null);
      setScheduleSuccessMsg('Collection updated successfully.');
      setTimeout(() => setScheduleSuccessMsg(null), 3000);
    } catch (err: any) {
      setEditScheduleError(err?.message || 'Failed to update collection.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handlePublishScheduleNow = async (sched: ScheduledPublication) => {
    try {
      if (onAddTicketInventory) {
        await onAddTicketInventory(
          sched.tickets,
          config.businessDate,
          sched.seriesId,
          sched.seriesTitle,
          'PUBLISHED'
        );
      } else {
        lotteryService.addTicketInventory(
          sched.tickets,
          config.businessDate,
          sched.seriesId,
          sched.seriesTitle,
          'PUBLISHED',
          { id: currentUserUid || 'ADM001', name: 'Admin', role: 'admin' }
        );
      }
      if (onCancelScheduledPublication) {
        await onCancelScheduledPublication(sched.id);
      } else {
        lotteryService.cancelScheduledPublication(sched.id);
      }
      setScheduleSuccessMsg(`Published ${sched.tickets.length} tickets immediately!`);
      setTimeout(() => setScheduleSuccessMsg(null), 3000);
    } catch (err: any) {
      setEditScheduleError(err?.message || 'Failed to publish collection.');
    }
  };

  const handleExecuteAddTickets = async () => {
    setAddError(null);
    setAddSuccessMessage(null);
    let ticketsToAdd: string[] = [];

    if (addMode === 'single') {
      const norm = addSingleNumber.trim().padStart(4, '0');
      if (!/^\d{4}$/.test(norm)) {
        setAddError('Please enter a valid 4-digit ticket number (e.g. 0015).');
        return;
      }
      if (publishedTicketsForDate.has(norm)) {
        setAddError(`Ticket #${norm} is already published for draw date ${config.businessDate}.`);
        return;
      }
      ticketsToAdd = [norm];
    } else if (addMode === 'list') {
      const parts = addCommaList.split(/[\s,]+/).map((s) => s.trim().padStart(4, '0')).filter((s) => /^\d{4}$/.test(s));
      if (parts.length === 0) {
        setAddError('Please enter valid comma-separated 4-digit ticket numbers.');
        return;
      }
      const uniqueParts = Array.from(new Set(parts));
      const duplicateWithPublished = uniqueParts.filter((n) => publishedTicketsForDate.has(n));
      if (duplicateWithPublished.length > 0) {
        setAddError(`Ticket(s) ${duplicateWithPublished.slice(0, 5).join(', ')} already published for ${config.businessDate}.`);
        return;
      }
      ticketsToAdd = uniqueParts;
    } else if (addMode === 'range') {
      if (addRanges.length === 0) {
        setAddError('Please add at least one ticket range.');
        return;
      }

      // Check per-row errors
      for (let idx = 0; idx < addRanges.length; idx++) {
        const row = addRanges[idx];
        const rowErr = liveRangeCalculation.errors[row.id];
        if (rowErr) {
          setAddError(`Row ${idx + 1}: ${rowErr}`);
          return;
        }
      }

      if (liveRangeCalculation.hasOverlap) {
        setAddError(liveRangeCalculation.overlapMessage || 'Overlapping ticket ranges detected.');
        return;
      }

      if (liveRangeCalculation.generatedNumbers.length === 0) {
        setAddError('Please enter valid ticket ranges.');
        return;
      }

      // Check duplicates against already published inventory
      const duplicateWithPublished = liveRangeCalculation.generatedNumbers.filter((n) =>
        publishedTicketsForDate.has(n)
      );
      if (duplicateWithPublished.length > 0) {
        const preview = duplicateWithPublished.slice(0, 5).join(', ');
        const extra = duplicateWithPublished.length > 5 ? ` and ${duplicateWithPublished.length - 5} more` : '';
        setAddError(`Cannot add duplicate ticket(s): ${preview}${extra} already published for ${config.businessDate}.`);
        return;
      }

      ticketsToAdd = liveRangeCalculation.generatedNumbers;
    }

    const alreadyBooked = ticketsToAdd.filter((n) => isTicketBooked(n));
    if (alreadyBooked.length > 0) {
      setAddError(`Cannot add ticket(s) ${alreadyBooked.slice(0, 5).join(', ')} because they are already confirmed/booked.`);
      return;
    }

    setIsAddingTickets(true);
    try {
      if (publishActionType === 'schedule') {
        const [year, month, day] = scheduleDate.split('-').map(Number);
        const [hours, minutes] = scheduleTime.split(':').map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
          setAddError('Please select a valid scheduled date and time.');
          setIsAddingTickets(false);
          return;
        }

        // Asia/Kolkata is UTC+5:30. Calculate deterministic UTC timestamp
        const utcMs = Date.UTC(year, month - 1, day, hours - 5, minutes - 30, 0, 0);
        if (utcMs <= Date.now() - 60000) {
          setAddError('Scheduled publication time must be in the future.');
          setIsAddingTickets(false);
          return;
        }

        const scheduledDateObj = new Date(utcMs);
        const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const displayHours = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayTime = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
        const scheduledForDisplay = `${String(day).padStart(2, '0')} ${monthsNames[month - 1]} ${year}, ${displayTime} IST`;

        if (onSchedulePublication) {
          const res = await onSchedulePublication({
            drawDate: config.businessDate,
            seriesId: activeColumn.id,
            seriesTitle: config.seriesTitle,
            tickets: ticketsToAdd,
            scheduledForMs: utcMs,
            scheduledForIso: scheduledDateObj.toISOString(),
            scheduledForDisplay,
            timezone: 'Asia/Kolkata',
          });
          if (res && !res.success) {
            setAddError(res.error || 'Failed to schedule publication.');
            return;
          }
        } else {
          lotteryService.schedulePublication({
            drawDate: config.businessDate,
            seriesId: activeColumn.id,
            seriesTitle: config.seriesTitle,
            tickets: ticketsToAdd,
            scheduledForMs: utcMs,
            scheduledForIso: scheduledDateObj.toISOString(),
            scheduledForDisplay,
            timezone: 'Asia/Kolkata',
            createdBy: 'Admin',
            createdByUid: currentUserUid,
          });
        }

        setAddSuccessMessage(`Scheduled ${ticketsToAdd.length} ticket(s) to publish on ${scheduledForDisplay}. Tickets remain unpublished and unavailable until scheduled execution.`);
        setTimeout(() => {
          setIsAddTicketsModalOpen(false);
          setAddSuccessMessage(null);
        }, 2200);
        setAddSingleNumber('');
        setAddCommaList('');
        setAddRanges([{ id: '1', start: '0001', end: '0025' }]);
        return;
      }

      const status = addPublishImmediately ? 'PUBLISHED' : 'UNPUBLISHED';
      if (onAddTicketInventory) {
        const res = await onAddTicketInventory(
          ticketsToAdd,
          config.businessDate,
          activeColumn.id,
          config.seriesTitle,
          status
        );
        if (res && !res.success) {
          setAddError(res.error || 'Failed to add tickets.');
          return;
        }
      } else {
        lotteryService.addTicketInventory(
          ticketsToAdd,
          config.businessDate,
          activeColumn.id,
          config.seriesTitle,
          status,
          { id: currentUserUid || 'ADM001', name: 'Admin', role: 'admin' }
        );
      }
      setInternalInventory(lotteryService.getInventory(config.businessDate, undefined, currentRole));
      setAddSuccessMessage(`Successfully added ${ticketsToAdd.length} ticket(s) across ${addMode === 'range' ? addRanges.length + ' range(s)' : 'operation'}!`);
      setTimeout(() => {
        setIsAddTicketsModalOpen(false);
        setAddSuccessMessage(null);
      }, 1500);
      setAddSingleNumber('');
      setAddCommaList('');
      setAddRanges([{ id: '1', start: '0001', end: '0025' }]);
    } catch (err: any) {
      setAddError(err?.message || 'Error adding tickets');
    } finally {
      setIsAddingTickets(false);
    }
  };

  const handleSaveAppearance = async () => {
    if (onUpdateGridAppearance) {
      await onUpdateGridAppearance(editAppearance);
    } else {
      lotteryService.updateGridAppearance(editAppearance, currentRole);
    }
    setIsAppearanceModalOpen(false);
  };

  const handleResetAppearance = () => {
    setEditAppearance(DEFAULT_GRID_APPEARANCE);
  };

  const getTicketLock = (num: string): TicketLock | undefined => {
    return activeLocks.find(
      (l) => l.ticketNumber === num && l.status === 'LOCKED'
    );
  };

  // Reliable lock release on page unload or component unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeLockedTickets.length > 0 && activeLockId && onReleaseTicketLock) {
        onReleaseTicketLock(activeLockedTickets, activeLockId).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (activeLockedTickets.length > 0 && activeLockId && onReleaseTicketLock) {
        onReleaseTicketLock(activeLockedTickets, activeLockId).catch(() => {});
      }
    };
  }, [activeLockedTickets, activeLockId, onReleaseTicketLock]);

  const getDefaultSetFlags = () => ({
    half: defaultSetType === 'half' || defaultSetType === 'both',
    full: defaultSetType === 'full' || defaultSetType === 'both',
  });

  const releaseCurrentModalLock = async () => {
    const lockIdToRelease = activeLockId;
    const ticketsToRelease = [...activeLockedTickets];
    setOptimisticLocks([]);
    setActiveLockId('');
    setActiveLockedTickets([]);
    setLockExpiresAtMs(0);
    setBookingFormError(null);

    if (lockIdToRelease && ticketsToRelease.length > 0 && onReleaseTicketLock) {
      await onReleaseTicketLock(ticketsToRelease, lockIdToRelease).catch(() => {});
    }
  };

  const handleCloseSingleBookingModal = () => {
    const ticketToRelease = activePopupTicket;
    const lockIdToRelease = activeLockId;
    // Immediate synchronous UI cleanup (0ms latency, zero flicker)
    setActivePopupTicket(null);
    if (ticketToRelease) {
      setOptimisticLocks((prev) => prev.filter((n) => n !== ticketToRelease));
      setActiveLockedTickets((prev) => prev.filter((n) => n !== ticketToRelease));
    }
    setActiveLockId('');
    setLockExpiresAtMs(0);
    if (ticketToRelease && lockIdToRelease && onReleaseTicketLock) {
      onReleaseTicketLock([ticketToRelease], lockIdToRelease).catch(() => {});
    }
  };

  const handleCloseMultiBookingModal = () => {
    const ticketsToRelease = [...activeLockedTickets];
    const lockIdToRelease = activeLockId;
    setIsMultiBookModalOpen(false);
    setOptimisticLocks([]);
    setActiveLockedTickets([]);
    setActiveLockId('');
    setLockExpiresAtMs(0);
    if (ticketsToRelease.length > 0 && lockIdToRelease && onReleaseTicketLock) {
      onReleaseTicketLock(ticketsToRelease, lockIdToRelease).catch(() => {});
    }
  };

  const handleTicketClick = async (num: string) => {
    if (isMultiSelectMode) {
      handleToggleMultiSelect(num);
      return;
    }
    // Prevent duplicate taps or selection while busy
    if (isSubmittingBooking || activePopupTicket !== null || optimisticLocks.includes(num)) {
      return;
    }
    if (isTicketBooked(num)) {
      setAlreadyBookedNum(num);
      return;
    }

    const existingLock = getTicketLock(num);
    if (
      existingLock &&
      currentUserUid &&
      existingLock.lockedByUid &&
      existingLock.lockedByUid !== currentUserUid
    ) {
      setLockedByOtherMessage('This ticket is currently being booked by another user.');
      return;
    }

    setBookingFormError(null);
    const defaultFlags = getDefaultSetFlags();
    setSingleHalf(defaultFlags.half);
    setSingleFull(defaultFlags.full);
    setActiveIdempotencyKey(`idem-${num}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

    // Immediate reservation (< 1ms visual feedback)
    setOptimisticLocks((prev) => (prev.includes(num) ? prev : [...prev, num]));
    setActiveLockedTickets([num]);
    setActivePopupTicket(num);
    const fallbackLockId = `lock_${currentUserUid || 'usr'}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setActiveLockId(fallbackLockId);
    setLockExpiresAtMs(Date.now() + 7200000);

    // Asynchronously synchronize reservation with backend/Firebase so other employees see it grey and cannot touch it
    if (onAcquireTicketLock) {
      onAcquireTicketLock([num])
        .then((lockRes) => {
          if (lockRes && !lockRes.success) {
            // Only roll back if another user already booked it or holds it
            if (lockRes.alreadyBooked || lockRes.lockedByOther) {
              setActivePopupTicket((curr) => {
                if (curr === num) {
                  setOptimisticLocks((prev) => prev.filter((n) => n !== num));
                  setActiveLockedTickets((prev) => prev.filter((n) => n !== num));
                  if (lockRes.alreadyBooked) {
                    setAlreadyBookedNum(num);
                  } else {
                    setLockedByOtherMessage('This ticket is currently being booked by another user.');
                  }
                  return null;
                }
                return curr;
              });
            }
          } else if (lockRes?.lockId) {
            setActiveLockId(lockRes.lockId);
            if (lockRes.expiresAtMs) setLockExpiresAtMs(lockRes.expiresAtMs);
          }
        })
        .catch(() => {});
    }
  };

  const handleLongPress = (num: string) => {
    if (isTicketBooked(num)) return;
    const existingLock = getTicketLock(num);
    if (
      existingLock &&
      currentUserUid &&
      existingLock.lockedByUid &&
      existingLock.lockedByUid !== currentUserUid
    ) {
      setLockedByOtherMessage('This ticket is currently being booked by another user.');
      return;
    }
    setIsMultiSelectMode(true);
    if (!selectedMultiTickets.some((t) => t.ticketNumber === num)) {
      const flags = getDefaultSetFlags();
      setSelectedMultiTickets((prev) => [
        ...prev,
        { ticketNumber: num, half: flags.half, full: flags.full },
      ]);
    }
  };

  const handleToggleMultiSelect = (num: string) => {
    if (isTicketBooked(num)) {
      setAlreadyBookedNum(num);
      return;
    }
    const existingLock = getTicketLock(num);
    if (
      existingLock &&
      currentUserUid &&
      existingLock.lockedByUid &&
      existingLock.lockedByUid !== currentUserUid
    ) {
      setLockedByOtherMessage('This ticket is currently being booked by another user.');
      return;
    }
    if (selectedMultiTickets.some((t) => t.ticketNumber === num)) {
      const updated = selectedMultiTickets.filter((t) => t.ticketNumber !== num);
      setSelectedMultiTickets(updated);
    } else {
      const flags = getDefaultSetFlags();
      setSelectedMultiTickets((prev) => [
        ...prev,
        { ticketNumber: num, half: flags.half, full: flags.full },
      ]);
    }
  };

  const handleOpenMultiBookingModal = async () => {
    if (selectedMultiTickets.length === 0) return;
    const ticketNums = selectedMultiTickets.map((t) => t.ticketNumber);
    setBookingFormError(null);
    const fallbackLockId = `lock_multi_${currentUserUid || 'usr'}_${Date.now()}`;
    setActiveLockId(fallbackLockId);
    setActiveLockedTickets(ticketNums);
    setLockExpiresAtMs(Date.now() + 7200000);
    setActiveIdempotencyKey(
      `idem-multi-${ticketNums.join('-')}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    );
    setIsMultiBookModalOpen(true);

    if (onAcquireTicketLock) {
      onAcquireTicketLock(ticketNums)
        .then((lockRes) => {
          if (lockRes && !lockRes.success) {
            if (lockRes.lockedByOther || lockRes.alreadyBooked) {
              setLockedByOtherMessage(
                lockRes.lockedByOther
                  ? 'One or more tickets are currently being booked by another user.'
                  : lockRes.error || 'One or more tickets are already booked.'
              );
              handleCloseMultiBookingModal();
            }
          } else if (lockRes?.lockId) {
            setActiveLockId(lockRes.lockId);
            if (lockRes.expiresAtMs) setLockExpiresAtMs(lockRes.expiresAtMs);
          }
        })
        .catch(() => {});
    }
  };

  const handleReacquireExpiredLock = async (ticketsToLock: string[]) => {
    if (!onAcquireTicketLock) return;
    setBookingFormError(null);
    setIsAcquiringLock(true);
    try {
      const lockRes = await onAcquireTicketLock(ticketsToLock);
      if (!lockRes.success) {
        setBookingFormError(
          lockRes.lockedByOther
            ? 'This ticket is currently being booked by another user.'
            : lockRes.error || 'Could not re-lock ticket.'
        );
        return;
      }
      setActiveLockId(lockRes.lockId || '');
      setActiveLockedTickets(ticketsToLock);
      setLockExpiresAtMs(lockRes.expiresAtMs || Date.now() + 120000);
    } finally {
      setIsAcquiringLock(false);
    }
  };

  const handleConfirmSingleBook = async () => {
    if (isSubmittingBooking || !activePopupTicket) return;
    if (!singleHalf && !singleFull) {
      setBookingFormError('Please select at least one set type (Half Set or Full Set).');
      return;
    }

    setBookingFormError(null);
    setIsSubmittingBooking(true);
    try {
      const bookedNum = activePopupTicket;
      const res = await onBookMultipleTickets(
        [{ ticketNumber: bookedNum, half: singleHalf, full: singleFull }],
        customerName,
        customerPhone,
        {
          lockId: activeLockId,
          idempotencyKey: activeIdempotencyKey,
        }
      );

      if (res && res.success === false) {
        setBookingFormError(res.error || 'Failed to confirm booking.');
        return;
      }

      const assignedCustomerId = (res && res.customerId) || '#5316';
      setActivePopupTicket(null);
      setOptimisticLocks([]);
      setActiveLockId('');
      setActiveLockedTickets([]);
      setLockExpiresAtMs(0);
      setCopiedCustomerId(false);
      const halfPrice = Number(config.halfTicketPrice ?? 300);
      const fullPrice = Number(config.fullTicketPrice ?? 570);
      setBookingConfirmation({
        ticketNumbers: [bookedNum],
        customerId: assignedCustomerId,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        totalAmount:
          (singleHalf ? halfPrice : 0) + (singleFull ? fullPrice : 0),
        bookedAt: new Date().toISOString(),
      });
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleConfirmMultiBook = async () => {
    if (isSubmittingBooking || selectedMultiTickets.length === 0) return;

    const invalid = selectedMultiTickets.filter((t) => !t.half && !t.full);
    if (invalid.length > 0) {
      setBookingFormError('Every ticket must have at least Half Set or Full Set selected.');
      return;
    }

    const validItems = selectedMultiTickets;
    setBookingFormError(null);
    setIsSubmittingBooking(true);
    try {
      const res = await onBookMultipleTickets(validItems, customerName, customerPhone, {
        lockId: activeLockId,
        idempotencyKey: activeIdempotencyKey,
      });

      if (res && res.success === false) {
        setBookingFormError(res.error || 'Failed to confirm booking.');
        return;
      }

      const assignedCustomerId = (res && res.customerId) || '#5316';
      const bookedNums = validItems.map((i) => i.ticketNumber);
      const halfPrice = Number(config.halfTicketPrice ?? 300);
      const fullPrice = Number(config.fullTicketPrice ?? 570);
      const totalAmount = validItems.reduce(
        (sum, item) =>
          sum +
          (item.half ? halfPrice : 0) +
          (item.full ? fullPrice : 0),
        0
      );

      setIsMultiBookModalOpen(false);
      setIsMultiSelectMode(false);
      setSelectedMultiTickets([]);
      setActiveLockId('');
      setActiveLockedTickets([]);
      setLockExpiresAtMs(0);
      setCopiedCustomerId(false);
      setBookingConfirmation({
        ticketNumbers: bookedNums,
        customerId: assignedCustomerId,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        totalAmount,
        bookedAt: new Date().toISOString(),
      });
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCopyCustomerId = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCustomerId(true);
      setTimeout(() => setCopiedCustomerId(false), 2000);
    } catch {
      setCopiedCustomerId(true);
      setTimeout(() => setCopiedCustomerId(false), 2000);
    }
  };

  const trimmedSearch = searchQuery.trim();
  const isSpecificSearch = trimmedSearch.length > 0;
  const filteredNumbers = isSpecificSearch
    ? [trimmedSearch.padStart(4, '0')]
    : quickNumbers;

  return (
    <div className="w-full flex flex-col space-y-5 select-none">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {config.seriesTitle}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Draw Date: <strong className="text-slate-700">{config.businessDate}</strong>
              </span>
              <span>•</span>
              <span>
                Available: <strong className="text-slate-700">{quickNumbers.length}</strong>
              </span>
              <span>•</span>
              <span>
                Total Booked: <strong className="text-slate-700">{bookedTickets.length}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {currentRole === 'admin' && (
              <>
                <button
                  onClick={() => setIsAddTicketsModalOpen(true)}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                  title="Add ticket numbers or ranges to inventory"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Tickets</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsQueueModalOpen(true)}
                  className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                  title="View, edit, or delete upcoming scheduled collections"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Upcoming Queue ({scheduledPublications.filter((s) => s.status === 'SCHEDULED').length})
                  </span>
                </button>
                <button
                  onClick={() => {
                    setEditAppearance(appearance);
                    setIsAppearanceModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-200"
                  title="Customize ticket grid appearance and colors"
                >
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <span>Colors</span>
                </button>
              </>
            )}
            <button
              onClick={onExportRecords}
              className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                if (isMultiSelectMode && selectedMultiTickets.length > 0) {
                  handleOpenMultiBookingModal();
                } else {
                  setIsMultiSelectMode((prev) => !prev);
                  if (isMultiSelectMode) setSelectedMultiTickets([]);
                }
              }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border ${
                isMultiSelectMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>
                {isMultiSelectMode
                  ? selectedMultiTickets.length > 0
                    ? `Multi Book (${selectedMultiTickets.length})`
                    : 'Multi Booking Active'
                  : 'Multi Book'}
              </span>
            </button>

            <button
              onClick={onOpenAvailableGallery}
              className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Available Sheet</span>
            </button>
          </div>
        </div>

                {/* Visual Ticket State Legend */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded border inline-block" style={{ backgroundColor: appearance.availableBg, borderColor: appearance.borderColor }} />
              <span>Available</span>
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded border inline-block" style={{ backgroundColor: appearance.lockedBg || '#94a3b8', borderColor: appearance.borderColor }} />
              <span>Temporarily Reserved</span>
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-400 inline-block" />
              <span>Pending Confirmation</span>
            </span>
            <span className="inline-flex items-center space-x-1 text-slate-400 italic">
              <span>(Confirmed tickets automatically disappear from the grid)</span>
            </span>
          </div>
        </div>

      </div>

      {/* Employee Upcoming Reveal Notice Banner */}
      {scheduledPublications.filter((s) => s.status === 'SCHEDULED').length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center space-x-2.5 text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
            <div>
              <span className="font-bold">Upcoming Collections: </span>
              <span className="text-amber-800">
                {scheduledPublications
                  .filter((s) => s.status === 'SCHEDULED')
                  .map((s) => {
                    const firstT = s.tickets && s.tickets.length > 0 ? `#${s.tickets[0]}` : '';
                    const lastT = s.tickets && s.tickets.length > 0 ? `#${s.tickets[s.tickets.length - 1]}` : '';
                    const rangeLabel = firstT ? ` (${firstT} - ${lastT})` : '';
                    return `${s.seriesTitle || s.label || 'Collection'}${rangeLabel} reveals at ${s.scheduledForDisplay || 'scheduled time'}`;
                  })
                  .join(' • ')}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
            {currentRole === 'admin' && (
              <button
                type="button"
                onClick={() => setIsQueueModalOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center space-x-1"
              >
                <List className="w-3.5 h-3.5" />
                <span>Manage Queue ({scheduledPublications.filter((s) => s.status === 'SCHEDULED').length})</span>
              </button>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/70 text-amber-900 shrink-0 uppercase tracking-wider">
              Revealing Soon
            </span>
          </div>
        </div>
      )}

      {/* Multi-select Bar */}
      {isMultiSelectMode && (
        <div className="bg-white rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border border-blue-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs font-bold text-slate-800 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>
                {selectedMultiTickets.length === 0
                  ? 'Tap ticket numbers below to select for Multi Booking'
                  : `Selected: ${selectedMultiTickets.length} ticket(s)`}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 px-1.5">Set Type:</span>
              <button
                type="button"
                onClick={() => {
                  setDefaultSetType('half');
                  setSelectedMultiTickets((prev) =>
                    prev.map((t) => ({ ...t, half: true, full: false }))
                  );
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  defaultSetType === 'half'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Half Set
              </button>
              <button
                type="button"
                onClick={() => {
                  setDefaultSetType('full');
                  setSelectedMultiTickets((prev) =>
                    prev.map((t) => ({ ...t, half: false, full: true }))
                  );
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  defaultSetType === 'full'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Full Set
              </button>
              <button
                type="button"
                onClick={() => {
                  setDefaultSetType('both');
                  setSelectedMultiTickets((prev) =>
                    prev.map((t) => ({ ...t, half: true, full: true }))
                  );
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  defaultSetType === 'both'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Half + Full Set
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={() => {
                setIsMultiSelectMode(false);
                setSelectedMultiTickets([]);
              }}
              className="text-xs text-slate-500 font-semibold hover:text-slate-800 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white"
            >
              Cancel
            </button>
            <button
              disabled={selectedMultiTickets.length === 0 || isAcquiringLock}
              onClick={handleOpenMultiBookingModal}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold px-3.5 py-1.5 rounded-md transition-colors"
            >
              {isAcquiringLock
                ? 'Locking...'
                : `Book Selected (${selectedMultiTickets.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Ticket Grid */}
      <div className="flex-1 flex flex-col justify-center my-1">
        {isSpecificSearch ? (
          <div className="my-auto flex flex-col items-center justify-center py-6">
            {filteredNumbers.map((numStr) => {
              const booked = isTicketBooked(numStr);
              const lockInfo = !booked ? getTicketLock(numStr) : undefined;
              const isSelfLocked = activeLockedTickets.includes(numStr) || optimisticLocks.includes(numStr) || activePopupTicket === numStr;
              const isLocked = Boolean(lockInfo) || isSelfLocked;
              const isPending = isTicketPending(numStr);

              const searchTileStyle: React.CSSProperties = booked
                ? { backgroundColor: '#000000', borderColor: '#000000', color: '#ffffff' }
                : isLocked
                ? {
                    backgroundColor: appearance.lockedBg || 'rgba(148, 163, 184, 0.45)',
                    borderColor: isSelfLocked ? '#475569' : appearance.borderColor || '#cbd5e1',
                    color: '#475569',
                  }
                : isPending
                ? { backgroundColor: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' }
                : {
                    backgroundColor: appearance.availableBg || '#ffffff',
                    borderColor: appearance.borderColor || '#cbd5e1',
                    color: appearance.textColor || '#0f172a',
                  };

              return (
                <div key={numStr} className="text-center">
                  <button
                    disabled={isPending || booked || (isLocked && !isSelfLocked)}
                    onClick={() => handleTicketClick(numStr)}
                    style={searchTileStyle}
                    className={`w-36 h-24 rounded-xl flex flex-col items-center justify-center font-mono font-bold text-2xl transition-colors border relative hover:opacity-90 shadow-sm ${
                      booked
                        ? 'bg-black text-white border-black'
                        : isLocked
                        ? 'bg-slate-400/45 text-slate-600 border-slate-400/70 backdrop-blur-[1px]'
                        : ''
                    }`}
                  >
                    {isLocked && (
                      <Lock className="w-3.5 h-3.5 text-slate-600 mb-1" />
                    )}
                    <span>{numStr}</span>
                  </button>
                  <span className="text-xs font-medium text-slate-500 mt-2 block">
                    {booked
                      ? 'Status: Confirmed (Booked)'
                      : isLocked
                      ? 'Status: Temporarily Locked'
                      : 'Status: Available — Click number to book'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          quickNumbers.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300 p-8 my-auto max-w-md mx-auto w-full">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <CheckSquare className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-slate-800">No Tickets in Grid</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {currentRole === 'admin'
                  ? 'No published tickets available. Click "+ Add Tickets" above to add individual numbers or a range.'
                  : 'All published tickets have been confirmed, or no tickets are currently published for this series.'}
              </p>
              {currentRole === 'admin' && (
                <button
                  onClick={() => setIsAddTicketsModalOpen(true)}
                  className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Tickets</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2.5 sm:gap-3 my-auto max-w-2xl mx-auto w-full py-2">
              {quickNumbers.map((numStr) => {
                const booked = isTicketBooked(numStr);
                const lockInfo = !booked ? getTicketLock(numStr) : undefined;
                const isSelfLocked = activeLockedTickets.includes(numStr) || optimisticLocks.includes(numStr) || activePopupTicket === numStr;
                const isLocked = Boolean(lockInfo) || isSelfLocked;
                const isPending = isTicketPending(numStr);
                const isSelected = selectedMultiTickets.some((t) => t.ticketNumber === numStr);

                const tileStyle: React.CSSProperties = booked
                  ? { backgroundColor: '#000000', borderColor: '#000000', color: '#ffffff' }
                  : isLocked
                  ? {
                      backgroundColor: appearance.lockedBg || 'rgba(148, 163, 184, 0.45)',
                      borderColor: isSelfLocked ? '#475569' : appearance.borderColor || '#cbd5e1',
                      color: '#475569',
                    }
                  : isPending
                  ? { backgroundColor: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' }
                  : isSelected
                  ? { backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#ffffff' }
                  : {
                      backgroundColor: appearance.availableBg || '#ffffff',
                      borderColor: appearance.borderColor || '#cbd5e1',
                      color: appearance.textColor || '#0f172a',
                    };

                return (
                  <button
                    key={numStr}
                    disabled={isPending || booked || (isLocked && !isSelfLocked)}
                    onClick={() => handleTicketClick(numStr)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleLongPress(numStr);
                    }}
                    style={tileStyle}
                    title={
                      isPending
                        ? `Ticket #${numStr} — Pending Confirmation`
                        : isLocked
                        ? `Ticket #${numStr} — Temporarily locked`
                        : `Ticket #${numStr} — Available`
                    }
                    className="aspect-square max-w-[95px] mx-auto w-full rounded-xl flex flex-col items-center justify-center font-mono font-bold text-base sm:text-lg transition-colors select-none border relative shadow-2xs"
                  >
                    {isSelected && !isLocked && !isPending && (
                      <div className="absolute top-1.5 text-white">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    )}
                    {isLocked && (
                      <div className="absolute top-1.5 text-slate-600">
                        <Lock className="w-3 h-3" />
                      </div>
                    )}
                    {isPending && (
                      <div className="absolute top-1 text-[9px] font-sans font-bold bg-amber-500 text-white px-1.5 py-0.2 rounded">
                        Pending
                      </div>
                    )}
                    <span className={isSelected || isLocked || isPending ? 'mt-2' : ''}>{numStr}</span>
                  </button>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Bottom Search & Booked Tickets Bar */}
      <div className="space-y-2.5 mt-2 bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs max-w-2xl mx-auto w-full">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket number (e.g. 0012)..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-medium text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onOpenBookedTicketsDashboard}
          className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide uppercase transition-colors flex items-center justify-center space-x-2"
        >
          <span>Booked Tickets ({bookedTickets.length})</span>
        </button>
      </div>


      {/* Admin + Add Tickets Modal (Simplified Collections) */}
      {isAddTicketsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-5 flex flex-col max-h-[88vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-sm text-slate-900">+ Add Collections to Inventory</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTicketsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {addSuccessMessage && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{addSuccessMessage}</span>
              </div>
            )}

            {/* Stacked Collections */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {collections.map((col, idx) => {
                const s = parseInt(col.start, 10);
                const e = parseInt(col.end, 10);
                const count = !isNaN(s) && !isNaN(e) && e >= s ? e - s + 1 : 0;

                return (
                  <div
                    key={col.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      idx === 0
                        ? 'bg-slate-50 border-slate-300'
                        : 'bg-blue-50/40 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900">
                          {idx === 0 ? 'First Collection (Default)' : col.name}
                        </span>
                        {idx === 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                            No Timer
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold uppercase tracking-wider flex items-center space-x-1">
                            <Clock className="w-3 h-3 inline mr-0.5" />
                            <span>Timer Preset</span>
                          </span>
                        )}
                      </div>

                      {collections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCollection(col.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete collection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Range row */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-500">Range:</span>
                      <input
                        type="text"
                        value={col.start}
                        onChange={(e) => handleUpdateCollection(col.id, { start: e.target.value })}
                        placeholder="0001"
                        className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-xs text-center"
                      />
                      <span className="text-xs text-slate-400">to</span>
                      <input
                        type="text"
                        value={col.end}
                        onChange={(e) => handleUpdateCollection(col.id, { end: e.target.value })}
                        placeholder="0025"
                        className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-xs text-center"
                      />
                      <span className="text-[11px] font-mono text-slate-500 font-semibold ml-auto">
                        ({count} tkts)
                      </span>
                    </div>

                    {/* Timer Preset row (only from 2nd collection onwards) */}
                    {col.hasTimer && (
                      <div className="mt-3 pt-2.5 border-t border-blue-200/60 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-[11px] font-bold text-slate-600">Quick Timer:</span>
                          {[15, 30, 60].map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => {
                                const now = new Date();
                                const t = new Date(now.getTime() + mins * 60 * 1000);
                                const hh = String(t.getHours()).padStart(2, '0');
                                const mm = String(t.getMinutes()).padStart(2, '0');
                                handleUpdateCollection(col.id, {
                                  presetMinutes: mins,
                                  customTime: `${hh}:${mm}`,
                                });
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                col.presetMinutes === mins
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              +{mins}m
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px] font-bold text-slate-600">Reveal Time:</span>
                          <input
                            type="time"
                            value={col.customTime}
                            onChange={(e) =>
                              handleUpdateCollection(col.id, {
                                customTime: e.target.value,
                                presetMinutes: 0,
                              })
                            }
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddCollection}
                className="w-full py-2.5 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Collection</span>
              </button>
            </div>

            {/* Total Tickets Summary */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Total Tickets to Add:</span>
              <strong className="font-mono text-sm text-blue-700">{totalCollectionsTickets} tickets</strong>
            </div>

            {/* Enter & Cancel Footer */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setIsAddTicketsModalOpen(false)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAddingTickets || totalCollectionsTickets === 0}
                onClick={handleExecuteCollectionsAdd}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                {isAddingTickets ? 'Entering...' : 'Enter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Customize Appearance Modal */}
      {isAppearanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-lg border border-slate-200 p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-sm text-slate-900">Customize Ticket Colors</span>
              </div>
              <button onClick={() => setIsAppearanceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Available Ticket Background</span>
                <input
                  type="color"
                  value={editAppearance.availableBg || '#ffffff'}
                  onChange={(e) => setEditAppearance({ ...editAppearance, availableBg: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Locked Ticket Background</span>
                <input
                  type="color"
                  value={editAppearance.lockedBg || '#94a3b8'}
                  onChange={(e) => setEditAppearance({ ...editAppearance, lockedBg: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Ticket Number Text Color</span>
                <input
                  type="color"
                  value={editAppearance.textColor || '#0f172a'}
                  onChange={(e) => setEditAppearance({ ...editAppearance, textColor: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Border Color</span>
                <input
                  type="color"
                  value={editAppearance.borderColor || '#cbd5e1'}
                  onChange={(e) => setEditAppearance({ ...editAppearance, borderColor: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                />
              </div>

              {/* Live Preview Tile */}
              <div className="pt-2 border-t border-slate-100 text-center">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">Live Preview (Available Ticket)</span>
                <div
                  style={{
                    backgroundColor: editAppearance.availableBg,
                    borderColor: editAppearance.borderColor,
                    color: editAppearance.textColor,
                  }}
                  className="w-20 h-20 rounded-xl mx-auto border flex items-center justify-center font-mono font-bold text-lg shadow-xs"
                >
                  0015
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleResetAppearance}
                  className="py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={handleSaveAppearance}
                  className="py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-xs"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Upcoming Collections Queue Modal (Edit & Delete) */}
      {isQueueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 p-5 flex flex-col max-h-[88vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-sm text-slate-900">
                  Upcoming Collections Queue ({scheduledPublications.filter((s) => s.status === 'SCHEDULED').length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsQueueModalOpen(false);
                  setEditingScheduleId(null);
                  setEditScheduleError(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error or Success feedback */}
            {editScheduleError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editScheduleError}</span>
              </div>
            )}
            {scheduleSuccessMsg && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{scheduleSuccessMsg}</span>
              </div>
            )}

            {/* Queue items list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {scheduledPublications.filter((s) => s.status === 'SCHEDULED').length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">No upcoming collections in queue.</p>
                  <p className="text-slate-500 mt-0.5">Use "+ Add Tickets" to schedule a future collection release.</p>
                </div>
              ) : (
                scheduledPublications
                  .filter((s) => s.status === 'SCHEDULED')
                  .map((sched, idx) => {
                    const isEditing = editingScheduleId === sched.id;
                    const firstT = sched.tickets && sched.tickets.length > 0 ? sched.tickets[0] : '0001';
                    const lastT = sched.tickets && sched.tickets.length > 0 ? sched.tickets[sched.tickets.length - 1] : '0001';

                    if (isEditing) {
                      const s = parseInt(editStart, 10);
                      const e = parseInt(editEnd, 10);
                      const count = !isNaN(s) && !isNaN(e) && e >= s ? e - s + 1 : 0;

                      return (
                        <div
                          key={sched.id}
                          className="p-4 rounded-xl border-2 border-blue-400 bg-blue-50/40 shadow-xs"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs text-blue-900">
                              Editing Collection #{idx + 1} ({sched.seriesTitle})
                            </span>
                            <span className="text-[11px] font-mono text-blue-700 font-bold">
                              {count} tickets
                            </span>
                          </div>

                          {/* Range Inputs */}
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-xs font-semibold text-slate-600">Range:</span>
                            <input
                              type="text"
                              value={editStart}
                              onChange={(e) => setEditStart(e.target.value)}
                              placeholder="0001"
                              className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-center"
                            />
                            <span className="text-xs text-slate-400">to</span>
                            <input
                              type="text"
                              value={editEnd}
                              onChange={(e) => setEditEnd(e.target.value)}
                              placeholder="0025"
                              className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs text-center"
                            />
                          </div>

                          {/* Reveal time & Quick Timer */}
                          <div className="pt-2 border-t border-blue-200 flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex items-center space-x-1">
                              <span className="text-[11px] font-bold text-slate-600">Quick Timer:</span>
                              {[15, 30, 60].map((mins) => (
                                <button
                                  key={mins}
                                  type="button"
                                  onClick={() => {
                                    const now = new Date();
                                    const t = new Date(now.getTime() + mins * 60 * 1000);
                                    const hh = String(t.getHours()).padStart(2, '0');
                                    const mm = String(t.getMinutes()).padStart(2, '0');
                                    setEditPresetMinutes(mins);
                                    setEditCustomTime(`${hh}:${mm}`);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                    editPresetMinutes === mins
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  +{mins}m
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center space-x-1.5">
                              <span className="text-[11px] font-bold text-slate-600">Reveal Time:</span>
                              <input
                                type="time"
                                value={editCustomTime}
                                onChange={(e) => {
                                  setEditCustomTime(e.target.value);
                                  setEditPresetMinutes(0);
                                }}
                                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                              />
                            </div>
                          </div>

                          {/* Action Buttons for Edit */}
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingScheduleId(null);
                                setEditScheduleError(null);
                              }}
                              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isSavingSchedule}
                              onClick={() => handleSaveEditedSchedule(sched.id, sched.seriesId, sched.seriesTitle)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1 shadow-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isSavingSchedule ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={sched.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/70 transition-colors shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-bold text-xs text-slate-900">
                              Collection #{idx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold uppercase tracking-wider flex items-center space-x-1">
                              <Clock className="w-3 h-3 inline mr-0.5" />
                              <span>Upcoming</span>
                            </span>
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              #{firstT} - #{lastT}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              ({sched.tickets.length} tickets)
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-xs text-amber-900">
                            <span className="font-semibold text-slate-600">Reveals at:</span>
                            <strong className="text-amber-800 font-mono">{sched.scheduledForDisplay}</strong>
                          </div>
                        </div>

                        {/* Actions: Edit, Delete, Publish Now */}
                        <div className="flex items-center space-x-1.5 self-end sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingScheduleId(sched.id);
                              setEditStart(firstT);
                              setEditEnd(lastT);
                              setEditPresetMinutes(0);
                              if (sched.scheduledForMs) {
                                const d = new Date(sched.scheduledForMs);
                                const hh = String(d.getHours()).padStart(2, '0');
                                const mm = String(d.getMinutes()).padStart(2, '0');
                                setEditCustomTime(`${hh}:${mm}`);
                              } else {
                                setEditCustomTime('');
                              }
                            }}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1 border border-blue-200 cursor-pointer"
                            title="Edit range or reveal time"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(sched.id)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1 border border-rose-200 cursor-pointer"
                            title="Delete this collection from queue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePublishScheduleNow(sched)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1 border border-emerald-200 cursor-pointer"
                            title="Publish this collection to inventory immediately"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Publish Now</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200 mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Collections in queue reveal to employees automatically when the timer expires.
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsQueueModalOpen(false);
                  setEditingScheduleId(null);
                  setEditScheduleError(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin 1-Week Ticket Presets Modal */}
      {isWeeklyPresetsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 p-5 flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">1-Week Ticket Presets (Daily Custom Schedule)</h3>
                  <p className="text-[11px] text-slate-500">Configure and store custom ticket ranges for each day of the week.</p>
                </div>
              </div>
              <button
                onClick={() => setIsWeeklyPresetsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feedback alert */}
            {presetFeedback && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                  presetFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {presetFeedback.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{presetFeedback.message}</span>
              </div>
            )}

            {/* 7-Day Week Tabs */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-2">Select Day of Week to Customize:</label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const dayCfg = editingWeeklyPresets.days[day];
                  const isSelected = activePresetDay === day;
                  const isToday = currentDayOfWeekName === day;
                  const count = dayCfg?.tickets?.length || 0;
                  const isEnabled = Boolean(dayCfg?.enabled);

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setActivePresetDay(day)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {isToday && (
                        <span
                          className={`absolute -top-1.5 px-1 py-0.2 rounded-full text-[8px] font-extrabold uppercase ${
                            isSelected ? 'bg-amber-400 text-slate-900' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          Today
                        </span>
                      )}
                      <span className="text-[11px] font-bold block">{day.slice(0, 3)}</span>
                      <span
                        className={`text-[9px] font-mono mt-0.5 px-1 py-0.2 rounded ${
                          isSelected
                            ? 'bg-blue-700 text-blue-100'
                            : isEnabled
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-slate-50 text-slate-400 line-through'
                        }`}
                      >
                        {isEnabled ? `${count}t` : 'off'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Day Configuration Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4 mb-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-slate-900">{activePresetDay} Configuration</span>
                  {currentDayOfWeekName === activePresetDay && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Today's Day
                    </span>
                  )}
                </div>
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(activeDayPresetConfig.enabled)}
                    onChange={(e) => handleUpdateActiveDayField({ enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">Enable Preset</span>
                </label>
              </div>

              {/* Mode selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Preset Mode:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateActiveDayField({ mode: 'range' })}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      activeDayPresetConfig.mode === 'range'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Number Range
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateActiveDayField({ mode: 'list' })}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      activeDayPresetConfig.mode === 'list'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Comma List
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateActiveDayField({ mode: 'single' })}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      activeDayPresetConfig.mode === 'single'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Single Ticket
                  </button>
                </div>
              </div>

              {/* Inputs depending on mode */}
              {activeDayPresetConfig.mode === 'range' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Start Number:</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={activeDayPresetConfig.rangeStart || '0000'}
                        onChange={(e) => handleUpdateActiveDayField({ rangeStart: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-blue-600 bg-white"
                        placeholder="0000"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">End Number:</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={activeDayPresetConfig.rangeEnd || '0099'}
                        onChange={(e) => handleUpdateActiveDayField({ rangeEnd: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-blue-600 bg-white"
                        placeholder="0099"
                      />
                    </div>
                  </div>

                  {/* Quick range chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 mr-1">Quick:</span>
                    {[
                      { label: '0000-0099 (100)', start: '0000', end: '0099' },
                      { label: '0000-0249 (250)', start: '0000', end: '0249' },
                      { label: '0000-0499 (500)', start: '0000', end: '0499' },
                      { label: '0000-0999 (1000)', start: '0000', end: '0999' },
                    ].map((presetRange) => (
                      <button
                        key={presetRange.label}
                        type="button"
                        onClick={() =>
                          handleUpdateActiveDayField({
                            rangeStart: presetRange.start,
                            rangeEnd: presetRange.end,
                          })
                        }
                        className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600 transition-colors"
                      >
                        {presetRange.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeDayPresetConfig.mode === 'list' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Comma or Space Separated Numbers:
                  </label>
                  <textarea
                    rows={3}
                    value={activeDayPresetConfig.ticketList || ''}
                    onChange={(e) => handleUpdateActiveDayField({ ticketList: e.target.value })}
                    placeholder="e.g. 0001, 0002, 0005, 0010, 0025..."
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-600 bg-white"
                  />
                </div>
              )}

              {activeDayPresetConfig.mode === 'single' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Single Ticket Number:</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={activeDayPresetConfig.singleTicket || ''}
                    onChange={(e) => handleUpdateActiveDayField({ singleTicket: e.target.value })}
                    placeholder="0042"
                    className="w-32 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-blue-600 bg-white"
                  />
                </div>
              )}

              {/* Tickets Summary & Preview */}
              <div className="pt-2 border-t border-slate-200 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">
                    Calculated Tickets: <strong className="text-slate-900">{activeDayPresetConfig.tickets?.length || 0}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={isApplyingDayPreset || !activeDayPresetConfig.enabled || activeDayPresetConfig.tickets?.length === 0}
                    onClick={handleApplyActiveDayPresetToCurrentDraw}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-xs"
                    title={`Immediately apply ${activePresetDay} tickets to current draw date (${config.businessDate})`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Apply to Current Draw ({config.businessDate})</span>
                  </button>
                </div>

                {activeDayPresetConfig.tickets && activeDayPresetConfig.tickets.length > 0 && (
                  <div className="max-h-20 overflow-y-auto p-2 bg-white rounded-lg border border-slate-200 flex flex-wrap gap-1">
                    {activeDayPresetConfig.tickets.slice(0, 30).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-700">
                        {t}
                      </span>
                    ))}
                    {activeDayPresetConfig.tickets.length > 30 && (
                      <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-semibold">
                        +{activeDayPresetConfig.tickets.length - 30} more...
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 1-Week Schedule Publish Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-xs text-blue-900 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Publish Full 7-Day Week Schedule</span>
                </h4>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Takes all enabled daily presets and publishes tickets across the 7 consecutive draw dates starting from today.
                </p>
              </div>
              <button
                type="button"
                disabled={isPublishingWeek}
                onClick={handlePublishFullWeek}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 shrink-0"
              >
                {isPublishingWeek ? (
                  <span>Publishing 7 Days...</span>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Publish 7 Days Now</span>
                  </>
                )}
              </button>
            </div>

            {/* Scheduled Releases Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-xs text-slate-900">
                    Scheduled Ticket Releases ({scheduledPublications.length})
                  </h4>
                </div>
                {onProcessScheduledPublications && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await onProcessScheduledPublications();
                        const count = res?.processedCount || 0;
                        setPresetFeedback({
                          type: 'success',
                          message: count > 0 ? `Processed and published ${count} scheduled publication(s)!` : 'No scheduled releases are due yet.',
                        });
                      } catch (err: any) {
                        setPresetFeedback({
                          type: 'error',
                          message: err?.message || 'Failed to process scheduled releases.',
                        });
                      }
                    }}
                    className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-medium shadow-xs transition-colors"
                  >
                    Check &amp; Process Due Now
                  </button>
                )}
              </div>

              {scheduledPublications.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500 bg-white rounded-lg border border-dashed border-slate-200">
                  No ticket releases currently scheduled. Use "+ Add Tickets" &rarr; "Schedule Publication" to set a future release date &amp; time.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {scheduledPublications.map((sched) => {
                    const statusColors: Record<string, string> = {
                      SCHEDULED: 'bg-amber-100 text-amber-800 border-amber-200',
                      PUBLISHED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      FAILED: 'bg-rose-100 text-rose-800 border-rose-200',
                      CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
                      DRAFT: 'bg-blue-100 text-blue-800 border-blue-200',
                    };
                    const colorClass = statusColors[sched.status] || 'bg-slate-100 text-slate-600 border-slate-200';

                    return (
                      <div
                        key={sched.id}
                        className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
                              {sched.status}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {(sched.tickets || []).length} Tickets
                            </span>
                            <span className="text-slate-400">&bull;</span>
                            <span className="text-slate-600">
                              Draw: <strong>{sched.drawDate}</strong>
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500 flex items-center space-x-1 flex-wrap">
                            <span>Release time:</span>
                            <strong className="text-slate-700">{sched.scheduledForDisplay || sched.scheduledForIso} (Asia/Kolkata)</strong>
                            {sched.error && (
                              <span className="text-rose-600 ml-2">({sched.error})</span>
                            )}
                          </div>
                        </div>

                        {sched.status === 'SCHEDULED' && onCancelScheduledPublication && (
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await onCancelScheduledPublication(sched.id);
                              if (res.success) {
                                setPresetFeedback({ type: 'success', message: 'Scheduled release cancelled.' });
                              } else {
                                setPresetFeedback({ type: 'error', message: res.error || 'Failed to cancel schedule.' });
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors shrink-0"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsWeeklyPresetsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isSavingWeeklyPresets}
                onClick={handleSaveWeeklyPresets}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingWeeklyPresets ? 'Saving Presets...' : 'Save All Weekly Presets'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Ticket Booking Modal */}
      {activePopupTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-lg overflow-hidden border border-slate-200 p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-slate-900">Book Ticket</span>
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Selected</span>
                </span>
              </div>
              <button
                onClick={handleCloseSingleBookingModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center mb-4">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                Ticket Number
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 tracking-wider">
                {activePopupTicket}
              </span>
              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                {config.seriesTitle}
              </span>
            </div>

            {bookingFormError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{bookingFormError}</span>
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Select Set Type
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSingleHalf(true);
                      setSingleFull(false);
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-colors ${
                      singleHalf
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="singleSetType"
                      checked={singleHalf}
                      readOnly
                      className="w-3.5 h-3.5 pointer-events-none"
                    />
                    <span>Half Set (₹{config.halfTicketPrice ?? 300})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSingleFull(true);
                      setSingleHalf(false);
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-colors ${
                      singleFull
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="singleSetType"
                      checked={singleFull}
                      readOnly
                      className="w-3.5 h-3.5 pointer-events-none"
                    />
                    <span>Full Set (₹{config.fullTicketPrice ?? 570})</span>
                  </button>
                </div>

                <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">
                    {singleHalf ? 'Half Set only' : 'Full Set only'}
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    ₹{singleHalf ? (config.halfTicketPrice ?? 300) : (config.fullTicketPrice ?? 570)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCloseSingleBookingModal}
                className="py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingBooking || (!singleHalf && !singleFull)}
                onClick={handleConfirmSingleBook}
                className="py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs transition-colors"
              >
                {isSubmittingBooking
                  ? 'Submitting...'
                  : currentRole === 'employee'
                  ? 'Submit Booking Request'
                  : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Ticket Booking Modal */}
      {isMultiBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-slate-200 p-5 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-slate-900">
                  Multi Ticket Booking ({selectedMultiTickets.length})
                </span>
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Tickets Locked</span>
                </span>
              </div>
              <button
                onClick={handleCloseMultiBookingModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bookingFormError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{bookingFormError}</span>
              </div>
            )}

            {/* Quick Set Type Batch Buttons */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3">
              <span className="text-xs font-semibold text-slate-600">Apply to all:</span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedMultiTickets((prev) =>
                      prev.map((t) => ({ ...t, half: true, full: false }))
                    )
                  }
                  className="px-2 py-1 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  All Half
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedMultiTickets((prev) =>
                      prev.map((t) => ({ ...t, half: false, full: true }))
                    )
                  }
                  className="px-2 py-1 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  All Full
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 max-h-48 overflow-y-auto">
              <table className="w-full text-center text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-2">S.No</th>
                    <th className="py-2 px-2">Ticket #</th>
                    <th className="py-2 px-2">Half Set (₹{config.halfTicketPrice ?? 300})</th>
                    <th className="py-2 px-2">Full Set (₹{config.fullTicketPrice ?? 570})</th>
                    <th className="py-2 px-2">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedMultiTickets.map((item, idx) => (
                    <tr key={item.ticketNumber} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2 text-slate-500">{idx + 1}</td>
                      <td className="py-1.5 px-2 font-bold font-mono text-slate-900">
                        {item.ticketNumber}
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="radio"
                          name={`set-type-${item.ticketNumber}`}
                          checked={item.half}
                          onChange={() =>
                            setSelectedMultiTickets((prev) =>
                              prev.map((t) =>
                                t.ticketNumber === item.ticketNumber
                                  ? { ...t, half: true, full: false }
                                  : t
                              )
                            )
                          }
                          className="w-4 h-4 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="radio"
                          name={`set-type-${item.ticketNumber}`}
                          checked={item.full}
                          onChange={() =>
                            setSelectedMultiTickets((prev) =>
                              prev.map((t) =>
                                t.ticketNumber === item.ticketNumber
                                  ? { ...t, full: true, half: false }
                                  : t
                              )
                            )
                          }
                          className="w-4 h-4 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <button
                          onClick={async () => {
                            if (activeLockId && onReleaseTicketLock) {
                              await onReleaseTicketLock(
                                [item.ticketNumber],
                                activeLockId
                              ).catch(() => {});
                            }
                            const updated = selectedMultiTickets.filter(
                              (t) => t.ticketNumber !== item.ticketNumber
                            );
                            setSelectedMultiTickets(updated);
                            setActiveLockedTickets(updated.map((t) => t.ticketNumber));
                            setOptimisticLocks((prev) => prev.filter((n) => n !== item.ticketNumber));
                            if (updated.length === 0) {
                              setIsMultiBookModalOpen(false);
                              setIsMultiSelectMode(false);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCloseMultiBookingModal}
                className="py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingBooking}
                onClick={handleConfirmMultiBook}
                className="py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs transition-colors"
              >
                {isSubmittingBooking
                  ? 'Confirming...'
                  : `Confirm Booking (${selectedMultiTickets.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Recorded Confirmation Dialog with Unique Customer Serial Code */}
      {bookingConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-sm rounded-xl p-5 shadow-lg text-center border border-slate-200">
            <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-3">
              Booking Recorded
            </h3>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-3 text-left space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Ticket:</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {bookingConfirmation.ticketNumbers.join(', ')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-500">Customer:</span>
                <span className="font-bold text-sm text-slate-900">
                  {bookingConfirmation.customerName}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-500">Total Amount:</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  ₹{bookingConfirmation.totalAmount}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Ticket{' '}
              <span className="font-bold font-mono text-slate-900">
                {bookingConfirmation.ticketNumbers.join(', ')}
              </span>{' '}
              has been successfully booked for{' '}
              <span className="font-bold text-slate-900">
                {bookingConfirmation.customerName}
              </span>
              .
            </p>

            <button
              onClick={() => setBookingConfirmation(null)}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Locked By Another User Dialog */}
      {lockedByOtherMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-xs rounded-xl p-5 shadow-lg text-center border border-slate-200 relative">
            <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center">
              <Lock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              Ticket Temporarily Locked
            </h3>
            <p className="text-xs text-slate-600 mb-4">{lockedByOtherMessage}</p>
            <button
              onClick={() => setLockedByOtherMessage(null)}
              className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Already Booked Dialog */}
      {alreadyBookedNum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-xs rounded-xl p-5 shadow-lg text-center border border-slate-200 relative">
            <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <X className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              Ticket Unavailable
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ticket <span className="font-bold text-slate-800">{alreadyBookedNum}</span> is already booked.
            </p>
            <button
              onClick={() => setAlreadyBookedNum(null)}
              className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
