import React, { useState } from 'react';
import { UserCheck, Calendar, ArrowRight, ShieldCheck, Grid, Clock } from 'lucide-react';
import { EmployeeProfile } from '../types';

interface EnterDrawDateScreenProps {
  currentStaff: EmployeeProfile;
  onEnterDraw: (date: string) => void;
  onOpenAvailableGallery: () => void;
}

export const EnterDrawDateScreen: React.FC<EnterDrawDateScreenProps> = ({
  currentStaff,
  onEnterDraw,
  onOpenAvailableGallery,
}) => {
  const [selectedDate, setSelectedDate] = useState('02 Oct 2026');

  return (
    <div className="w-full max-w-2xl mx-auto my-auto flex flex-col space-y-6 select-none p-4 sm:p-6">
      {/* Employee Identity Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl border border-blue-200 shadow-xs">
            <UserCheck className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Logged in Counter Operator
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {currentStaff.name}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mt-0.5">
              <span>ID: <strong>{currentStaff.id}</strong></span>
              <span>•</span>
              <span className="capitalize font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {currentStaff.role}
              </span>
            </div>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Active Session</span>
        </div>
      </div>

      {/* Date Selection Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200/90 flex flex-col items-center text-center space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block mb-2">
            Draw Session Initialization
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Select Scheduled Business Draw Date
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto mt-1">
            Opening the draw counter initializes ticket availability and live payment ledger for the selected date.
          </p>
        </div>

        {/* Date Selector Buttons */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-md">
          {['02 Oct 2026', '03 Oct 2026', '04 Oct 2026'].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`py-3 px-3 rounded-2xl border text-xs sm:text-sm font-extrabold transition-all flex flex-col items-center justify-center space-y-1 ${
                selectedDate === d
                  ? 'border-blue-600 bg-blue-50/80 text-blue-700 ring-2 ring-blue-300 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{d}</span>
            </button>
          ))}
        </div>

        {/* Big 3D ENTER Button */}
        <button
          onClick={() => onEnterDraw(selectedDate)}
          className="w-full max-w-md rounded-2xl p-5 text-white text-center relative overflow-hidden group shadow-xl transition-all active:scale-[0.98] hover:shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
          }}
        >
          <div className="flex items-center justify-center space-x-3">
            <span className="text-lg font-black tracking-wider uppercase">
              ENTER LOTTERY COUNTER
            </span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
          <span className="text-xs text-blue-200 font-semibold block mt-1">
            Session: {selectedDate} • Ready for Bookings
          </span>
        </button>

        <div className="w-full pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onOpenAvailableGallery}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-all active:scale-95 flex items-center justify-center space-x-2"
          >
            <Grid className="w-4 h-4 text-blue-600" />
            <span>View Available (Unbooked) Matrix Sheet</span>
          </button>

          <span className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Counter time: 10:25 AM IST</span>
          </span>
        </div>
      </div>
    </div>
  );
};
