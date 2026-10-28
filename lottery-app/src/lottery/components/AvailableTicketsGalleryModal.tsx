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
  AlertCircle,
  Calendar,
  Lock,
  Layers,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { TicketBooking, TicketLock, TicketInventoryItem, GridAppearanceConfig } from '../types';

export interface AvailableTicketsGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookedTickets: TicketBooking[];
  activeLocks?: TicketLock[];
  inventoryTickets?: TicketInventoryItem[];
  drawDate?: string;
  seriesTitle?: string;
  appearance?: GridAppearanceConfig;
}

export const AvailableTicketsGalleryModal: React.FC<AvailableTicketsGalleryModalProps> = ({
  isOpen,
  onClose,
  bookedTickets,
  activeLocks = [],
  inventoryTickets = [],
  drawDate = '',
  seriesTitle = 'CARROM GOLD',
  appearance,
}) => {
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const nowMs = Date.now();

  // Filter published tickets for this specific draw date
  const ticketsForDrawDate = inventoryTickets.filter(
    (t) => (!drawDate || t.drawDate === drawDate) && t.status === 'PUBLISHED'
  );

  // Natural numerical sort while strictly preserving leading zero strings
  const sortedTickets = [...ticketsForDrawDate].sort((a, b) => {
    const na = parseInt(a.ticketNumber, 10);
    const nb = parseInt(b.ticketNumber, 10);
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
    return a.ticketNumber.localeCompare(b.ticketNumber);
  });

  const isNumberBooked = (numStr: string) => {
    return (
      bookedTickets.some((b) => b.ticketNumber === numStr && b.bookingStatus === 'Booked') ||
      ticketsForDrawDate.some((t) => t.ticketNumber === numStr && t.bookingStatus === 'Booked')
    );
  };

  const isNumberLocked = (numStr: string) => {
    return (
      activeLocks.some(
        (l) => l.ticketNumber === numStr && l.status === 'LOCKED' && l.expiresAtMs > nowMs
      ) ||
      bookedTickets.some(
        (b) => b.ticketNumber === numStr && b.bookingStatus === 'Pending Confirmation'
      ) ||
      ticketsForDrawDate.some(
        (t) => t.ticketNumber === numStr && t.bookingStatus === 'Pending Confirmation'
      )
    );
  };

  const getTicketStatus = (numStr: string): 'Booked' | 'Locked' | 'Available' => {
    if (isNumberBooked(numStr)) return 'Booked';
    if (isNumberLocked(numStr)) return 'Locked';
    return 'Available';
  };

  const totalCount = sortedTickets.length;
  const bookedCount = sortedTickets.filter((t) => getTicketStatus(t.ticketNumber) === 'Booked').length;
  const lockedCount = sortedTickets.filter((t) => getTicketStatus(t.ticketNumber) === 'Locked').length;
  const availableCount = sortedTickets.filter((t) => getTicketStatus(t.ticketNumber) === 'Available').length;

  const handleDownload = () => {
    if (sortedTickets.length === 0) return;

    try {
      // Landscape A4 PDF for grid presentation
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const marginX = 12;
      const contentWidth = pageWidth - marginX * 2; // 273mm

      const now = new Date();
      const generationTimestamp = now.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const drawHeader = (isFirstPage: boolean) => {
        // Dark header banner
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, isFirstPage ? 24 : 14, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(isFirstPage ? 14 : 9);
        doc.text('CARROM LOTTERY DESK — AVAILABLE TICKETS SHEET', marginX, isFirstPage ? 11 : 9);

        if (isFirstPage) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(203, 213, 225);
          doc.text(`Draw Date: ${drawDate || 'Current'}  |  Series: ${seriesTitle}  |  Generated: ${generationTimestamp}`, marginX, 18);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(56, 189, 248);
          doc.text('OFFICIAL INVENTORY SHEET', pageWidth - marginX, 11, { align: 'right' });
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(203, 213, 225);
          doc.text(`Draw Date: ${drawDate}  |  Series: ${seriesTitle}`, pageWidth - marginX, 9, { align: 'right' });
        }
      };

      drawHeader(true);

      // KPI summary boxes
      let curY = 28;
      const kpiWidth = (contentWidth - 9) / 4;

      // Available
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(marginX, curY, kpiWidth, 10, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(22, 101, 52);
      doc.text(`AVAILABLE: ${availableCount}`, marginX + 3, curY + 6.5);

      // Booked
      const kpi2X = marginX + kpiWidth + 3;
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(kpi2X, curY, kpiWidth, 10, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(`BOOKED: ${bookedCount}`, kpi2X + 3, curY + 6.5);

      // Locked / Pending
      const kpi3X = kpi2X + kpiWidth + 3;
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(253, 230, 138);
      doc.roundedRect(kpi3X, curY, kpiWidth, 10, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(180, 83, 9);
      doc.text(`LOCKED / PENDING: ${lockedCount}`, kpi3X + 3, curY + 6.5);

      // Total
      const kpi4X = kpi3X + kpiWidth + 3;
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(kpi4X, curY, kpiWidth, 10, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 64, 175);
      doc.text(`TOTAL CONFIGURED: ${totalCount}`, kpi4X + 3, curY + 6.5);

      // Grid of tickets: 10 columns per row
      curY += 15;
      const gridCols = 10;
      const cellWidth = contentWidth / gridCols;
      const cellHeight = 8;
      const bottomLimit = pageHeight - 12;

      for (let i = 0; i < sortedTickets.length; i++) {
        const colIdx = i % gridCols;
        const ticket = sortedTickets[i];
        const status = getTicketStatus(ticket.ticketNumber);

        if (colIdx === 0 && curY + cellHeight > bottomLimit) {
          doc.addPage();
          drawHeader(false);
          curY = 20;
        }

        const cellX = marginX + colIdx * cellWidth;

        // Styling based on status
        if (status === 'Booked') {
          doc.setFillColor(30, 41, 59); // dark slate
          doc.setDrawColor(15, 23, 42);
          doc.rect(cellX, curY, cellWidth - 1, cellHeight - 1, 'FD');
          doc.setTextColor(255, 255, 255);
          doc.setFont('courier', 'bold');
          doc.setFontSize(8);
          doc.text(ticket.ticketNumber, cellX + (cellWidth - 1) / 2, curY + 4, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5);
          doc.setTextColor(203, 213, 225);
          doc.text('BOOKED', cellX + (cellWidth - 1) / 2, curY + 6.5, { align: 'center' });
        } else if (status === 'Locked') {
          doc.setFillColor(254, 243, 199); // amber-100
          doc.setDrawColor(245, 158, 11);
          doc.rect(cellX, curY, cellWidth - 1, cellHeight - 1, 'FD');
          doc.setTextColor(180, 83, 9);
          doc.setFont('courier', 'bold');
          doc.setFontSize(8);
          doc.text(ticket.ticketNumber, cellX + (cellWidth - 1) / 2, curY + 4, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5);
          doc.text('LOCKED', cellX + (cellWidth - 1) / 2, curY + 6.5, { align: 'center' });
        } else {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(209, 250, 229); // emerald-200
          doc.rect(cellX, curY, cellWidth - 1, cellHeight - 1, 'FD');
          doc.setTextColor(5, 150, 105); // emerald-600
          doc.setFont('courier', 'bold');
          doc.setFontSize(8.5);
          doc.text(ticket.ticketNumber, cellX + (cellWidth - 1) / 2, curY + 4, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5);
          doc.setTextColor(16, 185, 129);
          doc.text('AVAILABLE', cellX + (cellWidth - 1) / 2, curY + 6.5, { align: 'center' });
        }

        if (colIdx === gridCols - 1 || i === sortedTickets.length - 1) {
          curY += cellHeight;
        }
      }

      // Page Footers
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.line(marginX, pageHeight - 8, pageWidth - marginX, pageHeight - 8);
        doc.text(`Carrom Lottery Desk • Draw Date: ${drawDate} • Series: ${seriesTitle}`, marginX, pageHeight - 4.5);
        doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginX, pageHeight - 4.5, { align: 'right' });
      }

      doc.save(`Available_Tickets_Sheet_${drawDate || 'draw'}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to generate PDF:', e);
      setDownloadSuccess(false);
    }
  };

  const shareApps = [
    { name: 'WhatsApp', icon: MessageSquare },
    { name: 'WhatsApp Business', icon: Building2 },
    { name: 'Telegram', icon: Send },
    { name: 'Email', icon: Mail },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-2xs select-none">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] relative">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-xs sm:text-sm tracking-wide">
                  Available Tickets Sheet
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  {seriesTitle}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Draw Date: <strong className="text-white">{drawDate || 'Current'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              disabled={sortedTickets.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              title="Download Available Tickets Sheet as PDF"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved PDF</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsShareSheetOpen(true)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Share Ticket Sheet"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Chips Bar */}
        {sortedTickets.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Available: {availableCount}</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-100 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>Booked: {bookedCount}</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold text-[11px]">
                <Lock className="w-2.5 h-2.5 text-amber-600" />
                <span>Locked/Pending: {lockedCount}</span>
              </span>
            </div>
            <div className="text-slate-600 font-medium text-[11px]">
              Total Configured: <strong className="text-slate-900 font-mono">{totalCount}</strong>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100/50">
          {sortedTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">No Tickets Configured</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  No tickets configured for this draw date (<strong className="text-slate-700">{drawDate || 'selected date'}</strong>). Please add tickets in Inventory settings.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {sortedTickets.map((ticket) => {
                const status = getTicketStatus(ticket.ticketNumber);
                const isBooked = status === 'Booked';
                const isLocked = status === 'Locked';

                return (
                  <div
                    key={ticket.id || ticket.ticketNumber}
                    style={{
                      backgroundColor: isBooked
                        ? '#0f172a'
                        : isLocked
                        ? appearance?.lockedBg || 'rgba(148, 163, 184, 0.45)'
                        : appearance?.availableBg || '#ffffff',
                      color: isBooked
                        ? '#ffffff'
                        : isLocked
                        ? '#475569'
                        : appearance?.textColor || '#047857',
                      borderColor: isBooked
                        ? '#1e293b'
                        : isLocked
                        ? '#94a3b8'
                        : appearance?.borderColor || '#a7f3d0',
                    }}
                    className="p-2 rounded-xl border flex flex-col items-center justify-center text-center shadow-2xs transition-transform"
                    title={
                      isBooked
                        ? `Ticket #${ticket.ticketNumber} — Confirmed Booked`
                        : isLocked
                        ? `Ticket #${ticket.ticketNumber} — Temporarily locked`
                        : `Ticket #${ticket.ticketNumber} — Available for booking`
                    }
                  >
                    <div className="font-mono font-black text-sm tracking-wide">
                      {ticket.ticketNumber}
                    </div>
                    <div
                      className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
                        isBooked
                          ? 'text-slate-300'
                          : isLocked
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {status}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                    className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
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
