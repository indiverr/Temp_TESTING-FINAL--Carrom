import React, { useState } from 'react';
import { User } from 'lucide-react';
import { EmployeeInfo } from '../types';

interface EmployeeNameEntryScreenProps {
  onContinue: (employeeName: string) => void;
  registeredEmployees: EmployeeInfo[];
}

export const EmployeeNameEntryScreen: React.FC<EmployeeNameEntryScreenProps> = ({
  onContinue,
  registeredEmployees,
}) => {
  const [employeeName, setEmployeeName] = useState('Sasikaran');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim()) {
      setError('Please enter employee name');
      return;
    }
    onContinue(employeeName.trim());
  };

  return (
    <div className="relative min-h-full flex flex-col justify-start px-5 pt-8 pb-6">
      {/* Background Header styling */}
      <div className="absolute top-0 left-0 right-0 h-56 bg-gradient-to-b from-[#1975e6] via-[#2563eb] to-[#3b82f6] -z-10 rounded-b-[35px]" />

      {/* Main Container Card (From Screenshot 2 - Employee screen) */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 mt-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Name of the employee:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => {
                  setEmployeeName(e.target.value);
                  setError('');
                }}
                placeholder="Enter"
                list="registered-names"
                className="w-full pl-11 pr-3 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-800 font-medium placeholder:text-slate-400"
              />
              <datalist id="registered-names">
                {registeredEmployees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.id}
                  </option>
                ))}
              </datalist>
            </div>
            {error && <p className="mt-1 text-xs text-rose-500 font-semibold">{error}</p>}
          </div>

          {/* Quick pick suggestion pills */}
          <div>
            <span className="text-[11px] font-semibold text-slate-600 block mb-2">
              Quick select employee:
            </span>
            <div className="flex flex-wrap gap-2">
              {registeredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setEmployeeName(emp.name)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    employeeName === emp.name
                      ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {emp.name} ({emp.id})
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm tracking-wide bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 shadow-md shadow-blue-500/30 active:scale-[0.98] transition-all"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};
