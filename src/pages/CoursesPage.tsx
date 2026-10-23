import React, { useState } from 'react';
import { BookOpen, Sparkles, CheckCircle2, ArrowRight, Bell, Clock, Cpu, Code, Layers, Mail, Check, HelpCircle } from 'lucide-react';
import { SEO } from '../components/SEO';
import { coursesData } from '../data/coursesData';
import { CTASection } from '../components/CTASection';
import confetti from 'canvas-confetti';

export const CoursesPage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const categories = ['All', 'Internet of Things', 'Embedded Systems', 'Smart Agriculture', 'Robotics', 'AI / ML', 'Arduino / Microcontrollers'];

  const filteredCourses = filterCategory === 'All'
    ? coursesData
    : coursesData.filter((c) => c.category === filterCategory);

  const handleInterestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });

    setSubmitted(true);
  };

  return (
    <div className="flex flex-col flex-grow bg-white">
      <SEO
        title="Courses & Technical Training — Learn by Building"
        description="Upcoming hands-on technical curriculum in IoT, Embedded C microcontrollers, smart agriculture sensors, and edge AI by ANBU IoT."
      />

      {/* Header */}
      <section className="pt-16 pb-20 bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-brand-orange/30 text-xs font-mono font-bold text-brand-orange uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Future-Ready Technical Education</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-navy tracking-tight leading-tight">
              Learn by Building
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              Practical, hardware-first engineering education designed to teach real-world circuit design, embedded C firmware, and sensor telemetry through tangible deliverables.
            </p>

            {/* Quick Status Announcement */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
              <Clock className="w-4 h-4 text-brand-orange" />
              <span>Status: <strong>Programs will be announced soon.</strong> Register below for early curriculum updates.</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-10 flex flex-wrap items-center gap-2 pt-6 border-t border-slate-200/80">
            <span className="text-xs font-mono text-slate-500 mr-2">Tracks:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  filterCategory === cat
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-slate-50/70 rounded-2xl p-7 border border-slate-200 shadow-subtle hover:shadow-premium hover:border-brand-blue/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-white text-brand-navy border border-slate-200">
                      {course.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-orange/15 text-brand-orange uppercase">
                      COMING SOON
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-brand-navy group-hover:text-brand-blue transition-colors mb-2">
                    {course.title}
                  </h3>

                  <p className="text-xs font-semibold text-slate-500 font-mono mb-3">
                    Level: {course.level}
                  </p>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {course.description}
                  </p>

                  {/* Highlights */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200/80 mb-6 space-y-2">
                    <div className="text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                      Curriculum Highlights:
                    </div>
                    {course.curriculumHighlights.slice(0, 3).map((hl, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>

                  {/* Capstone deliverable */}
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-brand-navy font-medium mb-6">
                    <strong className="font-bold text-brand-blue block mb-0.5">Capstone Deliverable:</strong>
                    {course.handsOnDeliverable}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourse(course.title);
                      setSubmitted(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-blue text-white text-xs font-mono font-bold transition-colors shadow-xs"
                  >
                    <Bell className="w-3.5 h-3.5 text-brand-orange" />
                    <span>Get Course Updates</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Global Newsletter / Updates Strip */}
      <section className="py-16 bg-slate-900 text-white relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-mono font-bold text-brand-orange uppercase tracking-widest block mb-2">
            // EARLY CURRICULUM ACCESS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
            Be the First to Know When Courses Open
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mb-8 max-w-xl mx-auto">
            Leave your email address to receive early-bird curriculum syllabi, laboratory kit details, and launch announcements.
          </p>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 max-w-md mx-auto flex items-center justify-center gap-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-semibold">Thank you! You are on the priority announcement list.</span>
            </div>
          ) : (
            <form onSubmit={handleInterestSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="flex-grow px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-orange font-bold text-sm text-white hover:opacity-95 transition-opacity shrink-0 flex items-center justify-center gap-2"
              >
                <span>Notify Me</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Course Modal Dialog */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-brand-navy mb-1">
              Course Interest Registration
            </h3>
            <p className="text-xs text-brand-orange font-mono font-semibold mb-4">
              {selectedCourse}
            </p>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              This track is currently in active curriculum development. Register below to receive the detailed syllabus and priority enrolment updates when the dates are announced.
            </p>

            {submitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>You will receive priority updates regarding {selectedCourse}!</span>
              </div>
            ) : (
              <form onSubmit={handleInterestSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 mb-1">
                    Your Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCourse(null)}
                    className="w-1/2 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-lg bg-brand-navy text-white text-xs font-bold hover:bg-brand-blue transition-colors"
                  >
                    Register Interest
                  </button>
                </div>
              </form>
            )}

            {submitted && (
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="mt-4 w-full py-2.5 rounded-lg bg-brand-navy text-white text-xs font-bold"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <CTASection />
    </div>
  );
};
