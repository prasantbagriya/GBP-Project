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
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col justify-center items-center px-4 py-8 relative select-none font-sans">
      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-sm mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Prince Edu Hub <span className="text-indigo-600">Portal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto font-medium">
            Google Business Profile & review management
          </p>
        </div>

        {/* PWA Install App Prompt Banner */}
        {!isStandalone && (
          <div className="mb-4 p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 text-left min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 leading-tight">Install Prince Edu Hub app</div>
                <div className="text-[11px] text-slate-500 truncate">Direct access from your home screen</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Install
            </button>
          </div>
        )}

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 shadow-sm relative">
          
          {/* Header ribbon */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                {view === 'login' ? (
                  <>
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <span>Sign In to Panel</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-indigo-600" />
                    <span>Reset Password</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {view === 'login' && 'Enter your credentials to continue'}
                {view === 'forgot_email' && 'Enter your registered email to receive an OTP'}
                {view === 'forgot_otp' && 'Enter OTP and set your new password'}
              </p>
            </div>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Protected</span>
            </span>
          </div>

          {/* Success Notification */}
          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div className="flex-1 font-normal">{successMsg}</div>
            </div>
          )}

          {/* Notice for OTP Sent */}
          {otpSentNotice && view === 'forgot_otp' && (
            <div className="mb-4 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs sm:text-sm flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-indigo-700 mt-0.5 shrink-0" />
              <div className="flex-1 font-normal">{otpSentNotice}</div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <div className="flex-1 font-normal">{error}</div>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email or Phone Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email address or mobile number
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
                    className="w-full pl-9 pr-3.5 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-colors shadow-2xs"
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
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors cursor-pointer"
                  >
                    Forgot password?
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
                    className="w-full pl-9 pr-10 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-colors shadow-2xs"
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
                    className="w-4 h-4 rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0 focus:ring-1 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember session</span>
                </label>
                <span className="text-xs text-slate-400 font-medium">Session encrypted</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 mt-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD - STEP 1 (ENTER EMAIL OR PHONE) */}
          {view === 'forgot_email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered email or mobile number
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
                    className="w-full pl-9 pr-3.5 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-colors shadow-2xs"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  <span>A 6-digit OTP will be dispatched via email and SMS</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send verification OTP</span>
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
                className="w-full py-2 text-center text-xs text-slate-600 hover:text-slate-900 font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </button>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD - STEP 2 (ENTER OTP & NEW PASSWORD) */}
          {view === 'forgot_otp' && (
            <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
              {/* Target Account Badge */}
              {resetEmail ? (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-700">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-500 block font-medium">
                        Resetting password for
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate block">
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
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold shrink-0 ml-2 cursor-pointer hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered email or mobile number
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
                      className="w-full pl-9 pr-3.5 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-colors shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {otpSentNotice && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span>{otpSentNotice}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6-digit verification OTP
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
                    className="w-full pl-9 pr-3.5 py-2 tracking-widest text-base font-semibold tabular-nums bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-colors shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New password
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
                    className="w-full pl-9 pr-10 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-colors shadow-2xs"
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
                  Confirm new password
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
                    className="w-full pl-9 pr-3.5 py-2 bg-white hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-colors shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Resetting password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset password & sign in</span>
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
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Change email / mobile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setView('login');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors cursor-pointer"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500 flex items-center justify-center gap-2 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Role-based access &bull; Encrypted session</span>
        </div>

      </div>
    </div>
  );
};
