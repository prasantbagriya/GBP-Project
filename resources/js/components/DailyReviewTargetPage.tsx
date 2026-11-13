import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Share2, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  X, 
  RefreshCw, 
  Check, 
  Copy, 
  Send, 
  Phone, 
  FileText, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Dices, 
  Edit2, 
  Building2, 
  Star, 
  FileSpreadsheet, 
  Layers, 
  ArrowUpDown, 
  Sun, 
  Moon, 
  Zap, 
  Shuffle, 
  ExternalLink, 
  Lock,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Location, ProfileReportItem, MultiProfileReportData, PanelUser } from '../types';
import { getBusinessShiftedDate } from '../utils/dateUtils';
import { isItemAllowedForMember } from '../utils/profileIsolation';
import { 
  OFFICIAL_REVIEW_TEAM, 
  getAssignedStaffBracket, 
  getAssignedStaffMembersForProfile,
  getAssignedStaffPhone,
  formatPhoneWithPlus91
} from '../utils/reviewTeam';

export interface TargetMember {
  id: string;
  name: string;
  phone?: string;
  role?: string;
}

export interface ProfileTargetConfig {
  weeklyTarget: number;
  dailyTargets: number[]; // 7 elements (Mon-Sun)
  verifiedReviews: number[]; // 7 elements
  isVerified: boolean[]; // 7 elements
  assignedMemberIds?: string[];
  memberAssignments?: {
    [dayIndex: number]: {
      memberId: string;
      memberName: string;
      count: number;
    }[];
  };
}

interface DailyReviewTargetPageProps {
  userEmail?: string | null;
  currentUser?: PanelUser | null;
  onSelectLocation?: (locationName: string) => void;
}

