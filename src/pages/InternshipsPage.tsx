import React, { useState } from 'react';
import { Briefcase, Sparkles, CheckCircle2, ArrowRight, Check, Clock, ShieldCheck, User, Mail, Phone, School, HelpCircle } from 'lucide-react';
import { SEO } from '../components/SEO';
import { internshipsData } from '../data/internshipsData';
import { CTASection } from '../components/CTASection';
import confetti from 'canvas-confetti';

export const InternshipsPage: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = useState<string>('IoT & Telemetry Systems Intern');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    institution: '',
    track: 'IoT & Telemetry Systems Intern',
    background: '',
    statement: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) return;

    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 }
    });

    setSubmitted(true);
  };

  return (
    <div className="flex flex-col flex-grow bg-white">
      <SEO
        title="Internships & Apprenticeships — Build. Learn. Experience."
        description="Explore practical technology and engineering learning opportunities around IoT, embedded firmware, agritech automation, robotics, and R&D with ANBU IoT."
      />

      {/* Header */}
      <section className="pt-16 pb-20 bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-brand-blue/20 text-xs font-mono font-bold text-brand-blue uppercase tracking-wider mb-4">
              <Briefcase className="w-3.5 h-3.5 text-brand-orange" />
              <span>Hands-On Engineering Opportunities</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-navy tracking-tight leading-tight">
              Build. Learn. Experience.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              ANBU IoT intends to create practical, immersive learning opportunities around real hardware engineering, embedded systems, and applied agricultural automation.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-xs font-mono text-amber-900">
              <Clock className="w-4 h-4 text-brand-orange" />
              <span>Status: <strong>Opportunities Coming Soon.</strong> Register your profile below to be considered for upcoming batches.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Internship Tracks Grid */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold tracking-widest text-brand-orange uppercase">
              // Focus Areas
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight mt-1">
              Future Internship Tracks
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Hands-on domains where student engineers and aspiring technologists will work directly with physical hardware and firmware.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {internshipsData.map((track) => (
              <div
                key={track.id}
                className="bg-slate-50/70 rounded-2xl p-7 border border-slate-200 shadow-subtle hover:shadow-premium hover:border-brand-blue/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-white text-brand-navy border border-slate-200">
                      {track.area}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-brand-blue uppercase">
                      COMING SOON
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-brand-navy group-hover:text-brand-blue transition-colors mb-2">
                    {track.title}
                  </h3>

                  <p className="text-xs font-mono text-brand-orange font-semibold mb-3">
                    {track.focus}
                  </p>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {track.description}
                  </p>

                  {/* Skills Developed */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 mb-6 space-y-2">
                    <div className="text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                      Skills &amp; Capabilities Gained:
                    </div>
                    {track.skillsDeveloped.map((skill, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrack(track.title);
                      setFormData({ ...formData, track: track.title });
                      const formElement = document.getElementById('internship-form');
                      if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-blue text-white text-xs font-mono font-bold transition-colors shadow-xs"
                  >
                    <span>Register Interest in this Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Internship Registration Form */}
      <section id="internship-form" className="py-20 bg-slate-900 text-white relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold text-brand-orange uppercase tracking-widest block mb-2">
              // EARLY INTEREST REGISTRY
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Register Your Interest
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              Submit your background details. When practical openings or experimental cohorts are announced, we will review submitted profiles.
            </p>
          </div>

          <div className="bg-slate-800/90 rounded-3xl p-6 sm:p-10 border border-slate-700 shadow-2xl">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">Interest Registered Successfully</h3>
                <p className="text-slate-300 text-sm max-w-md mx-auto">
                  Thank you, <strong>{formData.fullName}</strong>. Your interest for the <strong>{formData.track}</strong> track has been recorded in our talent registry.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        fullName: '',
                        email: '',
                        phone: '',
                        institution: '',
                        track: 'IoT & Telemetry Systems Intern',
                        background: '',
                        statement: ''
                      });
                    }}
                    className="px-6 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-blue text-white text-xs font-bold font-mono transition-colors"
                  >
                    Submit Another Profile
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Anand Kumar"
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-300 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="anand@college.edu / gmail.com"
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-300 mb-2">
                      Phone / Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>

                  {/* Institution */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-300 mb-2">
                      College / Institution / Department *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      placeholder="e.g. PSNA / Anna University / Electronics"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>

                </div>

                {/* Track Selection */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-2">
                    Preferred Internship Track *
                  </label>
                  <select
                    value={formData.track}
                    onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {internshipsData.map((t) => (
                      <option key={t.id} value={t.title}>
                        {t.title} ({t.area})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Technical Statement */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-2">
                    What hardware, firmware, or project work have you built so far?
                  </label>
                  <textarea
                    rows={3}
                    value={formData.statement}
                    onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                    placeholder="Briefly describe any microcontroller experiments, circuits, coding projects, or competitions you have participated in..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-blue via-brand-slate to-brand-orange text-white font-bold text-base shadow-lg hover:shadow-glow-blue transition-all flex items-center justify-center gap-2"
                >
                  <span>Submit Interest Registration</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* CTA */}
      <CTASection />
    </div>
  );
};
