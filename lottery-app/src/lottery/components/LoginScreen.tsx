import React, { useState } from 'react';
import { Smartphone, Lock, User, Briefcase, Shield } from 'lucide-react';
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
    <div className="min-h-[calc(100vh-10rem)] w-full flex items-center justify-center p-4 sm:p-8 select-none">
      <div className="w-full max-w-md bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-slate-200 my-auto">
        <div className="mb-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Operator Sign In
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Select your access level to open the booking desk
          </p>
        </div>

        {/* Access Role Selector */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {/* Admin */}
          <button
            type="button"
            onClick={() => setLoginType('admin')}
            className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center transition-colors ${
              loginType === 'admin'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4 mb-1.5" />
            <span className="text-xs font-semibold">Admin</span>
          </button>

          {/* Staff */}
          <button
            type="button"
            onClick={() => setLoginType('employee')}
            className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center transition-colors ${
              loginType === 'employee'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4 mb-1.5" />
            <span className="text-xs font-semibold">Staff</span>
          </button>

          {/* Supervisor */}
          <button
            type="button"
            onClick={() => setLoginType('paid_employee')}
            className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center transition-colors ${
              loginType === 'paid_employee'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4 mb-1.5" />
            <span className="text-xs font-semibold">Supervisor</span>
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Staff Verification */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">
                Staff Credentials
              </h4>
              <span className="text-[10px] text-slate-500">SMS OTP</span>
            </div>

            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Staff Name"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 font-medium text-slate-800"
              />
            </div>

            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={employeeMobile}
                  onChange={(e) => setEmployeeMobile(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 font-medium text-slate-800"
                />
              </div>
              <button
                type="button"
                onClick={() => setOtpSentEmp(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap"
              >
                {otpSentEmp ? 'Code Sent' : 'Send Code'}
              </button>
            </div>

            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Verification Code"
                value={employeeOtp}
                onChange={(e) => setEmployeeOtp(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Admin Verification */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">
                Administrator Verification
              </h4>
              <span className="text-[10px] text-slate-500">Required for Admin</span>
            </div>

            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="Admin Mobile Number"
                  value={adminMobile}
                  onChange={(e) => setAdminMobile(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 font-medium text-slate-800"
                />
              </div>
              <button
                type="button"
                onClick={() => setOtpSentAdm(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap"
              >
                {otpSentAdm ? 'Code Sent' : 'Send Code'}
              </button>
            </div>

            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Admin Code"
                value={adminOtp}
                onChange={(e) => setAdminOtp(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 font-medium text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};
