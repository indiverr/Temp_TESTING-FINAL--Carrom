import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Check,
  X,
  Trash2,
  Phone,
  Filter,
  Layers,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { TicketBooking, LoginType } from '../types';

interface UnpaidTicketsScreenProps {
  unpaidBookings: TicketBooking[];
  currentStaffName: string;
  currentRole: LoginType;
  onConfirmPayment: (
    ticketNum: string,
    amount: number,
    paymentMethod: string,
    paymentRef: string,
    notes?: string
  ) => void;
  onCancelBooking: (ticketNum: string, reason: string) => void;
  onBack: () => void;
}

export const UnpaidTicketsScreen: React.FC<UnpaidTicketsScreenProps> = ({
  unpaidBookings,
  currentStaffName,
  currentRole,
  onConfirmPayment,
  onCancelBooking,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'full' | 'half'>('all');

  // Confirmation modal state
  const [selectedBookingForPay, setSelectedBookingForPay] = useState<TicketBooking | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Cancellation modal state
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<TicketBooking | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');

  // Filtered bookings
  const filtered = unpaidBookings.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.ticketNumber.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.customerPhone.toLowerCase().includes(q);

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'full' && item.fullSelected) ||
      (typeFilter === 'half' && item.halfSelected && !item.fullSelected);

    return matchesSearch && matchesType;
  });

  const fullTicketsCount = filtered.filter((b) => b.fullSelected).length;
  const halfTicketsCount = filtered.filter((b) => b.halfSelected).length;

  const handleOpenConfirm = (booking: TicketBooking) => {
    setSelectedBookingForPay(booking);
    setVerificationNote('');
    setPaymentError('');
  };

  const handleExecuteConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPay) return;

    if (currentRole === 'employee') {
      setPaymentError('Only Admin or Supervisor can confirm bookings.');
      return;
    }

    onConfirmPayment(
      selectedBookingForPay.ticketNumber,
      selectedBookingForPay.remainingBalance,
      'Verified',
      'VERIFIED',
      verificationNote
    );
    setSelectedBookingForPay(null);
  };

  const handleExecuteCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForCancel) return;
    onCancelBooking(selectedBookingForCancel.ticketNumber, cancelReason);
    setSelectedBookingForCancel(null);
  };

  const roleLabel = currentRole === 'paid_employee' ? 'Supervisor' : currentRole;

  return (
    <div className="w-full flex flex-col space-y-5 select-none">
      {/* Page Heading */}
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
                Pending Bookings
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {unpaidBookings.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and confirm pending ticket bookings
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center space-x-2">
            <span>Operator: <strong>{currentStaffName}</strong></span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Pending Tickets
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">
              {filtered.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Full Set Tickets
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">
              {fullTicketsCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Half Set Tickets
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">
              {halfTicketsCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ticket number, customer name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-medium text-slate-800"
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

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Set Type:</span>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All (Full Set & Half Set)</option>
            <option value="full">Full Set Only</option>
            <option value="half">Half Set Only</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-3 px-4 text-center">S.No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-center">Ticket #</th>
                <th className="py-3 px-4 text-center">Set Type</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-500 text-center">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{item.customerName}</div>
                    {item.customerPhone && (
                      <div className="text-slate-500 text-xs flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.customerPhone}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2.5 py-1 rounded border border-slate-200 inline-block">
                      #{item.ticketNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1.5">
                      {item.halfSelected && (
                        <span className="font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs">
                          Half Set
                        </span>
                      )}
                      {item.fullSelected && (
                        <span className="font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs">
                          Full Set
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      Pending
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleOpenConfirm(item)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm</span>
                      </button>

                      <button
                        onClick={() => setSelectedBookingForCancel(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
          <div className="py-16 text-center space-y-1.5">
            <h3 className="font-bold text-sm text-slate-800">No Pending Bookings</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {unpaidBookings.length === 0
                ? 'All booked tickets have been confirmed.'
                : 'No records match your search filter.'}
            </p>
          </div>
        )}
      </div>

      {/* Confirm Booking Modal */}
      {selectedBookingForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-lg overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">
                Confirm Ticket Booking
              </span>
              <button
                onClick={() => setSelectedBookingForPay(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteConfirm} className="p-5 space-y-4">
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ticket Number:</span>
                  <span className="font-mono font-bold text-slate-900">
                    #{selectedBookingForPay.ticketNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedBookingForPay.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-semibold text-slate-800 uppercase">
                    {selectedBookingForPay.ticketType}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks (Optional):
                </label>
                <input
                  type="text"
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  placeholder="Add verification note..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              {paymentError && (
                <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-medium">
                  {paymentError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForPay(null)}
                  className="py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {selectedBookingForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-lg overflow-hidden border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Cancel Booking #{selectedBookingForCancel.ticketNumber}
              </h3>
              <button
                onClick={() => setSelectedBookingForCancel(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteCancel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cancellation Reason:
                </label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForCancel(null)}
                  className="py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  className="py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
                >
                  Cancel Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
