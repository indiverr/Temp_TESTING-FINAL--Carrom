import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Search,
} from 'lucide-react';
import { TodayWinnerRecord, TicketBooking, LoginType } from '../types';
import { lotteryService } from '../lotteryService';

export interface TodayWinnerScreenProps {
  winners: TodayWinnerRecord[];
  allBookings?: TicketBooking[];
  currentRole: LoginType;
  businessDate: string;
  seriesTitle: string;
  employeeLabelMap?: Record<string, string>;
  onAddWinner?: (
    winningNumber: string,
    prizeCategory: string,
    prizeAmount: number,
    notes?: string
  ) => void;
  onAddWinnerRecord?: (
    record: Omit<TodayWinnerRecord, 'id' | 'enteredAt'>
  ) => Promise<void> | void;
  onUpdateWinnerAmount?: (
    winnerId: string,
    newAmount: number
  ) => Promise<void> | void;
  onDeleteWinner?: (winnerId: string) => Promise<void> | void;
  onBack: () => void;
}

interface ResolvedWinner {
  id: string;
  employeeLabel: string;
  customerCode: string;
  customerName: string;
  customerPhone?: string;
  ticketCount: number;
  ticketDetails: string;
  ticketAmount: number;
  winningAmount: number;
  rawRecord: TodayWinnerRecord;
}

