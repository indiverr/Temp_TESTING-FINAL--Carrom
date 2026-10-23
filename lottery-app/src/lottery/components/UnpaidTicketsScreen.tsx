import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  Check,
  AlertCircle,
  Trash2,
  DollarSign,
  Filter,
  CheckCircle2,
  Layers,
  Phone,
} from 'lucide-react';
import { TicketBooking, LoginType } from '../types';

interface UnpaidTicketsScreenProps {
  unpaidBookings: TicketBooking[];
  currentRole: LoginType;
  currentStaffName: string;
  onConfirmPayment: (
    ticketNum: string,
    amount: number,
    paymentMethod: string,
    ref: string,
    notes?: string
  ) => void;
  onCancelBooking: (ticketNum: string, reason: string) => void;
  onBack: () => void;
}

export const UnpaidTicketsScreen: React.FC<UnpaidTicketsScreenProps> = ({
  unpaidBookings,
  currentRole,
  currentStaffName,
  onConfirmPayment,
  onCancelBooking,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'full' | 'half'>('all');

  const [selectedBookingForPay, setSelectedBookingForPay] = useState<TicketBooking | null>(null);
  const [customPayAmount, setCustomPayAmount] = useState<number>(50);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<TicketBooking | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');

  // Filter logic
  const filtered = unpaidBookings.filter((b) => {
    const q = searchQuery.trim().toLowerCase();
    const matchQuery =
      !q ||
      b.ticketNumber.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      (b.customerPhone && b.customerPhone.toLowerCase().includes(q));

    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'partial'
        ? b.paymentStatus === 'Partial' || (b.amountPaid > 0 && b.remainingBalance > 0)
        : b.amountPaid === 0;

    const matchType =
      typeFilter === 'all'
        ? true
        : typeFilter === 'full'
        ? b.fullSelected
        : b.halfSelected;

    return matchQuery && matchStatus && matchType;
  });

  // Financial calculations
  const totalOutstanding = filtered.reduce((acc, curr) => acc + curr.remainingBalance, 0);
  const totalBookedValue = filtered.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPartiallyPaid = filtered.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const partialCount = filtered.filter(
    (b) => b.paymentStatus === 'Partial' || (b.amountPaid > 0 && b.remainingBalance > 0)
  ).length;
  const fullTicketsCount = filtered.filter((b) => b.fullSelected).length;
  const halfTicketsCount = filtered.filter((b) => b.halfSelected).length;

  const handleOpenPayment = (booking: TicketBooking) => {
    setSelectedBookingForPay(booking);
    setCustomPayAmount(booking.remainingBalance);
    setPaymentRef(`REC-${Date.now().toString().slice(-6)}`);
    setPaymentError('');
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPay) return;

    if (customPayAmount <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }
    if (customPayAmount > selectedBookingForPay.remainingBalance) {
      setPaymentError('Payment exceeds remaining balance.');
      return;
    }

    onConfirmPayment(
      selectedBookingForPay.ticketNumber,
      customPayAmount,
      paymentMethod,
      paymentRef,
      `Settled by ${currentStaffName}`
    );
    setSelectedBookingForPay(null);
  };

  const handleExecuteCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForCancel) return;
    onCancelBooking(selectedBookingForCancel.ticketNumber, cancelReason);
    setSelectedBookingForCancel(null);
  };

  return (
    <div className="w-full flex flex-col space-y-6 select-none">
      {/* 1. Page Heading with Breadcrumbs & Collector Details */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-700 shadow-xs transition-all active:scale-95"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Unpaid Tickets Ledger
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                {unpaidBookings.length} Pending
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Full-width dashboard for outstanding ticket balances, partial collections, and settlement records
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Counter Staff: {currentStaffName}</span>
            <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
              {currentRole}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Outstanding-Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Outstanding */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Outstanding Due
            </span>
            <span className="text-2xl sm:text-3xl font-black text-rose-600 mt-1 block font-mono">
              ₹{totalOutstanding.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-rose-700 mt-0.5 block">
              Across {filtered.length} pending bookings
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 2: Booked Value */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Booked Value
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block font-mono">
              ₹{totalBookedValue.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
              Full ticket commitment
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3: Already Collected Partial */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Partial Receipts
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 block font-mono">
              ₹{totalPartiallyPaid.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 mt-0.5 block">
              {partialCount} tickets with partial deposits
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 4: Ticket Split Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Ticket Breakdown
            </span>
            <div className="flex items-center space-x-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200">
                {fullTicketsCount} Full
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-black border border-blue-200">
                {halfTicketsCount} Half
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 mt-1.5 block">
              Inventory selection ratio
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* 3. Search and Filtering Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ticket # (e.g. 0012), customer name, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-bold">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Payment States</option>
            <option value="unpaid">Completely Unpaid (₹0)</option>
            <option value="partial">Partially Paid</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Types (Full / Half)</option>
            <option value="full">Full Tickets Only</option>
            <option value="half">Half Tickets Only</option>
          </select>
        </div>
      </div>

      {/* 4. Full-Width Responsive Table Spanning Available Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200 text-xs uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-3.5 px-4 text-center">S.No</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4 text-center">Ticket #</th>
                <th className="py-3.5 px-4 text-center">Half / Full Ticket</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-right">Amount Paid</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4 text-center">Payment Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-500 text-center">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-slate-900">{item.customerName}</div>
                    {item.customerPhone && (
                      <div className="text-slate-500 text-xs flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.customerPhone}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-mono font-black text-sm bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 inline-block shadow-xs">
                      #{item.ticketNumber}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1.5">
                      {item.halfSelected && (
                        <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs">
                          Half ₹{item.halfAmount}
                        </span>
                      )}
                      {item.fullSelected && (
                        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                          Full ₹{item.fullAmount}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                    ₹{item.totalAmount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600 font-mono">
                    ₹{item.amountPaid}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-rose-600 font-mono">
                    ₹{item.remainingBalance}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {item.paymentStatus === 'Partial' || (item.amountPaid > 0 && item.remainingBalance > 0) ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                        Partial (₹{item.amountPaid} Paid)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                        Unpaid
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleOpenPayment(item)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs active:scale-95 transition-all shadow-xs flex items-center space-x-1"
                        title="Collect or settle payment"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Settle</span>
                      </button>

                      <button
                        onClick={() => setSelectedBookingForCancel(item)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Cancel Booking"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">No Unpaid Tickets Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {unpaidBookings.length === 0
                ? 'All booked tickets have been completely settled and verified!'
                : 'No pending records match your current filter criteria.'}
            </p>
          </div>
        )}
      </div>

      {/* Explicit Payment Confirmation Modal with Partial Payment Support */}
      {selectedBookingForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
              <span className="font-extrabold text-sm tracking-wide">
                Confirm Ticket Settlement
              </span>
              <button
                onClick={() => setSelectedBookingForPay(null)}
                className="text-white hover:text-slate-200"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="p-5 space-y-4">
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Ticket Number:</span>
                  <span className="font-mono font-black text-sm text-blue-700">
                    #{selectedBookingForPay.ticketNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Customer:</span>
                  <span className="font-extrabold text-slate-800">
                    {selectedBookingForPay.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Total Ticket Price:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    ₹{selectedBookingForPay.totalAmount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Already Paid:</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    ₹{selectedBookingForPay.amountPaid}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                  <span className="text-slate-700">Remaining Due Balance:</span>
                  <span className="text-rose-600 font-black text-sm font-mono">
                    ₹{selectedBookingForPay.remainingBalance}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Amount to Collect (₹):
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedBookingForPay.remainingBalance}
                  value={customPayAmount}
                  onChange={(e) => setCustomPayAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-base font-black text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter full balance for complete settlement, or enter lower amount for partial deposit.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Method:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Cash">Cash at Counter</option>
                  <option value="Google Pay">Google Pay</option>
                  <option value="UPI">UPI Transfer</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Reference / Receipt ID:
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UPI-TXN-98212"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none font-mono"
                />
              </div>

              {paymentError && (
                <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold">
                  {paymentError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForPay(null)}
                  className="py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal with Audit Reason */}
      {selectedBookingForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-5 animate-in zoom-in-95">
            <h3 className="font-black text-base text-slate-900 mb-1">Cancel Booking</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to cancel ticket #{selectedBookingForCancel.ticketNumber}? This action releases the ticket and logs an audit record.
            </p>

            <form onSubmit={handleExecuteCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Cancellation
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForCancel(null)}
                  className="py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Keep Ticket
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  Confirm Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
