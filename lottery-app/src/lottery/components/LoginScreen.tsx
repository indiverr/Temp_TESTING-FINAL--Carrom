import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  UserPlus,
  Briefcase,
  Shield,
  Mail,
  KeyRound,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  AtSign,
  Eye,
  EyeOff,
} from 'lucide-react';
import { LoginType, formatRoleLabel } from '../types';
import { liveFirebase } from '../liveFirebase';
import { getFirebaseConfigDiagnostics } from '../firebaseConfig';

interface LoginScreenProps {
  onLoginSuccess: (type: LoginType, name: string, uid?: string) => void;
  initialMode?: 'credentials' | 'signup';
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  initialMode = 'credentials',
}) => {
  const [loginType, setLoginType] = useState<LoginType>('employee');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(true);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');

  // Sign-Up state
  const [signupRole, setSignupRole] = useState<'employee' | 'paid_employee'>('employee');
  const [fullName, setFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [registeredAccount, setRegisteredAccount] = useState<{
    name: string;
    username: string;
    email: string;
    role?: LoginType;
  } | null>(null);

  // Screen step: 'credentials' (Login) | 'signup' (Register) | 'otp' (Sign-Up Email OTP Verification) | 'forgot_password'
  const [step, setStep] = useState<'credentials' | 'signup' | 'otp' | 'forgot_password'>(
    initialMode
  );
  const [otpCode, setOtpCode] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('carromlotterydesk@gmail.com');
  const [senderEmail, setSenderEmail] = useState('carromlotterydesk@gmail.com');
  const [pendingUser, setPendingUser] = useState<{
    uid: string;
    name: string;
    username: string;
    email: string;
    role: LoginType;
  } | null>(null);

  // Timers & attempt tracking
  const [expirySeconds, setExpirySeconds] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Status feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(() => {
    const diag = getFirebaseConfigDiagnostics();
    return diag.configured ? '' : diag.diagnosticMessage;
  });
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    if (step !== 'otp' && (initialMode === 'credentials' || initialMode === 'signup')) {
      setStep(initialMode);
    }
  }, [initialMode]);

  // Countdown effect for 5-minute OTP expiration and 60-second resend cooldown
  useEffect(() => {
    if (step !== 'otp') return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const formatCountdown = (totalSec: number): string => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const switchToLogin = (prefillUsername?: string, successNotice?: string) => {
    const diag = getFirebaseConfigDiagnostics();
    setErrorMessage(diag.configured ? '' : diag.diagnosticMessage);
    setInfoMessage(successNotice || '');
    setRegisteredAccount(null);
    setPendingUser(null);
    setPassword('');
    setShowPassword(false);
    if (prefillUsername) {
      setIdentifier(prefillUsername);
      setLoginType('employee');
    }
    setStep('credentials');
  };

  const switchToSignup = () => {
    const diag = getFirebaseConfigDiagnostics();
    setErrorMessage(diag.configured ? '' : diag.diagnosticMessage);
    setInfoMessage('');
    setRegisteredAccount(null);
    setPendingUser(null);
    setShowSignupPassword(false);
    setShowSignupConfirmPassword(false);
    setStep('signup');
  };

  const switchToForgotPassword = () => {
    const diag = getFirebaseConfigDiagnostics();
    setErrorMessage(diag.configured ? '' : diag.diagnosticMessage);
    setInfoMessage('');
    if (identifier.includes('@')) {
      setForgotEmail(identifier.trim());
    }
    setStep('forgot_password');
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter your username (or registered email) and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await liveFirebase.authenticateAndCheckFirstLoginOtp(
        identifier.trim(),
        password,
        loginType,
        keepMeSignedIn
      );

      if (!res.success || !res.user) {
        setErrorMessage(res.error || 'Authentication failed.');
        return;
      }

      // Normal login requires only username/email and password (no OTP on first or subsequent logins)
      onLoginSuccess(res.user.role, res.user.name, res.user.uid);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await liveFirebase.sendPasswordReset(cleanEmail);
      if (!res.success) {
        setErrorMessage(res.error || res.message);
      } else {
        setInfoMessage(res.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const cleanName = fullName.trim();
    const cleanUser = signupUsername.trim().toLowerCase();
    const cleanMail = signupEmail.trim().toLowerCase();

    if (!cleanName || !cleanUser || !cleanMail || !signupPassword || !signupConfirmPassword) {
      setErrorMessage('Please fill in all required registration fields.');
      return;
    }

    if (cleanName.length < 2 || cleanName.length > 80) {
      setErrorMessage('Full name must be between 2 and 80 characters.');
      return;
    }

    if (!/^[a-z0-9._-]{3,32}$/.test(cleanUser)) {
      setErrorMessage(
        'Username must be 3 to 32 characters and contain only letters, numbers, dots (.), underscores (_), or hyphens (-).'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanMail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match. Please confirm your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await liveFirebase.registerEmployeeAccount({
        fullName: cleanName,
        username: cleanUser,
        email: cleanMail,
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
        requestedRole: signupRole,
      });

      if (!res.success || !res.user) {
        setErrorMessage(res.error || 'Registration failed. Please try again.');
        return;
      }

      // Transition to Sign-Up Email OTP verification step before completing registration
      const roleLabel = signupRole === 'paid_employee' ? 'Paid Employee' : 'Employee';
      setPendingUser({
        uid: res.user.uid,
        name: res.user.name,
        username: res.user.username,
        email: res.user.email,
        role: res.user.role || signupRole,
      });
      setRecipientEmail('carromlotterydesk@gmail.com');
      setSenderEmail('carromlotterydesk@gmail.com');
      setExpirySeconds(res.expiresInSeconds || 300);
      setCooldownSeconds(res.resendCooldownSeconds || 60);
      setRemainingAttempts(null);
      setOtpCode('');
      setStep('otp');
      setInfoMessage(
        `A 6-digit registration approval code has been sent to the Carrom administrator (carromlotterydesk@gmail.com) for ${roleLabel} registration. Enter the code from the administrator below to complete your registration.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const trimmedOtp = otpCode.trim();
    if (!/^\d{6}$/.test(trimmedOtp)) {
      setErrorMessage('Please enter the 6-digit numeric verification code.');
      return;
    }

    if (expirySeconds <= 0) {
      setErrorMessage('Verification code has expired (5-minute limit). Please request a new code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await liveFirebase.verifyFirstLoginOtp(trimmedOtp, {
        signOutAfterVerify: true,
      });
      if (!res.success || !res.verified) {
        if (typeof res.remainingAttempts === 'number') {
          setRemainingAttempts(res.remainingAttempts);
        }
        setErrorMessage(res.error || 'Incorrect verification code.');
        return;
      }

      const verifiedUsername =
        res.username || pendingUser?.username || signupUsername.trim().toLowerCase();
      const verifiedName = res.name || pendingUser?.name || fullName.trim();
      const verifiedEmail = res.email || pendingUser?.email || signupEmail.trim().toLowerCase();
      const verifiedRole: LoginType = (res.role as LoginType) || pendingUser?.role || signupRole;
      const verifiedRoleLabel = formatRoleLabel(verifiedRole);

      setRegisteredAccount({
        name: verifiedName,
        username: verifiedUsername,
        email: verifiedEmail,
        role: verifiedRole,
      });
      setPendingUser(null);
      setOtpCode('');
      setFullName('');
      setSignupUsername('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setStep('signup');
      setInfoMessage(
        `Email verified and ${verifiedRoleLabel} account "${verifiedUsername}" has been registered. You can now sign in with your username and password.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldownSeconds > 0 || isLoading) return;
    setErrorMessage('');
    setInfoMessage('');
    setIsLoading(true);

    try {
      const res = await liveFirebase.requestFirstLoginOtp();
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to resend verification code.');
        return;
      }
      if (res.alreadyVerified && pendingUser) {
        await liveFirebase.signOutUser();
        setRegisteredAccount({
          name: pendingUser.name,
          username: pendingUser.username,
          email: pendingUser.email,
          role: pendingUser.role,
        });
        setPendingUser(null);
        setStep('signup');
        setInfoMessage(
          `Account "${pendingUser.username}" is already verified. You can now sign in with your username and password.`
        );
        return;
      }
      setExpirySeconds(res.expiresInSeconds || 300);
      setCooldownSeconds(res.resendCooldownSeconds || 60);
      setRemainingAttempts(null);
      setOtpCode('');
      setInfoMessage(
        'A new 6-digit registration approval code was sent to the Carrom administrator (carromlotterydesk@gmail.com).'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOtpStep = async () => {
    setIsLoading(true);
    try {
      await liveFirebase.cancelSignupRegistration();
    } finally {
      setIsLoading(false);
      setStep('signup');
      setOtpCode('');
      setErrorMessage('');
      setInfoMessage('');
      setPendingUser(null);
    }
  };

  const activeRoleLabel = formatRoleLabel(loginType);

  return (
    <div className="min-h-[calc(100vh-10rem)] w-full flex items-center justify-center p-4 sm:p-8 select-none">
      <div className="w-full max-w-md bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-slate-200 my-auto">
        <div className="mb-5 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {step === 'credentials'
              ? 'Operator Sign In'
              : step === 'signup'
              ? 'Account Registration'
              : step === 'forgot_password'
              ? 'Reset Password'
              : 'Verify Email to Complete Sign Up'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {step === 'credentials'
              ? 'Select your access level and sign in with your username and password'
              : step === 'signup'
              ? `Create a new ${signupRole === 'paid_employee' ? 'Paid Employee' : 'Employee'} account`
              : step === 'forgot_password'
              ? 'Enter your registered email address to receive a secure password reset link'
              : 'The 6-digit code is sent to the Carrom administrator (carromlotterydesk@gmail.com) for registration approval'}
          </p>
        </div>

        {/* Startup Safe Check Alert Banner if unconfigured in live mode */}
        {!getFirebaseConfigDiagnostics().configured && (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Live Authentication Offline</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  {getFirebaseConfigDiagnostics().diagnosticMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login / Sign Up Mode Switcher (beside Login option) */}
        {step !== 'otp' && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200 mb-5">
            <button
              type="button"
              onClick={() => switchToLogin()}
              disabled={isLoading}
              className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                step === 'credentials' || step === 'forgot_password'
                  ? 'bg-white text-blue-600 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
            <button
              type="button"
              onClick={switchToSignup}
              disabled={isLoading}
              className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                step === 'signup'
                  ? 'bg-white text-blue-600 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>
        )}

        {step === 'credentials' ? (
          <>
            {/* Access Role Selector */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {/* Admin */}
              <button
                type="button"
                onClick={() => {
                  setLoginType('admin');
                  if (!identifier.trim()) setIdentifier('sasikaran');
                }}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center transition-colors ${
                  loginType === 'admin'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-4 h-4 mb-1.5" />
                <span className="text-xs font-semibold">Admin</span>
              </button>

              {/* Employee */}
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
                <span className="text-xs font-semibold">Employee</span>
              </button>

              {/* Paid Employee */}
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
                <span className="text-xs font-semibold">Paid Employee</span>
              </button>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    {activeRoleLabel} Credentials
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Username &amp; Password Sign In
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Username or Registered Email
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoComplete="username"
                      placeholder={
                        loginType === 'admin'
                          ? 'sasikaran (or registered email)'
                          : `Enter ${activeRoleLabel} username or email`
                      }
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-8 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 font-medium text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Keep Me Signed In & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={keepMeSignedIn}
                      onChange={(e) => setKeepMeSignedIn(e.target.checked)}
                      disabled={isLoading}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span className="text-[11px] text-slate-600 font-medium">Keep me signed in</span>
                  </label>
                  <button
                    type="button"
                    onClick={switchToForgotPassword}
                    disabled={isLoading}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {infoMessage && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {isLoading ? 'Authenticating...' : `Sign In as ${activeRoleLabel}`}
              </button>

              <div className="pt-2 border-t border-slate-100 text-center">
                <span className="text-xs text-slate-500">New operator? </span>
                <button
                  type="button"
                  onClick={switchToSignup}
                  disabled={isLoading}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
                >
                  Sign Up for an Employee Account
                </button>
              </div>
            </form>
          </>
        ) : step === 'forgot_password' ? (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">Password Recovery</h4>
                <span className="text-[10px] text-slate-500">Firebase Auth</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered email address below. We'll send you an email with a secure link to reset your password.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="operator@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 font-medium text-slate-800"
                  />
                </div>
              </div>
            </div>

            {infoMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !forgotEmail.trim()}
              className="w-full py-2.5 rounded-lg text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {isLoading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
            </button>

            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => switchToLogin()}
                disabled={isLoading}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        ) : step === 'signup' ? (
          registeredAccount ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Registration &amp; Verification Complete</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {infoMessage}
                </p>
                <div className="bg-white/80 rounded-md p-2.5 border border-emerald-200/80 text-[11px] text-slate-700 space-y-1">
                  <div>
                    <strong>Full Name:</strong> {registeredAccount.name}
                  </div>
                  <div>
                    <strong>Username:</strong> {registeredAccount.username}
                  </div>
                  <div>
                    <strong>Email:</strong> {registeredAccount.email}
                  </div>
                  <div>
                    <strong>Assigned Role:</strong>{' '}
                    {registeredAccount.role === 'paid_employee' ? 'Paid Employee' : 'Employee'} (Email OTP Verified)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  switchToLogin(
                    registeredAccount.username,
                    `Account "${registeredAccount.username}" is verified and active. Enter your password to sign in.`
                  )
                }
                className="w-full py-2.5 rounded-lg text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Login</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Role Selection for Sign-Up: Employee vs Paid Employee */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSignupRole('employee')}
                  disabled={isLoading}
                  className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                    signupRole === 'employee'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Employee</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignupRole('paid_employee')}
                  disabled={isLoading}
                  className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                    signupRole === 'paid_employee'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  <span>Paid Employee</span>
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    New {signupRole === 'paid_employee' ? 'Paid Employee' : 'Employee'} Registration
                  </h4>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      signupRole === 'paid_employee'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    Role: {signupRole === 'paid_employee' ? 'Paid Employee' : 'Employee'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <AtSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoComplete="username"
                      placeholder="Choose a unique username (e.g. ravi_kumar)"
                      value={signupUsername}
                      onChange={(e) =>
                        setSignupUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))
                      }
                      disabled={isLoading}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email address"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Create password (min. 6 characters)"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-8 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 font-medium text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      disabled={isLoading}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5"
                      title={showSignupPassword ? 'Hide password' : 'Show password'}
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-8 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 font-medium text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      disabled={isLoading}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5"
                      title={showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                      aria-label={showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignupConfirmPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {isLoading
                  ? 'Sending 6-Digit Verification OTP...'
                  : `Send Verification OTP & Register as ${signupRole === 'paid_employee' ? 'Paid Employee' : 'Employee'}`}
              </button>

              <div className="pt-2 border-t border-slate-100 text-center">
                <span className="text-xs text-slate-500">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => switchToLogin()}
                  disabled={isLoading}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sign-Up Approval OTP</span>
                </div>
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                    expirySeconds > 60
                      ? 'bg-white text-slate-700 border-slate-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  Expires: {formatCountdown(expirySeconds)}
                </span>
              </div>

              <div className="text-[11px] text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-md border border-slate-200/60 space-y-0.5">
                <div>
                  Requested Role:{' '}
                  <strong className="text-slate-800">
                    {pendingUser?.role === 'paid_employee' ? 'Paid Employee' : 'Employee'}
                  </strong>
                </div>
                <div>
                  Sender: <strong className="text-slate-800">{senderEmail}</strong>
                </div>
                <div>
                  Recipient: <strong className="text-slate-800">{recipientEmail}</strong>
                </div>
                {pendingUser?.username && (
                  <div>
                    Username: <strong className="text-slate-800">{pendingUser.username}</strong>
                  </div>
                )}
                {pendingUser?.email && (
                  <div>
                    Applicant Email: <strong className="text-slate-800">{pendingUser.email}</strong>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-blue-800 bg-blue-50 border border-blue-200 rounded-md p-2 leading-relaxed">
                This 6-digit verification code is sent to the Carrom administrator (<strong>carromlotterydesk@gmail.com</strong>) for registration approval. Please enter the code provided by the administrator to complete your Sign Up.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={isLoading}
                    className="w-full pl-8 pr-3 py-2.5 text-sm tracking-widest font-mono bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 font-bold text-slate-900"
                  />
                </div>
              </div>

              {remainingAttempts !== null && (
                <div className="text-[11px] font-semibold text-amber-700">
                  Remaining attempts for this code: {remainingAttempts}
                </div>
              )}
            </div>

            {infoMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6 || expirySeconds <= 0}
              className="w-full py-2.5 rounded-lg text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {isLoading ? 'Verifying Code...' : 'Verify OTP & Complete Sign Up'}
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelOtpStep}
                disabled={isLoading}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign Up</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading || cooldownSeconds > 0}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-400 flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {cooldownSeconds > 0
                    ? `Resend Code (${cooldownSeconds}s)`
                    : 'Resend Code'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
