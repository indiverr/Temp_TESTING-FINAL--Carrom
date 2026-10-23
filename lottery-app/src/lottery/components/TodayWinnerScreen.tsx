import React, { useState } from 'react';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Plus,
  ShieldCheck,
  X,
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
  const [newNotes, setNewNotes] = useState('');
  const [error, setError] = useState('');

  const filteredWinners = winners.filter((w) => w.drawDate === selectedDate);

  const handleSubmitWinner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber || newNumber.length !== 4) {
      setError('Please enter a valid 4-digit ticket number.');
      return;
    }
    setError('');
    onAddWinner(newNumber, newPrizeCategory, 0, newNotes);
    setIsAddModalOpen(false);
    setNewNumber('');
    setNewNotes('');
  };

  return (
    <div className="w-full flex flex-col space-y-5 select-none">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Back to Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Draw Winners
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {seriesTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Declared winning ticket numbers for {selectedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="02 Oct 2026">02 Oct 2026</option>
              <option value="03 Oct 2026">03 Oct 2026</option>
              <option value="04 Oct 2026">04 Oct 2026</option>
            </select>
          </div>

          {currentRole === 'admin' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Winner</span>
            </button>
          )}
        </div>
      </div>

      {/* Winners Grid */}
      <div>
        {filteredWinners.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center space-y-1.5">
            <div className="w-10 h-10 mx-auto rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">No Winners Declared</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Winning numbers for {selectedDate} have not been posted yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWinners.map((win) => (
              <div
                key={win.id}
                className="bg-white rounded-xl p-5 shadow-2xs border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      {win.prizeCategory}
                    </span>
                    <span className="text-[11px] text-slate-400">{win.enteredAt}</span>
                  </div>

                  <div className="flex items-center justify-between my-3">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Winning Ticket</span>
                      <span className="text-2xl font-bold font-mono tracking-wider text-slate-900">
                        #{win.winningNumber}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 font-medium block">Series</span>
                      <span className="text-xs font-semibold text-slate-800">{win.seriesTitle}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-2">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Recorded by {win.verifiedBy}</span>
                  </div>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                    {win.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Winner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-lg overflow-hidden border border-slate-200 p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900">Add Winning Number</span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitWinner} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  4-Digit Ticket Number:
                </label>
                <input
                  type="text"
                  placeholder="0012"
                  maxLength={4}
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  className="w-full text-center text-lg font-mono font-bold py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category:</label>
                <select
                  value={newPrizeCategory}
                  onChange={(e) => setNewPrizeCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="1st Prize">1st Prize</option>
                  <option value="2nd Prize">2nd Prize</option>
                  <option value="3rd Prize">3rd Prize</option>
                  <option value="Consolation Prize">Consolation Prize</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional):</label>
                <input
                  type="text"
                  placeholder="Enter remarks..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
              >
                Save Winner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
