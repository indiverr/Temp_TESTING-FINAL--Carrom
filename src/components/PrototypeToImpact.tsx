import React from 'react';
import { Compass, Hammer, Presentation, CheckCircle, TrendingUp } from 'lucide-react';

export const PrototypeToImpact: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Explore',
      subtitle: 'Identify Real Ground Problems',
      description: 'Engage with agricultural practitioners, rural cultivators, and industrial technicians to discover acute friction points where telemetry can replace guesswork.',
      icon: Compass,
      accent: 'from-blue-600 to-cyan-500'
    },
    {
      num: '02',
      title: 'Build',
      subtitle: 'Hardware & Firmware Prototyping',
      description: 'Develop rapid circuit layouts, calibrate sensor probes, write non-blocking firmware routines, and assemble physical enclosures designed for field endurance.',
      icon: Hammer,
      accent: 'from-cyan-500 to-blue-600'
    },
    {
      num: '03',
      title: 'Demonstrate',
      subtitle: 'Exhibitions & Live Trials',
      description: 'Put working prototypes in front of evaluators, researchers, and dignitaries at state science festivals, technology symposiums, and live test-beds.',
      icon: Presentation,
      accent: 'from-blue-600 to-indigo-600'
    },
    {
      num: '04',
      title: 'Validate',
      subtitle: 'Ecosystem Feedback & Awards',
      description: 'Attain competitive jury accolades, state startup sanctions (StartupTN), and documented third-party media validation of engineering viability.',
      icon: CheckCircle,
      accent: 'from-indigo-600 to-orange-500'
    },
    {
      num: '05',
      title: 'Evolve',
      subtitle: 'Scaling Toward Deployments',
      description: 'Iterate based on ground performance, optimize Bill of Materials, incorporate telemetry meshes (LoRa/Cellular), and prepare for scalable regional manufacturing.',
      icon: TrendingUp,
      accent: 'from-orange-500 to-amber-500'
    }
  ];

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-brand-blue/20 text-xs font-mono font-bold text-brand-blue uppercase tracking-wider mb-4">
            <span>The Innovation Journey</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight">
            From Prototype to the Real World
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            How ANBU IoT systematically moves engineering concepts from raw electronic components to validated technology platforms.
          </p>
        </div>

        {/* 5-Step Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-premium hover:border-brand-blue/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-slate-300 group-hover:text-brand-orange transition-colors">
                      {item.num}
                    </span>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-brand-navy group-hover:bg-brand-blue group-hover:text-white transition-all duration-200">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-brand-navy group-hover:text-brand-blue transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs font-mono font-semibold text-brand-orange mt-0.5 mb-3">
                    {item.subtitle}
                  </p>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Step {idx + 1} of 5</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-blue/30 group-hover:bg-brand-orange" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
