import React, { useState } from 'react';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';
import { TodayWinnerRecord, LoginType } from '../types';

interface TodayWinnerScreenProps {
  winners: TodayWinnerRecord[];
  currentRole: LoginType;
  businessDate: string;
  seriesTitle: string;
  onAddWinner: (
    winningNumber: string,
    prizeCategory: string,
    prizeAmount: number,
    notes?: string
  ) => void;
  onBack: () => void;
}

export const TodayWinnerScreen: React.FC<TodayWinnerScreenProps> = ({
  winners,
  currentRole,
  businessDate,
  seriesTitle,
  onAddWinner,
  onBack,
}) => {
  const [selectedDate, setSelectedDate] = useState(businessDate);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newPrizeCategory, setNewPrizeCategory] = useState('1st Prize');
  const [newPrizeAmount, setNewPrizeAmount] = useState<number>(100000);
  const [newNotes, setNewNotes] = useState('');
  const [error, setError] = useState('');

  const filteredWinners = winners.filter((w) => w.drawDate === selectedDate);

  const handleSubmitWinner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber || newNumber.length !== 4) {
      setError('Please provide a valid 4-digit winning ticket number (e.g. 0012).');
      return;
    }
    setError('');
    onAddWinner(newNumber, newPrizeCategory, newPrizeAmount, newNotes);
    setIsAddModalOpen(false);
    setNewNumber('');
    setNewNotes('');
  };

  const totalPrizeMoney = filteredWinners.reduce((sum, w) => sum + w.prizeAmount, 0);

  return (
    <div className="w-full flex flex-col space-y-6 select-none">
      {/* 1. Page Heading */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 text-slate-700 shadow-xs transition-all active:scale-95"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Official Prize Declaration & Today Winners
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                {seriesTitle}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Verified announcement of winning lottery ticket numbers and prize disbursements
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Draw Date:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-extrabold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="02 Oct 2026">02 Oct 2026</option>
              <option value="03 Oct 2026">03 Oct 2026</option>
              <option value="04 Oct 2026">04 Oct 2026</option>
            </select>
          </div>

          {currentRole === 'admin' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs active:scale-95 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Announce Winner</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Prizes Declared
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block font-mono">
              {filteredWinners.length}
            </span>
            <span className="text-[11px] font-semibold text-amber-700 mt-0.5 block">
              Official draw category entries
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Trophy className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Active Draw Series
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 block">
              {seriesTitle}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 mt-0.5 block">
              Official draw series
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Verification Authority
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              Lottery Commission
            </span>
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
              Cryptographically signed
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* Winners List / Official Announcement */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {filteredWinners.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-700">No Winners Announced Yet</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Official draw results for {selectedDate} will appear here once verified by the lottery board.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWinners.map((win) => (
              <div
                key={win.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-amber-200/80 relative overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-200/40 to-transparent rounded-bl-full pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                      {win.prizeCategory}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{win.enteredAt}</span>
                  </div>

                  <div className="flex items-center justify-between my-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Winning Ticket</span>
                      <span className="text-3xl font-black font-mono tracking-widest text-slate-900 drop-shadow-xs">
                        #{win.winningNumber}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Series</span>
                      <span className="text-sm font-black text-emerald-600">{win.seriesTitle}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 mt-2">
                  <div className="flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified: {win.verifiedBy}</span>
                  </div>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {win.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Add Winner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-[310px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-4 animate-in zoom-in-95">
            <div className="bg-amber-500 text-white rounded-2xl p-3 flex items-center justify-between mb-3 shadow-sm">
              <span className="font-black text-sm tracking-wide">Enter Official Winner</span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white">
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleSubmitWinner} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  4-Digit Winning Number:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0012"
                  maxLength={4}
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  className="w-full text-center text-xl font-mono font-black py-2 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Prize Category:</label>
                <select
                  value={newPrizeCategory}
                  onChange={(e) => setNewPrizeCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="1st Prize">1st Prize</option>
                  <option value="2nd Prize">2nd Prize</option>
                  <option value="3rd Prize">3rd Prize</option>
                  <option value="Consolation Prize">Consolation Prize</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Verification Notes:</label>
                <input
                  type="text"
                  placeholder="Optional notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              {error && (
                <div className="p-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/30 active:scale-95 transition-all"
              >
                Publish Official Winner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
