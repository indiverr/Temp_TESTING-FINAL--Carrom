import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  X,
  Phone,
  Eye,
  History,
  ShieldAlert,
  FileCheck2,
  Filter,
  Layers,
  Copy,
  Hash,
  User,
} from 'lucide-react';
import { TicketBooking, LoginType } from '../types';

interface PaidTicketsScreenProps {
  paidBookings: TicketBooking[];
  allBookings?: TicketBooking[];
  initialSearchQuery?: string;
  currentStaffName?: string;
  currentRole: LoginType;
  onReversePayment: (ticketNum: string, reason: string) => void;
  onBack: () => void;
}

export const PaidTicketsScreen: React.FC<PaidTicketsScreenProps> = ({
  paidBookings,
  allBookings = [],
  initialSearchQuery = '',
  currentRole,
  onReversePayment,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [typeFilter, setTypeFilter] = useState<'all' | 'full' | 'half'>('all');
  const [inspectBooking, setInspectBooking] = useState<TicketBooking | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(code);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopiedId(code);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const filtered = paidBookings.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const qDigits = q.replace(/^#/, '');
    const cid = String(item.customerId || '').toLowerCase();
    const cidDigits = cid.replace(/^#/, '');
    const bookedByUser = String(item.bookedByUsername || item.bookedBy || '').toLowerCase();

    const matchesSearch =
      !q ||
      cid.includes(q) ||
      (qDigits.length > 0 && cidDigits === qDigits) ||
      item.ticketNumber.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.customerPhone.toLowerCase().includes(q) ||
      bookedByUser.includes(q);

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'full' && item.fullSelected) ||
      (typeFilter === 'half' && item.halfSelected && !item.fullSelected);

    return matchesSearch && matchesType;
  });

  const fullCount = filtered.filter((b) => b.fullSelected).length;
  const halfCount = filtered.filter((b) => b.halfSelected).length;

  const handleExecuteReversal = () => {
    if (!inspectBooking || !reversalReason.trim()) return;
    onReversePayment(inspectBooking.ticketNumber, reversalReason.trim());
    setInspectBooking(null);
    setReversalReason('');
    setIsReversing(false);
  };

  const inspectCustomerBookings = inspectBooking
    ? (allBookings.length > 0 ? allBookings : paidBookings).filter(
        (b) =>
          b.customerId &&
          b.customerId === inspectBooking.customerId &&
          b.bookingStatus === 'Booked'
      )
    : [];

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
                Confirmed Bookings
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {paidBookings.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified ticket registrations with permanent Customer Serial Codes
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Confirmed Tickets
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">
              {filtered.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Full Set Tickets
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">
              {fullCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Half Set Tickets
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">
              {halfCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filtering Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Customer ID (#5316), customer name, username, phone, or ticket #..."
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-3 px-4 text-center">S.No</th>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-center">Ticket #</th>
                <th className="py-3 px-4 text-center">Set Type</th>
                <th className="py-3 px-4 text-center">Confirmed At</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filtered.map((item, idx) => {
                const customerId = item.customerId || '#5101';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 text-center">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSearchQuery(customerId)}
                          className="font-mono font-bold text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded transition-colors"
                          title="Filter all bookings for this Customer ID"
                        >
                          {customerId}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(customerId)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded"
                          title="Copy Customer ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {copiedId === customerId && (
                          <span className="text-[10px] font-bold text-emerald-600">Copied</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.customerName}</div>
                      {item.customerPhone && (
                        <div className="text-slate-500 text-xs flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{item.customerPhone}</span>
                        </div>
                      )}
                      <div className="text-slate-400 text-[11px] flex items-center space-x-1 mt-0.5">
                        <User className="w-2.5 h-2.5" />
                        <span>By: {item.bookedByUsername || item.bookedBy}</span>
                      </div>
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
                    <td className="py-3 px-4 text-center text-xs text-slate-500 whitespace-nowrap">
                      {item.paidAt || item.bookedAt}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Confirmed
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setInspectBooking(item)}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center space-y-1.5">
            <h3 className="font-bold text-sm text-slate-800">No Confirmed Bookings</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Confirmed bookings will appear here once verified.
            </p>
          </div>
        )}
      </div>

      {/* Record Detail Modal */}
      {inspectBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-slate-200 p-5 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900">
                Booking Record #{inspectBooking.ticketNumber}
              </span>
              <button
                onClick={() => {
                  setInspectBooking(null);
                  setIsReversing(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Customer ID:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {inspectBooking.customerId || '#5101'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(inspectBooking.customerId || '#5101')}
                      className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600"
                      title="Copy Customer ID"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-900">{inspectBooking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-medium text-slate-700">{inspectBooking.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Booked By:</span>
                  <span className="font-medium text-slate-700">
                    {inspectBooking.bookedByUsername || inspectBooking.bookedBy}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ticket Type:</span>
                  <span className="font-semibold text-slate-800 uppercase">{inspectBooking.ticketType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Confirmed At:</span>
                  <span className="text-slate-700">{inspectBooking.paidAt || inspectBooking.bookedAt}</span>
                </div>
              </div>

              {/* All Bookings for this Customer ID */}
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-2 flex items-center space-x-1.5">
                  <Hash className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    All Bookings for Customer {inspectBooking.customerId || '#5101'} ({inspectCustomerBookings.length})
                  </span>
                </span>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  {inspectCustomerBookings.map((b) => (
                    <span
                      key={b.id}
                      className={`font-mono text-xs font-bold px-2 py-1 rounded border ${
                        b.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      #{b.ticketNumber} ({b.paymentStatus})
                    </span>
                  ))}
                </div>
              </div>

              {/* Activity Log */}
              {inspectBooking.history.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-800 block mb-2 flex items-center space-x-1.5">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>Activity Log</span>
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {inspectBooking.history.map((hist) => (
                      <div
                        key={hist.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-900">{hist.action}</span>
                          <span className="text-slate-400 text-[11px]">{hist.timestamp}</span>
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          By: <span className="font-medium text-slate-700">{hist.performedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Reversal */}
              {currentRole === 'admin' && (
                <div className="pt-3 border-t border-slate-100">
                  {!isReversing ? (
                    <button
                      onClick={() => setIsReversing(true)}
                      className="w-full py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 font-semibold text-xs hover:bg-rose-100 transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Revert to Pending</span>
                    </button>
                  ) : (
                    <div className="space-y-2.5 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                      <span className="text-xs font-semibold text-rose-800 block">
                        Reason for Reversal:
                      </span>
                      <input
                        type="text"
                        value={reversalReason}
                        onChange={(e) => setReversalReason(e.target.value)}
                        placeholder="Enter reason..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-md focus:outline-none"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setIsReversing(false)}
                          className="flex-1 py-1.5 rounded-md border border-slate-200 text-xs font-semibold bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleExecuteReversal}
                          className="flex-1 py-1.5 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
