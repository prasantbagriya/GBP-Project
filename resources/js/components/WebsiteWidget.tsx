import React, { useState, useMemo } from 'react';
import { 
  Code, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  Sparkles, 
  Star,
  Layout, 
  Palette, 
  SlidersHorizontal, 
  CheckCircle2, 
  Globe, 
  Layers, 
  HelpCircle,
  RefreshCw,
  Building2
} from 'lucide-react';
import { Location, Review } from '../types';

interface WebsiteWidgetProps {
  locations: Location[];
  activeLocation: Location | null;
  onSelectLocation: (locName: string) => void;
}

export const WebsiteWidget: React.FC<WebsiteWidgetProps> = ({
  locations,
  activeLocation,
  onSelectLocation
}) => {
  const [layout, setLayout] = useState<'carousel' | 'grid' | 'badge'>('carousel');
  const [theme, setTheme] = useState<'light' | 'dark' | 'glass'>('light');
  const [minRating, setMinRating] = useState<number>(4);
  const [widgetHeight, setWidgetHeight] = useState<string>('360');
  const [hideHeader, setHideHeader] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('Google Reviews');
  const [subtitle, setSubtitle] = useState<string>('Feedback from our students and Parents');
  const [copiedCodeType, setCopiedCodeType] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'script' | 'iframe' | 'api'>('script');
  const [previewKey, setPreviewKey] = useState<number>(Date.now());

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const selectedLocParam = activeLocation 
    ? (activeLocation.v4Name || activeLocation.name) 
    : (locations[0]?.v4Name || locations[0]?.name || '');

  const widgetUrl = useMemo(() => {
    const params = new URLSearchParams({
      locationName: selectedLocParam,
      theme,
      layout,
      minRating: minRating.toString(),
      hideHeader: hideHeader.toString(),
      title,
      subtitle
    });
    return `${origin}/widget/preview?${params.toString()}`;
  }, [origin, selectedLocParam, theme, layout, minRating, hideHeader, title, subtitle]);

  const scriptCode = useMemo(() => {
    const effectiveHeight = layout === 'badge' ? (parseInt(widgetHeight, 10) > 260 ? '220' : widgetHeight) : widgetHeight;
    return `<!-- Google Reviews Live Widget -->
<div id="google-reviews-widget" 
     data-location="${selectedLocParam}" 
     data-theme="${theme}" 
     data-layout="${layout}" 
     data-height="${effectiveHeight}px" 
     data-min-rating="${minRating}" 
     data-title="${title}"
     data-subtitle="${subtitle}"
     data-hide-header="${hideHeader}"></div>
<script src="${origin}/embed/reviews.js" async defer></script>`;
  }, [origin, selectedLocParam, theme, layout, widgetHeight, minRating, hideHeader, title, subtitle]);

  const iframeCode = useMemo(() => {
    const effectiveHeight = layout === 'badge' ? (parseInt(widgetHeight, 10) > 260 ? '220' : widgetHeight) : widgetHeight;
    return `<iframe src="${widgetUrl}" width="100%" height="${effectiveHeight}" frameborder="0" style="border:none; border-radius:12px; width:100%; height:${effectiveHeight}px; max-height:${effectiveHeight}px; overflow:hidden;" loading="lazy" title="Google Reviews"></iframe>`;
  }, [widgetUrl, layout, widgetHeight]);

  const apiEndpointUrl = `${origin}/api/widget/reviews?locationName=${encodeURIComponent(selectedLocParam)}&minRating=${minRating}`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeType(type);
    setTimeout(() => setCopiedCodeType(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/20 rounded-lg text-white">
              <Globe className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              Website Google Reviews Widget
            </h2>
            <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase">
              Auto-Sync
            </span>
          </div>
          <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
            Embed real-time Google Reviews on your official website. New reviews sync automatically directly from your Google Business Profile.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={widgetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-white/20"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Test Fullscreen</span>
          </a>
        </div>
      </div>

      {/* Profile Selector Banner */}
      <div className="card p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Selected Google Profile
            </span>
            <span className="text-sm font-bold text-slate-800">
              {activeLocation?.title || 'Default Location'}
            </span>
          </div>
        </div>

        {locations.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">
              Switch Profile:
            </label>
            <select
              value={selectedLocParam}
              onChange={(e) => onSelectLocation(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
            >
              {locations.map((loc) => {
                const val = loc.v4Name || loc.name;
                return (
                  <option key={val} value={val}>
                    {loc.title} {loc.storeCode ? `(${loc.storeCode})` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Main Grid: Customizer (Left) + Code & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Customization Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                Widget Customizer
              </h3>
              <button 
                onClick={() => setPreviewKey(Date.now())}
                className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                title="Refresh preview"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Layout Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Layout Style:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'carousel', label: 'Carousel', desc: 'Slider' },
                  { id: 'grid', label: 'Grid', desc: 'Cards' },
                  { id: 'badge', label: 'Badge', desc: 'Compact' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const newL = item.id as any;
                      setLayout(newL);
                      if (newL === 'badge') setWidgetHeight('220');
                      else if (newL === 'carousel') setWidgetHeight('360');
                      else if (newL === 'grid') setWidgetHeight('440');
                      setPreviewKey(Date.now());
                    }}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      layout === item.id 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-2xs' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-bold">{item.label}</span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Widget Height Control */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Fixed Widget Height:
                </label>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded font-mono">
                  {layout === 'badge' ? (parseInt(widgetHeight, 10) > 260 ? '220px' : `${widgetHeight}px`) : `${widgetHeight}px`}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { val: '320', label: 'Compact', desc: '320px' },
                  { val: '360', label: 'Standard', desc: '360px' },
                  { val: '440', label: 'Spacious', desc: '440px' },
                ].map(hOpt => (
                  <button
                    key={hOpt.val}
                    type="button"
                    onClick={() => { setWidgetHeight(hOpt.val); setPreviewKey(Date.now()); }}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                      widgetHeight === hOpt.val
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-bold">{hOpt.label}</span>
                    <span className="text-[10px] text-slate-400">{hOpt.desc}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">
                Keeps reviews at a fixed, clean height on your website without expanding or shifting layout.
              </p>
            </div>

            {/* Theme Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Theme Color:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setTheme('light'); setPreviewKey(Date.now()); }}
                  className={`p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    theme === 'light'
                      ? 'bg-slate-100 border-slate-400 text-slate-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-white border border-slate-400 inline-block" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setTheme('dark'); setPreviewKey(Date.now()); }}
                  className={`p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700 inline-block" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Minimum Star Rating Filter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Rating Filter:
                </label>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                  {minRating}★ & Above
                </span>
              </div>
              <select
                value={minRating}
                onChange={(e) => { setMinRating(parseInt(e.target.value)); setPreviewKey(Date.now()); }}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-700 outline-none cursor-pointer"
              >
                <option value={4}>
                  ⭐ 4★ & 5★ Only (Recommended)
                </option>
                <option value={5}>
                  🌟 5★ Only (Top Praise)
                </option>
                <option value={1}>
                  All Reviews (1★ to 5★)
                </option>
              </select>
              <p className="text-[10px] text-slate-400">
                Filters out low ratings so only positive customer reviews show on your site.
              </p>
            </div>

            {/* Header Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-slate-700">
                  Show Google Rating Header
                </span>
                <input
                  type="checkbox"
                  checked={!hideHeader}
                  onChange={(e) => { setHideHeader(!e.target.checked); setPreviewKey(Date.now()); }}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-1">
                Displays average rating score, total count & write review button.
              </p>
            </div>

            {/* Custom Header Title & Subtitle */}
            {!hideHeader && (
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Widget Main Title:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setPreviewKey(Date.now()); }}
                    placeholder="Google Reviews"
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Widget Subtitle:
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => { setSubtitle(e.target.value); setPreviewKey(Date.now()); }}
                    placeholder="Feedback from our students and Parents"
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Default: Feedback from our students and Parents
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick CMS Setup Guide */}
          <div className="card p-5 space-y-3 bg-slate-50 border-slate-200">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              How to Add to Your Website
            </h4>
            <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
              <div className="p-2 bg-white rounded border border-slate-200">
                <strong className="text-slate-800 font-bold block mb-0.5">WordPress (Elementor / Gutenberg):</strong>
                <span>Add a "Custom HTML" block in Elementor or Gutenberg and paste the script code.</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <strong className="text-slate-800 font-bold block mb-0.5">Custom HTML / PHP:</strong>
                <span>Paste the &lt;div&gt; where you want reviews to appear and the &lt;script&gt; before &lt;/body&gt;.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Code Snippets & Live Preview (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Copy-Paste Code Card */}
          <div className="card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-blue-600" />
                  Copy Embed Code for Website
                </h3>
                <p className="text-slate-400 text-xs">
                  Copy and paste into your webpage source code:
                </p>
              </div>

              {/* Code Tab Switcher */}
              <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('script')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeCodeTab === 'script' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  &lt;script&gt; Embed
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('iframe')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeCodeTab === 'iframe' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  &lt;iframe&gt; Embed
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('api')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeCodeTab === 'api' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  JSON API
                </button>
              </div>
            </div>

            {/* Script Code Block */}
            {activeCodeTab === 'script' && (
              <div className="space-y-2">
                <div className="relative">
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                    <code>{scriptCode}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(scriptCode, 'script')}
                    className="absolute top-3 right-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  >
                    {copiedCodeType === 'script' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodeType === 'script' ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  ✓ Responsive embed automatically auto-resizes to fit mobile & desktop screens without scrollbars.
                </p>
              </div>
            )}

            {/* Iframe Code Block */}
            {activeCodeTab === 'iframe' && (
              <div className="space-y-2">
                <div className="relative">
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                    <code>{iframeCode}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(iframeCode, 'iframe')}
                    className="absolute top-3 right-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  >
                    {copiedCodeType === 'iframe' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodeType === 'iframe' ? 'Copied!' : 'Copy Iframe'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  ✓ Standalone iframe compatible with WordPress, Wix, Squarespace, and custom HTML.
                </p>
              </div>
            )}

            {/* JSON API Endpoint Block */}
            {activeCodeTab === 'api' && (
              <div className="space-y-2">
                <div className="relative">
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                    <code>{`GET ${apiEndpointUrl}`}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(apiEndpointUrl, 'api')}
                    className="absolute top-3 right-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  >
                    {copiedCodeType === 'api' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodeType === 'api' ? 'Copied!' : 'Copy API URL'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  ✓ Returns clean JSON with reviews, star ratings, and profile stats for headless web apps.
                </p>
              </div>
            )}
          </div>

          {/* Live Interactive Widget Preview */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  Live Interactive Preview
                </h3>
                <p className="text-slate-400 text-xs">
                  Real-time look of the reviews on your website:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewKey(Date.now())}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>

                <a
                  href={widgetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>New Tab</span>
                </a>
              </div>
            </div>

            {/* Container for Preview Iframe */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner">
              <iframe
                key={previewKey}
                src={widgetUrl}
                title="Google Reviews Live Widget Preview"
                className="w-full border-none transition-all duration-300 block"
                style={{ 
                  height: `${layout === 'badge' ? (parseInt(widgetHeight, 10) > 260 ? 220 : parseInt(widgetHeight, 10)) : parseInt(widgetHeight, 10)}px`,
                  maxHeight: `${layout === 'badge' ? 260 : parseInt(widgetHeight, 10)}px`
                }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
