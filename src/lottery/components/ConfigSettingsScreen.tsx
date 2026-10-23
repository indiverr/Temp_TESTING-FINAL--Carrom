import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Tag,
  Check,
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
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole !== 'admin') {
      setError('Only Administrator can update settings.');
      return;
    }
    setError('');
    onSaveConfig({
      seriesTitle: seriesTitle.trim().toUpperCase(),
      businessDate: businessDate.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const roleLabel = currentRole === 'paid_employee' ? 'Supervisor' : currentRole;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col space-y-5 select-none">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              System Settings
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure series title and active draw date
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
            Access Role: <strong className="capitalize">{roleLabel}</strong>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <Tag className="w-4 h-4 text-slate-600" />
            <span>Series & Draw Configuration</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Series Name:
              </label>
              <input
                type="text"
                value={seriesTitle}
                onChange={(e) => setSeriesTitle(e.target.value)}
                placeholder="e.g. CUSTOM NAME"
                disabled={currentRole !== 'admin'}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Draw Date:
              </label>
              <input
                type="text"
                value={businessDate}
                onChange={(e) => setBusinessDate(e.target.value)}
                placeholder="02 Oct 2026"
                disabled={currentRole !== 'admin'}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-900"
              />
            </div>
          </div>
        </div>

        {currentRole !== 'admin' && (
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg flex items-center space-x-2 text-xs text-slate-700 font-medium">
            <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>Read-only access. Sign in as Admin to modify series settings.</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600 font-medium">
            {error}
          </div>
        )}

        {currentRole === 'admin' && (
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Settings Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
};
