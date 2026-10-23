import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Solutions', path: '/solutions' },
    { name: 'Projects', path: '/projects' },
    { name: 'Recognition', path: '/recognition' },
    { name: 'Courses', path: '/courses' },
    { name: 'Internships', path: '/internships' },
    { name: 'Lottery App', path: '/lottery' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-1.5 sm:py-2'
          : 'bg-white border-b border-slate-100 py-2 sm:py-2.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Lockup: Logo + Company Name + Tagline */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-lg py-0.5">
            <img
              src="/assets/brand/anbu-aiot-logo.png"
              alt="ANBU IoT"
              className="h-10 sm:h-12 md:h-13 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
            <div className="flex flex-col justify-center leading-none">
              <span className="text-base sm:text-lg md:text-xl font-black tracking-tight leading-none">
                <span className="text-brand-navy">ANBU</span>
                <span className="text-brand-blue"> IoT</span>
              </span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mt-1 leading-none">
                SMART SOLUTION FOR A CONNECTED WORLD
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-semibold rounded-md transition-all duration-150 relative ${
                    isActive
                      ? 'text-brand-blue font-bold'
                      : 'text-slate-700 hover:text-brand-navy hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{link.name}</span>
                    {isActive && (
                      <span className="absolute bottom-0.5 left-3 right-3 h-0.5 bg-gradient-to-r from-brand-blue to-brand-orange rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Action CTA & Mobile Trigger */}
          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-brand-navy via-brand-slate to-brand-blue hover:from-brand-blue hover:to-brand-orange rounded-lg shadow-sm hover:shadow-glow-blue transition-all duration-200 group"
            >
              <span>Start a Conversation</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:text-brand-navy hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[60px] bg-white/98 backdrop-blur-xl border-b border-slate-200 shadow-xl max-h-[calc(100vh-60px)] overflow-y-auto z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="px-5 py-6 space-y-2">
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-orange bg-orange-50 rounded-md mb-3">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Smart Solutions for a Connected World</span>
            </div>

            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 text-base font-semibold rounded-lg transition-colors ${
                    isActive
                      ? 'text-brand-blue bg-blue-50/80 font-bold border-l-4 border-brand-orange'
                      : 'text-slate-700 hover:text-brand-navy hover:bg-slate-50'
                  }`
                }
              >
                <span>{link.name}</span>
                <ArrowRight className="w-4 h-4 opacity-50" />
              </NavLink>
            ))}

            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link
                to="/contact"
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 text-base font-bold text-white bg-gradient-to-r from-brand-navy to-brand-blue hover:from-brand-blue hover:to-brand-orange rounded-xl shadow-md"
              >
                <span>Start a Conversation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
