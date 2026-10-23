import React, { useState, useEffect } from 'react';
import { Radio, Cpu } from 'lucide-react';

export const HeroTechVisual: React.FC = () => {
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % 4);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const telemetrySignals = [
    { label: 'SOIL pH NODE', val: '6.84 pH', status: 'Optimal', color: 'text-brand-lightSky' },
    { label: 'CHAMBER RH', val: '68.2 %', status: 'Regulated', color: 'text-emerald-400' },
    { label: 'IRRIGATION BUS', val: 'PULSE ACTIVE', status: 'Closed-Loop', color: 'text-brand-orange' },
    { label: 'MCU TELEMETRY', val: 'UART / RS485', status: 'Continuous', color: 'text-purple-400' },
  ];

  return (
    <div className="relative w-full max-w-2xl mx-auto lg:max-w-none">
      {/* Main Hardware Container with Tech Framing */}
      <div className="relative rounded-3xl bg-gradient-to-b from-brand-darkNavy via-brand-navy to-[#050C18] border-2 border-slate-800 shadow-2xl p-4 sm:p-6 overflow-hidden">
        
        {/* Subtle Circuit Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E3E6215_1px,transparent_1px),linear-gradient(to_bottom,#1E3E6215_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Top Control Bar with Status Indicators */}
        <div className="relative z-10 flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-bold text-white tracking-wider">ANBU-IOT // REAL HARDWARE BENCH</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <span className="flex items-center gap-1 text-slate-300">
              <Radio className="w-3.5 h-3.5 text-brand-orange animate-pulse" />
              <span>TELEMETRY ACTIVE</span>
            </span>
            <span>•</span>
            <span>SOLAR / 18650</span>
          </div>
        </div>

        {/* Featured Hardware Showcase Visual */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-4">
          
          {/* Main Visual Frame with Real Hardware Prototype Photo (8 Cols) */}
          <div className="sm:col-span-8 relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[4/3] group">
            <img
              src="/assets/projects/smart-agriculture-prototype.jpg"
              alt="Real ANBU IoT Smart Agriculture Hardware Prototype"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Tech Overlay Label */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-white flex items-center gap-1.5 shadow-md">
              <Cpu className="w-3.5 h-3.5 text-brand-orange" />
              <span>REAL HARDWARE PROTOTYPE</span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-gradient-to-r from-brand-darkNavy/95 to-brand-navy/90 backdrop-blur-md border border-brand-blue/30 text-white flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-bold text-white">Smart Agri &amp; Closed-Loop Irrigation</p>
                <p className="text-[10px] text-slate-300 font-mono">Solar Cell • 18650 Battery • Soil Probe • MCU</p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-orange text-white shrink-0 ml-2">
                VERIFIED
              </span>
            </div>
          </div>

          {/* Side Telemetry Status Stream (4 Cols) */}
          <div className="sm:col-span-4 flex flex-col justify-between space-y-2.5">
            {telemetrySignals.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all duration-300 ${
                  pulseIndex === idx
                    ? 'bg-brand-slate/40 border-brand-blue shadow-glow-blue scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{item.label}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${pulseIndex === idx ? 'bg-brand-orange animate-ping' : 'bg-slate-600'}`} />
                </div>
                <div className={`text-base font-bold font-mono ${item.color} mt-1`}>
                  {item.val}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Status: <span className="text-slate-200 font-medium">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Hardware Credibility Strip */}
        <div className="relative z-10 mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <p className="text-[10px] font-mono text-slate-400">CORE ARCHITECTURE</p>
            <p className="text-xs font-bold text-white mt-0.5">Embedded MCU</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <p className="text-[10px] font-mono text-slate-400">DISTRICT FEST</p>
            <p className="text-xs font-bold text-amber-300 mt-0.5">2nd Place Awardee</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <p className="text-[10px] font-mono text-slate-400">ECOSYSTEM</p>
            <p className="text-xs font-bold text-brand-orange mt-0.5">StartupTN Backed</p>
          </div>
        </div>

        {/* Corner Tech Accents */}
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-brand-orange pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-brand-blue pointer-events-none" />
      </div>
    </div>
  );
};
