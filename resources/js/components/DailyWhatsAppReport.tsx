import React, { useState, useEffect, useMemo } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  MessageSquare, 
  Building2, 
  Clock, 
  Sparkles, 
  CheckSquare, 
  Square, 
  Download, 
  Filter, 
  Settings2, 
  Send,
  AlertCircle,
  Plus,
  Phone,
  X,
  Minus
} from 'lucide-react';
import { ProfileReportItem, MultiProfileReportData } from '../types';

interface DailyWhatsAppReportProps {
  userEmail?: string | null;
  onSelectLocation?: (locationName: string) => void;
}

export const DailyWhatsAppReport: React.FC<DailyWhatsAppReportProps> = ({
  userEmail,
  onSelectLocation
}) => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<MultiProfileReportData | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [targetPhone, setTargetPhone] = useState('+91 9610447938');
  const [savedPhoneNumbers, setSavedPhoneNumbers] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('gbp_whatsapp_saved_phones');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaults = ['+91 9610447938', '+91 9024031003'];
          return Array.from(new Set([...defaults, ...parsed]));
        }
      }
    } catch {}
    return ['+91 9610447938', '+91 9024031003'];
  });
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [showAddPhone, setShowAddPhone] = useState(false);

  // Custom formatting options
  const [includeComparison, setIncludeComparison] = useState(true);
  const [includeRatings, setIncludeRatings] = useState(true);
  const [includePending, setIncludePending] = useState(false);
  const [includeReviewLinks, setIncludeReviewLinks] = useState(false);
  const [includeSummaryFooter, setIncludeSummaryFooter] = useState(true);
  const [showNetDifference, setShowNetDifference] = useState(false);
  const [boldProfileNames, setBoldProfileNames] = useState(true);

  // Baseline edit state
  const [editingBaselineId, setEditingBaselineId] = useState<string | null>(null);
  const [baselineInput, setBaselineInput] = useState<number>(0);
  const [savingBaseline, setSavingBaseline] = useState(false);

  useEffect(() => {
    fetchReportData(false);
  }, []);

  const fetchReportData = async (forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gbp/multi-profile-report${forceRefresh ? '?refresh=true' : ''}`);
      if (res.ok) {
        const data: MultiProfileReportData = await res.json();
        setReportData(data);
        if (data.locations) {
          setSelectedIds(data.locations.map(l => l.id));
        }
      }
    } catch (e) {
      console.error('Failed to fetch multi-profile report:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (!reportData?.locations) return;
    if (selectedIds.length === reportData.locations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reportData.locations.map(l => l.id));
    }
  };

  const toggleSelectProfile = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Filtered locations included in the report
  const activeProfiles = useMemo(() => {
    if (!reportData?.locations) return [];
    return reportData.locations.filter(l => selectedIds.includes(l.id));
  }, [reportData, selectedIds]);

  // Aggregate stats for selected profiles
  const selectedStats = useMemo(() => {
    const totalReviews = activeProfiles.reduce((acc, p) => acc + p.totalReviews, 0);
    const todayNew = activeProfiles.reduce((acc, p) => acc + p.todayNewReviews, 0);
    const totalPending = activeProfiles.reduce((acc, p) => acc + p.pendingCount, 0);
    const totalDiff = activeProfiles.reduce((acc, p) => acc + p.difference, 0);
    const avgRating = activeProfiles.length > 0 
      ? (activeProfiles.reduce((acc, p) => acc + p.averageRating, 0) / activeProfiles.length).toFixed(1)
      : '0.0';

    return {
      profilesCount: activeProfiles.length,
      totalReviews,
      todayNew,
      totalPending,
      totalDiff,
      avgRating
    };
  }, [activeProfiles]);

  // Generate WhatsApp formatted message text
  const generatedMessage = useMemo(() => {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let lines: string[] = [];

    // Clean, professional header without emojis
    const titleHeader = '*Daily Google Business Profile Report*';
    lines.push(titleHeader);
    lines.push(`Date: ${dateFormatted} | Time: ${timeFormatted}`);
    lines.push('------------------------------------');
    lines.push('');

    if (activeProfiles.length === 0) {
      lines.push('_(No profiles selected)_');
    }

    activeProfiles.forEach((p, idx) => {
      // 📍 1. Prince NDA Academy - NDA (UPSC + SSB)
      // New Reviews Today: 3 
      // Average Rating: 4.6 
      // Today: 420 ➔  423
      const profileTitle = boldProfileNames ? `*${p.title}*` : p.title;
      lines.push(`📍 ${idx + 1}. ${profileTitle}`);
      lines.push(`New Reviews Today: ${p.todayNewReviews}`);

      if (includeRatings) {
        lines.push(`Average Rating: ${p.averageRating}`);
      }

      if (includeComparison) {
        const diffText = showNetDifference && p.difference !== 0
          ? ` (${p.difference > 0 ? `+${p.difference}` : p.difference})`
          : '';
        lines.push(`Today: ${p.beforeTodayReviews} ➔  ${p.totalReviews}${diffText}`);
      }

      if (includePending && p.pendingCount !== undefined && p.pendingCount > 0) {
        lines.push(`Pending Replies: ${p.pendingCount}`);
      }

      if (includeReviewLinks && p.reviewLink) {
        lines.push(`Review Link: ${p.reviewLink}`);
      }

      lines.push('');
    });

    if (includeSummaryFooter && activeProfiles.length > 0) {
      lines.push('------------------------------------');
      lines.push('*Overall Summary:*');
      lines.push(`Total Profiles: ${selectedStats.profilesCount}`);
      lines.push(`New Reviews Today: +${selectedStats.todayNew}`);
      lines.push(`Combined Total Reviews: ${selectedStats.totalReviews}`);
      lines.push(`Average Rating: ${selectedStats.avgRating}`);
      if (includePending && selectedStats.totalPending > 0) {
        lines.push(`Total Pending Replies: ${selectedStats.totalPending}`);
      }
      lines.push('');
    }

    if (customNote.trim()) {
      lines.push(`*Note:* ${customNote.trim()}`);
      lines.push('');
    }

    return lines.join('\n');
  }, [
    reportData,
    activeProfiles,
    includeComparison,
    includeRatings,
    includePending,
    includeReviewLinks,
    includeSummaryFooter,
    showNetDifference,
    boldProfileNames,
    selectedStats,
    customNote
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddPhoneNumber = (phoneCandidate?: string) => {
    const phone = (phoneCandidate || newPhoneInput).trim();
    if (!phone) return;
    
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 8) {
      alert('Please enter a valid phone number with country code (e.g. +91 9610447938)');
      return;
    }

    if (!savedPhoneNumbers.includes(phone)) {
      const updated = [...savedPhoneNumbers, phone];
      setSavedPhoneNumbers(updated);
      try {
        localStorage.setItem('gbp_whatsapp_saved_phones', JSON.stringify(updated));
      } catch {}
    }
    setTargetPhone(phone);
    setNewPhoneInput('');
    setShowAddPhone(false);
  };

  const handleRemovePhoneNumber = (phoneToRemove: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = savedPhoneNumbers.filter(p => p !== phoneToRemove);
    setSavedPhoneNumbers(updated);
    try {
      localStorage.setItem('gbp_whatsapp_saved_phones', JSON.stringify(updated));
    } catch {}
    if (targetPhone === phoneToRemove) {
      setTargetPhone(updated[0] || '');
    }
  };

  const handleOpenWhatsApp = (phoneOverride?: string | React.MouseEvent) => {
    const phoneToUse = (typeof phoneOverride === 'string' ? phoneOverride : targetPhone).trim();
    const encoded = encodeURIComponent(generatedMessage);
    let url = `https://wa.me/?text=${encoded}`;
    if (phoneToUse) {
      const cleanPhone = phoneToUse.replace(/[^0-9]/g, '');
      if (cleanPhone) {
        url = `https://wa.me/${cleanPhone}?text=${encoded}`;
      }
    }
    window.open(url, '_blank');
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([generatedMessage], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GBP_Daily_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveBaseline = async (locName: string) => {
    setSavingBaseline(true);
    try {
      const res = await fetch('/api/gbp/multi-profile-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: locName,
          beforeTodayReviews: baselineInput
        })
      });
      if (res.ok) {
        setEditingBaselineId(null);
        await fetchReportData();
      }
    } catch (e) {
      alert('Failed to save baseline');
    } finally {
      setSavingBaseline(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">
              Daily WhatsApp Growth Report
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Share2 className="w-3 h-3 text-emerald-600" /> WhatsApp Ready
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Generate automated daily WhatsApp reports comparing before vs today reviews, ratings, and growth for all connected Google profiles.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {reportData?.generatedAt && (
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 border border-slate-200" title="Report is saved on server">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>Saved: {new Date(reportData.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </span>
          )}

          <button
            onClick={() => fetchReportData(true)}
            disabled={loading}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Fetch fresh data from Google API and update server cache"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Live Refresh</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied! ✓' : 'Copy Message'}</span>
          </button>
        </div>
      </div>

      {/* Account Info Pill - Displayed horizontal on mobile exactly like desktop */}
      {Boolean(reportData?.locations?.length) && (
        <div className="p-3 bg-gradient-to-r from-blue-50/80 via-emerald-50/50 to-white border border-blue-200/80 rounded-xl flex items-center justify-between gap-2.5 text-xs font-medium text-slate-700 w-full min-w-0 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
              Google Business Profile
            </span>
          </div>
          <span className="text-[11px] bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-700 font-mono font-bold flex-shrink-0 whitespace-nowrap shadow-2xs">
            {reportData?.locations?.length || 0} Profiles Linked
          </span>
        </div>
      )}

      {/* 5 Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 w-full">
        <div className="card p-4 border-l-4 border-l-blue-600">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
            Selected Profiles
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {selectedStats.profilesCount} / {reportData?.locations?.length || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {selectedStats.profilesCount === (reportData?.locations?.length || 0) ? 'All Profiles' : 'Custom Selection'}
          </div>
        </div>

        <div className="card p-4 border-l-4 border-l-amber-500">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
            Combined Rating
          </div>
          <div className="text-2xl font-bold text-slate-800 flex items-center gap-1.5">
            {selectedStats.avgRating}
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across selected</div>
        </div>

        <div className="card p-4 border-l-4 border-l-indigo-600">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
            Total Reviews
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {selectedStats.totalReviews.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1 font-semibold">
            Across {selectedStats.profilesCount} profiles
          </div>
        </div>

        <div className="card p-4 border-l-4 border-l-emerald-600">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
            Today's New Reviews
          </div>
          <div className="text-2xl font-bold text-emerald-600 flex items-center gap-1">
            +{selectedStats.todayNew}
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">
            {selectedStats.totalDiff >= 0 ? `+${selectedStats.totalDiff} net change` : `${selectedStats.totalDiff} net change`}
          </div>
        </div>

        <div className="card p-4 border-l-4 border-l-rose-500 col-span-2 sm:col-span-1">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
            Pending Replies
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {selectedStats.totalPending}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting owner reply</div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Profile Selector & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Profile List Card */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {selectedIds.length === (reportData?.locations?.length || 0) && (reportData?.locations?.length || 0) > 0 ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Select All</span>
                </button>
                <span className="text-xs text-slate-400">
                  ({selectedIds.length} of {reportData?.locations?.length || 0} included)
                </span>
              </div>

              <div className="text-xs font-medium text-slate-500">
                Before ➔ Today
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-7 h-7 animate-spin mx-auto text-blue-600 mb-2" />
                <p className="text-xs font-medium">Fetching all profiles and live review counts...</p>
              </div>
            ) : (!reportData?.locations || reportData.locations.length === 0) ? (
              reportData?.hasReport === false || !reportData?.generatedAt ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Daily Report Not Generated Yet
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Data is fetched from Google API only when requested and stored securely on the server. Click below to generate the daily report:
                  </p>
                  <button
                    onClick={() => fetchReportData(true)}
                    disabled={loading}
                    className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Multi-Profile Report</span>
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No Google Business Profiles found</p>
                  <p className="text-[11px] text-slate-500">Please connect your Google Account to load locations.</p>
                </div>
              )
            ) : (
              <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                {reportData.locations.map((loc, idx) => {
                  const isChecked = selectedIds.includes(loc.id);
                  const isEditing = editingBaselineId === loc.id;

                  return (
                    <div 
                      key={loc.id} 
                      className={`p-3.5 sm:p-4 transition-colors ${
                        isChecked ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 sm:gap-3 w-full">
                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectProfile(loc.id)}
                            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-800 text-xs sm:text-sm break-words">
                                {idx + 1}. {loc.title}
                              </h4>
                              {loc.storeCode && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                                  {loc.storeCode}
                                </span>
                              )}
                              <span className="text-xs text-amber-600 font-bold flex items-center gap-0.5 flex-shrink-0">
                                {loc.averageRating} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              </span>
                            </div>

                            {loc.address && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 break-words">
                                {loc.address}
                              </p>
                            )}

                            {/* Today vs Before Comparison Pill */}
                            <div className="mt-2 flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
                              <div className="p-1.5 px-2 bg-slate-100 rounded-lg text-slate-700 font-medium flex items-center gap-1.5 flex-wrap">
                                <span className="text-slate-400 text-[10px] uppercase font-bold">
                                  Before:
                                </span>
                                
                                {isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={baselineInput}
                                      onChange={(e) => setBaselineInput(parseInt(e.target.value) || 0)}
                                      className="w-14 px-1 py-0.5 text-xs bg-white border border-blue-400 rounded outline-none font-bold"
                                    />
                                    <button
                                      onClick={() => handleSaveBaseline(loc.name)}
                                      disabled={savingBaseline}
                                      className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => setEditingBaselineId(null)}
                                      className="text-slate-400 text-[10px]"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <span 
                                    onClick={() => {
                                      setEditingBaselineId(loc.id);
                                      setBaselineInput(loc.beforeTodayReviews);
                                    }}
                                    className="font-bold cursor-pointer hover:underline text-slate-700"
                                    title="Click to edit before-today baseline"
                                  >
                                    {loc.beforeTodayReviews}
                                  </span>
                                )}

                                <span className="text-slate-300">➔</span>
                                <span className="text-slate-400 text-[10px] uppercase font-bold">
                                  Today:
                                </span>
                                <strong className="text-blue-700 font-extrabold">{loc.totalReviews}</strong>
                              </div>

                              {/* Growth Tag */}
                              {loc.difference > 0 ? (
                                <span className="p-1 px-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center gap-1 text-[11px] flex-shrink-0">
                                  <TrendingUp className="w-3 h-3" /> +{loc.difference} Growth
                                </span>
                              ) : loc.difference < 0 ? (
                                <span className="p-1 px-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold flex items-center gap-1 text-[11px] flex-shrink-0">
                                  <TrendingDown className="w-3 h-3" /> {loc.difference} Drop
                                </span>
                              ) : (
                                <span className="p-1 px-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1 flex-shrink-0">
                                  <Minus className="w-3 h-3 text-slate-400" />
                                  <span>No change</span>
                                </span>
                              )}

                              {loc.todayNewReviews > 0 && (
                                <span className="p-1 px-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 flex-shrink-0">
                                  <MessageSquare className="w-3 h-3 text-blue-600" />
                                  <span>+{loc.todayNewReviews} today</span>
                                </span>
                              )}

                              {loc.pendingCount > 0 && (
                                <span className="p-1 px-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1 flex-shrink-0">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>{loc.pendingCount} pending</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {onSelectLocation && (
                          <button
                            onClick={() => onSelectLocation(loc.name)}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex-shrink-0"
                          >
                            Open ↗
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Formatting & Controls Card */}
          <div className="card p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-blue-600" />
              Report Customization Options
            </h3>

            {/* Checkbox Toggles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={boldProfileNames}
                  onChange={(e) => setBoldProfileNames(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">Bold Profile Names (*Title*)</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeComparison}
                  onChange={(e) => setIncludeComparison(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Include Before vs Today comparison</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRatings}
                  onChange={(e) => setIncludeRatings(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Include Average Star Rating</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePending}
                  onChange={(e) => setIncludePending(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Include Pending Owner Replies</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeReviewLinks}
                  onChange={(e) => setIncludeReviewLinks(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Include 5-Star Review Links</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNetDifference}
                  onChange={(e) => setShowNetDifference(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Show (+net change) in Today line</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer sm:col-span-2">
                <input
                  type="checkbox"
                  checked={includeSummaryFooter}
                  onChange={(e) => setIncludeSummaryFooter(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Include Overall Summary footer</span>
              </label>
            </div>

            {/* Custom Note Input */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Custom Note for Team (Optional):
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Branch heads please ensure 100% review replies today."
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
              />
            </div>

            {/* Target WhatsApp Phone & Presets */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Send Directly to Phone Number (Optional):
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddPhone(prev => !prev)}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  {showAddPhone ? 'Cancel' : 'Add Number'}
                </button>
              </div>

              {/* Saved phone presets pills */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {savedPhoneNumbers.map((phone) => {
                  const isSelected = targetPhone.trim() === phone.trim();
                  const isDefaultPreset = phone === '+91 9610447938' || phone === '+91 9024031003';
                  return (
                    <div
                      key={phone}
                      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                          : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200 hover:border-emerald-300'
                      }`}
                      onClick={() => setTargetPhone(phone)}
                      title={`Select ${phone}`}
                    >
                      <Phone className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                      <span>{phone}</span>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                      {!isDefaultPreset && (
                        <button
                          type="button"
                          onClick={(e) => handleRemovePhoneNumber(phone, e)}
                          title="Remove this number"
                          className={`ml-0.5 p-0.5 rounded hover:bg-red-500 hover:text-white transition-colors cursor-pointer ${
                            isSelected ? 'text-emerald-200 hover:text-white' : 'text-slate-400'
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Clear / Open WhatsApp Contact Selector Option */}
                <button
                  type="button"
                  onClick={() => setTargetPhone('')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border ${
                    !targetPhone.trim()
                      ? 'bg-slate-700 text-white border-slate-700 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                  title="Share without pre-selecting a number (opens WhatsApp contact/group list)"
                >
                  Choose in WhatsApp
                </button>
              </div>

              {/* Add New Phone Form (toggleable) */}
              {showAddPhone && (
                <div className="p-2.5 mb-2.5 bg-emerald-50/70 border border-emerald-200 rounded-md space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newPhoneInput}
                      onChange={(e) => setNewPhoneInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPhoneNumber();
                        }
                      }}
                      placeholder="+91 9876543210"
                      className="flex-1 text-xs p-2 bg-white border border-emerald-300 rounded-md outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleAddPhoneNumber()}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shadow-2xs whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Enter number with country code, e.g. <span className="font-mono text-emerald-800 font-bold">+91 9610447938</span>
                  </p>
                </div>
              )}

              {/* Active Selected Phone Input */}
              <div className="relative">
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="e.g. +91 9610447938 or leave empty to choose contact in WhatsApp"
                  className="w-full text-xs p-2 pl-7 bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-emerald-500 font-mono text-slate-800"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Phone Chat Mockup Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              WhatsApp Live Preview
            </h3>
            <span className="text-[11px] text-slate-400">
              {activeProfiles.length} profiles
            </span>
          </div>

          {/* WhatsApp Chat Device Frame Mockup */}
          <div className="rounded-2xl border border-slate-300 shadow-md overflow-hidden bg-[#efeae2] flex flex-col max-h-[640px] w-full max-w-full">
            {/* WhatsApp Top Bar */}
            <div className="bg-[#008069] text-white p-3 px-4 flex items-center justify-between flex-shrink-0 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                  G
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs leading-tight truncate">GBP Daily Growth Report</h4>
                  <p className="text-[10px] text-emerald-100 truncate max-w-[170px] sm:max-w-none">
                    Google Business Profile
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-100 flex-shrink-0">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Chat Body Bubble */}
            <div className="p-2.5 sm:p-4 overflow-y-auto overflow-x-hidden flex-1 space-y-2 w-full max-w-full">
              <div className="w-full max-w-full bg-white rounded-xl rounded-tl-none p-3 sm:p-3.5 shadow-xs text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] select-all">
                {generatedMessage}
                <div className="flex justify-end items-center gap-1 mt-1 text-[9px] text-slate-400">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-blue-500 font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Bottom Quick Action Toolbar */}
            <div className="p-2.5 sm:p-3 bg-[#f0f2f5] border-t border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 flex-shrink-0 w-full">
              <button
                onClick={handleCopy}
                className="flex-1 min-w-[100px] py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="truncate">{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={() => handleOpenWhatsApp()}
                className="flex-1 min-w-[110px] py-2 px-2.5 bg-[#25d366] hover:bg-[#20bd5a] text-white rounded-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="truncate">
                  {targetPhone.trim() ? `Send to ${targetPhone}` : 'Share WhatsApp'}
                </span>
              </button>

              <button
                onClick={handleDownloadTxt}
                title="Download .txt"
                className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-slate-600 text-xs shadow-xs cursor-pointer flex-shrink-0"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
