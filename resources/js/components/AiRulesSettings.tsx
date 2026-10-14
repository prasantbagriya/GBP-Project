import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Star, 
  Sliders, 
  Phone, 
  Mail, 
  Languages, 
  Check, 
  Save, 
  RotateCcw, 
  UserCheck, 
  MessageSquare,
  AlertTriangle,
  Zap,
  HeartHandshake,
  Bot
} from 'lucide-react';
import { AiAutomationRules } from '../types';

interface AiRulesSettingsProps {
  onRulesUpdated?: (rules: AiAutomationRules) => void;
  /** Pass the current location's v4Name or name for per-profile rules */
  locationName?: string;
  /** Human-readable location title shown in heading */
  locationTitle?: string;
}

export const AiRulesSettings: React.FC<AiRulesSettingsProps> = ({ onRulesUpdated, locationName, locationTitle }) => {
  const [rules, setRules] = useState<AiAutomationRules>({
    enabled: true,
    minStarRating: 1,
    replyToEmptyReviews: true,
    maxRepliesPerMinute: 10,
    delayBetweenRepliesSeconds: 180,
    tone: 'Warm & Courteous',
    antiToxicityGuard: true,
    languageMatching: true,
    includeReviewerName: true,
    referenceSpecificExperience: true,
    contactPhone: '',
    contactEmail: '',
    customInstructions: 'Always maintain maximum respect and highlight our dedication to student success and discipline.',
    model: 'gemini-3.5-flash-lite'
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, [locationName]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const url = locationName
        ? `/api/settings/ai-rules?locationName=${encodeURIComponent(locationName)}`
        : '/api/settings/ai-rules';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.rules) {
          const fetched = { ...data.rules };
          // If legacy seconds < 60 was stored, convert to minutes
          if (fetched.delayBetweenRepliesSeconds && fetched.delayBetweenRepliesSeconds < 60) {
            fetched.delayBetweenRepliesSeconds = fetched.delayBetweenRepliesSeconds * 60;
          }
          setRules(fetched);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch AI rules:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const body: any = { rules };
      if (locationName) {
        body.locationName = locationName;
      }
      const res = await fetch('/api/settings/ai-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success && data.rules) {
        setRules(data.rules);
        if (onRulesUpdated) onRulesUpdated(data.rules);
        setFeedback(data.message || 'AI rules saved successfully!');
        setTimeout(() => setFeedback(null), 3500);
      } else {
        alert(data.error || 'Failed to save rules');
      }
    } catch (e) {
      alert('Failed to save rules');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm('Reset all AI rules to recommended defaults?')) return;
    setRules({
      enabled: true,
      minStarRating: 1,
      replyToEmptyReviews: true,
      maxRepliesPerMinute: 10,
      delayBetweenRepliesSeconds: 180,
      tone: 'Warm & Courteous',
      antiToxicityGuard: true,
      languageMatching: true,
      includeReviewerName: true,
      referenceSpecificExperience: true,
      contactPhone: '',
      contactEmail: '',
      customInstructions: 'Always maintain maximum respect and highlight our dedication to student success and discipline.',
      model: 'gemini-2.5-flash'
    });
  };

  const toneOptions = [
    {
      id: 'Warm & Courteous',
      title: 'Warm & Courteous',
      desc: 'Welcoming, grateful, and polite',
      icon: <HeartHandshake className="w-4 h-4 text-pink-500" />
    },
    {
      id: 'Professional & Authoritative',
      title: 'Professional & Direct',
      desc: 'Crisp, structured, and institutional',
      icon: <ShieldCheck className="w-4 h-4 text-blue-500" />
    },
    {
      id: 'Empathetic & Solution-Oriented',
      title: 'Empathetic & Caring',
      desc: 'Deeply caring and constructive',
      icon: <MessageSquare className="w-4 h-4 text-emerald-500" />
    },
    {
      id: 'Joyful & Enthusiastic',
      title: 'Joyful & Inspiring',
      desc: 'High-energy and motivational',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />
    }
  ];

  if (loading) {
    return (
      <div className="card p-6 text-center text-xs text-slate-400">
        Loading AI automation settings...
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-800 text-base">
              AI Automation Rules & Safety Engine
            </h3>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap shrink-0">
              <Zap className="w-3 h-3 text-blue-600 shrink-0" />
              <span>Gemini AI (High Speed)</span>
            </span>
            {locationTitle && (
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                {locationTitle}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {locationTitle
              ? `Configure AI rules for "${locationTitle}" only. These override global settings for this profile.`
              : 'Configure pacing (replies/min), star conditions, anti-toxicity guardrails, and hyper-personalized responses.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-nowrap shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0 font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? '...' : 'Save Rules'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Profile Auto-Reply Master Toggle Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
        rules.enabled
          ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-white border-emerald-300'
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg flex items-center justify-center ${
            rules.enabled ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
          }`}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm text-slate-800">
                {locationTitle ? `Auto-Reply for "${locationTitle}"` : 'Profile AI Auto-Reply'}
              </h4>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                rules.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {rules.enabled ? 'ACTIVE FOR THIS PROFILE' : 'DISABLED FOR THIS PROFILE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {rules.enabled
                ? 'AI Auto-reply is enabled specifically for this business profile. New incoming reviews will be answered automatically.'
                : 'Auto-reply is turned OFF for this profile only. Reviews for this profile will require manual approval.'}
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 self-end sm:self-auto">
          <input
            type="checkbox"
            checked={!!rules.enabled}
            onChange={(e) => setRules({ ...rules, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          <span className="ml-2.5 text-xs font-bold text-slate-700 whitespace-nowrap">
            {rules.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Pacing & Star Conditions */}
        <div className="space-y-6">
          
          {/* 1. Rate Limiting / Pacing Section */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>1. Pacing & Rate Limits</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Max replies per minute */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Max replies per minute:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={rules.maxRepliesPerMinute}
                    onChange={(e) => setRules({ ...rules, maxRepliesPerMinute: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                  <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-md border border-slate-200 text-blue-700 min-w-[50px] text-center">
                    {rules.maxRepliesPerMinute}/min
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Recommended safe limit: 10
                </span>
              </div>

              {/* Delay between replies in Minutes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Delay between replies:
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={rules.delayBetweenRepliesSeconds >= 60 ? rules.delayBetweenRepliesSeconds : (rules.delayBetweenRepliesSeconds * 60)}
                    onChange={(e) => setRules({ ...rules, delayBetweenRepliesSeconds: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value={60}>1 Min (Fast)</option>
                    <option value={120}>2 Min</option>
                    <option value={180}>3 Min (Natural - Recommended)</option>
                    <option value={300}>5 Min (Safe)</option>
                    <option value={600}>10 Min (Very Safe)</option>
                    <option value={900}>15 Min</option>
                    <option value={1800}>30 Min</option>
                  </select>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Pacing delay in minutes between each reply
                </span>
              </div>
            </div>
          </div>

          {/* 2. Rating & Review Filter Conditions */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Star className="w-4 h-4 text-amber-500" />
              <span>2. Star Rating Conditions</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Which ratings trigger auto-reply?
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { val: 1, label: 'All (1★-5★)' },
                    { val: 3, label: '3★ & Up' },
                    { val: 4, label: '4★ & 5★' },
                    { val: 5, label: '5★ Only' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setRules({ ...rules, minStarRating: opt.val })}
                      className={`py-2 px-1 rounded-md border text-xs font-semibold text-center transition-all whitespace-nowrap cursor-pointer ${
                        rules.minStarRating === opt.val
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle: Reply to reviews without comment text */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-md border border-slate-200 cursor-pointer">
                <div className="pr-2">
                  <span className="text-xs font-semibold text-slate-800 block">
                    Reply to rating-only reviews
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Respond politely when customer leaves rating without text
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rules.replyToEmptyReviews}
                  onChange={(e) => setRules({ ...rules, replyToEmptyReviews: e.target.checked })}
                  className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                />
              </label>

              {rules.minStarRating > 1 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Reviews below {rules.minStarRating}★ will not be auto-replied and will be held for manual review.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Tone of Voice Selector */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>3. Tone of Voice</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {toneOptions.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setRules({ ...rules, tone: t.id })}
                  className={`p-3 rounded-md border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                    rules.tone === t.id
                      ? 'bg-blue-50 border-blue-500 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">{t.icon}</div>
                  <div>
                    <h5 className={`text-xs font-bold ${rules.tone === t.id ? 'text-blue-900' : 'text-slate-800'}`}>
                      {t.title}
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      {t.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Safety, Anti-Toxicity & Personalization */}
        <div className="space-y-6">
          
          {/* 4. Anti-Toxicity Guard & Personalization Rules */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>4. Anti-Toxicity & Quality Guardrails</span>
            </div>

            <div className="space-y-2.5">
              {/* Zero Toxicity Guarantee */}
              <label className="flex items-center justify-between p-3 bg-white rounded-md border border-emerald-200 cursor-pointer shadow-2xs">
                <div className="pr-3">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Zero Toxicity Guarantee
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Never argue, never be sarcastic or defensive. Always maintain institutional dignity.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rules.antiToxicityGuard}
                  onChange={(e) => setRules({ ...rules, antiToxicityGuard: e.target.checked })}
                  className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Reference Specific Experience */}
              <label className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-200 cursor-pointer">
                <div className="pr-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Hyper-Personalized Context
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Explicitly acknowledge specific topics/faculty/services mentioned in review text.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rules.referenceSpecificExperience}
                  onChange={(e) => setRules({ ...rules, referenceSpecificExperience: e.target.checked })}
                  className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Language Matching */}
              <label className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-200 cursor-pointer">
                <div className="pr-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-indigo-600" />
                    Multi-Language Matching
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Replies in polite Hindi if review is in Hindi, and polished English if in English.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rules.languageMatching}
                  onChange={(e) => setRules({ ...rules, languageMatching: e.target.checked })}
                  className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Personal Name Greeting */}
              <label className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-200 cursor-pointer">
                <div className="pr-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    Name Greeting
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Begin with "Dear [Name]," for personal connection
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rules.includeReviewerName}
                  onChange={(e) => setRules({ ...rules, includeReviewerName: e.target.checked })}
                  className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* 5. Direct Offline Contact Info for Negative Ratings */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Phone className="w-4 h-4 text-amber-600" />
              <span>5. Offline Escalation Contact</span>
            </div>

            <p className="text-[11px] text-slate-500">
              When a review is 1-3 stars, AI invites the customer to reach out directly to resolve the issue:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Manager Phone Number:
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={rules.contactPhone}
                    onChange={(e) => setRules({ ...rules, contactPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Support Email:
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="email"
                    value={rules.contactEmail}
                    onChange={(e) => setRules({ ...rules, contactEmail: e.target.value })}
                    placeholder="contact@princeacademy.com"
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 6. Special Business Guidelines */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              6. Special Business Guidelines for AI
            </label>
            <textarea
              rows={2}
              value={rules.customInstructions}
              onChange={(e) => setRules({ ...rules, customInstructions: e.target.value })}
              placeholder="e.g. Always emphasize our discipline and selection track record."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-400 block">
              These instructions guide every AI reply generated.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
