import React, { useState } from 'react';
import {
  Calendar,
  Image as ImageIcon,
  Search,
  Check,
  X,
  Download,
  Trash2,
} from 'lucide-react';
import { TicketBooking, SelectedTicketItem, SystemConfig, LoginType } from '../types';

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
  const [customerName, setCustomerName] = useState('Sasikaran');
  const [customerPhone, setCustomerPhone] = useState('99493119');

  // Multi-select
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMultiTickets, setSelectedMultiTickets] = useState<SelectedTicketItem[]>([]);
  const [isMultiBookModalOpen, setIsMultiBookModalOpen] = useState(false);

  // Success / error popups
  const [successTicket, setSuccessTicket] = useState<string | null>(null);
  const [alreadyBookedNum, setAlreadyBookedNum] = useState<string | null>(null);

  // 0000 to 0024
  const quickNumbers = Array.from({ length: 25 }, (_, i) =>
    i.toString().padStart(4, '0')
  );

  const isTicketBooked = (num: string) =>
    bookedTickets.some((b) => b.ticketNumber === num && b.bookingStatus === 'Booked');

  const handleTicketClick = (num: string) => {
    if (isMultiSelectMode) {
      handleToggleMultiSelect(num);
      return;
    }
    if (isTicketBooked(num)) {
      setAlreadyBookedNum(num);
      return;
    }
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
      if (updated.length === 0) setIsMultiSelectMode(false);
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

  const trimmedSearch = searchQuery.trim();
  const isSpecificSearch = trimmedSearch.length > 0;
  const filteredNumbers = isSpecificSearch
    ? [trimmedSearch.padStart(4, '0')]
    : quickNumbers;

  return (
    <div className="w-full flex flex-col space-y-5 select-none">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {config.seriesTitle}
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                0000 – 0024
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Draw Date: <strong className="text-slate-700">{config.businessDate}</strong></span>
              <span>•</span>
              <span>Booked: <strong className="text-slate-700">{bookedTickets.length} / 25</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={onExportRecords}
              className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
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
      </div>

      {/* Multi-select Bar */}
      {isMultiSelectMode && (
        <div className="bg-white rounded-lg p-3 flex items-center justify-between shadow-xs border border-blue-200">
          <div className="text-xs font-bold text-slate-800 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Selected: {selectedMultiTickets.length} tickets</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsMultiSelectMode(false);
                setSelectedMultiTickets([]);
              }}
              className="text-xs text-slate-500 font-semibold hover:text-slate-800 px-2 py-1"
            >
              Clear
            </button>
            <button
              onClick={() => setIsMultiBookModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
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
                Book Multiple Tickets ({selectedMultiTickets.length})
              </span>
              <button
                onClick={() => setIsMultiBookModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 max-h-48 overflow-y-auto">
              <table className="w-full text-center text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-2">S.No</th>
                    <th className="py-2 px-2">Ticket #</th>
                    <th className="py-2 px-2">Half</th>
                    <th className="py-2 px-2">Full</th>
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
