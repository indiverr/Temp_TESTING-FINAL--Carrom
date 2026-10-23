import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Building2, Newspaper, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AwardFeature: React.FC = () => {
  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Subtle radial tech gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E3E62_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-4">
            <Trophy className="w-3.5 h-3.5" />
            <span>Verified Industry &amp; Ecosystem Recognition</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Recognition That Came From Building
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Genuine accomplishments from real exhibitions, state minister stage disbursements, and competitive innovation fest accolades.
          </p>
        </div>

        {/* Flagship Award Feature Banner (Dindigul Fest Second Place - Real Stage Photo) */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-800/90 via-brand-darkNavy to-slate-900 border-2 border-amber-500/40 p-6 sm:p-10 shadow-2xl mb-12 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Real Stage Photo (5 Cols) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/50 bg-slate-950 p-2 group">
                <div className="rounded-xl overflow-hidden aspect-[4/3] bg-slate-900 flex items-center justify-center">
                  <img
                    src="/assets/recognition/dindigul-stage-award.jpg"
                    alt="Stage Award Ceremony: Dindigul Science, Technology and Startups Fest 2026"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                <div className="mt-2 text-center">
                  <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                    ★ On-Stage Award Presentation • MSP Auditorium, Dindigul
                  </span>
                </div>
              </div>
            </div>

            {/* Award Content (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold">
                <Trophy className="w-4 h-4" />
                <span>DISTRICT SCIENCE &amp; STARTUPS FEST 2026</span>
              </div>

              <div>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  SECOND PLACE
                </h3>
                <p className="text-lg sm:text-xl font-bold text-amber-300 mt-1">
                  Dindigul Science, Technology and Startups Fest – 2026
                </p>
                <p className="text-xs font-mono text-slate-300 mt-1">
                  Jointly Organised by Dindigul District Administration &amp; Prof. S. S. Nagarajan Science Trust
                </p>
                <p className="text-xs font-mono text-brand-lightSky mt-0.5">
                  Category: Arts and Science Colleges (District Level) • Jan 28 – Feb 3, 2026
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Awarded for demonstrative excellence with the working IoT-Based Soil Testing prototype. Evaluators commended the system’s measurement accuracy, low-power embedded design, and direct utility for regional cultivators in Tamil Nadu.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-200">Demonstrated live with functional hardware probes</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-200">Official plaque &amp; commendation awarded</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/recognition#dindigul-fest-2026"
                  className="inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <span>Read full recognition details &amp; timeline</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* 2-Grid Secondary Recognition Proofs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* StartupTN Ministerial Sanction */}
          <div className="rounded-3xl bg-slate-800/80 border border-slate-700/80 p-6 sm:p-8 flex flex-col justify-between hover:border-brand-blue/50 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-brand-lightSky text-xs font-mono font-bold">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>STARTUPTN CHENNAI OFFICE</span>
                </div>
                <span className="text-xs font-mono text-slate-400">20 February 2026</span>
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                RECOGNIZED BY THE HON'BLE MINISTER
              </h4>

              <p className="text-xs sm:text-sm font-mono text-amber-300 font-bold">
                StartupTN Seed Fund Sanction — Gramam Thorum Puthozhil Scheme
              </p>

              <p className="text-sm text-slate-300 leading-relaxed">
                ANBU IoT was recognized through the StartupTN Seed Fund Sanction under the Gramam Thorum Puthozhil Scheme, presented at the StartupTN Chennai Office by Thiru T. M. Anbarasan, Hon'ble Minister for MSME, Government of Tamil Nadu.
              </p>

              {/* Real Minister Stage Photo */}
              <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 aspect-[16/9] relative group">
                <img
                  src="/assets/recognition/startuptn-stage-minister.png"
                  alt="StartupTN Seed Fund Sanction presented by Hon'ble Minister for MSME Thiru T. M. Anbarasan"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 inset-x-0 p-2.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono">
                  Hon'ble MSME Minister Thiru T. M. Anbarasan presenting sanction order • StartupTN Chennai
                </div>
              </div>

              {/* Credibility Badges */}
              <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-300">
                <span className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700 text-brand-lightSky font-semibold">StartupTN</span>
                <span className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700 text-amber-300 font-semibold">Government of Tamil Nadu</span>
                <span className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700 text-emerald-400 font-semibold">Gramam Thorum Puthozhil Scheme</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/80 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Venue: Chennai, Tamil Nadu</span>
              <Link to="/recognition#startuptn-ecosystem-2026" className="text-xs font-bold text-brand-lightSky hover:underline flex items-center gap-1">
                <span>View Sanction Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Real Media Feature (Newspaper Clipping) */}
          <div className="rounded-3xl bg-slate-800/80 border border-slate-700/80 p-6 sm:p-8 flex flex-col justify-between hover:border-brand-orange/50 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-orange-500/10 border border-orange-500/30 text-brand-orange text-xs font-mono font-bold">
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>REGIONAL MEDIA ARCHIVE</span>
                </div>
                <span className="text-xs font-mono text-slate-400">Press Feature</span>
              </div>

              <h4 className="text-xl font-bold text-white">
                Newspaper Feature on ANBU IoT Innovation
              </h4>

              <p className="text-xs font-mono text-brand-lightSky font-semibold">
                “அருளானந்தர் கல்லூரி சார்பில் மாபெரும் கண்காட்சி — அன்பு ROI Startup”
              </p>

              <p className="text-sm text-slate-300 leading-relaxed">
                Documented press clipping covering the ANBU team’s low-cost real-time portable sensor system for agricultural monitoring, automatic plant hydration, and field cost reduction.
              </p>

              {/* Real Newspaper Clipping Photo */}
              <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 aspect-[16/9] relative group">
                <img
                  src="/assets/recognition/newspaper-clipping-tamil.png"
                  alt="Real Tamil Newspaper Clipping on ANBU IoT Innovation"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 inset-x-0 p-2.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono">
                  Documented regional press coverage of ANBU sensor innovation
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/80 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Coverage: Innovation &amp; Startups</span>
              <Link to="/recognition#media-coverage-regional-press" className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
                <span>View Full Press Clipping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
