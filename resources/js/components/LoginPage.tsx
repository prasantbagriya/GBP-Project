/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  KeyRound,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Smartphone
} from 'lucide-react';
import { PanelUser } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: PanelUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'forgot_email' | 'forgot_otp'>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('reset_otp') || p.get('otp')) {
        return 'forgot_otp';
      }
    } catch {}
    return 'login';
  });
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  });

  useEffect(() => {
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          setIsStandalone(true);
        }
        setDeferredPrompt(null);
      } catch {}
    } else {
      alert('To install the Prince Edu Hub App:\n- On Android/Chrome: Tap browser menu (⋮) -> "Install app" or "Add to Home screen".\n- On iPhone/iPad (Safari): Tap the Share button -> "Add to Home Screen".');
    }
  };

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('identifier') || p.get('email') || '';
    } catch {
      return '';
    }
  });
  const [resetOtp, setResetOtp] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('reset_otp') || p.get('otp') || '';
    } catch {
      return '';
    }
  });
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [otpSentNotice, setOtpSentNotice] = useState<string | null>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('reset_otp') || p.get('otp')) {
        return 'Verification code verified. Please set your new password below.';
      }
    } catch {}
    return null;
  });

  // Check for OTP and identifier passed in URL parameters
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlOtp = urlParams.get('reset_otp') || urlParams.get('otp');
      const urlIdentifier = urlParams.get('identifier') || urlParams.get('email');

      if (urlOtp) {
        if (urlIdentifier) setResetEmail(urlIdentifier);
        setResetOtp(urlOtp);
        setOtpSentNotice('Verification code verified. Please set your new password below.');
        setView('forgot_otp');
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          remember
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Authentication failed. Please verify credentials.');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!resetEmail.trim()) {
      setError('Please enter your registered email or mobile number.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          identifier: resetEmail.trim(),
          email: resetEmail.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to send OTP.');
      }

      setOtpSentNotice(data.message || '6-digit OTP has been sent via Email and SMS.');
      setView('forgot_otp');
    } catch (err: any) {
      setError(err.message || 'Could not send OTP. Please check your email or mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!resetOtp.trim()) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    if (resetPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password/verify-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          identifier: resetEmail.trim(),
          email: resetEmail.trim(),
          otp: resetOtp.trim(),
          password: resetPassword,
          password_confirmation: resetConfirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Password reset failed.');
      }

      // 1. Remove query parameters from browser URL so reset_otp is cleared
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}

      // 2. Clear reset fields & show success message on Login screen
      setEmail(resetEmail.trim());
      setPassword('');
      setResetOtp('');
      setResetPassword('');
      setResetConfirmPassword('');
      setError(null);
      setSuccessMsg('Password changed successfully! Please sign in with your new password.');
      setView('login');
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none font-sans">
      {/* Background Subtle Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 p-0.5 shadow-sm mb-3">
            <div className="w-full h-full bg-white rounded-md flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
            Prince Edu Hub <span className="text-blue-600">Portal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Google Business Profile & Review Management
          </p>
        </div>

        {/* PWA Install App Prompt Banner */}
        {!isStandalone && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 text-left min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 leading-tight">Install Prince Edu Hub App</div>
                <div className="text-[10px] text-slate-500 truncate">1-Click direct login from your home screen</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Install
            </button>
          </div>
        )}

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-7 shadow-sm relative">
          
          {/* Header ribbon */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                {view === 'login' ? (
                  <>
                    <Lock className="w-4 h-4 text-blue-600" />
                    Sign In to Panel
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    Reset Password
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {view === 'login' && 'Enter your credentials to continue'}
                {view === 'forgot_email' && 'Enter your registered email to receive an OTP'}
                {view === 'forgot_otp' && 'Enter OTP and set your new password'}
              </p>
            </div>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md flex items-center gap-1 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Protected
            </span>
          </div>

          {/* Success Notification */}
          {successMsg && (
            <div className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* Notice for OTP Sent */}
          {otpSentNotice && view === 'forgot_otp' && (
            <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs">
              <Mail className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1 font-medium">{otpSentNotice}</div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Email or Phone Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@princeeduhub.com or +91 7877217768"
                    className="w-full pl-9 pr-3.5 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email || '');
                      setError(null);
                      setView('forgot_email');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/30 focus:ring-offset-0 focus:ring-1 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember session</span>
                </label>
                <span className="text-xs text-slate-400 font-medium">Session encrypted</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 mt-2 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD - STEP 1 (ENTER EMAIL OR PHONE) */}
          {view === 'forgot_email' && (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email or Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="e.g. name@princeeduhub.com or +91 9876543210"
                    className="w-full pl-9 pr-3.5 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  <span>A 6-digit OTP will be dispatched via <strong>Email & SMS</strong>.</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending OTP to Email & SMS...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification OTP (Email & SMS)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setView('login');
                }}
                className="w-full py-2 text-center text-xs text-slate-600 hover:text-slate-800 font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD - STEP 2 (ENTER OTP & NEW PASSWORD) */}
          {view === 'forgot_otp' && (
            <form onSubmit={handleVerifyOtpAndReset} className="space-y-3.5">
              {/* Target Account Badge */}
              {resetEmail ? (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Resetting Password For
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate block">
                        {resetEmail}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setView('forgot_email');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0 ml-2 cursor-pointer hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Email or Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter registered email or mobile"
                      className="w-full pl-9 pr-3.5 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {otpSentNotice && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{otpSentNotice}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6-Digit Verification OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full pl-9 pr-3.5 py-2 tracking-widest text-base font-mono bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-9 pr-3.5 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setView('forgot_email');
                  }}
                  className="text-xs text-slate-600 hover:text-slate-800 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Change Email / Mobile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setView('login');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500 flex items-center justify-center gap-2 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Role Based Security • Zero Profile Data Leakage</span>
        </div>

      </div>
    </div>
  );
};
