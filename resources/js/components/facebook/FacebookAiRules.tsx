import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Languages,
  Bot,
  EyeOff
} from 'lucide-react';
import { FacebookPageItem } from '../../types';

interface FacebookAiRulesProps {
  page: FacebookPageItem;
}

export const FacebookAiRules: React.FC<FacebookAiRulesProps> = ({ page }) => {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [tone, setTone] = useState('Warm & Courteous');
  const [languageMatching, setLanguageMatching] = useState(true);
  const [antiToxicityGuard, setAntiToxicityGuard] = useState(true);
  const [autoHideSpam, setAutoHideSpam] = useState(true);
  const [contactPhone, setContactPhone] = useState(page.phone || '');
  const [customInstructions, setCustomInstructions] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchRules();
  }, [page.id]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fb/pages/${page.id}/rules`);
      const data = await res.json();
      if (data.success && data.rules) {
        setAutoReplyEnabled(Boolean(data.enabled));
        setTone(data.rules.tone || 'Warm & Courteous');
        setLanguageMatching(data.rules.language_matching !== false);
        setAntiToxicityGuard(data.rules.anti_toxicity_guard !== false);
        setAutoHideSpam(data.rules.auto_hide_spam !== false);
        setContactPhone(data.rules.contact_phone || page.phone || '');
        setCustomInstructions(data.rules.custom_instructions || '');
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/fb/pages/${page.id}/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          auto_reply_enabled: autoReplyEnabled,
          tone,
          language_matching: languageMatching,
          anti_toxicity_guard: antiToxicityGuard,
          auto_hide_spam: autoHideSpam,
          contact_phone: contactPhone,
          custom_instructions: customInstructions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Facebook AI rules saved successfully!' });
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to save rules.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to save rules.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div>
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-600" />
          <span>Facebook AI Auto-Reply & Moderation Rules</span>
        </h3>
        <p className="text-xs text-slate-500">
          Configure how Gemini AI responds to customer comments and protects your page from spam.
        </p>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-xl flex items-center gap-2 text-xs font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Master AI Toggle */}
        <div className="card p-5 bg-gradient-to-r from-indigo-50/50 via-white to-blue-50/50 border border-indigo-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Automated AI Replies for Facebook Comments
              </h4>
              <p className="text-xs text-slate-500">
                When enabled, the background engine can respond automatically to incoming customer comments.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoReplyEnabled}
              onChange={(e) => setAutoReplyEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Tone & Language Preferences */}
        <div className="card p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
            AI Personality & Language Matching
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Response Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Warm & Courteous">Warm & Courteous (Friendly & polite)</option>
                <option value="Professional & Authoritative">Professional & Authoritative (Corporate)</option>
                <option value="Enthusiastic & High Energy">Enthusiastic & High Energy (Festive/Offers)</option>
                <option value="Empathetic & Helpful">Empathetic & Helpful (Guidance/Support)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Contact / Helpline (Included in queries)
              </label>
              <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-2 bg-white">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 9610447938"
                  className="w-full text-xs outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={languageMatching}
                onChange={(e) => setLanguageMatching(e.target.checked)}
                className="rounded text-indigo-600 cursor-pointer"
              />
              <span className="font-semibold">Automatic Language Detection (Hindi, Hinglish & English)</span>
            </label>
            <p className="text-[11px] text-slate-400 pl-6">
              If a student or parent writes in Hindi or Hinglish, the AI responds naturally in Hinglish ("Namaste! Aapke support ke liye dhanyawad...").
            </p>
          </div>
        </div>

        {/* Protection & Anti-Toxicity Guard */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-800">Spam & Abuse Protection</h4>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={antiToxicityGuard}
                onChange={(e) => setAntiToxicityGuard(e.target.checked)}
                className="rounded text-indigo-600 cursor-pointer"
              />
              <span className="font-semibold">Anti-Toxicity Guard</span>
            </label>
            <p className="text-[11px] text-slate-400 pl-6">
              Prevents AI from engaging with toxic, offensive, or controversial political/religious comments.
            </p>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoHideSpam}
                onChange={(e) => setAutoHideSpam(e.target.checked)}
                className="rounded text-indigo-600 cursor-pointer"
              />
              <span className="font-semibold">Auto-Hide Flagged Spam Comments</span>
            </label>
            <p className="text-[11px] text-slate-400 pl-6">
              Automatically hides abusive comments or external spam links from public view on the Facebook post.
            </p>
          </div>
        </div>

        {/* Custom Guidelines */}
        <div className="card p-5 space-y-3">
          <h4 className="text-sm font-bold text-slate-800">
            Custom Business Instructions for AI
          </h4>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={3}
            placeholder="e.g., Always highlight our dedication to NEET/JEE coaching, discipline, and student success. Mention that new batches start on Monday."
            className="w-full text-xs rounded-md border border-slate-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Rules...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save AI Rules</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
