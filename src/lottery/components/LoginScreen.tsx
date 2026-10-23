import React, { useState } from 'react';
import { Smartphone, Lock, User, Briefcase, HardHat } from 'lucide-react';
import { LoginType } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (type: LoginType, name: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [loginType, setLoginType] = useState<LoginType>('employee');
  const [employeeName, setEmployeeName] = useState('Sasikaran');
  const [employeeMobile, setEmployeeMobile] = useState('99493119');
  const [employeeOtp, setEmployeeOtp] = useState('1234');
  const [adminMobile, setAdminMobile] = useState('9999999999');
  const [adminOtp, setAdminOtp] = useState('1234');
  const [otpSentEmp, setOtpSentEmp] = useState(false);
  const [otpSentAdm, setOtpSentAdm] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess(loginType, employeeName || 'Sasikaran');
  };

  return (
    <div className="relative min-h-[calc(100vh-10rem)] w-full flex items-center justify-center p-4 sm:p-8 select-none">
      {/* Background Accent Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40 -z-10" />

      {/* Main Login Card - Responsive Desktop Centered Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-blue-100/90 my-auto">
        <h2 className="text-2xl sm:text-3xl font-black text-center text-slate-800 mb-1 tracking-tight">
          Login
        </h2>
        <p className="text-xs font-bold text-center text-slate-600 mb-4">
          Select Login Type
        </p>

        {/* Demo Mode Guidance Banner */}
        <div className="mb-4 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-800 text-center">
          <span className="font-bold">✨ Remote UI Testing Demo:</span> Pre-configured mock credentials active. Click any role and hit Login to explore all workflows immediately.
        </div>

        {/* 3 User Types with Avatars: Admin, Employee, Paid Employee */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Admin */}
          <button
            type="button"
            onClick={() => setLoginType('admin')}
            className={`p-2 rounded-2xl border flex flex-col items-center justify-between text-center transition-all ${
              loginType === 'admin'
                ? 'border-blue-500 bg-blue-50/70 shadow-sm'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="w-full flex justify-start pl-1">
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                  loginType === 'admin' ? 'border-blue-600' : 'border-slate-300'
                }`}
              >
                {loginType === 'admin' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center my-1 text-blue-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-800">Admin</span>
          </button>

          {/* Employee */}
          <button
            type="button"
            onClick={() => setLoginType('employee')}
            className={`p-2 rounded-2xl border flex flex-col items-center justify-between text-center transition-all ${
              loginType === 'employee'
                ? 'border-blue-500 bg-blue-50/70 shadow-sm ring-1 ring-blue-400'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="w-full flex justify-start pl-1">
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                  loginType === 'employee' ? 'border-blue-600' : 'border-slate-300'
                }`}
              >
                {loginType === 'employee' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center my-1 text-sky-600">
              <User className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-800">Employee</span>
          </button>

          {/* Paid Employee */}
          <button
            type="button"
            onClick={() => setLoginType('paid_employee')}
            className={`p-2 rounded-2xl border flex flex-col items-center justify-between text-center transition-all ${
              loginType === 'paid_employee'
                ? 'border-blue-500 bg-blue-50/70 shadow-sm'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="w-full flex justify-start pl-1">
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                  loginType === 'paid_employee' ? 'border-blue-600' : 'border-slate-300'
                }`}
              >
                {loginType === 'paid_employee' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center my-1 text-amber-600">
              <HardHat className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 leading-tight">Paid Employee</span>
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-3.5">
          {/* Section 1: Employee OTP Verification (Green rounded block) */}
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3 space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 leading-tight">
                  Employee OTP Verification
                </h4>
                <p className="text-[9px] text-slate-500 font-medium">
                  OTP will be sent to the Employee mobile number
                </p>
              </div>
            </div>

            {/* Enter Employee Name */}
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Employee Name"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
              />
            </div>

            {/* Enter Employee Mobile + Get OTP */}
            <div className="flex space-x-1.5">
              <div className="relative flex-1">
                <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="Enter Employee Mobile Number"
                  value={employeeMobile}
                  onChange={(e) => setEmployeeMobile(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>
              <button
                type="button"
                onClick={() => setOtpSentEmp(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-all whitespace-nowrap shadow-xs"
              >
                {otpSentEmp ? 'Sent' : 'Get OTP'}
              </button>
            </div>

            {/* Enter Employee OTP */}
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Employee OTP"
                value={employeeOtp}
                onChange={(e) => setEmployeeOtp(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Section 2: Admin OTP Verification (Blue rounded block) */}
          <div className="bg-blue-50/70 border border-blue-200/90 rounded-2xl p-3 space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 leading-tight">
                  Admin OTP Verification
                </h4>
                <p className="text-[9px] text-slate-500 font-medium">
                  OTP will be sent to the Admin mobile number
                </p>
              </div>
            </div>

            {/* Enter Admin Mobile + Get OTP */}
            <div className="flex space-x-1.5">
              <div className="relative flex-1">
                <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="Enter Admin Mobile Number"
                  value={adminMobile}
                  onChange={(e) => setAdminMobile(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                />
              </div>
              <button
                type="button"
                onClick={() => setOtpSentAdm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-all whitespace-nowrap shadow-xs"
              >
                {otpSentAdm ? 'Sent' : 'Get OTP'}
              </button>
            </div>

            {/* Enter Admin OTP */}
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Admin OTP"
                value={adminOtp}
                onChange={(e) => setAdminOtp(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Big Blue Login Button */}
          <div className="pt-1">
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-white font-extrabold text-sm tracking-wide bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
