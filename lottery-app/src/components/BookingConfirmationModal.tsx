import React, { useState } from 'react';
import { X, Check, User, Phone, Ticket } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNumbers: string[];
  pricePerTicket: number;
  currentDate: string;
  employeeName: string;
  onConfirm: (customerName: string, customerPhone: string) => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  isOpen,
  onClose,
  selectedNumbers,
  pricePerTicket,
  currentDate,
  employeeName,
  onConfirm,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  if (!isOpen) return null;

  const totalAmount = selectedNumbers.length * pricePerTicket;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Fire confetti celebration on successful ticket booking
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.65 },
    });
    onConfirm(customerName || 'Walk-in Customer', customerPhone || 'Counter-Sale');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ticket className="w-5 h-5 text-amber-300" />
            <h3 className="font-extrabold text-sm tracking-wide">Confirm Ticket Booking</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected numbers chips */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 block mb-1.5 uppercase">
            Selected Numbers ({selectedNumbers.length}):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {selectedNumbers.map((num) => (
              <span
                key={num}
                className="font-mono font-bold text-xs bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md"
              >
                {num}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/80">
            <span className="text-xs font-semibold text-slate-600">Total Payable:</span>
            <span className="text-lg font-black text-emerald-600">₹{totalAmount}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer Name:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer Mobile:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="text-[10px] text-slate-400 pt-1">
            Agent: <span className="font-semibold text-slate-600">{employeeName}</span> • Date:{' '}
            <span className="font-semibold text-slate-600">{currentDate}</span>
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-md shadow-blue-500/25 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Print</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
