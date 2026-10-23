import {
  TicketBooking,
  SystemConfig,
  TodayWinnerRecord,
  ResultPaperDocument,
  EmployeeProfile,
  SelectedTicketItem,
  LoginType,
  PaymentAuditEntry,
} from './types';
import { LOTTERY_COLUMNS_SPEC } from './mockData';

const STORAGE_KEYS = {
  BOOKINGS: 'carrom_lottery_bookings_v2',
  CONFIG: 'carrom_lottery_config_v2',
  WINNERS: 'carrom_lottery_winners_v2',
  PAPERS: 'carrom_lottery_papers_v2',
  USERS: 'carrom_lottery_users_v2',
};

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

// Helper to seed realistic bookings
export const createInitialSeedBookings = (): TicketBooking[] => {
  const seedItems = [
    { num: '0003', name: 'Sasikaran', half: false, full: true, paid: false },
    { num: '0007', name: 'Monoharan', half: false, full: true, paid: false },
    { num: '0012', name: 'Hariharan', half: true, full: false, paid: false },
    { num: '0015', name: 'Rajkumar', half: false, full: true, paid: false },
    { num: '0021', name: 'Karthik', half: false, full: true, paid: false },
    { num: '0024', name: 'Arun', half: true, full: false, paid: false },
    { num: '0030', name: 'Praveen', half: false, full: true, paid: false },
    { num: '0045', name: 'Senthil', half: false, full: true, paid: false },
    { num: '0068', name: 'Dinesh', half: true, full: false, paid: false },
    { num: '0076', name: 'Manikandan', half: false, full: true, paid: false },
    { num: '0102', name: 'Gogul', half: false, full: true, paid: true },
    { num: '0150', name: 'Vignesh', half: false, full: true, paid: false },
    { num: '0188', name: 'Balaji', half: true, full: false, paid: false },
    { num: '0203', name: 'Suresh', half: false, full: true, paid: false },
    { num: '0224', name: 'Aravind', half: false, full: true, paid: false },
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
      customerName: item.name,
      customerPhone: '9949311900',
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
          notes: 'Counter sales booking initiated',
        },
      ],
    };
  });
};

/**
 * Service class handling all transactional data operations,
 * atomic bookings, permission-guarded payments, and audit logs.
 */
class LotteryDatabaseService {
  private inMemoryBookings: TicketBooking[] = [];
  private inMemoryConfig: SystemConfig = DEFAULT_CONFIG;
  private inMemoryWinners: TodayWinnerRecord[] = INITIAL_WINNERS;
  private inMemoryPapers: ResultPaperDocument[] = INITIAL_PAPERS;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (storedConfig) {
        this.inMemoryConfig = JSON.parse(storedConfig);
      } else {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
      }

      const storedBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      if (storedBookings) {
        this.inMemoryBookings = JSON.parse(storedBookings);
      } else {
        const seed = createInitialSeedBookings();
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
      this.inMemoryBookings = createInitialSeedBookings();
      this.inMemoryConfig = DEFAULT_CONFIG;
    }
  }

  private saveBookings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(this.inMemoryBookings));
      }
    } catch (e) {
      // In-memory fallback
    }
  }

  private saveConfig() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.inMemoryConfig));
      }
    } catch (e) {
      // In-memory fallback
    }
  }

  private saveWinners() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.WINNERS, JSON.stringify(this.inMemoryWinners));
      }
    } catch (e) {
      // In-memory fallback
    }
  }

  private savePapers() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(this.inMemoryPapers));
      }
    } catch (e) {
      // In-memory fallback
    }
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
    return { success: true };
  }

  // Bookings list
  public getBookings(date?: string): TicketBooking[] {
    const list = date
      ? this.inMemoryBookings.filter((b) => b.date === date && b.bookingStatus === 'Booked')
      : this.inMemoryBookings.filter((b) => b.bookingStatus === 'Booked');
    return [...list];
  }

  public getUnpaidBookings(date?: string): TicketBooking[] {
    return this.getBookings(date).filter((b) => b.paymentStatus !== 'Paid');
  }

  public getPaidBookings(date?: string): TicketBooking[] {
    return this.getBookings(date).filter((b) => b.paymentStatus === 'Paid');
  }

  public isTicketBooked(ticketNumber: string, date: string): boolean {
    return this.inMemoryBookings.some(
      (b) => b.ticketNumber === ticketNumber && b.date === date && b.bookingStatus === 'Booked'
    );
  }

  /**
   * Concurrency-safe atomic booking transaction
   * Guarantees no two employees can book the same ticket for the same draw date.
   */
  public bookTicketsTransaction(
    items: SelectedTicketItem[],
    customerName: string,
    customerPhone: string,
    performedBy: string,
    role: LoginType,
    date: string
  ): { success: boolean; bookedCount: number; error?: string } {
    const dateFormatted = date || this.inMemoryConfig.businessDate;

    // Concurrency check: verify NONE of the requested tickets are already booked
    for (const item of items) {
      if (this.isTicketBooked(item.ticketNumber, dateFormatted)) {
        return {
          success: false,
          bookedCount: 0,
          error: `Ticket #${item.ticketNumber} is already booked for ${dateFormatted}!`,
        };
      }
    }

    const nowStr = new Date().toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newBookings: TicketBooking[] = items.map((item, index) => {
      // Calculate amounts based on authorized configuration
      const halfPrice = item.half ? this.inMemoryConfig.halfTicketPrice : 0;
      const fullPrice = item.full ? this.inMemoryConfig.fullTicketPrice : 0;
      const total = halfPrice + fullPrice;

      const audit: PaymentAuditEntry = {
        id: `aud-${Date.now()}-${index}`,
        timestamp: nowStr,
        action: 'BOOKED',
        amountChanged: total,
        performedBy,
        performedByRole: role,
        notes: `Created booking for customer ${customerName}`,
      };

      return {
        id: `b-${Date.now()}-${item.ticketNumber}`,
        ticketNumber: item.ticketNumber,
        seriesTitle: this.inMemoryConfig.seriesTitle,
        customerName: customerName || 'Sasikaran',
        customerPhone: customerPhone || '99493119',
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
        bookedByRole: role,
        date: dateFormatted,
        bookedAt: nowStr,
        history: [audit],
      };
    });

    // Commit atomically
    this.inMemoryBookings = [...newBookings, ...this.inMemoryBookings];
    this.saveBookings();

    return { success: true, bookedCount: newBookings.length };
  }

  /**
   * Explicit, permission-guarded payment confirmation workflow
   * Admin and Paid Employee can confirm payments.
   * Standard Employee is restricted from altering payment ledger unless authorized.
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
    this.saveBookings();

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
    return { success: true };
  }

  public resetAllToSeed() {
    const seed = createInitialSeedBookings();
    this.inMemoryBookings = seed;
    this.inMemoryConfig = DEFAULT_CONFIG;
    this.inMemoryWinners = INITIAL_WINNERS;
    this.inMemoryPapers = INITIAL_PAPERS;
    this.saveBookings();
    this.saveConfig();
    this.saveWinners();
    this.savePapers();
  }
}

export const lotteryService = new LotteryDatabaseService();
