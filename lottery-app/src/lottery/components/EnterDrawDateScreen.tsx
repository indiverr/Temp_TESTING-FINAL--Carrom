import React, { useState } from 'react';
import { UserCheck, Calendar, ArrowRight, Grid } from 'lucide-react';
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

  const roleLabel =
    currentStaff.role === 'paid_employee'
      ? 'Paid Employee'
      : currentStaff.role === 'employee'
      ? 'Employee'
      : 'Admin';

  return (
    <div className="w-full max-w-xl mx-auto my-auto flex flex-col space-y-5 select-none p-4 sm:p-6">
      {/* Staff Card */}
      <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">
              Operator
            </span>
            <h2 className="text-base font-bold text-slate-900">
              {currentStaff.name}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
              <span>ID: {currentStaff.id}</span>
              <span>•</span>
              <span className="capitalize font-semibold text-slate-700">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
          Online
        </span>
      </div>

      {/* Draw Date Selection */}
      <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 flex flex-col space-y-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Select Draw Date
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose the draw date to manage ticket inventory and bookings.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {['02 Oct 2026', '03 Oct 2026', '04 Oct 2026'].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`py-3 px-3 rounded-lg border text-xs font-semibold transition-colors flex flex-col items-center justify-center space-y-1.5 ${
                selectedDate === d
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{d}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => onEnterDraw(selectedDate)}
          className="w-full rounded-lg py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center space-x-2 transition-colors"
        >
          <span>Open Booking Desk ({selectedDate})</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onOpenAvailableGallery}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors flex items-center space-x-2"
          >
            <Grid className="w-4 h-4 text-slate-600" />
            <span>View Available Numbers Sheet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
