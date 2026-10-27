import React, { useState, useEffect } from 'react';
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
  const [lockExpiresAtMs, setLockExpiresAtMs] = useState<number>(0);
  const [lockRemainingSeconds, setLockRemainingSeconds] = useState<number>(0);
  const [isAcquiringLock, setIsAcquiringLock] = useState<boolean>(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
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
  const [appearance, setAppearance] = useState<GridAppearanceConfig>(
    gridAppearance || lotteryService.getGridAppearance()
  );

  useEffect(() => {
    if (gridAppearance) {
      setAppearance(gridAppearance);
      setEditAppearance(gridAppearance);
    }
  }, [gridAppearance]);

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
        await onUpdateWeeklyPresets(editingWeeklyPresets);
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
      setAddRangeStart(todayDayPresetConfig.rangeStart || '0000');
      setAddRangeEnd(todayDayPresetConfig.rangeEnd || '0099');
    } else if (todayDayPresetConfig.mode === 'list') {
      setAddCommaList(todayDayPresetConfig.ticketList || '');
    } else if (todayDayPresetConfig.mode === 'single') {
      setAddSingleNumber(todayDayPresetConfig.singleTicket || '');
    }
  };

  const [addMode, setAddMode] = useState<'single' | 'list' | 'range'>('range');
  const [addSingleNumber, setAddSingleNumber] = useState('');
  const [addCommaList, setAddCommaList] = useState('');
  const [addRangeStart, setAddRangeStart] = useState('0001');
  const [addRangeEnd, setAddRangeEnd] = useState('0025');
  const [addPublishImmediately, setAddPublishImmediately] = useState(true);
  const [addError, setAddError] = useState<string | null>(null);
  const [isAddingTickets, setIsAddingTickets] = useState(false);
  const [editAppearance, setEditAppearance] = useState<GridAppearanceConfig>(appearance);

  const allInventory = inventoryTickets && inventoryTickets.length > 0 ? inventoryTickets : internalInventory;

  const confirmedSet = new Set<string>();
  for (const b of bookedTickets) {
    if (b.bookingStatus === 'Booked') {
      confirmedSet.add(b.ticketNumber);
    }
  }

  const pendingSet = new Set<string>();
  for (const b of bookedTickets) {
    if (b.bookingStatus === 'Pending Confirmation') {
      pendingSet.add(b.ticketNumber);
    }
  }

  const isTicketBooked = (num: string) =>
    confirmedSet.has(num) ||
    allInventory.some((inv) => inv.ticketNumber === num && inv.bookingStatus === 'Booked');

  const isTicketPending = (num: string) =>
    pendingSet.has(num) ||
    allInventory.some((inv) => inv.ticketNumber === num && inv.bookingStatus === 'Pending Confirmation');

  // Confirmed tickets MUST DISAPPEAR automatically from visible Ticket Grid!
  // Remaining tickets move upward to fill empty spaces immediately.
  const visibleTickets = allInventory
    .filter((inv) => {
      if (currentRole !== 'admin' && inv.status !== 'PUBLISHED') return false;
      if (inv.bookingStatus === 'Booked' || confirmedSet.has(inv.ticketNumber)) return false;
      return true;
    })
    .sort((a, b) => a.ticketNumber.localeCompare(b.ticketNumber, undefined, { numeric: true }));

  const quickNumbers = visibleTickets.map((t) => t.ticketNumber);

  const handleExecuteAddTickets = async () => {
    setAddError(null);
    let ticketsToAdd: string[] = [];
    if (addMode === 'single') {
      const norm = addSingleNumber.trim().padStart(4, '0');
      if (!/^\d{4}$/.test(norm)) {
        setAddError('Please enter a valid 4-digit ticket number (e.g. 0015).');
        return;
      }
      ticketsToAdd = [norm];
    } else if (addMode === 'list') {
      const parts = addCommaList.split(/[\s,]+/).map((s) => s.trim().padStart(4, '0')).filter((s) => /^\d{4}$/.test(s));
      if (parts.length === 0) {
        setAddError('Please enter valid comma-separated 4-digit ticket numbers.');
        return;
      }
      ticketsToAdd = Array.from(new Set(parts));
    } else if (addMode === 'range') {
      const s = parseInt(addRangeStart, 10);
      const e = parseInt(addRangeEnd, 10);
      if (isNaN(s) || isNaN(e) || s < 0 || e < s || (e - s) > 500) {
        setAddError('Please enter a valid range (start <= end, max 500 tickets).');
        return;
      }
      for (let i = s; i <= e; i++) {
        ticketsToAdd.push(String(i).padStart(4, '0'));
      }
    }

    const alreadyBooked = ticketsToAdd.filter((n) => isTicketBooked(n));
    if (alreadyBooked.length > 0) {
      setAddError(`Cannot add ticket(s) ${alreadyBooked.join(', ')} because they are already confirmed/booked.`);
      return;
    }

    setIsAddingTickets(true);
    try {
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
      setIsAddTicketsModalOpen(false);
      setAddSingleNumber('');
      setAddCommaList('');
    } finally {
      setIsAddingTickets(false);
    }
  };

  const handleSaveAppearance = async () => {
    setAppearance(editAppearance);
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
    const nowMs = Date.now();
    return activeLocks.find(
      (l) => l.ticketNumber === num && l.status === 'LOCKED' && l.expiresAtMs > nowMs
    );
  };

  // Countdown timer for active lock while booking modal is open
  useEffect(() => {
    if ((!activePopupTicket && !isMultiBookModalOpen) || !lockExpiresAtMs) {
      setLockRemainingSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((lockExpiresAtMs - Date.now()) / 1000));
      setLockRemainingSeconds(remaining);
    };
    updateCountdown();

    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [activePopupTicket, isMultiBookModalOpen, lockExpiresAtMs]);

  // Automatic lock renewal every 5 seconds while user is actively completing the booking form
  useEffect(() => {
    if (
      (!activePopupTicket && !isMultiBookModalOpen) ||
      !activeLockId ||
      activeLockedTickets.length === 0 ||
      !onRenewTicketLock
    ) {
      return;
    }

    const renewInterval = setInterval(async () => {
      if (Date.now() >= lockExpiresAtMs) return;
      const res = await onRenewTicketLock(activeLockedTickets, activeLockId);
      if (res?.success && res.expiresAtMs) {
        setLockExpiresAtMs(res.expiresAtMs);
      }
    }, 5000);

    return () => clearInterval(renewInterval);
  }, [
    activePopupTicket,
    isMultiBookModalOpen,
    activeLockId,
    activeLockedTickets,
    lockExpiresAtMs,
    onRenewTicketLock,
  ]);

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getDefaultSetFlags = () => ({
    half: defaultSetType === 'half' || defaultSetType === 'both',
    full: defaultSetType === 'full' || defaultSetType === 'both',
  });

  const releaseCurrentModalLock = async () => {
    const lockIdToRelease = activeLockId;
    const ticketsToRelease = [...activeLockedTickets];
    setActiveLockId('');
    setActiveLockedTickets([]);
    setLockExpiresAtMs(0);
    setBookingFormError(null);

    if (lockIdToRelease && ticketsToRelease.length > 0 && onReleaseTicketLock) {
      await onReleaseTicketLock(ticketsToRelease, lockIdToRelease).catch(() => {});
    }
  };

  const handleCloseSingleBookingModal = async () => {
    setActivePopupTicket(null);
    await releaseCurrentModalLock();
  };

  const handleCloseMultiBookingModal = async () => {
    setIsMultiBookModalOpen(false);
    await releaseCurrentModalLock();
  };

  const handleTicketClick = async (num: string) => {
    if (isMultiSelectMode) {
      handleToggleMultiSelect(num);
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
    if (onAcquireTicketLock) {
      setIsAcquiringLock(true);
      try {
        const lockRes = await onAcquireTicketLock([num]);
        if (!lockRes.success) {
          if (lockRes.alreadyBooked) {
            setAlreadyBookedNum(num);
          } else {
            setLockedByOtherMessage(
              lockRes.lockedByOther
                ? 'This ticket is currently being booked by another user.'
                : lockRes.error || 'This ticket is currently being booked by another user.'
            );
          }
          return;
        }
        setActiveLockId(lockRes.lockId || '');
        setActiveLockedTickets([num]);
        setLockExpiresAtMs(lockRes.expiresAtMs || Date.now() + 120000);
      } finally {
        setIsAcquiringLock(false);
      }
    } else {
      setActiveLockId(`local-lock-${Date.now()}`);
      setActiveLockedTickets([num]);
      setLockExpiresAtMs(Date.now() + 120000);
    }

    setSingleHalf(false);
    setSingleFull(true);
    setActiveIdempotencyKey(`idem-${num}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    setActivePopupTicket(num);
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

    if (onAcquireTicketLock) {
      setIsAcquiringLock(true);
      try {
        const lockRes = await onAcquireTicketLock(ticketNums);
        if (!lockRes.success) {
          setLockedByOtherMessage(
            lockRes.lockedByOther
              ? 'This ticket is currently being booked by another user.'
              : lockRes.error || 'This ticket is currently being booked by another user.'
          );
          return;
        }
        setActiveLockId(lockRes.lockId || '');
        setActiveLockedTickets(ticketNums);
        setLockExpiresAtMs(lockRes.expiresAtMs || Date.now() + 120000);
      } finally {
        setIsAcquiringLock(false);
      }
    } else {
      setActiveLockId(`local-lock-${Date.now()}`);
      setActiveLockedTickets(ticketNums);
      setLockExpiresAtMs(Date.now() + 120000);
    }

    setActiveIdempotencyKey(
      `idem-multi-${ticketNums.join('-')}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    );
    setIsMultiBookModalOpen(true);
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
    if (!activePopupTicket) return;
    if (!singleHalf && !singleFull) return;

    if (lockExpiresAtMs > 0 && Date.now() >= lockExpiresAtMs) {
      setBookingFormError(
        'Your 120-second ticket lock has expired. Please click "Re-acquire Lock" before confirming.'
      );
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
      setActiveLockId('');
      setActiveLockedTickets([]);
      setLockExpiresAtMs(0);
      setCopiedCustomerId(false);
      setBookingConfirmation({
        ticketNumbers: [bookedNum],
        customerId: assignedCustomerId,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        totalAmount:
          (singleHalf ? config.halfTicketPrice : 0) + (singleFull ? config.fullTicketPrice : 0),
        bookedAt: new Date().toISOString(),
      });
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleConfirmMultiBook = async () => {
    if (selectedMultiTickets.length === 0) return;

    if (lockExpiresAtMs > 0 && Date.now() >= lockExpiresAtMs) {
      setBookingFormError(
        'Your 120-second ticket lock has expired. Please click "Re-acquire Lock" before confirming.'
      );
      return;
    }

    const validItems = selectedMultiTickets.map((t) =>
      !t.half && !t.full ? { ...t, full: true } : t
    );

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
      const totalAmount = validItems.reduce(
        (sum, item) =>
          sum +
          (item.half ? config.halfTicketPrice : 0) +
          (item.full ? config.fullTicketPrice : 0),
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
                <button
                  onClick={() => {
                    if (weeklyPresets) {
                      setEditingWeeklyPresets(JSON.parse(JSON.stringify(weeklyPresets)));
                    }
                    setPresetFeedback(null);
                    setIsWeeklyPresetsModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                  title="Configure 1-week custom ticket presets for each day of the week"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Weekly Presets</span>
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
              disabled={isAcquiringLock}
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
              <span className="w-3.5 h-3.5 rounded border inline-block" style={{ backgroundColor: appearance.lockedBg, borderColor: appearance.borderColor }} />
              <span>Locked (120s)</span>
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
              const isLocked = Boolean(lockInfo);

              return (
                <div key={numStr} className="text-center">
                  <button
                    disabled={isAcquiringLock}
                    onClick={() => handleTicketClick(numStr)}
                    className={`w-36 h-24 rounded-xl flex flex-col items-center justify-center font-mono font-bold text-2xl transition-colors border relative ${
                      booked
                        ? 'bg-black text-white border-black'
                        : isLocked
                        ? 'bg-slate-400/45 text-slate-600 border-slate-400/70 backdrop-blur-[1px]'
                        : 'bg-white text-slate-900 border-slate-300 hover:border-blue-600'
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
                const isLocked = Boolean(lockInfo);
                const isLockedByOther = isLocked && lockInfo?.lockedByUid !== currentUserUid;
                const isSelfLocked = activeLockedTickets.includes(numStr);
                const isPending = isTicketPending(numStr);
                const isSelected = selectedMultiTickets.some((t) => t.ticketNumber === numStr);

                const tileStyle: React.CSSProperties = isSelfLocked
                  ? { backgroundColor: '#dbeafe', borderColor: '#2563eb', color: '#1e40af' }
                  : isLockedByOther
                  ? {
                      backgroundColor: appearance.lockedBg || 'rgba(148, 163, 184, 0.45)',
                      borderColor: appearance.borderColor || '#cbd5e1',
                      color: appearance.textColor || '#0f172a',
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
                    disabled={isAcquiringLock || isPending}
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


      {/* Admin + Add Tickets Modal */}
      {isAddTicketsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg border border-slate-200 p-5 flex flex-col max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-sm text-slate-900">+ Add Tickets to Inventory</span>
              </div>
              <button onClick={() => setIsAddTicketsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Draw Date & Series</label>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-700 flex justify-between">
                  <span>{config.businessDate}</span>
                  <span className="font-bold text-blue-700">{config.seriesTitle}</span>
                </div>
              </div>

              {todayDayPresetConfig && todayDayPresetConfig.enabled && todayDayPresetConfig.tickets?.length > 0 && (
                <button
                  type="button"
                  onClick={handleFillTodayPresetIntoAddModal}
                  className="w-full py-2 px-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Use {currentDayOfWeekName} Preset ({todayDayPresetConfig.tickets.length} tickets)</span>
                </button>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Input Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddMode('range')}
                    className={`py-1.5 rounded-lg font-semibold text-center border transition-colors ${
                      addMode === 'range' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Range
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('single')}
                    className={`py-1.5 rounded-lg font-semibold text-center border transition-colors ${
                      addMode === 'single' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('list')}
                    className={`py-1.5 rounded-lg font-semibold text-center border transition-colors ${
                      addMode === 'list' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Comma List
                  </button>
                </div>
              </div>

              {addMode === 'range' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Start Number</label>
                    <input
                      type="text"
                      value={addRangeStart}
                      onChange={(e) => setAddRangeStart(e.target.value)}
                      placeholder="0001"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">End Number</label>
                    <input
                      type="text"
                      value={addRangeEnd}
                      onChange={(e) => setAddRangeEnd(e.target.value)}
                      placeholder="0050"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {addMode === 'single' && (
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Ticket Number (4 digits)</label>
                  <input
                    type="text"
                    value={addSingleNumber}
                    onChange={(e) => setAddSingleNumber(e.target.value)}
                    placeholder="0015"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-base"
                  />
                </div>
              )}

              {addMode === 'list' && (
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Comma-Separated Ticket Numbers</label>
                  <textarea
                    rows={3}
                    value={addCommaList}
                    onChange={(e) => setAddCommaList(e.target.value)}
                    placeholder="0001, 0005, 0012, 0025..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addPublishImmediately}
                    onChange={(e) => setAddPublishImmediately(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span className="font-semibold text-slate-700">Publish immediately to Employee grids</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTicketsModalOpen(false)}
                  className="py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isAddingTickets}
                  onClick={handleExecuteAddTickets}
                  className="py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold transition-colors shadow-xs"
                >
                  {isAddingTickets ? 'Adding...' : 'Save & Add Tickets'}
                </button>
              </div>
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
                <span
                  className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    lockRemainingSeconds > 0
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>
                    {lockRemainingSeconds > 0
                      ? `Locked ${formatCountdown(lockRemainingSeconds)}`
                      : 'Lock Expired'}
                  </span>
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
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex flex-col space-y-2">
                <div className="flex items-start space-x-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{bookingFormError}</span>
                </div>
                {lockRemainingSeconds === 0 && (
                  <button
                    type="button"
                    disabled={isAcquiringLock}
                    onClick={() => handleReacquireExpiredLock([activePopupTicket])}
                    className="self-start px-2.5 py-1 rounded bg-rose-700 text-white text-[11px] font-semibold hover:bg-rose-800"
                  >
                    {isAcquiringLock ? 'Locking...' : 'Re-acquire Lock'}
                  </button>
                )}
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Set Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !singleHalf;
                      setSingleHalf(next);
                      if (!next && !singleFull) setSingleFull(true);
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-colors ${
                      singleHalf
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={singleHalf}
                      readOnly
                      className="w-3.5 h-3.5 rounded pointer-events-none"
                    />
                    <span>Half Set</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !singleFull;
                      setSingleFull(next);
                      if (!next && !singleHalf) setSingleHalf(true);
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-colors ${
                      singleFull
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={singleFull}
                      readOnly
                      className="w-3.5 h-3.5 rounded pointer-events-none"
                    />
                    <span>Full Set</span>
                  </button>
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
                disabled={isSubmittingBooking}
                onClick={handleConfirmSingleBook}
                className="py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs transition-colors"
              >
                {isSubmittingBooking ? 'Submitting...' : currentRole === 'employee' ? 'Submit Booking Request' : 'Confirm Booking'}
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
                <span
                  className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    lockRemainingSeconds > 0
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>
                    {lockRemainingSeconds > 0
                      ? `Locked ${formatCountdown(lockRemainingSeconds)}`
                      : 'Lock Expired'}
                  </span>
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
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex flex-col space-y-2">
                <div className="flex items-start space-x-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{bookingFormError}</span>
                </div>
                {lockRemainingSeconds === 0 && (
                  <button
                    type="button"
                    disabled={isAcquiringLock}
                    onClick={() =>
                      handleReacquireExpiredLock(
                        selectedMultiTickets.map((t) => t.ticketNumber)
                      )
                    }
                    className="self-start px-2.5 py-1 rounded bg-rose-700 text-white text-[11px] font-semibold hover:bg-rose-800"
                  >
                    {isAcquiringLock ? 'Locking...' : 'Re-acquire Lock'}
                  </button>
                )}
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
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  All Half Set
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedMultiTickets((prev) =>
                      prev.map((t) => ({ ...t, half: false, full: true }))
                    )
                  }
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  All Full Set
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 max-h-48 overflow-y-auto">
              <table className="w-full text-center text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-2">S.No</th>
                    <th className="py-2 px-2">Ticket #</th>
                    <th className="py-2 px-2">Half Set</th>
                    <th className="py-2 px-2">Full Set</th>
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
                          type="checkbox"
                          checked={item.half}
                          onChange={() =>
                            setSelectedMultiTickets((prev) =>
                              prev.map((t) =>
                                t.ticketNumber === item.ticketNumber ? { ...t, half: !t.half } : t
                              )
                            )
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="checkbox"
                          checked={item.full}
                          onChange={() =>
                            setSelectedMultiTickets((prev) =>
                              prev.map((t) =>
                                t.ticketNumber === item.ticketNumber ? { ...t, full: !t.full } : t
                              )
                            )
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
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
                <span className="font-semibold text-slate-500">Customer ID:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {bookingConfirmation.customerId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCustomerId(bookingConfirmation.customerId)}
                    className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold transition-colors"
                    title="Copy Customer ID"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCustomerId ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Ticket{' '}
              <span className="font-bold font-mono text-slate-900">
                {bookingConfirmation.ticketNumbers.join(', ')}
              </span>{' '}
              has been registered under Customer ID{' '}
              <span className="font-bold font-mono text-slate-900">
                {bookingConfirmation.customerId}
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
