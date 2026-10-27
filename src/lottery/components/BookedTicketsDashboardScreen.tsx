import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Trophy,
  FileSpreadsheet,
  Search,
  ArrowLeft,
  ChevronRight,
  Copy,
  Hash,
  Phone,
  User,
  X,
} from 'lucide-react';
import { SystemConfig, TicketBooking } from '../types';

interface BookedTicketsDashboardProps {
  config: SystemConfig;
  allBookings?: TicketBooking[];
  unpaidCount: number;
  paidCount: number;
  winnersCount: number;
  papersCount: number;
  onNavigate: (view: 'unpaid' | 'paid' | 'winners' | 'papers') => void;
  onBack: () => void;
  onSearchTicket: (queryStr: string) => void;
}

export const BookedTicketsDashboardScreen: React.FC<BookedTicketsDashboardProps> = ({
  config,
  allBookings = [],
  unpaidCount,
  paidCount,
  winnersCount,
  papersCount,
  onNavigate,
  onBack,
  onSearchTicket,
}) => {
  const [searchTicket, setSearchTicket] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTicket.trim()) {
      onSearchTicket(searchTicket.trim());
    }
  };

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

  const normalizedQuery = searchTicket.trim().toLowerCase();
  const normalizedDigits = normalizedQuery.replace(/^#/, '');

  const matchingBookings = allBookings.filter((b) => {
    if (!normalizedQuery) return true;
    const cid = String(b.customerId || '').toLowerCase();
    const cidDigits = cid.replace(/^#/, '');
    const tnum = String(b.ticketNumber || '').toLowerCase();
    const cname = String(b.customerName || '').toLowerCase();
    const cphone = String(b.customerPhone || '').toLowerCase();
    const buser = String(b.bookedByUsername || b.bookedBy || '').toLowerCase();
    return (
      cid.includes(normalizedQuery) ||
      (normalizedDigits.length > 0 && cidDigits === normalizedDigits) ||
      tnum.includes(normalizedQuery) ||
      cname.includes(normalizedQuery) ||
      cphone.includes(normalizedQuery) ||
      buser.includes(normalizedQuery)
    );
  });

  const navCards = [
    {
      id: 'unpaid',
      title: 'Pending Bookings',
      subtitle: 'Tickets awaiting confirmation',
      count: unpaidCount,
      icon: FileText,
    },
    {
      id: 'paid',
      title: 'Confirmed Bookings',
      subtitle: 'Verified ticket registrations',
      count: paidCount,
      icon: CheckCircle2,
    },
    {
      id: 'winners',
      title: 'Draw Winners',
      subtitle: 'Official winning ticket numbers',
      count: winnersCount,
      icon: Trophy,
    },
    {
      id: 'papers',
      title: 'Result Sheets',
      subtitle: 'Uploaded draw result documents',
      count: papersCount,
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="w-full flex flex-col space-y-5 select-none">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Back to Ticket Inventory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Bookings Overview
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {config.seriesTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage ticket bookings, Customer Serial Codes (#5316+), confirmations, winners, and result sheets
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
            Draw Date: <strong className="text-slate-900">{config.businessDate}</strong>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-5">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by Customer ID (#5316), customer name, username, phone, or ticket #..."
            value={searchTicket}
            onChange={(e) => setSearchTicket(e.target.value)}
            className="w-full pl-10 pr-28 py-2.5 text-xs bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:border-slate-900 font-medium text-slate-800"
          />
          {searchTicket && (
            <button
              type="button"
              onClick={() => setSearchTicket('')}
              className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors"
          >
            Open List
          </button>
        </form>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {navCards.map((card) => {
            const IconComp = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => onNavigate(card.id as any)}
                className="w-full bg-white rounded-xl p-5 shadow-2xs border border-slate-200 flex flex-col justify-between hover:border-slate-400 transition-colors text-left group min-h-[120px]"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {card.count}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">
                      {card.title}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {card.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* All Customer Bookings Overview Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60">
            <div className="flex items-center space-x-2">
              <Hash className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                Customer Serial Codes & Bookings ({matchingBookings.length})
              </h3>
            </div>
            {searchTicket && (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Filtered by: {searchTicket}
              </span>
            )}
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider whitespace-nowrap sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Customer ID</th>
                  <th className="py-2.5 px-3">Ticket #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Booked By</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {matchingBookings.map((b) => {
                  const cid = b.customerId || '#5101';
                  const isPaid = b.paymentStatus === 'Paid';
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSearchTicket(cid)}
                            className="font-mono font-bold text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded transition-colors"
                            title="Filter all bookings for this Customer ID"
                          >
                            {cid}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(cid)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            title="Copy Customer ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedId === cid && (
                            <span className="text-[10px] font-bold text-emerald-600">Copied</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-200">
                          #{b.ticketNumber}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{b.customerName}</div>
                        {b.customerPhone && (
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{b.customerPhone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                        <div className="inline-flex items-center space-x-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{b.bookedByUsername || b.bookedBy}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onNavigate(isPaid ? 'paid' : 'unpaid')}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isPaid ? 'Confirmed' : 'Pending'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {matchingBookings.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-500">
              No bookings found matching "{searchTicket}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
