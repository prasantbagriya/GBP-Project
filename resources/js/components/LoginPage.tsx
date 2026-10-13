/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  Sparkles,
  KeyRound,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { PanelUser } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: PanelUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

  const handleFillDemoAdmin = () => {
    setEmail('admin@coachingsinsikar.com');
    setPassword('Admin@123456');
    setError(null);
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
            GBP Live Sync <span className="text-blue-600">Portal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Secure dashboard access & multi-location Google Business profile manager.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-7 shadow-sm relative">
          
          {/* Header ribbon */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Sign In to Panel
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter your credentials to continue</p>
            </div>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md flex items-center gap-1 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Protected
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@coachingsinsikar.com"
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

          {/* Quick Demo Helper */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between gap-3 shadow-2xs">
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Default Admin Account
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  admin@coachingsinsikar.com
                </div>
              </div>
              <button
                type="button"
                onClick={handleFillDemoAdmin}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-600 border border-slate-300 rounded-md text-xs font-semibold transition-colors shrink-0 cursor-pointer shadow-2xs"
              >
                Auto Fill
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500 flex items-center justify-center gap-2 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Role Based Security • Secure Encrypted Session</span>
        </div>

      </div>
    </div>
  );
};
