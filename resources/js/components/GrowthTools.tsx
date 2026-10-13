import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Share2, 
  MessageCircle, 
  Copy, 
  Check, 
  Download, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  ThumbsUp, 
  ExternalLink,
  Save,
  RefreshCw,
  Printer,
  MapPin,
  Star,
  Link as LinkIcon,
  RotateCcw,
  Code,
  Globe
} from 'lucide-react';
import { Location, Review, StoreHour, SentimentAnalysis } from '../types';

interface GrowthToolsProps {
  location: Location;
  reviews: Review[];
  geminiEnabled?: boolean;
  onToggleAi?: () => void;
  onOpenWhatsAppReport?: () => void;
}

interface ReviewLinkResponse {
  reviewUrl: string;
  placeUrl?: string;
  writeReviewUrl?: string;
  mapsSearchUrl?: string;
  whatsappUrl: string;
  qrCodeData: string;
  placeId?: string;
  businessName: string;
  isCustom?: boolean;
}

export const GrowthTools: React.FC<GrowthToolsProps> = ({ location, reviews, geminiEnabled = true, onToggleAi, onOpenWhatsAppReport }) => {
  const [reviewLinkData, setReviewLinkData] = useState<ReviewLinkResponse | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [editableUrl, setEditableUrl] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [savingUrl, setSavingUrl] = useState<boolean>(false);
  const [urlFeedback, setUrlFeedback] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  const [downloadingQr, setDownloadingQr] = useState<boolean>(false);

  // Store hours
  const [storeHours, setStoreHours] = useState<StoreHour[]>([]);
  const [savingHours, setSavingHours] = useState<boolean>(false);
  const [hoursSavedFeedback, setHoursSavedFeedback] = useState<boolean>(false);

  // Sentiment Analysis
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [analyzingSentiment, setAnalyzingSentiment] = useState<boolean>(false);

  useEffect(() => {
    if (location?.name) {
      setReviewLinkData(null);
      setCurrentUrl('');
      setEditableUrl('');
      setStoreHours([]);

      const locKey = (location as any).v4Name || location.name;
      // 1. Immediately restore from localStorage for instant, persistent display without disappearing
      let restored = false;
      const storedKeys = [locKey, location.name, (location as any).v4Name].filter(Boolean);
      for (const k of storedKeys) {
        try {
          const raw = localStorage.getItem(`gbp_sentiment_${k}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && (parsed.hasSentiment || parsed.positiveScore > 0 || parsed.topPraises?.length > 0)) {
              setSentiment(parsed);
              restored = true;
              break;
            }
          }
        } catch {
          // ignore parsing error
        }
      }
      if (!restored) {
        setSentiment(null);
      }

      fetchReviewLink();
      fetchHours();
      // 2. Fetch server-cached sentiment (ONLY reads cache, NEVER triggers auto-generation)
      fetchCachedSentiment(locKey);
    }
  }, [location?.name, (location as any)?.v4Name, location?.title]);

  const fetchCachedSentiment = async (locKey?: string) => {
    const key = locKey || (location as any).v4Name || location.name;
    try {
      const res = await fetch(`/api/reviews/ai-sentiment?locationName=${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.hasSentiment && (data.positiveScore > 0 || data.neutralScore > 0 || data.negativeScore > 0 || data.topPraises?.length > 0)) {
          setSentiment(data);
          try {
            localStorage.setItem(`gbp_sentiment_${key}`, JSON.stringify(data));
            if (location.name) localStorage.setItem(`gbp_sentiment_${location.name}`, JSON.stringify(data));
          } catch {
            // ignore localStorage quota error
          }
        } else {
          // Only clear if localStorage also didn't have anything
          const stored = localStorage.getItem(`gbp_sentiment_${key}`);
          if (!stored) {
            setSentiment(null);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching cached sentiment:', e);
    }
  };

  const fetchReviewLink = async () => {
    const locParam = (location as any).v4Name || location.name;
    try {
      const res = await fetch(`/api/gbp/review-link?locationName=${encodeURIComponent(locParam)}&businessName=${encodeURIComponent(location.title)}`);
      const data: ReviewLinkResponse = await res.json();
      setReviewLinkData(data);
      const active = data.reviewUrl || data.placeUrl || data.writeReviewUrl || '';
      setCurrentUrl(active);
      setEditableUrl(active);
      setIsCustomMode(!!data.isCustom);
    } catch (e) {
      console.error('Error fetching review link:', e);
    }
  };

  const saveReviewUrl = async (urlToSave: string, isReset: boolean = false) => {
    setSavingUrl(true);
    setUrlFeedback(null);
    const locParam = (location as any).v4Name || location.name;
    try {
      const res = await fetch('/api/gbp/review-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: locParam,
          businessName: location.title,
          customReviewUrl: isReset ? 'reset' : urlToSave,
          reset: isReset
        })
      });
      const data: ReviewLinkResponse = await res.json();
      setReviewLinkData(data);
      const active = data.reviewUrl || '';
      setCurrentUrl(active);
      setEditableUrl(active);
      setIsCustomMode(!!data.isCustom);
      setUrlFeedback(isReset ? 'Reset to default Google link!' : 'Review URL saved successfully!');
      setTimeout(() => setUrlFeedback(null), 3000);
    } catch (e) {
      console.error(e);
      alert('Failed to save review link');
    } finally {
      setSavingUrl(false);
    }
  };

  const handleSelectLinkFormat = (type: 'place' | 'write' | 'search') => {
    if (!reviewLinkData) return;
    let selected = '';
    if (type === 'place') {
      selected = reviewLinkData.placeUrl || currentUrl;
    } else if (type === 'write') {
      selected = reviewLinkData.writeReviewUrl || currentUrl;
    } else if (type === 'search') {
      selected = reviewLinkData.mapsSearchUrl || currentUrl;
    }
    setEditableUrl(selected);
    saveReviewUrl(selected);
  };

  const fetchHours = async () => {
    const locParam = (location as any).v4Name || location.name;
    try {
      const res = await fetch(`/api/gbp/hours?locationName=${encodeURIComponent(locParam)}`);
      const data = await res.json();
      setStoreHours(data.hours || []);
    } catch (e) {
      console.error(e);
    }
  };

  const runSentimentAnalysis = async (forceRefresh: boolean = true) => {
    setAnalyzingSentiment(true);
    const locParam = (location as any).v4Name || location.name;
    try {
      const res = await fetch('/api/reviews/ai-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews,
          locationName: locParam,
          refresh: forceRefresh,
        }),
      });
      const data = await res.json();
      if (data && (data.hasSentiment || data.positiveScore > 0 || data.topPraises?.length > 0)) {
        setSentiment(data);
        try {
          localStorage.setItem(`gbp_sentiment_${locParam}`, JSON.stringify(data));
          if (location.name) localStorage.setItem(`gbp_sentiment_${location.name}`, JSON.stringify(data));
          if ((location as any).v4Name) localStorage.setItem(`gbp_sentiment_${(location as any).v4Name}`, JSON.stringify(data));
        } catch {
          // ignore localStorage quota error
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error analyzing sentiment');
    } finally {
      setAnalyzingSentiment(false);
    }
  };

  const handleCopyLink = () => {
    if (currentUrl) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getWhatsAppMessageText = () => {
    return `Hello! Thank you so much for visiting ${location.title} 🙏\n\nHow was your experience with our services? Please take a minute to share your 5-star review on Google:\n${currentUrl}\n\nYour valuable feedback means the world to our team!`;
  };

  const handleCopyWhatsAppMessage = () => {
    navigator.clipboard.writeText(getWhatsAppMessageText());
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleDownloadQr = async () => {
    if (!currentUrl) return;
    setDownloadingQr(true);
    try {
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=15&format=png&data=${encodeURIComponent(currentUrl)}`;
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanName = location.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `Google_Review_QR_${cleanName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // Fallback open in new window
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=15&format=png&data=${encodeURIComponent(currentUrl)}`, '_blank');
    } finally {
      setDownloadingQr(false);
    }
  };

  const handlePrintStand = () => {
    window.print();
  };

  const handleSaveHours = async () => {
    setSavingHours(true);
    try {
      const res = await fetch('/api/gbp/hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationName: location.name, hours: storeHours })
      });
      const data = await res.json();
      if (data.success) {
        setHoursSavedFeedback(true);
        setTimeout(() => setHoursSavedFeedback(false), 2500);
      } else {
        alert(data.error || 'Failed to save hours to Google');
      }
    } catch (e) {
      alert('Failed to save hours to Google');
    } finally {
      setSavingHours(false);
    }
  };

  const updateHour = (index: number, field: keyof StoreHour, val: any) => {
    setStoreHours(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const qrImageUrl = currentUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=12&data=${encodeURIComponent(currentUrl)}`
    : '';

  const whatsappDirectUrl = `https://wa.me/?text=${encodeURIComponent(getWhatsAppMessageText())}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Customer Growth & Profile Tools
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Collect more 5-star Google reviews with printable QR stands, WhatsApp invites, and Gemini AI sentiment insights.
          </p>
        </div>
      </div>

      {/* Row 1: Real Scannable In-Store QR Stand & WhatsApp Requester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Printable QR Code Stand Card */}
        <div className="card p-5 sm:p-6 flex flex-col space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md inline-block">
                In-Store Review Stand
              </span>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base mt-1">
                Google Review QR Code Stand
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real, scannable QR code. Place on billing desks, reception, or receipts.
              </p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-md border border-blue-100 shadow-2xs flex-shrink-0">
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Realistic Printable Acrylic Stand Preview (100% Scannable QR Code) */}
          <div 
            id="printable-review-stand"
            className="p-5 sm:p-6 bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-xl shadow-xl flex flex-col items-center text-center space-y-4 border border-slate-800 relative overflow-hidden max-w-[340px] mx-auto w-full"
          >
            {/* Top decorative badge */}
            <div className="flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>★ Leave Us a 5-Star Review ★</span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>

            {/* Business Title */}
            <div className="space-y-1 max-w-[280px]">
              <h4 className="font-extrabold text-base sm:text-lg text-white leading-tight drop-shadow-sm">
                {location.title}
              </h4>
              <p className="text-[11px] text-slate-300">
                Google Business Profile
              </p>
            </div>

            {/* Real Camera-Scannable QR Code Image */}
            <div className="p-3 bg-white rounded-lg shadow-2xl border-4 border-amber-400/80 flex flex-col items-center justify-center relative group">
              {qrImageUrl ? (
                <img 
                  src={qrImageUrl} 
                  alt="Scannable Google Review QR Code" 
                  className="w-40 h-40 object-contain rounded-sm block"
                  loading="eager"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
              
              {/* Center Google 'G' & Star Badge */}
              <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded shadow-2xs">
                <span className="text-blue-600 font-extrabold">G</span>
                <span>Google Reviews</span>
                <span className="text-amber-500 font-extrabold">★★★★★</span>
              </div>
            </div>

            {/* Scan Instructions */}
            <div className="space-y-1 max-w-[300px]">
              <p className="text-xs font-semibold text-amber-300">
                📱 Scan with phone camera to open review page
              </p>
              <p className="text-[10px] text-slate-300">
                Leave your 5-star rating on Google in under a minute
              </p>
            </div>

            {/* Stand Footer */}
            <div className="pt-2 border-t border-slate-800/80 w-full text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <span>🙏 Thank you for your valuable support! 🙏</span>
            </div>
          </div>

          {/* Stand Actions (Download PNG, Print Stand) */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button 
              onClick={handleDownloadQr}
              disabled={downloadingQr || !currentUrl}
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
              title="Download high-resolution QR Code PNG"
            >
              <Download className={`w-3.5 h-3.5 ${downloadingQr ? 'animate-bounce' : ''}`} />
              <span>{downloadingQr ? 'Downloading...' : 'Download QR PNG'}</span>
            </button>

            <button 
              onClick={handlePrintStand}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
              title="Print Table Tent / Counter Stand"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Stand</span>
            </button>
          </div>
        </div>

        {/* Right Column: WhatsApp Review Requester & Review URL Settings */}
        <div className="flex flex-col gap-6">
          
          {/* WhatsApp Review Requester Card (Proper Fixed Compact Size) */}
          <div className="card p-5 flex flex-col space-y-3.5 border border-emerald-200/80 bg-gradient-to-br from-emerald-50/20 via-white to-white shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md inline-block">
                  WhatsApp Automation
                </span>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base mt-1">
                  WhatsApp Review Requester
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  Send pre-composed polite review requests to recent guests in 1 click.
                </p>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md flex-shrink-0 border border-emerald-100 shadow-2xs">
                <MessageCircle className="w-5 h-5" />
              </div>
            </div>

            {/* WhatsApp Message Preview Box - Compact Chat Bubble */}
            <div className="p-3 bg-emerald-50/50 border border-emerald-200/70 rounded-md space-y-2 text-xs">
              <div className="flex items-center justify-between text-emerald-800 font-bold text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>WhatsApp Message Template</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyWhatsAppMessage}
                  className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-semibold text-[10px] bg-white border border-emerald-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors shadow-2xs"
                >
                  {copiedMessage ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedMessage ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              <div className="bg-white p-2.5 rounded-md shadow-2xs border border-emerald-100 text-slate-700 space-y-1.5 leading-relaxed font-sans text-xs">
                <p>
                  Hello! Thank you so much for choosing <strong className="text-slate-900">{location.title}</strong> 🙏
                </p>
                <p className="text-[11px] text-slate-500">
                  How was your experience with us? Please take 1 minute to leave us your 5-star review on Google:
                </p>
                <p className="font-mono text-blue-600 text-[10px] break-all bg-blue-50/50 p-1.5 rounded-md border border-blue-100">
                  {currentUrl || '(Google Review URL)'}
                </p>
                <p className="text-slate-400 text-[10px]">
                  Your feedback is invaluable to our entire team!
                </p>
              </div>
            </div>

            {/* WhatsApp Action Buttons in Single / Responsive Line */}
            <div className="space-y-2 pt-0.5">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <a 
                  href={whatsappDirectUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full sm:flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                  <span>Open in WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyWhatsAppMessage}
                  className="w-full sm:w-auto py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Message</span>
                </button>
              </div>

              {onOpenWhatsAppReport && (
                <button
                  type="button"
                  onClick={onOpenWhatsAppReport}
                  className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>📊 Open Multi-Profile WhatsApp Report →</span>
                </button>
              )}
            </div>
          </div>

          {/* URL Configuration & Correction Card */}
          <div className="card p-5 bg-white border border-slate-200 rounded-lg space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                Review URL Settings
              </label>

              {reviewLinkData?.isCustom && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-md">
                  Custom URL Active
                </span>
              )}
            </div>

            {/* Quick format selector buttons */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500">
                Quick Link Options:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectLinkFormat('place')}
                  disabled={!reviewLinkData?.placeUrl}
                  className={`px-2 py-1.5 rounded-md text-[11px] font-semibold border text-left transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    currentUrl === reviewLinkData?.placeUrl
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title={reviewLinkData?.placeUrl || ''}
                >
                  <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                  <span className="truncate">Maps Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLinkFormat('write')}
                  disabled={!reviewLinkData?.writeReviewUrl}
                  className={`px-2 py-1.5 rounded-md text-[11px] font-semibold border text-left transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    currentUrl === reviewLinkData?.writeReviewUrl
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title={reviewLinkData?.writeReviewUrl || ''}
                >
                  <Star className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  <span className="truncate">Direct Review</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectLinkFormat('search')}
                  disabled={!reviewLinkData?.mapsSearchUrl}
                  className={`px-2 py-1.5 rounded-md text-[11px] font-semibold border text-left transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    currentUrl === reviewLinkData?.mapsSearchUrl
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title={reviewLinkData?.mapsSearchUrl || ''}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="truncate">Search Link</span>
                </button>
              </div>
            </div>

            {/* Editable Input Box for Link */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={editableUrl}
                  onChange={(e) => setEditableUrl(e.target.value)}
                  placeholder="Paste official Google Maps or g.page review link..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                />

                <button 
                  type="button"
                  onClick={() => saveReviewUrl(editableUrl)}
                  disabled={savingUrl || !editableUrl || editableUrl === currentUrl}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-bold flex items-center gap-1 flex-shrink-0 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                  title="Save this review link"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingUrl ? '...' : 'Save'}</span>
                </button>
              </div>

              {/* Reset to Google Default Button */}
              {reviewLinkData?.isCustom && (
                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={() => saveReviewUrl('', true)}
                    disabled={savingUrl}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Google default</span>
                  </button>
                </div>
              )}
            </div>

            {/* Feedback message */}
            {urlFeedback && (
              <div className="p-2 bg-emerald-50 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{urlFeedback}</span>
              </div>
            )}

            {/* Link Utility Action Row (Copy, Test Link) */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-slate-200">
              <button 
                type="button"
                onClick={handleCopyLink}
                disabled={!currentUrl}
                className="w-full sm:flex-1 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <a 
                href={currentUrl || '#'} 
                target="_blank" 
                rel="noreferrer"
                className={`w-full sm:flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-center rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs ${!currentUrl ? 'pointer-events-none opacity-50' : ''}`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Review Page</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Gemini AI Sentiment Breakdown */}
      <div className="card p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-base">
                Gemini AI Customer Sentiment & Insights
              </h3>
              <button
                type="button"
                onClick={onToggleAi}
                className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                  geminiEnabled ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
                title={geminiEnabled ? "AI is active (Click to toggle)" : "AI is disabled (Click to enable)"}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${geminiEnabled ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'}`} />
                {geminiEnabled ? 'Gemini AI Active' : 'AI Disabled (Click to Enable)'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time analysis of what customers love and areas needing operational attention.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {sentiment && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1 shadow-2xs">
                💾 Saved Analysis
              </span>
            )}
            <button 
              onClick={() => runSentimentAnalysis(true)}
              disabled={analyzingSentiment}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 self-start transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              title="Regenerate sentiment analysis from latest customer reviews"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzingSentiment ? 'animate-spin' : ''}`} />
              {analyzingSentiment ? 'Analyzing...' : (sentiment ? 'Re-Analyze (Regenerate)' : 'Generate Analysis')}
            </button>
          </div>
        </div>

        {sentiment ? (
          <div className="space-y-6">
            {/* Visual Sentiment Distribution Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-700 flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" /> 
                  Positive ({sentiment.positiveScore}%)
                </span>
                <span className="text-slate-500">
                  Neutral ({sentiment.neutralScore}%)
                </span>
                <span className="text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> 
                  Critical ({sentiment.negativeScore}%)
                </span>
              </div>

              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-700"
                  style={{ width: `${sentiment.positiveScore}%` }}
                />
                <div 
                  className="bg-slate-300 h-full transition-all duration-700"
                  style={{ width: `${sentiment.neutralScore}%` }}
                />
                <div 
                  className="bg-red-500 h-full transition-all duration-700"
                  style={{ width: `${sentiment.negativeScore}%` }}
                />
              </div>
            </div>

            {/* Praise vs Complaints Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50/40 border border-emerald-200/70 rounded-xl space-y-2">
                <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                  Top Customer Praises
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {sentiment.topPraises && sentiment.topPraises.length > 0 ? (
                    sentiment.topPraises.map((praise: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{praise}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400 italic">No specific praises found</li>
                  )}
                </ul>
              </div>

              <div className="p-4 bg-amber-50/40 border border-amber-200/70 rounded-xl space-y-2">
                <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Key Areas for Improvement
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {sentiment.topComplaints && sentiment.topComplaints.length > 0 ? (
                    sentiment.topComplaints.map((comp: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{comp}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400 italic">No significant complaints logged</li>
                  )}
                </ul>
              </div>
            </div>

            {/* AI Actionable Recommendation */}
            {sentiment.actionRecommendation && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-blue-900 block mb-0.5">
                    Gemini Operational Recommendation:
                  </span>
                  <p className="text-blue-800 leading-relaxed font-medium">
                    {sentiment.actionRecommendation}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : analyzingSentiment ? (
          <div className="py-8 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-xs">
              Analyzing reviews with AI...
            </p>
          </div>
        ) : (
          <div className="py-8 px-4 text-center space-y-3 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                AI Sentiment Analysis Not Generated Yet
              </h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                Auto-generation is disabled to prevent repeated API calls. Click below to analyze and save reviews sentiment:
              </p>
            </div>
            <button
              onClick={() => runSentimentAnalysis(true)}
              disabled={analyzingSentiment || (!reviews || reviews.length === 0)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Sentiment Analysis</span>
            </button>
          </div>
        )}
      </div>

      {/* Row 3: Store Operating Hours & Timings */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              Business Hours Management
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Keep your Google Maps opening and closing hours updated for customers.
            </p>
          </div>

          <button 
            onClick={handleSaveHours}
            disabled={savingHours}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-bold flex items-center gap-1.5 self-start shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            {savingHours ? 'Saving...' : 'Save Hours to Google'}
          </button>
        </div>

        {hoursSavedFeedback && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            Store hours updated successfully on Google Profile!
          </div>
        )}

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {storeHours.map((h, idx) => (
            <div key={h.day} className="py-3 flex items-center justify-between gap-4 text-xs min-w-[340px]">
              <span className="font-semibold text-slate-800 w-28">{h.day}</span>
              
              <div className="flex items-center gap-2 flex-1">
                <input 
                  type="time" 
                  value={h.open} 
                  disabled={h.closed}
                  onChange={(e) => updateHour(idx, 'open', e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-mono disabled:opacity-40"
                />
                <span className="text-slate-400 font-bold">to</span>
                <input 
                  type="time" 
                  value={h.close} 
                  disabled={h.closed}
                  onChange={(e) => updateHour(idx, 'close', e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-mono disabled:opacity-40"
                />
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={h.closed} 
                  onChange={(e) => updateHour(idx, 'closed', e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-slate-500 font-medium">Closed</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
