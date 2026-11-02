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
  Edit2
} from 'lucide-react';
import { Location } from '../types';
import { 
  OFFICIAL_REVIEW_TEAM, 
  getAssignedStaffBracket, 
  getAssignedStaffMembersForProfile,
  getAssignedStaffPhone
} from '../utils/reviewTeam';

export interface TargetMember {
  id: string;
  name: string;
  phone?: string;
  role?: string;
}

export interface MemberDailyAllocation {
  memberId: string;
  memberName: string;
  targetCount: number;
  deliveredCount: number;
}

export interface DayTargetItem {
  dayIndex: number; // 0 = Mon, 6 = Sun
  dayNameEn: string;
  dayNameHi: string;
  dateStr: string; // YYYY-MM-DD
  dateDisplay: string;
  targetReviews: number;
  verifiedReviews: number;
  isVerified: boolean;
  memberAllocations: MemberDailyAllocation[];
  notes?: string;
}

export interface WeeklyTargetPlan {
  weekKey: string; // e.g. 2026-W42
  startDate: string;
  endDate: string;
  weeklyTarget: number;
  members: TargetMember[];
  days: DayTargetItem[];
}

interface DailyReviewTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations?: Location[];
  activeLocation?: Location | null;
  userEmail?: string | null;
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

export const DailyReviewTargetModal: React.FC<DailyReviewTargetModalProps> = ({
  isOpen,
  onClose,
  locations = [],
  activeLocation = null,
  userEmail
}) => {
  if (!isOpen) return null;

  // Selected Location
  const [selectedLocKey, setSelectedLocKey] = useState<string>(
    activeLocation?.v4Name || activeLocation?.name || locations[0]?.v4Name || locations[0]?.name || 'default'
  );

  const currentLocation = useMemo(() => {
    return locations.find(l => (l.v4Name || l.name) === selectedLocKey) || activeLocation || locations[0] || null;
  }, [locations, selectedLocKey, activeLocation]);

  // Current Week Calculation (Monday to Sunday)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const weekInfo = useMemo(() => {
    const now = new Date();
    // Adjust for weekOffset (in weeks)
    now.setDate(now.getDate() + (weekOffset * 7));
    
    // Find Monday of this week
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (currentDay + 6) % 7; // Days since Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekKey = `${monday.getFullYear()}-W${Math.ceil((((monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7)}`;

    return {
      monday,
      sunday,
      weekKey,
      startDateStr: monday.toISOString().slice(0, 10),
      endDateStr: sunday.toISOString().slice(0, 10),
      formattedRange: `${monday.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
    };
  }, [weekOffset]);

  // Storage key for persistence
  const storageKey = useMemo(() => {
    const locHash = currentLocation ? (currentLocation.v4Name || currentLocation.name || 'default').replace(/[^a-zA-Z0-9]/g, '_') : 'default';
    return `gbp_target_plan_${locHash}_${weekInfo.startDateStr}`;
  }, [currentLocation, weekInfo.startDateStr]);

  const membersStorageKey = useMemo(() => {
    const locHash = currentLocation ? (currentLocation.v4Name || currentLocation.name || 'default').replace(/[^a-zA-Z0-9]/g, '_') : 'default';
    return `gbp_target_members_${locHash}`;
  }, [currentLocation]);

  // State: Weekly Target
  const [weeklyTarget, setWeeklyTarget] = useState<number>(35);
  const [days, setDays] = useState<DayTargetItem[]>([]);
  const [members, setMembers] = useState<TargetMember[]>([]);

  // Member Management Form
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  // Selected day for WhatsApp Message Generation (default to current day index)
  const currentDayIndex = useMemo(() => {
    const today = new Date().getDay(); // 0 is Sunday
    return (today + 6) % 7; // 0 = Mon, 6 = Sun
  }, []);
  const [selectedMessageDayIdx, setSelectedMessageDayIdx] = useState<number>(currentDayIndex);

  // WhatsApp note & phone
  const [whatsappPhone, setWhatsappPhone] = useState('+91 9610447938');
  const [customMsgNote, setCustomMsgNote] = useState('Please ensure all assigned reviews are collected and verified before 8:00 PM today.');
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Initialize or load plan from localStorage
  useEffect(() => {
    // 1. Load Members
    let loadedMembers: TargetMember[] = [];
    try {
      const storedGlobal = localStorage.getItem('gbp_global_target_members');
      const storedMembers = localStorage.getItem(membersStorageKey);
      const raw = storedGlobal || storedMembers;
      if (raw) {
        loadedMembers = JSON.parse(raw);
        const isOld = loadedMembers.some((m: any) => m.name === 'Rahul Sharma' || m.name === 'Amit Verma' || m.id === 'm1');
        if (isOld) {
          loadedMembers = OFFICIAL_REVIEW_TEAM;
        }
      }
    } catch {}

    if (!loadedMembers || loadedMembers.length === 0) {
      // Official team members permanently
      loadedMembers = OFFICIAL_REVIEW_TEAM;
      try {
        localStorage.setItem(membersStorageKey, JSON.stringify(loadedMembers));
      } catch {}
    }
    setMembers(loadedMembers);

    // 2. Load Plan for this week
    let existingPlan: WeeklyTargetPlan | null = null;
    try {
      const storedPlan = localStorage.getItem(storageKey);
      if (storedPlan) {
        existingPlan = JSON.parse(storedPlan);
      }
    } catch {}

    if (existingPlan && existingPlan.days && existingPlan.days.length === 7) {
      setWeeklyTarget(existingPlan.weeklyTarget || 35);
      setDays(existingPlan.days);
    } else {
      // Create initial plan for 7 days
      initNewPlan(35, loadedMembers);
    }
  }, [storageKey, membersStorageKey, weekInfo.startDateStr]);

  // Sync team members from SQL database
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
              localStorage.setItem(membersStorageKey, JSON.stringify(merged));
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
  }, [membersStorageKey]);

  // Helper to generate initial 7 days
  const initNewPlan = (targetTotal: number, currentMembers: TargetMember[]) => {
    const generatedDays = generateBalancedDailyTargets(targetTotal, currentMembers);
    setDays(generatedDays);
    setWeeklyTarget(targetTotal);
    savePlan(targetTotal, generatedDays);
  };

  // Generate balanced random targets strictly between 1 and 10 per day that sum up to targetTotal
  const generateBalancedDailyTargets = (targetTotal: number, currentMembers: TargetMember[]): DayTargetItem[] => {
    const numDays = 7;
    let counts: number[] = [];

    if (targetTotal <= 0) {
      counts = [0, 0, 0, 0, 0, 0, 0];
    } else {
      const maxCap = targetTotal > 70 ? Math.ceil(targetTotal / 5) : 10;
      const minCap = targetTotal >= 7 ? 1 : 0;

      counts = Array.from({ length: 7 }, () => minCap);
      let remaining = targetTotal - (minCap * 7);

      if (remaining < 0) {
        counts = [0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < targetTotal; i++) counts[i] = 1;
      } else {
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

        // Shuffle days so high/low variations are randomized across Monday-Sunday
        for (let i = counts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [counts[i], counts[j]] = [counts[j], counts[i]];
        }
      }
    }

    // Build the 7 DayTargetItems
    const monday = new Date(weekInfo.monday);
    return DAY_NAMES.map((dName, idx) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + idx);
      const dateStr = dayDate.toISOString().slice(0, 10);
      const dateDisplay = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayTarget = counts[idx] || 0;

      // Distribute dayTarget among members
      const allocations = allocateMembersForDay(dayTarget, currentMembers);

      return {
        dayIndex: idx,
        dayNameEn: dName.en,
        dayNameHi: dName.hi,
        dateStr,
        dateDisplay,
        targetReviews: dayTarget,
        verifiedReviews: 0,
        isVerified: false,
        memberAllocations: allocations,
        notes: ''
      };
    });
  };

  // Distribute a single day's target among team members
  const allocateMembersForDay = (dayTarget: number, memberList: TargetMember[]): MemberDailyAllocation[] => {
    if (!memberList || memberList.length === 0) return [];
    if (dayTarget <= 0) {
      return memberList.map(m => ({
        memberId: m.id,
        memberName: m.name,
        targetCount: 0,
        deliveredCount: 0
      }));
    }

    const n = memberList.length;
    // Equal distribution with remainder
    const base = Math.floor(dayTarget / n);
    let remainder = dayTarget % n;

    return memberList.map((m, mIdx) => {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder--;
      return {
        memberId: m.id,
        memberName: m.name,
        targetCount: base + extra,
        deliveredCount: 0
      };
    });
  };

  // Save current plan to localStorage
  const savePlan = (targetVal: number, daysList: DayTargetItem[]) => {
    try {
      const plan: WeeklyTargetPlan = {
        weekKey: weekInfo.weekKey,
        startDate: weekInfo.startDateStr,
        endDate: weekInfo.endDateStr,
        weeklyTarget: targetVal,
        members,
        days: daysList
      };
      localStorage.setItem(storageKey, JSON.stringify(plan));
    } catch (e) {
      console.error('Failed to save target plan:', e);
    }
  };

  // Save members
  const saveMembersList = (updated: TargetMember[]) => {
    setMembers(updated);
    try {
      localStorage.setItem(membersStorageKey, JSON.stringify(updated));
      localStorage.setItem('gbp_global_target_members', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('gbp_team_updated', { detail: updated }));
    } catch {}
  };

  // Handle Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMemberName.trim();
    if (!name) return;

    let cleanPhone = newMemberPhone.trim();
    if (cleanPhone && !cleanPhone.startsWith('+') && !cleanPhone.startsWith('91')) {
      const digits = cleanPhone.replace(/\D/g, '');
      if (digits.length === 10) cleanPhone = '+91 ' + digits;
    }

    const newM: TargetMember = {
      id: 'm_' + Date.now(),
      name,
      phone: cleanPhone || undefined,
      role: newMemberRole.trim() || 'Team Member'
    };
    const updated = [...members, newM];
    saveMembersList(updated);

    // Save to SQL database in background
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
    setShowAddMember(false);

    // Update current days member allocations
    const updatedDays = days.map(day => {
      const updatedAlloc = allocateMembersForDay(day.targetReviews, updated);
      return {
        ...day,
        memberAllocations: updatedAlloc
      };
    });
    setDays(updatedDays);
    savePlan(weeklyTarget, updatedDays);
    showNotice(`Added team member "${name}" and refreshed target splits.`);
  };

  const handleRemoveMember = (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from review target assignments?`)) return;
    const updated = members.filter(m => m.id !== id);
    saveMembersList(updated);

    const updatedDays = days.map(day => {
      const updatedAlloc = allocateMembersForDay(day.targetReviews, updated);
      return {
        ...day,
        memberAllocations: updatedAlloc
      };
    });
    setDays(updatedDays);
    savePlan(weeklyTarget, updatedDays);
    showNotice(`Removed ${name}. Targets reallocated across remaining members.`);
  };

  // User requests Random Auto-Distribute of Weekly Target
  const handleRandomizeDailyTargets = () => {
    const target = Math.max(1, weeklyTarget);
    const updatedDays = generateBalancedDailyTargets(target, members);
    setDays(updatedDays);
    savePlan(target, updatedDays);
    showNotice(`Auto-generated daily targets (1-10 random/balanced) for ${target} weekly reviews.`);
  };

  // ================= SMART AUTO-ADJUSTMENT LOGIC =================
  // Rule from user: "modify kare to review piche ke din me change na ho aage ke din me vo kam jada apne aap adjust ho jaye"
  const handleUpdateDayVerification = (
    dayIndex: number, 
    newVerified: number, 
    isVerifiedChecked: boolean
  ) => {
    const updatedDays = [...days];
    const currentDay = { ...updatedDays[dayIndex] };

    currentDay.verifiedReviews = Math.max(0, newVerified);
    currentDay.isVerified = isVerifiedChecked;
    updatedDays[dayIndex] = currentDay;

    // Calculate total verified reviews so far across all verified days
    let totalVerified = 0;
    const unverifiedIndices: number[] = [];

    updatedDays.forEach((d, idx) => {
      if (d.isVerified) {
        totalVerified += d.verifiedReviews;
      } else if (idx > dayIndex) {
        // Only future unverified days are eligible for rebalancing!
        unverifiedIndices.push(idx);
      }
    });

    // If there are future unverified days, rebalance the remaining target
    if (unverifiedIndices.length > 0) {
      const remainingTargetNeeded = Math.max(0, weeklyTarget - totalVerified);
      const remainingCount = unverifiedIndices.length;

      // Distribute remainingTargetNeeded among remaining unverified days
      const baseShare = Math.floor(remainingTargetNeeded / remainingCount);
      let rem = remainingTargetNeeded % remainingCount;

      unverifiedIndices.forEach((fIdx) => {
        const extra = rem > 0 ? 1 : 0;
        if (rem > 0) rem--;
        const newDayTarget = Math.max(0, baseShare + extra);
        
        updatedDays[fIdx] = {
          ...updatedDays[fIdx],
          targetReviews: newDayTarget,
          memberAllocations: allocateMembersForDay(newDayTarget, members)
        };
      });

      const diff = currentDay.verifiedReviews - currentDay.targetReviews;
      const adjustMsg = diff >= 0
        ? `Verified Day: Delivered ${currentDay.verifiedReviews} reviews (+${diff} surplus). Remaining ${remainingCount} days reduced automatically!`
        : `Verified Day: Delivered ${currentDay.verifiedReviews} reviews (${diff} deficit). Remaining ${remainingCount} days increased by ${Math.abs(diff)} reviews to keep week target on track!`;
      
      showNotice(adjustMsg);
    } else {
      showNotice(`Updated ${currentDay.dayNameEn}: ${currentDay.verifiedReviews} reviews recorded.`);
    }

    setDays(updatedDays);
    savePlan(weeklyTarget, updatedDays);
  };

  // Manual update of target reviews for a single day
  const handleManualDayTargetChange = (dayIndex: number, newTarget: number) => {
    const updatedDays = [...days];
    const safeTarget = Math.max(0, newTarget);
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      targetReviews: safeTarget,
      memberAllocations: allocateMembersForDay(safeTarget, members)
    };
    
    // Recalculate weekly target sum
    const newWeeklyTotal = updatedDays.reduce((acc, d) => acc + d.targetReviews, 0);
    setWeeklyTarget(newWeeklyTotal);
    setDays(updatedDays);
    savePlan(newWeeklyTotal, updatedDays);
  };

  // Helper notice toast
  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalTarget = weeklyTarget;
    const totalVerified = days.reduce((acc, d) => acc + (d.isVerified ? d.verifiedReviews : 0), 0);
    const verifiedDaysCount = days.filter(d => d.isVerified).length;
    const completionPct = totalTarget > 0 ? Math.round((totalVerified / totalTarget) * 100) : 0;
    const netVariance = totalVerified - days.filter(d => d.isVerified).reduce((acc, d) => acc + d.targetReviews, 0);

    return {
      totalTarget,
      totalVerified,
      verifiedDaysCount,
      completionPct,
      netVariance
    };
  }, [weeklyTarget, days]);

  // Selected Day for WhatsApp message
  const messageDay = useMemo(() => {
    return days[selectedMessageDayIdx] || days[0] || null;
  }, [days, selectedMessageDayIdx]);

  // Generate WhatsApp Message text
  const generatedWhatsAppMessage = useMemo(() => {
    if (!messageDay) return '';

    const businessTitle = currentLocation?.title || 'Google Business Profile';
    const staffBracket = getAssignedStaffBracket(businessTitle);
    const placeId = currentLocation?.metadata?.placeId;
    const reviewLink = placeId 
      ? `https://search.google.com/local/writereview?placeid=${placeId}`
      : 'https://search.google.com/local/writereview';

    let lines: string[] = [];
    lines.push('🎯 *DAILY GOOGLE REVIEW TARGET*');
    lines.push(`🏢 *Location:* ${businessTitle}${staffBracket ? ` ${staffBracket}` : ''}`);
    const staffPhone = getAssignedStaffPhone(businessTitle);
    if (staffPhone) {
      lines.push(`📞 *Phone:* ${staffPhone}`);
    }
    lines.push(`📅 *Day:* ${messageDay.dayNameEn} (${messageDay.dayNameHi}) | ${messageDay.dateDisplay}`);
    lines.push('------------------------------------');
    lines.push(`🎯 *Today\'s Branch Target:* ${messageDay.targetReviews} Reviews`);
    lines.push(`📊 *Weekly Goal Progress:* ${stats.totalVerified} / ${stats.totalTarget} Reviews (${stats.completionPct}%)`);
    lines.push('');

    if (messageDay.memberAllocations && messageDay.memberAllocations.length > 0) {
      lines.push('👥 *Team Member Targets Today:*');
      messageDay.memberAllocations.forEach((alloc) => {
        lines.push(`• @${alloc.memberName} ➔ *${alloc.targetCount} Reviews*`);
      });
      lines.push('');
    }

    lines.push(`📍 *Official 5-Star Review Link:*`);
    lines.push(reviewLink);
    lines.push('');

    if (customMsgNote.trim()) {
      lines.push(`💬 *Instruction:* ${customMsgNote.trim()}`);
      lines.push('');
    }

    lines.push('------------------------------------');
    lines.push('⚡ _Please ensure 100% review compliance today._');

    return lines.join('\n');
  }, [messageDay, currentLocation, stats, customMsgNote]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generatedWhatsAppMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(generatedWhatsAppMessage);
    const cleanPhone = whatsappPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // ================= WEEKLY PDF REPORT GENERATOR =================
  const handlePrintPdfReport = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Please allow popups to view and save the Weekly PDF Report.');
      return;
    }

    const businessTitle = currentLocation?.title || 'Google Business Profile';
    const address = currentLocation?.address || '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GBP Weekly Review Target & Achievement Report - ${weekInfo.formattedRange}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background: #fff;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.5;
          }
          .header {
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 18px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
          .brand-sub {
            color: #64748b;
            font-size: 11px;
            margin-top: 3px;
          }
          .report-tag {
            background: #e0f2fe;
            color: #0369a1;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 11px;
            text-align: right;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }
          .kpi-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            background: #f8fafc;
          }
          .kpi-label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
          }
          .kpi-val {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-align: left;
            padding: 8px 10px;
            border-bottom: 2px solid #cbd5e1;
            font-size: 11px;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11px;
          }
          .badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 10px;
          }
          .badge-achieved { background: #dcfce7; color: #15803d; }
          .badge-exceeded { background: #fef08a; color: #854d0e; }
          .badge-missed { background: #fee2e2; color: #b91c1c; }
          .badge-pending { background: #f1f5f9; color: #64748b; }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            color: #94a3b8;
            font-size: 10px;
          }
          .signatures {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          .sig-box {
            width: 200px;
            border-top: 1px solid #64748b;
            padding-top: 4px;
            text-align: center;
            font-size: 11px;
            color: #475569;
          }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; background: #ecfdf5; border: 1px solid #6ee7b7; padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; color: #065f46;">Ready to print or save as PDF (Click Print below or Ctrl+P)</span>
          <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 6px 14px; font-weight: bold; border-radius: 6px; cursor: pointer;">Print / Save as PDF</button>
        </div>

        <div class="header">
          <div>
            <h1 class="brand-title">${businessTitle} ${getAssignedStaffBracket(businessTitle)}</h1>
            <div class="brand-sub">${address ? `${address} | ` : ''}Google Business Profile Target Report</div>
          </div>
          <div class="report-tag">
            WEEKLY TARGET REPORT<br>
            <span style="font-size: 12px; color: #0284c7;">${weekInfo.formattedRange}</span>
          </div>
        </div>

        <div class="summary-grid">
          <div class="kpi-card">
            <div class="kpi-label">Weekly Review Target</div>
            <div class="kpi-val">${stats.totalTarget}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Delivered / Verified</div>
            <div class="kpi-val" style="color: #059669;">${stats.totalVerified}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Goal Completion Rate</div>
            <div class="kpi-val">${stats.completionPct}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Net Variance</div>
            <div class="kpi-val" style="color: ${stats.netVariance >= 0 ? '#059669' : '#e11d48'};">
              ${stats.netVariance >= 0 ? `+${stats.netVariance} (Ahead)` : `${stats.netVariance} (Deficit)`}
            </div>
          </div>
        </div>

        <h3 style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Day-by-Day Target vs Delivery Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Day & Date</th>
              <th style="text-align: center;">Target Reviews</th>
              <th style="text-align: center;">Actual Delivered</th>
              <th style="text-align: center;">Variance (+/-)</th>
              <th style="text-align: center;">Status</th>
              <th>Team Member Targets</th>
            </tr>
          </thead>
          <tbody>
            ${days.map(d => {
              const diff = d.verifiedReviews - d.targetReviews;
              let statusBadge = '';
              if (!d.isVerified) {
                statusBadge = '<span class="badge badge-pending">Pending</span>';
              } else if (diff === 0) {
                statusBadge = '<span class="badge badge-achieved">Achieved ✓</span>';
              } else if (diff > 0) {
                statusBadge = `<span class="badge badge-exceeded">+${diff} Exceeded 🔥</span>`;
              } else {
                statusBadge = `<span class="badge badge-missed">${diff} Missed</span>`;
              }

              const memberBreakdown = d.memberAllocations && d.memberAllocations.length > 0
                ? d.memberAllocations.map(m => `${m.memberName} (${m.targetCount})`).join(', ')
                : 'All Branch Staff';

              return `
                <tr>
                  <td><strong>${d.dayNameEn} (${d.dayNameHi})</strong><br><span style="color: #64748b; font-size: 10px;">${d.dateDisplay}</span></td>
                  <td style="text-align: center; font-weight: bold;">${d.targetReviews}</td>
                  <td style="text-align: center; font-weight: bold; color: ${d.isVerified ? (diff >= 0 ? '#15803d' : '#b91c1c') : '#64748b'};">
                    ${d.isVerified ? d.verifiedReviews : '—'}
                  </td>
                  <td style="text-align: center; font-weight: bold;">
                    ${d.isVerified ? (diff > 0 ? `+${diff}` : diff) : '—'}
                  </td>
                  <td style="text-align: center;">${statusBadge}</td>
                  <td style="font-size: 10px; color: #475569;">${memberBreakdown}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        ${members.length > 0 ? `
          <h3 style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Team Member Weekly Target Summary</h3>
          <table>
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Role / Phone</th>
                <th style="text-align: center;">Weekly Total Assigned</th>
                <th style="text-align: center;">Daily Average</th>
              </tr>
            </thead>
            <tbody>
              ${members.map(m => {
                const memberTotal = days.reduce((acc, d) => {
                  const alloc = d.memberAllocations?.find(a => a.memberId === m.id);
                  return acc + (alloc ? alloc.targetCount : 0);
                }, 0);
                const dailyAvg = (memberTotal / 7).toFixed(1);

                return `
                  <tr>
                    <td><strong>${m.name}</strong></td>
                    <td style="color: #64748b;">${m.role || 'Member'}${m.phone ? ` • ${m.phone}` : ''}</td>
                    <td style="text-align: center; font-weight: bold;">${memberTotal} Reviews</td>
                    <td style="text-align: center;">${dailyAvg} / day</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="signatures">
          <div class="sig-box">Branch Head / Supervisor</div>
          <div class="sig-box">GBP Reputation Manager</div>
        </div>

        <div class="footer">
          <span>Generated via GBP Live Sync & Reputation Automation Platform</span>
          <span>Date: ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex min-h-screen items-start sm:items-center justify-center p-2 sm:p-4 md:p-6 transition-all duration-200">
      
      {/* Main Modal Container - Fixed flex-col with max-height to prevent top-clipping on desktop */}
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* ================= MODAL HEADER (Fixed Top) ================= */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                  Daily Review Target & Team Planner
                </h3>
                <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  Weekly ➔ Daily Split
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Set weekly goals, auto-distribute 1–10 daily targets, assign team members, and verify progress.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Location Selector */}
            {locations.length > 1 && (
              <select
                value={selectedLocKey}
                onChange={(e) => setSelectedLocKey(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none cursor-pointer max-w-[200px] truncate shadow-2xs"
              >
                {locations.map(loc => (
                  <option key={loc.v4Name || loc.name} value={loc.v4Name || loc.name}>
                    {loc.title}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Toast Banner */}
        {noticeMessage && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between shrink-0 shadow-inner">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>{noticeMessage}</span>
            </div>
            <button onClick={() => setNoticeMessage(null)} className="text-white hover:opacity-80">✕</button>
          </div>
        )}

        {/* ================= MODAL BODY (Scrollable) ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">
          
          {/* Section 1: Weekly Goal & Auto-Generator Controls */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Week & Target Input */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Current Week Plan
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setWeekOffset(prev => prev - 1)}
                  className="p-1 px-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-md text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                  title="Previous Week"
                >
                  ◀ Prev
                </button>
                <span className="text-xs font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-md shadow-2xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  {weekInfo.formattedRange}
                </span>
                <button
                  onClick={() => setWeekOffset(prev => prev + 1)}
                  className="p-1 px-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-md text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                  title="Next Week"
                >
                  Next ▶
                </button>
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer ml-1"
                  >
                    Reset to This Week
                  </button>
                )}
              </div>
            </div>

            {/* Target Value & Auto Distribute Trigger */}
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Weekly Review Target:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={weeklyTarget}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setWeeklyTarget(val);
                    }}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-blue-600 outline-none focus:border-blue-500 shadow-2xs"
                  />
                  <span className="text-xs text-slate-500 font-semibold">Reviews</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRandomizeDailyTargets}
                className="mt-4 sm:mt-0 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                title="Automatically distribute weekly target across 7 days with realistic 1-10 variations"
              >
                <Dices className="w-4 h-4" />
                <span>Auto Distribute (1–10/Day)</span>
              </button>
            </div>
          </div>

          {/* Section 2: Overall Progress Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-3.5 border-l-4 border-l-blue-600">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Week Target</span>
              <div className="text-xl font-bold text-slate-800 mt-0.5">{stats.totalTarget}</div>
              <span className="text-[10px] text-slate-400">Total planned</span>
            </div>

            <div className="card p-3.5 border-l-4 border-l-emerald-600">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Delivered / Verified</span>
              <div className="text-xl font-bold text-emerald-600 mt-0.5">{stats.totalVerified}</div>
              <span className="text-[10px] text-emerald-700 font-semibold">{stats.verifiedDaysCount} / 7 days verified</span>
            </div>

            <div className="card p-3.5 border-l-4 border-l-indigo-600">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Goal Completion</span>
              <div className="text-xl font-bold text-indigo-600 mt-0.5">{stats.completionPct}%</div>
              <span className="text-[10px] text-slate-400">{Math.max(0, stats.totalTarget - stats.totalVerified)} reviews remaining</span>
            </div>

            <div className="card p-3.5 border-l-4 border-l-amber-500">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Pace Variance</span>
              <div className={`text-xl font-bold mt-0.5 ${stats.netVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stats.netVariance >= 0 ? `+${stats.netVariance}` : stats.netVariance}
              </div>
              <span className="text-[10px] text-slate-400">
                {stats.netVariance >= 0 ? 'Ahead of schedule' : 'Behind schedule'}
              </span>
            </div>
          </div>

          {/* Section 3: Team Group Members Mention List */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Assigned Team Members ({members.length})
                </h4>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                  Included in daily @mentions
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddMember(prev => !prev)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddMember ? 'Cancel' : 'Add Member'}</span>
              </button>
            </div>

            {/* Add Member Form */}
            {showAddMember && (
              <form onSubmit={handleAddMember} className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Member Name (e.g. Rahul Sharma)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="flex-1 min-w-[150px] p-2 bg-white border border-blue-300 rounded-md outline-none"
                />
                <input
                  type="text"
                  placeholder="Role (e.g. Front Desk)"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-36 p-2 bg-white border border-blue-300 rounded-md outline-none"
                />
                <input
                  type="text"
                  placeholder="Phone (+91...)"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="w-36 p-2 bg-white border border-blue-300 rounded-md outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold cursor-pointer transition-colors whitespace-nowrap shadow-2xs"
                >
                  Save Member
                </button>
              </form>
            )}

            {/* Members Chips List */}
            <div className="flex flex-wrap gap-2 pt-1">
              {members.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No members added yet. Click Add Member to assign daily reviews.</p>
              ) : (
                members.map((m) => {
                  const memberWeekTotal = days.reduce((acc, d) => {
                    const alloc = d.memberAllocations?.find(a => a.memberId === m.id);
                    return acc + (alloc ? alloc.targetCount : 0);
                  }, 0);

                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <div>
                        <strong className="text-slate-800">@{m.name}</strong>
                        <span className="text-[10px] text-slate-500 ml-1.5">
                          ({memberWeekTotal} rev/wk)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.id, m.name)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                        title="Remove member"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 4: Day-by-Day (वार) Target & Dynamic Verification Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Day-by-Day Target & Verification (Monday ➔ Sunday)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Update actual reviews below: Past verified days are strictly preserved, while upcoming days auto-adjust!
                </p>
              </div>

              <span className="text-[11px] text-slate-400 italic">
                * Click "Select for Message" to generate today\'s WhatsApp text
              </span>
            </div>

            {/* 7 Days Table / Cards */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs divide-y divide-slate-100">
              {days.map((day, idx) => {
                const isSelected = selectedMessageDayIdx === idx;
                const isPastOrToday = idx <= currentDayIndex && weekOffset <= 0;
                const diff = day.verifiedReviews - day.targetReviews;

                return (
                  <div
                    key={day.dayIndex}
                    className={`p-3.5 sm:p-4 transition-colors ${
                      isSelected ? 'bg-blue-50/40 border-l-4 border-l-blue-600' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      
                      {/* Day & Date Title */}
                      <div className="flex items-start gap-3 min-w-[200px]">
                        <div className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0 font-bold ${
                          day.isVerified 
                            ? 'bg-emerald-100 text-emerald-800'
                            : idx === currentDayIndex && weekOffset === 0
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          <span className="text-[10px] leading-none uppercase">{day.dayNameEn.slice(0, 3)}</span>
                          <span className="text-xs leading-tight">{day.dateDisplay.split(' ')[1] || (idx + 1)}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs sm:text-sm text-slate-800">
                              {day.dayNameEn} ({day.dayNameHi})
                            </strong>
                            {idx === currentDayIndex && weekOffset === 0 && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                                Today
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block">{day.dateDisplay}</span>
                        </div>
                      </div>

                      {/* Target Reviews Box */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-semibold">Target:</span>
                        <input
                          type="number"
                          min="0"
                          value={day.targetReviews}
                          disabled={day.isVerified}
                          onChange={(e) => handleManualDayTargetChange(idx, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-blue-500 disabled:opacity-75 disabled:bg-slate-100"
                        />
                        <span className="text-[11px] text-slate-400">rev</span>
                      </div>

                      {/* Actual Delivered Verification Input */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[11px] text-slate-500 font-semibold">Delivered:</span>
                        <input
                          type="number"
                          min="0"
                          value={day.verifiedReviews}
                          onChange={(e) => handleUpdateDayVerification(idx, parseInt(e.target.value) || 0, day.isVerified)}
                          className={`w-16 px-2 py-1 text-xs font-bold rounded-md outline-none border transition-colors ${
                            day.isVerified
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                          }`}
                        />

                        {/* Verify Checkbox Button */}
                        <button
                          type="button"
                          onClick={() => handleUpdateDayVerification(idx, day.verifiedReviews, !day.isVerified)}
                          className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                            day.isVerified
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                          }`}
                          title="Mark this day verified"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{day.isVerified ? 'Verified' : 'Verify'}</span>
                        </button>

                        {/* Status Badge */}
                        {day.isVerified && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            diff === 0 
                              ? 'bg-emerald-100 text-emerald-800'
                              : diff > 0 
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}>
                            {diff === 0 ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Exact Hit</span>
                              </>
                            ) : diff > 0 ? (
                              <>
                                <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                                <span>+{diff} Extra</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                <span>{diff} Short</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      {/* Member Allocations Preview */}
                      <div className="flex items-center gap-2">
                        <div className="text-[11px] text-slate-500 hidden lg:block">
                          {day.memberAllocations && day.memberAllocations.length > 0 ? (
                            <span className="truncate max-w-[200px] block" title={day.memberAllocations.map(a => `@${a.memberName}: ${a.targetCount}`).join(', ')}>
                              {day.memberAllocations.map(a => `@${a.memberName}: ${a.targetCount}`).join(', ')}
                            </span>
                          ) : (
                            <span className="italic text-slate-400">All branch staff</span>
                          )}
                        </div>

                        {/* Select For WhatsApp Message Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedMessageDayIdx(idx)}
                          className={`px-2.5 py-1 text-[11px] rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isSelected ? '✓ In Message' : 'Use in Message'}
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Daily WhatsApp Message Generator (With Group @Mentions) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            
            {/* Left Col: Message Setup */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-800">
                  Daily WhatsApp Target Message
                </h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  With Member @Mentions
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selected Day for Target Announcement:
                </label>
                <select
                  value={selectedMessageDayIdx}
                  onChange={(e) => setSelectedMessageDayIdx(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer"
                >
                  {days.map((d, i) => (
                    <option key={d.dayIndex} value={i}>
                      {d.dayNameEn} ({d.dayNameHi}) — Target: {d.targetReviews} Reviews ({d.dateDisplay})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Instruction / Note for Team:
                </label>
                <textarea
                  rows={2}
                  value={customMsgNote}
                  onChange={(e) => setCustomMsgNote(e.target.value)}
                  placeholder="e.g. Please ensure 100% target achievement before 8:00 PM today."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Send to WhatsApp Phone / Group:
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+91 9610447938 or leave empty for contact list"
                    className="w-full text-xs p-2 pl-8 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                >
                  {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMsg ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
            </div>

            {/* Right Col: WhatsApp Preview Bubble */}
            <div className="lg:col-span-6">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                WhatsApp Chat Preview
              </span>
              <div className="bg-[#efeae2] border border-slate-300 rounded-xl p-3.5 shadow-inner">
                <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-2xs font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800">
                  {generatedWhatsAppMessage}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ================= MODAL FOOTER (Fixed Bottom) ================= */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Weekly Target: <strong>{stats.totalTarget}</strong> | Delivered: <strong>{stats.totalVerified}</strong> ({stats.completionPct}%)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Weekly PDF Report Export Button */}
            <button
              type="button"
              onClick={handlePrintPdfReport}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
              title="Generate printable PDF report with all days, targets, and variance"
            >
              <FileText className="w-3.5 h-3.5 text-red-600" />
              <span>Export Weekly PDF Report</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm"
            >
              Done / Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
