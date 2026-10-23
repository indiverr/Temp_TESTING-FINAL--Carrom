import React, { useState } from 'react';
import { Calendar, UserCheck } from 'lucide-react';
import { EmployeeInfo } from '../types';

interface EnterDrawDateScreenProps {
  currentEmployee: EmployeeInfo;
  onEnterDraw: (date: string) => void;
  onOpenColorMatrix: () => void;
}

export const EnterDrawDateScreen: React.FC<EnterDrawDateScreenProps> = ({
  currentEmployee,
  onEnterDraw,
  onOpenColorMatrix,
}) => {
  const [selectedDate, setSelectedDate] = useState('02 Oct 2026');

  return (
    <div className="relative min-h-full flex flex-col px-4 pt-3 pb-6">
      {/* Curved background top header */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#1975e6] via-[#2563eb] to-[#3b82f6] -z-10 rounded-b-[30px]" />

      {/* Employee Identity Card (Exact layout in Screenshot 3 left) */}
      <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex items-center space-x-3.5 mb-5 mt-2">
        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg border-2 border-blue-200">
          <UserCheck className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-medium text-slate-500 block leading-tight">
            Name of the employee:
          </span>
          <h2 className="text-base font-extrabold text-slate-800 truncate">
            {currentEmployee.name}
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            Employee ID: {currentEmployee.id}
          </span>
        </div>
      </div>

      {/* Big 3D Enter Date Button (Screenshot 3 left) */}
      <div className="my-auto py-4 flex flex-col items-center">
        <button
          onClick={() => onEnterDraw(selectedDate)}
          className="w-full max-w-[320px] rounded-3xl p-6 text-white text-center relative overflow-hidden group shadow-2xl transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(180deg, #3aa6ff 0%, #0c72e9 40%, #004ecc 100%)',
            boxShadow:
              '0 14px 28px -6px rgba(0, 82, 204, 0.5), inset 0 3px 5px rgba(255, 255, 255, 0.6), inset 0 -4px 6px rgba(0, 40, 120, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.35)',
          }}
        >
          {/* Subtle shine gloss */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl" />

          {/* Calendar Icon */}
          <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Calendar className="w-8 h-8 text-white stroke-[2.5]" />
          </div>

          {/* Date Label */}
          <div className="text-lg font-extrabold tracking-wide drop-shadow text-white mb-2">
            {selectedDate}
          </div>

          {/* Divider line like screenshot */}
          <div className="w-3/4 h-[1.5px] bg-white/40 mx-auto mb-3" />

          {/* ENTER Text */}
          <span className="text-2xl font-black tracking-wider uppercase text-white drop-shadow-md">
            ENTER
          </span>
        </button>

        <p className="text-xs text-slate-400 text-center mt-4">
          Click button to open today's lottery grid & ticket booking desk
        </p>
      </div>

      {/* Date selector dropdown / toggle options */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600">Change Draw Date:</span>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="text-xs font-bold bg-white text-blue-700 border border-blue-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
        >
          <option value="02 Oct 2026">02 Oct 2026 (Today)</option>
          <option value="03 Oct 2026">03 Oct 2026 (Tomorrow)</option>
          <option value="04 Oct 2026">04 Oct 2026</option>
          <option value="05 Oct 2026">05 Oct 2026</option>
        </select>
      </div>

      {/* Shortcut button to the 13-column Master Chart */}
      <button
        onClick={onOpenColorMatrix}
        className="w-full py-3 px-4 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-95"
      >
        <span>View 13-Series Color Master Chart</span>
      </button>
    </div>
  );
};
