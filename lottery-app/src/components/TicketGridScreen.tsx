import React, { useState } from 'react';
import { Search, CheckCircle2, ShoppingBag, Eye, Calendar, Sparkles } from 'lucide-react';
import { TicketItem } from '../types';

interface TicketGridScreenProps {
  date: string;
  tickets: Record<string, TicketItem>;
  selectedTicketNumbers: string[];
  onToggleTicketSelect: (ticketNum: string) => void;
  onOpenBookedTicketsModal: () => void;
  onBookSelectedTickets: () => void;
  onOpenMasterMatrix: () => void;
}

export const TicketGridScreen: React.FC<TicketGridScreenProps> = ({
  date,
  tickets,
  selectedTicketNumbers,
  onToggleTicketSelect,
  onOpenBookedTicketsModal,
  onBookSelectedTickets,
  onOpenMasterMatrix,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Primary 25 numbers: 0000 to 0024 (as displayed in Screenshot 5)
  // or filtered if user searches
  const allNumbers = Object.keys(tickets).sort();
  
  // Default grid shows 0000 to 0024, or search results if typed
  const displayedNumbers = searchQuery.trim()
    ? allNumbers.filter((n) => n.includes(searchQuery.trim())).slice(0, 40)
    : allNumbers.slice(0, 25);

  const bookedCount = Object.values(tickets).filter(
    (t) => t.status === 'booked' && t.date === date
  ).length;

  return (
    <div className="relative min-h-full flex flex-col justify-between px-3 pt-2 pb-3">
      {/* Wave Blue Background effect like screenshot 5 */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#1975e6] via-[#38bdf8] to-transparent -z-10 opacity-70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#0284c7] via-[#38bdf8] to-transparent -z-10 opacity-60 pointer-events-none" />

      {/* Top Header Row with Date Badge & Switch Mode */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black text-slate-800 shadow-sm border border-slate-200 flex items-center space-x-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>{date}</span>
        </div>

        <button
          onClick={onOpenMasterMatrix}
          className="text-[11px] font-bold text-blue-700 bg-white/90 hover:bg-white px-2.5 py-1 rounded-lg shadow-sm border border-blue-200 flex items-center space-x-1"
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Color Matrix Table</span>
        </button>
      </div>

      {/* 5x5 Grid of Number Cards (Screenshot 5 exact recreation) */}
      <div className="flex-1 flex flex-col justify-start">
        <div className="grid grid-cols-5 gap-2 my-auto">
          {displayedNumbers.map((numStr) => {
            const ticket = tickets[numStr];
            const isBooked = ticket?.status === 'booked';
            const isSelected = selectedTicketNumbers.includes(numStr);

            return (
              <button
                key={numStr}
                onClick={() => {
                  if (!isBooked) {
                    onToggleTicketSelect(numStr);
                  }
                }}
                disabled={isBooked}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center font-extrabold text-[15px] sm:text-base transition-all select-none border ${
                  isBooked
                    ? 'bg-rose-50/90 border-rose-300 text-rose-500 cursor-not-allowed opacity-75'
                    : isSelected
                    ? 'bg-gradient-to-b from-blue-600 to-indigo-700 border-blue-700 text-white shadow-md scale-[1.03] ring-2 ring-blue-400'
                    : 'bg-white hover:bg-blue-50/60 border-blue-200/90 text-slate-900 shadow-sm hover:border-blue-400 active:scale-95'
                }`}
                style={{
                  boxShadow: isSelected
                    ? '0 6px 14px -3px rgba(37, 99, 235, 0.4)'
                    : '0 2px 5px rgba(0, 0, 0, 0.04)',
                }}
              >
                {/* 4-digit number */}
                <span>{numStr}</span>

                {/* Sub status badge */}
                {isBooked ? (
                  <span className="text-[8px] font-bold text-rose-600 uppercase tracking-tight mt-0.5">
                    Sold
                  </span>
                ) : isSelected ? (
                  <span className="text-[8px] font-bold text-blue-100 flex items-center space-x-0.5 mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                    <span>Pick</span>
                  </span>
                ) : (
                  <span className="text-[8px] font-medium text-slate-600 mt-0.5">
                    ₹{ticket?.price || 50}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {displayedNumbers.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs">
            No lottery numbers matched "{searchQuery}"
          </div>
        )}
      </div>

      {/* Floating Action bottom group (Screenshot 5 Search + Booked Tickets Button) */}
      <div className="space-y-2 mt-2 pt-1 bg-white/70 backdrop-blur-sm rounded-2xl p-2 border border-white/60 shadow-sm">
        {/* Search bar matching Screenshot 5 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lottery ticket number (e.g. 0012, 0725)..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium text-slate-800 placeholder:text-slate-400 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Selected tickets summary if user chose any */}
        {selectedTicketNumbers.length > 0 && (
          <div className="bg-blue-600 text-white rounded-xl p-2.5 flex items-center justify-between shadow-md">
            <div>
              <span className="text-xs font-extrabold">
                {selectedTicketNumbers.length} Selected (
                {selectedTicketNumbers.join(', ')})
              </span>
              <div className="text-[10px] text-blue-100 font-medium">
                Total: ₹{selectedTicketNumbers.length * 50}
              </div>
            </div>
            <button
              onClick={onBookSelectedTickets}
              className="bg-white text-blue-700 hover:bg-blue-50 font-black text-xs px-3.5 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all flex items-center space-x-1"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Book Now</span>
            </button>
          </div>
        )}

        {/* 3D BOOKED TICKETS Button (Screenshot 5) */}
        <button
          onClick={onOpenBookedTicketsModal}
          className="w-full py-3 px-4 rounded-xl text-white font-black text-sm tracking-wide uppercase transition-all active:scale-[0.98] flex items-center justify-center space-x-2 shadow-lg"
          style={{
            background: 'linear-gradient(180deg, #1d8cf8 0%, #0056d6 100%)',
            boxShadow:
              '0 8px 18px -4px rgba(0, 86, 214, 0.45), inset 0 2px 2px rgba(255, 255, 255, 0.5)',
            border: '1.5px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <Eye className="w-4 h-4 text-white" />
          <span>BOOKED TICKETS ({bookedCount})</span>
        </button>
      </div>
    </div>
  );
};
