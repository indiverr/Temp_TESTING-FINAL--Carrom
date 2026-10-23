import { LotterySeriesGroup, TicketItem, EmployeeInfo } from './types';

export const INITIAL_EMPLOYEES: EmployeeInfo[] = [
  { id: 'EMP001', name: 'Sasikaran', phone: '9876543210', role: 'employee' },
  { id: 'EMP002', name: 'Vinoth Kumar', phone: '9845123456', role: 'employee' },
  { id: 'EMP003', name: 'Karthik Raja', phone: '9765432109', role: 'employee' },
  { id: 'ADM001', name: 'Super Admin', phone: '9999999999', role: 'admin' },
];

// Replicating the 12 columns exact matrix from Screenshot 4
export const LOTTERY_COLUMNS_SPEC: LotterySeriesGroup[] = [
  { id: 'col-1', startRange: 75, endRange: 99, rangeLabel: '0075 - 0099', headerBg: '#00D028', textColor: '#008A1B' },
  { id: 'col-2', startRange: 300, endRange: 324, rangeLabel: '0300 - 0324', headerBg: '#FF0000', textColor: '#DC2626' },
  { id: 'col-3', startRange: 725, endRange: 749, rangeLabel: '0725 - 0749', headerBg: '#0052FF', textColor: '#0052FF' },
  { id: 'col-4', startRange: 900, endRange: 924, rangeLabel: '0900 - 0924', headerBg: '#000000', textColor: '#111827' },
  { id: 'col-5', startRange: 1675, endRange: 1699, rangeLabel: '1675 - 1699', headerBg: '#FFE600', textColor: '#CA8A04' },
  { id: 'col-6', startRange: 2400, endRange: 2424, rangeLabel: '2400 - 2424', headerBg: '#FF1493', textColor: '#DB2777' },
  { id: 'col-7', startRange: 5075, endRange: 5099, rangeLabel: '5075 - 5099', headerBg: '#FF6600', textColor: '#EA580C' },
  { id: 'col-8', startRange: 5700, endRange: 5724, rangeLabel: '5700 - 5724', headerBg: '#8B4513', textColor: '#78350F' },
  { id: 'col-9', startRange: 5775, endRange: 5799, rangeLabel: '5775 - 5799', headerBg: '#6B17A8', textColor: '#7E22CE' },
  { id: 'col-10', startRange: 7200, endRange: 7224, rangeLabel: '7200 - 7224', headerBg: '#FFDD00', textColor: '#A16207' },
  { id: 'col-11', startRange: 7300, endRange: 7324, rangeLabel: '7300 - 7324', headerBg: '#B0B0B0', textColor: '#4B5563' },
  { id: 'col-12', startRange: 9425, endRange: 9449, rangeLabel: '9425 - 9449', headerBg: '#FFEE00', textColor: '#CA8A04' },
  { id: 'col-13', startRange: 9900, endRange: 9924, rangeLabel: '9900 - 9924', headerBg: '#00E500', textColor: '#16A34A' },
];

export const INITIAL_DATE = '02 Oct 2026';

// Helper to generate seed tickets for the matrix and the quick grid
export const generateInitialTickets = (): Record<string, TicketItem> => {
  const tickets: Record<string, TicketItem> = {};

  // 1. First 25 quick numbers (from screenshot 5: 0000 to 0024)
  for (let i = 0; i < 25; i++) {
    const numStr = i.toString().padStart(4, '0');
    tickets[numStr] = {
      id: `tick-${numStr}`,
      number: numStr,
      seriesGroupId: 'quick-grid',
      price: 50,
      status: i === 7 || i === 18 ? 'booked' : 'available',
      bookedByEmployeeId: i === 7 ? 'EMP001' : undefined,
      bookedByEmployeeName: i === 7 ? 'Sasikaran' : undefined,
      customerName: i === 7 ? 'Ramanathan' : undefined,
      customerPhone: i === 7 ? '9443312345' : undefined,
      bookedAt: i === 7 ? '02 Oct 2026 10:14 AM' : undefined,
      date: INITIAL_DATE
    };
  }

  // 2. Numbers from the colored matrix chart (screenshot 4)
  LOTTERY_COLUMNS_SPEC.forEach(col => {
    for (let num = col.startRange; num <= col.endRange; num++) {
      const numStr = num.toString().padStart(4, '0');
      if (!tickets[numStr]) {
        // pre-book a couple for realistic interaction
        const isPreBooked = num === 77 || num === 305 || num === 912 || num === 5080;
        tickets[numStr] = {
          id: `tick-${numStr}`,
          number: numStr,
          seriesGroupId: col.id,
          price: 50,
          status: isPreBooked ? 'booked' : 'available',
          bookedByEmployeeId: isPreBooked ? 'EMP001' : undefined,
          bookedByEmployeeName: isPreBooked ? 'Sasikaran' : undefined,
          customerName: isPreBooked ? 'K. Murugan' : undefined,
          customerPhone: isPreBooked ? '9894012345' : undefined,
          bookedAt: isPreBooked ? '02 Oct 2026 09:30 AM' : undefined,
          date: INITIAL_DATE
        };
      }
    }
  });

  return tickets;
};
