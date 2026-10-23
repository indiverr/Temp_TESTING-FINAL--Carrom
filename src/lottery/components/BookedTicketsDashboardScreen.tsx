import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Trophy,
  FileSpreadsheet,
  Search,
  ArrowLeft,
  ChevronRight,
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTicket.trim()) {
      onSearchTicket(searchTicket.trim());
    }
  };

  const navCards = [
    {
      id: 'unpaid',
      title: 'Pending Bookings',
      subtitle: 'Tickets awaiting confirmation',
      count: unpaidCount,
      icon: FileText,
    },
    {
      id: 'paid',
      title: 'Confirmed Bookings',
      subtitle: 'Verified ticket registrations',
      count: paidCount,
      icon: CheckCircle2,
    },
    {
      id: 'winners',
      title: 'Draw Winners',
      subtitle: 'Official winning ticket numbers',
      count: winnersCount,
      icon: Trophy,
    },
    {
      id: 'papers',
      title: 'Result Sheets',
      subtitle: 'Uploaded draw result documents',
      count: papersCount,
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="w-full flex flex-col space-y-5 select-none">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Back to Ticket Inventory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Bookings Overview
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {config.seriesTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage ticket bookings, confirmations, winners, and result sheets
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
            Draw Date: <strong className="text-slate-900">{config.businessDate}</strong>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-5">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search ticket number..."
            value={searchTicket}
            onChange={(e) => setSearchTicket(e.target.value)}
            className="w-full pl-10 pr-20 py-2.5 text-xs bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:border-slate-900 font-medium text-slate-800"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors"
          >
            Search
          </button>
        </form>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {navCards.map((card) => {
            const IconComp = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => onNavigate(card.id as any)}
                className="w-full bg-white rounded-xl p-5 shadow-2xs border border-slate-200 flex flex-col justify-between hover:border-slate-400 transition-colors text-left group min-h-[120px]"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {card.count}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">
                      {card.title}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {card.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