export const TodayWinnerScreen: React.FC<TodayWinnerScreenProps> = ({
  winners,
  allBookings = [],
  currentRole,
  businessDate,
  seriesTitle,
  employeeLabelMap = {},
  onAddWinner,
  onAddWinnerRecord,
  onUpdateWinnerAmount,
  onDeleteWinner,
  onBack,
}) => {
  const [selectedDate, setSelectedDate] = useState(businessDate);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Inline editing state for total winning amount
  const [editingWinnerId, setEditingWinnerId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<string>('');

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Add winner modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formCustomerCode, setFormCustomerCode] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formEmployee, setFormEmployee] = useState('L1');
  const [formSetType, setFormSetType] = useState<'half' | 'full'>('full');
  const [matchedBookings, setMatchedBookings] = useState<TicketBooking[]>([]);
  const [selectedWinningTickets, setSelectedWinningTickets] = useState<string[]>([]);
  const [formTicketAmount, setFormTicketAmount] = useState('570');
  const [formWinningAmount, setFormWinningAmount] = useState('');
  const [formError, setFormError] = useState('');

  // Discover all registered employee labels L1, L2, ...
  const allEmployees = useMemo(() => {
    const labelsMap: Record<string, string> = { ...employeeLabelMap };

    try {
      const list = lotteryService.getAllEmployees('admin');
      list.forEach((e) => {
        if (e.label && !labelsMap[e.label]) {
          labelsMap[e.label] = e.name;
        }
      });
    } catch {}

    allBookings.forEach((b) => {
      if (b.employeeLabel && !labelsMap[b.employeeLabel]) {
        labelsMap[b.employeeLabel] = b.bookedBy || 'Employee';
      }
    });

    winners.forEach((w) => {
      if (w.employeeLabel && !labelsMap[w.employeeLabel]) {
        labelsMap[w.employeeLabel] = 'Employee';
      }
    });

    const entries = Object.keys(labelsMap).map((lbl) => ({
      label: lbl,
      name: labelsMap[lbl],
    }));

    if (entries.length === 0) {
      entries.push({ label: 'L1', name: 'Staff' });
    }

    entries.sort((a, b) => {
      const numA = parseInt(a.label.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.label.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    return entries;
  }, [employeeLabelMap, allBookings, winners]);

  // Resolve raw winner records with full data from bookings or existing fields
  const resolvedDateWinners = useMemo<ResolvedWinner[]>(() => {
    const rawForDate = winners.filter((w) => w.drawDate === selectedDate);

    return rawForDate.map((win) => {
      const matchingBooking = allBookings.find(
        (b) =>
          b.ticketNumber === win.winningNumber ||
          ((b as any).tickets && (b as any).tickets.some((t: any) => t.number === win.winningNumber))
      );

      // 1. Employee Label: L1, L2, ...
      let employeeLabel = win.employeeLabel || '';
      if (!employeeLabel && matchingBooking) {
        employeeLabel =
          matchingBooking.employeeLabel ||
          employeeLabelMap[matchingBooking.bookedBy] ||
          employeeLabelMap[matchingBooking.bookedByUid || ''] ||
          '';
      }
      if (!employeeLabel) {
        employeeLabel = employeeLabelMap[win.verifiedBy || ''] || 'L1';
      }

      // 2. Permanent Customer Code: #0000, #0012, etc.
      let customerCode = win.customerCode || '';
      if (!customerCode && matchingBooking) {
        if (matchingBooking.customerId) {
          customerCode = matchingBooking.customerId.startsWith('#')
            ? matchingBooking.customerId
            : '#' + matchingBooking.customerId;
        } else {
          customerCode = '#' + String(matchingBooking.ticketNumber || win.winningNumber || '0000').padStart(4, '0');
        }
      }
      if (!customerCode) {
        customerCode = '#' + String(win.winningNumber || '0000').padStart(4, '0');
      }

      // 3. Winner Name
      const customerName =
        win.customerName || matchingBooking?.customerName || 'Winner Customer';

      // 4. Ticket Count
      const ticketCount = win.ticketCount || ((matchingBooking as any)?.ticketCount ?? 1);

      // 5. Winned Ticket Numbers along with halfset and fullset numbers
      let ticketDetails = win.ticketDetails || '';
      if (!ticketDetails) {
        if (matchingBooking) {
          const typeLabel = matchingBooking.ticketType === 'half' ? 'Half Set' : 'Full Set';
          ticketDetails = `#${win.winningNumber} (${typeLabel})`;
        } else {
          ticketDetails = `#${win.winningNumber} (Full Set)`;
        }
      }

      // 6. Winned Ticket Amount (price received)
      let ticketAmount = win.ticketAmount;
      if (ticketAmount === undefined || ticketAmount === null) {
        if (matchingBooking) {
          ticketAmount =
            matchingBooking.amountPaid > 0
              ? matchingBooking.amountPaid
              : matchingBooking.totalAmount > 0
              ? matchingBooking.totalAmount
              : matchingBooking.ticketType === 'half'
              ? 300
              : 570;
        } else {
          ticketAmount = 570;
        }
      }

      // 7. Total Winning Amount (Editable)
      const winningAmount = win.winningAmount ?? win.prizeAmount ?? 0;

      return {
        id: win.id,
        employeeLabel,
        customerCode,
        customerName,
        customerPhone: win.customerPhone || matchingBooking?.customerPhone,
        ticketCount,
        ticketDetails,
        ticketAmount,
        winningAmount,
        rawRecord: win,
      };
    });
  }, [winners, selectedDate, allBookings, employeeLabelMap]);

  // Filter winners by selected employee and search text
  const filteredWinners = useMemo(() => {
    return resolvedDateWinners.filter((w) => {
      if (selectedEmployeeFilter !== 'ALL' && w.employeeLabel !== selectedEmployeeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = w.customerName.toLowerCase().includes(q);
        const matchCode = w.customerCode.toLowerCase().includes(q);
        const matchDetails = w.ticketDetails.toLowerCase().includes(q);
        const matchEmp = w.employeeLabel.toLowerCase().includes(q);
        return matchName || matchCode || matchDetails || matchEmp;
      }
      return true;
    });
  }, [resolvedDateWinners, selectedEmployeeFilter, searchQuery]);

  // Grand sums for current view
  const totalAmountReceived = useMemo(() => {
    return filteredWinners.reduce((sum, w) => sum + (Number(w.ticketAmount) || 0), 0);
  }, [filteredWinners]);

  const totalWinningAmount = useMemo(() => {
    return filteredWinners.reduce((sum, w) => sum + (Number(w.winningAmount) || 0), 0);
  }, [filteredWinners]);

  const totalTicketCount = useMemo(() => {
    return filteredWinners.reduce((sum, w) => sum + (Number(w.ticketCount) || 1), 0);
  }, [filteredWinners]);

  // Handle Permanent Code Input: Auto-updates customer name, employee, tickets booked, and set type
  const handleCustomerCodeChange = (code: string) => {
    setFormCustomerCode(code);
    const cleaned = code.trim().toLowerCase();
    const cleanNoHash = cleaned.replace(/^#/, '');

    if (!cleanNoHash) {
      setMatchedBookings([]);
      setSelectedWinningTickets([]);
      return;
    }

    // Search in allBookings for matches by customerId, ticketNumber, or permanent code
    const matches = allBookings.filter((b) => {
      const bCustId = (b.customerId || '').toLowerCase().replace(/^#/, '');
      const bTicket = (b.ticketNumber || '').toLowerCase().replace(/^#/, '');
      const bPerm = String(b.ticketNumber || '').padStart(4, '0');

      return (
        bCustId === cleanNoHash ||
        bTicket === cleanNoHash ||
        bPerm === cleanNoHash ||
        (cleanNoHash.length >= 3 && (bTicket.includes(cleanNoHash) || bCustId.includes(cleanNoHash)))
      );
    });

    if (matches.length > 0) {
      setMatchedBookings(matches);
      const first = matches[0];
      setFormCustomerName(first.customerName || 'Customer');
      const emp = first.employeeLabel || employeeLabelMap[first.bookedBy] || 'L1';
      setFormEmployee(emp);
      const st: 'half' | 'full' = first.ticketType === 'half' ? 'half' : 'full';
      setFormSetType(st);

      // Select all matched tickets by default
      const ticketNums = Array.from(new Set(matches.map((m) => m.ticketNumber)));
      setSelectedWinningTickets(ticketNums);

      // Calculate total amount received for these tickets
      const totalAmt = matches.reduce((sum, m) => {
        const amt = m.amountPaid > 0 ? m.amountPaid : (m.ticketType === 'half' ? 300 : 570);
        return sum + amt;
      }, 0);
      setFormTicketAmount(String(totalAmt));
    }
  };

  // Toggle winning lottery ticket selection
  const toggleWinningTicket = (ticketNum: string) => {
    const nextSelected = selectedWinningTickets.includes(ticketNum)
      ? selectedWinningTickets.filter((n) => n !== ticketNum)
      : [...selectedWinningTickets, ticketNum];
    setSelectedWinningTickets(nextSelected);

    // Sum ticket amount received for selected tickets
    const sumAmt = matchedBookings
      .filter((b) => nextSelected.includes(b.ticketNumber))
      .reduce((sum, b) => {
        const amt = b.amountPaid > 0 ? b.amountPaid : (b.ticketType === 'half' ? 300 : 570);
        return sum + amt;
      }, 0);
    setFormTicketAmount(String(sumAmt));
  };

  // Submit Add Winner
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerCode.trim()) {
      setFormError('Please enter a permanent customer code.');
      return;
    }
    const winAmt = parseFloat(formWinningAmount);
    if (isNaN(winAmt) || winAmt < 0) {
      setFormError('Please enter a valid final winning amount.');
      return;
    }

    const ticketAmt = parseFloat(formTicketAmount) || 0;
    const typeLabel = formSetType === 'half' ? 'Half Set' : 'Full Set';

    // Winning tickets list
    let winningTicketsList = selectedWinningTickets;
    if (winningTicketsList.length === 0) {
      const numOnly = formCustomerCode.replace(/\D/g, '');
      winningTicketsList = [numOnly || '0001'];
    }

    const ticketDetails = winningTicketsList
      .map((t) => `#${t} (${typeLabel})`)
      .join(', ');

    const primaryNumber = winningTicketsList.join(', ');
    const count = winningTicketsList.length;

    const code = formCustomerCode.startsWith('#')
      ? formCustomerCode
      : '#' + formCustomerCode;

    if (onAddWinnerRecord) {
      await onAddWinnerRecord({
        drawDate: selectedDate,
        seriesTitle,
        winningNumber: primaryNumber,
        prizeAmount: winAmt,
        winningAmount: winAmt,
        employeeLabel: formEmployee,
        customerCode: code,
        customerName: formCustomerName || 'Winner Customer',
        ticketCount: count,
        ticketDetails,
        ticketAmount: ticketAmt,
        status: 'Official',
      });
    } else if (onAddWinner) {
      onAddWinner(primaryNumber, '1st Prize', winAmt);
    }

    setIsAddModalOpen(false);
    setFormCustomerCode('');
    setFormWinningAmount('');
    setFormCustomerName('');
    setMatchedBookings([]);
    setSelectedWinningTickets([]);
    setFormTicketAmount('570');
    setFormError('');
  };

  // Save inline edited total winning amount
  const handleSaveEdit = async (winnerId: string) => {
    const newAmt = parseFloat(editingAmount);
    if (isNaN(newAmt) || newAmt < 0) {
      setEditingWinnerId(null);
      return;
    }
    if (onUpdateWinnerAmount) {
      await onUpdateWinnerAmount(winnerId, newAmt);
    }
    setEditingWinnerId(null);
  };

  // Confirm delete winner
  const handleConfirmDelete = async (winnerId: string) => {
    if (onDeleteWinner) {
      await onDeleteWinner(winnerId);
    }
    setDeleteConfirmId(null);
  };

  return (
    <div className="w-full flex flex-col space-y-5 select-none pb-8">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Back to Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Draw Winners
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {seriesTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Winners report, winning ticket amounts received and winning prize payouts
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="02 Oct 2026">02 Oct 2026</option>
              <option value="03 Oct 2026">03 Oct 2026</option>
              <option value="04 Oct 2026">04 Oct 2026</option>
            </select>
          </div>

          {currentRole === 'admin' && (
            <button
              onClick={() => {
                setFormCustomerCode('');
                setFormWinningAmount('');
                setFormCustomerName('');
                setMatchedBookings([]);
                setSelectedWinningTickets([]);
                setFormTicketAmount('570');
                setFormError('');
                setIsAddModalOpen(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Winner</span>
            </button>
          )}
        </div>
      </div>

      {/* Employee Filter Small Boxes (L1, L2, ...) & Search */}
      <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs font-bold text-slate-500 uppercase mr-1 shrink-0">
            Employee:
          </span>

          {/* All Filter Box */}
          <button
            type="button"
            onClick={() => setSelectedEmployeeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 flex items-center space-x-1.5 ${
              selectedEmployeeFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>All</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                selectedEmployeeFilter === 'ALL'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {resolvedDateWinners.length}
            </span>
          </button>

          {/* Individual Employee Small Boxes: L1, L2, ... */}
          {allEmployees.map((emp) => {
            const count = resolvedDateWinners.filter(
              (w) => w.employeeLabel === emp.label
            ).length;
            const isSelected = selectedEmployeeFilter === emp.label;
            return (
              <button
                key={emp.label}
                type="button"
                onClick={() => setSelectedEmployeeFilter(emp.label)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{emp.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Search */}
        <div className="relative shrink-0 w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search winner, code, ticket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
          />
        </div>
      </div>

      {/* Summary Stat Cards with Grand Sums */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Whole Amount Received in Winners */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Whole Amount Received
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹ {totalAmountReceived.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Ticket price received (
            {selectedEmployeeFilter === 'ALL'
              ? 'All Employees'
              : `Employee ${selectedEmployeeFilter}`}
            )
          </div>
        </div>

        {/* Total Winning Amount (Admin Payout) */}
        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-2xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Total Winning Amount
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹ {totalWinningAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            Total prize payout entered by Admin
          </div>
        </div>

        {/* Total Winning Tickets */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Winning Tickets
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {totalTicketCount}{' '}
            <span className="text-sm font-normal text-slate-500">tickets</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Across {filteredWinners.length} winner entries
          </div>
        </div>
      </div>

      {/* Winners Table View */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Permanent Code</th>
                <th className="py-3 px-3">Name of Winner</th>
                <th className="py-3 px-3 text-center">No. of Tickets</th>
                <th className="py-3 px-3">Winned Tickets & Sets</th>
                <th className="py-3 px-3 text-right">Winned Ticket Amount</th>
                <th className="py-3 px-3 text-right">Total Winning Amount</th>
                {currentRole === 'admin' && (
                  <th className="py-3 px-3 text-center">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredWinners.length === 0 ? (
                <tr>
                  <td
                    colSpan={currentRole === 'admin' ? 8 : 7}
                    className="py-16 text-center text-slate-400"
                  >
                    <div className="w-10 h-10 mx-auto rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div className="font-semibold text-slate-700">No Winners Found</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      No winning entries for {selectedDate}{' '}
                      {selectedEmployeeFilter !== 'ALL'
                        ? `under ${selectedEmployeeFilter}`
                        : ''}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWinners.map((winner) => (
                  <tr
                    key={winner.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* 1. First column: L1, L2... Employee */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {winner.employeeLabel}
                      </span>
                    </td>

                    {/* 2. Permanent Customer Code */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {winner.customerCode}
                    </td>

                    {/* 3. Name of Winner */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">
                        {winner.customerName}
                      </div>
                      {winner.customerPhone && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {winner.customerPhone}
                        </div>
                      )}
                    </td>

                    {/* 4. No. of Tickets */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        {winner.ticketCount}
                      </span>
                    </td>

                    {/* 5. Winned Ticket Numbers along with halfset and fullset numbers */}
                    <td className="py-3 px-3">
                      <span className="inline-block px-2.5 py-1 rounded text-xs font-mono font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                        {winner.ticketDetails}
                      </span>
                    </td>

                    {/* 6. Winned Ticket Amount */}
                    <td className="py-3 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      ₹ {Number(winner.ticketAmount || 0).toLocaleString('en-IN')}
                    </td>

                    {/* 7. Total Winning Amount entered by Admin with Editable Option */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {editingWinnerId === winner.id ? (
                        <div className="flex items-center justify-end space-x-1">
                          <span className="text-xs font-bold text-slate-600">₹</span>
                          <input
                            type="number"
                            autoFocus
                            value={editingAmount}
                            onChange={(e) => setEditingAmount(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(winner.id);
                              if (e.key === 'Escape') setEditingWinnerId(null);
                            }}
                            className="w-24 px-2 py-1 text-xs font-bold text-right border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(winner.id)}
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingWinnerId(null)}
                            className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          <span className="font-bold text-emerald-700 text-sm">
                            ₹{' '}
                            {Number(winner.winningAmount || 0).toLocaleString(
                              'en-IN'
                            )}
                          </span>
                          {currentRole === 'admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingWinnerId(winner.id);
                                setEditingAmount(
                                  String(winner.winningAmount || 0)
                                );
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Total Winning Amount"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 8. Action: Delete Winner */}
                    {currentRole === 'admin' && (
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {deleteConfirmId === winner.id ? (
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(winner.id)}
                              className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold hover:bg-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(winner.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Winner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>

            {/* Table Footer: Whole Amount Received and Winning Amount Grand Sums */}
            {filteredWinners.length > 0 && (
              <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
                <tr>
                  <td className="py-3 px-3">
                    Total ({filteredWinners.length})
                  </td>
                  <td
                    colSpan={2}
                    className="py-3 px-3 text-slate-500 font-normal"
                  >
                    {selectedEmployeeFilter === 'ALL'
                      ? 'Grand summary across all employees'
                      : `Summary for ${selectedEmployeeFilter}`}
                  </td>
                  <td className="py-3 px-3 text-center font-bold">
                    {totalTicketCount}
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-normal">—</td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                    ₹ {totalAmountReceived.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-emerald-700 text-sm">
                    ₹ {totalWinningAmount.toLocaleString('en-IN')}
                  </td>
                  {currentRole === 'admin' && <td className="py-3 px-3"></td>}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Declare Draw Winner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden border border-slate-200 p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-sm text-slate-900">
                  Declare Draw Winner
                </span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* 1. Permanent Customer Code (Primary Auto-Lookup) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Permanent Customer Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. #0001 or 0001"
                  value={formCustomerCode}
                  onChange={(e) => handleCustomerCodeChange(e.target.value)}
                  className="w-full text-center text-lg font-mono font-bold py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white tracking-wider"
                  autoFocus
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Type permanent code to automatically load customer details, employee, and booked tickets.
                </span>
              </div>

              {/* 2. Auto-Updated Customer & Booking Details */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2.5">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Name of Customer */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Name of Customer:
                    </span>
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={formCustomerName}
                      onChange={(e) => setFormCustomerName(e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none"
                    />
                  </div>

                  {/* Under Whom Booked (Employee) */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Under Whom Booked:
                    </span>
                    <select
                      value={formEmployee}
                      onChange={(e) => setFormEmployee(e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none"
                    >
                      {allEmployees.map((emp) => (
                        <option key={emp.label} value={emp.label}>
                          {emp.label} ({emp.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200/60">
                  {/* No. of Tickets Booked */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      No. of Tickets Booked:
                    </span>
                    <span className="font-bold text-slate-800 text-xs">
                      {matchedBookings.length > 0 ? `${matchedBookings.length} Ticket(s)` : '1 Ticket'}
                    </span>
                  </div>

                  {/* Type of Set (Fullset or Halfset) */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Type of Set:
                    </span>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setFormSetType('full');
                          if (matchedBookings.length === 0) setFormTicketAmount('570');
                        }}
                        className={`px-2 py-0.5 rounded text-xs font-bold border transition-colors ${
                          formSetType === 'full'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Full Set (₹570)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormSetType('half');
                          if (matchedBookings.length === 0) setFormTicketAmount('300');
                        }}
                        className={`px-2 py-0.5 rounded text-xs font-bold border transition-colors ${
                          formSetType === 'half'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Half Set (₹300)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Select Winning Lottery Tickets & Sum Winned Ticket Amount */}
              {matchedBookings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Select Winning Lottery Ticket(s):
                    </label>
                    <span className="text-[11px] text-blue-600 font-bold">
                      {selectedWinningTickets.length} of {matchedBookings.length} selected
                    </span>
                  </div>

                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                    {matchedBookings.map((b) => {
                      const isSelected = selectedWinningTickets.includes(b.ticketNumber);
                      const tAmt = b.amountPaid > 0 ? b.amountPaid : (b.ticketType === 'half' ? 300 : 570);
                      const tType = b.ticketType === 'half' ? 'Half Set' : 'Full Set';
                      return (
                        <div
                          key={b.ticketNumber}
                          onClick={() => toggleWinningTicket(b.ticketNumber)}
                          className={`p-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-blue-600 rounded pointer-events-none"
                            />
                            <span className="font-mono font-bold text-slate-900">
                              #{b.ticketNumber}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {tType}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900">
                            ₹{tAmt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Winned Ticket Amount Received (Summed) */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">
                    Winned Ticket Amount Received:
                  </span>
                  <span className="text-xs text-amber-700">
                    {selectedWinningTickets.length > 1
                      ? `Sum of ${selectedWinningTickets.length} winning tickets`
                      : 'Ticket price received'}
                  </span>
                </div>
                <div className="text-xl font-black text-amber-900">
                  ₹ {Number(formTicketAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* 5. Final Winning Amount (Prize Payout) Entered by Admin */}
              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">
                  Final Winning Amount (₹):
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={formWinningAmount}
                  onChange={(e) => setFormWinningAmount(e.target.value)}
                  className="w-full px-3 py-2.5 text-base font-bold text-emerald-800 bg-emerald-50/40 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Enter the final winning prize payout to award the customer.
                </span>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-medium">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Save Winner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
