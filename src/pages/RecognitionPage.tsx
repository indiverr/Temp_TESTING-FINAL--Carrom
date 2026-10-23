import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Award, Building2, Newspaper, CheckCircle2, ShieldCheck, ArrowRight, ExternalLink, Calendar, MapPin } from 'lucide-react';
import { SEO } from '../components/SEO';
import { recognitionData } from '../data/recognitionData';
import { RealWorldMoments } from '../components/RealWorldMoments';
import { CTASection } from '../components/CTASection';

export const RecognitionPage: React.FC = () => {
  return (
    <div className="flex flex-col flex-grow bg-white">
      <SEO
        title="Recognition & Awards — ANBU IoT"
        description="Verified awards, StartupTN ecosystem recognition, and media coverage earned through real engineering prototypes and exhibitions."
      />

      {/* Header */}
      <section className="pt-16 pb-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1E3E62_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-4">
              <Trophy className="w-3.5 h-3.5" />
              <span>Evidence of Genuine Milestones</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Recognition That Came From Building
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed font-normal">
              Every accolade, state sanction, and media feature in ANBU IoT’s journey was earned through working hardware demonstrations and rigorous peer evaluation.
            </p>
          </div>
        </div>
      </section>

      {/* Recognition Timeline / Showcase */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          
          {recognitionData.map((item, idx) => {
            const isEven = idx % 2 === 0;

            return (
              <div
                key={item.id}
                id={item.id}
                className="scroll-mt-24 rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-10 lg:p-12 shadow-subtle hover:shadow-premium transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  
                  {/* Left Media / Plaque Frame (5 Cols) */}
                  <div className={`lg:col-span-5 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-xl group aspect-[4/5] sm:aspect-square flex items-center justify-center p-4">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain rounded-xl group-hover:scale-102 transition-transform duration-300"
                      />
                      
                      <div className="absolute top-3 left-3">
                        <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-md bg-black/80 text-white backdrop-blur-md border border-white/10">
                          {item.evidenceType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Description & Details (7 Cols) */}
                  <div className={`lg:col-span-7 space-y-6 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                    
                    <div>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono mb-2">
                        <span className="px-2.5 py-1 rounded bg-brand-navy text-white font-bold">
                          {item.year}
                        </span>
                        <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                          {item.badge}
                        </span>
                        <span className="text-slate-500 font-semibold">
                          {item.category}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight mt-2">
                        {item.title}
                      </h2>

                      {/* Location & Organization Meta */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 mt-2">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-brand-blue" />
                          <span>{item.organization}</span>
                        </span>
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-brand-orange" />
                            <span>{item.location}</span>
                          </span>
                        )}
                        {item.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.date}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-base text-slate-700 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Highlights Points */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Key Verification Highlights
                      </h4>
                      {item.highlights.map((hl, hlIdx) => (
                        <div key={hlIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs font-mono text-slate-500">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <ShieldCheck className="w-4 h-4 text-brand-blue" />
                        <span>Factual Evidence Verified</span>
                      </span>
                      <span>Ref: #REC-2026-{idx + 1}</span>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}

        </div>
      </section>

      {/* Real-World Moments (Photos) */}
      <RealWorldMoments />

      {/* CTA */}
      <CTASection />
    </div>
  );
};
