import React from 'react';
import { Cpu, Trophy, Building2, Layers } from 'lucide-react';

export const CredibilityStrip: React.FC = () => {
  const points = [
    {
      title: 'Real Prototypes',
      description: 'Hands-on hardware and IoT development with physical sensor nodes, custom enclosures, and field-tested firmware.',
      icon: Cpu,
      accent: 'border-brand-blue/30 text-brand-blue bg-blue-50/50',
      badge: 'Hardware Verified'
    },
    {
      title: 'Award Recognition',
      description: 'Recognised through regional science, technology and startup innovation events including District Second Place.',
      icon: Trophy,
      accent: 'border-amber-500/30 text-amber-600 bg-amber-50/50',
      badge: '2026 Winner'
    },
    {
      title: 'Startup Ecosystem',
      description: 'StartupTN-related recognition and seed-fund sanction documentation supporting our regional technology mission.',
      icon: Building2,
      accent: 'border-brand-orange/30 text-brand-orange bg-orange-50/50',
      badge: 'StartupTN'
    },
    {
      title: 'Innovation in Practice',
      description: 'Projects demonstrated live through exhibitions, academic forums, and real-world agricultural scenarios.',
      icon: Layers,
      accent: 'border-emerald-500/30 text-emerald-600 bg-emerald-50/50',
      badge: 'Demonstrated'
    },
  ];

  return (
    <section className="bg-slate-50/90 border-y border-slate-200/80 py-12 sm:py-14 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200/60 gap-4">
          <div>
            <span className="text-xs font-mono font-bold tracking-widest text-brand-orange uppercase">
              // Proven Engineering
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight mt-1">
              BUILT. TESTED. RECOGNISED.
            </h2>
          </div>
          <p className="text-sm font-medium text-slate-600 max-w-md">
            No exaggerated corporate statistics. Real engineering verified by working prototypes, state startup recognition, and live exhibitions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-subtle hover:shadow-premium hover:border-brand-blue/40 transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-lg border ${item.accent} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-blue transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-brand-slate">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                  <span>Ground-Validated Technology</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
