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
  Minus,
  ArrowUpDown,
  Target,
  BarChart3
} from 'lucide-react';
import { ProfileReportItem, MultiProfileReportData, PanelUser } from '../types';
import { DailyReviewTargetModal } from './DailyReviewTargetModal';
import { getBusinessDateStr, getBusinessShiftedDate, BUSINESS_TIMEZONE } from '../utils/dateUtils';
import { isItemAllowedForMember } from '../utils/profileIsolation';
import { 
  getAssignedStaffBracket, 
  getAssignedStaffPhone, 
  formatPhoneWithPlus91, 
  OFFICIAL_REVIEW_TEAM 
} from '../utils/reviewTeam';

const STORAGE_KEY_DESELECTED_PROFILES = 'gbp_whatsapp_deselected_profiles';

const getPersistedDeselectedList = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DESELECTED_PROFILES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

const savePersistedDeselectedList = (list: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_DESELECTED_PROFILES, JSON.stringify(list));
  } catch {}
};

const isLocationDeselected = (loc: ProfileReportItem, deselectedList: string[]): boolean => {
  if (!loc || !Array.isArray(deselectedList) || deselectedList.length === 0) return false;
  return deselectedList.includes(loc.id) || 
         Boolean(loc.name && deselectedList.includes(loc.name)) || 
         Boolean(loc.title && deselectedList.includes(loc.title));
};

