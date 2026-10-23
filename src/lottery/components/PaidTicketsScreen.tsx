import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  FileCheck2,
  Calendar,
  Eye,
  History,
  ShieldAlert,
  DollarSign,
  CheckCircle2,
  Filter,
  Phone,
  Receipt,
} from 'lucide-react';
import { TicketBooking, LoginType } from '../types';

interface PaidTicketsScreenProps {
  paidBookings: TicketBooking[];
  currentRole: LoginType;
  onBack: () => void;
  onReversePayment?: (ticketNum: string, reason: string) => void;
}

export const PaidTicketsScreen: React.FC<PaidTicketsScreenProps> = ({
  paidBookings,
  currentRole,
  onBack,
  onReversePayment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'full' | 'half'>('all');
  const [inspectBooking, setInspectBooking] = useState<TicketBooking | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);

  const filtered = paidBookings.filter((b) => {
    const q = searchQuery.trim().toLowerCase();
    const matchQuery =
      !q ||
      b.ticketNumber.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      (b.customerPhone && b.customerPhone.toLowerCase().includes(q)) ||
      (b.paymentRef && b.paymentRef.toLowerCase().includes(q));

    const matchType =
      typeFilter === 'all'
        ? true
        : typeFilter === 'full'
        ? b.fullSelected
        : b.halfSelected;

    return matchQuery && matchType;
  });

  const totalCollected = filtered.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const avgAmount = filtered.length > 0 ? Math.round(totalCollected / filtered.length) : 0;
  const fullCount = filtered.filter((b) => b.fullSelected).length;
  const halfCount = filtered.filter((b) => b.halfSelected).length;

  const handleExecuteReversal = () => {
    if (!inspectBooking || !onReversePayment) return;
    onReversePayment(inspectBooking.ticketNumber, reversalReason || 'Administrative Adjustment');
    setIsReversing(false);
    setInspectBooking(null);
  };

  return (
    <div className="w-full flex flex-col space-y-6 select-none">
      {/* 1. Page Heading with Breadcrumb & Details */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 shadow-xs transition-all active:scale-95"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Paid Tickets Ledger
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                {paidBookings.length} Verified
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Audited collections ledger with verified payment receipts, transaction timestamps, and immutable logs
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>100% Settled Ledger</span>
          </div>
        </div>
      </div>

      {/* 2. Outstanding & Settlement Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue Collected */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Revenue Collected
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 block font-mono">
              ₹{totalCollected.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 mt-0.5 block">
              Across {filtered.length} verified collections
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 2: Verified Ticket Count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Confirmed Tickets
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block font-mono">
              {filtered.length}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
              Active verified entries
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileCheck2 className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3: Average Ticket Collection */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Average Receipt Value
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block font-mono">
              ₹{avgAmount}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
              Per ticket transaction
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Receipt className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 4: Ticket Split Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Ticket Split
            </span>
            <div className="flex items-center space-x-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200">
                {fullCount} Full
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-black border border-blue-200">
                {halfCount} Half
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 mt-1.5 block">
              Settled ticket breakdown
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Filter className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* 3. Search and Filtering Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ticket #, customer name, phone, or receipt ref ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold text-slate-800"
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
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-bold">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter:</span>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Ticket Types</option>
            <option value="full">Full Tickets Only</option>
            <option value="half">Half Tickets Only</option>
          </select>
        </div>
      </div>

      {/* 4. Full-Width Responsive Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200 text-xs uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-3.5 px-4 text-center">S.No</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4 text-center">Ticket #</th>
                <th className="py-3.5 px-4 text-center">Type</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-right">Amount Paid</th>
                <th className="py-3.5 px-4 text-center">Reference ID</th>
                <th className="py-3.5 px-4 text-center">Payment Status</th>
                <th className="py-3.5 px-4 text-center">Audit Trail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
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
                    <span className="font-mono font-black text-sm bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block shadow-xs">
                      #{item.ticketNumber}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="capitalize px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.ticketType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                    ₹{item.totalAmount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-600 font-mono">
                    ₹{item.amountPaid}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600">
                    <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {item.paymentRef || 'CASH-REC'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Paid & Verified
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => setInspectBooking(item)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all active:scale-95 inline-flex items-center space-x-1 shadow-xs"
                      title="View Audit Trail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Audit Trail</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">No Paid Tickets Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No confirmed payments match your current query. Once customer balances are settled, they will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      {inspectBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-5 animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-4 flex items-center justify-between mb-4 shadow-sm">
              <div>
                <span className="font-black text-base tracking-wide block">
                  Transaction Audit Trail #{inspectBooking.ticketNumber}
                </span>
                <span className="text-[11px] text-emerald-100 font-semibold">
                  Immutable record with cryptographic timestamp
                </span>
              </div>
              <button
                onClick={() => {
                  setInspectBooking(null);
                  setIsReversing(false);
                }}
                className="text-white hover:text-slate-200"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Customer:</span>
                  <span className="font-extrabold text-slate-900">{inspectBooking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Phone:</span>
                  <span className="font-medium text-slate-700">{inspectBooking.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Amount Paid:</span>
                  <span className="font-black text-emerald-600 font-mono text-sm">₹{inspectBooking.amountPaid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Receipt Reference:</span>
                  <span className="font-mono font-bold text-slate-800">{inspectBooking.paymentRef || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Confirmed Timestamp:</span>
                  <span className="text-slate-700">{inspectBooking.paidAt || inspectBooking.bookedAt}</span>
                </div>
              </div>

              {/* Immutable Audit Log */}
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide block mb-2 flex items-center space-x-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Audit History Timeline</span>
                </span>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {inspectBooking.history.map((hist) => (
                    <div
                      key={hist.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-900">{hist.action}</span>
                        <span className="text-slate-400 text-[11px] font-mono">{hist.timestamp}</span>
                      </div>
                      <div className="text-slate-500 mt-1">
                        Performed By: <span className="font-semibold text-slate-800">{hist.performedBy}</span> ({hist.performedByRole})
                      </div>
                      {hist.notes && <div className="text-slate-600 italic mt-1 bg-white p-1.5 rounded border border-slate-100">{hist.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Reversal Section */}
              {currentRole === 'admin' && (
                <div className="pt-3 border-t border-slate-200">
                  {!isReversing ? (
                    <button
                      onClick={() => setIsReversing(true)}
                      className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center space-x-1.5"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Admin Reversal Workflow</span>
                    </button>
                  ) : (
                    <div className="space-y-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
                      <span className="text-xs font-black text-rose-800 block">
                        Reason for Audited Reversal:
                      </span>
                      <input
                        type="text"
                        value={reversalReason}
                        onChange={(e) => setReversalReason(e.target.value)}
                        placeholder="e.g. Accidental mark or approved refund"
                        className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-xl focus:outline-none font-medium"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setIsReversing(false)}
                          className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleExecuteReversal}
                          className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700"
                        >
                          Confirm Reversal
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
