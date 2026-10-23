import React, { useState } from 'react';
import { Smartphone, Lock } from 'lucide-react';
import { UserRole } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole, mobile: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [role, setRole] = useState<UserRole>('employee');
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [otp, setOtp] = useState('1234');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');

  const handleGetOtp = () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setOtpSent(true);
    setOtp('1234'); // auto-fill demo OTP
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber) {
      setError('Enter mobile number');
      return;
    }
    if (!otp) {
      setError('Enter OTP');
      return;
    }
    onLoginSuccess(role, mobileNumber);
  };

  return (
    <div className="relative min-h-full flex flex-col justify-center px-5 py-6">
      {/* Background Curves matching design */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-[#1975e6] via-[#3b82f6] to-transparent -z-10 opacity-90 rounded-b-[40px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#2563eb] via-[#60a5fa] to-transparent -z-10 opacity-70 rounded-t-[50px] pointer-events-none" />

      {/* Main Login Card (Identical to Screenshot 1 & 2) */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-blue-50/80">
        <h2 className="text-3xl font-extrabold text-center text-slate-800 mb-6 tracking-tight">
          Login
        </h2>

        {error && (
          <div className="mb-4 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Select: Admin / Employee */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Select:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex items-center justify-center space-x-2.5 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                  role === 'admin'
                    ? 'border-blue-400 bg-blue-50/80 text-blue-700 shadow-sm'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    role === 'admin' ? 'border-blue-600' : 'border-slate-300'
                  }`}
                >
                  {role === 'admin' && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('employee')}
                className={`flex items-center justify-center space-x-2.5 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                  role === 'employee'
                    ? 'border-blue-400 bg-blue-50/80 text-blue-700 shadow-sm'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    role === 'employee' ? 'border-blue-600' : 'border-slate-300'
                  }`}
                >
                  {role === 'employee' && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <span>Employee</span>
              </button>
            </div>
          </div>

          {/* Mobile number */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Mobile number:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Enter mobile number"
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-800 font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* OTP Input with Get OTP button */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              OTP:
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  maxLength={6}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-800 font-medium placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={handleGetOtp}
                className="px-4 py-2.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-xl bg-blue-50/60 hover:bg-blue-100/70 active:scale-95 transition-all whitespace-nowrap"
              >
                {otpSent ? 'Resend' : 'Get OTP'}
              </button>
            </div>
          </div>

          {/* Login Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm tracking-wide bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 shadow-md shadow-blue-500/30 active:scale-[0.98] transition-all"
            >
              Login
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-600">
            Default Demo PIN is <span className="font-semibold text-slate-700">1234</span>
          </p>
        </div>
      </div>
    </div>
  );
};
