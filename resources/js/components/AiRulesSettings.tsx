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
  Bot,
  Cpu,
  FileText
} from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
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
    model: 'gemini-2.5-flash',
    replyLength: 'detailed',
    thinkingBudget: 0,
    temperature: 0.85
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
      model: 'gemini-2.5-flash',
      replyLength: 'detailed',
      thinkingBudget: 0,
      temperature: 0.85
    });
  };

  const toneOptions = [
    {
      id: 'Warm & Courteous',
      title: 'Warm & Courteous',
      desc: 'Welcoming, grateful, polite, and deeply appreciative.',
      icon: <HeartHandshake className="w-4 h-4 text-pink-500" />
    },
    {
      id: 'Professional & Authoritative',
      title: 'Professional & Direct',
      desc: 'Formal, structured, authoritative, and institutional.',
      icon: <ShieldCheck className="w-4 h-4 text-blue-500" />
    },
    {
      id: 'Empathetic & Solution-Oriented',
      title: 'Empathetic & Caring',
      desc: 'Deeply compassionate, listening, and constructive.',
      icon: <MessageSquare className="w-4 h-4 text-emerald-500" />
    },
    {
      id: 'Joyful & Enthusiastic',
      title: 'Joyful & Inspiring',
      desc: 'Inspiring, energetic, motivational, and cheerful.',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />
    }
  ];

  if (loading) {
    return (
      <div className="card p-6 text-center text-xs text-slate-400">
        Loading AI rules for {locationTitle || 'profile'}...
      </div>
    );
  }

  return (
    <div className="card p-4 sm:p-6 space-y-6 max-w-full overflow-hidden">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-800">
              {locationTitle ? `AI Rules for "${locationTitle}"` : 'AI Automation Rules'}
            </h3>
            {locationName && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                Profile-Specific
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-md text-xs font-medium text-slate-600 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
            title="Reset to recommended defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
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
      <div className={`p-3.5 sm:p-4 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
        rules.enabled
          ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-white border-emerald-300'
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md flex items-center justify-center shrink-0 ${
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
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0 self-end sm:self-auto">
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
        
        {/* Left Column: Pacing & Star Conditions & Tone */}
        <div className="space-y-6">
          
          {/* 1. Rate Limiting / Pacing Section */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-md space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>1. Pacing & Rate Limits</span>
              <InfoTooltip
                title="Pacing & Rate Limits"
                content="Regulates the frequency of published replies to maintain safe Google Business Profile API quotas and mimic natural human response pacing."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Max replies per minute */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <span>Max replies per minute:</span>
                  <InfoTooltip
                    title="Max Replies per Minute"
                    content="Maximum number of automated replies sent per minute. Recommended safe ceiling is 10/min to avoid Google API throttling."
                  />
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
              </div>

              {/* Delay between replies in Minutes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <span>Delay between replies:</span>
                  <InfoTooltip
                    title="Reply Interval Pacing"
                    content="The delay paused between consecutive review replies. Natural pacing (3–5 min) simulates real human manager behavior."
                  />
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
              </div>
            </div>
          </div>

          {/* 2. Rating & Review Filter Conditions */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-md space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Star className="w-4 h-4 text-amber-500" />
              <span>2. Star Rating Conditions</span>
              <InfoTooltip
                title="Star Rating Conditions"
                content="Defines which reviews qualify for immediate automatic replies and which lower ratings are held for manual manager review."
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <span>Which ratings trigger auto-reply?</span>
                  <InfoTooltip
                    title="Minimum Star Threshold"
                    content="Select minimum rating needed to trigger AI auto-replies. For instance, choosing '4★ & 5★' holds 1–3 star complaints for private review."
                  />
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
                <div className="pr-2 flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800">
                    Reply to rating-only reviews
                  </span>
                  <InfoTooltip
                    title="Rating-Only Reviews"
                    content="Send a courteous acknowledgment when a customer leaves stars without typing comments."
                  />
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
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Reviews below {rules.minStarRating}★ will not be auto-replied and will be held for manual review.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Tone of Voice Selector */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-md space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>3. Tone of Voice</span>
              <InfoTooltip
                title="AI Personality & Tone"
                content="Shapes the tone, vocabulary, and communication style that Google Gemini uses in every customer interaction."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {toneOptions.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setRules({ ...rules, tone: t.id })}
                  className={`p-3 rounded-md border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                    rules.tone === t.id
                      ? 'bg-blue-50 border-blue-500 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0">{t.icon}</div>
                    <h5 className={`text-xs font-bold truncate ${rules.tone === t.id ? 'text-blue-900' : 'text-slate-800'}`}>
                      {t.title}
                    </h5>
                  </div>
                  <InfoTooltip title={t.title} content={t.desc} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Safety, Anti-Toxicity & Personalization */}
        <div className="space-y-6">
          
          {/* 4. Anti-Toxicity Guard & Personalization Rules */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-md space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>4. Anti-Toxicity & Quality Guardrails</span>
              <InfoTooltip
                title="Reputation Guardrails"
                content="Safeguards brand reputation by preventing defensive remarks, personalizing greetings, and matching the customer's language."
              />
            </div>

            <div className="space-y-2.5">
              {/* Zero Toxicity Guarantee */}
              <label className="flex items-center justify-between p-3 bg-white rounded-md border border-emerald-200 cursor-pointer shadow-2xs">
                <div className="pr-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-emerald-950">
                    Zero Toxicity Guarantee
                  </span>
                  <InfoTooltip
                    title="Zero Toxicity"
                    content="Never argues, never defensive or sarcastic. Always maintains institutional grace and dignity."
                  />
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
                <div className="pr-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">
                    Hyper-Personalized Context
                  </span>
                  <InfoTooltip
                    title="Contextual References"
                    content="Explicitly acknowledges specific details mentioned by customer (faculty, hostel, coaching, results, etc.)."
                  />
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
                <div className="pr-3 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">
                    Multi-Language Matching
                  </span>
                  <InfoTooltip
                    title="Language Matching"
                    content="Detects Hindi, Hinglish, or English and responds in the exact corresponding language naturally."
                  />
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
                <div className="pr-3 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">
                    Name Greeting
                  </span>
                  <InfoTooltip
                    title="Name Greeting"
                    content="Addresses the reviewer by their first name (e.g. 'Dear Rahul,') for authentic personal connection."
                  />
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
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-md space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Phone className="w-4 h-4 text-amber-600" />
              <span>5. Offline Escalation Contact</span>
              <InfoTooltip
                title="Offline Resolution Contact"
                content="When a customer leaves 1 to 3 stars, AI automatically invites them to reach out directly via these channels to resolve the issue privately."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <span>Manager Phone Number:</span>
                  <InfoTooltip
                    title="Support Phone"
                    content="Direct escalation phone number included in replies to 1–3 star negative reviews."
                  />
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
                <label className="text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <span>Support Email:</span>
                  <InfoTooltip
                    title="Support Email"
                    content="Official escalation email included in replies to 1–3 star negative reviews."
                  />
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
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-md space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>6. Special Business Guidelines for AI</span>
              <InfoTooltip
                title="Business Guidelines"
                content="Custom instructions injected into every AI generation. E.g. 'Highlight our student discipline, campus environment, and selections track record.'"
              />
            </label>
            <textarea
              rows={2}
              value={rules.customInstructions}
              onChange={(e) => setRules({ ...rules, customInstructions: e.target.value })}
              placeholder="e.g. Always emphasize our discipline and selection track record."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 7. AI Model Engine, Speed & Response Control */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-white border border-indigo-200 rounded-md space-y-4 shadow-2xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>7. AI Engine, Speed & Reply Length Controls</span>
            <InfoTooltip
              title="AI Engine Controller"
              content="Directly controls Google Gemini parameters: active model, response speed (thinking budget), output verbosity, and creative temperature."
            />
          </div>
          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
            Active Controller
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* AI Model Selection */}
          <div className="p-3 bg-white rounded-md border border-slate-200 space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Model Engine:</span>
              <InfoTooltip
                title="Google Gemini Model"
                content="Active Gemini model with 100% Google AI Studio uptime. Gemini 2.5 Flash is recommended for its speed and intelligent reasoning."
              />
            </label>
            <select
              value={rules.model || 'gemini-2.5-flash'}
              onChange={(e) => setRules({ ...rules, model: e.target.value })}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Smart, Fluent & Active)</option>
              <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Lightweight)</option>
            </select>
          </div>

          {/* Speed & Thinking Mode */}
          <div className="p-3 bg-white rounded-md border border-slate-200 space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Response Speed / Thinking Mode:</span>
              <InfoTooltip
                title="Thinking Budget & Speed"
                content="Turbo Instant mode sets 0 thinking tokens to deliver replies in 1-2s. Deep Analysis allows reasoning tokens for complex, sensitive reviews."
              />
            </label>
            <select
              value={rules.thinkingBudget ?? 0}
              onChange={(e) => setRules({ ...rules, thinkingBudget: Number(e.target.value) })}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={0}>Turbo Instant (1–2s, 0s Thinking Delay - Recommended)</option>
              <option value={512}>Balanced Reasoning (512 Thinking Tokens)</option>
              <option value={1024}>Deep Analysis (1024 Thinking Tokens)</option>
            </select>
          </div>
        </div>

        {/* Reply Length & Detail Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Reply Depth & Length:</span>
            <InfoTooltip
              title="Reply Output Length"
              content="Controls reply verbosity: Concise (1-2 sentences, ~350 tokens), Standard (2-3 sentences, ~600 tokens), or Detailed (3-4 sentences, ~900 tokens)."
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'concise', label: 'Concise (1–2 Sentences)', tokens: '~350 tokens' },
              { id: 'standard', label: 'Standard (2–3 Sentences)', tokens: '~600 tokens' },
              { id: 'detailed', label: 'Detailed & Warm (3–4 Sentences)', tokens: '~900 tokens' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRules({ ...rules, replyLength: opt.id as any })}
                className={`p-3 rounded-md border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  (rules.replyLength || 'detailed') === opt.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className={`w-3.5 h-3.5 shrink-0 ${
                    (rules.replyLength || 'detailed') === opt.id ? 'text-indigo-200' : 'text-slate-400'
                  }`} />
                  <span className="text-xs font-bold truncate">{opt.label}</span>
                </div>
                <span className={`text-[10px] font-mono shrink-0 ${
                  (rules.replyLength || 'detailed') === opt.id ? 'text-indigo-100' : 'text-slate-400'
                }`}>
                  {opt.tokens}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Temperature / Creativity Level */}
        <div className="p-3 bg-white rounded-md border border-slate-200 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Creativity & Variety Level (Temperature):</span>
              <InfoTooltip
                title="Temperature & Creativity"
                content="Adjust variety: 0.85 generates varied fresh phrasing, while 0.3 is strict and predictable."
              />
            </label>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {rules.temperature ?? 0.85}
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={rules.temperature ?? 0.85}
            onChange={(e) => setRules({ ...rules, temperature: parseFloat(e.target.value) })}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
