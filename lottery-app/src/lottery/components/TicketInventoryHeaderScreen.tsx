import React, { useState } from 'react';
import {
  Calendar,
  Image as ImageIcon,
  Search,
  Check,
  X,
  Share2,
  Download,
  Trash2,
  QrCode,
  Smartphone,
  Copy,
  AlertCircle,
  ExternalLink,
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
  currentRole,
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

  // Multi-select / Long-press
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMultiTickets, setSelectedMultiTickets] = useState<SelectedTicketItem[]>([]);
  const [isMultiBookModalOpen, setIsMultiBookModalOpen] = useState(false);

  // Success / error popups
  const [successTicket, setSuccessTicket] = useState<string | null>(null);
  const [alreadyBookedNum, setAlreadyBookedNum] = useState<string | null>(null);

  // Payment shortcut dialogs
  const [isGpayModalOpen, setIsGpayModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedGpay, setCopiedGpay] = useState(false);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedGpay(true);
    setTimeout(() => setCopiedGpay(false), 2000);
  };

  const trimmedSearch = searchQuery.trim();
  const isSpecificSearch = trimmedSearch.length > 0;
  const filteredNumbers = isSpecificSearch
    ? [trimmedSearch.padStart(4, '0')]
    : quickNumbers;

  return (
    <div className="w-full flex flex-col space-y-5 select-none">
      {/* TOP HEADER: Configurable Custom Series Name + Date badge + Export + Gallery icon */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Lottery Series
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {config.seriesTitle}
              </h2>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                25 Numbers (0000 - 0024)
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mt-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Draw Date: <strong>{config.businessDate}</strong></span>
              <span>•</span>
              <span>Booked: <strong>{bookedTickets.length} / 25</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            {/* Export action */}
            <button
              onClick={onExportRecords}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all active:scale-95 border border-slate-200 flex items-center space-x-1.5 shadow-xs"
              title="Download / Export Authorized Records"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>

            {/* Gallery modal button */}
            <button
              onClick={onOpenAvailableGallery}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
              title="Available (Unbooked) Matrix"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Matrix Sheet</span>
            </button>
          </div>
        </div>

        {/* Google Pay and QR shortcuts strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => setIsGpayModalOpen(true)}
            className="flex items-center justify-center space-x-2 py-2 px-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-700 text-xs font-bold hover:bg-blue-100 active:scale-95 transition-all"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>GPay Mobile: {config.gpayNumber} ({config.gpayName})</span>
          </button>

          <button
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center justify-center space-x-2 py-2 px-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold hover:bg-emerald-100 active:scale-95 transition-all"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>Show UPI QR Code ({config.upiId})</span>
          </button>
        </div>
      </div>

      {/* Multi-select Header pill */}
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

      {/* Grid numbers */}
      <div className="flex-1 flex flex-col justify-center my-1">
        {isSpecificSearch ? (
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
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5 my-auto max-w-2xl mx-auto w-full py-2">
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
                  className={`aspect-square max-w-[95px] mx-auto w-full rounded-2xl flex flex-col items-center justify-center font-black text-base sm:text-lg transition-all select-none border relative ${
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
      <div className="space-y-2 mt-2 pt-1 bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-white/60 shadow-sm max-w-2xl mx-auto w-full">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search number (e.g. 0099, 0012)..."
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-slate-800 placeholder:text-slate-400"
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

        {/* 3D BOOKED TICKETS Button -> opens Dashboard */}
        <button
          onClick={onOpenBookedTicketsDashboard}
          className="w-full py-3 px-4 rounded-xl text-white font-black text-sm tracking-wide uppercase transition-all active:scale-[0.98] flex items-center justify-center space-x-2 shadow-lg"
          style={{
            background: 'linear-gradient(180deg, #1d8cf8 0%, #0056d6 100%)',
            boxShadow:
              '0 8px 18px -4px rgba(0, 86, 214, 0.45), inset 0 2px 2px rgba(255, 255, 255, 0.5)',
            border: '1.5px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <span>BOOKED TICKETS ({bookedTickets.length})</span>
        </button>
      </div>

      {/* Single Ticket Booking Modal */}
      {activePopupTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-[310px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-4 animate-in zoom-in-95">
            <div className="bg-blue-600 text-white rounded-2xl p-3 flex items-center justify-between mb-3 shadow-sm">
              <span className="font-extrabold text-sm tracking-wide">Book Ticket</span>
              <button
                onClick={() => setActivePopupTicket(null)}
                className="text-white hover:text-slate-200"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-xl p-2.5 text-center mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Ticket Number
              </span>
              <span className="text-2xl font-black font-mono text-blue-700 tracking-wider">
                {activePopupTicket}
              </span>
              <span className="text-[10px] font-semibold text-slate-600 block mt-0.5">
                {config.seriesTitle}
              </span>
            </div>

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

            <button
              onClick={handleConfirmSingleBook}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
            >
              Confirm to Book
            </button>
          </div>
        </div>
      )}

      {/* Multi-Ticket Booking Modal */}
      {isMultiBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-[340px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-4 animate-in zoom-in-95 flex flex-col max-h-[85vh]">
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

            <div className="border border-slate-200 rounded-xl overflow-hidden mb-3 max-h-44 overflow-y-auto">
              <table className="w-full text-center text-xs">
                <thead className="bg-sky-50 text-slate-700 font-bold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-1.5 px-2">S.No</th>
                    <th className="py-1.5 px-2">Ticket #</th>
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
                      <td className="py-1 px-2">
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
                      <td className="py-1 px-2">
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

            <button
              onClick={handleConfirmMultiBook}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md active:scale-95 transition-all"
            >
              Confirm to Book ({selectedMultiTickets.length})
            </button>
          </div>
        </div>
      )}

      {/* Success Dialog */}
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

      {/* Already Booked Error Modal */}
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

      {/* GPay Number Modal (Requirement E: Payment instruction only, never auto-marks as paid) */}
      {isGpayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-[320px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95">
            <div className="bg-blue-600 text-white p-3.5 flex items-center justify-between">
              <span className="font-black text-sm tracking-wide">Google Pay Recipient</span>
              <button onClick={() => setIsGpayModalOpen(false)} className="text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">GPay Mobile Number</span>
                <span className="text-xl font-mono font-black text-blue-700 tracking-wider block mt-0.5">
                  {config.gpayNumber}
                </span>
                <span className="text-xs font-semibold text-slate-700 block mt-1">
                  Recipient: {config.gpayName}
                </span>
                <span className="text-[11px] font-mono text-slate-500 block">
                  UPI ID: {config.upiId}
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start space-x-2 text-[11px] text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Notice:</strong> Launching UPI or copying numbers provides payment instructions only. Transactions remain pending until verified.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => copyToClipboard(config.gpayNumber)}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center space-x-1.5 active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedGpay ? 'Copied!' : 'Copy Number'}</span>
                </button>
                <a
                  href={`upi://pay?pa=${config.upiId}&pn=${encodeURIComponent(config.gpayName)}&cu=INR`}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 active:scale-95 text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open UPI</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal (Requirement E) */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-[320px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95">
            <div className="bg-emerald-600 text-white p-3.5 flex items-center justify-between">
              <span className="font-black text-sm tracking-wide">UPI QR Code</span>
              <button onClick={() => setIsQrModalOpen(false)} className="text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl inline-block mx-auto">
                <img
                  src={config.qrCodeUrl}
                  alt="UPI QR Code"
                  className="w-44 h-44 object-contain mx-auto"
                />
              </div>

              <div>
                <span className="font-extrabold text-sm text-slate-800 block">{config.gpayName}</span>
                <span className="text-xs font-mono text-slate-500 font-bold block">{config.upiId}</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-800 text-left">
                Scan using Google Pay, PhonePe, or Paytm. Displaying QR code is not proof of payment.
              </div>

              <button
                onClick={() => setIsQrModalOpen(false)}
                className="w-full py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