const DAY_NAMES = [
  { en: 'Monday', hi: 'सोमवार' },
  { en: 'Tuesday', hi: 'मंगलवार' },
  { en: 'Wednesday', hi: 'बुधवार' },
  { en: 'Thursday', hi: 'गुरुवार' },
  { en: 'Friday', hi: 'शुक्रवार' },
  { en: 'Saturday', hi: 'शनिवार' },
  { en: 'Sunday', hi: 'रविवार' },
];

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DailyReviewTargetPage: React.FC<DailyReviewTargetPageProps> = ({
  userEmail,
  currentUser,
  onSelectLocation
}) => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<MultiProfileReportData | null>(null);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Week Selector (Monday to Sunday)
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const weekInfo = useMemo(() => {
    const now = getBusinessShiftedDate();
    now.setDate(now.getDate() + (weekOffset * 7));
    
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const startDateStr = formatLocalDate(monday);
    const endDateStr = formatLocalDate(sunday);

    return {
      monday,
      sunday,
      startDateStr,
      endDateStr,
      formattedRange: `${monday.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
    };
  }, [weekOffset]);

  const getDayDate = (dayIdx: number): Date => {
    const d = new Date(weekInfo.monday);
    d.setDate(d.getDate() + dayIdx);
    return d;
  };

  const currentDayIndex = useMemo(() => {
    // 5:00 AM daily cutoff: shift current time so day rolls over at 5:00 AM IST
    const shifted = getBusinessShiftedDate();
    const today = shifted.getDay();
    return (today + 6) % 7; // 0 = Mon, 6 = Sun
  }, []);

  const [activeViewDayIdx, setActiveViewDayIdx] = useState<number>(currentDayIndex);

  // Group Members (Permanently assigned to wings)
  const [members, setMembers] = useState<TargetMember[]>(() => {
    try {
      const stored = localStorage.getItem('gbp_global_target_members');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isOld = parsed.some((m: any) => m.name === 'Rahul Sharma' || m.name === 'Amit Verma' || m.id === 'm1');
          if (!isOld) {
            return parsed;
          }
        }
      }
    } catch {}
    try {
      localStorage.setItem('gbp_global_target_members', JSON.stringify(OFFICIAL_REVIEW_TEAM));
    } catch {}
    return OFFICIAL_REVIEW_TEAM;
  });

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');

  // Target Configurations per Profile ID: { [profileId]: ProfileTargetConfig }
  const [targetsMap, setTargetsMap] = useState<{ [profileId: string]: ProfileTargetConfig }>({});
  
  // Notice Banner Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Report Mode: Morning (Subah Kickoff) vs Evening (Shaam EOD Sync)
  // Auto-activates evening report if current time >= 18:30 (6:30 PM)
  const isEveningTime = (): boolean => {
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes();
    return (hours > 18 || (hours === 18 && mins >= 30));
  };

  const isEveningTimeNow = useMemo(() => isEveningTime(), []);
  const [reportMode, setReportMode] = useState<'morning' | 'evening'>(() => {
    return isEveningTime() ? 'evening' : 'morning';
  });

  // Custom Notes for Morning and Evening
  const [customMorningNote, setCustomMorningNote] = useState(
    'All counselors and branch staff please ensure today\'s review targets are met.'
  );
  const [customEveningNote, setCustomEveningNote] = useState(
    'Branch heads please review today\'s completion status. Shortfalls will rebalance into upcoming days.'
  );

  // WhatsApp Options
  const [whatsappPhone, setWhatsappPhone] = useState('+91 9610447938');
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Helper: check if a day is completed or past (LOCKED)
  // "monday vale me complete hone ke bad me refresh karte monday me change nahi hoga, week complete hone ke bad me hi us per kam hoga"
  const isDayCompletedOrPast = (dayIdx: number, conf?: ProfileTargetConfig): boolean => {
    if (!conf) return false;
    // If explicitly verified/completed, it is permanently locked
    if (conf.isVerified[dayIdx]) return true;
    // If in the current week (weekOffset === 0), any day strictly before today has passed and is locked
    if (weekOffset === 0 && dayIdx < currentDayIndex) return true;
    // If in a past week (weekOffset < 0), all 7 days are locked
    if (weekOffset < 0) return true;
    return false;
  };

  // Load Report Data
  useEffect(() => {
    fetchData();
  }, []);

  // Load and sync team members from SQL database
  useEffect(() => {
    const loadTeamFromApi = async () => {
      try {
        const res = await fetch('/api/team/members', {
          headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.members)) {
          setMembers(prev => {
            const merged = [...prev];
            data.members.forEach((dbM: any) => {
              if (dbM.status === 'inactive') return;
              const cleanDbName = dbM.name.toLowerCase().trim();
              const existingIdx = merged.findIndex(m => 
                m.id === ('u_' + dbM.id) || 
                m.id === String(dbM.id) ||
                m.name.toLowerCase().trim() === cleanDbName
              );
              if (existingIdx >= 0) {
                if (dbM.phone) {
                  merged[existingIdx] = {
                    ...merged[existingIdx],
                    phone: dbM.phone,
                    role: dbM.role === 'admin' ? 'Admin' : (merged[existingIdx].role || 'Team Member')
                  };
                }
              } else {
                merged.push({
                  id: 'u_' + dbM.id,
                  name: dbM.name,
                  phone: dbM.phone || undefined,
                  role: dbM.role === 'admin' ? 'Admin' : 'Team Member',
                });
              }
            });
            try {
              localStorage.setItem('gbp_global_target_members', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch (err) {
        console.error('Failed to load team from API', err);
      }
    };

    loadTeamFromApi();

    const handleTeamUpdate = () => {
      loadTeamFromApi();
    };

    window.addEventListener('gbp_team_updated', handleTeamUpdate);
    window.addEventListener('storage', handleTeamUpdate);
    return () => {
      window.removeEventListener('gbp_team_updated', handleTeamUpdate);
      window.removeEventListener('storage', handleTeamUpdate);
    };
  }, []);

  const fetchData = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/gbp/multi-profile-report${forceRefresh ? '?refresh=true' : ''}`);
      if (res.ok) {
        const data: MultiProfileReportData = await res.json();
        if (data.locations) {
          // Strict Profile Isolation: Non-admin members ONLY see their assigned profile
          if (currentUser && currentUser.role !== 'admin') {
            data.locations = data.locations.filter(l => isItemAllowedForMember(l.title || '', l.id || l.name || '', currentUser));
          }

          // Sort strictly lowest rating first (Ascending order)
          data.locations.sort((a, b) => {
            const ratingA = Number(a.averageRating) || 0;
            const ratingB = Number(b.averageRating) || 0;
            if (ratingA !== ratingB) return ratingA - ratingB;
            return (Number(a.totalReviews) || 0) - (Number(b.totalReviews) || 0);
          });
          // Retain only profiles that are NOT deselected
          let deselectedList: string[] = [];
          try {
            const raw = localStorage.getItem('gbp_whatsapp_deselected_profiles');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) deselectedList = parsed;
            }
          } catch {}
          const isDeselected = (l: ProfileReportItem) => {
            return deselectedList.includes(l.id) || 
                   Boolean(l.name && deselectedList.includes(l.name)) || 
                   Boolean(l.title && deselectedList.includes(l.title));
          };
          setSelectedProfileIds(data.locations.filter(l => !isDeselected(l)).map(l => l.id));
        }
        setReportData(data);
        loadTargetConfigs(data.locations || []);

        if (forceRefresh) {
          showNotice('Live review counts refreshed from Google Business Profile.');
        }
      } else {
        const errData = await res.json().catch(() => null);
        const msg = errData?.message || errData?.error || `Failed to fetch profiles (HTTP ${res.status})`;
        setErrorMessage(msg);
      }
    } catch (e: any) {
      console.error('Failed to load multi-profile report:', e);
      setErrorMessage(e?.message || 'Network error while loading profiles');
    } finally {
      setLoading(false);
    }
  };

  // Helper to load or generate default targets map for loaded locations
  const loadTargetConfigs = async (locs: ProfileReportItem[]) => {
    const storageKey = `gbp_review_targets_map_${weekInfo.startDateStr}`;
    let savedMap: { [id: string]: ProfileTargetConfig } = {};
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) savedMap = JSON.parse(stored);
    } catch {}

    // Fetch server targets and server delivery data
    let serverTargets: { [id: string]: ProfileTargetConfig } = {};
    let serverWeeklyDelivery: { [id: string]: number[] } = {};
    try {
      const res = await fetch(`/api/gbp/review-targets?week=${weekInfo.startDateStr}`, {
        headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.targets && typeof json.targets === 'object') {
          serverTargets = json.targets;
        }
        if (json.weeklyDelivery && typeof json.weeklyDelivery === 'object') {
          serverWeeklyDelivery = json.weeklyDelivery;
        }
      }
    } catch (e) {
      console.warn('Could not fetch server review targets:', e);
    }

    const newMap: { [id: string]: ProfileTargetConfig } = { ...serverTargets, ...savedMap };

    locs.forEach((loc) => {
      const permanentMembers = getAssignedStaffMembersForProfile(loc.title || loc.name || loc.id);
      const permanentIds = permanentMembers.map(m => m.id);
      const serverDeliv = serverWeeklyDelivery[loc.id] || [0, 0, 0, 0, 0, 0, 0];

      if (!newMap[loc.id]) {
        const weekly = 35;
        const daily = [5, 5, 5, 5, 5, 5, 5];
        newMap[loc.id] = {
          weeklyTarget: weekly,
          dailyTargets: daily,
          verifiedReviews: [...serverDeliv],
          isVerified: [false, false, false, false, false, false, false],
          assignedMemberIds: permanentIds.length > 0 ? permanentIds : [],
          memberAssignments: {}
        };
      } else {
        // Automatically ensure permanent assignments are locked in for existing map
        const existing = newMap[loc.id];
        const hasLegacy = !existing.assignedMemberIds || existing.assignedMemberIds.length === 0 || 
          existing.assignedMemberIds.some(id => id === 'm1' || id === 'm2' || id === 'm3');
        if (hasLegacy && permanentIds.length > 0) {
          existing.assignedMemberIds = permanentIds;
        }

        // If verifiedReviews are all 0 or empty, populate with real serverDeliv
        if (!existing.verifiedReviews || existing.verifiedReviews.every(v => v === 0)) {
          existing.verifiedReviews = [...serverDeliv];
        } else {
          // Merge server delivery for any day that was 0 or unverified
          for (let d = 0; d < 7; d++) {
            if ((existing.verifiedReviews[d] === 0 || !existing.isVerified?.[d]) && serverDeliv[d] > 0) {
              existing.verifiedReviews[d] = serverDeliv[d];
            }
          }
        }
      }
    });

    // Auto-lock past completed days at 12:00 AM / upon load
    locs.forEach((loc) => {
      const conf = newMap[loc.id];
      if (!conf) return;
      for (let d = 0; d < 7; d++) {
        const isPast = (weekOffset === 0 && d < currentDayIndex) || weekOffset < 0;
        if (isPast) {
          conf.isVerified[d] = true;
          if (conf.verifiedReviews[d] === 0) {
            const sDeliv = serverWeeklyDelivery[loc.id]?.[d] || 0;
            if (sDeliv > 0) {
              conf.verifiedReviews[d] = sDeliv;
            } else if ((loc.todayNewReviews || 0) > 0 && d === currentDayIndex - 1 && weekOffset === 0) {
              conf.verifiedReviews[d] = loc.todayNewReviews;
            }
          }
        }
      }
    });

    setTargetsMap(newMap);
  };

  // Re-load targets whenever the selected week changes
  useEffect(() => {
    if (reportData?.locations && reportData.locations.length > 0) {
      loadTargetConfigs(reportData.locations);
    }
  }, [weekOffset]);

  const saveTargetConfigs = async (updatedMap: { [id: string]: ProfileTargetConfig }) => {
    setTargetsMap(updatedMap);
    try {
      const storageKey = `gbp_review_targets_map_${weekInfo.startDateStr}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedMap));

      // Persist to historical daily snapshots for weekly & customized reports
      const historyKey = 'gbp_daily_locked_history';
      let historyMap: Record<string, { [id: string]: ProfileTargetConfig }> = {};
      try {
        const existing = localStorage.getItem(historyKey);
        if (existing) historyMap = JSON.parse(existing);
      } catch {}
      historyMap[weekInfo.startDateStr] = updatedMap;
      localStorage.setItem(historyKey, JSON.stringify(historyMap));

      // Save to server backend
      const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
      await fetch('/api/gbp/review-targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          week: weekInfo.startDateStr,
          targets: updatedMap
        })
      });
    } catch (e) {
      console.error('Failed to save targets map:', e);
    }
  };

  // ================= 1 TO 10 RANDOM DAILY TARGET GENERATOR =================
  const generateRandom1to10Targets = (weeklyTarget: number): number[] => {
    if (weeklyTarget <= 0) return [0, 0, 0, 0, 0, 0, 0];
    
    const maxCap = weeklyTarget > 70 ? Math.ceil(weeklyTarget / 5) : 10;
    const minCap = weeklyTarget >= 7 ? 1 : 0;

    let counts: number[] = Array.from({ length: 7 }, () => minCap);
    let remaining = weeklyTarget - (minCap * 7);

    if (remaining < 0) {
      counts = [0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < weeklyTarget; i++) counts[i] = 1;
      return counts;
    }

    let iterations = 0;
    while (remaining > 0 && iterations < 500) {
      iterations++;
      const eligibleIndices = counts
        .map((val, idx) => (val < maxCap ? idx : -1))
        .filter(idx => idx !== -1);
      
      if (eligibleIndices.length === 0) {
        counts[Math.floor(Math.random() * 7)] += 1;
        remaining--;
      } else {
        const chosen = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
        counts[chosen] += 1;
        remaining--;
      }
    }

    for (let i = counts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [counts[i], counts[j]] = [counts[j], counts[i]];
    }

    return counts;
  };

  // ================= SMART REBALANCE UNLOCKED DAYS =================
  // Keeps completed / past days (Monday, etc.) permanently frozen and unchanged!
  // Only re-distributes remaining target to active and future unlocked days.
  const rebalanceUnlockedDays = (
    weeklyTarget: number,
    currentDaily: number[],
    lockedIndices: number[]
  ): number[] => {
    const result = [...currentDaily];
    const unlockedIndices = [0, 1, 2, 3, 4, 5, 6].filter(i => !lockedIndices.includes(i));
    
    if (unlockedIndices.length === 0) {
      return result;
    }

    let lockedSum = 0;
    lockedIndices.forEach(idx => {
      lockedSum += (result[idx] || 0);
    });

    const remainingTarget = Math.max(0, weeklyTarget - lockedSum);
    const numUnlocked = unlockedIndices.length;

    const maxCap = remainingTarget > (numUnlocked * 10) 
      ? Math.ceil(remainingTarget / Math.max(1, numUnlocked - 1)) 
      : 10;
    const minCap = remainingTarget >= numUnlocked ? 1 : 0;

    let counts: number[] = Array.from({ length: numUnlocked }, () => minCap);
    let remaining = remainingTarget - (minCap * numUnlocked);

    if (remaining < 0) {
      counts = Array.from({ length: numUnlocked }, () => 0);
      for (let i = 0; i < remainingTarget; i++) counts[i] = 1;
    } else {
      let iter = 0;
      while (remaining > 0 && iter < 500) {
        iter++;
        const eligible = counts
          .map((v, i) => (v < maxCap ? i : -1))
          .filter(i => i !== -1);
        if (eligible.length === 0) {
          counts[Math.floor(Math.random() * numUnlocked)] += 1;
          remaining--;
        } else {
          const chosen = eligible[Math.floor(Math.random() * eligible.length)];
          counts[chosen] += 1;
          remaining--;
        }
      }

      for (let i = counts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [counts[i], counts[j]] = [counts[j], counts[i]];
      }
    }

    unlockedIndices.forEach((dayIdx, i) => {
      result[dayIdx] = counts[i];
    });

    return result;
  };

  // Re-shuffle a single profile's targets (Preserves completed/past days like Monday)
  const handleRandomizeProfile = (profileId: string) => {
    const current = targetsMap[profileId] || {
      weeklyTarget: 35,
      dailyTargets: [5, 5, 5, 5, 5, 5, 5],
      verifiedReviews: [0, 0, 0, 0, 0, 0, 0],
      isVerified: [false, false, false, false, false, false, false],
      assignedMemberIds: [],
      memberAssignments: {}
    };

    const lockedIndices: number[] = [];
    for (let i = 0; i < 7; i++) {
      if (isDayCompletedOrPast(i, current)) {
        lockedIndices.push(i);
      }
    }

    if (lockedIndices.length === 7) {
      showNotice('All days of this week are completed and locked. Cannot re-shuffle past completed week.');
      return;
    }

    const newDaily = rebalanceUnlockedDays(current.weeklyTarget, current.dailyTargets, lockedIndices);

    const updated = {
      ...targetsMap,
      [profileId]: {
        ...current,
        dailyTargets: newDaily
      }
    };
    saveTargetConfigs(updated);

    const lockedDayNames = lockedIndices.map(i => DAY_NAMES[i].en).join(', ');
    const msg = lockedIndices.length > 0
      ? `Re-shuffled remaining days (${lockedDayNames} kept locked & unchanged).`
      : 'Re-shuffled random 1–10 daily targets for profile.';
    showNotice(msg);
  };

  // Re-shuffle ALL profiles at once (Preserves completed/past days like Monday)
  const handleRandomizeAllProfiles = () => {
    const updated = { ...targetsMap };
    let totalLockedCount = 0;

    activeProfiles.forEach(p => {
      const current = updated[p.id] || {
        weeklyTarget: 35,
        dailyTargets: [5, 5, 5, 5, 5, 5, 5],
        verifiedReviews: [0, 0, 0, 0, 0, 0, 0],
        isVerified: [false, false, false, false, false, false, false],
        assignedMemberIds: [],
        memberAssignments: {}
      };

      const lockedIndices: number[] = [];
      for (let i = 0; i < 7; i++) {
        if (isDayCompletedOrPast(i, current)) {
          lockedIndices.push(i);
        }
      }

      if (lockedIndices.length < 7) {
        const newDaily = rebalanceUnlockedDays(current.weeklyTarget, current.dailyTargets, lockedIndices);
        updated[p.id] = {
          ...current,
          dailyTargets: newDaily
        };
        totalLockedCount += lockedIndices.length;
      }
    });

    saveTargetConfigs(updated);
    showNotice(
      totalLockedCount > 0
        ? `Re-shuffled remaining days for all profiles! (Past/completed days like Monday remain locked).`
        : `Re-shuffled random 1–10 daily targets for all ${activeProfiles.length} profiles!`
    );
  };

  // Update weekly target for a profile
  const handleUpdateWeeklyTarget = (profileId: string, val: number) => {
    const safeVal = Math.max(0, val);
    const current = targetsMap[profileId] || {
      weeklyTarget: safeVal,
      dailyTargets: [5, 5, 5, 5, 5, 5, 5],
      verifiedReviews: [0, 0, 0, 0, 0, 0, 0],
      isVerified: [false, false, false, false, false, false, false],
      assignedMemberIds: [],
      memberAssignments: {}
    };

    const lockedIndices: number[] = [];
    for (let i = 0; i < 7; i++) {
      if (isDayCompletedOrPast(i, current)) {
        lockedIndices.push(i);
      }
    }

    const newDaily = rebalanceUnlockedDays(safeVal, current.dailyTargets, lockedIndices);
    const updated = {
      ...targetsMap,
      [profileId]: {
        ...current,
        weeklyTarget: safeVal,
        dailyTargets: newDaily
      }
    };
    saveTargetConfigs(updated);
  };

  // Assign staff member to a profile
  const handleAssignMemberToProfile = (profileId: string, memberId: string) => {
    const current = targetsMap[profileId] || {
      weeklyTarget: 35,
      dailyTargets: [5, 5, 5, 5, 5, 5, 5],
      verifiedReviews: [0, 0, 0, 0, 0, 0, 0],
      isVerified: [false, false, false, false, false, false, false],
      assignedMemberIds: [],
      memberAssignments: {}
    };

    const updated = {
      ...targetsMap,
      [profileId]: {
        ...current,
        assignedMemberIds: memberId ? [memberId] : []
      }
    };
    saveTargetConfigs(updated);
    const memberName = members.find(m => m.id === memberId)?.name || 'All Staff';
    showNotice(`Assigned "${memberName}" to profile.`);
  };

  // Smart Dynamic Rebalancing when a day is modified/verified
  const handleVerifyDayForProfile = (
    profileId: string,
    dayIdx: number,
    deliveredCount: number,
    isVerifiedChecked: boolean
  ) => {
    const current = targetsMap[profileId];
    if (!current) return;

    const updatedVerified = [...current.verifiedReviews];
    const updatedIsVerified = [...current.isVerified];
    const updatedDaily = [...current.dailyTargets];

    updatedVerified[dayIdx] = Math.max(0, deliveredCount);
    updatedIsVerified[dayIdx] = isVerifiedChecked;

    // Past verified days remain locked
    let totalVerified = 0;
    const futureUnverifiedIndices: number[] = [];

    for (let i = 0; i < 7; i++) {
      if (updatedIsVerified[i]) {
        totalVerified += updatedVerified[i];
      } else if (i > dayIdx) {
        futureUnverifiedIndices.push(i);
      }
    }

    // Rebalance future days if available
    if (futureUnverifiedIndices.length > 0) {
      const remainingTargetNeeded = Math.max(0, current.weeklyTarget - totalVerified);
      const remainingCount = futureUnverifiedIndices.length;

      const base = Math.floor(remainingTargetNeeded / remainingCount);
      let rem = remainingTargetNeeded % remainingCount;

      futureUnverifiedIndices.forEach(fIdx => {
        const extra = rem > 0 ? 1 : 0;
        if (rem > 0) rem--;
        updatedDaily[fIdx] = Math.max(0, base + extra);
      });

      const diff = deliveredCount - current.dailyTargets[dayIdx];
      const note = diff >= 0
        ? `Delivered ${deliveredCount} (+${diff} surplus). Remaining ${remainingCount} days reduced automatically!`
        : `Delivered ${deliveredCount} (${diff} deficit). Remaining ${remainingCount} days increased by ${Math.abs(diff)} reviews to keep weekly target on track!`;
      showNotice(note);
    } else {
      showNotice(`Updated ${DAY_NAMES[dayIdx].en}: ${deliveredCount} reviews recorded.`);
    }

    const updated = {
      ...targetsMap,
      [profileId]: {
        ...current,
        dailyTargets: updatedDaily,
        verifiedReviews: updatedVerified,
        isVerified: updatedIsVerified
      }
    };
    saveTargetConfigs(updated);
  };

  // Member management
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    let cleanPhone = newMemberPhone.trim();
    if (cleanPhone && !cleanPhone.startsWith('+') && !cleanPhone.startsWith('91')) {
      const digits = cleanPhone.replace(/\D/g, '');
      if (digits.length === 10) cleanPhone = '+91 ' + digits;
    }

    const newM: TargetMember = {
      id: 'm_' + Date.now(),
      name: newMemberName.trim(),
      phone: cleanPhone || undefined,
      role: newMemberRole.trim() || 'Team Member'
    };
    const updated = [...members, newM];
    setMembers(updated);
    try {
      localStorage.setItem('gbp_global_target_members', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('gbp_team_updated', { detail: updated }));
    } catch {}

    // Persist to SQL database
    fetch('/api/team/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        name: newM.name,
        phone: newM.phone,
        role: 'member',
        status: 'active'
      })
    }).then(async res => {
      const data = await res.json();
      if (res.ok && data.success && data.member?.id) {
        setMembers(prev => prev.map(m => m.id === newM.id ? { ...m, id: 'u_' + data.member.id } : m));
      }
    }).catch(err => console.error('Failed to sync new member to SQL DB', err));

    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberRole('');
    showNotice(`Added team member "${newM.name}".`);
  };

  // Delete team member
  const handleDeleteMember = (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to delete member "${memberName}"?`)) return;
    const updated = members.filter(m => m.id !== memberId);
    setMembers(updated);
    try {
      localStorage.setItem('gbp_global_target_members', JSON.stringify(updated));
    } catch {}

    // Unassign from any profile target configs
    const updatedTargets = { ...targetsMap };
    let hasTargetChanges = false;
    Object.keys(updatedTargets).forEach(pId => {
      const conf = updatedTargets[pId];
      if (conf?.assignedMemberIds?.includes(memberId)) {
        updatedTargets[pId] = {
          ...conf,
          assignedMemberIds: conf.assignedMemberIds.filter(id => id !== memberId)
        };
        hasTargetChanges = true;
      }
    });

    if (hasTargetChanges) {
      saveTargetConfigs(updatedTargets);
    }

    showNotice(`Member "${memberName}" deleted successfully.`);
  };

  // 5:00 AM Morning Lock Scheduler: Locks daily target and delivered reviews automatically at 5:00 AM morning
  useEffect(() => {
    const checkAndScheduleMorningLock = () => {
      const now = new Date();
      const next5AM = new Date(now);
      if (now.getHours() >= 5) {
        next5AM.setDate(next5AM.getDate() + 1);
      }
      next5AM.setHours(5, 0, 0, 0); // 5:00 AM morning
      const msUntil5AM = Math.max(1000, next5AM.getTime() - now.getTime());

      const timerId = setTimeout(() => {
        // At 5:00 AM morning, lock previous day across all profiles
        if (reportData?.locations) {
          loadTargetConfigs(reportData.locations);
          showNotice('5:00 AM Morning reached: Target and review performance for the day locked and archived.');
        }
      }, msUntil5AM);

      return timerId;
    };

    const timer = checkAndScheduleMorningLock();
    return () => clearTimeout(timer);
  }, [reportData, currentDayIndex, weekOffset]);

  const showNotice = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered & Sorted active profiles (Lowest Rating First)
  const activeProfiles = useMemo(() => {
    if (!reportData?.locations) return [];
    return reportData.locations.filter(l => selectedProfileIds.includes(l.id));
  }, [reportData, selectedProfileIds]);

  // Aggregate stats across all profiles for activeViewDayIdx
  const todayAggregateStats = useMemo(() => {
    let combinedTarget = 0;
    let combinedDelivered = 0;
    let profilesMet = 0;

    activeProfiles.forEach(p => {
      const conf = targetsMap[p.id];
      const targetForDay = conf?.dailyTargets[activeViewDayIdx] ?? 5;
      const isToday = activeViewDayIdx === currentDayIndex && weekOffset === 0;
      const effectiveToday = Math.max(p.todayNewReviews || 0, Math.max(0, p.difference || 0));
      const deliveredToday = conf?.isVerified[activeViewDayIdx] 
        ? (conf.verifiedReviews[activeViewDayIdx] ?? 0)
        : (isToday ? (conf?.verifiedReviews?.[activeViewDayIdx] || effectiveToday) : (conf?.verifiedReviews?.[activeViewDayIdx] ?? 0));

      combinedTarget += targetForDay;
      combinedDelivered += deliveredToday;
      if (deliveredToday >= targetForDay) {
        profilesMet++;
      }
    });

    const successPct = combinedTarget > 0 ? Math.round((combinedDelivered / combinedTarget) * 100) : 0;
    return {
      totalProfiles: activeProfiles.length,
      combinedTarget,
      combinedDelivered,
      profilesMet,
      successPct
    };
  }, [activeProfiles, targetsMap, activeViewDayIdx, currentDayIndex, weekOffset]);

  // Helper to format staff names for a profile
  const getStaffTagForProfile = (profileId: string, idx: number): string => {
    const conf = targetsMap[profileId];
    if (conf?.assignedMemberIds && conf.assignedMemberIds.length > 0) {
      const assigned = members.filter(m => conf.assignedMemberIds!.includes(m.id));
      if (assigned.length > 0) {
        return assigned.map(m => `@${m.name}`).join(', ');
      }
    }
    const fallbackMember = members[idx % Math.max(1, members.length)];
    return fallbackMember ? `@${fallbackMember.name}` : '@All Branch Staff';
  };

  // Helper to format staff phone numbers with +91 for a profile
  const getStaffPhoneForProfile = (profileId: string, profileTitle: string): string => {
    const conf = targetsMap[profileId];
    if (conf?.assignedMemberIds && conf.assignedMemberIds.length > 0) {
      const assigned = members.filter(m => conf.assignedMemberIds!.includes(m.id));
      const phones = assigned.map(m => formatPhoneWithPlus91(m.phone)).filter(Boolean);
      if (phones.length > 0) {
        return phones.join(', ');
      }
    }
    return getAssignedStaffPhone(profileTitle);
  };

  // ================= 1. SUBAH (MORNING) TARGET KICKOFF REPORT =================
  const morningWhatsAppMessage = useMemo(() => {
    const selectedDayDate = getDayDate(activeViewDayIdx);
    const dateFormatted = selectedDayDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const dayName = DAY_NAMES[activeViewDayIdx].en;
    const isToday = activeViewDayIdx === currentDayIndex && weekOffset === 0;

    let lines: string[] = [];
    lines.push('*Daily Google Business Profile Report — Morning Targets*');
    lines.push(`Date: ${dateFormatted} | Day: ${dayName}${isToday ? ' (Today)' : ''}`);
    lines.push(`🎯 Total Target: ${todayAggregateStats.combinedTarget} Reviews`);
    lines.push('------------------------------------');
    lines.push('');

    if (activeProfiles.length === 0) {
      lines.push('_(No profiles selected)_');
    }

    activeProfiles.forEach((p, idx) => {
      const conf = targetsMap[p.id];
      const targetForDay = conf?.dailyTargets[activeViewDayIdx] ?? 5;
      const staffTag = getStaffTagForProfile(p.id, idx);
      const staffBracket = getAssignedStaffBracket(p.title);
      const staffPhone = getStaffPhoneForProfile(p.id, p.title);

      lines.push(`📍 ${idx + 1}. *${p.title}*${staffBracket ? ` ${staffBracket}` : ''}`);
      if (staffTag) {
        lines.push(`👤 Staff: ${staffTag}`);
      }
      if (staffPhone) {
        lines.push(`📞 Phone: ${staffPhone}`);
      }
      lines.push(`🎯 Target: ${targetForDay} Reviews`);
      lines.push(`Average Rating: ${p.averageRating}`);
      lines.push(`Current Total: ${p.totalReviews} Reviews`);
      lines.push('');
    });

    if (activeProfiles.length > 0) {
      lines.push('------------------------------------');
      lines.push('*Overall Summary:*');
      lines.push(`Total Profiles: ${todayAggregateStats.totalProfiles}`);
      lines.push(`Total Target: ${todayAggregateStats.combinedTarget} Reviews`);
      lines.push('');
    }

    if (customMorningNote.trim()) {
      lines.push(`*Note:* ${customMorningNote.trim()}`);
      lines.push('');
    }

    return lines.join('\n');
  }, [
    activeViewDayIdx,
    activeProfiles,
    targetsMap,
    todayAggregateStats,
    members,
    customMorningNote,
    weekInfo,
    currentDayIndex,
    weekOffset
  ]);

  // ================= 2. SHAAM (EVENING) TARGET EOD REPORT =================
  const eveningWhatsAppMessage = useMemo(() => {
    const selectedDayDate = getDayDate(activeViewDayIdx);
    const dateFormatted = selectedDayDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const dayName = DAY_NAMES[activeViewDayIdx].en;
    const isToday = activeViewDayIdx === currentDayIndex && weekOffset === 0;

    let lines: string[] = [];
    lines.push('*Daily Google Business Profile Report*');
    lines.push(`Date: ${dateFormatted} | Day: ${dayName}${isToday ? ' (Today)' : ''}`);
    lines.push('------------------------------------');
    lines.push('');

    if (activeProfiles.length === 0) {
      lines.push('_(No profiles selected)_');
    }

    activeProfiles.forEach((p, idx) => {
      const conf = targetsMap[p.id];
      const targetForDay = conf?.dailyTargets[activeViewDayIdx] ?? 5;
      const effectiveToday = Math.max(p.todayNewReviews || 0, Math.max(0, p.difference || 0));
      const deliveredCount = conf?.isVerified[activeViewDayIdx] 
        ? (conf.verifiedReviews[activeViewDayIdx] ?? 0) 
        : (isToday ? (conf?.verifiedReviews?.[activeViewDayIdx] || effectiveToday) : (conf?.verifiedReviews?.[activeViewDayIdx] ?? 0));
      const diff = deliveredCount - targetForDay;
      const staffTag = getStaffTagForProfile(p.id, idx);
      const staffBracket = getAssignedStaffBracket(p.title);
      const staffPhone = getStaffPhoneForProfile(p.id, p.title);

      lines.push(`📍 ${idx + 1}. *${p.title}*${staffBracket ? ` ${staffBracket}` : ''}`);
      if (staffPhone) {
        lines.push(`📞 Phone: ${staffPhone}`);
      }
      lines.push(`🎯 Target: ${targetForDay} Reviews | Delivered: ${deliveredCount} Reviews`);
      lines.push(`New Reviews ${isToday ? 'Today' : `(${dayName})`}: ${deliveredCount}`);
      lines.push(`Average Rating: ${p.averageRating}`);
      if (isToday) {
        lines.push(`Yesterday: ${p.beforeTodayReviews} ➔ Today: ${p.totalReviews}`);
      } else {
        lines.push(`Total Reviews: ${p.totalReviews}`);
      }
      lines.push('');
    });

    if (activeProfiles.length > 0) {
      lines.push('------------------------------------');
      lines.push('*Overall Summary:*');
      lines.push(`Total Profiles: ${todayAggregateStats.totalProfiles}`);
      lines.push(`🎯 Target Reviews: ${todayAggregateStats.combinedTarget} | Delivered: ${todayAggregateStats.combinedDelivered} (${todayAggregateStats.successPct}% Target Met)`);
      lines.push(`New Reviews ${isToday ? 'Today' : `(${dayName})`}: +${todayAggregateStats.combinedDelivered}`);
      const combinedTotal = activeProfiles.reduce((sum, p) => sum + (Number(p.totalReviews) || 0), 0);
      lines.push(`Combined Total Reviews: ${combinedTotal}`);
      const ratingSum = activeProfiles.reduce((sum, p) => sum + (Number(p.averageRating) || 0), 0);
      const avgRating = activeProfiles.length > 0 ? (ratingSum / activeProfiles.length).toFixed(1) : '5.0';
      lines.push(`Average Rating: ${avgRating}`);
      lines.push('');
    }

    if (customEveningNote.trim()) {
      lines.push(`*Note:* ${customEveningNote.trim()}`);
      lines.push('');
    }

    return lines.join('\n');
  }, [
    activeViewDayIdx,
    activeProfiles,
    targetsMap,
    todayAggregateStats,
    members,
    customEveningNote,
    weekInfo,
    currentDayIndex,
    weekOffset
  ]);

  const activeWhatsAppMessage = reportMode === 'morning' ? morningWhatsAppMessage : eveningWhatsAppMessage;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(activeWhatsAppMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(activeWhatsAppMessage);
    const clean = whatsappPhone.replace(/[^0-9]/g, '');
    const url = clean ? `https://wa.me/${clean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Helper to render genuine bold and styled formatting in the preview box
  // "bold vagera hai vo dikhna chahiye, star me nahi aana chahiye"
  const renderWhatsAppPreview = (content: string) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, lIdx) => {
      if (!line.trim()) {
        return <div key={lIdx} className="h-2" />;
      }
      const parts = line.split(/(\*[^*\n]+\*)/g);
      return (
        <div key={lIdx} className="leading-snug">
          {parts.map((part, pIdx) => {
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
              return (
                <strong key={pIdx} className="font-bold text-slate-900">
                  {part.slice(1, -1)}
                </strong>
              );
            }
            if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
              return (
                <em key={pIdx} className="italic text-slate-600">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  // ================= EXPORT WEEKLY PDF REPORT =================
  const handleExportWeeklyPdf = () => {
    const printWindow = window.open('', '_blank', 'width=950,height=750');
    if (!printWindow) {
      alert('Please allow popups to open the PDF print report.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GBP Consolidated Weekly Review Target & Delivery Report - ${weekInfo.formattedRange}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 15px; font-size: 11px; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; }
          .sub { color: #64748b; font-size: 11px; margin-top: 2px; }
          .kpi-row { display: flex; gap: 10px; margin-bottom: 15px; }
          .kpi { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #f8fafc; flex: 1; }
          .kpi-label { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #64748b; }
          .kpi-num { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #f1f5f9; color: #334155; font-weight: 700; text-align: left; padding: 6px 8px; border-bottom: 2px solid #cbd5e1; font-size: 10px; }
          td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
          .badge { padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; }
          .badge-hit { background: #dcfce7; color: #166534; }
          .badge-short { background: #fee2e2; color: #991b1b; }
          @media print { .no-print { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; background: #ecfdf5; border: 1px solid #6ee7b7; padding: 10px 14px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; color: #065f46;">All-Profile Weekly Review Target & Achievement PDF</span>
          <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 6px 14px; font-weight: bold; border-radius: 6px; cursor: pointer;">Print / Save as PDF</button>
        </div>

        <div class="header">
          <div>
            <h1 class="title">Google Business Profiles — Weekly Target & Achievement Report</h1>
            <div class="sub">Week Period: ${weekInfo.formattedRange} | Total Profiles: ${activeProfiles.length}</div>
          </div>
          <div style="text-align: right; font-weight: bold; color: #2563eb;">
            CONSOLIDATED WEEKLY REPORT
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi">
            <div class="kpi-label">Total Profiles</div>
            <div class="kpi-num">${activeProfiles.length}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Today's Combined Target</div>
            <div class="kpi-num">${todayAggregateStats.combinedTarget}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Delivered Today</div>
            <div class="kpi-num">${todayAggregateStats.combinedDelivered}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Target Completion</div>
            <div class="kpi-num">${todayAggregateStats.successPct}%</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Branch / Profile Title</th>
              <th>Rating</th>
              <th>Week Goal</th>
              <th>Mon</th>
              <th>Tue</th>
              <th>Wed</th>
              <th>Thu</th>
              <th>Fri</th>
              <th>Sat</th>
              <th>Sun</th>
              <th style="text-align: right;">Total Delivered</th>
              <th style="text-align: right;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${activeProfiles.map((p, idx) => {
              const conf = targetsMap[p.id];
              const dailyT = conf?.dailyTargets || [5,5,5,5,5,5,5];
              const verified = conf?.verifiedReviews || [0,0,0,0,0,0,0];
              const isVer = conf?.isVerified || [false,false,false,false,false,false,false];
              const totalDeliv = verified.reduce((a, b) => a + b, 0);
              const weeklyTarget = conf?.weeklyTarget || 35;
              const diff = totalDeliv - weeklyTarget;

              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${p.title}</strong> ${getAssignedStaffBracket(p.title)}</td>
                  <td>${p.averageRating} ★</td>
                  <td><strong>${weeklyTarget}</strong></td>
                  ${dailyT.map((t, dIdx) => {
                    const v = isVer[dIdx] ? verified[dIdx] : (dIdx === currentDayIndex ? p.todayNewReviews : '—');
                    return `<td><span style="color:#64748b;">${t}</span> ➔ <strong>${v}</strong></td>`;
                  }).join('')}
                  <td style="text-align: right; font-weight: bold;">${totalDeliv}</td>
                  <td style="text-align: right;">
                    <span class="badge ${diff >= 0 ? 'badge-hit' : 'badge-short'}">
                      ${diff >= 0 ? `+${diff} Achieved` : `${diff} Short`}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div style="margin-top: 25px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b;">
          <div>Generated on: ${new Date().toLocaleString()}</div>
          <div>Reputation & Review Growth Manager Signature: _______________________</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-3.5 sm:space-y-6 w-full max-w-full overflow-x-hidden animate-in fade-in duration-150">
      
      {/* ================= 1. PAGE HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>Daily Review Targets & Live Sync</span>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  All Profiles Live
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set weekly goals, auto-distribute random 1–10 daily targets, track morning assignments and evening EOD closures.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="px-2 sm:px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 shadow-2xs cursor-pointer transition-colors whitespace-nowrap shrink-0"
            title="Refresh live reviews from Google API"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span className="truncate">Live Sync</span>
          </button>

          <button
            onClick={handleExportWeeklyPdf}
            className="px-2 sm:px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 shadow-2xs cursor-pointer transition-colors whitespace-nowrap shrink-0"
            title="Print or export weekly PDF performance report"
          >
            <FileText className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span className="truncate">PDF Report</span>
          </button>

          <button
            onClick={() => setShowAddMemberModal(true)}
            className="px-2 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 shadow-2xs cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Team ({members.length})</span>
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold px-4 py-2.5 rounded-md flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span><strong>Error:</strong> {errorMessage}</span>
          </div>
          <button
            onClick={() => fetchData(true)}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
          >
            Retry Live Fetch
          </button>
        </div>
      )}

      {/* Notice Toast */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white hover:opacity-80 cursor-pointer">✕</button>
        </div>
      )}

      {/* ================= 2. WEEK SELECTOR & TODAY'S EVENING KPI ROW ================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        
        {/* Week & Day Selector (4 Cols) - Simple Compact Card */}
        <div className="md:col-span-4 bg-white border border-slate-200 rounded-md p-3 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Week Period
            </span>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline font-semibold cursor-pointer"
              >
                Reset This Week
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-1 bg-slate-50 border border-slate-200 rounded-md p-1">
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-200 rounded text-xs font-semibold cursor-pointer transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 text-center tracking-tight">
              {weekInfo.formattedRange}
            </span>
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-200 rounded text-xs font-semibold cursor-pointer transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Selector (Mon - Sun) */}
          <div>
            <div className="text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
              <span>Select Day:</span>
              <span className="text-[10px] text-blue-700 font-bold">
                {DAY_NAMES[activeViewDayIdx].en} ({getDayDate(activeViewDayIdx).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })})
                {activeViewDayIdx === currentDayIndex && weekOffset === 0 ? ' — Today' : ''}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DAY_NAMES.map((d, i) => {
                const isSelected = activeViewDayIdx === i;
                const isToday = i === currentDayIndex && weekOffset === 0;
                const isLockedDay = (weekOffset === 0 && i < currentDayIndex) || weekOffset < 0;
                const dayDate = getDayDate(i);

                return (
                  <button
                    key={d.en}
                    onClick={() => setActiveViewDayIdx(i)}
                    className={`py-1.5 rounded text-[11px] font-semibold text-center cursor-pointer transition-all border flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                        : isToday
                          ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                    title={`${d.en} (${dayDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })})${isToday ? ' — Today' : ''}${isLockedDay ? ' — Completed & Locked' : ''}`}
                  >
                    <span className="leading-tight">{d.en.slice(0, 3)}</span>
                    <span className={`text-[9px] leading-none ${isSelected ? 'text-blue-100' : isToday ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                      {dayDate.getDate()}
                    </span>
                    {isLockedDay && <Lock className={`w-2.5 h-2.5 mt-0.5 ${isSelected ? 'text-white' : 'text-slate-400'} shrink-0`} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4 Aggregate KPIs (8 Cols) - Compact Small Cards */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Card 1: Total Branches */}
          <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                Total Branches
              </span>
            </div>
            <div className="my-1">
              <span className="text-xl font-bold text-slate-800 font-mono">{todayAggregateStats.totalProfiles}</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              Profiles synced
            </div>
          </div>

          {/* Card 2: Target Today */}
          <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 truncate">
                <Target className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                {activeViewDayIdx === currentDayIndex && weekOffset === 0 ? 'Target Today' : `${DAY_NAMES[activeViewDayIdx].en}'s Target`}
              </span>
            </div>
            <div className="my-1">
              <span className="text-xl font-bold text-indigo-600 font-mono">{todayAggregateStats.combinedTarget}</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              Planned for {DAY_NAMES[activeViewDayIdx].en}
            </div>
          </div>

          {/* Card 3: Delivered Today */}
          <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {activeViewDayIdx === currentDayIndex && weekOffset === 0 ? 'Delivered Today' : `Delivered (${DAY_NAMES[activeViewDayIdx].en})`}
              </span>
            </div>
            <div className="my-1">
              <span className="text-xl font-bold text-emerald-600 font-mono">+{todayAggregateStats.combinedDelivered}</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold truncate">
              {todayAggregateStats.successPct}% target hit
            </div>
          </div>

          {/* Card 4: Target Met Status */}
          <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Target Met Status
              </span>
            </div>
            <div className="my-1">
              <span className="text-xl font-bold text-amber-600 font-mono">
                {todayAggregateStats.profilesMet} / {todayAggregateStats.totalProfiles}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              Branches achieved
            </div>
          </div>
        </div>

      </div>

      {/* ================= 3. ALL PROFILES TARGET & PERFORMANCE TABLE ================= */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>All Profiles Review Targets & Delivery — {DAY_NAMES[activeViewDayIdx].en}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Profiles strictly ordered lowest rating first. Completed past days remain locked and unchanged.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleRandomizeAllProfiles}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all whitespace-nowrap shrink-0"
              title="Auto-generate fresh random 1–10 targets for remaining unlocked days"
            >
              <Dices className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="whitespace-nowrap">Re-shuffle Remaining (1–10/Day)</span>
            </button>

            <div className="flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-semibold whitespace-nowrap shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
              <span className="whitespace-nowrap">Lowest Rating on Top</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-xs font-medium">Syncing live review data from Google Business Profile...</p>
          </div>
        ) : activeProfiles.length === 0 ? (
          <div className="p-10 text-center text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No Profiles Connected</p>
            <p className="text-xs">Please connect your Google Account to track review targets.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 pl-4"># Rank</th>
                  <th className="p-3">Branch / Location Profile</th>
                  <th className="p-3 text-center">Average Rating</th>
                  <th className="p-3 text-center">Weekly Target</th>
                  <th className="p-3 text-center">
                    {activeViewDayIdx === currentDayIndex && weekOffset === 0 ? "Today's Target" : `${DAY_NAMES[activeViewDayIdx].en}'s Target`}
                  </th>
                  <th className="p-3 text-center">
                    {activeViewDayIdx === currentDayIndex && weekOffset === 0 ? "Delivered Today" : `Delivered (${DAY_NAMES[activeViewDayIdx].en})`}
                  </th>
                  <th className="p-3 text-center">Target Met?</th>
                  <th className="p-3 text-center">
                    {activeViewDayIdx === currentDayIndex && weekOffset === 0 ? "Progress (Before ➔ Total)" : "Delivery Progress"}
                  </th>
                  <th className="p-3 text-right pr-4">Direct Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeProfiles.map((p, idx) => {
                  const conf = targetsMap[p.id] || {
                    weeklyTarget: 35,
                    dailyTargets: [5, 5, 5, 5, 5, 5, 5],
                    verifiedReviews: [0, 0, 0, 0, 0, 0, 0],
                    isVerified: [false, false, false, false, false, false, false],
                    assignedMemberIds: [],
                    memberAssignments: {}
                  };

                  const todayTarget = conf.dailyTargets[activeViewDayIdx] ?? 5;
                  const isVerified = conf.isVerified[activeViewDayIdx];
                  const isToday = activeViewDayIdx === currentDayIndex && weekOffset === 0;
                  const effectiveToday = Math.max(p.todayNewReviews || 0, Math.max(0, p.difference || 0));
                  const deliveredCount = isVerified 
                    ? (conf.verifiedReviews[activeViewDayIdx] ?? 0) 
                    : (isToday ? (conf.verifiedReviews[activeViewDayIdx] || effectiveToday) : (conf.verifiedReviews[activeViewDayIdx] ?? 0));
                  const diff = deliveredCount - todayTarget;
                  const isMet = deliveredCount >= todayTarget;
                  const ratingNum = Number(p.averageRating) || 0;
                  const isDayLocked = isDayCompletedOrPast(activeViewDayIdx, conf);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 pl-4 font-bold text-slate-400">
                        #{idx + 1}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                          <span>{p.title}</span>
                          {getAssignedStaffBracket(p.title) && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {getAssignedStaffBracket(p.title)}
                            </span>
                          )}
                        </div>
                        {p.address && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.address}</div>
                        )}
                        {/* Assigned Staff Member Display / Selector */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Users className="w-3 h-3 text-slate-400 shrink-0" />
                          {conf.assignedMemberIds && conf.assignedMemberIds.length > 1 ? (
                            <span className="text-[10px] bg-emerald-100/70 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                              {members.filter(m => conf.assignedMemberIds!.includes(m.id)).map(m => m.name).join(' & ')}
                            </span>
                          ) : (
                            <select
                              value={conf.assignedMemberIds?.[0] || ''}
                              onChange={(e) => handleAssignMemberToProfile(p.id, e.target.value)}
                              className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-semibold cursor-pointer outline-none max-w-[150px] truncate"
                              title="Assign staff member to this branch"
                            >
                              <option value="">All Branch Staff</option>
                              {members.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.role || 'Staff'})
                                </option>
                              ))}
                            </select>
                          )}
                          {getStaffPhoneForProfile(p.id, p.title) && (
                            <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-blue-600" />
                              {getStaffPhoneForProfile(p.id, p.title)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">
                            {p.averageRating} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </span>
                          {ratingNum < 4.5 && (
                            <span className="text-[9px] text-rose-600 font-bold mt-0.5">Priority Uplift</span>
                          )}
                        </div>
                      </td>

                      {/* Weekly Target Edit Input & Re-shuffle */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={conf.weeklyTarget}
                            onChange={(e) => handleUpdateWeeklyTarget(p.id, parseInt(e.target.value) || 0)}
                            className="w-13 px-1.5 py-0.5 text-xs text-center bg-slate-50 border border-slate-200 rounded font-bold text-slate-700 outline-none focus:border-blue-500"
                            title="Weekly Review Goal"
                          />
                          <button
                            type="button"
                            onClick={() => handleRandomizeProfile(p.id)}
                            title={isDayLocked ? "Re-shuffle remaining unlocked days (completed days stay frozen)" : "Re-shuffle 1–10 random daily targets"}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                          >
                            <Dices className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Today's Target */}
                      <td className="p-3 text-center font-bold text-blue-700 text-sm">
                        <span className="flex items-center justify-center gap-1">
                          {todayTarget}
                          {isDayLocked && (
                            <span title="Day is completed / locked">
                              <Lock className="w-2.5 h-2.5 text-slate-400" />
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Reviews Input / Sync */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={deliveredCount}
                            onChange={(e) => handleVerifyDayForProfile(p.id, activeViewDayIdx, parseInt(e.target.value) || 0, isVerified)}
                            className={`w-13 px-1.5 py-0.5 text-xs text-center font-bold rounded border outline-none ${
                              isVerified ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleVerifyDayForProfile(p.id, activeViewDayIdx, deliveredCount, !isVerified)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                              isVerified 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                            title="Mark verified / locks this day"
                          >
                            {isVerified ? '✓ Verified' : 'Verify'}
                          </button>
                        </div>
                      </td>

                      {/* Target Met Status with SVG Icons */}
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-full ${
                          isMet 
                            ? diff > 0 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isMet ? (
                            diff > 0 ? (
                              <>
                                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                                <span>+{diff} Exceeded</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Target Met</span>
                              </>
                            )
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>{Math.abs(diff)} Short</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Before ➔ Total Comparison / Progress */}
                      <td className="p-3 text-center text-xs">
                        {isToday ? (
                          <>
                            <span className="text-slate-500">{p.beforeTodayReviews}</span>
                            <span className="text-slate-300 mx-1">➔</span>
                            <strong className="text-blue-700 font-bold">{p.totalReviews}</strong>
                            {deliveredCount > 0 && (
                              <span className="text-[10px] text-emerald-600 font-bold ml-1">
                                (+{deliveredCount} new)
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="font-semibold text-slate-700">
                              {deliveredCount > 0 ? (
                                <span className="text-emerald-700 font-bold">+{deliveredCount} delivered</span>
                              ) : (
                                <span className="text-slate-400">0 delivered</span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400">Total: {p.totalReviews}</span>
                          </div>
                        )}
                      </td>

                      {/* Direct Link */}
                      <td className="p-3 text-right pr-4">
                        {p.reviewLink ? (
                          <a
                            href={p.reviewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline font-semibold text-[11px] inline-flex items-center gap-1"
                          >
                            <span>Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= 4. ALL-PROFILE CONSOLIDATED WHATSAPP MESSAGE (SUBAH & SHAAM) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: WhatsApp Mode & Controls (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="card p-5 space-y-4">
            
            {/* Header & Report Mode Switcher (Subah vs Shaam) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    All-Profile WhatsApp Target Report
                  </h3>
                  <p className="text-xs text-slate-400">
                    Consolidated report for all {activeProfiles.length} branches
                  </p>
                </div>
              </div>

              {/* Mode Switcher: Subah (Kickoff) vs Shaam (EOD Sync) */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setReportMode('morning')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    reportMode === 'morning'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Subah Kickoff</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportMode('evening')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    reportMode === 'evening'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Shaam Sync</span>
                  {isEveningTimeNow && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Auto-activated for evening post 6:30 PM" />
                  )}
                </button>
              </div>
            </div>

            {/* Note Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {reportMode === 'morning' 
                  ? 'Morning Note for Staff (Optional):' 
                  : 'Evening Note for Staff (Optional):'}
              </label>
              {reportMode === 'morning' ? (
                <textarea
                  rows={2}
                  value={customMorningNote}
                  onChange={(e) => setCustomMorningNote(e.target.value)}
                  placeholder="e.g. Please ensure today's targets are met."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500 font-normal"
                />
              ) : (
                <textarea
                  rows={2}
                  value={customEveningNote}
                  onChange={(e) => setCustomEveningNote(e.target.value)}
                  placeholder="e.g. Unmet targets will rebalance into upcoming days."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-normal"
                />
              )}
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target WhatsApp Recipient Phone:
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="+91 9610447938 or leave blank to choose group in WhatsApp"
                  className="w-full text-xs p-2 pl-8 bg-slate-50 border border-slate-200 rounded-lg outline-none font-normal"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className={`flex-1 py-2.5 px-4 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all ${
                  reportMode === 'morning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {reportMode === 'morning' 
                    ? 'Send Morning Kickoff Report' 
                    : 'Send Evening EOD Report'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
              >
                {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMsg ? 'Copied!' : 'Copy Message'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Chat Bubble Preview (6 Cols) */}
        <div className="lg:col-span-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              {reportMode === 'morning' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
              <span>{reportMode === 'morning' ? 'Subah Kickoff Preview' : 'Shaam EOD Sync Preview'}</span>
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
              reportMode === 'morning' ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'
            }`}>
              {reportMode === 'morning' ? 'Morning Assignment' : 'Evening Closure'}
            </span>
          </div>

          <div className="rounded-xl border border-slate-300 shadow-sm overflow-hidden bg-[#efeae2] max-h-[520px] flex flex-col">
            <div className={`text-white p-2.5 px-4 flex items-center justify-between shrink-0 ${
              reportMode === 'morning' ? 'bg-[#92400e]' : 'bg-[#008069]'
            }`}>
              <span className="font-bold text-xs flex items-center gap-1.5">
                {reportMode === 'morning' ? <Sun className="w-3.5 h-3.5 text-amber-200" /> : <Moon className="w-3.5 h-3.5 text-emerald-200" />}
                <span>{reportMode === 'morning' ? 'Morning Target Assignment Digest' : 'Evening EOD Review Sync Digest'}</span>
              </span>
              <span className="text-[10px] opacity-80">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="p-3.5 overflow-y-auto flex-1">
              <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-2xs text-xs font-sans text-slate-800 space-y-0.5">
                {renderWhatsAppPreview(activeWhatsAppMessage)}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ================= MODAL: MANAGE & ADD TEAM MEMBERS ================= */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex min-h-screen items-start sm:items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-lg p-5 sm:p-6 shadow-xl relative text-slate-800 my-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Team Group Members</h3>
                  <p className="text-[11px] text-slate-400">Manage, add or delete members assigned to daily review targets</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddMemberModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Section A: Existing Members List with Delete Button */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">
                  Current Team Members ({members.length})
                </label>
                <span className="text-[10px] text-slate-400">Click red trash icon to delete</span>
              </div>
              {members.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-center text-xs text-slate-500">
                  No members added yet. Add a team member using the form below.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-md p-1.5 bg-slate-50/50">
                  {members.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-md text-xs shadow-2xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-bold text-slate-800 truncate">{m.name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                          {m.role && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">{m.role}</span>}
                          {m.phone && <span className="text-slate-500 flex items-center gap-1 font-mono"><Phone className="w-2.5 h-2.5 text-emerald-600" />{m.phone}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(m.id, m.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer shrink-0"
                        title={`Delete ${m.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section B: Add New Member Form */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Add New Member</span>
              </h4>
              <form onSubmit={handleAddMember} className="space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Role / Department:</label>
                    <input
                      type="text"
                      placeholder="e.g. Front Desk / Sikar Branch"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">WhatsApp Phone (Optional):</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Member</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
