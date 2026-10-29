import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Users,
  Download,
  RotateCw,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Ticket,
} from 'lucide-react';
import { PaymentQueueTask, LoginType, TicketBooking } from '../types';
import { lotteryService } from '../lotteryService';

interface PaymentQueueScreenProps {
  tasks: PaymentQueueTask[];
  drawDate: string;
  allBookings?: TicketBooking[];
  currentRole: LoginType;
  currentStaffName: string;
  employeeLabelMap?: Record<string, string>;
  onCompleteTask?: (
    taskId: string,
    bookingId: string,
    amountPaid: number,
    paymentMethod: string,
    paymentRef: string
  ) => Promise<{ success: boolean; error?: string }>;
  onRefresh?: () => void;
  onBack?: () => void;
}

interface CustomerReportRow {
  employeeId: string;
  employeeName: string;
  customerName: string;
  customerPhone: string;
  ticketNumbers: string[];
  ticketCount: number;
  halfSetCount: number;
  fullSetCount: number;
}

export const PaymentQueueScreen: React.FC<PaymentQueueScreenProps> = ({
  tasks,
  drawDate,
  allBookings = [],
  currentRole,
  currentStaffName,
  employeeLabelMap = {},
  onRefresh,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Discover all registered employee labels L1, L2, L3...
  const allEmployees = useMemo(() => {
    const list = lotteryService.getAllEmployees('admin');
    const labelsMap: Record<string, string> = { ...employeeLabelMap };

    list.forEach((e) => {
      if (e.label && !labelsMap[e.label]) {
        labelsMap[e.label] = e.name;
      }
    });

    // Also extract from allBookings
    allBookings.forEach((b) => {
      if (b.employeeLabel && !labelsMap[b.employeeLabel]) {
        labelsMap[b.employeeLabel] = b.bookedBy || 'Employee';
      }
    });

    const entries = Object.keys(labelsMap).map((lbl) => ({
      label: lbl,
      name: labelsMap[lbl],
    }));

    // Ensure at least L1 exists
    if (entries.length === 0) {
      entries.push({ label: 'L1', name: currentStaffName || 'Staff' });
    }

    entries.sort((a, b) => {
      const numA = parseInt(a.label.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.label.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    return entries;
  }, [employeeLabelMap, allBookings, currentStaffName]);

  const [selectedEmployeeLabel, setSelectedEmployeeLabel] = useState<string>(
    () => allEmployees[0]?.label || 'L1'
  );

  // Filter confirmed & paid bookings for the draw date
  const relevantBookings = useMemo(() => {
    return allBookings.filter((b) => {
      // Must be paid or booked
      const isPaidOrBooked =
        b.bookingStatus === 'Booked' ||
        b.bookingStatus === 'Pending Confirmation' ||
        b.paymentStatus === 'Paid';
      if (!isPaidOrBooked) return false;

      // Filter by draw date if present
      if (drawDate && b.date && b.date !== drawDate) {
        return false;
      }
      return true;
    });
  }, [allBookings, drawDate]);

  // Aggregate bookings per employee
  const employeeStatsMap = useMemo(() => {
    const map: Record<string, number> = {};
    allEmployees.forEach((e) => {
      map[e.label] = 0;
    });

    relevantBookings.forEach((b) => {
      const lbl = b.employeeLabel || 'L1';
      map[lbl] = (map[lbl] || 0) + 1;
    });
    return map;
  }, [allEmployees, relevantBookings]);

  // Build grouped customer rows under the selected employee
  const selectedEmployeeRows = useMemo(() => {
    const bookingsForEmp = relevantBookings.filter(
      (b) => (b.employeeLabel || 'L1') === selectedEmployeeLabel
    );

    const customerMap = new Map<string, CustomerReportRow>();
    const empName =
      employeeLabelMap[selectedEmployeeLabel] ||
      allEmployees.find((e) => e.label === selectedEmployeeLabel)?.name ||
      'Employee';

    bookingsForEmp.forEach((b) => {
      const key = (b.customerPhone || b.customerName || b.id || 'walk-in').trim().toLowerCase();
      const existing = customerMap.get(key);

      const ticketNum = '#' + String(b.ticketNumber || '0000').padStart(4, '0');
      const isHalf = b.ticketType === 'half' || b.ticketType === 'both';
      const isFull = b.ticketType === 'full' || b.ticketType === 'both';

      if (!existing) {
        customerMap.set(key, {
          employeeId: selectedEmployeeLabel,
          employeeName: empName,
          customerName: b.customerName || 'Walk-in Customer',
          customerPhone: b.customerPhone || '—',
          ticketNumbers: [ticketNum],
          ticketCount: 1,
          halfSetCount: isHalf ? 1 : 0,
          fullSetCount: isFull ? 1 : 0,
        });
      } else {
        if (!existing.ticketNumbers.includes(ticketNum)) {
          existing.ticketNumbers.push(ticketNum);
        }
        existing.ticketCount += 1;
        if (isHalf) existing.halfSetCount += 1;
        if (isFull) existing.fullSetCount += 1;
      }
    });

    let list = Array.from(customerMap.values());

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((r) => {
        const nameMatch = r.customerName.toLowerCase().includes(q);
        const phoneMatch = r.customerPhone.toLowerCase().includes(q);
        const ticketMatch = r.ticketNumbers.some((t) => t.toLowerCase().includes(q));
        return nameMatch || phoneMatch || ticketMatch;
      });
    }

    return list;
  }, [relevantBookings, selectedEmployeeLabel, employeeLabelMap, allEmployees, searchQuery]);

  // Overall totals for selected employee
  const summaryTotals = useMemo(() => {
    let tickets = 0;
    let halfs = 0;
    let fulls = 0;
    selectedEmployeeRows.forEach((r) => {
      tickets += r.ticketCount;
      halfs += r.halfSetCount;
      fulls += r.fullSetCount;
    });
    return {
      customers: selectedEmployeeRows.length,
      tickets,
      halfs,
      fulls,
    };
  }, [selectedEmployeeRows]);

  // Export CSV for this employee report
  const handleExportCsv = () => {
    if (selectedEmployeeRows.length === 0) return;
    setIsExportingCsv(true);
    try {
      const headers = [
        'Employee ID',
        'Customer Name',
        'Booked Ticket Numbers',
        'Number of Tickets',
        'Number of Half Set',
        'Number of Full Set',
        'Phone Number',
      ];

      const rows = selectedEmployeeRows.map((r) => [
        `"${r.employeeId}"`,
        `"${r.customerName.replace(/"/g, '""')}"`,
        `"${r.ticketNumbers.join(', ')}"`,
        r.ticketCount,
        r.halfSetCount,
        r.fullSetCount,
        `"${r.customerPhone}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Employee_Report_${selectedEmployeeLabel}_${drawDate.replace(/ /g, '_')}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 select-none p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Employee Customer Report</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unique reports for staff accounts (L1, L2, ...) — Paid and booked customer records
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Draw: <strong className="text-slate-900">{drawDate}</strong></span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Refresh report data"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Small Boxes for each employee: L1, L2, L3... */}
      <div>
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
          Select Employee to View Unique Report:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {allEmployees.map((emp) => {
            const isSelected = selectedEmployeeLabel === emp.label;
            const count = employeeStatsMap[emp.label] || 0;

            return (
              <button
                key={emp.label}
                type="button"
                onClick={() => setSelectedEmployeeLabel(emp.label)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/40'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono font-black text-sm px-2 py-0.5 rounded-lg ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-blue-700'
                    }`}
                  >
                    {emp.label}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count} tkts
                  </span>
                </div>
                <div className="mt-2">
                  <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {emp.name}
                  </div>
                  <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    Active Staff
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Cards for Selected Employee */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Customers ({selectedEmployeeLabel})
          </div>
          <div className="text-xl font-black text-slate-900 mt-0.5">{summaryTotals.customers}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Under {selectedEmployeeLabel}</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            Total Tickets
          </div>
          <div className="text-xl font-black text-blue-700 mt-0.5">{summaryTotals.tickets}</div>
          <div className="text-[10px] text-blue-600/70 mt-0.5">Booked &amp; Paid</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Half Sets
          </div>
          <div className="text-xl font-black text-emerald-700 mt-0.5">{summaryTotals.halfs}</div>
          <div className="text-[10px] text-emerald-600/70 mt-0.5">₹300 Package</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-purple-200 bg-purple-50/20 shadow-2xs">
          <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
            Full Sets
          </div>
          <div className="text-xl font-black text-purple-700 mt-0.5">{summaryTotals.fulls}</div>
          <div className="text-[10px] text-purple-600/70 mt-0.5">₹570 Package</div>
        </div>
      </div>

      {/* Search and Export Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search customer name, phone, or ticket # under ${selectedEmployeeLabel}...`}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-blue-600 font-medium"
          />
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={selectedEmployeeRows.length === 0 || isExportingCsv}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export {selectedEmployeeLabel} CSV</span>
        </button>
      </div>

      {/* The Requested 6-Column Employee Report Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
              {selectedEmployeeLabel}
            </span>
            <span className="text-xs font-bold text-slate-800">
              Customer Bookings &amp; Payment Records
            </span>
          </div>
          <span className="text-xs text-slate-500">
            <strong>{selectedEmployeeRows.length}</strong> customers listed
          </span>
        </div>

        <div className="overflow-x-auto">
          {selectedEmployeeRows.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No paid or booked customers found under <strong>{selectedEmployeeLabel}</strong> for draw date {drawDate}.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Employee ID</th>
                  <th className="py-3 px-3.5">Customer Name</th>
                  <th className="py-3 px-3.5">Booked Ticket Numbers</th>
                  <th className="py-3 px-3.5 text-center">Number of Tickets</th>
                  <th className="py-3 px-3.5 text-center">Number of Half Set</th>
                  <th className="py-3 px-3.5 text-center">Number of Full Set</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {selectedEmployeeRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. Employee ID */}
                    <td className="py-3 px-3.5">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {row.employeeId}
                      </span>
                    </td>

                    {/* 2. Customer Name */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{row.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{row.customerPhone}</div>
                    </td>

                    {/* 3. Booked Ticket Numbers */}
                    <td className="py-3 px-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs sm:max-w-md">
                        {row.ticketNumbers.map((tNum) => (
                          <span
                            key={tNum}
                            className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200"
                          >
                            {tNum}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* 4. Number of Tickets */}
                    <td className="py-3 px-3.5 text-center font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-mono text-xs">
                        {row.ticketCount}
                      </span>
                    </td>

                    {/* 5. Number of Half Set */}
                    <td className="py-3 px-3.5 text-center font-bold text-emerald-700 font-mono">
                      {row.halfSetCount}
                    </td>

                    {/* 6. Number of Full Set */}
                    <td className="py-3 px-3.5 text-center font-bold text-purple-700 font-mono">
                      {row.fullSetCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
