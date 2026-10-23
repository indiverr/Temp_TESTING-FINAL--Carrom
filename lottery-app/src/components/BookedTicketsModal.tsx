import React, { useState } from 'react';
import { X, Search, Printer, Download, CheckCircle, Clock, User, Phone, Trash2 } from 'lucide-react';
import { TicketItem } from '../types';

interface BookedTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Record<string, TicketItem>;
  currentDate: string;
  onCancelBooking?: (ticketNum: string) => void;
}

export const BookedTicketsModal: React.FC<BookedTicketsModalProps> = ({
  isOpen,
  onClose,
  tickets,
  currentDate,
  onCancelBooking,
}) => {
  const [filterSearch, setFilterSearch] = useState('');

  if (!isOpen) return null;

  const bookedTickets = Object.values(tickets).filter(
    (t) => t.status === 'booked' && t.date === currentDate
  );

  const filtered = bookedTickets.filter(
    (t) =>
      t.number.includes(filterSearch) ||
      (t.customerName && t.customerName.toLowerCase().includes(filterSearch.toLowerCase())) ||
      (t.bookedByEmployeeName &&
        t.bookedByEmployeeName.toLowerCase().includes(filterSearch.toLowerCase()))
  );

  const totalCollected = bookedTickets.reduce((acc, curr) => acc + curr.price, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-4 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base tracking-wide flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-300" />
              <span>Booked Tickets Registry</span>
            </h3>
            <p className="text-xs text-blue-100 mt-0.5">
              Draw Date: <span className="font-bold">{currentDate}</span> • {bookedTickets.length} sold
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats summary bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 grid grid-cols-2 gap-2 text-center">
          <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Tickets Sold</span>
            <span className="text-lg font-black text-blue-600">{bookedTickets.length}</span>
          </div>
          <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Revenue</span>
            <span className="text-lg font-black text-emerald-600">₹{totalCollected}</span>
          </div>
        </div>

        {/* Search within booked */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket #, customer, agent..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {/* List of booked tickets */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {bookedTickets.length === 0
                ? 'No tickets booked yet for this draw.'
                : 'No booked tickets match your query.'}
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs hover:border-blue-300 transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono font-black text-sm flex items-center justify-center shadow-sm">
                    {item.number}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-xs text-slate-800">
                        {item.customerName || 'Walk-in Customer'}
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                        ₹{item.price}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-1">
                      {item.customerPhone && (
                        <span className="flex items-center space-x-0.5">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{item.customerPhone}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-0.5">
                        <User className="w-2.5 h-2.5" />
                        <span>{item.bookedByEmployeeName || 'Agent'}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-[9px] text-slate-400 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{item.bookedAt || 'Recently'}</span>
                    </div>
                  </div>
                </div>

                {onCancelBooking && (
                  <button
                    onClick={() => onCancelBooking(item.number)}
                    title="Cancel Booking"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 flex items-center space-x-1.5 active:scale-95 transition-all shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl active:scale-95 transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
