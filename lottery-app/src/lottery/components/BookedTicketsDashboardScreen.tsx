import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Trophy,
  FileSpreadsheet,
  Search,
  Smartphone,
  QrCode,
  ArrowLeft,
  ChevronRight,
  Shield,
  Copy,
  AlertCircle,
  ExternalLink,
  X,
} from 'lucide-react';
import { SystemConfig } from '../types';

interface BookedTicketsDashboardProps {
  config: SystemConfig;
  unpaidCount: number;
  paidCount: number;
  winnersCount: number;
  papersCount: number;
  onNavigate: (view: 'unpaid' | 'paid' | 'winners' | 'papers') => void;
  onBack: () => void;
  onSearchTicket: (ticketNum: string) => void;
}

export const BookedTicketsDashboardScreen: React.FC<BookedTicketsDashboardProps> = ({
  config,
  unpaidCount,
  paidCount,
  winnersCount,
  papersCount,
  onNavigate,
  onBack,
  onSearchTicket,
}) => {
  const [searchTicket, setSearchTicket] = useState('');
  const [isGpayModalOpen, setIsGpayModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedGpay, setCopiedGpay] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTicket.trim()) {
      onSearchTicket(searchTicket.trim());
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedGpay(true);
    setTimeout(() => setCopiedGpay(false), 2000);
  };

  const navCards = [
    {
      id: 'unpaid',
      title: 'Unpaid Tickets',
      subtitle: 'Pending collections & settlements',
      count: unpaidCount,
      countBadgeColor: 'bg-rose-100 text-rose-700',
      icon: FileText,
      iconBg: 'bg-rose-50 text-rose-600',
      borderColor: 'border-rose-100',
    },
    {
      id: 'paid',
      title: 'Paid Tickets',
      subtitle: 'Verified collections & receipts',
      count: paidCount,
      countBadgeColor: 'bg-emerald-100 text-emerald-700',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      borderColor: 'border-emerald-100',
    },
    {
      id: 'winners',
      title: 'Today Winner',
      subtitle: 'Official prize declaration',
      count: winnersCount,
      countBadgeColor: 'bg-amber-100 text-amber-700',
      icon: Trophy,
      iconBg: 'bg-amber-50 text-amber-600',
      borderColor: 'border-amber-100',
    },
    {
      id: 'papers',
      title: 'Result Paper',
      subtitle: 'Official publication sheets',
      count: papersCount,
      countBadgeColor: 'bg-blue-100 text-blue-700',
      icon: FileSpreadsheet,
      iconBg: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-100',
    },
  ];

  return (
    <div className="w-full flex flex-col space-y-6 select-none">
      {/* 1. Page Heading */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-700 shadow-xs transition-all active:scale-95"
            title="Back to Ticket Inventory"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Booked Tickets Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                {config.seriesTitle}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Comprehensive overview of pending settlements, verified collections, prize winners, and result papers
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center space-x-2">
            <span>Draw Date:</span>
            <span className="font-extrabold text-blue-700">{config.businessDate}</span>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto">
        {/* Ticket search input */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search ticket number across records..."
            value={searchTicket}
            onChange={(e) => setSearchTicket(e.target.value)}
            className="w-full pl-10 pr-20 py-2.5 text-xs bg-white border border-slate-200 rounded-2xl shadow-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95"
          >
            Find
          </button>
        </form>

        {/* 4 Dedicated Navigation Cards (Requirement B) - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {navCards.map((card) => {
            const IconComp = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => onNavigate(card.id as any)}
                className={`w-full bg-white rounded-2xl p-4 sm:p-5 shadow-sm border ${card.borderColor} flex flex-col justify-between hover:shadow-md hover:border-blue-300 active:scale-[0.98] transition-all text-left group min-h-[120px]`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div
                    className={`w-11 h-11 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                  >
                    <IconComp className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black ${card.countBadgeColor}`}
                  >
                    {card.count}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                      {card.title}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {card.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Payment Shortcuts row */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">
            Payment Shortcuts
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setIsGpayModalOpen(true)}
              className="py-3 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>GPay Recipient Details</span>
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Show UPI QR Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* GPay Modal */}
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

      {/* QR Modal */}
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
