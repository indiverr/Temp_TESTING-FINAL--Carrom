import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, MessageSquare, Cpu } from 'lucide-react';

export const CTASection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-white via-slate-50 to-slate-100 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-blue/10 to-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-navy text-white text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-brand-orange animate-pulse" />
          <span>COLLABORATION &amp; ENGINEERING ENQUIRIES</span>
        </div>

        {/* Exact prompt headline & copy */}
        <h2 className="text-3xl sm:text-5xl font-black text-brand-navy tracking-tight max-w-3xl mx-auto">
          Have a problem worth engineering?
        </h2>

        <p className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-brand-slate to-brand-orange mt-3 mb-6">
          Let's turn the idea into something real.
        </p>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
          Whether you are exploring IoT sensing for agriculture, custom microcontroller firmware, automation systems, or institutional collaboration — we are ready to engineer practical solutions.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/contact"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-brand-navy via-brand-slate to-brand-blue hover:from-brand-blue hover:to-brand-orange shadow-lg hover:shadow-glow-blue transition-all duration-200 group"
          >
            <span>Start a Conversation</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            to="/projects"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-bold text-slate-800 bg-white border border-slate-300 hover:border-brand-blue hover:text-brand-blue shadow-sm transition-all duration-200"
          >
            <Cpu className="w-4 h-4 text-brand-orange" />
            <span>Explore Working Prototypes</span>
          </Link>
        </div>

        {/* Sub-strip Proof */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Ground-Tested Prototypes</span>
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-blue" />
            <span>Direct Engineering Engagement</span>
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-orange" />
            <span>StartupTN Ecosystem Backed</span>
          </span>
        </div>

      </div>
    </section>
  );
};
