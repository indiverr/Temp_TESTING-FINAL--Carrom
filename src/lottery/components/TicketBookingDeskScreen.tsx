import React, { useState } from 'react';
import {
  Calendar,
  Image as ImageIcon,
  Search,
  Check,
  X,
  AlertCircle,
  Share2,
  Download,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { TicketBooking, SelectedTicketItem } from '../types';

interface TicketBookingDeskScreenProps {
  currentDate: string;
  bookedTickets: TicketBooking[];
  onBookSingleTicket: (ticketNum: string, name: string, phone: string) => void;
  onBookMultipleTickets: (
    items: SelectedTicketItem[],
    name: string,
    phone: string
  ) => void;
  onOpenBookedTickets: () => void;
  onOpenAvailableGallery: () => void;
}

export const TicketBookingDeskScreen: React.FC<TicketBookingDeskScreenProps> = ({
  currentDate,
  bookedTickets,
  onBookSingleTicket,
  onBookMultipleTickets,
  onOpenBookedTickets,
  onOpenAvailableGallery,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Single click popup state
  const [activePopupTicket, setActivePopupTicket] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('Sasikaran');
  const [customerPhone, setCustomerPhone] = useState('99493119');

  // Success dialog state
  const [successTicket, setSuccessTicket] = useState<string | null>(null);

  // Already booked dialog state (User image: Already Booked with red cross)
  const [alreadyBookedNum, setAlreadyBookedNum] = useState<string | null>(null);

  // Multi-select / Long-press state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMultiTickets, setSelectedMultiTickets] = useState<SelectedTicketItem[]>([]);
  const [isMultiBookModalOpen, setIsMultiBookModalOpen] = useState(false);

  // Quick grid: 0000 to 0024 (25 numbers from screenshot 5)
  const quickNumbers = Array.from({ length: 25 }, (_, i) =>
    i.toString().padStart(4, '0')
  );

  const isTicketBooked = (num: string) =>
    bookedTickets.some((b) => b.ticketNumber === num && b.date === currentDate);

  const handleTicketClick = (num: string) => {
    // If in multi-select mode, toggle selection
    if (isMultiSelectMode) {
      handleToggleMultiSelect(num);
      return;
    }

    // Normal click check
    if (isTicketBooked(num)) {
      setAlreadyBookedNum(num);
      return;
    }

    // Open Book Ticket popup for this number
    setActivePopupTicket(num);
  };

  const handleLongPress = (num: string) => {
    if (isTicketBooked(num)) return;

    setIsMultiSelectMode(true);
    if (!selectedMultiTickets.some((t) => t.ticketNumber === num)) {
      setSelectedMultiTickets((prev) => [
        ...prev,
        { ticketNumber: num, half: false, full: true },
      ]);
    }
  };

  const handleToggleMultiSelect = (num: string) => {
    if (isTicketBooked(num)) return;

    if (selectedMultiTickets.some((t) => t.ticketNumber === num)) {
      const updated = selectedMultiTickets.filter((t) => t.ticketNumber !== num);
      setSelectedMultiTickets(updated);
      if (updated.length === 0) {
        setIsMultiSelectMode(false);
      }
    } else {
      setSelectedMultiTickets((prev) => [
        ...prev,
        { ticketNumber: num, half: false, full: true },
      ]);
    }
  };

  const handleConfirmSingleBook = () => {
    if (!activePopupTicket) return;
    onBookSingleTicket(activePopupTicket, customerName, customerPhone);
    const bookedNum = activePopupTicket;
    setActivePopupTicket(null);
    setSuccessTicket(bookedNum);
  };

  const handleConfirmMultiBook = () => {
    if (selectedMultiTickets.length === 0) return;
    onBookMultipleTickets(selectedMultiTickets, customerName, customerPhone);
    setIsMultiBookModalOpen(false);
    setIsMultiSelectMode(false);
    setSelectedMultiTickets([]);
    setSuccessTicket(`${selectedMultiTickets.length} Tickets`);
  };

  const removeMultiItem = (num: string) => {
    const updated = selectedMultiTickets.filter((t) => t.ticketNumber !== num);
    setSelectedMultiTickets(updated);
    if (updated.length === 0) {
      setIsMultiBookModalOpen(false);
      setIsMultiSelectMode(false);
    }
  };

  const toggleHalf = (num: string) => {
    setSelectedMultiTickets((prev) =>
      prev.map((item) =>
        item.ticketNumber === num ? { ...item, half: !item.half, full: !item.half ? false : item.full } : item
      )
    );
  };

  const toggleFull = (num: string) => {
    setSelectedMultiTickets((prev) =>
      prev.map((item) =>
        item.ticketNumber === num ? { ...item, full: !item.full, half: !item.full ? false : item.half } : item
      )
    );
  };

  const selectAllHalf = (checked: boolean) => {
    setSelectedMultiTickets((prev) =>
      prev.map((item) => ({ ...item, half: checked, full: checked ? false : item.full }))
    );
  };

  const selectAllFull = (checked: boolean) => {
    setSelectedMultiTickets((prev) =>
      prev.map((item) => ({ ...item, full: checked, half: checked ? false : item.half }))
    );
  };

  // Search logic from user screenshot:
  // If search matches a single number (e.g. "0099" or "0012"), show only that card
  const trimmedSearch = searchQuery.trim();
  const isSpecificSearch = trimmedSearch.length > 0;
  const filteredNumbers = isSpecificSearch
    ? [trimmedSearch.padStart(4, '0')]
    : quickNumbers;

  return (
    <div className="relative min-h-full flex flex-col justify-between px-3 pt-2 pb-3 select-none">
      {/* Wave Background */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#1975e6] via-[#38bdf8] to-transparent -z-10 opacity-70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#0284c7] via-[#38bdf8] to-transparent -z-10 opacity-60 pointer-events-none" />

      {/* Top Header: Date badge on left, Gallery Image icon on right */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black text-slate-800 shadow-sm border border-slate-200 flex items-center space-x-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>{currentDate}</span>
        </div>

        {/* Gallery Icon Button (Screenshot with Gallery Icon in Top Right) */}
        <button
          onClick={onOpenAvailableGallery}
          className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all border-2 border-white"
          title="Available (Unbooked) Tickets Matrix"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Multi-select active header pill */}
      {isMultiSelectMode && (
        <div className="bg-white rounded-xl p-2 mb-2 flex items-center justify-between shadow-md border border-blue-200 animate-in fade-in">
          <div className="text-xs font-black text-blue-800 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Selected: {selectedMultiTickets.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsMultiSelectMode(false);
                setSelectedMultiTickets([]);
              }}
              className="text-xs text-slate-500 font-bold hover:text-slate-700 px-2 py-0.5"
            >
              Clear
            </button>
            <button
              onClick={() => setIsMultiBookModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-3 py-1 rounded-lg shadow-sm active:scale-95 transition-all"
            >
              Book ({selectedMultiTickets.length})
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Area */}
      <div className="flex-1 flex flex-col justify-center">
        {isSpecificSearch ? (
          /* Single search result display (from User image: 3. Show only that number) */
          <div className="my-auto flex flex-col items-center justify-center py-6">
            {filteredNumbers.map((numStr) => {
              const booked = isTicketBooked(numStr);
              return (
                <div key={numStr} className="text-center">
                  <button
                    onClick={() => handleTicketClick(numStr)}
                    className={`w-36 h-24 rounded-2xl flex items-center justify-center font-black text-2xl transition-all shadow-lg active:scale-95 border-2 ${
                      booked
                        ? 'bg-black text-white border-red-500 ring-2 ring-red-400'
                        : 'bg-white text-slate-900 border-red-500 hover:border-red-600'
                    }`}
                  >
                    {numStr}
                  </button>
                  <span className="text-[11px] font-bold text-slate-500 mt-2 block">
                    {booked ? 'Status: Already Booked' : 'Click number to book'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* 5x5 Number Grid (0000 - 0024) */
          <div className="grid grid-cols-5 gap-2 my-auto">
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
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center font-black text-[15px] sm:text-base transition-all select-none border relative ${
                    booked
                      ? 'bg-black text-white border-slate-900 shadow-inner'
                      : isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                      : 'bg-white text-slate-900 hover:bg-blue-50 border-blue-200/90 shadow-sm'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1 text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                  <span className={isSelected ? 'mt-2' : ''}>{numStr}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Floating Bar: Search Input + BOOKED TICKETS Button */}
      <div className="space-y-2 mt-2 pt-1 bg-white/70 backdrop-blur-sm rounded-2xl p-2 border border-white/60 shadow-sm">
        {/* Search bar matching Screenshot */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search number (e.g. 0099, 0012)..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3D BOOKED TICKETS Button */}
        <button
          onClick={onOpenBookedTickets}
          className="w-full py-3 px-4 rounded-xl text-white font-black text-sm tracking-wide uppercase transition-all active:scale-[0.98] flex items-center justify-center space-x-2 shadow-lg"
          style={{
            background: 'linear-gradient(180deg, #1d8cf8 0%, #0056d6 100%)',
            boxShadow:
              '0 8px 18px -4px rgba(0, 86, 214, 0.45), inset 0 2px 2px rgba(255, 255, 255, 0.5)',
            border: '1.5px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <span>BOOKED TICKETS</span>
        </button>
      </div>

      {/* POPUP 1: Single Ticket Booking Modal (media_1791869817963_dfc64959.jpg) */}
      {activePopupTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-[310px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-4 animate-in zoom-in-95">
            {/* Blue Header Banner */}
            <div className="bg-blue-600 text-white rounded-2xl p-3 flex items-center justify-between mb-3 shadow-sm">
              <span className="font-extrabold text-sm tracking-wide">Book Ticket</span>
              <button
                onClick={() => setActivePopupTicket(null)}
                className="text-white hover:text-slate-200"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Ticket Number Highlight */}
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-2.5 text-center mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Ticket Number
              </span>
              <span className="text-2xl font-black font-mono text-blue-700 tracking-wider">
                {activePopupTicket}
              </span>
            </div>

            {/* Book pill */}
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 text-white text-xs font-bold px-6 py-1.5 rounded-xl shadow-xs">
                Book
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>
            </div>

            {/* Confirm to Book Green Button */}
            <button
              onClick={handleConfirmSingleBook}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
            >
              Confirm to Book
            </button>
          </div>
        </div>
      )}

      {/* POPUP 2: Success Dialog (media_1791869895439_a40451b7.jpg bottom left) */}
      {successTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-[280px] rounded-3xl p-5 shadow-2xl text-center border border-slate-100 animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 mb-1">
              Ticket Booked Successfully!
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-medium">
              Ticket Number <span className="font-black text-slate-900">{successTicket}</span> has been booked.
            </p>
            <button
              onClick={() => setSuccessTicket(null)}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md active:scale-95 transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* POPUP 3: Already Booked Error Modal (media_1791869895439_a40451b7.jpg bottom right) */}
      {alreadyBookedNum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-[280px] rounded-3xl p-5 shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 relative">
            <button
              onClick={() => setAlreadyBookedNum(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
              <X className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 mb-1">
              Already Booked
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-medium">
              Ticket Number <span className="font-black text-slate-900">{alreadyBookedNum}</span> is already booked.
            </p>
            <button
              onClick={() => setAlreadyBookedNum(null)}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md active:scale-95 transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* POPUP 4: Book Tickets (Multiple) Modal with Half / Full Table (media_1791869908594_23057514.jpg) */}
      {isMultiBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-[340px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-4 animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-blue-600 text-white rounded-2xl p-3 flex items-center justify-between mb-3 shadow-sm">
              <span className="font-black text-sm tracking-wide">
                Book Tickets ({selectedMultiTickets.length})
              </span>
              <button
                onClick={() => setIsMultiBookModalOpen(false)}
                className="text-white hover:text-slate-200"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="text-[11px] font-bold text-slate-700 mb-2">
              Selected Numbers
            </div>

            {/* Table of selected numbers with Half / Full checkboxes */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-3 max-h-48 overflow-y-auto">
              <table className="w-full text-center text-xs">
                <thead className="bg-sky-50 text-slate-700 font-bold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-1.5 px-2">S.No</th>
                    <th className="py-1.5 px-2">Ticket Number</th>
                    <th className="py-1.5 px-2">Half</th>
                    <th className="py-1.5 px-2">Full</th>
                    <th className="py-1.5 px-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedMultiTickets.map((item, idx) => (
                    <tr key={item.ticketNumber} className="hover:bg-slate-50">
                      <td className="py-1 px-2 font-bold text-slate-600">{idx + 1}</td>
                      <td className="py-1 px-2 font-black font-mono text-slate-900">
                        {item.ticketNumber}
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="checkbox"
                          checked={item.half}
                          onChange={() => toggleHalf(item.ticketNumber)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="checkbox"
                          checked={item.full}
                          onChange={() => toggleFull(item.ticketNumber)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <button
                          onClick={() => removeMultiItem(item.ticketNumber)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Select All (Half) & Select All (Full) */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <label className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-700 border border-slate-200 rounded-lg p-1.5 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  onChange={(e) => selectAllHalf(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600"
                />
                <span>Select All (Half)</span>
              </label>

              <label className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-700 border border-slate-200 rounded-lg p-1.5 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  onChange={(e) => selectAllFull(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600"
                />
                <span>Select All (Full)</span>
              </label>
            </div>

            {/* Customer Inputs */}
            <div className="space-y-2 mb-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none font-semibold"
                />
              </div>
            </div>

            {/* Confirm to Book Button */}
            <button
              onClick={handleConfirmMultiBook}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md active:scale-95 transition-all"
            >
              Confirm to Book ({selectedMultiTickets.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
