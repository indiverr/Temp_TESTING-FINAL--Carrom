import React from 'react';
import {
  ClipboardList,
  FileSpreadsheet,
  CalendarCheck,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface EmployeeMenuScreenProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
  employeeName: string;
}

export const EmployeeMenuScreen: React.FC<EmployeeMenuScreenProps> = ({
  onNavigate,
  onLogout,
  employeeName,
}) => {
  const menuItems = [
    {
      id: 'tasks',
      title: 'Tasks',
      subtitle: 'Daily ticket sales & counters',
      icon: ClipboardList,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      route: 'enter-date', // leads to Screenshot 3
    },
    {
      id: 'my-work',
      title: 'My Work',
      subtitle: 'Sold tickets history & ledger',
      icon: FileSpreadsheet,
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      route: 'my-work',
    },
    {
      id: 'attendance',
      title: 'Attendance',
      subtitle: 'Clock in / out status',
      icon: CalendarCheck,
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-600',
      route: 'attendance',
    },
    {
      id: 'reports',
      title: 'Reports',
      subtitle: 'Daily commission & collection',
      icon: BarChart3,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      route: 'reports',
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences & print size',
      icon: Settings,
      bgColor: 'bg-rose-100',
      iconColor: 'text-rose-600',
      route: 'settings',
    },
    {
      id: 'logout',
      title: 'Logout',
      subtitle: 'Exit session safely',
      icon: LogOut,
      bgColor: 'bg-slate-200',
      iconColor: 'text-slate-600',
      action: onLogout,
    },
  ];

  return (
    <div className="relative min-h-full flex flex-col px-4 pt-4 pb-6">
      {/* Background Curves */}
      <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-[#1975e6] via-[#2563eb] to-[#3b82f6] -z-10 rounded-b-[30px]" />

      {/* Greeting Banner */}
      <div className="text-white px-2 mb-4">
        <div className="flex items-center space-x-1.5 text-xs text-blue-100 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Logged in as</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight">{employeeName}</h2>
      </div>

      {/* 2x3 Grid Cards identical to Screenshot 2 (Employee Menu) */}
      <div className="grid grid-cols-2 gap-3.5">
        {menuItems.map((item) => {
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.route) {
                  onNavigate(item.route);
                }
              }}
              className="bg-white rounded-2xl p-4 shadow-md shadow-blue-900/5 border border-slate-100 flex flex-col items-start justify-between h-36 hover:shadow-lg active:scale-95 transition-all text-left group"
            >
              <div className="w-full flex items-center justify-between">
                <div
                  className={`w-12 h-12 rounded-xl ${item.bgColor} ${item.iconColor} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
                >
                  <IconComp className="w-6 h-6 stroke-[2.2]" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Direct Quick Launch Button for Lottery Sheet */}
      <div className="mt-5">
        <button
          onClick={() => onNavigate('enter-date')}
          className="w-full py-3.5 px-4 rounded-2xl text-white font-extrabold text-sm tracking-wide bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
        >
          <span>Open Lottery Draw Sheet</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
