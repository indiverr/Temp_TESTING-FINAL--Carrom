import React, { useState, useMemo, useEffect } from 'react';
import {
  UserCheck,
  Calendar,
  ArrowRight,
  FileText,
  Users,
  Search,
  Download,
  X,
  Trash2,
  AlertCircle,
  Check,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import {
  EmployeeProfile,
  WeeklyTicketPresetsConfig,
  DayOfWeek,
  TicketBooking,
} from '../types';
import { liveFirebase } from '../liveFirebase';
import { lotteryService } from '../lotteryService';

interface EnterDrawDateScreenProps {
  currentStaff: EmployeeProfile;
  currentDrawDate?: string;
  onEnterDraw: (date: string) => void;
  onOpenAvailableGallery?: () => void;
  weeklyPresets?: WeeklyTicketPresetsConfig;
  allBookings?: TicketBooking[];
}

export const EnterDrawDateScreen: React.FC<EnterDrawDateScreenProps> = ({
  currentStaff,
  currentDrawDate,
  onEnterDraw,
  allBookings = [],
}) => {
  // Generate 7 consecutive days starting from today in Asia/Kolkata (IST) timezone
  const weekDays = useMemo(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(now);
    let y = now.getFullYear();
    let m = now.getMonth();
    let dayVal = now.getDate();
    for (const p of parts) {
      if (p.type === 'year') y = parseInt(p.value, 10);
      if (p.type === 'month') m = parseInt(p.value, 10) - 1;
      if (p.type === 'day') dayVal = parseInt(p.value, 10);
    }
    const today = new Date(y, m, dayVal);

    const days: Array<{ dateStr: string; dayName: DayOfWeek; isToday: boolean; shortDate: string }> = [];
    const dayNames: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const dateStr = `${day} ${month} ${year}`;
      const dayName = dayNames[d.getDay()];

      days.push({
        dateStr,
        dayName,
        isToday: i === 0,
        shortDate: `${day} ${month}`,
      });
    }
    return days;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (currentDrawDate) return currentDrawDate;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('carrom_active_draw_date');
      if (stored) return stored;
    }
    return weekDays[0]?.dateStr || '29 Oct 2026';
  });

  useEffect(() => {
    if (currentDrawDate && currentDrawDate !== selectedDate) {
      setSelectedDate(currentDrawDate);
    }
  }, [currentDrawDate]);

  const roleLabel =
    currentStaff.role === 'paid_employee'
      ? 'Paid Employee'
      : currentStaff.role === 'employee'
      ? 'Employee'
      : 'Admin';

  const isAdmin = currentStaff.role === 'admin' || (currentStaff as any).role === 'superadmin';

  // -------------------------------------------------------------
  // ADMIN-ONLY EMPLOYEE LIST STATE & HANDLERS
  // -------------------------------------------------------------
  const [isEmployeeListOpen, setIsEmployeeListOpen] = useState(false);
  const [employees, setEmployees] = useState<
    Array<{ uid: string; label: string; name: string; username?: string; role?: any }>
  >([]);
  const [employeeFeedback, setEmployeeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isRemovingEmployee, setIsRemovingEmployee] = useState<string | null>(null);

  const loadEmployees = () => {
    if (!isAdmin) return;
    const list = lotteryService.getAllEmployees('admin');
    setEmployees(list);
  };

  useEffect(() => {
    if (isEmployeeListOpen && isAdmin) {
      loadEmployees();
    }
  }, [isEmployeeListOpen, isAdmin]);

  const handleRemoveEmployee = async (emp: { uid: string; label: string; name: string }) => {
    if (!window.confirm(`Are you sure you want to remove employee ${emp.label} (${emp.name})?`)) {
      return;
    }
    setIsRemovingEmployee(emp.uid);
    setEmployeeFeedback(null);
    try {
      const res = await liveFirebase.removeEmployeeFirestore(emp.uid);
      if (res.success) {
        setEmployeeFeedback({
          type: 'success',
          message: `Employee ${emp.label} (${emp.name}) removed successfully.`,
        });
        loadEmployees();
      } else {
        setEmployeeFeedback({
          type: 'error',
          message: res.error || 'Failed to remove employee.',
        });
      }
    } catch (err: any) {
      setEmployeeFeedback({
        type: 'error',
        message: err?.message || 'Error removing employee.',
      });
    } finally {
      setIsRemovingEmployee(null);
    }
  };

  // -------------------------------------------------------------
  // ADMIN-ONLY CUSTOMER REPORT STATE & HANDLERS
  // -------------------------------------------------------------
  const [isCustomerReportOpen, setIsCustomerReportOpen] = useState(false);
  const [reportDate, setReportDate] = useState<string>(selectedDate);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('ALL');
  const [reportBookings, setReportBookings] = useState<TicketBooking[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Sync reportDate when selectedDate changes and report opens
  useEffect(() => {
    if (isCustomerReportOpen) {
      setReportDate(selectedDate);
    }
  }, [isCustomerReportOpen, selectedDate]);

  // Load bookings for Customer Report strictly if user is Admin
  useEffect(() => {
    if (!isCustomerReportOpen || !isAdmin) return;
    let isMounted = true;

    const loadReportData = async () => {
      setIsLoadingReport(true);
      setReportError(null);
      try {
        const bookings = await liveFirebase.fetchCustomerReportBookings('admin', {
          mode: 'specific',
          date: reportDate,
        });
        if (isMounted) {
          setReportBookings(bookings || []);
        }
      } catch (err: any) {
        if (isMounted) {
          const localBookings = lotteryService.getCustomerReportBookings(
            { mode: 'specific', date: reportDate },
            'admin'
          );
          setReportBookings(localBookings || []);
          if (!localBookings || localBookings.length === 0) {
            setReportError(err?.message || 'Failed to fetch customer report from server.');
          }
        }
      } finally {
        if (isMounted) setIsLoadingReport(false);
      }
    };

    loadReportData();
    return () => {
      isMounted = false;
    };
  }, [isCustomerReportOpen, reportDate, isAdmin]);

  // Map employee labels for badges (e.g. L1, L2, L3)
  const availableEmployeeBoxes = useMemo(() => {
    const labelsSet = new Set<string>();
    const allEmps = lotteryService.getAllEmployees('admin');
    allEmps.forEach((e) => {
      if (e.label) labelsSet.add(e.label);
    });

    reportBookings.forEach((b) => {
      if (b.employeeLabel) labelsSet.add(b.employeeLabel);
    });

    const labels = Array.from(labelsSet);
    labels.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    const labelMap = lotteryService.getEmployeeLabelMap('admin');
    return labels.map((lbl) => ({
      label: lbl,
      name: labelMap[lbl] || 'Staff',
    }));
  }, [reportBookings]);

  // Filter report bookings by employee and search query
  // Requirement: Show customers paid or booked under that employee with strictly 3 details:
  // 1. Permanent number (#0000, #0001...)
  // 2. Name of customer
  // 3. Phone number
  const filteredReportBookings = useMemo(() => {
    let list = reportBookings.filter(
      (b) => b.bookingStatus === 'Booked' || b.bookingStatus === 'Pending Confirmation' || b.paymentStatus === 'Paid'
    );

    if (selectedEmployeeFilter !== 'ALL') {
      list = list.filter((b) => (b.employeeLabel || 'L1') === selectedEmployeeFilter);
    }

    if (reportSearchQuery.trim()) {
      const q = reportSearchQuery.trim().toLowerCase();
      list = list.filter((b) => {
        const nameMatch = (b.customerName || '').toLowerCase().includes(q);
        const phoneMatch = (b.customerPhone || '').toLowerCase().includes(q);
        const ticketMatch = String(b.ticketNumber || '').toLowerCase().includes(q);
        return nameMatch || phoneMatch || ticketMatch;
      });
    }

    return list;
  }, [reportBookings, selectedEmployeeFilter, reportSearchQuery]);

  // CSV Export for the 3-column customer report
  const handleExportCsv = () => {
    if (filteredReportBookings.length === 0) return;
    setIsExportingCsv(true);
    try {
      const headers = ['Permanent Number', 'Customer Name', 'Phone Number', 'Employee'];
      const rows = filteredReportBookings.map((b) => {
        const permNumber = '#' + String(b.ticketNumber || '0000').padStart(4, '0');
        return [
          `"${permNumber}"`,
          `"${(b.customerName || '').replace(/"/g, '""')}"`,
          `"${b.customerPhone || ''}"`,
          `"${b.employeeLabel || 'L1'}"`,
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Customer_Report_${selectedEmployeeFilter}_${reportDate.replace(/ /g, '_')}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-auto flex flex-col space-y-5 select-none p-4 sm:p-6">
      {/* 1. Operator Profile Box */}
      <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Operator</span>
            <h2 className="text-base font-bold text-slate-900">{currentStaff.name}</h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
              <span>ID: {currentStaff.id}</span>
              <span>•</span>
              <span className="capitalize font-semibold text-slate-700">{roleLabel}</span>
            </div>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
          Online
        </span>
      </div>

      {/* 2. Admin Action Buttons: Customer Report & Employee List ONLY */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setReportDate(selectedDate);
              setIsCustomerReportOpen(true);
            }}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Customer Report</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsEmployeeListOpen(true);
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Employee List</span>
          </button>
        </div>
      )}

      {/* 3. 1-Week Draw Date Schedule Below */}
      <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>1-Week Draw Date Schedule</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select any day to open ticket grid and bookings.
          </p>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {weekDays.map((d) => {
            const isSelected = selectedDate === d.dateStr;
            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => {
                  setSelectedDate(d.dateStr);
                  onEnterDraw(d.dateStr);
                }}
                className={`p-3 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center space-y-1 relative cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                {d.isToday && (
                  <span
                    className={`absolute -top-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      isSelected ? 'bg-amber-400 text-slate-900' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    Today
                  </span>
                )}
                <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {d.dayName.slice(0, 3)}
                </span>
                <span className={`text-[12px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>
                  {d.shortDate}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ADMIN-ONLY EMPLOYEE LIST MODAL (L1, L2, ... with Remove option) */}
      {/* ------------------------------------------------------------- */}
      {isEmployeeListOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-5 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-slate-900" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Employee List</h3>
                  <p className="text-[11px] text-slate-500">Manage registered staff (L1, L2, ...)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmployeeListOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {employeeFeedback && (
              <div
                className={`mt-3 p-2.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border ${
                  employeeFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {employeeFeedback.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{employeeFeedback.message}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-3 space-y-2 mt-2">
              {employees.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No employees registered yet.</div>
              ) : (
                employees.map((emp) => (
                  <div
                    key={emp.uid || emp.label}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-10 h-10 rounded-lg bg-blue-600 text-white font-mono font-bold text-sm flex items-center justify-center shadow-2xs">
                        {emp.label}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{emp.name}</div>
                        <div className="text-xs text-slate-500">
                          {emp.username ? `@${emp.username}` : `ID: ${emp.uid}`} •{' '}
                          <span className="capitalize font-semibold text-slate-700">
                            {emp.role || 'employee'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isRemovingEmployee === emp.uid}
                      onClick={() => handleRemoveEmployee(emp)}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs flex items-center space-x-1 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Remove this employee"
                    >
                      {isRemovingEmployee === emp.uid ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Remove</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsEmployeeListOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADMIN-ONLY CUSTOMER REPORT MODAL (3 details: #0000, Name, Phone) */}
      {/* ------------------------------------------------------------- */}
      {isCustomerReportOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Customer Report</h3>
                  <p className="text-[11px] text-slate-500">
                    Booked & Paid Customers for Draw: <strong className="text-slate-800">{reportDate}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerReportOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Small Boxes for Employees: L1, L2, ... */}
            <div className="mt-3">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Select Employee:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedEmployeeFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Employees
                </button>
                {availableEmployeeBoxes.map((emp) => (
                  <button
                    key={emp.label}
                    type="button"
                    onClick={() => setSelectedEmployeeFilter(emp.label)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                      selectedEmployeeFilter === emp.label
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <span>{emp.label}</span>
                    <span className="text-[10px] opacity-75 font-normal">({emp.name})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar & Export */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  placeholder="Search customer name, phone, or ticket #..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-blue-600"
                />
              </div>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredReportBookings.length === 0 || isExportingCsv}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* 3-Details Customer Table */}
            <div className="flex-1 overflow-y-auto mt-3 border border-slate-200 rounded-xl">
              {isLoadingReport ? (
                <div className="p-8 flex flex-col items-center justify-center space-y-2 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs">Loading customer report...</span>
                </div>
              ) : filteredReportBookings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No booked or paid customers found for {selectedEmployeeFilter === 'ALL' ? 'selected draw' : selectedEmployeeFilter}.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[11px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Permanent Number</th>
                      <th className="py-2.5 px-3">Customer Name</th>
                      <th className="py-2.5 px-3">Phone Number</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReportBookings.map((b, idx) => {
                      const permNumber = '#' + String(b.ticketNumber || '0000').padStart(4, '0');
                      return (
                        <tr key={b.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                            {permNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {b.customerName || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {b.customerPhone || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Summary */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing <strong>{filteredReportBookings.length}</strong> customer records
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerReportOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
