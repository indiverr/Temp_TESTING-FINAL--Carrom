import React from 'react';
import { Wifi, Signal, Battery, ArrowLeft, Menu, User } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  onMenu?: () => void;
  showProfile?: boolean;
  onProfile?: () => void;
  currentDateBadge?: string;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  title,
  showBack,
  onBack,
  showMenu,
  onMenu,
  showProfile,
  onProfile,
  currentDateBadge,
}) => {
  return (
    <div className="relative mx-auto w-full max-w-[390px] h-[844px] bg-slate-900 rounded-[50px] p-[10px] shadow-2xl border-[4px] border-slate-700/80 select-none flex flex-col overflow-hidden">
      {/* Dynamic Island / Front Speaker & Camera */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
        <div className="w-28 h-5 bg-black rounded-full flex items-center justify-between px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
          <div className="w-3 h-3 rounded-full bg-slate-950 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-950/60" />
          </div>
        </div>
      </div>

      {/* Screen container */}
      <div className="relative w-full h-full bg-white rounded-[40px] overflow-hidden flex flex-col">
        {/* Status Bar */}
        <div className="pt-2 px-6 pb-1 flex justify-between items-center text-xs text-slate-800 font-semibold z-40 bg-transparent">
          <span className="text-[13px] tracking-tight">10:25</span>
          <div className="flex items-center space-x-1.5">
            <Signal className="w-3.5 h-3.5 text-slate-800" />
            <Wifi className="w-3.5 h-3.5 text-slate-800" />
            <div className="flex items-center space-x-1">
              <span className="text-[11px] font-bold">78%</span>
              <Battery className="w-4 h-4 text-slate-800 fill-slate-800" />
            </div>
          </div>
        </div>

        {/* Optional App Bar if title or actions provided */}
        {(title || showBack || showMenu || showProfile || currentDateBadge) && (
          <div className="relative px-4 py-2 flex items-center justify-between z-30">
            <div className="flex items-center space-x-2 min-w-[40px]">
              {showBack && (
                <button
                  onClick={onBack}
                  className="p-1.5 rounded-full hover:bg-black/10 active:scale-95 transition-all text-white"
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}
              {showMenu && (
                <button
                  onClick={onMenu}
                  className="p-1.5 rounded-full hover:bg-black/10 active:scale-95 transition-all text-white"
                  title="Menu"
                >
                  <Menu className="w-6 h-6 stroke-[2.5]" />
                </button>
              )}
              {currentDateBadge && (
                <div className="bg-white/95 backdrop-blur shadow-sm px-2.5 py-0.5 rounded-md text-[11px] font-bold text-slate-800 border border-slate-200">
                  {currentDateBadge}
                </div>
              )}
            </div>

            {title && (
              <h1 className="text-base font-bold text-white tracking-wide uppercase drop-shadow-sm text-center flex-1">
                {title}
              </h1>
            )}

            <div className="flex items-center justify-end min-w-[40px]">
              {showProfile && (
                <button
                  onClick={onProfile}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all shadow-sm"
                  title="User Profile"
                >
                  <User className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Screen Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
          {children}
        </div>

        {/* Home Indicator bar */}
        <div className="w-full flex justify-center py-2 bg-transparent pointer-events-none">
          <div className="w-32 h-1 bg-slate-300 rounded-full" />
        </div>
      </div>
    </div>
  );
};
