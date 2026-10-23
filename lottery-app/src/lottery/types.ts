export type LoginType = 'admin' | 'employee' | 'paid_employee';

export interface EmployeeProfile {
  id: string;
  name: string;
  phone: string;
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
  bookingStatus: 'Booked' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  paymentRef?: string;
  paidBy?: string;
  bookedBy: string;
  bookedByRole: LoginType;
  date: string;                // Business date (e.g. "02 Oct 2026")
  bookedAt: string;
  paidAt?: string;
  history: PaymentAuditEntry[];
}

export interface SelectedTicketItem {
  ticketNumber: string;
  half: boolean;
  full: boolean;
}

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
