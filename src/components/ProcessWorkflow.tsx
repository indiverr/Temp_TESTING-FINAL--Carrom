import React from 'react';
import { Eye, Wifi, LineChart, Zap, ArrowRight } from 'lucide-react';

export const ProcessWorkflow: React.FC = () => {
  const steps = [
    {
      step: '01',
      phase: 'SENSE',
      title: 'Physical Signal Acquisition',
      description: 'Deploying robust multi-parameter sensors (electrochemical, optical, thermal, ultrasonic) directly into physical environments to capture untampered ground-truth data.',
      icon: Eye,
      color: 'from-blue-600 to-cyan-500',
      badge: 'Sensors & Probes'
    },
    {
      step: '02',
      phase: 'CONNECT',
      title: 'Deterministic Telemetry',
      description: 'Conditioning analog microvolt signals and transmitting structured packets over industrial bus interfaces (RS-485, Modbus, UART) and low-power wireless networks.',
      icon: Wifi,
      color: 'from-cyan-500 to-blue-500',
      badge: 'MCU & Bus Network'
    },
    {
      step: '03',
      phase: 'ANALYSE',
      title: 'Embedded Edge Computation',
      description: 'Processing metrics on 32-bit microcontrollers using calibration curves, threshold algorithms, and anomaly detection without forcing reliance on heavy external infrastructure.',
      icon: LineChart,
      color: 'from-blue-500 to-orange-500',
      badge: 'Edge Logic'
    },
    {
      step: '04',
      phase: 'AUTOMATE',
      title: 'Closed-Loop Actuation',
      description: 'Closing the loop by driving physical relays, pumps, valves, and warning systems automatically based on real-time sensory thresholds to prevent human error.',
      icon: Zap,
      color: 'from-orange-500 to-amber-500',
      badge: 'Actuators & Relays'
    },
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-brand-blue/20 text-xs font-mono font-bold text-brand-blue uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-brand-blue animate-ping" />
            <span>Problem-First Engineering Methodology</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight">
            Technology That Starts With a Real Problem
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            At ANBU IoT, we do not build technology for the sake of novelty. Every architecture follows a rigorous four-stage physical-to-digital loop engineered for reliability.
          </p>
        </div>

        {/* 4-Step Interactive Visual Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative bg-slate-50/80 rounded-2xl p-7 border border-slate-200 shadow-subtle hover:shadow-premium hover:border-brand-blue/50 hover:bg-white transition-all duration-300 group flex flex-col justify-between"
              >
                {/* Connecting arrow for desktop */}
                {index < 3 && (
                  <div className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white border border-slate-300 shadow-sm items-center justify-center text-slate-400 group-hover:text-brand-orange group-hover:border-brand-orange transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl font-black font-mono text-slate-300 group-hover:text-brand-blue transition-colors">
                      {item.step}
                    </span>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 shadow-xs">
                      {item.badge}
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-navy to-brand-slate text-white flex items-center justify-center shadow-md mb-5 group-hover:scale-110 group-hover:from-brand-blue group-hover:to-brand-orange transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="text-xs font-mono font-bold tracking-widest text-brand-orange uppercase mb-1">
                    {item.phase}
                  </div>
                  <h3 className="text-lg font-bold text-brand-navy mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Phase {index + 1} of 4</span>
                  <span className="w-2 h-2 rounded-full bg-brand-blue/40 group-hover:bg-brand-orange transition-colors" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Closed-Loop System Summary Banner */}
        <div className="mt-12 bg-gradient-to-r from-brand-navy via-brand-slate to-brand-darkNavy text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-orange/20 border border-brand-orange/40 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-brand-orange animate-pulse" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white">
                Deterministic Closed-Loop Architecture
              </h4>
              <p className="text-sm text-slate-300">
                Sensors inform algorithms, algorithms trigger actuators, and actuators modulate the environment.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-xs font-mono font-bold text-brand-lightSky border border-white/10 shrink-0">
            <span>Deterministic • Real-Time • Field-Ready</span>
          </div>
        </div>
      </div>
    </section>
  );
};
