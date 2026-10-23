import React, { useState } from 'react';
import {
  ArrowLeft,
  Settings,
  Save,
  Check,
  Smartphone,
  QrCode,
  DollarSign,
  Tag,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { SystemConfig, LoginType } from '../types';

interface ConfigSettingsScreenProps {
  config: SystemConfig;
  currentRole: LoginType;
  onSaveConfig: (updated: Partial<SystemConfig>) => void;
  onBack: () => void;
}

export const ConfigSettingsScreen: React.FC<ConfigSettingsScreenProps> = ({
  config,
  currentRole,
  onSaveConfig,
  onBack,
}) => {
  const [seriesTitle, setSeriesTitle] = useState(config.seriesTitle);
  const [businessDate, setBusinessDate] = useState(config.businessDate);
  const [halfPrice, setHalfPrice] = useState(config.halfTicketPrice);
  const [fullPrice, setFullPrice] = useState(config.fullTicketPrice);
  const [gpayNumber, setGpayNumber] = useState(config.gpayNumber);
  const [gpayName, setGpayName] = useState(config.gpayName);
  const [upiId, setUpiId] = useState(config.upiId);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole !== 'admin') {
      setError('Only Admin can modify system settings.');
      return;
    }
    setError('');
    onSaveConfig({
      seriesTitle,
      businessDate,
      halfTicketPrice: Number(halfPrice),
      fullTicketPrice: Number(fullPrice),
      gpayNumber,
      gpayName,
      upiId,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${encodeURIComponent(
        upiId
      )}%26pn=${encodeURIComponent(gpayName)}%26cu=INR`,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="w-full flex flex-col space-y-6 select-none">
      {/* 1. Page Heading */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs transition-all active:scale-95"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Authorized System Settings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
                Administration
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Configure lottery series branding, draw dates, ticket pricing schedules, and UPI/Google Pay recipient instructions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Role: {currentRole}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex-1 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Series & Draw Date */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-xs font-black text-slate-800">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>Ticket Series & Business Date</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Custom Series Name:
              </label>
              <input
                type="text"
                value={seriesTitle}
                onChange={(e) => setSeriesTitle(e.target.value)}
                placeholder="e.g. CUSTOM NAME or CARROM GOLD"
                disabled={currentRole !== 'admin'}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Business Date:
              </label>
              <input
                type="text"
                value={businessDate}
                onChange={(e) => setBusinessDate(e.target.value)}
                placeholder="e.g. 02 Oct 2026"
                disabled={currentRole !== 'admin'}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>
          </div>

          {/* Configurable Half & Full Prices */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-xs font-black text-slate-800">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Ticket Pricing Rules (₹)</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Half Ticket Price:
                </label>
                <input
                  type="number"
                  value={halfPrice}
                  onChange={(e) => setHalfPrice(Number(e.target.value))}
                  disabled={currentRole !== 'admin'}
                  className="w-full px-3 py-2 text-xs font-black bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full Ticket Price:
                </label>
                <input
                  type="number"
                  value={fullPrice}
                  onChange={(e) => setFullPrice(Number(e.target.value))}
                  disabled={currentRole !== 'admin'}
                  className="w-full px-3 py-2 text-xs font-black bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Google Pay & UPI Recipient */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-xs font-black text-slate-800">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>GPay & Payment Instructions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                GPay Mobile Number:
              </label>
              <input
                type="tel"
                value={gpayNumber}
                onChange={(e) => setGpayNumber(e.target.value)}
                disabled={currentRole !== 'admin'}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                GPay Recipient Name:
              </label>
              <input
                type="text"
                value={gpayName}
                onChange={(e) => setGpayName(e.target.value)}
                disabled={currentRole !== 'admin'}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                UPI VPA / ID:
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                disabled={currentRole !== 'admin'}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-900"
              />
            </div>
          </div>
        </div>

        {currentRole !== 'admin' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-xs text-amber-800 font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Read-only: Log in as Admin to modify authorized prices or series names.</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-semibold">
            {error}
          </div>
        )}

        {currentRole === 'admin' && (
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Settings Saved Successfully!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Authorized Changes</span>
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
};
