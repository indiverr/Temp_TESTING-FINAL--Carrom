import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Target, Compass, HeartHandshake, BookOpen, Layers, CheckCircle2, ArrowRight, Award, Building2, Users, Sparkles, UserCheck, Briefcase } from 'lucide-react';
import { SEO } from '../components/SEO';
import { CredibilityStrip } from '../components/CredibilityStrip';
import { CTASection } from '../components/CTASection';

export const AboutPage: React.FC = () => {
  const values = [
    {
      title: 'Practical Innovation',
      desc: 'We prioritize engineering solutions that solve genuine physical bottlenecks over superficial complexity or decorative tech hype.',
      icon: Target
    },
    {
      title: 'Engineering Discipline',
      desc: 'Grounding every circuit, firmware routine, and mechanical structure in rigorous electrical safety, noise rejection, and deterministic timing.',
      icon: Layers
    },
    {
      title: 'Accessibility & Affordability',
      desc: 'Breaking cost barriers in industrial telemetry and precision agricultural sensing through open architectures and modular electronics.',
      icon: Compass
    },
    {
      title: 'Continuous Learning',
      desc: 'Iterating through experimental trials, laboratory bench testing, and continuous hardware feedback from actual users.',
      icon: BookOpen
    },
    {
      title: 'Real-World Impact',
      desc: 'Measuring success not by pitch presentations, but by how reliably our prototypes operate in dusty fields, greenhouses, and rural clusters.',
      icon: HeartHandshake
    }
  ];

  return (
    <div className="flex flex-col flex-grow bg-white">
      <SEO
        title="About Us — Engineering With Purpose"
        description="ANBU IoT is an emerging technology venture focused on practical Internet of Things, embedded systems, smart agriculture, and automation solutions."
      />

      {/* Header Banner */}
      <section className="pt-16 pb-20 bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-200/80 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-brand-blue/20 text-xs font-mono font-bold text-brand-blue uppercase tracking-wider mb-4">
              <span>About ANBU IoT</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-brand-navy tracking-tight leading-tight">
              Engineering With Purpose
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              ANBU IoT is an emerging technology venture founded in Tamil Nadu, dedicated to engineering practical, accessible, and intelligent connected systems that solve tangible ground problems.
            </p>
          </div>
        </div>
      </section>

      {/* Vision & Mission Grid */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Vision Quote Card (5 Cols) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-gradient-to-br from-brand-darkNavy to-brand-navy text-white p-8 sm:p-10 shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/10 rounded-full blur-2xl pointer-events-none" />
                
                <span className="text-xs font-mono font-bold text-brand-orange uppercase tracking-widest block mb-4">
                  // OUR VISION
                </span>

                <blockquote className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                  “To build accessible, practical, and intelligent technology for a connected world.”
                </blockquote>

                <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>ANBU IoT Foundation</span>
                  <span className="text-brand-lightSky">Tamil Nadu, India</span>
                </div>
              </div>
            </div>

            {/* Focus & Philosophy (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight mb-3">
                  Our Focus &amp; Core Philosophy
                </h2>
                <p className="text-base text-slate-600 leading-relaxed">
                  Too often, technology solutions remain confined to laboratory reports or require exorbitant commercial licensing that isolates smallholder farmers, local enterprises, and emerging researchers.
                </p>
              </div>

              <p className="text-base text-slate-600 leading-relaxed">
                ANBU IoT exists to bridge that gap. We specialize in connected systems, embedded microcontroller engineering, smart agricultural instrumentation, automated closed-loop actuators, and intelligent machine telemetry built specifically to endure ground-level Indian environments.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-sm font-bold text-brand-navy mb-1">Our Focus</h4>
                  <p className="text-xs text-slate-600">
                    Connected systems, embedded hardware, agricultural sensors, automation, and intelligent edge electronics.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-sm font-bold text-brand-navy mb-1">Our Approach</h4>
                  <p className="text-xs text-slate-600">
                    Problem-first engineering: Sense → Connect → Analyse → Automate.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold tracking-widest text-brand-orange uppercase">
              // Principles
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight mt-1">
              Our Guiding Values
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              The fundamental standards that guide our hardware designs, prototype development, and collaborations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-7 border border-slate-200 shadow-subtle hover:shadow-premium hover:border-brand-blue/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-brand-blue/20 text-brand-blue flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-brand-navy mb-2">
                      {val.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {val.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Principle 0{idx + 1}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                  </div>
                </div>
              );
            })}

            {/* Ecosystem Alignment Card */}
            <div className="bg-gradient-to-br from-brand-navy to-brand-slate rounded-2xl p-7 text-white flex flex-col justify-between shadow-md">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/10 text-brand-lightSky flex items-center justify-center mb-5">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  StartupTN Ecosystem Support
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Recognized and supported by StartupTN (Tamil Nadu Startup and Innovation Mission) to advance regional technological capability.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-between text-xs font-mono text-brand-orange">
                <span>Validated Ecosystem</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Leadership & Key Persons */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-brand-blue/20 text-xs font-mono font-bold text-brand-blue uppercase tracking-wider mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>Leadership &amp; Team</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight">
              Driving Innovation with Purpose
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              The core leadership steering engineering execution, hardware prototyping, and talent development at ANBU IoT.
            </p>
          </div>

          {/* Chief Mentors / GOD OF ANBU IOT Showcase */}
          <div className="max-w-4xl mx-auto mb-16 bg-gradient-to-br from-brand-darkNavy via-slate-900 to-brand-navy rounded-3xl p-6 sm:p-10 border border-slate-800 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-6 relative z-10">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/15 border border-brand-blue/30 text-brand-lightSky text-xs font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Chief Mentors &amp; Guiding Light</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                  GOD OF ANBU IOT
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  The visionary pillars and revered inspirations guiding ANBU IoT's engineering ethos. Their mentorship, blessings, and wisdom empower the team to build accessible, ground-tested technologies for the world.
                </p>
              </div>

              {/* 3 Images Horizontally */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xl mx-auto">
                {/* 1. Dr. Joseph A, SJ */}
                <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 shadow-2xl p-1.5 flex flex-col justify-between">
                  <img
                    src="/assets/team/patron-1.jpg"
                    alt="Dr. Joseph A, SJ"
                    className="w-full h-auto aspect-[4/5] object-cover object-center rounded-lg"
                  />
                  <div className="mt-1.5 text-center">
                    <p className="text-[10.5px] sm:text-xs font-bold text-white tracking-tight truncate">
                      Dr. Joseph A, SJ
                    </p>
                    <p className="text-[8.5px] sm:text-[9.5px] font-mono text-brand-lightSky font-semibold uppercase">
                      Guiding Patron
                    </p>
                  </div>
                </div>

                {/* 2. Dr. Basil Xavier S, SJ */}
                <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 shadow-2xl p-1.5 flex flex-col justify-between">
                  <img
                    src="/assets/team/patron-2.jpg"
                    alt="Dr. Basil Xavier S, SJ"
                    className="w-full h-auto aspect-[4/5] object-cover object-center rounded-lg"
                  />
                  <div className="mt-1.5 text-center">
                    <p className="text-[10.5px] sm:text-xs font-bold text-white tracking-tight truncate">
                      Dr. Basil Xavier S, SJ
                    </p>
                    <p className="text-[8.5px] sm:text-[9.5px] font-mono text-brand-lightSky font-semibold uppercase">
                      Guiding Patron
                    </p>
                  </div>
                </div>

                {/* 3. GOD OF ANBU IOT */}
                <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 shadow-2xl p-1.5 flex flex-col justify-between">
                  <img
                    src="/assets/team/god-of-iot.jpg"
                    alt="GOD OF ANBU IOT"
                    className="w-full h-auto aspect-[4/5] object-cover object-center rounded-lg"
                  />
                  <div className="mt-1.5 text-center">
                    <p className="text-[10.5px] sm:text-xs font-bold text-brand-orange tracking-tight truncate">
                      GOD OF ANBU IOT
                    </p>
                    <p className="text-[8.5px] sm:text-[9.5px] font-mono text-amber-300 font-semibold uppercase">
                      Chief Mentor
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 justify-center text-[11px] font-mono text-slate-300">
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
                  ✨ Visionary Mentors
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
                  ✨ Spiritual Foundation
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
                  ✨ Patrons of Innovation
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Founder Card */}
            <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200 shadow-subtle hover:shadow-premium hover:border-brand-orange/50 transition-all duration-300 overflow-hidden flex flex-col group">
              <div className="relative aspect-[4/4.8] overflow-hidden bg-slate-100 flex items-center justify-center">
                <img
                  src="/assets/team/founder.png"
                  alt="Founder — ANBU IoT"
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-brand-orange text-white text-[11px] font-mono font-bold uppercase tracking-wider mb-1.5 shadow-xs">
                    Founder
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    Founder
                  </h3>
                  <p className="text-xs font-mono text-brand-lightSky">
                    Vision &amp; Hardware Research
                  </p>
                </div>
              </div>

              <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pioneering the vision, technical foundation, and core R&amp;D behind ANBU IoT's embedded solutions and intelligent hardware systems.
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] font-mono bg-orange-50 text-brand-orange border border-brand-orange/20 px-2 py-0.5 rounded">
                      Hardware R&amp;D
                    </span>
                    <span className="text-[10px] font-mono bg-blue-50 text-brand-blue border border-brand-blue/20 px-2 py-0.5 rounded">
                      IoT Innovation
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Founder</span>
                  <span className="text-brand-orange font-bold">ANBU IoT</span>
                </div>
              </div>
            </div>

            {/* CEO Card */}
            <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200 shadow-subtle hover:shadow-premium hover:border-brand-blue/50 transition-all duration-300 overflow-hidden flex flex-col group">
              <div className="relative aspect-[4/4.8] overflow-hidden bg-slate-100 flex items-center justify-center">
                <img
                  src="/assets/team/ceo.png"
                  alt="Chief Executive Officer — ANBU IoT"
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-brand-blue text-white text-[11px] font-mono font-bold uppercase tracking-wider mb-1.5 shadow-xs">
                    Leadership
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    Chief Executive Officer (CEO)
                  </h3>
                  <p className="text-xs font-mono text-brand-lightSky">
                    Strategic Execution &amp; Technology
                  </p>
                </div>
              </div>

              <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Spearheading product architecture, embedded circuit design, agricultural telemetry innovations, and strategic growth.
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] font-mono bg-blue-50 text-brand-blue border border-brand-blue/20 px-2 py-0.5 rounded">
                      Product Strategy
                    </span>
                    <span className="text-[10px] font-mono bg-blue-50 text-brand-blue border border-brand-blue/20 px-2 py-0.5 rounded">
                      Embedded Hardware
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Executive Leadership</span>
                  <span className="text-brand-orange font-bold">ANBU IoT</span>
                </div>
              </div>
            </div>

            {/* MD Card */}
            <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200 shadow-subtle hover:shadow-premium hover:border-brand-purple/50 transition-all duration-300 overflow-hidden flex flex-col group">
              <div className="relative aspect-[4/4.8] overflow-hidden bg-slate-100 flex items-center justify-center">
                <img
                  src="/assets/team/md.png"
                  alt="Managing Director — ANBU IoT"
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-purple-600 text-white text-[11px] font-mono font-bold uppercase tracking-wider mb-1.5 shadow-xs">
                    Director
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    Managing Director (MD)
                  </h3>
                  <p className="text-xs font-mono text-brand-lightSky">
                    Operations &amp; Strategic Governance
                  </p>
                </div>
              </div>

              <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Overseeing operational excellence, organizational governance, commercial partnerships, and enterprise scalability across all ventures.
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">
                      Enterprise Strategy
                    </span>
                    <span className="text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">
                      Governance
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Managing Director</span>
                  <span className="text-brand-orange font-bold">ANBU IoT</span>
                </div>
              </div>
            </div>

            {/* HR Card */}
            <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200 shadow-subtle hover:shadow-premium hover:border-emerald-500/50 transition-all duration-300 overflow-hidden flex flex-col group">
              <div className="relative aspect-[4/4.8] overflow-hidden bg-slate-100 flex items-center justify-center">
                <img
                  src="/assets/team/hr.png"
                  alt="Head of Human Resources — ANBU IoT"
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-mono font-bold uppercase tracking-wider mb-1.5 shadow-xs">
                    People &amp; Operations
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    Head of Human Resources (HR)
                  </h3>
                  <p className="text-xs font-mono text-brand-lightSky">
                    Talent &amp; Culture Management
                  </p>
                </div>
              </div>

              <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Directing talent acquisition, student internship programs, organizational operations, and cultivating an engineering-first team culture.
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                      Talent Acquisition
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                      Internships
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Talent &amp; Culture</span>
                  <span className="text-brand-orange font-bold">ANBU IoT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Identity & Emblem Section */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-brand-darkNavy via-brand-navy to-brand-slate rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-4 flex justify-center">
                <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-[280px]">
                  <img
                    src="/assets/brand/anbu-iot-logo-official.png"
                    alt="ANBU IoT Official Logo"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-mono font-bold text-brand-orange border border-white/10">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>OFFICIAL BRAND IDENTITY</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ANBU IOT — SMART SOLUTION FOR A CONNECTED WORLD
                </h3>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Our emblem represents global connectivity, intelligent edge computing, and resilient circuits. It encapsulates our commitment to delivering smart, robust, and accessible IoT solutions that bridge sensor hardware with real-world impact.
                </p>

                <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-brand-lightSky">
                  <span>✓ 3D Emblem Symbolizing Edge IoT</span>
                  <span>✓ Hardware-First Innovation</span>
                  <span>✓ Tamil Nadu Deep Tech</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof Strip */}
      <CredibilityStrip />

      {/* CTA */}
      <CTASection />
    </div>
  );
};
