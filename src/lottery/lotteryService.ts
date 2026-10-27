import {
  TicketBooking,
  TicketLock,
  CustomerRecord,
  SystemConfig,
  TodayWinnerRecord,
  ResultPaperDocument,
  EmployeeProfile,
  SelectedTicketItem,
  LoginType,
  PaymentAuditEntry,
  TicketInventoryItem,
  GridAppearanceConfig,
  DEFAULT_GRID_APPEARANCE,
} from './types';
import { LOTTERY_COLUMNS_SPEC } from './mockData';

const STORAGE_KEYS = {
  BOOKINGS: 'carrom_lottery_bookings_v2',
  CONFIG: 'carrom_lottery_config_v2',
  WINNERS: 'carrom_lottery_winners_v2',
  PAPERS: 'carrom_lottery_papers_v2',
  USERS: 'carrom_lottery_users_v2',
  CUSTOMERS: 'carrom_lottery_customers_v2',
  CUSTOMER_COUNTER: 'carrom_lottery_customer_counter_v2',
  LOCKS: 'carrom_lottery_ticket_locks_v2',
  IDEMPOTENCY: 'carrom_lottery_booking_idempotency_v2',
  INVENTORY: 'carrom_lottery_inventory_v2',
  APPEARANCE: 'carrom_lottery_appearance_v2',
};

export const TICKET_LOCK_DURATION_MS = 2 * 60 * 1000; // 2 minutes (120 seconds)
export const CUSTOMER_CODE_BASE = 5315;               // First new customer serial code starts at #5316

// Initial default configuration
export const DEFAULT_CONFIG: SystemConfig = {
  seriesTitle: 'CUSTOM NAME',
  businessDate: '02 Oct 2026',
  halfTicketPrice: 25,
  fullTicketPrice: 50,
  gpayNumber: '9949311900',
  gpayName: 'Sasikaran (Carrom Draws)',
  upiId: 'sasikaran9949@oksbi',
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=sasikaran9949@oksbi%26pn=Sasikaran%26cu=INR',
};

export const INITIAL_STAFF_ACCOUNTS: EmployeeProfile[] = [
  { id: 'ADM001', name: 'Super Admin', phone: '9999999999', role: 'admin' },
  { id: 'EMP001', name: 'Sasikaran', phone: '9949311900', role: 'employee' },
  { id: 'EMP002', name: 'Hariharan', phone: '9845123456', role: 'employee' },
  { id: 'PEM001', name: 'Gogul', phone: '9765432109', role: 'paid_employee' },
];

export const INITIAL_WINNERS: TodayWinnerRecord[] = [
  {
    id: 'win-1',
    drawDate: '02 Oct 2026',
    seriesTitle: 'CUSTOM NAME',
    winningNumber: '0012',
    prizeCategory: '1st Prize',
    prizeAmount: 100000,
    verifiedBy: 'Super Admin',
    enteredAt: '02 Oct 2026 12:00 PM',
    status: 'Official',
    notes: 'Super bumper draw result verified with lottery board seal',
  },
  {
    id: 'win-2',
    drawDate: '02 Oct 2026',
    seriesTitle: 'CUSTOM NAME',
    winningNumber: '0076',
    prizeCategory: '2nd Prize',
    prizeAmount: 50000,
    verifiedBy: 'Super Admin',
    enteredAt: '02 Oct 2026 12:05 PM',
    status: 'Official',
    notes: 'Official 2nd prize draw',
  },
];

export const INITIAL_PAPERS: ResultPaperDocument[] = [
  {
    id: 'paper-1',
    drawDate: '02 Oct 2026',
    seriesTitle: 'CUSTOM NAME',
    title: 'Official Evening Result Declaration Sheet #02-10-26',
    fileUrl: '/assets/brand/anbu-aiot-logo.png',
    uploadedBy: 'Super Admin',
    uploadedAt: '02 Oct 2026 01:15 PM',
    fileSizeKb: 342,
    verifiedOfficial: true,
  },
];

// Helper to seed realistic bookings with distinct customer serial codes (#5101 .. #5115)
export const createInitialSeedBookings = (): TicketBooking[] => {
  const seedItems = [
    { num: '0003', name: 'Sasikaran', phone: '9949311900', customerId: '#5101', half: false, full: true, paid: false },
    { num: '0007', name: 'Monoharan', phone: '9949311901', customerId: '#5102', half: false, full: true, paid: false },
    { num: '0012', name: 'Hariharan', phone: '9845123456', customerId: '#5103', half: true, full: false, paid: false },
    { num: '0015', name: 'Rajkumar', phone: '9845123401', customerId: '#5104', half: false, full: true, paid: false },
    { num: '0021', name: 'Karthik', phone: '9845123402', customerId: '#5105', half: false, full: true, paid: false },
    { num: '0024', name: 'Arun', phone: '9845123403', customerId: '#5106', half: true, full: false, paid: false },
    { num: '0030', name: 'Praveen', phone: '9845123404', customerId: '#5107', half: false, full: true, paid: false },
    { num: '0045', name: 'Senthil', phone: '9845123405', customerId: '#5108', half: false, full: true, paid: false },
    { num: '0068', name: 'Dinesh', phone: '9845123406', customerId: '#5109', half: true, full: false, paid: false },
    { num: '0076', name: 'Manikandan', phone: '9845123407', customerId: '#5110', half: false, full: true, paid: false },
    { num: '0102', name: 'Gogul', phone: '9765432109', customerId: '#5111', half: false, full: true, paid: true },
    { num: '0150', name: 'Vignesh', phone: '9845123408', customerId: '#5112', half: false, full: true, paid: false },
    { num: '0188', name: 'Balaji', phone: '9845123409', customerId: '#5113', half: true, full: false, paid: false },
    { num: '0203', name: 'Suresh', phone: '9845123410', customerId: '#5114', half: false, full: true, paid: false },
    { num: '0224', name: 'Aravind', phone: '9845123411', customerId: '#5115', half: false, full: true, paid: false },
  ];

  return seedItems.map((item, index) => {
    const halfAmt = item.half ? 25 : 0;
    const fullAmt = item.full ? 50 : 0;
    const total = halfAmt + fullAmt;
    const isPaid = item.paid;
    const amtPaid = isPaid ? total : 0;

    return {
      id: `booking-${item.num}`,
      ticketNumber: item.num,
      seriesTitle: 'CUSTOM NAME',
      customerId: item.customerId,
      customerName: item.name,
      customerPhone: item.phone,
      ticketType: item.half && item.full ? 'both' : item.half ? 'half' : 'full',
      halfSelected: item.half,
      halfAmount: halfAmt,
      fullSelected: item.full,
      fullAmount: fullAmt,
      totalAmount: total,
      amountPaid: amtPaid,
      remainingBalance: total - amtPaid,
      bookingStatus: 'Booked',
      paymentStatus: isPaid ? 'Paid' : 'Unpaid',
      paymentRef: isPaid ? `UPI-TXN-1029${index}` : undefined,
      paidBy: isPaid ? item.name : undefined,
      bookedBy: 'Sasikaran',
      bookedByUsername: 'sasikaran',
      bookedByRole: 'employee',
      date: '02 Oct 2026',
      bookedAt: '02 Oct 2026 09:30 AM',
      paidAt: isPaid ? '02 Oct 2026 10:15 AM' : undefined,
      history: [
        {
          id: `hist-${Date.now()}-${index}`,
          timestamp: '02 Oct 2026 09:30 AM',
          action: 'BOOKED',
          amountChanged: total,
          performedBy: 'Sasikaran',
          performedByRole: 'employee',
          notes: `Counter sales booking initiated (${item.customerId})`,
        },
      ],
    };
  });
};

