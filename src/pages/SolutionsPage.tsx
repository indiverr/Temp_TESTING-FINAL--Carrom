import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, CircuitBoard, Sprout, Cog, Bot, BrainCircuit, CheckCircle2, ArrowRight, Layers, ShieldCheck, Zap } from 'lucide-react';
import { SEO } from '../components/SEO';
import { solutionsData } from '../data/solutionsData';
import { CTASection } from '../components/CTASection';

export const SolutionsPage: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu': return Cpu;
      case 'CircuitBoard': return CircuitBoard;
      case 'Sprout': return Sprout;
      case 'Cog': return Cog;
      case 'Bot': return Bot;
      case 'BrainCircuit': return BrainCircuit;
      default: return Cpu;
    }
  };

  return (
    <div className="flex flex-col flex-grow bg-white">
      <SEO
        title="Solutions — Engineering Capabilities"
        description="Explore ANBU IoT's core technology pillars: IoT & sensor systems, embedded electronics, smart agriculture, automation, robotics, and applied AI/ML."
      />

      {/* Header */}
      <section className="pt-16 pb-20 bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-brand-blue/20 text-xs font-mono font-bold text-brand-blue uppercase tracking-wider mb-4">
              <span>Engineering Solutions</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-brand-navy tracking-tight leading-tight">
              Hardware, Firmware &amp; Telemetry Built for Real Environments
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              We specialize in turning physical data into actionable automation. Explore our six foundational engineering pillars designed for reliability, affordability, and performance.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions Detail List */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {solutionsData.map((sol, index) => {
            const Icon = getIcon(sol.iconName);
            const isEven = index % 2 === 0;

            return (
              <div
                key={sol.id}
                id={sol.id}
                className="scroll-mt-24 rounded-3xl border border-slate-200 bg-slate-50/60 p-8 sm:p-12 shadow-subtle hover:shadow-premium hover:border-brand-blue/30 transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                  
                  {/* Left Overview (5 Cols) */}
                  <div className="lg:col-span-5 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-brand-navy text-white flex items-center justify-center shadow-md">
                        <Icon className="w-7 h-7 text-brand-lightSky" />
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-brand-orange uppercase">
                          // PILLAR 0{index + 1}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
                          {sol.title}
                        </h2>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs font-mono font-semibold text-brand-blue flex items-center gap-2">
                      <Zap className="w-4 h-4 text-brand-orange shrink-0" />
                      <span>{sol.highlight}</span>
                    </div>

                    <p className="text-base text-slate-700 leading-relaxed">
                      {sol.fullDesc}
                    </p>

                    <div className="pt-2">
                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-navy hover:bg-brand-blue text-white text-sm font-bold shadow-sm transition-colors"
                      >
                        <span>Discuss an Application</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Right Capabilities & Applications (7 Cols) */}
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200">
                    
                    {/* Capabilities */}
                    <div>
                      <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-brand-navy mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-brand-blue" />
                        <span>Core Capabilities</span>
                      </h3>
                      <ul className="space-y-3">
                        {sol.capabilities.map((cap, cIdx) => (
                          <li key={cIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Typical Applications */}
                    <div>
                      <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-brand-navy mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-brand-orange" />
                        <span>Real Applications</span>
                      </h3>
                      <ul className="space-y-3">
                        {sol.applications.map((app, aIdx) => (
                          <li key={aIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
                            <span>{app}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <CTASection />
    </div>
  );
};
