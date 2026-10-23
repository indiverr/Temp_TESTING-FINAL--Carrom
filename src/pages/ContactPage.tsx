import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Sparkles, Building2, MessageSquare, ShieldCheck, Clock } from 'lucide-react';
import { SEO } from '../components/SEO';
import confetti from 'canvas-confetti';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    interestedIn: 'IoT Solution',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const interestOptions = [
    'IoT Solution',
    'Embedded System',
    'Smart Agriculture',
    'Automation',
    'Robotics',
    'AI/ML',
    'Training',
    'Internship',
    'Collaboration',
    'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setSubmitted(true);
  };

  return (
    <div className="flex flex-col flex-grow bg-white">
      <SEO
        title="Contact Us — Let's Build Something Useful"
        description="Get in touch with ANBU IoT for custom IoT solutions, embedded hardware engineering, smart agriculture sensing, and collaborative technology initiatives."
      />

      {/* Header */}
      <section className="pt-16 pb-20 bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-brand-blue/20 text-xs font-mono font-bold text-brand-blue uppercase tracking-wider mb-4">
              <MessageSquare className="w-3.5 h-3.5 text-brand-orange" />
              <span>Direct Engineering Engagement</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-navy tracking-tight leading-tight">
              Let's Build Something Useful
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              Whether you represent an agricultural venture, academic institution, startup ecosystem partner, or industrial enterprise — we welcome practical engineering discussions.
            </p>
          </div>
        </div>
      </section>

      {/* Main Form & Contact Info Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left: Enquiry Form (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-subtle">
              <div className="mb-8">
                <span className="text-xs font-mono font-bold text-brand-orange uppercase tracking-wider block mb-1">
                  // OFFICIAL ENQUIRY SYSTEM
                </span>
                <h2 className="text-2xl font-extrabold text-brand-navy">
                  Send Your Project or Partnership Brief
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  All fields marked with * are required.
                </p>
              </div>

              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-navy">Enquiry Dispatched Successfully</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Thank you, <strong>{formData.name}</strong>. Your enquiry regarding <strong>{formData.interestedIn}</strong> has been logged. Our engineering team will review your message promptly.
                  </p>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: '',
                          email: '',
                          phone: '',
                          organization: '',
                          interestedIn: 'IoT Solution',
                          message: ''
                        });
                      }}
                      className="px-6 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-blue text-white text-xs font-bold font-mono transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-mono font-bold text-slate-700 mb-1.5">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Dr. Rajesh Kumar"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-mono font-bold text-slate-700 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="rajesh@organization.com"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-mono font-bold text-slate-700 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                    </div>

                    {/* Organisation */}
                    <div>
                      <label className="block text-xs font-mono font-bold text-slate-700 mb-1.5">
                        Organisation / Institution
                      </label>
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        placeholder="Company, Farm, or College Name"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                    </div>

                  </div>

                  {/* Interested In Dropdown */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-700 mb-1.5">
                      Interested In *
                    </label>
                    <select
                      value={formData.interestedIn}
                      onChange={(e) => setFormData({ ...formData, interestedIn: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      {interestOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-700 mb-1.5">
                      Message / Project Scope *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please describe your requirements, problem statement, or collaboration concept in detail..."
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-navy via-brand-slate to-brand-blue hover:from-brand-blue hover:to-brand-orange text-white font-bold text-base shadow-md hover:shadow-glow-blue transition-all flex items-center justify-center gap-2"
                  >
                    <span>Send Enquiry</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>

            {/* Right: Clean Configuration-Ready Contact Details (5 Cols) */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Brand Summary Card */}
              <div className="rounded-2xl bg-gradient-to-br from-brand-darkNavy to-brand-navy p-8 text-white shadow-xl border border-slate-800">
                <img
                  src="/assets/brand/anbu-iot-logo-dark.svg"
                  alt="ANBU IoT Logo"
                  className="h-10 w-auto object-contain mb-5"
                />
                <p className="text-xs font-mono font-bold text-brand-orange uppercase mb-1">
                  SMART SOLUTION FOR A CONNECTED WORLD
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  ANBU IoT engineers intelligent systems that connect sensors, embedded technology, automation and real-world applications.
                </p>

                <div className="mt-6 pt-6 border-t border-slate-800 space-y-3 text-xs font-mono text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-brand-lightSky shrink-0" />
                    <span>StartupTN Ecosystem Backed</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Tamil Nadu, India</span>
                  </div>
                </div>
              </div>

              {/* Contact Channels (Configuration-Ready Placeholders) */}
              <div className="rounded-2xl bg-slate-50 p-6 sm:p-8 border border-slate-200 space-y-6">
                <h3 className="text-base font-bold text-brand-navy">
                  Communication Channels
                </h3>

                <div className="space-y-4">
                  
                  {/* General Email Channel */}
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-brand-blue shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-slate-500">General &amp; Technical Enquiries</div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">
                        contact@anbuiot.com
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        (Official Enquiry Routing)
                      </div>
                    </div>
                  </div>

                  {/* Location Channel */}
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-brand-orange shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-slate-500">Base of Operations</div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">
                        Tamil Nadu, India
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        (Dindigul &amp; Chennai Startup Ecosystem)
                      </div>
                    </div>
                  </div>

                  {/* Response Window */}
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-emerald-600 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-slate-500">Technical Review Turnaround</div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">
                        Within 24 to 48 Hours
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Direct engineer evaluation
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      </section>
    </div>
  );
};