interface DailyWhatsAppReportProps {
  userEmail?: string | null;
  currentUser?: PanelUser | null;
  onSelectLocation?: (locationName: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const DailyWhatsAppReport: React.FC<DailyWhatsAppReportProps> = ({
  userEmail,
  currentUser,
  onSelectLocation,
  onNavigateTab
}) => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<MultiProfileReportData | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [targetPhone, setTargetPhone] = useState('+91 7296989764');
  const [savedPhoneNumbers, setSavedPhoneNumbers] = useState<string[]>(() => {
    const teamPhones = OFFICIAL_REVIEW_TEAM.map(m => m.phone);
    try {
      const stored = localStorage.getItem('gbp_whatsapp_saved_phones');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...teamPhones, ...parsed]));
        }
      }
    } catch {}
    return teamPhones;
  });
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [showAddPhone, setShowAddPhone] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDateMode, setSelectedDateMode] = useState<'today' | 'yesterday'>('today');

  // Custom formatting options
  const [includeComparison, setIncludeComparison] = useState(true);
  const [includeRatings, setIncludeRatings] = useState(true);
  const [includePending, setIncludePending] = useState(false);
  const [includeReviewLinks, setIncludeReviewLinks] = useState(false);
  const [includeSummaryFooter, setIncludeSummaryFooter] = useState(true);
  const [showNetDifference, setShowNetDifference] = useState(false);
  const [includePhone, setIncludePhone] = useState(true);
  const [boldProfileNames, setBoldProfileNames] = useState(true);
  const [sortBy, setSortBy] = useState<'rating_asc' | 'rating_desc' | 'growth_desc' | 'reviews_desc'>('rating_asc');

  // Baseline edit state
  const [editingBaselineId, setEditingBaselineId] = useState<string | null>(null);
  const [baselineInput, setBaselineInput] = useState<number>(0);
  const [savingBaseline, setSavingBaseline] = useState(false);

  useEffect(() => {
    fetchReportData(true);
  }, []);

  // Sort profiles helper function
  const sortProfiles = (list: ProfileReportItem[]): ProfileReportItem[] => {
    return [...list].sort((a, b) => {
      if (sortBy === 'rating_asc') {
        const ratingA = Number(a.averageRating) || 0;
        const ratingB = Number(b.averageRating) || 0;
        if (ratingA !== ratingB) {
          return ratingA - ratingB; // Ascending: lowest rating first
        }
        return (Number(a.totalReviews) || 0) - (Number(b.totalReviews) || 0);
      }
      if (sortBy === 'rating_desc') {
        const ratingA = Number(a.averageRating) || 0;
        const ratingB = Number(b.averageRating) || 0;
        if (ratingA !== ratingB) {
          return ratingB - ratingA; // Descending: highest rating first
        }
        return (Number(b.totalReviews) || 0) - (Number(a.totalReviews) || 0);
      }
      if (sortBy === 'growth_desc') {
        const growthA = Number(a.difference || a.todayNewReviews) || 0;
        const growthB = Number(b.difference || b.todayNewReviews) || 0;
        if (growthA !== growthB) {
          return growthB - growthA;
        }
        return (Number(a.averageRating) || 0) - (Number(b.averageRating) || 0);
      }
      if (sortBy === 'reviews_desc') {
        return (Number(b.totalReviews) || 0) - (Number(a.totalReviews) || 0);
      }
      return 0;
    });
  };

  const fetchReportData = async (forceRefresh: boolean = false, dateMode: 'today' | 'yesterday' = selectedDateMode) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const queryParams = new URLSearchParams();
      if (dateMode === 'yesterday') {
        queryParams.set('date', 'yesterday');
      } else if (forceRefresh) {
        queryParams.set('refresh', 'true');
      }
      const qs = queryParams.toString();
      const res = await fetch(`/api/gbp/multi-profile-report${qs ? `?${qs}` : ''}`);
      if (res.ok) {
        const data: MultiProfileReportData = await res.json();
        if (data.locations) {
          // Strict Profile Isolation: Non-admin members ONLY see their assigned profile
          if (currentUser && currentUser.role !== 'admin') {
            data.locations = data.locations.filter(l => isItemAllowedForMember(l.title || '', l.id || l.name || '', currentUser));
          }

          // Sort locations initially with lowest rating first (ascending)
          data.locations.sort((a, b) => {
            const ratingA = Number(a.averageRating) || 0;
            const ratingB = Number(b.averageRating) || 0;
            if (ratingA !== ratingB) {
              return ratingA - ratingB;
            }
            return (Number(a.totalReviews) || 0) - (Number(b.totalReviews) || 0);
          });
          // Retain only profiles that the user has NOT explicitly deselected
          const deselectedList = getPersistedDeselectedList();
          const retainedSelected = data.locations
            .filter(l => !isLocationDeselected(l, deselectedList))
            .map(l => l.id);
          setSelectedIds(retainedSelected);
        }
        setReportData(data);
      } else {
        const errData = await res.json().catch(() => null);
        const msg = errData?.message || errData?.error || `Failed to fetch report (HTTP ${res.status})`;
        setErrorMessage(msg);
      }
    } catch (e: any) {
      console.error('Failed to fetch multi-profile report:', e);
      setErrorMessage(e?.message || 'Network error while fetching Google Business profiles');
    } finally {
      setLoading(false);
    }
  };

  // Sorted locations for UI list display
  const sortedLocations = useMemo(() => {
    if (!reportData?.locations) return [];
    return sortProfiles(reportData.locations);
  }, [reportData?.locations, sortBy]);

  const handleSelectAll = () => {
    if (!sortedLocations || sortedLocations.length === 0) return;
    if (selectedIds.length === sortedLocations.length) {
      // User is deselecting all:
      setSelectedIds([]);
      const allIdentifiers = sortedLocations.flatMap(l => [l.id, l.name, l.title].filter(Boolean)) as string[];
      savePersistedDeselectedList(Array.from(new Set(allIdentifiers)));
    } else {
      // User is selecting all:
      setSelectedIds(sortedLocations.map(l => l.id));
      savePersistedDeselectedList([]);
    }
  };

  const toggleSelectProfile = (id: string) => {
    const loc = reportData?.locations?.find(l => l.id === id);
    setSelectedIds(prev => {
      const isCurrentlySelected = prev.includes(id);
      const nextSelected = isCurrentlySelected 
        ? prev.filter(item => item !== id)
        : [...prev, id];

      const currentDeselected = getPersistedDeselectedList();
      const locIdentifiers = [id, loc?.name, loc?.title].filter(Boolean) as string[];

      let updatedDeselected: string[];
      if (isCurrentlySelected) {
        // Was selected, now deselected -> add to deselected list so it NEVER returns automatically
        updatedDeselected = Array.from(new Set([...currentDeselected, ...locIdentifiers]));
      } else {
        // Was deselected, now selected -> remove from deselected list
        updatedDeselected = currentDeselected.filter(k => !locIdentifiers.includes(k));
      }
      savePersistedDeselectedList(updatedDeselected);

      return nextSelected;
    });
  };

  // Filtered locations included in the report, sorted by current order (lowest rating first)
  const activeProfiles = useMemo(() => {
    if (!reportData?.locations) return [];
    const filtered = reportData.locations.filter(l => selectedIds.includes(l.id));
    return sortProfiles(filtered);
  }, [reportData, selectedIds, sortBy]);

  // Aggregate stats for selected profiles
  const selectedStats = useMemo(() => {
    const totalReviews = activeProfiles.reduce((acc, p) => acc + (p.totalReviews || 0), 0);
    const todayNew = activeProfiles.reduce((acc, p) => acc + Math.max(p.todayNewReviews || 0, Math.max(0, p.difference || 0)), 0);
    const totalPending = activeProfiles.reduce((acc, p) => acc + (p.pendingCount || 0), 0);
    const totalDiff = activeProfiles.reduce((acc, p) => acc + (p.difference || 0), 0);
    const avgRating = activeProfiles.length > 0 
      ? (activeProfiles.reduce((acc, p) => acc + (p.averageRating || 0), 0) / activeProfiles.length).toFixed(1)
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
    const isYesterdayMode = selectedDateMode === 'yesterday' || Boolean(reportData?.isHistorical);
    // 5:00 AM daily cutoff: shift current time by 5 hours so report date rolls over at 5:00 AM IST
    const businessDate = getBusinessShiftedDate(now);
    const dateFormatted = isYesterdayMode && reportData?.reportDate
      ? new Date(reportData.reportDate + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
      : businessDate.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: BUSINESS_TIMEZONE
        });
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: BUSINESS_TIMEZONE });

    let lines: string[] = [];

    // Clean, professional header with Yesterday indicator if viewing historical
    const titleHeader = isYesterdayMode 
      ? `*Daily Google Business Profile Report (Yesterday - ${dateFormatted})*`
      : '*Daily Google Business Profile Report*';
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
      // Yesterday: 420 ➔ Today: 423
      const staffBracket = getAssignedStaffBracket(p.title);
      const profileTitle = boldProfileNames ? `*${p.title}*` : p.title;
      const effectiveTodayNew = isYesterdayMode
        ? (p.todayNewReviews || 0)
        : Math.max(p.todayNewReviews || 0, Math.max(0, p.difference || 0));

      lines.push(`📍 ${idx + 1}. ${profileTitle}${staffBracket ? ` ${staffBracket}` : ''}`);
      if (includePhone) {
        const staffPhone = getAssignedStaffPhone(p.title);
        if (staffPhone) {
          lines.push(`📞 Phone: ${staffPhone}`);
        }
      }

      if (isYesterdayMode) {
        lines.push(`Total Reviews: ${p.totalReviews}`);
        if (effectiveTodayNew > 0) {
          lines.push(`Reviews Growth: +${effectiveTodayNew}`);
        }
      } else {
        lines.push(`New Reviews Today: ${effectiveTodayNew}`);
      }

      if (includeRatings) {
        lines.push(`Average Rating: ${p.averageRating}`);
      }

      if (includeComparison) {
        if (isYesterdayMode) {
          if (p.beforeTodayReviews > 0 && p.beforeTodayReviews !== p.totalReviews) {
            lines.push(`Previous: ${p.beforeTodayReviews} ➔ Closing: ${p.totalReviews}${effectiveTodayNew > 0 ? ` (+${effectiveTodayNew})` : ''}`);
          } else {
            lines.push(`Closing Total: ${p.totalReviews}${effectiveTodayNew > 0 ? ` (+${effectiveTodayNew})` : ''}`);
          }
        } else {
          const diffText = showNetDifference && p.difference !== 0
            ? ` (${p.difference > 0 ? `+${p.difference}` : p.difference})`
            : '';
          lines.push(`Yesterday: ${p.beforeTodayReviews} ➔  Today: ${p.totalReviews}${diffText}`);
        }
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
      lines.push(isYesterdayMode ? '*Yesterday Overall Summary:*' : '*Overall Summary:*');
      lines.push(`Total Profiles: ${selectedStats.profilesCount}`);
      if (isYesterdayMode) {
        lines.push(`Combined Total Reviews: ${selectedStats.totalReviews}`);
        if (selectedStats.todayNew > 0) {
          lines.push(`Yesterday Net Growth: +${selectedStats.todayNew}`);
        }
      } else {
        lines.push(`New Reviews Today: +${selectedStats.todayNew}`);
        lines.push(`Combined Total Reviews: ${selectedStats.totalReviews}`);
      }
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
    includePhone,
    boldProfileNames,
    selectedStats,
    customNote,
    selectedDateMode
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

  // Helper to render WhatsApp bold formatting (*text*) as bold text in the preview
  const renderFormattedWhatsApp = (content: string) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, lIdx) => {
      // Split by *bold text* pattern
      const parts = line.split(/(\*[^*\n]+\*)/g);
      return (
        <React.Fragment key={lIdx}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
              return (
                <strong key={pIdx} className="font-bold text-slate-900">
                  {part.slice(1, -1)}
                </strong>
              );
            }
            return part;
          })}
          {lIdx < lines.length - 1 && '\n'}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-3.5 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-800">
              Daily WhatsApp Growth Report
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
              <Share2 className="w-3 h-3 text-emerald-600 shrink-0" /> WhatsApp Ready
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Day Selector: Today vs Yesterday */}
          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedDateMode('today');
                fetchReportData(false, 'today');
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                selectedDateMode === 'today'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDateMode('yesterday');
                fetchReportData(false, 'yesterday');
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                selectedDateMode === 'yesterday'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View and export yesterday's (last day's) saved report"
            >
              Yesterday
            </button>
          </div>

          {reportData?.generatedAt && (
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 border border-slate-200 shrink-0 whitespace-nowrap" title="Report timestamp">
              <Clock className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="whitespace-nowrap">
                {getBusinessDateStr(new Date(reportData.generatedAt)) === getBusinessDateStr(new Date())
                  ? `Today at ${new Date(reportData.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`
                  : `Updated ${new Date(reportData.generatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })}`}
              </span>
            </span>
          )}

          {onNavigateTab ? (
            <button
              onClick={() => onNavigateTab('reviewTargets')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors whitespace-nowrap shrink-0"
              title="Open Daily Review Targets & Goals Page"
            >
              <Target className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Target Planner</span>
            </button>
          ) : (
            <button
              onClick={() => setShowTargetModal(true)}
              className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors whitespace-nowrap shrink-0"
              title="Open Quick Target Planner Popup"
            >
              <Target className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="whitespace-nowrap">Target Planner</span>
            </button>
          )}

          <button
            onClick={() => fetchReportData(true)}
            disabled={loading}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            title="Fetch fresh data from Google API and update server cache"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin text-blue-600' : 'text-blue-600'}`} />
            <span className="whitespace-nowrap">{loading ? 'Checking Google...' : 'Live Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Yesterday Archive Indicator Banner */}
      {selectedDateMode === 'yesterday' && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Showing Yesterday's Saved Report:</strong> Review counts and WhatsApp preview below reflect yesterday's closing records.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedDateMode('today');
              fetchReportData(false, 'today');
            }}
            className="px-3.5 py-1.5 bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-800 text-xs font-semibold rounded-lg shrink-0 cursor-pointer transition-colors"
          >
            Switch to Today
          </button>
        </div>
      )}

      {/* Account Info Pill - Displayed horizontal on mobile exactly like desktop */}
      {Boolean(reportData?.locations?.length) && (
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2.5 text-xs font-medium text-slate-700 w-full min-w-0 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
              Google Business Profile
            </span>
          </div>
          <span className="text-[11px] bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-slate-700 font-semibold shrink-0 whitespace-nowrap">
            {reportData?.locations?.length || 0} Profiles Linked
          </span>
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-rose-900 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-xs">
              <strong>Error:</strong> {errorMessage}
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchReportData(true)}
            disabled={loading}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shrink-0 cursor-pointer text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Retry Live Fetch</span>
          </button>
        </div>
      )}

      {/* Stale Report Warning Alert */}
      {!loading && reportData?.locations && reportData.locations.length > 0 && reportData?.isToday === false && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs">
              <strong>Notice:</strong> This report is from earlier (saved on {new Date(reportData.generatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}). Click <strong>Live Refresh</strong> to fetch today's latest reviews from Google.
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchReportData(true)}
            disabled={loading}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 cursor-pointer text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Fetch Today's Reviews</span>
          </button>
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
          
          {/* Quick Target Planner Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  Daily Review Target & Member Planner
                </h4>
                <p className="text-[11px] text-slate-500">
                  Assign daily goals to team members, auto-adjust remaining days, and download weekly PDF reports.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) {
                  onNavigateTab('reviewTargets');
                } else {
                  setShowTargetModal(true);
                }
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Open Target Planner</span>
            </button>
          </div>

          {/* Profile List Card */}
          <div className="card overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/70">
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {selectedIds.length === (sortedLocations?.length || 0) && (sortedLocations?.length || 0) > 0 ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Select All</span>
                </button>
                <span className="text-xs font-semibold text-slate-600">
                  ({selectedIds.length} of {sortedLocations?.length || 0} included)
                </span>
                {selectedIds.length < (sortedLocations?.length || 0) && (
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {(sortedLocations?.length || 0) - selectedIds.length} profile(s) deselected & excluded
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                  title="Profile order in report"
                >
                  <option value="rating_asc">Lowest Rating First (Default)</option>
                  <option value="rating_desc">Highest Rating First</option>
                  <option value="growth_desc">Today's Growth (Highest First)</option>
                  <option value="reviews_desc">Total Reviews (Highest First)</option>
                </select>
              </div>
            </div>

            {loading && (!reportData?.locations || reportData.locations.length === 0) ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-7 h-7 animate-spin mx-auto text-blue-600 mb-2" />
                <p className="text-xs font-medium">Checking all Google Business profiles from scratch...</p>
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
                {sortedLocations.map((loc, idx) => {
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
                            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-800 text-xs sm:text-sm break-words flex items-center gap-1.5 flex-wrap">
                                <span>{idx + 1}. {loc.title}</span>
                                {getAssignedStaffBracket(loc.title) && (
                                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    {getAssignedStaffBracket(loc.title)}
                                  </span>
                                )}
                                {getAssignedStaffPhone(loc.title) && (
                                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5" />
                                    {getAssignedStaffPhone(loc.title)}
                                  </span>
                                )}
                              </h4>
                              {loc.storeCode && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                  {loc.storeCode}
                                </span>
                              )}
                              <span className="text-xs text-amber-600 font-bold flex items-center gap-0.5 shrink-0">
                                {loc.averageRating} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              </span>
                              {isChecked ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1 shrink-0">
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  In Report
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shrink-0" title="This profile is deselected and will NOT appear in the report until checked">
                                  Deselected (Hidden from report)
                                </span>
                              )}
                            </div>

                            {loc.address && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 break-words">
                                {loc.address}
                              </p>
                            )}

                            {/* Today vs Before Comparison Pill */}
                            <div className="mt-2 flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
                              <div className="p-1.5 px-2 bg-slate-100 rounded-lg text-slate-700 font-medium flex items-center gap-1.5 flex-wrap">
                                {selectedDateMode === 'yesterday' ? (
                                  <>
                                    <span className="text-slate-400 text-[10px] uppercase font-bold">
                                      Closing:
                                    </span>
                                    <strong className="text-blue-700 font-bold">{loc.totalReviews}</strong>
                                    {loc.beforeTodayReviews > 0 && loc.beforeTodayReviews !== loc.totalReviews && (
                                      <span className="text-[11px] text-slate-500 font-normal">
                                        (prev: {loc.beforeTodayReviews})
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
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
                                    <strong className="text-blue-700 font-bold">{loc.totalReviews}</strong>
                                  </>
                                )}
                              </div>

                              {/* Growth Tag */}
                              {selectedDateMode === 'yesterday' ? (
                                (loc.todayNewReviews || 0) > 0 ? (
                                  <span className="p-1 px-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center gap-1 text-[11px] shrink-0">
                                    <TrendingUp className="w-3 h-3" /> +{loc.todayNewReviews} reviews
                                  </span>
                                ) : null
                              ) : (
                                <>
                                  {loc.difference > 0 ? (
                                    <span className="p-1 px-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center gap-1 text-[11px] shrink-0">
                                      <TrendingUp className="w-3 h-3" /> +{loc.difference} Growth
                                    </span>
                                  ) : loc.difference < 0 ? (
                                    <span className="p-1 px-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold flex items-center gap-1 text-[11px] shrink-0">
                                      <TrendingDown className="w-3 h-3" /> {loc.difference} Drop
                                    </span>
                                  ) : (
                                    <span className="p-1 px-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1 shrink-0">
                                      <Minus className="w-3 h-3 text-slate-400" />
                                      <span>No change</span>
                                    </span>
                                  )}

                                  {Math.max(loc.todayNewReviews || 0, Math.max(0, loc.difference || 0)) > 0 && (
                                    <span className="p-1 px-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0">
                                      <MessageSquare className="w-3 h-3 text-blue-600" />
                                      <span>+{Math.max(loc.todayNewReviews || 0, Math.max(0, loc.difference || 0))} today</span>
                                    </span>
                                  )}
                                </>
                              )}

                              {loc.pendingCount > 0 && (
                                <span className="p-1 px-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>{loc.pendingCount} pending</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {onSelectLocation && (
                          <button
                            onClick={() => {
                              onSelectLocation(loc.v4Name || loc.name || loc.id);
                              onNavigateTab?.('reviews');
                            }}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 shrink-0 cursor-pointer"
                            title={`Open ${loc.title} reviews`}
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

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePhone}
                  onChange={(e) => setIncludePhone(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-emerald-800 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  Include Staff Phone (+91)
                </span>
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

            {/* Profile Order Selector in Message with SVG Icons */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                Profile Ordering in Report Message:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {[
                  {
                    value: 'rating_asc',
                    label: 'Lowest Rating First (Default)',
                    icon: <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  },
                  {
                    value: 'rating_desc',
                    label: 'Highest Rating First',
                    icon: <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  },
                  {
                    value: 'growth_desc',
                    label: "Today's Growth (Highest)",
                    icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  },
                  {
                    value: 'reviews_desc',
                    label: 'Total Reviews (Highest)',
                    icon: <BarChart3 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  }
                ].map((opt) => {
                  const isSelected = sortBy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSortBy(opt.value as any)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-left cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {opt.icon}
                      <span className="truncate flex-1">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-auto" />}
                    </button>
                  );
                })}
              </div>
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
                      className="flex-1 text-xs p-2 bg-white border border-emerald-300 rounded-md outline-none focus:ring-1 focus:ring-emerald-500 font-normal text-slate-800"
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
                    Enter number with country code, e.g. <span className="text-emerald-800 font-bold">+91 9610447938</span>
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
                  className="w-full text-xs p-2 pl-7 bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-emerald-500 text-slate-800 font-normal"
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
            <div className="bg-[#008069] text-white p-3 px-4 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  G
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs leading-tight truncate">GBP Daily Growth Report</h4>
                  <p className="text-[10px] text-emerald-100 truncate max-w-[170px] sm:max-w-none">
                    Google Business Profile
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-100 shrink-0">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Chat Body Bubble */}
            <div className="p-2.5 sm:p-4 overflow-y-auto overflow-x-hidden flex-1 space-y-2 w-full max-w-full">
              <div className="w-full max-w-full bg-white rounded-xl rounded-tl-none p-3 sm:p-3.5 shadow-xs text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] select-all">
                {renderFormattedWhatsApp(generatedMessage)}
                <div className="flex justify-end items-center gap-1 mt-1 text-[9px] text-slate-400">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-blue-500 font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Bottom Quick Action Toolbar */}
            <div className="p-2.5 sm:p-3 bg-[#f0f2f5] border-t border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shrink-0 w-full">
              <button
                onClick={handleCopy}
                className="flex-1 min-w-[100px] py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all whitespace-nowrap shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="whitespace-nowrap">{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={() => handleOpenWhatsApp()}
                className="flex-1 min-w-[110px] py-2 px-2.5 bg-[#25d366] hover:bg-[#20bd5a] text-white rounded-md text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">
                  {targetPhone.trim() ? `Send to ${targetPhone}` : 'Share WhatsApp'}
                </span>
              </button>

              <button
                onClick={handleDownloadTxt}
                title="Download .txt"
                className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-slate-600 text-xs shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Daily Review Target & Planner Modal */}
      <DailyReviewTargetModal
        isOpen={showTargetModal}
        onClose={() => setShowTargetModal(false)}
        locations={reportData?.locations?.map(l => ({ 
          name: l.name, 
          v4Name: l.v4Name || l.name, 
          title: l.title, 
          address: l.address, 
          storeCode: l.storeCode,
          metadata: { placeId: l.reviewLink?.split('placeid=')[1] }
        } as any)) || []}
        userEmail={userEmail}
      />
    </div>
  );
};
