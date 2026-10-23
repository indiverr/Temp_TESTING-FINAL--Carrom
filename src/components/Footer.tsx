import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ArrowUpRight, Cpu, Sprout, Award, BookOpen, Briefcase, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-darkNavy text-slate-300 border-t border-slate-800 relative overflow-hidden">
      {/* Subtle background tech grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E3E62_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="inline-block focus:outline-none">
              <div className="bg-white p-1.5 rounded-xl inline-block shadow-sm">
                <img
                  src="/assets/brand/anbu-iot-logo-official.png"
                  alt="ANBU IoT Logo"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </div>
            </Link>
            <p className="text-sm sm:text-base text-slate-300 max-w-sm leading-relaxed">
              ANBU IoT engineers intelligent systems that connect sensors, embedded technology, automation, and real-world applications.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-slate/40 border border-brand-blue/30 text-xs font-semibold text-brand-lightSky">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real Prototypes • Ground Validated • Tamil Nadu</span>
            </div>
          </div>

          {/* Column 2: Solutions */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-orange" />
              <span>Core Solutions</span>
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/solutions#iot-sensor-systems" className="hover:text-brand-lightSky transition-colors">
                  IoT & Sensor Systems
                </Link>
              </li>
              <li>
                <Link to="/solutions#embedded-systems" className="hover:text-brand-lightSky transition-colors">
                  Embedded Systems
                </Link>
              </li>
              <li>
                <Link to="/solutions#smart-agriculture" className="hover:text-brand-lightSky transition-colors flex items-center gap-1.5">
                  <span>Smart Agriculture</span>
                  <Sprout className="w-3 h-3 text-emerald-400" />
                </Link>
              </li>
              <li>
                <Link to="/solutions#automation" className="hover:text-brand-lightSky transition-colors">
                  Automation
                </Link>
              </li>
              <li>
                <Link to="/solutions#robotics-intelligent-systems" className="hover:text-brand-lightSky transition-colors">
                  Robotics & Systems
                </Link>
              </li>
              <li>
                <Link to="/solutions#ai-ml-integration" className="hover:text-brand-lightSky transition-colors">
                  AI / ML Integration
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Flagship Projects & Recognition */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-orange" />
              <span>Projects & Proof</span>
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/projects/iot-soil-testing" className="hover:text-brand-lightSky transition-colors flex items-center justify-between group">
                  <span>IoT Soil Testing</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/projects/smart-agriculture-microgreens" className="hover:text-brand-lightSky transition-colors flex items-center justify-between group">
                  <span>Smart Microgreens</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/projects/low-cost-sensor-systems" className="hover:text-brand-lightSky transition-colors flex items-center justify-between group">
                  <span>Low-Cost Sensors</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/recognition" className="hover:text-brand-lightSky transition-colors text-amber-300 font-medium">
                  2026 Dindigul 2nd Place
                </Link>
              </li>
              <li>
                <Link to="/recognition" className="hover:text-brand-lightSky transition-colors">
                  StartupTN Sanction
                </Link>
              </li>
              <li>
                <Link to="/recognition" className="hover:text-brand-lightSky transition-colors">
                  Media Coverage
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Learning & Future Tracks */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-orange" />
              <span>Future Learning</span>
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/courses" className="hover:text-brand-lightSky transition-colors flex items-center gap-1.5">
                  <span>Technical Courses</span>
                  <span className="text-[10px] uppercase font-bold bg-brand-orange/20 text-brand-orange px-1.5 py-0.5 rounded">Soon</span>
                </Link>
              </li>
              <li>
                <Link to="/internships" className="hover:text-brand-lightSky transition-colors flex items-center gap-1.5">
                  <span>Internship Tracks</span>
                  <Briefcase className="w-3 h-3 text-brand-lightSky" />
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-lightSky transition-colors">
                  About Our Purpose
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-lightSky transition-colors flex items-center gap-1 text-brand-orange font-semibold">
                  <span>Contact & Enquiries</span>
                  <Sparkles className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">ANBU IoT</span>
            <span>—</span>
            <span>SMART SOLUTION FOR A CONNECTED WORLD</span>
          </div>

          <div>
            <p>© 2026 ANBU IoT. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
