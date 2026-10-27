import React, { useState, useMemo } from 'react';
import { UserCheck, Calendar, ArrowRight, Grid, Clock, Sparkles } from 'lucide-react';
import { EmployeeProfile, WeeklyTicketPresetsConfig, DayOfWeek, DAYS_OF_WEEK } from '../types';

interface EnterDrawDateScreenProps {
  currentStaff: EmployeeProfile;
  onEnterDraw: (date: string) => void;
  onOpenAvailableGallery: () => void;
  weeklyPresets?: WeeklyTicketPresetsConfig;
}

export const EnterDrawDateScreen: React.FC<EnterDrawDateScreenProps> = ({
  currentStaff,
  onEnterDraw,
  onOpenAvailableGallery,
  weeklyPresets,
}) => {
  // Generate 7 consecutive days starting from today
  const weekDays = useMemo(() => {
    const today = new Date();
    const days: Array<{ dateStr: string; dayName: DayOfWeek; isToday: boolean; shortDate: string }> = [];
    const dayNames: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const dateStr = `${day} ${month} ${year}`;
      const dayName = dayNames[d.getDay()];

      days.push({
        dateStr,
        dayName,
        isToday: i === 0,
        shortDate: `${day} ${month}`,
      });
    }
    return days;
  }, []);

  const [selectedDate, setSelectedDate] = useState(weekDays[0]?.dateStr || '27 Oct 2026');
  const [customDate, setCustomDate] = useState('');

  const selectedWeekDay = weekDays.find((d) => d.dateStr === selectedDate);
  const activeDayName: DayOfWeek = selectedWeekDay?.dayName || 'Tuesday';
  const activeDayPreset = weeklyPresets?.days?.[activeDayName];
  const presetTicketsCount = activeDayPreset?.tickets?.length || 0;

  const roleLabel =
    currentStaff.role === 'paid_employee'
      ? 'Paid Employee'
      : currentStaff.role === 'employee'
      ? 'Employee'
      : 'Admin';

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setCustomDate('');
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customDate.trim()) {
      setSelectedDate(customDate.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-auto flex flex-col space-y-5 select-none p-4 sm:p-6">
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

      {/* 1-Week Draw Date & Preset Schedule Selection */}
      <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 flex flex-col space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>1-Week Draw Date Schedule</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select today or any day of the week to manage daily ticket inventory and bookings.
            </p>
          </div>
          {activeDayPreset && activeDayPreset.enabled && (
            <div className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{activeDayName} Preset: {presetTicketsCount} tickets</span>
            </div>
          )}
        </div>

        {/* 7 Days of the Week Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {weekDays.map((d) => {
            const isSelected = selectedDate === d.dateStr;
            const dayPreset = weeklyPresets?.days?.[d.dayName];
            const hasPreset = Boolean(dayPreset && dayPreset.enabled && dayPreset.tickets?.length > 0);
            const count = dayPreset?.tickets?.length || 0;

            return (
              <button
                key={d.dateStr}
                onClick={() => handleSelectDate(d.dateStr)}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center space-y-1 relative ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {d.isToday && (
                  <span
                    className={`absolute -top-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      isSelected
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    Today
                  </span>
                )}
                <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {d.dayName.slice(0, 3)}
                </span>
                <span className={`text-[12px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>
                  {d.shortDate}
                </span>
                {hasPreset && (
                  <span
                    className={`text-[9px] px-1 py-0.5 rounded font-mono ${
                      isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count} tkts
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Date Input for dates outside the 7-day week */}
        <div className="pt-2 border-t border-slate-100">
          <form onSubmit={handleCustomDateSubmit} className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Or custom date:</span>
            <input
              type="text"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              placeholder="e.g. 15 Nov 2026"
              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Set
            </button>
          </form>
        </div>

        {/* Selected date preview and action */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Selected Draw Date:</span>{' '}
            <strong className="text-slate-900 font-mono text-sm">{selectedDate}</strong>
            {selectedWeekDay && (
              <span className="text-slate-500 ml-1.5">({selectedWeekDay.dayName})</span>
            )}
          </div>
          {activeDayPreset && activeDayPreset.enabled && (
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] font-semibold">
              Preset Ready ({presetTicketsCount} tkts)
            </span>
          )}
        </div>

        <button
          onClick={() => onEnterDraw(selectedDate)}
          className="w-full rounded-xl py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center space-x-2 transition-colors shadow-xs"
        >
          <span>Open Booking Desk ({selectedDate})</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
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
