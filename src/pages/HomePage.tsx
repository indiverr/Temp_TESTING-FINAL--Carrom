import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, CircuitBoard, Sprout, Cog, Bot, BrainCircuit, ShieldCheck, Sparkles, BookOpen, Briefcase, ChevronRight, Zap, Trophy, Building2 } from 'lucide-react';
import { HeroTechVisual } from '../components/HeroTechVisual';
import { CredibilityStrip } from '../components/CredibilityStrip';
import { ProcessWorkflow } from '../components/ProcessWorkflow';
import { ProjectCard } from '../components/ProjectCard';
import { AwardFeature } from '../components/AwardFeature';
import { PrototypeToImpact } from '../components/PrototypeToImpact';
import { RealWorldMoments } from '../components/RealWorldMoments';
import { CTASection } from '../components/CTASection';
import { SEO } from '../components/SEO';
import { projectsData } from '../data/projectsData';
import { solutionsData } from '../data/solutionsData';

export const HomePage: React.FC = () => {
  // Icon mapper for solutions
  const getSolutionIcon = (iconName: string) => {
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
    <div className="flex flex-col flex-grow">
      <SEO
        title="ANBU IoT | Smart Solutions for a Connected World"
        description="ANBU IoT develops practical IoT, embedded, automation and intelligent technology solutions for real-world applications."
      />

      {/* 1. TOP HERO: GOD OF ANBU IOT */}
      <section className="relative pt-8 pb-14 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20 bg-gradient-to-b from-slate-50 via-white to-white overflow-hidden border-b border-slate-200/80">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F040_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F040_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-10 items-center">
            
            {/* Title & Introduction Column */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-4 sm:space-y-5 text-left order-2 lg:order-1 animate-hero-fade">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-brand-blue/20 text-xs font-mono font-bold text-brand-blue uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                <span>CHIEF MENTORS &amp; GUIDING LIGHT</span>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-brand-navy tracking-tight leading-[1.08] uppercase">
                  GOD OF ANBU IOT
                </h1>
                
                <p className="text-xs sm:text-sm lg:text-base font-mono font-bold text-brand-orange uppercase tracking-wide">
                  THE GUIDING PILLAR &amp; INSPIRATION OF ANBU IOT
                </p>
              </div>

              {/* Supporting Copy */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Honoring the visionary mentors, spiritual foundations, and guiding forces behind ANBU IoT. Their profound wisdom, unwavering encouragement, and blessings inspire our engineering team to pioneer practical connected technologies, embedded intelligence, and ground-level innovation for the world.
              </p>

              {/* Highlights */}
              <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono text-slate-700">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-brand-orange" />
                  <span>Visionary Mentors</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-brand-blue" />
                  <span>Spiritual Foundation</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Patrons of Innovation</span>
                </span>
              </div>

              {/* Quick Jump to Venture Overview */}
              <div className="pt-2">
                <a
                  href="#venture-overview"
                  className="inline-flex items-center gap-2 text-xs font-mono font-bold text-brand-blue hover:text-brand-navy transition-colors group"
                >
                  <span>Explore ANBU IoT Technologies Below</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>

            </div>

            {/* Portraits Column: 3 images horizontally in the same line */}
            <div className="lg:col-span-6 xl:col-span-7 flex justify-center order-1 lg:order-2 animate-hero-portrait">
              <div className="grid grid-cols-3 gap-2 sm:gap-3.5 w-full max-w-2xl">
                
                {/* 1. Dr. Joseph A, SJ */}
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-white p-1.5 sm:p-2 border border-slate-200 shadow-premium hover:shadow-glow-blue transition-all duration-300 flex flex-col justify-between group">
                  <img
                    src="/assets/team/patron-1.jpg"
                    alt="Dr. Joseph A, SJ"
                    className="w-full h-auto aspect-[4/5] object-cover object-center rounded-lg sm:rounded-xl"
                  />
                  <div className="mt-1.5 sm:mt-2 text-center">
                    <p className="text-[11px] sm:text-xs md:text-sm font-bold text-brand-navy tracking-tight leading-tight">
                      Dr. Joseph A, SJ
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-mono text-slate-500 font-semibold uppercase mt-0.5">
                      Guiding Patron
                    </p>
                  </div>
                </div>

                {/* 2. Dr. Basil Xavier S, SJ */}
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-white p-1.5 sm:p-2 border border-slate-200 shadow-premium hover:shadow-glow-blue transition-all duration-300 flex flex-col justify-between group">
                  <img
                    src="/assets/team/patron-2.jpg"
                    alt="Dr. Basil Xavier S, SJ"
                    className="w-full h-auto aspect-[4/5] object-cover object-center rounded-lg sm:rounded-xl"
                  />
                  <div className="mt-1.5 sm:mt-2 text-center">
                    <p className="text-[11px] sm:text-xs md:text-sm font-bold text-brand-navy tracking-tight leading-tight">
                      Dr. Basil Xavier S, SJ
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-mono text-slate-500 font-semibold uppercase mt-0.5">
                      Guiding Patron
                    </p>
                  </div>
                </div>

                {/* 3. GOD OF ANBU IOT */}
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-white p-1.5 sm:p-2 border border-slate-200 shadow-premium hover:shadow-glow-blue transition-all duration-300 flex flex-col justify-between group">
                  <img
                    src="/assets/team/god-of-iot.jpg"
                    alt="GOD OF ANBU IOT"
                    className="w-full h-auto aspect-[4/5] object-cover object-center rounded-lg sm:rounded-xl"
                  />
                  <div className="mt-1.5 sm:mt-2 text-center">
                    <p className="text-[11px] sm:text-xs md:text-sm font-bold text-brand-orange tracking-tight leading-tight">
                      GOD OF ANBU IOT
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-mono text-slate-500 font-semibold uppercase mt-0.5">
                      Chief Mentor
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. VENTURE & TECHNOLOGY OVERVIEW */}
      <section id="venture-overview" className="relative pt-12 pb-20 lg:pt-16 lg:pb-24 overflow-hidden bg-white">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F040_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F040_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Brand Status Pill */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200/90 text-xs font-mono font-bold text-slate-800 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                <span>ANBU IoT // EMERGING DEEP-TECH VENTURE</span>
              </div>

              {/* Exact Prompt Headline */}
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-navy tracking-tight leading-[1.08]">
                SMART SOLUTIONS FOR A CONNECTED WORLD
              </h2>

              {/* Exact Prompt Supporting Copy */}
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl font-normal">
                ANBU IoT engineers intelligent systems that connect sensors, embedded technology, automation and real-world applications.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/projects"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-base font-bold text-white bg-gradient-to-r from-brand-navy via-brand-slate to-brand-blue hover:from-brand-blue hover:to-brand-orange shadow-md hover:shadow-glow-blue transition-all duration-200 group"
                >
                  <span>Explore Our Work</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-slate-800 bg-slate-50 border border-slate-300 hover:border-brand-blue hover:text-brand-blue hover:bg-white transition-all duration-200 shadow-xs"
                >
                  <span>Work With Us</span>
                </Link>
              </div>

              {/* Verified Hardware Tags */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-mono text-slate-500">
                <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Real Hardware Prototypes</span>
                </span>
                <span>•</span>
                <span className="text-slate-700 font-semibold">Dindigul Fest 2026 Winner</span>
                <span>•</span>
                <span className="text-slate-700 font-semibold">StartupTN Sanctioned</span>
              </div>
            </div>

            {/* Right Hardware Visual (5 Cols) */}
            <div className="lg:col-span-5">
              <HeroTechVisual />
            </div>

          </div>
        </div>
      </section>

      {/* 3. PROMINENT RECOGNITION MILESTONE */}
      <section className="py-14 sm:py-20 bg-slate-900 text-white relative overflow-hidden border-y border-slate-800">
        {/* Subtle radial tech gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1E3E62_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-30 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-800/95 via-brand-darkNavy to-slate-900 rounded-3xl border-2 border-brand-orange/40 p-6 sm:p-10 lg:p-12 shadow-2xl overflow-hidden relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Real Minister Photograph */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-950 p-2 group">
                  <div className="rounded-xl overflow-hidden aspect-[4/3] bg-slate-900 flex items-center justify-center relative">
                    <img
                      src="/assets/recognition/startuptn-stage-minister.png"
                      alt="StartupTN Seed Fund Sanction presented by Hon'ble Minister for MSME Thiru T. M. Anbarasan"
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 inset-x-0 p-2 bg-black/85 backdrop-blur-xs text-white text-[10px] font-mono text-center">
                      StartupTN Chennai Office • 20 Feb 2026
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievement Content */}
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-xs font-mono font-bold uppercase tracking-wider">
                  <Trophy className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Verified State Milestone</span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight uppercase">
                    RECOGNIZED BY THE HON'BLE MINISTER
                  </h3>
                  <p className="text-base sm:text-lg font-bold text-amber-300">
                    StartupTN Seed Fund Sanction — Gramam Thorum Puthozhil Scheme
                  </p>
                </div>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                  ANBU IoT was recognized through the StartupTN Seed Fund Sanction under the Gramam Thorum Puthozhil Scheme, presented at the StartupTN Chennai Office by Thiru T. M. Anbarasan, Hon'ble Minister for MSME, Government of Tamil Nadu.
                </p>

                {/* Credibility Labels */}
                <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono text-slate-200">
                  <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 font-semibold text-brand-lightSky">
                    🏛️ StartupTN
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 font-semibold text-amber-300">
                    🎖️ Government of Tamil Nadu
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 font-semibold text-slate-300">
                    📍 StartupTN Chennai Office
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 font-semibold text-emerald-400">
                    🌾 Gramam Thorum Puthozhil Scheme
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-brand-navy border border-slate-700 font-semibold text-amber-400">
                    📅 20 February 2026
                  </span>
                </div>

                <div className="pt-3">
                  <Link
                    to="/recognition#startuptn-ecosystem-2026"
                    className="inline-flex items-center gap-2 text-sm font-bold text-brand-orange hover:text-amber-300 transition-colors group"
                  >
                    <span>View full recognition archive &amp; details</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 4. CREDIBILITY STRIP */}
      <CredibilityStrip />

      {/* 5. INTRODUCTION / METHODOLOGY */}
      <ProcessWorkflow />

      {/* 4. SOLUTIONS SECTION */}
      <section className="py-20 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 pb-4 border-b border-slate-200 gap-4">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-brand-orange uppercase">
                // Engineering Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight mt-1">
                Practical Solutions Built For The Ground
              </h2>
            </div>
            <Link
              to="/solutions"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-blue hover:text-brand-navy transition-colors"
            >
              <span>Explore full solution architectures</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 6 Solution Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutionsData.map((sol) => {
              const Icon = getSolutionIcon(sol.iconName);
              return (
                <div
                  key={sol.id}
                  className="bg-white rounded-2xl p-7 border border-slate-200 shadow-subtle hover:shadow-premium hover:border-brand-blue/50 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 text-brand-navy flex items-center justify-center mb-6 group-hover:bg-brand-blue group-hover:text-white group-hover:border-brand-blue transition-all duration-200">
                      <Icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-xl font-bold text-brand-navy group-hover:text-brand-blue transition-colors mb-2">
                      {sol.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-5">
                      {sol.shortDesc}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {sol.capabilities.slice(0, 2).map((cap, cIdx) => (
                        <div key={cIdx} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1 shrink-0" />
                          <span>{cap}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      to={`/solutions#${sol.id}`}
                      className="text-xs font-bold text-brand-navy group-hover:text-brand-blue inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Explore Technical Specs</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. FEATURED PROJECTS */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-brand-orange/30 text-xs font-mono font-bold text-brand-orange uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Flagship Hardware &amp; Prototypes</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-navy tracking-tight">
              Featured Engineering Work
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              Real prototypes developed from ground problems into working sensor systems, verified through live exhibitions and competitive accolades.
            </p>
          </div>

          {/* Large Editorial Project Cards */}
          <div className="space-y-12">
            {projectsData.map((project, idx) => (
              <ProjectCard key={project.id} project={project} index={idx} featured={true} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-brand-navy hover:text-white text-slate-800 text-sm font-bold transition-all duration-200 shadow-xs"
            >
              <span>View All Technical Case Studies</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* 6. RECOGNITION & AWARDS WALL */}
      <AwardFeature />

      {/* 7. PROTOTYPE TO IMPACT TIMELINE */}
      <PrototypeToImpact />

      {/* 8. REAL-WORLD MOMENTS (Curated Event Photos) */}
      <RealWorldMoments />

      {/* 9. FUTURE PREVIEW: COURSES & INTERNSHIPS */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold tracking-widest text-brand-orange uppercase">
              // Future Horizons
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
              Cultivating the Next Generation of Builders
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              ANBU IoT is expanding beyond prototyping to create hands-on technical training and practical internship opportunities for passionate engineers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Courses Card */}
            <div className="p-8 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between hover:border-brand-blue transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-brand-blue/20 text-brand-lightSky border border-brand-blue/40">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                    COMING SOON
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  Learn by Building
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Hands-on technical courses covering Internet of Things, Embedded C firmware, Soil &amp; Environmental Sensor systems, and TinyML microcontrollers.
                </p>

                <ul className="space-y-2 text-xs text-slate-300 font-mono">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                    <span>Hardware-first curriculum with real sensor kits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                    <span>Register-level MCU programming &amp; circuit debugging</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-700 flex items-center justify-between">
                <Link
                  to="/courses"
                  className="text-sm font-bold text-brand-lightSky hover:text-white inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Explore Course Modules &amp; Updates</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Internships Card */}
            <div className="p-8 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between hover:border-brand-orange transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-brand-orange/20 text-brand-orange border border-brand-orange/40">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-500/20 text-brand-lightSky border border-blue-500/30">
                    INTEREST OPEN
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  Build. Learn. Experience.
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Structured internship tracks in IoT hardware, embedded firmware, agritech automation, robotics, and applied edge machine learning.
                </p>

                <ul className="space-y-2 text-xs text-slate-300 font-mono">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                    <span>Direct involvement in real prototype iteration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                    <span>Guidance on laboratory test benches and field trials</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-700 flex items-center justify-between">
                <Link
                  to="/internships"
                  className="text-sm font-bold text-brand-orange hover:text-amber-300 inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>View Tracks &amp; Register Interest</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <CTASection />
    </div>
  );
};
