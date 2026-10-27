import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  Image as ImageIcon,
  Check,
  MessageSquare,
  Building2,
  Send,
  Mail,
} from 'lucide-react';
import { LOTTERY_COLUMNS_SPEC } from '../mockData';
import { TicketBooking, TicketLock } from '../types';

interface AvailableTicketsGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookedTickets: TicketBooking[];
  activeLocks?: TicketLock[];
}

export const AvailableTicketsGalleryModal: React.FC<AvailableTicketsGalleryModalProps> = ({
  isOpen,
  onClose,
  bookedTickets,
  activeLocks = [],
}) => {
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const rowCount = 25;
  const nowMs = Date.now();

  const isNumberBooked = (numStr: string) =>
    bookedTickets.some((b) => b.ticketNumber === numStr && b.bookingStatus === 'Booked');

  const isNumberLocked = (numStr: string) =>
    activeLocks.some(
      (l) => l.ticketNumber === numStr && l.status === 'LOCKED' && l.expiresAtMs > nowMs
    );

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  const shareApps = [
    { name: 'WhatsApp', icon: MessageSquare },
    { name: 'WhatsApp Business', icon: Building2 },
    { name: 'Telegram', icon: Send },
    { name: 'Email', icon: Mail },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 select-none">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] relative">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-slate-300" />
            <h3 className="font-bold text-xs sm:text-sm tracking-wide">
              Available Tickets Sheet
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsShareSheetOpen(true)}
              className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Share Ticket Sheet"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 13-Column Grid Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full border-collapse text-center">
            <thead className="sticky top-0 z-20">
              <tr>
                {LOTTERY_COLUMNS_SPEC.map((col) => {
                  const [start, end] = col.rangeLabel.split(' - ');
                  return (
                    <th
                      key={col.id}
                      style={{ backgroundColor: col.headerBg }}
                      className="p-1.5 border border-slate-300 text-white font-bold text-[10px] min-w-[56px] whitespace-nowrap"
                    >
                      <div className="leading-tight">{start}</div>
                      <div className="text-[8px] opacity-80">-</div>
                      <div className="leading-tight">{end}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-mono text-[11px] font-bold">
              {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {LOTTERY_COLUMNS_SPEC.map((col) => {
                    const numberVal = col.startRange + rowIndex;
                    const numStr = numberVal.toString().padStart(4, '0');
                    const isBooked = isNumberBooked(numStr);
                    const isLocked = !isBooked && isNumberLocked(numStr);

                    return (
                      <td
                        key={col.id}
                        style={{
                          color: isBooked
                            ? '#ffffff'
                            : isLocked
                            ? '#475569'
                            : col.textColor,
                          backgroundColor: isBooked
                            ? '#000000'
                            : isLocked
                            ? 'rgba(148, 163, 184, 0.45)'
                            : '#ffffff',
                        }}
                        className="p-1.5 border border-slate-200 font-bold text-[11px] whitespace-nowrap"
                        title={
                          isBooked
                            ? `Ticket #${numStr} — Confirmed`
                            : isLocked
                            ? `Ticket #${numStr} — Temporarily locked`
                            : `Ticket #${numStr} — Available`
                        }
                      >
                        {isBooked ? '-' : numStr}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Share Drawer */}
        {isShareSheetOpen && (
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-xl shadow-xl border-t border-slate-200 p-4 z-40">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs text-slate-900">
                Share Sheet
              </h4>
              <button
                onClick={() => setIsShareSheetOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              {shareApps.map((app) => {
                const IconComp = app.icon;
                return (
                  <button
                    key={app.name}
                    onClick={() => setIsShareSheetOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-1.5">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700">
                      {app.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
