/**
 * Carrom Lottery Desk — Customer PDF Report Generator
 * Generates an official, multi-page, formatted PDF containing genuine customer records
 * collected by paid staff through completed ticket bookings.
 */

import { jsPDF } from 'jspdf';
import { TicketBooking } from '../types';

export interface CustomerReportOptions {
  bookings: TicketBooking[];
  drawDateFilterLabel: string;
  adminName: string;
  adminId?: string;
  saveToFile?: boolean;
  fileName?: string;
}

export interface CustomerReportResult {
  success: boolean;
  recordCount: number;
  uniqueCustomerCount: number;
  totalRevenue: number;
  pageCount: number;
  fileName: string;
  error?: string;
}

export function generateCustomerPdfReport(options: CustomerReportOptions): CustomerReportResult {
  const {
    bookings,
    drawDateFilterLabel,
    adminName,
    adminId = 'ADM001',
    saveToFile = true,
  } = options;

  if (!bookings || bookings.length === 0) {
    return {
      success: false,
      recordCount: 0,
      uniqueCustomerCount: 0,
      totalRevenue: 0,
      pageCount: 0,
      fileName: '',
      error: 'No completed customer bookings found to generate the report.',
    };
  }

  // Deduplicate and group customer statistics
  const uniqueCustomerSet = new Set<string>();
  let totalRevenue = 0;

  for (const b of bookings) {
    const key = (b.customerPhone || b.customerId || b.customerName || '').trim();
    if (key) uniqueCustomerSet.add(key);
    totalRevenue += Number(b.amountPaid || b.totalAmount || 0);
  }

  // Initialize jsPDF in Portrait A4 format
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 12;
  const contentWidth = pageWidth - marginX * 2; // 186mm

  // Table Column Definitions
  // Total width: 8 + 38 + 26 + 22 + 24 + 20 + 30 + 18 = 186mm
  const cols = [
    { header: '#', width: 8, align: 'center' as const },
    { header: 'Customer Name', width: 38, align: 'left' as const },
    { header: 'Phone Number', width: 26, align: 'left' as const },
    { header: 'Draw Date', width: 22, align: 'center' as const },
    { header: 'Ticket #', width: 24, align: 'center' as const },
    { header: 'Status', width: 20, align: 'center' as const },
    { header: 'Staff / Paid By', width: 30, align: 'left' as const },
    { header: 'Amount', width: 18, align: 'right' as const },
  ];

  const now = new Date();
  const generationTimestamp = now.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const drawHeaderBanner = (isFirstPage: boolean) => {
    // Dark Slate Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, isFirstPage ? 28 : 16, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isFirstPage ? 14 : 10);
    doc.text('CARROM LOTTERY DESK — CUSTOMER REPORT', marginX, isFirstPage ? 12 : 11);

    if (isFirstPage) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text('Official Verified Customer Details Collected from Completed Bookings', marginX, 19);

      // Top right badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(56, 189, 248); // sky-400
      doc.text('ADMIN CONFIDENTIAL', pageWidth - marginX, 12, { align: 'right' });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(203, 213, 225);
      doc.text(`Filter: ${drawDateFilterLabel}`, pageWidth - marginX, 11, { align: 'right' });
    }
  };

  const drawTableHeader = (startY: number) => {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(marginX, startY, contentWidth, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let curX = marginX;
    for (const c of cols) {
      const textX =
        c.align === 'center'
          ? curX + c.width / 2
          : c.align === 'right'
          ? curX + c.width - 2
          : curX + 2;
      doc.text(c.header, textX, startY + 4.8, { align: c.align });
      curX += c.width;
    }
    return startY + 7;
  };

  // 1. Draw First Page Header
  drawHeaderBanner(true);

  // Metadata Card
  let y = 33;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(marginX, y, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600

  // Left col: Filter & Records
  doc.text(`Date Filter: `, marginX + 3, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(drawDateFilterLabel, marginX + 20, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Generated By: `, marginX + 3, y + 10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${adminName} (${adminId})`, marginX + 23, y + 10.5);

  // Right col: Timestamp
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Generated On: `, pageWidth - marginX - 55, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(generationTimestamp, pageWidth - marginX - 32, y + 5.5);

  // KPI Summary Boxes
  y += 18;
  const kpiWidth = (contentWidth - 6) / 3;

  // KPI 1: Unique Customers
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(187, 247, 208); // green-200
  doc.roundedRect(marginX, y, kpiWidth, 12, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(22, 101, 52); // green-800
  doc.text('UNIQUE CUSTOMERS', marginX + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(String(uniqueCustomerSet.size), marginX + 3, y + 9.8);

  // KPI 2: Completed Bookings
  const kpi2X = marginX + kpiWidth + 3;
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.roundedRect(kpi2X, y, kpiWidth, 12, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 64, 175); // blue-800
  doc.text('COMPLETED BOOKINGS', kpi2X + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(String(bookings.length), kpi2X + 3, y + 9.8);

  // KPI 3: Total Revenue Collected
  const kpi3X = kpi2X + kpiWidth + 3;
  doc.setFillColor(250, 245, 255); // purple-50
  doc.setDrawColor(233, 213, 255); // purple-200
  doc.roundedRect(kpi3X, y, kpiWidth, 12, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 33, 168); // purple-800
  doc.text('TOTAL REVENUE', kpi3X + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`INR ${totalRevenue.toLocaleString()}`, kpi3X + 3, y + 9.8);

  // Table Starts
  y += 16;
  y = drawTableHeader(y);

  // Sort bookings by customer name, then date
  const sortedBookings = [...bookings].sort((a, b) => {
    const nameCmp = (a.customerName || '').localeCompare(b.customerName || '');
    if (nameCmp !== 0) return nameCmp;
    return (a.date || '').localeCompare(b.date || '');
  });

  const rowHeight = 6.2;
  const bottomMargin = 16;

  for (let idx = 0; idx < sortedBookings.length; idx++) {
    const b = sortedBookings[idx];

    // Check if new page needed
    if (y + rowHeight > pageHeight - bottomMargin) {
      doc.addPage();
      drawHeaderBanner(false);
      y = drawTableHeader(20);
    }

    // Alternating row background
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(marginX, y, contentWidth, rowHeight, 'F');

    // Subtle bottom border
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(marginX, y + rowHeight, marginX + contentWidth, y + rowHeight);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59); // slate-800

    let curX = marginX;

    // Col 0: # Index
    doc.text(String(idx + 1), curX + cols[0].width / 2, y + 4.4, { align: 'center' });
    curX += cols[0].width;

    // Col 1: Customer Name (truncated if > 28 chars)
    const rawName = b.customerName || 'Walk-in Customer';
    const dispName = rawName.length > 20 ? rawName.slice(0, 19) + '...' : rawName;
    doc.setFont('helvetica', 'bold');
    doc.text(dispName, curX + 2, y + 4.4);
    doc.setFont('helvetica', 'normal');
    curX += cols[1].width;

    // Col 2: Phone
    const phone = b.customerPhone || '—';
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(phone, curX + 2, y + 4.4);
    doc.setFont('helvetica', 'normal');
    curX += cols[2].width;

    // Col 3: Draw Date
    doc.text(b.date || '—', curX + cols[3].width / 2, y + 4.4, { align: 'center' });
    curX += cols[3].width;

    // Col 4: Ticket #
    const rawTicket = b.ticketNumber || '—';
    const dispTicket = rawTicket.length > 8 ? rawTicket.slice(0, 7) + '..' : `#${rawTicket}`;
    doc.setFont('courier', 'bold');
    doc.text(dispTicket, curX + cols[4].width / 2, y + 4.4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    curX += cols[4].width;

    // Col 5: Booking Status
    const statusText = b.bookingStatus === 'Booked' ? 'Confirmed' : b.bookingStatus;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(statusText, curX + cols[5].width / 2, y + 4.4, { align: 'center' });
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    curX += cols[5].width;

    // Col 6: Staff / Paid By
    const staffLabel = b.paidBy || b.employeeLabel || b.bookedBy || 'Desk Staff';
    const dispStaff = staffLabel.length > 16 ? staffLabel.slice(0, 15) + '...' : staffLabel;
    doc.text(dispStaff, curX + 2, y + 4.4);
    curX += cols[6].width;

    // Col 7: Amount
    const amt = b.amountPaid || b.totalAmount || 0;
    doc.setFont('helvetica', 'bold');
    doc.text(`INR ${amt}`, curX + cols[7].width - 2, y + 4.4, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += rowHeight;
  }

  // Draw Page Numbers and Footers across all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);

    // Left footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Carrom Lottery Desk • Confidential Administrator Report • Generated securely from Firebase', marginX, pageHeight - 7);

    // Right footer: Page X of Y
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 7, { align: 'right' });
  }

  const cleanFilter = drawDateFilterLabel.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const dateStr = now.toISOString().slice(0, 10);
  const outFileName = options.fileName || `Carrom_Customer_Report_${cleanFilter}_${dateStr}.pdf`;

  if (saveToFile && typeof window !== 'undefined') {
    doc.save(outFileName);
  }

  return {
    success: true,
    recordCount: bookings.length,
    uniqueCustomerCount: uniqueCustomerSet.size,
    totalRevenue,
    pageCount: totalPages,
    fileName: outFileName,
  };
}
