import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, Cpu } from 'lucide-react';
import { SEO } from '../components/SEO';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center flex-grow py-24 px-4 bg-slate-50 text-center">
      <SEO title="Page Not Found" />
      
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto">
          <Cpu className="w-8 h-8 text-brand-orange animate-pulse" />
        </div>
        
        <span className="text-xs font-mono font-bold text-slate-400">ERROR 404 // SIGNAL UNREACHABLE</span>
        <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">
          Telemetry Node Not Found
        </h1>
        <p className="text-sm text-slate-600">
          The requested page or resource could not be located in our navigation routing table.
        </p>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-navy hover:bg-brand-blue text-white text-sm font-bold shadow-md transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