/**
 * Service class handling all transactional data operations,
 * atomic bookings, real-time ticket locks, customer serial codes,
 * permission-guarded payments, and audit logs.
 */
class LotteryDatabaseService {
  private inMemoryBookings: TicketBooking[] = [];
  private inMemoryConfig: SystemConfig = DEFAULT_CONFIG;
  private inMemoryWinners: TodayWinnerRecord[] = INITIAL_WINNERS;
  private inMemoryPapers: ResultPaperDocument[] = INITIAL_PAPERS;
  private inMemoryCustomers: Map<string, CustomerRecord> = new Map();
  private inMemoryLocks: Map<string, TicketLock> = new Map();
  private inMemoryInventory: Map<string, TicketInventoryItem> = new Map();
  private inMemoryAppearance: GridAppearanceConfig = DEFAULT_GRID_APPEARANCE;
  private inMemoryIdempotency: Map<string, any> = new Map();
  private lastCustomerSerial: number = CUSTOMER_CODE_BASE;
  private listeners: Set<() => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.init();
    this.initRealtimeChannel();
  }

  private initRealtimeChannel() {
    try {
      if (typeof window !== 'undefined') {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel('carrom_lottery_realtime_v1');
          this.broadcastChannel.onmessage = () => {
            this.reloadFromStorage();
            this.notifyListeners();
          };
        }
        window.addEventListener('storage', () => {
          this.reloadFromStorage();
          this.notifyListeners();
        });
      }
    } catch {
      // Non-browser environment
    }
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {}
    });
  }

  private broadcastUpdate() {
    try {
      this.broadcastChannel?.postMessage({ type: 'SYNC', timestamp: Date.now() });
    } catch {}
    this.notifyListeners();
  }

  public subscribeChanges(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeRealtimeSync(callback: () => void): () => void {
    return this.subscribeChanges(callback);
  }

  private reloadFromStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const storedBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      if (storedBookings) {
        this.inMemoryBookings = this.ensureLegacyCustomerIds(JSON.parse(storedBookings));
      }
      const storedLocks = localStorage.getItem(STORAGE_KEYS.LOCKS);
      if (storedLocks) {
        const parsed: Record<string, TicketLock> = JSON.parse(storedLocks);
        this.inMemoryLocks = new Map(Object.entries(parsed));
      }
      const storedCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (storedCustomers) {
        const parsedCust: Record<string, CustomerRecord> = JSON.parse(storedCustomers);
        this.inMemoryCustomers = new Map(Object.entries(parsedCust));
      }
      const storedInv = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (storedInv) {
        const parsedInv = JSON.parse(storedInv);
        this.inMemoryInventory = new Map(
          parsedInv.map((item: any) => [item.id || `${item.drawDate}_${item.seriesId}_${item.ticketNumber}`, item])
        );
      }
      const storedApp = localStorage.getItem(STORAGE_KEYS.APPEARANCE);
      if (storedApp) {
        this.inMemoryAppearance = JSON.parse(storedApp);
      }
      const storedCounter = localStorage.getItem(STORAGE_KEYS.CUSTOMER_COUNTER);
      if (storedCounter) {
        const num = Number(storedCounter);
        if (num >= CUSTOMER_CODE_BASE) this.lastCustomerSerial = num;
      }
    } catch {}
  }

  /**
   * Ensures legacy bookings without `customerId` are safely assigned a deterministic
   * serial code without breaking existing records or falsely merging distinct customers.
   */
  public ensureLegacyCustomerIds(bookings: TicketBooking[]): TicketBooking[] {
    const legacyMap = new Map<string, string>();
    let legacyCounter = 5100;

    return bookings.map((b) => {
      if (b.customerId && /^#\d{4,8}$/.test(b.customerId)) {
        const normName = String(b.customerName || '').trim().toLowerCase().replace(/\s+/g, ' ');
        const normPhone = String(b.customerPhone || '').replace(/\D/g, '');
        if (normPhone.length >= 6 && normName.length >= 2) {
          const key = `${normPhone}::${normName}`;
          if (!legacyMap.has(key)) {
            legacyMap.set(key, b.customerId);
          }
          if (!this.inMemoryCustomers.has(key)) {
            const digits = b.customerId.replace(/^#/, '');
            this.inMemoryCustomers.set(key, {
              customerId: b.customerId,
              customerCodeDigits: digits,
              customerKey: key,
              customerName: b.customerName,
              normalizedName: normName,
              customerPhone: b.customerPhone,
              normalizedPhone: normPhone,
              totalBookings: 1,
              createdAtIso: b.bookedAt || new Date().toISOString(),
              updatedAtIso: b.bookedAt || new Date().toISOString(),
            });
          }
        }
        return b;
      }

      const normName = String(b.customerName || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const normPhone = String(b.customerPhone || '').replace(/\D/g, '');
      const hasReliableKey = normPhone.length >= 6 && normName.length >= 2;
      const key = hasReliableKey ? `${normPhone}::${normName}` : `legacy_single_${b.id}`;

      let assignedCode = legacyMap.get(key);
      if (!assignedCode) {
        legacyCounter += 1;
        while (String(legacyCounter) === String(b.ticketNumber)) {
          legacyCounter += 1;
        }
        assignedCode = `#${String(legacyCounter).padStart(4, '0')}`;
        legacyMap.set(key, assignedCode);
      }

      return {
        ...b,
        customerId: assignedCode,
      };
    });
  }

  private init() {
    try {
      const storedCounter =
        typeof window !== 'undefined' && window.localStorage
          ? localStorage.getItem(STORAGE_KEYS.CUSTOMER_COUNTER)
          : null;
      if (storedCounter && Number(storedCounter) >= CUSTOMER_CODE_BASE) {
        this.lastCustomerSerial = Number(storedCounter);
      }

      const storedCustomers =
        typeof window !== 'undefined' && window.localStorage
          ? localStorage.getItem(STORAGE_KEYS.CUSTOMERS)
          : null;
      if (storedCustomers) {
        const parsedCust: Record<string, CustomerRecord> = JSON.parse(storedCustomers);
        this.inMemoryCustomers = new Map(Object.entries(parsedCust));
      }

      const storedLocks =
        typeof window !== 'undefined' && window.localStorage
          ? localStorage.getItem(STORAGE_KEYS.LOCKS)
          : null;
      if (storedLocks) {
        const parsedLocks: Record<string, TicketLock> = JSON.parse(storedLocks);
        this.inMemoryLocks = new Map(Object.entries(parsedLocks));
      }

      const storedInventory =
        typeof window !== 'undefined' && window.localStorage
          ? localStorage.getItem(STORAGE_KEYS.INVENTORY)
          : null;
      if (storedInventory) {
        const parsedInv = JSON.parse(storedInventory);
        this.inMemoryInventory = new Map(
          parsedInv.map((item: any) => [item.id || `${item.drawDate}_${item.seriesId}_${item.ticketNumber}`, item])
        );
      }
      const storedAppearance =
        typeof window !== 'undefined' && window.localStorage
          ? localStorage.getItem(STORAGE_KEYS.APPEARANCE)
          : null;
      if (storedAppearance) {
        this.inMemoryAppearance = JSON.parse(storedAppearance);
      }
      const storedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (storedConfig) {
        this.inMemoryConfig = JSON.parse(storedConfig);
      } else {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
      }

      const storedBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      if (storedBookings) {
        this.inMemoryBookings = this.ensureLegacyCustomerIds(JSON.parse(storedBookings));
        this.saveBookings();
      } else {
        const seed = this.ensureLegacyCustomerIds(createInitialSeedBookings());
        this.inMemoryBookings = seed;
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(seed));
      }

      const storedWinners = localStorage.getItem(STORAGE_KEYS.WINNERS);
      if (storedWinners) {
        this.inMemoryWinners = JSON.parse(storedWinners);
      } else {
        localStorage.setItem(STORAGE_KEYS.WINNERS, JSON.stringify(INITIAL_WINNERS));
      }

      const storedPapers = localStorage.getItem(STORAGE_KEYS.PAPERS);
      if (storedPapers) {
        this.inMemoryPapers = JSON.parse(storedPapers);
      } else {
        localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(INITIAL_PAPERS));
      }
    } catch {
      this.inMemoryBookings = this.ensureLegacyCustomerIds(createInitialSeedBookings());
      this.inMemoryConfig = DEFAULT_CONFIG;
    }
  }

  private saveBookings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(this.inMemoryBookings));
      }
    } catch {}
  }

  private saveCustomers() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const obj = Object.fromEntries(this.inMemoryCustomers.entries());
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(obj));
        localStorage.setItem(STORAGE_KEYS.CUSTOMER_COUNTER, String(this.lastCustomerSerial));
      }
    } catch {}
  }

  private saveLocks() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const obj = Object.fromEntries(this.inMemoryLocks.entries());
        localStorage.setItem(STORAGE_KEYS.LOCKS, JSON.stringify(obj));
      }
    } catch {}
  }

  private saveConfig() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.inMemoryConfig));
      }
    } catch {}
  }

  private saveWinners() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.WINNERS, JSON.stringify(this.inMemoryWinners));
      }
    } catch {}
  }

  private savePapers() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(this.inMemoryPapers));
      }
    } catch {}
  }

  private normalizeTicketNum(num: string): string {
    return String(num || '').trim().padStart(4, '0');
  }

  private getLockKey(drawDate: string, ticketNumber: string): string {
    const cleanDate = String(drawDate || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${cleanDate}_${this.normalizeTicketNum(ticketNumber)}`;
  }

  // Config getters/setters
  public getConfig(): SystemConfig {
    return { ...this.inMemoryConfig };
  }

  public updateConfig(newConfig: Partial<SystemConfig>, role: LoginType): { success: boolean; error?: string } {
    if (role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only Admin can modify system configuration.' };
    }
    this.inMemoryConfig = { ...this.inMemoryConfig, ...newConfig };
    this.saveConfig();
    this.broadcastUpdate();
    return { success: true };
  }

  // Bookings list
  public getBookings(date?: string, role?: LoginType, operatorUid?: string): TicketBooking[] {
    let list = date
      ? this.inMemoryBookings.filter((b) => b.date === date)
      : this.inMemoryBookings;
    if (role === 'employee' && operatorUid) {
      list = list.filter((b) => b.bookedByUid === operatorUid);
    }
    return [...list];
  }

  public getUnpaidBookings(date?: string): TicketBooking[] {
    return this.getBookings(date).filter((b) => b.paymentStatus !== 'Paid');
  }

  public getPaidBookings(date?: string): TicketBooking[] {
    return this.getBookings(date).filter((b) => b.paymentStatus === 'Paid');
  }

  public isTicketBooked(ticketNumber: string, date: string): boolean {
    const norm = this.normalizeTicketNum(ticketNumber);
    return this.inMemoryBookings.some(
      (b) => b.ticketNumber === norm && b.date === date && b.bookingStatus === 'Booked'
    );
  }

  /**
   * Returns all currently active (unexpired) ticket locks for a draw date
   */
  public getActiveLocks(date: string, nowMs: number = Date.now()): TicketLock[] {
    const active: TicketLock[] = [];
    let mutated = false;
    for (const [key, lock] of this.inMemoryLocks.entries()) {
      if (lock.expiresAtMs <= nowMs || this.isTicketBooked(lock.ticketNumber, lock.drawDate)) {
        this.inMemoryLocks.delete(key);
        mutated = true;
        continue;
      }
      if (!date || lock.drawDate === date) {
        active.push({ ...lock });
      }
    }
    if (mutated) {
      this.saveLocks();
    }
    return active;
  }

  /**
   * Acquires a 2-minute temporary lock on one or more tickets
   */
  public acquireTicketLock(
    paramsOrTickets:
      | {
          ticketNumbers: string[];
          drawDate: string;
          lockedByUid: string;
          lockedByName: string;
          lockedByUsername?: string;
          lockedByRole?: LoginType;
          lockId?: string;
          nowMs?: number;
        }
      | string[]
      | string,
    drawDateArg?: string,
    lockedByUidArg?: string,
    lockedByNameArg?: string,
    lockedByUsernameArg?: string,
    lockIdArg?: string
  ): {
    success: boolean;
    code?: string;
    lockId?: string;
    expiresAtMs?: number;
    locks?: TicketLock[];
    error?: string;
  } {
    const params =
      Array.isArray(paramsOrTickets) || typeof paramsOrTickets === 'string'
        ? {
            ticketNumbers: Array.isArray(paramsOrTickets) ? paramsOrTickets : [paramsOrTickets],
            drawDate: drawDateArg || '',
            lockedByUid: lockedByUidArg || '',
            lockedByName: lockedByNameArg || 'Operator',
            lockedByUsername: lockedByUsernameArg,
            lockId: lockIdArg,
          }
        : paramsOrTickets;

    this.reloadFromStorage();
    const now = params.nowMs ?? Date.now();
    const drawDate = params.drawDate || this.inMemoryConfig.businessDate;
    const callerUid = String(params.lockedByUid || '').trim();
    if (!callerUid) {
      return { success: false, code: 'AUTH_REQUIRED', error: 'Authentication required to lock a ticket.' };
    }

    const normNums = Array.from(new Set(params.ticketNumbers.map((n) => this.normalizeTicketNum(n))));
    if (normNums.length === 0) {
      return { success: false, error: 'At least one ticket number is required.' };
    }

    let existingOwnerLockId = '';

    for (const num of normNums) {
      if (this.isTicketBooked(num, drawDate)) {
        return {
          success: false,
          code: 'ALREADY_BOOKED',
          error: `Ticket #${num} is already booked.`,
        };
      }

      const lockKey = this.getLockKey(drawDate, num);
      const existing = this.inMemoryLocks.get(lockKey);
      if (existing && existing.status === 'LOCKED' && existing.expiresAtMs > now) {
        if (existing.lockedByUid !== callerUid) {
          return {
            success: false,
            code: 'TICKET_LOCKED',
            error: 'This ticket is currently being booked by another user.',
          };
        } else if (!existingOwnerLockId && existing.lockId) {
          existingOwnerLockId = existing.lockId;
        }
      }
    }

    const lockId =
      params.lockId ||
      existingOwnerLockId ||
      `lock_${callerUid}_${now}_${Math.random().toString(36).slice(2, 10)}`;
    const expiresAtMs = now + TICKET_LOCK_DURATION_MS;
    const createdLocks: TicketLock[] = [];

    for (const num of normNums) {
      const lockKey = this.getLockKey(drawDate, num);
      const lockRec: TicketLock = {
        lockId,
        ticketNumber: num,
        drawDate,
        seriesId: 'default',
        status: 'LOCKED',
        lockedByUid: callerUid,
        lockedByName: params.lockedByName || 'Operator',
        lockedByUsername: params.lockedByUsername,
        lockedByRole: params.lockedByRole || 'employee',
        lockedAtMs: now,
        expiresAtMs,
        updatedAtIso: new Date(now).toISOString(),
      };
      this.inMemoryLocks.set(lockKey, lockRec);
      createdLocks.push(lockRec);
    }

    this.saveLocks();
    this.broadcastUpdate();

    return {
      success: true,
      lockId,
      expiresAtMs,
      locks: createdLocks,
    };
  }

  /**
   * Renews an active ticket lock for another 2 minutes if still owned by caller and unexpired
   */
  public renewTicketLock(
    paramsOrTickets:
      | {
          ticketNumbers: string[];
          drawDate: string;
          lockedByUid: string;
          lockId?: string;
          nowMs?: number;
        }
      | string[]
      | string,
    drawDateArg?: string,
    lockedByUidArg?: string,
    lockIdArg?: string
  ): {
    success: boolean;
    code?: string;
    expiresAtMs?: number;
    error?: string;
  } {
    const params =
      Array.isArray(paramsOrTickets) || typeof paramsOrTickets === 'string'
        ? {
            ticketNumbers: Array.isArray(paramsOrTickets) ? paramsOrTickets : [paramsOrTickets],
            drawDate: drawDateArg || '',
            lockedByUid: lockedByUidArg || '',
            lockId: lockIdArg,
          }
        : paramsOrTickets;

    this.reloadFromStorage();
    const now = params.nowMs ?? Date.now();
    const drawDate = params.drawDate || this.inMemoryConfig.businessDate;
    const callerUid = String(params.lockedByUid || '').trim();
    const normNums = Array.from(new Set(params.ticketNumbers.map((n) => this.normalizeTicketNum(n))));

    for (const num of normNums) {
      if (this.isTicketBooked(num, drawDate)) {
        return { success: false, code: 'ALREADY_BOOKED', error: `Ticket #${num} is already booked.` };
      }
      const lockKey = this.getLockKey(drawDate, num);
      const existing = this.inMemoryLocks.get(lockKey);
      if (!existing || existing.status !== 'LOCKED') {
        return { success: false, code: 'LOCK_NOT_FOUND', error: `No active lock found for ticket #${num}.` };
      }
      if (existing.lockedByUid !== callerUid) {
        return {
          success: false,
          code: 'LOCK_OWNERSHIP_MISMATCH',
          error: 'Cannot renew a lock owned by another user.',
        };
      }
      if (params.lockId && existing.lockId !== params.lockId) {
        return {
          success: false,
          code: 'LOCK_OWNERSHIP_MISMATCH',
          error: 'Lock token mismatch.',
        };
      }
      if (now > existing.expiresAtMs) {
        this.inMemoryLocks.delete(lockKey);
        this.saveLocks();
        this.broadcastUpdate();
        return {
          success: false,
          code: 'LOCK_EXPIRED',
          error: 'Your ticket lock has expired. Please select the ticket again to acquire a new lock.',
        };
      }
    }

    const expiresAtMs = now + TICKET_LOCK_DURATION_MS;
    for (const num of normNums) {
      const lockKey = this.getLockKey(drawDate, num);
      const existing = this.inMemoryLocks.get(lockKey)!;
      this.inMemoryLocks.set(lockKey, {
        ...existing,
        expiresAtMs,
        updatedAtIso: new Date(now).toISOString(),
      });
    }

    this.saveLocks();
    this.broadcastUpdate();

    return {
      success: true,
      expiresAtMs,
    };
  }

  /**
   * Releases a temporary ticket lock if owned by the caller
   */
  public releaseTicketLock(
    paramsOrTickets:
      | {
          ticketNumbers: string[];
          drawDate: string;
          lockedByUid: string;
          lockId?: string;
          nowMs?: number;
        }
      | string[]
      | string,
    drawDateArg?: string,
    lockedByUidArg?: string,
    lockIdArg?: string
  ): {
    success: boolean;
    code?: string;
    released?: string[];
    error?: string;
  } {
    const params =
      Array.isArray(paramsOrTickets) || typeof paramsOrTickets === 'string'
        ? {
            ticketNumbers: Array.isArray(paramsOrTickets) ? paramsOrTickets : [paramsOrTickets],
            drawDate: drawDateArg || '',
            lockedByUid: lockedByUidArg || '',
            lockId: lockIdArg,
          }
        : paramsOrTickets;

    this.reloadFromStorage();
    const now = params.nowMs ?? Date.now();
    const drawDate = params.drawDate || this.inMemoryConfig.businessDate;
    const callerUid = String(params.lockedByUid || '').trim();
    const normNums = Array.from(new Set(params.ticketNumbers.map((n) => this.normalizeTicketNum(n))));
    const released: string[] = [];

    for (const num of normNums) {
      const lockKey = this.getLockKey(drawDate, num);
      const existing = this.inMemoryLocks.get(lockKey);
      if (!existing) {
        released.push(num);
        continue;
      }
      const isExpired = now > existing.expiresAtMs;
      const isOwner = existing.lockedByUid === callerUid;
      if (!isOwner && !isExpired) {
        return {
          success: false,
          code: 'LOCK_OWNERSHIP_MISMATCH',
          error: 'Cannot release a ticket lock owned by another user.',
        };
      }
      if (isOwner && params.lockId && existing.lockId !== params.lockId && !isExpired) {
        return {
          success: false,
          code: 'LOCK_OWNERSHIP_MISMATCH',
          error: 'Lock token mismatch.',
        };
      }
      this.inMemoryLocks.delete(lockKey);
      released.push(num);
    }

    this.saveLocks();
    this.broadcastUpdate();

    return {
      success: true,
      released,
    };
  }

  /**
   * Resolves an existing Customer Serial Code (`#XXXX`) or allocates a new unique code (`#5316`, `#5317`, ...).
   * - Never uses any ticket number as the customer serial code.
   * - Never merges different customers based only on similar names.
   */
  public resolveOrCreateCustomerCode(params: {
    customerName: string;
    customerPhone: string;
    requestedCustomerId?: string;
    ticketNumbers?: string[];
    bookingCountIncrement?: number;
    performedBy?: string;
    performedByUid?: string;
  }): CustomerRecord {
    const rawName = String(params.customerName || 'Walk-in Customer').trim();
    const rawPhone = String(params.customerPhone || '').trim();
    const normName = rawName.toLowerCase().replace(/\s+/g, ' ');
    const normPhone = rawPhone.replace(/\D/g, '');
    const requestedDigits = String(params.requestedCustomerId || '').replace(/^#/, '').trim();
    const nowIso = new Date().toISOString();

    // 1. Check explicit customerId lookup if provided
    if (/^\d{4,8}$/.test(requestedDigits)) {
      const formatted = `#${requestedDigits}`;
      for (const rec of this.inMemoryCustomers.values()) {
        if (rec.customerId === formatted) {
          if (!normPhone || !rec.normalizedPhone || normPhone === rec.normalizedPhone) {
            const updated: CustomerRecord = {
              ...rec,
              totalBookings: rec.totalBookings + (params.bookingCountIncrement || 1),
              updatedAtIso: nowIso,
            };
            this.inMemoryCustomers.set(rec.customerKey, updated);
            this.saveCustomers();
            return updated;
          }
        }
      }
    }

    // 2. Reliable identity match: requires valid phone (>= 6 digits) + exact normalized name
    const hasReliableKey = normPhone.length >= 6 && normName.length >= 2;
    const customerKey = hasReliableKey
      ? `${normPhone}::${normName}`
      : `single_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (hasReliableKey && this.inMemoryCustomers.has(customerKey)) {
      const existing = this.inMemoryCustomers.get(customerKey)!;
      const updated: CustomerRecord = {
        ...existing,
        totalBookings: existing.totalBookings + (params.bookingCountIncrement || 1),
        updatedAtIso: nowIso,
      };
      this.inMemoryCustomers.set(customerKey, updated);
      this.saveCustomers();
      return updated;
    }

    // 3. Allocate a new unique customer serial code (#5316, #5317, ...)
    const existingCodes = new Set<string>();
    for (const rec of this.inMemoryCustomers.values()) {
      existingCodes.add(rec.customerCodeDigits);
    }
    for (const b of this.inMemoryBookings) {
      if (b.customerId) {
        existingCodes.add(b.customerId.replace(/^#/, ''));
      }
    }

    const ticketSet = new Set((params.ticketNumbers || []).map((t) => this.normalizeTicketNum(t)));
    let candidate = Math.max(this.lastCustomerSerial, CUSTOMER_CODE_BASE);
    let allocatedDigits = '';

    while (!allocatedDigits) {
      candidate += 1;
      const digits = String(candidate).padStart(4, '0');
      if (ticketSet.has(digits) || existingCodes.has(digits)) {
        continue;
      }
      allocatedDigits = digits;
    }

    this.lastCustomerSerial = candidate;
    const newRecord: CustomerRecord = {
      customerId: `#${allocatedDigits}`,
      customerCodeDigits: allocatedDigits,
      customerKey,
      customerName: rawName,
      normalizedName: normName,
      customerPhone: rawPhone,
      normalizedPhone: normPhone,
      totalBookings: params.bookingCountIncrement || 1,
      createdByName: params.performedBy,
      createdByUid: params.performedByUid,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };

    this.inMemoryCustomers.set(customerKey, newRecord);
    this.saveCustomers();
    return newRecord;
  }

  /**
   * Concurrency-safe, idempotent atomic booking transaction.
   * Guarantees no two users can book the same ticket, enforces lock ownership if a lock exists,
   * and permanently assigns or reuses a unique Customer Serial Code (`#XXXX`).
   */
  public bookTicketsTransaction(
    items: SelectedTicketItem[],
    customerName: string,
    customerPhone: string,
    performedBy: string,
    role: LoginType,
    date: string,
    options?: {
      lockedByUid?: string;
      lockId?: string;
      idempotencyKey?: string;
      requireLock?: boolean;
      nowMs?: number;
      bookedByUsername?: string;
      customerId?: string;
      explicitCustomerId?: string;
    }
  ): {
    success: boolean;
    bookedCount: number;
    customerId?: string;
    ticketNumbers?: string[];
    bookings?: TicketBooking[];
    code?: string;
    idempotentReplay?: boolean;
    error?: string;
  } {
    this.reloadFromStorage();
    const now = options?.nowMs ?? Date.now();
    const dateFormatted = date || this.inMemoryConfig.businessDate;

    // 1. Idempotency check
    if (options?.idempotencyKey && this.inMemoryIdempotency.has(options.idempotencyKey)) {
      const prev = this.inMemoryIdempotency.get(options.idempotencyKey);
      return { ...prev, idempotentReplay: true };
    }

    const normItems = items.map((item) => ({
      ...item,
      ticketNumber: this.normalizeTicketNum(item.ticketNumber),
    }));
    const ticketNumbers = normItems.map((i) => i.ticketNumber);

    // 2. Verify lock ownership and expiry if requireLock is set or if any lock exists on these tickets
    for (const item of normItems) {
      const lockKey = this.getLockKey(dateFormatted, item.ticketNumber);
      const lock = this.inMemoryLocks.get(lockKey);

      if (options?.requireLock) {
        if (!lock || lock.status !== 'LOCKED') {
          return {
            success: false,
            bookedCount: 0,
            code: 'LOCK_REQUIRED',
            error: `Active ticket lock is required for ticket #${item.ticketNumber}. Please select the ticket again.`,
          };
        }
        if (options.lockedByUid && lock.lockedByUid !== options.lockedByUid) {
          return {
            success: false,
            bookedCount: 0,
            code: 'LOCK_OWNERSHIP_MISMATCH',
            error: 'This ticket is currently being booked by another user.',
          };
        }
        if (options.lockId && lock.lockId !== options.lockId) {
          return {
            success: false,
            bookedCount: 0,
            code: 'LOCK_OWNERSHIP_MISMATCH',
            error: 'This ticket is currently being booked by another user.',
          };
        }
        if (now > lock.expiresAtMs) {
          this.inMemoryLocks.delete(lockKey);
          this.saveLocks();
          this.broadcastUpdate();
          return {
            success: false,
            bookedCount: 0,
            code: 'LOCK_EXPIRED',
            error: `Your 2-minute lock on ticket #${item.ticketNumber} has expired. Please acquire a new lock before confirming.`,
          };
        }
      } else if (lock && lock.status === 'LOCKED' && lock.expiresAtMs > now) {
        if (options?.lockedByUid && lock.lockedByUid !== options.lockedByUid) {
          return {
            success: false,
            bookedCount: 0,
            code: 'TICKET_LOCKED',
            error: 'This ticket is currently being booked by another user.',
          };
        }
      }
    }

    // 3. Concurrency check: verify NONE of the requested tickets are already booked
    for (const item of normItems) {
      if (this.isTicketBooked(item.ticketNumber, dateFormatted)) {
        // Release caller's locks on failure so ticket is not left locked
        if (options?.lockedByUid) {
          this.releaseTicketLock({
            ticketNumbers,
            drawDate: dateFormatted,
            lockedByUid: options.lockedByUid,
            nowMs: now,
          });
        }
        return {
          success: false,
          bookedCount: 0,
          code: 'ALREADY_BOOKED',
          error: `Ticket #${item.ticketNumber} is already booked for ${dateFormatted}!`,
        };
      }
    }

    // 4. Assign or retrieve permanent Customer Serial Code (#XXXX)
    const customerRecord = this.resolveOrCreateCustomerCode({
      customerName: customerName || 'Sasikaran',
      customerPhone: customerPhone || '9949311900',
      requestedCustomerId: options?.customerId,
      ticketNumbers,
      bookingCountIncrement: normItems.length,
      performedBy,
      performedByUid: options?.lockedByUid,
    });

    const nowStr = new Date(now).toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newBookings: TicketBooking[] = normItems.map((item, index) => {
      const halfPrice = item.half ? this.inMemoryConfig.halfTicketPrice : 0;
      const fullPrice = item.full ? this.inMemoryConfig.fullTicketPrice : 0;
      const total = halfPrice + fullPrice;

      const audit: PaymentAuditEntry = {
        id: `aud-${now}-${index}`,
        timestamp: nowStr,
        action: 'BOOKED',
        amountChanged: total,
        performedBy,
        performedByRole: role,
        notes: `Created booking (${customerRecord.customerId}) for ${customerName}`,
      };

      return {
        id: `b-${now}-${item.ticketNumber}`,
        ticketNumber: item.ticketNumber,
        seriesTitle: this.inMemoryConfig.seriesTitle,
        customerId: customerRecord.customerId,
        customerName: customerName || 'Sasikaran',
        customerPhone: customerPhone || '9949311900',
        ticketType: item.half && item.full ? 'both' : item.half ? 'half' : 'full',
        halfSelected: item.half,
        halfAmount: halfPrice,
        fullSelected: item.full,
        fullAmount: fullPrice,
        totalAmount: total,
        amountPaid: 0,
        remainingBalance: total,
        bookingStatus: 'Booked',
        paymentStatus: 'Unpaid',
        bookedBy: performedBy,
        bookedByUsername: options?.bookedByUsername || performedBy.toLowerCase().replace(/\s+/g, '_'),
        bookedByUid: options?.lockedByUid,
        bookedByRole: role,
        date: dateFormatted,
        bookedAt: nowStr,
        history: [audit],
      };
    });

    // 5. Commit atomically and finalize/delete temporary locks
    this.inMemoryBookings = [...newBookings, ...this.inMemoryBookings];
    for (const num of ticketNumbers) {
      this.inMemoryLocks.delete(this.getLockKey(dateFormatted, num));
    }
    this.saveBookings();
    this.saveLocks();
    this.broadcastUpdate();

    const result = {
      success: true,
      bookedCount: newBookings.length,
      customerId: customerRecord.customerId,
      ticketNumbers,
      bookings: newBookings,
    };

    if (options?.idempotencyKey) {
      this.inMemoryIdempotency.set(options.idempotencyKey, result);
    }

    return result;
  }

  /**
   * Explicit, permission-guarded payment confirmation workflow
   */
  public confirmPaymentTransaction(
    ticketNumber: string,
    date: string,
    paymentAmount: number,
    paymentMethod: string,
    paymentRef: string,
    confirmedBy: string,
    role: LoginType,
    notes?: string
  ): { success: boolean; remainingBalance: number; error?: string } {
    if (role !== 'admin' && role !== 'paid_employee') {
      return {
        success: false,
        remainingBalance: 0,
        error: 'Permission Denied: Only Admin or Paid Employee can confirm payments.',
      };
    }

    const bookingIndex = this.inMemoryBookings.findIndex(
      (b) => b.ticketNumber === ticketNumber && b.date === date && b.bookingStatus === 'Booked'
    );

    if (bookingIndex === -1) {
      return { success: false, remainingBalance: 0, error: 'Booking record not found.' };
    }

    const booking = this.inMemoryBookings[bookingIndex];
    const nowStr = new Date().toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newAmountPaid = booking.amountPaid + paymentAmount;
    const newRemaining = Math.max(0, booking.totalAmount - newAmountPaid);
    const newPaymentStatus = newRemaining === 0 ? 'Paid' : 'Partial';

    const auditEntry: PaymentAuditEntry = {
      id: `pay-aud-${Date.now()}`,
      timestamp: nowStr,
      action: newRemaining === 0 ? 'PAYMENT_RECEIVED' : 'PARTIAL_PAYMENT',
      amountChanged: paymentAmount,
      paymentMethod,
      paymentRef: paymentRef || `MANUAL-${Date.now()}`,
      performedBy: confirmedBy,
      performedByRole: role,
      notes: notes || `Payment recorded by ${confirmedBy}`,
    };

    const updatedBooking: TicketBooking = {
      ...booking,
      amountPaid: newAmountPaid,
      remainingBalance: newRemaining,
      paymentStatus: newPaymentStatus,
      paymentRef: paymentRef || booking.paymentRef || `REC-${Date.now()}`,
      paidBy: booking.customerName,
      paidAt: nowStr,
      history: [auditEntry, ...booking.history],
    };

    this.inMemoryBookings[bookingIndex] = updatedBooking;
    this.saveBookings();
    this.broadcastUpdate();

    return { success: true, remainingBalance: newRemaining };
  }

  /**
   * Cancellation with audit trail
   */
  public cancelBookingTransaction(
    ticketNumber: string,
    date: string,
    performedBy: string,
    role: LoginType,
    reason: string
  ): { success: boolean; error?: string } {
    const bookingIndex = this.inMemoryBookings.findIndex(
      (b) => b.ticketNumber === ticketNumber && b.date === date && b.bookingStatus === 'Booked'
    );

    if (bookingIndex === -1) {
      return { success: false, error: 'Booking record not found.' };
    }

    const booking = this.inMemoryBookings[bookingIndex];

    if (booking.paymentStatus === 'Paid' && role !== 'admin') {
      return {
        success: false,
        error: 'Permission Denied: Confirmed Paid tickets can only be reversed by Admin.',
      };
    }

    const nowStr = new Date().toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const audit: PaymentAuditEntry = {
      id: `canc-aud-${Date.now()}`,
      timestamp: nowStr,
      action: 'CANCELLED',
      amountChanged: -booking.totalAmount,
      performedBy,
      performedByRole: role,
      notes: reason || 'Booking cancelled',
    };

    const updatedBooking: TicketBooking = {
      ...booking,
      bookingStatus: 'Cancelled',
      history: [audit, ...booking.history],
    };

    this.inMemoryBookings[bookingIndex] = updatedBooking;
    this.inMemoryLocks.delete(this.getLockKey(date, ticketNumber));
    this.saveBookings();
    this.saveLocks();
    this.broadcastUpdate();

    return { success: true };
  }

  // Today Winner
  public getWinners(date?: string): TodayWinnerRecord[] {
    return date ? this.inMemoryWinners.filter((w) => w.drawDate === date) : [...this.inMemoryWinners];
  }

  public addWinnerRecord(
    record: Omit<TodayWinnerRecord, 'id' | 'enteredAt'>,
    role: LoginType
  ): { success: boolean; error?: string } {
    if (role !== 'admin') {
      return { success: false, error: 'Permission Denied: Only Admin can enter official winners.' };
    }

    const newRecord: TodayWinnerRecord = {
      ...record,
      id: `win-${Date.now()}`,
      enteredAt: new Date().toLocaleString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    this.inMemoryWinners = [newRecord, ...this.inMemoryWinners];
    this.saveWinners();
    this.broadcastUpdate();
    return { success: true };
  }

  // Result Papers
  public getResultPapers(date?: string): ResultPaperDocument[] {
    return date ? this.inMemoryPapers.filter((p) => p.drawDate === date) : [...this.inMemoryPapers];
  }

  public addResultPaper(
    paper: Omit<ResultPaperDocument, 'id' | 'uploadedAt'>,
    role: LoginType
  ): { success: boolean; error?: string } {
    if (role !== 'admin') {
      return { success: false, error: 'Permission Denied: Only Admin can upload result papers.' };
    }

    const newPaper: ResultPaperDocument = {
      ...paper,
      id: `paper-${Date.now()}`,
      uploadedAt: new Date().toLocaleString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    this.inMemoryPapers = [newPaper, ...this.inMemoryPapers];
    this.savePapers();
    this.broadcastUpdate();
    return { success: true };
  }


  public getInventory(drawDate?: string, seriesId?: string, role?: LoginType): TicketInventoryItem[] {
    const d = drawDate || this.inMemoryConfig.businessDate;
    const items = Array.from(this.inMemoryInventory.values()).filter((inv) => {
      if (inv.drawDate !== d) return false;
      if (seriesId && inv.seriesId !== seriesId) return false;
      if (role !== 'admin' && inv.status !== 'PUBLISHED') return false;
      return true;
    });
    return items.sort((a, b) => a.ticketNumber.localeCompare(b.ticketNumber, undefined, { numeric: true }));
  }

  public addTicketInventory(
    tickets: string[],
    drawDate: string,
    seriesId: string,
    seriesTitle: string,
    status: 'PUBLISHED' | 'UNPUBLISHED',
    operator: { id: string; name: string; role: LoginType }
  ): { success: boolean; added: TicketInventoryItem[]; skipped: any[]; error?: string } {
    if (operator.role !== 'admin') {
      return { success: false, added: [], skipped: [], error: 'Only Admins can publish ticket inventory.' };
    }
    const d = drawDate || this.inMemoryConfig.businessDate;
    const sId = seriesId || 'col-1';
    const nowIso = new Date().toISOString();
    const added: TicketInventoryItem[] = [];
    const skipped: any[] = [];
    const seen = new Set<string>();

    for (const rawNum of tickets) {
      const num = this.normalizeTicketNum(rawNum);
      if (!num || seen.has(num)) continue;
      seen.add(num);

      if (this.isTicketBooked(num, d)) {
        skipped.push({ ticketNumber: num, reason: 'ALREADY_BOOKED' });
        continue;
      }

      const invKey = `${d}_${sId}_${num}`;
      const existing = this.inMemoryInventory.get(invKey);
      if (existing && existing.bookingStatus === 'Booked') {
        skipped.push({ ticketNumber: num, reason: 'ALREADY_BOOKED' });
        continue;
      }

      const item: TicketInventoryItem = {
        id: invKey,
        ticketNumber: num,
        drawDate: d,
        drawKey: d.replace(/\s+/g, ''),
        seriesId: sId,
        seriesTitle: seriesTitle || 'CARROM GOLD',
        status: status || 'PUBLISHED',
        bookingStatus: existing?.bookingStatus || 'Available',
        createdAtIso: existing?.createdAtIso || nowIso,
        publishedAtIso: status === 'PUBLISHED' ? nowIso : undefined,
        createdByUid: operator.id,
        createdByName: operator.name,
      };

      this.inMemoryInventory.set(invKey, item);
      added.push(item);
    }

    this.saveInventory();
    this.broadcastUpdate();
    return { success: true, added, skipped };
  }

  public unpublishTicketInventory(
    ticketNumber: string,
    drawDate: string,
    seriesId: string,
    operator: { id: string; name: string; role: LoginType }
  ): { success: boolean; error?: string } {
    if (operator.role !== 'admin') {
      return { success: false, error: 'Only Admins can unpublish tickets.' };
    }
    const d = drawDate || this.inMemoryConfig.businessDate;
    const sId = seriesId || 'col-1';
    const num = this.normalizeTicketNum(ticketNumber);
    const invKey = `${d}_${sId}_${num}`;
    const existing = this.inMemoryInventory.get(invKey);
    if (!existing) {
      return { success: false, error: 'Ticket not found in inventory.' };
    }
    if (existing.bookingStatus === 'Booked') {
      return { success: false, error: `Cannot unpublish ticket #${num} because it is already booked.` };
    }
    existing.status = 'UNPUBLISHED';
    existing.publishedAtIso = undefined;
    this.saveInventory();
    this.broadcastUpdate();
    return { success: true };
  }

  public getGridAppearance(): GridAppearanceConfig {
    return { ...this.inMemoryAppearance };
  }

  public updateGridAppearance(
    config: Partial<GridAppearanceConfig>,
    operatorRole: LoginType
  ): { success: boolean; config: GridAppearanceConfig; error?: string } {
    if (operatorRole !== 'admin') {
      return { success: false, config: this.inMemoryAppearance, error: 'Only Admins can customize ticket appearance.' };
    }
    this.inMemoryAppearance = {
      ...this.inMemoryAppearance,
      ...config,
      updatedAtIso: new Date().toISOString(),
    };
    this.saveAppearance();
    this.broadcastUpdate();
    return { success: true, config: this.inMemoryAppearance };
  }

  public confirmPendingBooking(
    bookingId: string,
    operator: { id: string; name: string; role: LoginType }
  ): { success: boolean; booking?: TicketBooking; error?: string } {
    if (operator.role !== 'admin' && operator.role !== 'paid_employee') {
      return { success: false, error: 'Only Paid Employees or Admins can confirm pending bookings.' };
    }
    const booking = this.inMemoryBookings.find((b) => b.id === bookingId);
    if (!booking) {
      return { success: false, error: 'Booking request not found.' };
    }
    if (booking.bookingStatus === 'Booked') {
      return { success: false, error: 'Booking is already confirmed.' };
    }
    if (booking.bookingStatus === 'Cancelled') {
      return { success: false, error: 'Cannot confirm a cancelled booking.' };
    }

    booking.bookingStatus = 'Booked';
    booking.history.push({
      id: `aud-conf-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'BOOKED',
      amountChanged: 0,
      performedBy: operator.name,
      performedByRole: operator.role,
      notes: `Booking confirmed by Paid Employee (${operator.name})`,
    });

    for (const inv of this.inMemoryInventory.values()) {
      if (inv.ticketNumber === booking.ticketNumber && inv.drawDate === booking.date) {
        inv.bookingStatus = 'Booked';
        inv.bookedTicketId = booking.id;
      }
    }

    this.saveBookings();
    this.saveInventory();
    this.broadcastUpdate();
    return { success: true, booking };
  }

  private saveInventory() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(
          STORAGE_KEYS.INVENTORY,
          JSON.stringify(Array.from(this.inMemoryInventory.values()))
        );
      }
    } catch (e) {}
  }

  private saveAppearance() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(
          STORAGE_KEYS.APPEARANCE,
          JSON.stringify(this.inMemoryAppearance)
        );
      }
    } catch (e) {}
  }

  public resetAllToSeed() {
    this.inMemoryCustomers.clear();
    this.inMemoryLocks.clear();
    this.inMemoryIdempotency.clear();
    this.lastCustomerSerial = CUSTOMER_CODE_BASE;
    const seed = this.ensureLegacyCustomerIds(createInitialSeedBookings());
    this.inMemoryBookings = seed;
    this.inMemoryConfig = DEFAULT_CONFIG;
    this.inMemoryWinners = INITIAL_WINNERS;
    this.inMemoryPapers = INITIAL_PAPERS;
    this.saveBookings();
    this.saveCustomers();
    this.saveLocks();
    this.saveConfig();
    this.saveWinners();
    this.savePapers();
    this.broadcastUpdate();
  }
}

export const lotteryService = new LotteryDatabaseService();
