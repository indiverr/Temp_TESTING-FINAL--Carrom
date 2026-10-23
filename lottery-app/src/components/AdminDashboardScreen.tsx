import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Ticket,
  Trophy,
  Plus,
  TrendingUp,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { EmployeeInfo, TicketItem } from '../types';
import { LOTTERY_COLUMNS_SPEC } from '../mockData';

interface AdminDashboardScreenProps {
  employees: EmployeeInfo[];
  tickets: Record<string, TicketItem>;
  onAddEmployee: (emp: EmployeeInfo) => void;
  onSelectDate: (date: string) => void;
  currentDate: string;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  employees,
  tickets,
  onAddEmployee,
  onSelectDate,
  currentDate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'draws' | 'results'>('overview');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [winningNumber, setWinningNumber] = useState('');
  const [declaredResult, setDeclaredResult] = useState<string | null>(null);

  const bookedTickets = Object.values(tickets).filter((t) => t.status === 'booked');
  const totalRevenue = bookedTickets.reduce((acc, curr) => acc + curr.price, 0);

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName) return;
    const nextId = `EMP00${employees.length + 1}`;
    onAddEmployee({
      id: nextId,
      name: newEmpName,
      phone: newEmpPhone || '9800000000',
      role: 'employee',
    });
    setNewEmpName('');
    setNewEmpPhone('');
  };

  const handleDeclareWinner = () => {
    if (!winningNumber) return;
    setDeclaredResult(winningNumber);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-800 overflow-y-auto no-scrollbar">
      {/* Admin Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 shadow-md sticky top-0 z-20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wide">ADMIN CONSOLE</h2>
              <p className="text-[10px] text-slate-400">Lottery Master Operations</p>
            </div>
          </div>

          <div className="bg-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center space-x-1.5">
            <Calendar className="w-3 h-3 text-blue-400" />
            <span>{currentDate}</span>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex space-x-1 bg-slate-800/80 p-1 rounded-xl text-xs font-bold border border-slate-700/60">
          {(['overview', 'employees', 'draws', 'results'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3.5 space-y-4">
        {activeTab === 'overview' && (
          <>
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Sales</span>
                <span className="text-xl font-black text-blue-600">₹{totalRevenue}</span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                  +18% vs yesterday
                </span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tickets Sold</span>
                <span className="text-xl font-black text-indigo-600">{bookedTickets.length}</span>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                  Across 13 Series
                </span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Agents</span>
                <span className="text-xl font-black text-amber-600">{employees.length}</span>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Staff on duty</span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Available Pool</span>
                <span className="text-xl font-black text-emerald-600">
                  {Object.keys(tickets).length - bookedTickets.length}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Tickets left</span>
              </div>
            </div>

            {/* Recent Ticket Activity */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
              <h3 className="font-extrabold text-xs text-slate-800 mb-2 flex items-center justify-between">
                <span>Recent Agent Bookings</span>
                <span className="text-[10px] text-blue-600 font-bold">Real-time</span>
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {bookedTickets.slice(-6).reverse().map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                        {t.number}
                      </span>
                      <span className="text-slate-700 font-semibold truncate max-w-[100px]">
                        {t.customerName || 'Counter'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">
                        {t.bookedByEmployeeName || 'Agent'}
                      </span>
                      <span className="text-emerald-600 font-bold text-[10px]">₹{t.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'employees' && (
          <div className="space-y-3">
            {/* Add Employee Form */}
            <form onSubmit={handleCreateEmployee} className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-2">
              <span className="text-xs font-extrabold text-slate-800 block">
                Register New Sales Employee
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Employee Name"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                />
                <input
                  type="tel"
                  placeholder="Mobile number"
                  value={newEmpPhone}
                  onChange={(e) => setNewEmpPhone(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Employee</span>
              </button>
            </form>

            {/* Employee List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-2">
              <span className="text-xs font-extrabold text-slate-800 block">
                Active Staff ({employees.length})
              </span>
              <div className="space-y-1.5">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-slate-800 block">{emp.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {emp.id} • {emp.phone}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                      {emp.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'draws' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-2.5">
              <h3 className="font-extrabold text-xs text-slate-800">Lottery Series & Ranges</h3>
              <p className="text-[11px] text-slate-500">
                Manage the active series mapped to the colored 13-column chart.
              </p>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {LOTTERY_COLUMNS_SPEC.map((col, idx) => (
                  <div
                    key={col.id}
                    className="p-2 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: col.headerBg }}
                      />
                      <span className="font-bold text-slate-800">Series #{idx + 1}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {col.rangeLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-black text-sm text-slate-800">Draw Result Announcement</h3>
              <p className="text-xs text-slate-500">
                Declare the winning 4-digit number for draw date {currentDate}.
              </p>

              <div className="max-w-[200px] mx-auto">
                <input
                  type="text"
                  placeholder="e.g. 0728"
                  maxLength={4}
                  value={winningNumber}
                  onChange={(e) => setWinningNumber(e.target.value)}
                  className="w-full text-center text-xl font-mono font-black py-2 bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={handleDeclareWinner}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                Declare Winner
              </button>

              {declaredResult && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-xs font-bold text-amber-800 block">
                    Winner Declared for {currentDate}:
                  </span>
                  <span className="text-2xl font-black font-mono text-amber-700 tracking-widest">
                    #{declaredResult}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
