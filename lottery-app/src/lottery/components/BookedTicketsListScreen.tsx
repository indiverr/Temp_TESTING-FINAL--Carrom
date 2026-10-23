import React, { useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { TicketBooking } from '../types';

interface BookedTicketsListScreenProps {
  bookedTickets: TicketBooking[];
  onMarkPaid: (ticketNum: string, paidBy: string) => void;
  onBack: () => void;
}

export const BookedTicketsListScreen: React.FC<BookedTicketsListScreenProps> = ({
  bookedTickets,
  onMarkPaid,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [payingTicket, setPayingTicket] = useState<TicketBooking | null>(null);

  const filtered = bookedTickets.filter(
    (b) =>
      b.ticketNumber.includes(searchQuery.trim()) ||
      b.customerName.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="relative min-h-full flex flex-col bg-white select-none">
      {/* Top Header Wave */}
      <div className="h-16 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 text-white px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBack}
            className="p-1 rounded-full hover:bg-white/20 active:scale-95"
          >
            <span className="text-lg font-black">←</span>
          </button>
          <h2 className="font-black text-sm tracking-wide uppercase">
            BOOKED TICKETS
          </h2>
        </div>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
          {bookedTickets.length} Total
        </span>
      </div>

      {/* Search Bar matching screenshot */}
      <div className="p-3 border-b border-slate-100 bg-white">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ticket # or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table replicating screenshot */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-center text-xs">
          <thead className="bg-sky-100/70 text-slate-800 font-black border-b border-slate-200 text-[11px] sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-2">S. No</th>
              <th className="py-2.5 px-2">Vo Number</th>
              <th className="py-2.5 px-2">Name</th>
              <th className="py-2.5 px-2">Status</th>
              <th className="py-2.5 px-2">Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {filtered.map((item, idx) => {
              const isItemPaid = item.paymentStatus === 'Paid';
              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-2 font-bold text-slate-600">{idx + 1}</td>
                  <td className="py-2.5 px-2 font-black font-mono text-slate-900">
                    {item.ticketNumber}
                  </td>
                  <td className="py-2.5 px-2 font-bold text-slate-800 text-left pl-3">
                    {item.customerName}
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      Booked
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <input
                      type="checkbox"
                      checked={isItemPaid}
                      onChange={() => {
                        if (!isItemPaid) {
                          setPayingTicket(item);
                        }
                      }}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-0 cursor-pointer"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs">
            No booked tickets found matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* Confirm Payment Modal */}
      {payingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-[310px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95">
            <div className="bg-blue-600 text-white p-3 flex items-center justify-between">
              <span className="font-extrabold text-sm tracking-wide">
                Confirm Payment
              </span>
              <button
                onClick={() => setPayingTicket(null)}
                className="text-white hover:text-slate-200"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="flex border-b border-slate-200 p-2">
                  <span className="w-28 text-slate-600 font-bold">Ticket Number :</span>
                  <span className="font-mono font-black text-blue-700 text-sm">
                    {payingTicket.ticketNumber}
                  </span>
                </div>
                <div className="flex border-b border-slate-200 p-2">
                  <span className="w-28 text-slate-600 font-bold">Name :</span>
                  <span className="font-extrabold text-slate-800">
                    {payingTicket.customerName}
                  </span>
                </div>
                <div className="flex border-b border-slate-200 p-2 items-center">
                  <span className="w-28 text-slate-600 font-bold">Status :</span>
                  <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    Booked
                  </span>
                </div>
                <div className="flex border-b border-slate-200 p-2">
                  <span className="w-28 text-slate-600 font-bold">Paid By :</span>
                  <span className="font-extrabold text-slate-800">
                    {payingTicket.customerName}
                  </span>
                </div>
                <div className="flex p-2">
                  <span className="w-28 text-slate-600 font-bold">Booked By :</span>
                  <span className="font-extrabold text-slate-800">
                    {payingTicket.bookedBy || payingTicket.customerName}
                  </span>
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-100 rounded-xl p-2.5 text-center">
                <span className="text-xs font-black text-slate-800">
                  Mark this ticket as PAID?
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPayingTicket(null)}
                  className="py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-all active:scale-95"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onMarkPaid(payingTicket.ticketNumber, payingTicket.customerName);
                    setPayingTicket(null);
                  }}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all active:scale-95 shadow-md shadow-emerald-600/30"
                >
                  PAID
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
