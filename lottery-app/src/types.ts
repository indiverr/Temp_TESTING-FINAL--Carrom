export type UserRole = 'admin' | 'employee';

export interface EmployeeInfo {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
}

export interface LotterySeriesGroup {
  id: string;
  startRange: number;
  endRange: number;
  rangeLabel: string; // e.g. "0075 - 0099"
  headerBg: string;   // hex or tailwind class
  textColor: string;  // color for numbers in table
  categoryName?: string;
}

export interface TicketItem {
  id: string;
  number: string;      // e.g. "0005" or "0075"
  seriesGroupId: string;
  price: number;
  status: 'available' | 'booked' | 'blocked';
  bookedByEmployeeId?: string;
  bookedByEmployeeName?: string;
  customerName?: string;
  customerPhone?: string;
  bookedAt?: string;
  date: string;        // "02 Oct 2026"
}

export interface LotteryDraw {
  id: string;
  name: string;
  date: string;        // "02 Oct 2026"
  status: 'open' | 'closed' | 'result_declared';
  winningNumber?: string;
  totalTickets: number;
  ticketPrice: number;
}

export interface WorkReport {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  ticketsSold: number;
  totalAmount: number;
  commission: number;
}
