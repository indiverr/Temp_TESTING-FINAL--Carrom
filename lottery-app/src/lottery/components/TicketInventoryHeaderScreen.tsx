import React, { useState } from 'react';
import {
  Calendar,
  Image as ImageIcon,
  Search,
  Check,
  X,
  Download,
  Trash2,
  CheckSquare,
} from 'lucide-react';
import { TicketBooking, SelectedTicketItem, SystemConfig, LoginType } from '../types';
import { LOTTERY_COLUMNS_SPEC } from '../mockData';

interface TicketInventoryHeaderProps {
  config: SystemConfig;
  bookedTickets: TicketBooking[];
  currentRole: LoginType;
  onBookSingleTicket: (ticketNum: string, name: string, phone: string) => void;
  onBookMultipleTickets: (items: SelectedTicketItem[], name: string, phone: string) => void;
  onOpenBookedTicketsDashboard: () => void;
  onOpenAvailableGallery: () => void;
  onExportRecords: () => void;
}

export const TicketInventoryHeaderScreen: React.FC<TicketInventoryHeaderProps> = ({
  config,
  bookedTickets,
  onBookSingleTicket,
  onBookMultipleTickets,
  onOpenBookedTicketsDashboard,
  onOpenAvailableGallery,
  onExportRecords,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activePopupTicket, setActivePopupTicket] = useState<string | null>(null);
  const [singleHalf, setSingleHalf] = useState(false);
  const [singleFull, setSingleFull] = useState(true);
  const [customerName, setCustomerName] = useState('Sasikaran');
  const [customerPhone, setCustomerPhone] = useState('99493119');

  // Multi-select
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [defaultSetType, setDefaultSetType] = useState<'full' | 'half' | 'both'>('full');
  const [selectedMultiTickets, setSelectedMultiTickets] = useState<SelectedTicketItem[]>([]);
  const [isMultiBookModalOpen, setIsMultiBookModalOpen] = useState(false);

  // Active series column from LOTTERY_COLUMNS_SPEC (default 0000 - 0024)
  const [selectedColumnId, setSelectedColumnId] = useState<string>(
    LOTTERY_COLUMNS_SPEC[0]?.id || 'c0'
  );

  // Success / error popups
  const [successTicket, setSuccessTicket] = useState<string | null>(null);
  const [alreadyBookedNum, setAlreadyBookedNum] = useState<string | null>(null);

  const activeColumn =
    LOTTERY_COLUMNS_SPEC.find((c) => c.id === selectedColumnId) || LOTTERY_COLUMNS_SPEC[0];

  // 25 numbers for the active series column
  const quickNumbers = Array.from({ length: 25 }, (_, i) =>
    (activeColumn.startRange + i).toString().padStart(4, '0')
  );

  const isTicketBooked = (num: string) =>
    bookedTickets.some((b) => b.ticketNumber === num && b.bookingStatus === 'Booked');

  const getDefaultSetFlags = () => ({
    half: defaultSetType === 'half' || defaultSetType === 'both',
    full: defaultSetType === 'full' || defaultSetType === 'both',
  });

  const handleTicketClick = (num: string) => {
    if (isMultiSelectMode) {
      handleToggleMultiSelect(num);
      return;
    }
    if (isTicketBooked(num)) {
      setAlreadyBookedNum(num);
      return;
    }
    setSingleHalf(false);
    setSingleFull(true);
    setActivePopupTicket(num);
  };

  const handleLongPress = (num: string) => {
    if (isTicketBooked(num)) return;
    setIsMultiSelectMode(true);
    if (!selectedMultiTickets.some((t) => t.ticketNumber === num)) {
      const flags = getDefaultSetFlags();
      setSelectedMultiTickets((prev) => [
        ...prev,
        { ticketNumber: num, half: flags.half, full: flags.full },
      ]);
    }
  };

  const handleToggleMultiSelect = (num: string) => {
    if (isTicketBooked(num)) {
      setAlreadyBookedNum(num);
      return;
    }
    if (selectedMultiTickets.some((t) => t.ticketNumber === num)) {
      const updated = selectedMultiTickets.filter((t) => t.ticketNumber !== num);
      setSelectedMultiTickets(updated);
    } else {
      const flags = getDefaultSetFlags();
      setSelectedMultiTickets((prev) => [
        ...prev,
        { ticketNumber: num, half: flags.half, full: flags.full },
      ]);
    }
  };

  const handleConfirmSingleBook = () => {
    if (!activePopupTicket) return;
    if (!singleHalf && !singleFull) return;
    onBookMultipleTickets(
      [{ ticketNumber: activePopupTicket, half: singleHalf, full: singleFull }],
      customerName,
      customerPhone
    );
    const bookedNum = activePopupTicket;
    setActivePopupTicket(null);
    setSuccessTicket(bookedNum);
  };

  const handleConfirmMultiBook = () => {
    if (selectedMultiTickets.length === 0) return;
    const validItems = selectedMultiTickets.map((t) =>
      !t.half && !t.full ? { ...t, full: true } : t
    );
    onBookMultipleTickets(validItems, customerName, customerPhone);
    setIsMultiBookModalOpen(false);
    setIsMultiSelectMode(false);
    setSelectedMultiTickets([]);
    setSuccessTicket(`${validItems.length} Tickets`);
  };

  const trimmedSearch = searchQuery.trim();
  const isSpecificSearch = trimmedSearch.length > 0;
  const filteredNumbers = isSpecificSearch
    ? [trimmedSearch.padStart(4, '0')]
    : quickNumbers;

  return (
    <div className="w-full flex flex-col space-y-5 select-none">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {config.seriesTitle}
              </h2>
              <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                {activeColumn.rangeLabel}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Draw Date: <strong className="text-slate-700">{config.businessDate}</strong></span>
              <span>•</span>
              <span>
                Series Booked:{' '}
                <strong className="text-slate-700">
                  {quickNumbers.filter((n) => isTicketBooked(n)).length} / 25
                </strong>
              </span>
              <span>•</span>
              <span>
                Total Booked: <strong className="text-slate-700">{bookedTickets.length}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onExportRecords}
              className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                if (isMultiSelectMode && selectedMultiTickets.length > 0) {
                  setIsMultiBookModalOpen(true);
                } else {
                  setIsMultiSelectMode((prev) => !prev);
                  if (isMultiSelectMode) setSelectedMultiTickets([]);
                }
              }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border ${
                isMultiSelectMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>
                {isMultiSelectMode
                  ? selectedMultiTickets.length > 0
                    ? `Multi Book (${selectedMultiTickets.length})`
                    : 'Multi Booking Active'
                  : 'Multi Book'}
              </span>
            </button>

            <button
              onClick={onOpenAvailableGallery}
              className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Available Sheet</span>
            </button>
          </div>
        </div>

        {/* Series Range Selector matching Available Sheet columns */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 shrink-0">
            Series:
          </span>
          {LOTTERY_COLUMNS_SPEC.map((col) => {
            const isActive = col.id === activeColumn.id;
            return (
              <button
                key={col.id}
                onClick={() => setSelectedColumnId(col.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold whitespace-nowrap transition-colors border shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {col.rangeLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-select Bar */}
      {isMultiSelectMode && (
        <div className="bg-white rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border border-blue-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs font-bold text-slate-800 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>
                {selectedMultiTickets.length === 0
                  ? 'Tap ticket numbers below to select for Multi Booking'
                  : `Selected: ${selectedMultiTickets.length} ticket(s)`}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 px-1.5">Set Type:</span>
              <button
                type="button"
                onClick={() => {
                  setDefaultSetType('half');
                  setSelectedMultiTickets((prev) =>
                    prev.map((t) => ({ ...t, half: true, full: false }))
                  );
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  defaultSetType === 'half'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Half Set
              </button>
              <button
                type="button"
                onClick={() => {
                  setDefaultSetType('full');
                  setSelectedMultiTickets((prev) =>
                    prev.map((t) => ({ ...t, half: false, full: true }))
                  );
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  defaultSetType === 'full'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Full Set
              </button>
              <button
                type="button"
                onClick={() => {
                  setDefaultSetType('both');
                  setSelectedMultiTickets((prev) =>
                    prev.map((t) => ({ ...t, half: true, full: true }))
                  );
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  defaultSetType === 'both'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Half + Full Set
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={() => {
                setIsMultiSelectMode(false);
                setSelectedMultiTickets([]);
              }}
              className="text-xs text-slate-500 font-semibold hover:text-slate-800 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white"
            >
              Cancel
            </button>
            <button
              disabled={selectedMultiTickets.length === 0}
              onClick={() => setIsMultiBookModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold px-3.5 py-1.5 rounded-md transition-colors"
            >
              Book Selected ({selectedMultiTickets.length})
            </button>
          </div>
        </div>
      )}

      {/* Ticket Grid */}
      <div className="flex-1 flex flex-col justify-center my-1">
        {isSpecificSearch ? (
          <div className="my-auto flex flex-col items-center justify-center py-6">
            {filteredNumbers.map((numStr) => {
              const booked = isTicketBooked(numStr);
              return (
                <div key={numStr} className="text-center">
                  <button
                    onClick={() => handleTicketClick(numStr)}
                    className={`w-36 h-24 rounded-xl flex items-center justify-center font-mono font-bold text-2xl transition-colors border ${
                      booked
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-900 border-slate-300 hover:border-blue-600'
                    }`}
                  >
                    {numStr}
                  </button>
                  <span className="text-xs font-medium text-slate-500 mt-2 block">
                    {booked ? 'Status: Booked' : 'Click number to book'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3 my-auto max-w-2xl mx-auto w-full py-2">
            {quickNumbers.map((numStr) => {
              const booked = isTicketBooked(numStr);
              const isSelected = selectedMultiTickets.some(
                (t) => t.ticketNumber === numStr
              );

              return (
                <button
                  key={numStr}
                  onClick={() => handleTicketClick(numStr)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleLongPress(numStr);
                  }}
                  className={`aspect-square max-w-[95px] mx-auto w-full rounded-xl flex flex-col items-center justify-center font-mono font-bold text-base sm:text-lg transition-colors select-none border relative ${
                    booked
                      ? 'bg-slate-900 text-white border-slate-900'
                      : isSelected
                      ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200'
                      : 'bg-white text-slate-900 hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1.5 text-white">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}
                  <span className={isSelected ? 'mt-2' : ''}>{numStr}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Search & Booked Tickets Bar */}
      <div className="space-y-2.5 mt-2 bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs max-w-2xl mx-auto w-full">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket number (e.g. 0012)..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-medium text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onOpenBookedTicketsDashboard}
          className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide uppercase transition-colors flex items-center justify-center space-x-2"
        >
          <span>Booked Tickets ({bookedTickets.length})</span>
        </button>
      </div>

      {/* Single Ticket Booking Modal */}
      {activePopupTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-lg overflow-hidden border border-slate-200 p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900">Book Ticket</span>
              <button
                onClick={() => setActivePopupTicket(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center mb-4">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                Ticket Number
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 tracking-wider">
                {activePopupTicket}
              </span>
              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                {config.seriesTitle}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Set Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !singleHalf;
                      setSingleHalf(next);
                      if (!next && !singleFull) setSingleFull(true);
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-colors ${
                      singleHalf
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={singleHalf}
                      readOnly
                      className="w-3.5 h-3.5 rounded pointer-events-none"
                    />
                    <span>Half Set</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !singleFull;
                      setSingleFull(next);
                      if (!next && !singleHalf) setSingleHalf(true);
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-colors ${
                      singleFull
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={singleFull}
                      readOnly
                      className="w-3.5 h-3.5 rounded pointer-events-none"
                    />
                    <span>Full Set</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-medium"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmSingleBook}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      )}

      {/* Multi-Ticket Booking Modal */}
      {isMultiBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-slate-200 p-5 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900">
                Multi Ticket Booking ({selectedMultiTickets.length})
              </span>
              <button
                onClick={() => setIsMultiBookModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Set Type Batch Buttons */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3">
              <span className="text-xs font-semibold text-slate-600">Apply to all:</span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedMultiTickets((prev) =>
                      prev.map((t) => ({ ...t, half: true, full: false }))
                    )
                  }
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  All Half Set
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedMultiTickets((prev) =>
                      prev.map((t) => ({ ...t, half: false, full: true }))
                    )
                  }
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  All Full Set
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 max-h-48 overflow-y-auto">
              <table className="w-full text-center text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-2">S.No</th>
                    <th className="py-2 px-2">Ticket #</th>
                    <th className="py-2 px-2">Half Set</th>
                    <th className="py-2 px-2">Full Set</th>
                    <th className="py-2 px-2">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedMultiTickets.map((item, idx) => (
                    <tr key={item.ticketNumber} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2 text-slate-500">{idx + 1}</td>
                      <td className="py-1.5 px-2 font-bold font-mono text-slate-900">
                        {item.ticketNumber}
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="checkbox"
                          checked={item.half}
                          onChange={() =>
                            setSelectedMultiTickets((prev) =>
                              prev.map((t) =>
                                t.ticketNumber === item.ticketNumber ? { ...t, half: !t.half } : t
                              )
                            )
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="checkbox"
                          checked={item.full}
                          onChange={() =>
                            setSelectedMultiTickets((prev) =>
                              prev.map((t) =>
                                t.ticketNumber === item.ticketNumber ? { ...t, full: !t.full } : t
                              )
                            )
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <button
                          onClick={() => {
                            const updated = selectedMultiTickets.filter(
                              (t) => t.ticketNumber !== item.ticketNumber
                            );
                            setSelectedMultiTickets(updated);
                            if (updated.length === 0) {
                              setIsMultiBookModalOpen(false);
                              setIsMultiSelectMode(false);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-medium"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmMultiBook}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
            >
              Confirm Booking ({selectedMultiTickets.length})
            </button>
          </div>
        </div>
      )}

      {/* Booking Confirmed Dialog */}
      {successTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-xs rounded-xl p-5 shadow-lg text-center border border-slate-200">
            <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              Booking Recorded
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ticket <span className="font-bold text-slate-800">{successTicket}</span> has been registered.
            </p>
            <button
              onClick={() => setSuccessTicket(null)}
              className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Already Booked Dialog */}
      {alreadyBookedNum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-xs rounded-xl p-5 shadow-lg text-center border border-slate-200 relative">
            <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <X className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              Ticket Unavailable
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ticket <span className="font-bold text-slate-800">{alreadyBookedNum}</span> is already booked.
            </p>
            <button
              onClick={() => setAlreadyBookedNum(null)}
              className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
