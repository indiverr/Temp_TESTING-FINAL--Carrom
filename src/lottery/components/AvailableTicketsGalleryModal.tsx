import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { LOTTERY_COLUMNS_SPEC } from '../mockData';
import { TicketBooking } from '../types';

interface AvailableTicketsGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookedTickets: TicketBooking[];
}

export const AvailableTicketsGalleryModal: React.FC<AvailableTicketsGalleryModalProps> = ({
  isOpen,
  onClose,
  bookedTickets,
}) => {
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const rowCount = 25;

  const isNumberBooked = (numStr: string) =>
    bookedTickets.some((b) => b.ticketNumber === numStr);

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  const shareApps = [
    { name: 'WhatsApp', color: '#25D366', icon: '💬' },
    { name: 'Business WhatsApp', color: '#128C7E', icon: '🏢' },
    { name: 'Telegram', color: '#0088cc', icon: '✈️' },
    { name: 'Gmail', color: '#EA4335', icon: '✉️' },
    { name: 'Bluetooth', color: '#0082FC', icon: '📶' },
    { name: 'More', color: '#64748B', icon: '•••' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/70 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white w-full max-w-[370px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 relative">
        {/* Blue Header Bar (media_1791869866991_e8802cbb.jpg) */}
        <div className="bg-blue-600 text-white p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-1.5">
            <ImageIcon className="w-5 h-5 text-white" />
            <h3 className="font-extrabold text-xs tracking-wide">
              Available (Unbooked) Tickets
            </h3>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center space-x-1 shadow-xs active:scale-95 transition-all"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsShareSheetOpen(true)}
              className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all active:scale-95"
              title="Share Ticket List"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 13-Column Grid Table where booked tickets are replaced with black "-" blocks */}
        <div className="flex-1 overflow-x-auto overflow-y-auto border-t border-slate-200">
          <table className="w-full border-collapse text-center">
            {/* Headers with their vibrant series colors */}
            <thead className="sticky top-0 z-20 shadow-xs">
              <tr>
                {LOTTERY_COLUMNS_SPEC.map((col) => {
                  const [start, end] = col.rangeLabel.split(' - ');
                  return (
                    <th
                      key={col.id}
                      style={{ backgroundColor: col.headerBg }}
                      className="p-1 border border-slate-300 text-white font-extrabold text-[10px] min-w-[56px] whitespace-nowrap"
                    >
                      <div className="leading-tight drop-shadow-sm">{start}</div>
                      <div className="text-[8px] opacity-80">-</div>
                      <div className="leading-tight drop-shadow-sm">{end}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* 25 Rows matching master specification */}
            <tbody className="divide-y divide-slate-200 font-mono text-[11px] font-bold">
              {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {LOTTERY_COLUMNS_SPEC.map((col) => {
                    const numberVal = col.startRange + rowIndex;
                    const numStr = numberVal.toString().padStart(4, '0');
                    const isBooked = isNumberBooked(numStr);

                    return (
                      <td
                        key={col.id}
                        style={{
                          color: isBooked ? '#ffffff' : col.textColor,
                          backgroundColor: isBooked ? '#000000' : '#ffffff',
                        }}
                        className="p-1 border border-slate-200 font-black text-[10px] whitespace-nowrap"
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

        {/* Share Ticket List Bottom Drawer (Exact replica of media_1791869866991_e8802cbb.jpg) */}
        {isShareSheetOpen && (
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-4 z-40 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-black text-sm text-slate-800 tracking-tight">
                Share Ticket List
              </h4>
              <button
                onClick={() => setIsShareSheetOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              {shareApps.map((app) => (
                <button
                  key={app.name}
                  onClick={() => setIsShareSheetOpen(false)}
                  className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 active:scale-95 transition-all group"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white shadow-md mb-1.5 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: app.color }}
                  >
                    <span>{app.icon}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 leading-tight">
                    {app.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
