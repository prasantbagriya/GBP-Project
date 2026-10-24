import React, { useState, useEffect, useMemo } from 'react';
import {
  Palette,
  Save,
  Copy,
  Check,
  Code,
  Globe,
  Sliders,
  Clock,
  Sparkles,
  Phone,
  Mail,
  User,
  Shield,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  Volume2,
  Bot,
  Briefcase,
  HelpCircle,
  Send
} from 'lucide-react';
import { ChatWidgetConfig } from '../../types';

export const WidgetCustomizer: React.FC = () => {
  const [widget, setWidget] = useState<ChatWidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Quick preset colors
  const presetColors = ['#4f46e5', '#2563eb', '#0d9488', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0f172a'];

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat/admin/widget/settings');
      const data = await res.json();
      if (data.success && data.widget) {
        setWidget(data.widget);
      }
    } catch (err) {
      console.error('Failed to load widget settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!widget || saving) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/chat/admin/widget/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(widget)
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const embedScriptCode = useMemo(() => {
    if (!widget) return '';
    return `<!-- GBP Live Support Chatbot -->
<script 
  src="${origin}/embed/chat.js" 
  data-widget-id="${widget.uuid}" 
  async defer>
</script>`;
  }, [origin, widget]);

  const directChatUrl = useMemo(() => {
    if (!widget) return '';
    return `${origin}/chat/preview?widget_id=${widget.uuid}`;
  }, [origin, widget]);

  if (loading || !widget) {
    return <div className="p-12 text-center text-slate-400">Loading widget customizer...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* ======================================================== */}
      {/* LEFT: SETTINGS FORM (7 Cols) */}
      {/* ======================================================== */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Widget Styling & Behavior</h3>
            <p className="text-xs text-slate-500">Configure appearance, launcher position, and lead form for external websites.</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
              saveSuccess ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {saving ? 'Saving...' : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" /> Saved!
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save Changes
              </>
            )}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Brand Color */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Brand Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={widget.brand_color}
                onChange={(e) => setWidget({ ...widget, brand_color: e.target.value })}
                className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={widget.brand_color}
                onChange={(e) => setWidget({ ...widget, brand_color: e.target.value })}
                className="w-28 p-2 border border-slate-300 rounded-xl text-xs uppercase font-mono font-medium"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {presetColors.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setWidget({ ...widget, brand_color: col })}
                    style={{ backgroundColor: col }}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      widget.brand_color.toLowerCase() === col.toLowerCase() ? 'border-slate-900 scale-110' : 'border-white'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Titles & Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Widget Title</label>
              <input
                type="text"
                value={widget.title}
                onChange={(e) => setWidget({ ...widget, title: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Bot / Assistant Name</label>
              <input
                type="text"
                value={widget.bot_name}
                onChange={(e) => setWidget({ ...widget, bot_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Header Subtitle</label>
            <input
              type="text"
              value={widget.subtitle}
              onChange={(e) => setWidget({ ...widget, subtitle: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Position */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Screen Position</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  widget.position === 'bottom-right' ? 'bg-indigo-50/70 border-indigo-500 text-indigo-900' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-semibold">Bottom Right (Standard)</span>
                <input
                  type="radio"
                  name="position"
                  checked={widget.position === 'bottom-right'}
                  onChange={() => setWidget({ ...widget, position: 'bottom-right' })}
                  className="text-indigo-600"
                />
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  widget.position === 'bottom-left' ? 'bg-indigo-50/70 border-indigo-500 text-indigo-900' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-semibold">Bottom Left</span>
                <input
                  type="radio"
                  name="position"
                  checked={widget.position === 'bottom-left'}
                  onChange={() => setWidget({ ...widget, position: 'bottom-left' })}
                  className="text-indigo-600"
                />
              </label>
            </div>
          </div>

          {/* Pre-Chat Lead Capture Form Toggle */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900">Pre-Chat Lead Capture Form</h4>
                <p className="text-[11px] text-slate-500">Require visitor to enter their contact info before starting chat</p>
              </div>
              <input
                type="checkbox"
                checked={widget.pre_chat_form_enabled}
                onChange={(e) => setWidget({ ...widget, pre_chat_form_enabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            {widget.pre_chat_form_enabled && (
              <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <User className="w-3.5 h-3.5 text-indigo-500" /> Full Name (Required)
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" /> Email (Required)
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" /> Phone (Optional)
                </span>
              </div>
            )}
          </div>

          {/* Sound & Offline Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-bold text-xs text-slate-800 block">Sound Notifications</span>
                <span className="text-[11px] text-slate-500">Play chimes on new messages</span>
              </div>
              <input
                type="checkbox"
                checked={widget.sound_enabled}
                onChange={(e) => setWidget({ ...widget, sound_enabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>

            <label className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-bold text-xs text-slate-800 block">Offline Mode</span>
                <span className="text-[11px] text-slate-500">Allow visitor tickets when away</span>
              </div>
              <input
                type="checkbox"
                checked={widget.offline_mode_enabled}
                onChange={(e) => setWidget({ ...widget, offline_mode_enabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>
          </div>
        </form>

        {/* Copy-Paste Embed Codes */}
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Code className="w-4 h-4 text-indigo-600" />
            Website Embed Snippet
          </h4>

          <div className="bg-slate-900 p-3.5 rounded-xl font-mono text-[11px] text-slate-200 relative group">
            <pre className="overflow-x-auto whitespace-pre">{embedScriptCode}</pre>
            <button
              onClick={() => copyToClipboard(embedScriptCode, 'script')}
              className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-sans font-semibold flex items-center gap-1 shadow-sm transition"
            >
              {copiedType === 'script' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedType === 'script' ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">Shareable direct chat link:</span>
            <div className="flex items-center gap-2">
              <a
                href={directChatUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
              >
                Open preview page <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => copyToClipboard(directChatUrl, 'url')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              >
                {copiedType === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT: LIVE REAL-TIME PREVIEW MOCKUP (5 Cols) */}
      {/* ======================================================== */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="w-full max-w-sm bg-slate-900 rounded-3xl p-3 border-4 border-slate-800 shadow-2xl">
          <div className="text-center text-slate-400 text-[10px] font-bold pb-2 uppercase tracking-wider">
            Live Preview Mockup
          </div>
          
          {/* Inner Widget Phone Screen */}
          <div className="h-[520px] bg-white rounded-2xl overflow-hidden flex flex-col relative border border-slate-200">
            {/* Header */}
            <div style={{ backgroundColor: widget.brand_color }} className="p-3.5 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs relative">
                  <Bot className="w-4 h-4 text-white" />
                  <span className="w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full absolute bottom-0 right-0" />
                </div>
                <div>
                  <h4 className="font-bold text-xs leading-tight">{widget.title}</h4>
                  <p className="text-[10px] opacity-80">{widget.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Chat Messages Mockup */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50 text-xs">
              <div className="flex flex-col items-start">
                <span className="text-[9px] text-slate-400 ml-1">{widget.bot_name}</span>
                <div className="bg-white border border-slate-200 text-slate-800 p-2.5 rounded-2xl rounded-bl-xs text-xs shadow-2xs">
                  Hello! Welcome to our website. How can we help you achieve your goals today?
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span style={{ borderColor: widget.brand_color, color: widget.brand_color }} className="border bg-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Briefcase className="w-2.5 h-2.5" /> Explore Services
                  </span>
                  <span style={{ borderColor: widget.brand_color, color: widget.brand_color }} className="border bg-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <HelpCircle className="w-2.5 h-2.5" /> FAQ & Pricing
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div style={{ backgroundColor: widget.brand_color }} className="text-white p-2.5 rounded-2xl rounded-br-xs text-xs shadow-2xs">
                  I'd like to talk to a team member about pricing.
                </div>
              </div>

              <div className="flex flex-col items-start">
                <span className="text-[9px] text-slate-400 ml-1">{widget.bot_name}</span>
                <div className="bg-white border border-slate-200 text-slate-800 p-2.5 rounded-2xl rounded-bl-xs text-xs shadow-2xs">
                  Connecting you with our support specialist right now!
                </div>
              </div>
            </div>

            {/* Footer Input Mockup */}
            <div className="p-2.5 bg-white border-t border-slate-200 flex gap-2 items-center shrink-0">
              <input
                type="text"
                disabled
                placeholder="Write a message..."
                className="flex-1 p-2 bg-slate-100 rounded-xl text-xs outline-none"
              />
              <div style={{ backgroundColor: widget.brand_color }} className="w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs">
                <Send className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
