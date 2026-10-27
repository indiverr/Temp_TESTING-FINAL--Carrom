export type LoginType = 'admin' | 'employee' | 'paid_employee';

export const formatRoleLabel = (role: LoginType): string => {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'paid_employee':
      return 'Paid Employee';
    case 'employee':
    default:
      return 'Employee';
  }
};

export interface EmployeeProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  otpVerified?: boolean;
  role: LoginType;
}

export interface LotterySeriesColumn {
  id: string;
  startRange: number;
  endRange: number;
  rangeLabel: string; // e.g. "0075 - 0099"
  headerBg: string;   // e.g. "#00D028"
  textColor: string;  // e.g. "#008A1B"
}

export type TicketType = 'half' | 'full' | 'both';

export interface PaymentAuditEntry {
  id: string;
  timestamp: string;
  action: 'BOOKED' | 'PAYMENT_RECEIVED' | 'PARTIAL_PAYMENT' | 'ADJUSTMENT' | 'CANCELLED';
  amountChanged: number;
  paymentMethod?: string;
  paymentRef?: string;
  performedBy: string;
  performedByRole: LoginType;
  notes?: string;
}

export interface TicketBooking {
  id: string;                  // Stable UUID / Firestore doc ID
  ticketNumber: string;        // e.g. "0012", "0102"
  seriesTitle?: string;        // Configurable series name (e.g. "CARROM GOLD", "CUSTOM NAME")
  customerId?: string;         // Permanent unique customer serial code (e.g. "#5316")
  customerName: string;
  customerPhone: string;
  ticketType: TicketType;      // 'half' | 'full' | 'both'
  halfSelected: boolean;
  halfAmount: number;          // Default ₹25
  fullSelected: boolean;
  fullAmount: number;          // Default ₹50
  totalAmount: number;         // Calculated based on half/full
  amountPaid: number;          // Sum of verified payments
  remainingBalance: number;    // totalAmount - amountPaid
  bookingStatus: 'Pending Confirmation' | 'Booked' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  paymentRef?: string;
  paidBy?: string;
  bookedBy: string;
  bookedByUsername?: string;
  bookedByUid?: string;
  bookedByRole: LoginType;
  date: string;                // Business date (e.g. "02 Oct 2026")
  bookedAt: string;
  paidAt?: string;
  history: PaymentAuditEntry[];
}

export interface TicketLock {
  id?: string;
  lockId: string;
  ticketNumber: string;
  drawDate: string;
  seriesId?: string;
  status: 'LOCKED' | 'RELEASED' | 'CONFIRMED';
  lockedByUid: string;
  lockedByName: string;
  lockedByUsername?: string;
  lockedByRole?: LoginType;
  lockedAt?: string;
  lockedAtMs?: number;
  expiresAtMs: number;
  updatedAtIso?: string;
}

