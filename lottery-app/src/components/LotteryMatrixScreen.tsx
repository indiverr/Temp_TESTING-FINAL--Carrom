import React, { useState } from 'react';
import { Search, ArrowLeft, Filter, CheckCircle2, Ticket } from 'lucide-react';
import { LOTTERY_COLUMNS_SPEC } from '../mockData';
import { TicketItem } from '../types';

interface LotteryMatrixScreenProps {
  tickets: Record<string, TicketItem>;
  selectedTicketNumbers: string[];
  onToggleTicketSelect: (ticketNum: string) => void;
  onClose: () => void;
  onBookSelectedTickets: () => void;
}

export const LotteryMatrixScreen: React.FC<LotteryMatrixScreenProps> = ({
  tickets,
  selectedTicketNumbers,
  onToggleTicketSelect,
  onClose,
  onBookSelectedTickets,
}) => {
  const [filterColumn, setFilterColumn] = useState<string>('all');
  const [searchNumber, setSearchNumber] = useState<string>('');

  // 25 rows per column (from range 0 to 24)
  const rowCount = 25;

  const visibleColumns =
    filterColumn === 'all'
      ? LOTTERY_COLUMNS_SPEC
      : LOTTERY_COLUMNS_SPEC.filter((col) => col.id === filterColumn);

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none">
      {/* Matrix Top Header */}
      <div className="bg-slate-900 text-white px-3 py-2 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-400">
              Lottery Master Chart
            </h2>
            <p className="text-[10px] text-slate-400">13 Series • 25 Numbers Each</p>
          </div>
        </div>

        {selectedTicketNumbers.length > 0 && (
          <button
            onClick={onBookSelectedTickets}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-md text-[11px] font-bold shadow transition-all active:scale-95"
          >
            Book ({selectedTicketNumbers.length})
          </button>
        )}
      </div>

      {/* Filter and quick search row */}
      <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter matrix numbers..."
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            className="w-full pl-8 pr-2 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={filterColumn}
            onChange={(e) => setFilterColumn(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All 13 Columns</option>
            {LOTTERY_COLUMNS_SPEC.map((c) => (
              <option key={c.id} value={c.id}>
                {c.rangeLabel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrollable Matrix Table replicating Screenshot 4 */}
      <div className="flex-1 overflow-x-auto overflow-y-auto border-t border-slate-200">
        <table className="w-full border-collapse text-center">
          {/* Header row with distinct colors */}
          <thead className="sticky top-0 z-20 shadow-sm">
            <tr>
              {visibleColumns.map((col) => {
                const [start, end] = col.rangeLabel.split(' - ');
                return (
                  <th
                    key={col.id}
                    style={{ backgroundColor: col.headerBg }}
                    className="p-1.5 border border-slate-400 text-white font-extrabold text-[11px] min-w-[70px] whitespace-nowrap shadow-inner"
                  >
                    <div className="leading-tight drop-shadow-sm">{start}</div>
                    <div className="text-[9px] opacity-80">-</div>
                    <div className="leading-tight drop-shadow-sm">{end}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* 25 Rows body */}
          <tbody className="divide-y divide-slate-200 font-mono text-xs font-bold">
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50">
                {visibleColumns.map((col) => {
                  const numberVal = col.startRange + rowIndex;
                  const numStr = numberVal.toString().padStart(4, '0');
                  const ticket = tickets[numStr];
                  const isBooked = ticket?.status === 'booked';
                  const isSelected = selectedTicketNumbers.includes(numStr);

                  // Highlight when search query matches
                  const isMatch =
                    searchNumber.trim() && numStr.includes(searchNumber.trim());

                  return (
                    <td
                      key={col.id}
                      onClick={() => {
                        if (!isBooked) onToggleTicketSelect(numStr);
                      }}
                      style={{
                        color: isBooked ? '#94a3b8' : isSelected ? '#ffffff' : col.textColor,
                      }}
                      className={`p-1.5 border border-slate-300 font-extrabold text-[12px] cursor-pointer transition-colors relative ${
                        isBooked
                          ? 'bg-slate-100 line-through decoration-rose-500 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'bg-blue-600 !text-white'
                          : isMatch
                          ? 'bg-amber-100 ring-2 ring-amber-400'
                          : 'bg-white hover:bg-blue-50/50'
                      }`}
                    >
                      <span>{numStr}</span>
                      {isSelected && (
                        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                      {isBooked && (
                        <span className="block text-[8px] no-underline font-sans text-rose-500">
                          Sold
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Matrix bottom legend & action strip */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3 text-[11px] text-slate-600 font-medium">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span>Sold</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Available</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-700 active:scale-95"
        >
          Done
        </button>
      </div>
    </div>
  );
};