export interface CustomerRecord {
  customerId: string;          // e.g. "#5316"
  customerCodeDigits: string;  // e.g. "5316"
  customerKey: string;
  customerName: string;
  normalizedName: string;
  customerPhone: string;
  normalizedPhone: string;
  totalBookings: number;
  createdByUid?: string;
  createdByName?: string;
  createdByUsername?: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface BookingConfirmationSummary {
  ticketNumbers: string[];
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalAmount?: number;
  bookedCount?: number;
  drawDate?: string;
  bookingTime?: string;
  bookedAt?: string;
}

export interface SelectedTicketItem {
  ticketNumber: string;
  half: boolean;
  full: boolean;
}

export const TICKET_LOCK_DURATION_MS = 120 * 1000; // 120 seconds
export const TICKET_LOCK_RENEW_INTERVAL_MS = 5 * 1000; // 5 seconds

export interface TicketInventoryItem {
  id: string; // e.g. `${drawKey}_${seriesId}_${ticketNumber}`
  ticketNumber: string;
  drawDate: string;
  drawKey: string;
  seriesId: string;
  seriesTitle?: string;
  status: 'PUBLISHED' | 'UNPUBLISHED';
  bookingStatus?: 'Available' | 'Pending Confirmation' | 'Booked';
  bookedTicketId?: string;
  createdAtIso: string;
  publishedAtIso?: string;
  createdByUid: string;
  createdByName?: string;
}

export interface GridAppearanceConfig {
  availableBg: string; // default: '#ffffff'
  lockedBg: string; // default: 'rgba(148, 163, 184, 0.45)'
  textColor: string; // default: '#0f172a'
  borderColor: string; // default: '#cbd5e1'
  updatedAtIso?: string;
  updatedByUid?: string;
}

export const DEFAULT_GRID_APPEARANCE: GridAppearanceConfig = {
  availableBg: '#ffffff',
  lockedBg: 'rgba(148, 163, 184, 0.45)',
  textColor: '#0f172a',
  borderColor: '#cbd5e1',
};

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface DayTicketPreset {
  dayName: DayOfWeek;
  enabled: boolean;
  mode: 'range' | 'list' | 'single';
  rangeStart: string;
  rangeEnd: string;
  ticketList: string;
  singleTicket: string;
  tickets: string[];
}

export interface WeeklyTicketPresetsConfig {
  days: Record<DayOfWeek, DayTicketPreset>;
  lastPublishedWeekStart?: string;
  updatedAtIso?: string;
  updatedByUid?: string;
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const DEFAULT_WEEKLY_PRESETS: WeeklyTicketPresetsConfig = {
  days: {
    Monday: {
      dayName: 'Monday',
      enabled: true,
      mode: 'range',
      rangeStart: '0000',
      rangeEnd: '0099',
      ticketList: '',
      singleTicket: '',
      tickets: [],
    },
    Tuesday: {
      dayName: 'Tuesday',
      enabled: true,
      mode: 'range',
      rangeStart: '0000',
      rangeEnd: '0099',
      ticketList: '',
      singleTicket: '',
      tickets: [],
    },
    Wednesday: {
      dayName: 'Wednesday',
      enabled: true,
      mode: 'range',
      rangeStart: '0000',
      rangeEnd: '0099',
      ticketList: '',
      singleTicket: '',
      tickets: [],
    },
    Thursday: {
      dayName: 'Thursday',
      enabled: true,
      mode: 'range',
      rangeStart: '0000',
      rangeEnd: '0099',
      ticketList: '',
      singleTicket: '',
      tickets: [],
    },
    Friday: {
      dayName: 'Friday',
      enabled: true,
      mode: 'range',
      rangeStart: '0000',
      rangeEnd: '0099',
      ticketList: '',
      singleTicket: '',
      tickets: [],
    },
    Saturday: {
      dayName: 'Saturday',
      enabled: true,
      mode: 'range',
      rangeStart: '0000',
      rangeEnd: '0199',
      ticketList: '',
      singleTicket: '',
      tickets: [],
    },
    Sunday: {
      dayName: 'Sunday',
      enabled: true,
      mode: 'range',
      rangeStart: '0000',
      rangeEnd: '0249',
      ticketList: '',
      singleTicket: '',
      tickets: [],
    },
  },
};

export interface TodayWinnerRecord {
  id: string;
  drawDate: string;
  seriesTitle: string;
  winningNumber: string;
  prizeCategory: string;
  prizeAmount: number;
  verifiedBy: string;
  enteredAt: string;
  status: 'Official' | 'Draft';
  notes?: string;
}

export interface ResultPaperDocument {
  id: string;
  drawDate: string;
  seriesTitle: string;
  title: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSizeKb: number;
  verifiedOfficial: boolean;
}

export interface SystemConfig {
  seriesTitle: string;
  businessDate: string;
  halfTicketPrice: number;
  fullTicketPrice: number;
  gpayNumber: string;
  gpayName: string;
  upiId: string;
  qrCodeUrl: string;
}
