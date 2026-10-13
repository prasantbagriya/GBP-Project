/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  LogOut, 
  RefreshCw, 
  FileSpreadsheet, 
  Star, 
  Users, 
  TrendingUp, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  Send,
  Sparkles,
  Calendar,
  Tag,
  Plus,
  Trash2,
  Edit3,
  Download,
  BarChart3,
  Bot,
  Sliders,
  Check,
  Clock,
  Megaphone,
  Briefcase,
  DollarSign,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  CheckCheck,
  ArrowUpRight,
  Menu,
  X,
  QrCode,
  Share2,
  Power,
  MessageCircle,
  Code,
  Globe,
  Upload,
  Smartphone,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Location, Review, Post, BusinessService, TabType, AiAutomationRules, PanelUser } from './types';
import { GrowthTools } from './components/GrowthTools';
import { AiRulesSettings } from './components/AiRulesSettings';
import { DailyWhatsAppReport } from './components/DailyWhatsAppReport';
import { WebsiteWidget } from './components/WebsiteWidget';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LoginPage } from './components/LoginPage';
import { TeamManagement } from './components/TeamManagement';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { ReportErrorBoundary } from './components/reports/ReportErrorBoundary';

export default function App() {
  const [panelUser, setPanelUser] = useState<PanelUser | null>(null);
  const [isCheckingPanelAuth, setIsCheckingPanelAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [authStatus, setAuthStatus] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('54275296663-9dfpe3tv04orefj3dugoa75lm8g9t732.apps.googleusercontent.com');
  const [loading, setLoading] = useState(true);

  // PWA Install Prompt State
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState<boolean>(false);
  
  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Desktop sidebar collapse state (chota / bada toggle)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Header refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Locations & Selection
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  
  // Reviews & Replies
  const [reviews, setReviews] = useState<Review[]>([]);
  const [allTimeTotalReviews, setAllTimeTotalReviews] = useState<number | null>(null);
  const [allTimeAverageRating, setAllTimeAverageRating] = useState<number | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'unreplied' | 'replied' | 'critical' | 'today'>('all');
  const [replyingReview, setReplyingReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [aiGeneratingReply, setAiGeneratingReply] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Auto-Reply Settings
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyTone, setAutoReplyTone] = useState('Warm & Courteous');
  const [autoReplyPromptInstructions, setAutoReplyPromptInstructions] = useState('Always mention our manager direct contact for ratings below 3 stars.');
  const [autoReplyingAll, setAutoReplyingAll] = useState(false);
  const [autoReplyProgress, setAutoReplyProgress] = useState<{ current: number; total: number } | null>(null);

  // Gemini AI Status & Toggle State
  const [geminiEnabled, setGeminiEnabled] = useState(true);
  const [aiRules, setAiRules] = useState<AiAutomationRules | null>(null);
  const [togglingAi, setTogglingAi] = useState(false);
  const [aiSettingsFeedback, setAiSettingsFeedback] = useState<string | null>(null);

  // Top Navigation Auto-Hide on Scroll
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  const handleMainScroll = (e: React.UIEvent<HTMLElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > 50 && currentScrollY > lastScrollYRef.current) {
      // User is scrolling down past 50px -> hide top header
      setHeaderVisible(false);
    } else {
      // User is scrolling up or at top -> show top header
      setHeaderVisible(true);
    }
    lastScrollYRef.current = currentScrollY;
  };

  // Reports Filter & Export
  const [reportDateRange, setReportDateRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [linkedSheet, setLinkedSheet] = useState<{ spreadsheetId: string; spreadsheetUrl: string; title?: string; updated_at?: string; created_at?: string } | null>(null);
  const [loadingSheetInfo, setLoadingSheetInfo] = useState(false);
  const [autoCreatingSheet, setAutoCreatingSheet] = useState(false);
  const [manualSheetInput, setManualSheetInput] = useState('');
  const [showManualSheetInput, setShowManualSheetInput] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsNextPageToken, setPostsNextPageToken] = useState<string | null>(null);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostType, setNewPostType] = useState<'STANDARD' | 'OFFER' | 'EVENT'>('STANDARD');
  const [newPostSummary, setNewPostSummary] = useState('');
  const [newPostCtaType, setNewPostCtaType] = useState<'BOOK' | 'ORDER' | 'SHOP' | 'LEARN_MORE' | 'CALL' | 'SIGN_UP' | 'NONE'>('NONE');
  const [newPostCtaUrl, setNewPostCtaUrl] = useState('');
  const [newPostCoupon, setNewPostCoupon] = useState('');
  const [newPostMediaUrl, setNewPostMediaUrl] = useState('');
  const [generatingAiPost, setGeneratingAiPost] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);

  // Edit & Delete Post States
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editPostType, setEditPostType] = useState<'STANDARD' | 'OFFER' | 'EVENT'>('STANDARD');
  const [editPostSummary, setEditPostSummary] = useState('');
  const [editPostCtaType, setEditPostCtaType] = useState<'BOOK' | 'ORDER' | 'SHOP' | 'LEARN_MORE' | 'CALL' | 'SIGN_UP' | 'NONE'>('NONE');
  const [editPostCtaUrl, setEditPostCtaUrl] = useState('');
  const [editPostCoupon, setEditPostCoupon] = useState('');
  const [editPostMediaUrl, setEditPostMediaUrl] = useState('');
  const [updatingPost, setUpdatingPost] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // Image Upload & Facebook Integration States
  const [uploadingWebp, setUploadingWebp] = useState(false);
  const [showFbImporter, setShowFbImporter] = useState(false);
  const [showEditFbImporter, setShowEditFbImporter] = useState(false);
  const [savedFbPages, setSavedFbPages] = useState<{ name: string; url: string }[]>(() => {
    try {
      const stored = localStorage.getItem('gbp_saved_fb_pages');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { name: 'PCP Sikar', url: 'https://www.facebook.com/pcpsikar' },
      { name: 'Prince NDA Academy', url: 'https://www.facebook.com/princendaacademy' }
    ];
  });
  const [fbPageUrl, setFbPageUrl] = useState(() => {
    try {
      const stored = localStorage.getItem('gbp_active_fb_page_url');
      if (stored) return stored;
    } catch {}
    return 'https://www.facebook.com/pcpsikar';
  });
  const [tempFbPageInput, setTempFbPageInput] = useState('https://www.facebook.com/pcpsikar');
  const [showAddFbPage, setShowAddFbPage] = useState(false);
  const [newFbPageName, setNewFbPageName] = useState('');
  const [newFbPageUrl, setNewFbPageUrl] = useState('');
  const [fbPastedContent, setFbPastedContent] = useState('');
  const [fbExtractionSuccess, setFbExtractionSuccess] = useState<string | null>(null);
  const [extractingFbPost, setExtractingFbPost] = useState(false);
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Services
  const [services, setServices] = useState<BusinessService[]>([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('General');
  const [newServicePrice, setNewServicePrice] = useState('0');
  const [newServicePriceType, setNewServicePriceType] = useState<'FIXED' | 'STARTING_AT' | 'FREE'>('FIXED');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Translations
  const t = {
    appName: 'SyncPro Live',
    appSub: 'GBP Automation Suite',
    dashboard: 'Dashboard',
    reviewsReplies: 'Reviews & Replies',
    reportsWeekly: 'Weekly & Reports',
    autoReply: 'AI Auto-Reply',
    profilePosts: 'Profile Posts',
    servicesManager: 'Services Manager',
    growthTools: 'QR & Growth Tools',
    sheetsSync: 'Sheets Sync',
    todayReviews: "Reviews Today",
    avgRating: 'Average Rating',
    replyRate: 'Response Rate',
    monitoringActive: 'Live Monitor Active',
    connectGoogle: 'Connect Google Account',
    disconnect: 'Disconnect Account',
    whatsappReport: 'WhatsApp Report',
    widget: 'Website Widget',
    team: 'Team & Access'
  };

  const checkPanelAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setPanelUser(data.user);
        } else {
          setPanelUser(null);
        }
      } else {
        setPanelUser(null);
      }
    } catch (e) {
      setPanelUser(null);
    } finally {
      setIsCheckingPanelAuth(false);
    }
  };

  const handlePanelLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    } catch (e) {}
    setPanelUser(null);
    setActiveTab('dashboard');
  };

  useEffect(() => {
    checkPanelAuth();

    // Safety timer: Never allow loading screen to stay beyond 600ms
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 600);

    checkAuth().finally(() => {
      clearTimeout(safetyTimer);
      setLoading(false);
    });

    fetchAiSettings();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setAuthStatus(true);
        fetchLocations();
      }
    };
    window.addEventListener('message', handleMessage);

    // Detect if already installed / standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsAppInstalled(true);
    }

    // Capture beforeinstallprompt event for PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(safetyTimer);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallAppClick = async () => {
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const choiceResult = await deferredInstallPrompt.userChoice;
        if (choiceResult?.outcome === 'accepted') {
          setIsAppInstalled(true);
        }
        setDeferredInstallPrompt(null);
      } catch (err) {
        setShowInstallGuideModal(true);
      }
    } else {
      setShowInstallGuideModal(true);
    }
  };

  const fetchAiSettings = async (locName?: string | null) => {
    try {
      const targetLoc = locName || selectedLocation || activeLoc?.v4Name || activeLoc?.name;
      const url = targetLoc
        ? `/api/settings/ai-rules?locationName=${encodeURIComponent(targetLoc)}`
        : '/api/settings/ai-rules';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.rules) {
          setAiRules(data.rules);
          if (!targetLoc) {
            setGeminiEnabled(!!data.rules.enabled);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load AI settings:', e);
    }
  };

  const toggleGeminiAi = async () => {
    setTogglingAi(true);
    setAiSettingsFeedback(null);
    try {
      const newStatus = !geminiEnabled;
      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newStatus })
      });
      const data = await res.json();
      setGeminiEnabled(!!data.enabled);
      setAiSettingsFeedback(data.enabled 
        ? ('Google Gemini AI has been enabled!')
        : ('Google Gemini AI disabled (template fallback active)!')
      );
      setTimeout(() => setAiSettingsFeedback(null), 3500);
    } catch (e) {
      alert('Failed to toggle AI settings');
    } finally {
      setTogglingAi(false);
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/user/status');
      if (res.ok) {
        const data = await res.json();
        setAuthStatus(data.isAuthenticated ?? false);
        if (data.clientId) {
          setClientId(data.clientId);
        }
        if (data.userEmail) {
          setUserEmail(data.userEmail);
        }
      } else {
        setAuthStatus(false);
      }
      await fetchLocations();
    } catch (err) {
      setAuthStatus(false);
      await fetchLocations();
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async (refresh: boolean = false) => {
    try {
      const res = await fetch(`/api/gbp/locations${refresh ? '?refresh=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        const locs: Location[] = data.locations || [];
        setLocations(locs);
        if (locs.length > 0) {
          const currentValid = selectedLocation && locs.find(l => (l.v4Name && l.v4Name === selectedLocation) || l.name === selectedLocation);
          const activeItem = currentValid || locs[0];
          const chosenKey = activeItem.v4Name || activeItem.name;
          setSelectedLocation(chosenKey);
          loadAllData(chosenKey, refresh);
        } else {
          setSelectedLocation(null);
          setReviews([]);
          setPosts([]);
          setServices([]);
        }
      } else {
        setLocations([]);
        setSelectedLocation(null);
        setReviews([]);
        setPosts([]);
        setServices([]);
      }
    } catch (err) {
      setLocations([]);
      setSelectedLocation(null);
      setReviews([]);
      setPosts([]);
      setServices([]);
    }
  };

  const handleLocationChange = (newLocationKey: string) => {
    if (!newLocationKey) return;
    setSelectedLocation(newLocationKey);

    // Immediately clear previous profile's data so stale stats never linger
    setReviews([]);
    setAllTimeTotalReviews(null);
    setAllTimeAverageRating(null);
    setPosts([]);
    setPostsNextPageToken(null);
    setServices([]);
    setLinkedSheet(null);
    setSpreadsheetId('');

    const matched = locations.find(l => (l.v4Name && l.v4Name === newLocationKey) || l.name === newLocationKey);
    const effectiveParam = matched?.v4Name || matched?.name || newLocationKey;
    loadAllData(effectiveParam, false);
  };

  const loadAllData = (locationName?: string | null, refresh: boolean = false) => {
    if (!locationName) {
      setReviews([]);
      setPosts([]);
      setPostsNextPageToken(null);
      setServices([]);
      setLinkedSheet(null);
      setSpreadsheetId('');
      return;
    }
    fetchReviews(locationName);
    fetchPosts(locationName, refresh);
    fetchServices(locationName, refresh);
    fetchLinkedSheet(locationName);
    fetchAiSettings(locationName);
  };

  const fetchLinkedSheet = async (locName?: string | null) => {
    const target = locName || selectedLocation;
    if (!target) return;
    setLoadingSheetInfo(true);
    try {
      const res = await fetch(`/api/sync/sheets/info?locationName=${encodeURIComponent(target)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.sheet && data.sheet.spreadsheetId) {
          setLinkedSheet(data.sheet);
          setSpreadsheetId(data.sheet.spreadsheetId);
        } else {
          setLinkedSheet(null);
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingSheetInfo(false);
    }
  };

  const handleAutoCreateSheet = async () => {
    if (!selectedLocation) {
      alert('Please select a business location first.');
      return;
    }
    setAutoCreatingSheet(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/sync/sheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: selectedLocation,
          locationTitle: activeLoc?.title || 'Google Business Profile'
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.sheet) {
        setLinkedSheet(data.sheet);
        setSpreadsheetId(data.sheet.spreadsheetId);
        setSyncStatus('success');
        setSyncFeedback(data.message || 'Google Sheet permanently connected to your profile!');
        setTimeout(() => setSyncStatus('idle'), 4000);
      } else {
        alert(data.error || 'Failed to create Google Sheet. Please check Google permissions.');
      }
    } catch (e: any) {
      alert(e.message || 'Error creating Google Sheet');
    } finally {
      setAutoCreatingSheet(false);
    }
  };

  const handleLinkExistingSheet = async (idToLink: string) => {
    if (!idToLink.trim()) return;
    setLoadingSheetInfo(true);
    try {
      const res = await fetch('/api/sync/sheets/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: selectedLocation,
          spreadsheetId: idToLink.trim(),
          title: `${activeLoc?.title || 'GBP'} (Connected Sheet)`
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.sheet) {
        setLinkedSheet(data.sheet);
        setSpreadsheetId(data.sheet.spreadsheetId);
        setShowManualSheetInput(false);
        setManualSheetInput('');
        setSyncStatus('success');
        setSyncFeedback('Google Sheet connected permanently!');
        setTimeout(() => setSyncStatus('idle'), 4000);
      } else {
        alert(data.error || 'Failed to connect spreadsheet');
      }
    } catch (e) {
      alert('Failed to connect spreadsheet');
    } finally {
      setLoadingSheetInfo(false);
    }
  };

  const handleDisconnectSheet = async () => {
    if (!confirm('Are you sure you want to disconnect this Google Sheet? You can connect or create another sheet anytime.')) return;
    try {
      await fetch(`/api/sync/sheets/info?locationName=${encodeURIComponent(selectedLocation || '')}&disconnect=true`, { method: 'POST' });
      setLinkedSheet(null);
      setSpreadsheetId('');
      setSyncFeedback('Google Sheet disconnected.');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (e) {
      // ignore
    }
  };

  const fetchReviews = async (locationName: string) => {
    if (!locationName) {
      setReviews([]);
      setAllTimeTotalReviews(0);
      setAllTimeAverageRating(0);
      return;
    }
    try {
      const res = await fetch(`/api/gbp/reviews?locationName=${encodeURIComponent(locationName)}`);
      if (res.ok) {
        const data = await res.json();
        const revList = data.reviews || [];
        setReviews(revList);
        if (data.totalReviewCount !== undefined && data.totalReviewCount !== null) {
          setAllTimeTotalReviews(Number(data.totalReviewCount));
        } else {
          setAllTimeTotalReviews(revList.length);
        }
        if (data.averageRating !== undefined && data.averageRating !== null) {
          setAllTimeAverageRating(Number(data.averageRating));
        } else if (revList.length > 0) {
          const totalPoints = revList.reduce((acc: number, r: any) => acc + parseRating(r.starRating), 0);
          setAllTimeAverageRating(Number((totalPoints / revList.length).toFixed(1)));
        } else {
          setAllTimeAverageRating(0);
        }
      } else {
        setReviews([]);
        setAllTimeTotalReviews(0);
        setAllTimeAverageRating(0);
      }
    } catch (err) {
      setReviews([]);
      setAllTimeTotalReviews(0);
      setAllTimeAverageRating(0);
    }
  };

  const fetchPosts = async (locationName: string, refresh: boolean = false) => {
    if (!locationName) {
      setPosts([]);
      setPostsNextPageToken(null);
      return;
    }
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/gbp/posts?locationName=${encodeURIComponent(locationName)}&pageSize=6${refresh ? '&refresh=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setPostsNextPageToken(data.nextPageToken || null);
      } else {
        setPosts([]);
        setPostsNextPageToken(null);
      }
    } catch (err) {
      setPosts([]);
      setPostsNextPageToken(null);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleLoadMorePosts = async () => {
    if (!selectedLocation || !postsNextPageToken || loadingMorePosts) return;
    setLoadingMorePosts(true);
    try {
      const res = await fetch(`/api/gbp/posts?locationName=${encodeURIComponent(selectedLocation)}&pageSize=6&pageToken=${encodeURIComponent(postsNextPageToken)}`);
      if (res.ok) {
        const data = await res.json();
        const incomingPosts: Post[] = data.posts || [];
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = incomingPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
        setPostsNextPageToken(data.nextPageToken || null);
      }
    } catch (err) {
      console.error('Failed to load more posts', err);
    } finally {
      setLoadingMorePosts(false);
    }
  };

  const fetchServices = async (locationName: string, refresh: boolean = false) => {
    if (!locationName) {
      setServices([]);
      return;
    }
    try {
      const res = await fetch(`/api/gbp/services?locationName=${encodeURIComponent(locationName)}${refresh ? '&refresh=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      } else {
        setServices([]);
      }
    } catch (err) {
      setServices([]);
    }
  };

  const handleConnect = async () => {
    // 1. Google Identity Services (GIS) initCodeClient with postmessage
    // Completely bypasses ModSecurity 406 error because authentication happens via GIS popup, avoiding URL queries!
    const effectiveClientId = clientId || '54275296663-9dfpe3tv04orefj3dugoa75lm8g9t732.apps.googleusercontent.com';
    const gis = (window as any).google?.accounts?.oauth2;

    if (gis && effectiveClientId) {
      try {
        const client = gis.initCodeClient({
          client_id: effectiveClientId,
          scope: 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/spreadsheets',
          ux_mode: 'popup',
          callback: async (response: any) => {
            if (response.error) {
              console.error('Google Auth Error:', response);
              alert('Google Sign-In failed: ' + response.error);
              return;
            }
            if (response.code) {
              try {
                const exRes = await fetch('/api/gbp/exchange-code', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: response.code })
                });
                const exData = await exRes.json();
                if (exData.success) {
                  setAuthStatus(true);
                  fetchLocations();
                  alert('Google Account connected successfully!');
                } else {
                  alert('Login failed: ' + (exData.error || 'Server error'));
                }
              } catch (err) {
                alert('Connection error exchanging auth code.');
              }
            }
          }
        });
        client.requestCode();
        return;
      } catch (err) {
        console.warn('GIS client initialization error, falling back:', err);
      }
    }

    // 2. Fallback popup if GIS is blocked or loading
    try {
      const res = await fetch('/api/auth/url');
      const { url } = await res.json();
      if (url) {
        window.open(url, 'google_auth', 'width=600,height=700');
      }
    } catch (e) {
      alert('Error initiating Google Login.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout');
    setAuthStatus(false);
    setLocations([]);
    setSelectedLocation(null);
    setReviews([]);
    setPosts([]);
    setServices([]);
  };

  const activeLoc = useMemo(() => {
    if (!selectedLocation || locations.length === 0) return locations[0] || null;
    return (
      locations.find(l => (l.v4Name && l.v4Name === selectedLocation) || l.name === selectedLocation) ||
      locations[0] ||
      null
    );
  }, [locations, selectedLocation]);

  const parseRating = (ratingStr: string): number => {
    if (ratingStr === 'FIVE') return 5;
    if (ratingStr === 'FOUR') return 4;
    if (ratingStr === 'THREE') return 3;
    if (ratingStr === 'TWO') return 2;
    if (ratingStr === 'ONE') return 1;
    const parts = ratingStr.split('_');
    const num = parseInt(parts[parts.length - 1], 10);
    return isNaN(num) ? 5 : num;
  };

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const todayReviews = useMemo(() => reviews.filter(r => isToday(r.createTime)), [reviews]);
  const repliedReviews = useMemo(() => reviews.filter(r => !!r.reviewReply?.comment), [reviews]);
  const pendingReviews = useMemo(() => reviews.filter(r => !r.reviewReply?.comment), [reviews]);

  const avgRating = useMemo(() => {
    if (allTimeAverageRating !== null && allTimeAverageRating !== undefined && !isNaN(allTimeAverageRating)) {
      return Number(allTimeAverageRating).toFixed(1);
    }
    if (reviews.length === 0) return '0.0';
    const total = reviews.reduce((acc, r) => acc + parseRating(r.starRating), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews, allTimeAverageRating]);

  const totalRatingsCount = useMemo(() => {
    if (allTimeTotalReviews !== null && allTimeTotalReviews !== undefined && allTimeTotalReviews > reviews.length) {
      return allTimeTotalReviews;
    }
    return reviews.length;
  }, [allTimeTotalReviews, reviews.length]);

  const responseRate = useMemo(() => {
    const baseCount = totalRatingsCount > 0 ? totalRatingsCount : reviews.length;
    if (baseCount === 0) return 100;
    return Math.min(100, Math.round((repliedReviews.length / (reviews.length || 1)) * 100));
  }, [reviews, repliedReviews, totalRatingsCount]);

  const displayedReviews = useMemo(() => {
    if (reviewFilter === 'unreplied') return pendingReviews;
    if (reviewFilter === 'replied') return repliedReviews;
    if (reviewFilter === 'today') return todayReviews;
    if (reviewFilter === 'critical') return reviews.filter(r => parseRating(r.starRating) <= 3);
    return reviews;
  }, [reviews, reviewFilter, pendingReviews, repliedReviews, todayReviews]);

  const ratingDistribution = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const s = parseRating(r.starRating);
      if (s >= 1 && s <= 5) counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  const weeklyDayBreakdown = useMemo(() => {
    const days: { dateLabel: string; dayName: string; total: number; avgRating: number; fiveStars: number; negative: number; replied: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const dayReviews = reviews.filter(r => {
        const revTime = new Date(r.createTime).getTime();
        return revTime >= dayStart.getTime() && revTime <= dayEnd.getTime();
      });

      const dayTotal = dayReviews.length;
      const dayFive = dayReviews.filter(r => parseRating(r.starRating) === 5).length;
      const dayNegative = dayReviews.filter(r => parseRating(r.starRating) <= 3).length;
      const dayReplied = dayReviews.filter(r => !!r.reviewReply?.comment).length;
      const dayAvg = dayTotal > 0 ? Number((dayReviews.reduce((sum, r) => sum + parseRating(r.starRating), 0) / dayTotal).toFixed(1)) : 5.0;

      days.push({
        dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: i === 0 ? ('Today') : i === 1 ? ('Yesterday') : d.toLocaleDateString('en-US', { weekday: 'short' }),
        total: dayTotal,
        avgRating: dayAvg,
        fiveStars: dayFive,
        negative: dayNegative,
        replied: dayReplied
      });
    }

    return days;
  }, [reviews]);

  // Reply handlers
  const handleOpenReplyModal = (rev: Review, autoDraft: boolean = false) => {
    setReplyingReview(rev);
    const existing = rev.reviewReply?.comment || '';
    setReplyText(existing);
    if (!existing && autoDraft) {
      handleGenerateAiReply(rev);
    }
  };

  const handleGenerateAiReply = async (rev: Review) => {
    setAiGeneratingReply(true);
    try {
      const res = await fetch('/api/reviews/ai-reply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          reviewerName: rev.reviewer?.displayName || 'Customer',
          starRating: rev.starRating,
          comment: rev.comment || '',
          tone: aiRules?.tone || autoReplyTone,
          businessName: activeLoc?.title || 'Our Business',
          customInstructions: aiRules?.customInstructions || autoReplyPromptInstructions,
          enforceRules: false
        })
      });
      const data = await res.json();
      if (data.reply) {
        setReplyText(data.reply);
      } else if (data.error) {
        alert(data.error);
      } else {
        alert('Could not generate AI reply. Please check your Gemini connection.');
      }
    } catch (err) {
      console.error('Error generating AI reply:', err);
      alert('Failed to generate AI reply. Please try again.');
    } finally {
      setAiGeneratingReply(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyingReview || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch('/api/gbp/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: replyingReview.reviewId,
          reviewName: replyingReview.name,
          locationName: activeLoc?.v4Name || activeLoc?.name,
          comment: replyText
        })
      });
      const data = await res.json();
      if (data.success) {
        // Build a safe reviewReply — Google sometimes returns {} so we fallback to the submitted text
        const updatedReply = {
          comment: data.reviewReply?.comment || replyText,
          updateTime: data.reviewReply?.updateTime || new Date().toISOString()
        };
        setReviews(prev => prev.map(r => r.reviewId === replyingReview.reviewId ? { ...r, reviewReply: updatedReply } : r));
        setReplyingReview(null);
        setReplyText('');
      } else {
        alert(data.error || 'Failed to send reply to Google');
      }
    } catch (err) {
      alert('Failed to send reply to Google');
    } finally {
      setSendingReply(false);
    }
  };

  const handleDeleteReply = async (reviewId: string, reviewName?: string) => {
    if (!confirm('Are you sure you want to delete this reply from Google Business Profile?')) return;
    try {
      await fetch('/api/gbp/reviews/reply', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, reviewName, locationName: activeLoc?.v4Name || activeLoc?.name })
      });
      setReviews(prev => prev.map(r => {
        if (r.reviewId === reviewId) {
          const copy = { ...r };
          delete copy.reviewReply;
          return copy;
        }
        return r;
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAutoReplyNewReviews = async () => {
    if (!activeLoc) {
      alert('Please select a business profile first.');
      return;
    }

    const locName = activeLoc.v4Name || activeLoc.name;
    const locTitle = activeLoc.title || 'this profile';

    if (pendingReviews.length === 0) {
      alert(`All reviews for "${locTitle}" already have owner replies!`);
      return;
    }

    setAutoReplyingAll(true);
    setAutoReplyProgress({ current: 0, total: pendingReviews.length });

    try {
      const res = await fetch('/api/gbp/reviews/auto-reply-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: locName,
          force: false
        })
      });

      const data = await res.json();

      if (data.success) {
        if (data.replies && data.replies.length > 0) {
          const repliedMap = new Map();
          data.replies.forEach((rep: any) => {
            repliedMap.set(rep.reviewId, {
              comment: rep.reply,
              updateTime: rep.updateTime || new Date().toISOString()
            });
          });

          setReviews(prev => prev.map(r => {
            if (repliedMap.has(r.reviewId)) {
              return { ...r, reviewReply: repliedMap.get(r.reviewId) };
            }
            return r;
          }));

          setAutoReplyProgress({ current: data.repliedCount, total: data.repliedCount });
          alert(`Success: ${data.message || `Replied to ${data.repliedCount} new review(s) for "${locTitle}"!`}`);
        } else if (data.skippedCount > 0) {
          alert(`Notice: ${data.message || `No reviews were replied to. ${data.skippedCount} review(s) did not match this profile's rules.`}`);
        } else {
          alert(data.message || `No pending reviews waiting for replies on "${locTitle}".`);
        }
      } else {
        if (data.enabled === false) {
          alert(`Auto-Reply is currently DISABLED for "${locTitle}". Please enable it in the Profile AI Rules below and click Save Rules.`);
        } else {
          alert(data.message || 'Auto-reply was unable to complete for this profile.');
        }
      }
    } catch (err: any) {
      alert('Auto-reply failed: ' + (err?.message || 'Network error'));
    } finally {
      setTimeout(() => {
        setAutoReplyingAll(false);
        setAutoReplyProgress(null);
      }, 500);
    }
  };

  const handleAutoReplyAllPending = handleAutoReplyNewReviews;

  const tryCompressImageToBlob = async (file: File): Promise<{ blob: Blob; mime: string } | null> => {
    return new Promise((resolve) => {
      if (file.type === 'image/svg+xml') {
        resolve(null);
        return;
      }

      const img = new Image();
      let objectUrl = '';
      try {
        objectUrl = URL.createObjectURL(file);
      } catch {
        resolve(null);
        return;
      }

      const cleanup = () => {
        try {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        } catch {}
      };

      img.onload = () => {
        try {
          const maxDim = 1600;
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (!width || !height) {
            cleanup();
            resolve(null);
            return;
          }

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            cleanup();
            resolve(null);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          cleanup();

          // Try exporting to WebP first
          canvas.toBlob(
            (webpBlob) => {
              if (webpBlob && webpBlob.size > 0) {
                resolve({ blob: webpBlob, mime: 'image/webp' });
              } else {
                // Fallback to JPEG if WebP is unsupported or failed in this browser
                canvas.toBlob(
                  (jpegBlob) => {
                    if (jpegBlob && jpegBlob.size > 0) {
                      resolve({ blob: jpegBlob, mime: 'image/jpeg' });
                    } else {
                      resolve(null);
                    }
                  },
                  'image/jpeg',
                  0.85
                );
              }
            },
            'image/webp',
            0.82
          );
        } catch {
          cleanup();
          resolve(null);
        }
      };

      img.onerror = () => {
        cleanup();
        resolve(null);
      };

      img.src = objectUrl;
    });
  };

  const isVideoMedia = (url?: string, format?: string): boolean => {
    if (format === 'VIDEO') return true;
    if (!url) return false;
    return /\.(mp4|mov|webm|avi|m4v|3gp|mkv|wmv)(\?.*)?$/i.test(url);
  };

  const uploadMediaToServer = async (file: File): Promise<string> => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|m4v|3gp|mkv|wmv)$/i.test(file.name);

    // If it's a video, upload directly via FormData (skip image canvas compression)
    if (isVideo) {
      const formData = new FormData();
      formData.append('image', file, file.name);

      const res = await fetch('/api/gbp/posts/upload-image', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (res.ok && data?.success && data?.url) {
        return data.url;
      }

      const errMsg = data?.error || data?.message || (data?.errors ? Object.values(data.errors).flat().join(', ') : '') || `Server error (${res.status})`;
      throw new Error(errMsg);
    }

    // Otherwise, attempt client-side image compression
    const compressed = await tryCompressImageToBlob(file);

    const formData = new FormData();
    if (compressed && compressed.blob) {
      const ext = compressed.mime === 'image/webp' ? 'webp' : 'jpg';
      formData.append('image', compressed.blob, `photo.${ext}`);
    } else {
      formData.append('image', file, file.name);
    }

    let firstErrorMsg = '';
    try {
      const res = await fetch('/api/gbp/posts/upload-image', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (res.ok && data?.success && data?.url) {
        return data.url;
      }

      firstErrorMsg = data?.error || data?.message || (data?.errors ? Object.values(data.errors).flat().join(', ') : '') || `Server error (${res.status})`;
    } catch (err: any) {
      firstErrorMsg = err?.message || 'Network error during upload';
    }

    // Step 3: Base64 JSON fallback if multipart was rejected by server limits or network
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(compressed?.blob || file);
      });

      const res = await fetch('/api/gbp/posts/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          image_base64: base64Data,
          filename: file.name,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (res.ok && data?.success && data?.url) {
        return data.url;
      }

      const errMsg = data?.error || data?.message || firstErrorMsg || 'Upload failed';
      throw new Error(errMsg);
    } catch (fallbackErr: any) {
      throw new Error(fallbackErr?.message || firstErrorMsg || 'Failed to upload photo');
    }
  };

  const handleImageFilePicked = async (file: File, isEdit: boolean) => {
    if (!file) return;
    setUploadingWebp(true);
    try {
      const uploadedUrl = await uploadMediaToServer(file);
      if (isEdit) {
        setEditPostMediaUrl(uploadedUrl);
      } else {
        setNewPostMediaUrl(uploadedUrl);
      }
    } catch (err: any) {
      alert(err?.message || 'Error uploading media file');
    } finally {
      setUploadingWebp(false);
      if (createFileInputRef.current) createFileInputRef.current.value = '';
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  const handleSelectFbPage = (url: string) => {
    setFbPageUrl(url);
    setTempFbPageInput(url);
    try {
      localStorage.setItem('gbp_active_fb_page_url', url);
    } catch {}
  };

  const handleAddFbPage = () => {
    let cleanUrl = newFbPageUrl.trim();
    if (!cleanUrl) return;
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    const derivedName = cleanUrl.replace(/https?:\/\/(www\.)?facebook\.com\/?/i, '').replace(/[\/\?].*$/, '');
    const name = newFbPageName.trim() || derivedName || 'Facebook Page';

    const exists = savedFbPages.some(p => p.url.toLowerCase() === cleanUrl.toLowerCase());
    let updated = savedFbPages;
    if (!exists) {
      updated = [...savedFbPages, { name, url: cleanUrl }];
      setSavedFbPages(updated);
      try {
        localStorage.setItem('gbp_saved_fb_pages', JSON.stringify(updated));
      } catch {}
    }
    handleSelectFbPage(cleanUrl);
    setNewFbPageName('');
    setNewFbPageUrl('');
    setShowAddFbPage(false);
  };

  const handleRemoveFbPage = (urlToRemove: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = savedFbPages.filter(p => p.url !== urlToRemove);
    setSavedFbPages(updated);
    try {
      localStorage.setItem('gbp_saved_fb_pages', JSON.stringify(updated));
    } catch {}
    if (fbPageUrl === urlToRemove && updated.length > 0) {
      handleSelectFbPage(updated[0].url);
    }
  };

  const handleExtractFbPost = async (isEdit: boolean = false, andAiGenerate: boolean = false) => {
    const raw = fbPastedContent.trim();
    if (!raw) return;

    setExtractingFbPost(true);
    setFbExtractionSuccess(null);

    let extractedPhotoUrl = '';
    let extractedText = '';
    let rewrittenText = '';

    // 1. Call backend server link extractor to fetch OpenGraph post metadata, rewrite to Google format, and download photo
    try {
      const res = await fetch('/api/gbp/posts/extract-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ 
          content: raw,
          fbPageUrl: fbPageUrl || undefined,
          aiRewrite: andAiGenerate,
          businessName: activeLoc?.title || 'Our Business',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.mediaUrl) extractedPhotoUrl = data.mediaUrl;
          if (data.caption) extractedText = data.caption;
          if (data.rewrittenCaption) rewrittenText = data.rewrittenCaption;
        } else if (data.error) {
          console.warn('Backend extract message:', data.error);
        }
      }
    } catch (e) {
      console.warn('Backend post link extraction error, falling back to local regex', e);
    }

    // 2. Local fallback and user-pasted text preservation
    if (!extractedPhotoUrl) {
      const imgMatch = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        extractedPhotoUrl = imgMatch[1];
      } else {
        const urlRegex = /(https?:\/\/[^\s"'<>]+(?:\.(?:jpg|jpeg|png|webp|gif|mp4|mov)|fbcdn\.net[^\s"'<>]*|fbsbx\.com[^\s"'<>]*))/i;
        const urlMatch = raw.match(urlRegex);
        if (urlMatch && urlMatch[1]) {
          extractedPhotoUrl = urlMatch[1];
        }
      }
    }

    // Check if user typed or pasted a longer text directly in the input box
    let localPastedText = raw;
    if (extractedPhotoUrl) {
      localPastedText = localPastedText.replace(extractedPhotoUrl, '');
    }
    localPastedText = localPastedText
      .replace(/<[^>]+>/g, ' ')
      .replace(/https?:\/\/[^\s"'<>]+/gi, '')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    if (localPastedText && localPastedText.length >= 25) {
      // If local pasted text is longer than extracted text or extracted text was truncated
      if (!extractedText || localPastedText.length > extractedText.length || /(?:\.\.\.|…|\bSee [Mm]ore)\s*$/.test(extractedText)) {
        extractedText = localPastedText;
      }
    } else if (!extractedText && localPastedText && !/^https?:\/\/[^\s]+$/i.test(localPastedText)) {
      extractedText = localPastedText;
    }

    const finalText = rewrittenText || extractedText;

    // 3. Populate post fields: caption -> Summary text, photo -> Media URL upload
    if (extractedPhotoUrl) {
      if (isEdit) {
        setEditPostMediaUrl(extractedPhotoUrl);
      } else {
        setNewPostMediaUrl(extractedPhotoUrl);
      }
    }

    if (finalText) {
      if (isEdit) {
        setEditPostSummary(finalText);
      } else {
        setNewPostSummary(finalText);
      }
    }

    setExtractingFbPost(false);

    if (extractedPhotoUrl || finalText) {
      setFbExtractionSuccess(
        andAiGenerate
          ? `✓ AI Post created with photo & caption!`
          : `✓ Extracted: ${extractedPhotoUrl ? 'Photo loaded ' : ''}${finalText ? '• Full caption loaded' : ''}`
      );
    } else {
      setFbExtractionSuccess(`⚠️ Could not extract photo or text from link. Please check link or paste caption manually.`);
    }

    setTimeout(() => setFbExtractionSuccess(null), 6000);
    setFbPastedContent('');

    // 4. Trigger AI rewrite fallback if requested but backend didn't return rewrittenCaption
    if (andAiGenerate && !rewrittenText && (extractedText || extractedPhotoUrl)) {
      handleAiPostAction(isEdit, extractedText, extractedPhotoUrl);
    }
  };

  const handleAiPostAction = async (isEdit: boolean = false, overrideText?: string, overrideMediaUrl?: string) => {
    const currentText = overrideText !== undefined ? overrideText : (isEdit ? editPostSummary : newPostSummary);
    const currentMedia = overrideMediaUrl !== undefined ? overrideMediaUrl : (isEdit ? editPostMediaUrl : newPostMediaUrl);
    const currentType = isEdit ? editPostType : newPostType;
    setGeneratingAiPost(true);
    try {
      const res = await fetch('/api/gbp/posts/ai-post', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          topicType: currentType,
          businessName: activeLoc?.title || 'Our Business',
          promptTopic: 'Special Update',
          existingText: (currentText || '').trim(),
          mediaUrl: currentMedia || undefined,
        }),
      });
      const data = await res.json();
      if (data.content) {
        if (isEdit) {
          setEditPostSummary(data.content);
        } else {
          setNewPostSummary(data.content);
        }
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error('AI Post Generation error:', err);
      alert('Failed to generate AI post. Please try again.');
    } finally {
      setGeneratingAiPost(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostSummary.trim()) return alert('Please enter post text');
    if (!activeLoc?.name) return alert('No active Google location selected');
    setCreatingPost(true);
    try {
      const res = await fetch('/api/gbp/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: activeLoc?.name,
          topicType: newPostType,
          summary: newPostSummary,
          callToAction: (newPostCtaType && newPostCtaType !== 'NONE') ? {
            actionType: newPostCtaType,
            url: newPostCtaType === 'CALL' ? undefined : (newPostCtaUrl.trim() || undefined)
          } : undefined,
          mediaUrl: newPostMediaUrl || undefined,
          offer: newPostType === 'OFFER' && newPostCoupon ? { couponCode: newPostCoupon } : undefined
        })
      });
      const data = await res.json();
      if (data.success && data.post) {
        setPosts(prev => [data.post, ...prev]);
        setShowNewPostModal(false);
        setNewPostSummary('');
      } else {
        alert(data.error || 'Failed to publish post to Google');
      }
    } catch (e) {
      alert('Error publishing post to Google');
    } finally {
      setCreatingPost(false);
    }
  };

  const openEditPostModal = (post: Post) => {
    setEditingPost(post);
    setEditPostType(post.topicType || 'STANDARD');
    setEditPostSummary(post.summary || '');
    setEditPostCtaType(post.callToAction?.actionType || (post.callToAction?.url ? 'LEARN_MORE' : 'NONE'));
    setEditPostCtaUrl(post.callToAction?.url || '');
    setEditPostCoupon(post.offer?.couponCode || '');
    setEditPostMediaUrl(post.mediaUrl || '');
    setShowEditPostModal(true);
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    if (!editPostSummary.trim()) return alert('Please enter post text');
    setUpdatingPost(true);
    try {
      const res = await fetch('/api/gbp/posts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: editingPost.id,
          locationName: activeLoc?.name || selectedLocation,
          topicType: editPostType,
          summary: editPostSummary,
          callToAction: (editPostCtaType && editPostCtaType !== 'NONE') ? {
            actionType: editPostCtaType,
            url: editPostCtaType === 'CALL' ? undefined : (editPostCtaUrl.trim() || undefined)
          } : undefined,
          mediaUrl: editPostMediaUrl || undefined,
          offer: editPostType === 'OFFER' && editPostCoupon ? { couponCode: editPostCoupon } : undefined
        })
      });
      const data = await res.json();
      if (data.success && data.post) {
        setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...data.post } : p));
        setShowEditPostModal(false);
        setEditingPost(null);
      } else {
        alert(data.error || 'Failed to update post on Google');
      }
    } catch (e) {
      alert('Error updating post on Google');
    } finally {
      setUpdatingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post from Google Search and Maps? This cannot be undone.')) return;
    setDeletingPostId(postId);
    try {
      const res = await fetch('/api/gbp/posts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          locationName: activeLoc?.name || selectedLocation
        })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        alert(data.error || 'Failed to delete post from Google');
      }
    } catch (e) {
      alert('Error deleting post from Google');
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleAddService = async () => {
    if (!newServiceName.trim()) return alert('Please enter service name');
    if (!activeLoc?.name) return alert('No active Google location selected');
    try {
      const res = await fetch('/api/gbp/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: activeLoc?.name,
          category: newServiceCategory,
          name: newServiceName,
          price: Number(newServicePrice) || 0,
          priceType: newServicePriceType,
          currency: 'INR',
          description: newServiceDesc
        })
      });
      const data = await res.json();
      if (data.success && data.service) {
        setServices(prev => [...prev, data.service]);
        setShowAddServiceModal(false);
        setNewServiceName('');
        setNewServiceDesc('');
      } else {
        alert(data.error || 'Failed to add service on Google');
      }
    } catch (e) {
      alert('Failed to add service on Google');
    }
  };

  const handleSyncToSheets = async (customReport: boolean = false) => {
    const targetSheetId = spreadsheetId.trim() || linkedSheet?.spreadsheetId;
    if (!targetSheetId) {
      alert('Please connect or create your Google Sheet first.');
      return;
    }
    setSyncStatus('syncing');
    setSyncFeedback('Exporting data to your Google Sheet...');

    let dataToExport: (string | number)[][] = [];
    const sheetTitle = customReport ? 'GBP_Analytics_Report' : 'Reviews_Log';

    if (customReport) {
      dataToExport = [
        ['GOOGLE BUSINESS PROFILE - PERFORMANCE & REVIEWS REPORT'],
        ['Generated At', new Date().toLocaleString()],
        ['Profile Name', activeLoc?.title || 'Google Business Profile'],
        [''],
        ['SUMMARY METRICS', 'VALUE'],
        ['Total Reviews Count', reviews.length],
        ['Today Reviews Count', todayReviews.length],
        ['Average Star Rating', avgRating],
        ['Response Rate (%)', `${responseRate}%`],
        ['Total Replied Reviews', repliedReviews.length],
        ['Total Pending Reviews', pendingReviews.length],
        [''],
        ['WEEKLY REVIEW BREAKDOWN (DAY BY DAY)'],
        ['Day', 'Date', 'Total Reviews', '5 Stars', 'Negative (<=3)', 'Avg Rating', 'Replied']
      ];

      weeklyDayBreakdown.forEach(day => {
        dataToExport.push([day.dayName, day.dateLabel, day.total, day.fiveStars, day.negative, day.avgRating, day.replied]);
      });

      dataToExport.push(['']);
      dataToExport.push(['DETAILED REVIEWS & REPLIES LOG']);
      dataToExport.push(['Review ID', 'Date & Time', 'Reviewer', 'Rating', 'Customer Comment', 'Owner Reply', 'Reply Date']);

      reviews.forEach(r => {
        dataToExport.push([
          r.reviewId,
          new Date(r.createTime).toLocaleString(),
          r.reviewer.displayName,
          parseRating(r.starRating),
          r.comment || '',
          r.reviewReply?.comment || '(Pending)',
          r.reviewReply?.updateTime ? new Date(r.reviewReply.updateTime).toLocaleString() : ''
        ]);
      });
    } else {
      const headers = ['Review ID', 'Reviewer Name', 'Star Rating', 'Review Comment', 'Date & Time', 'Owner Reply', 'Reply Time'];
      const rows = reviews.map(r => [
        r.reviewId,
        r.reviewer.displayName,
        parseRating(r.starRating),
        r.comment || '',
        new Date(r.createTime).toLocaleString(),
        r.reviewReply?.comment || '(Not Replied)',
        r.reviewReply?.updateTime ? new Date(r.reviewReply.updateTime).toLocaleString() : '-'
      ]);
      dataToExport = [headers, ...rows];
    }

    try {
      const res = await fetch('/api/sync/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: selectedLocation,
          spreadsheetId: targetSheetId,
          data: dataToExport,
          sheetTitle
        })
      });
      const resData = await res.json();
      if (res.ok) {
        setSyncStatus('success');
        setSyncFeedback(`Exported rows to ${resData.range || 'sheet'}!`);
        setTimeout(() => setSyncStatus('idle'), 4000);
      } else {
        setSyncStatus('error');
        setSyncFeedback(resData.error || 'Failed to sync to Google Sheets.');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setSyncFeedback(err.message || 'Sync failed');
    }
  };

  const handleDownloadCsv = () => {
    const headers = ['Review ID', 'Reviewer', 'Rating', 'Date', 'Customer Comment', 'Owner Reply', 'Reply Date'];
    const rows = reviews.map(r => [
      `"${r.reviewId}"`,
      `"${r.reviewer.displayName.replace(/"/g, '""')}"`,
      parseRating(r.starRating),
      `"${new Date(r.createTime).toLocaleDateString()}"`,
      `"${(r.comment || '').replace(/"/g, '""')}"`,
      `"${(r.reviewReply?.comment || '').replace(/"/g, '""')}"`,
      `"${r.reviewReply?.updateTime ? new Date(r.reviewReply.updateTime).toLocaleDateString() : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `GBP_Reviews_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isCheckingPanelAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-slate-400 text-sm font-medium">Securing session...</p>
        </div>
      </div>
    );
  }

  if (!panelUser) {
    return <LoginPage onLoginSuccess={(user) => setPanelUser(user)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-500 text-sm font-medium">Loading Google Business Profile Suite...</p>
        </div>
      </div>
    );
  }

  // Navigation Items
  const navItems: { id: TabType; label: string; icon: React.ReactElement; badge?: number | string }[] = [
    { id: 'dashboard', label: t.dashboard, icon: <BarChart3 className="w-4 h-4 flex-shrink-0" /> },
    { id: 'whatsappReport', label: t.whatsappReport, icon: <MessageCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />, badge: 'Daily' },
    { id: 'reviews', label: t.reviewsReplies, icon: <MessageSquare className="w-4 h-4 flex-shrink-0" />, badge: pendingReviews.length || undefined },
    { id: 'widget', label: t.widget, icon: <Code className="w-4 h-4 text-blue-500 flex-shrink-0" />, badge: 'Embed' },
    { id: 'reports', label: t.reportsWeekly, icon: <TrendingUp className="w-4 h-4 flex-shrink-0" /> },
    { id: 'autoreply', label: t.autoReply, icon: <Bot className="w-4 h-4 flex-shrink-0" />, badge: 'AI' },
    { id: 'growth', label: t.growthTools, icon: <QrCode className="w-4 h-4 flex-shrink-0" />, badge: 'New' },
    { id: 'posts', label: t.profilePosts, icon: <Megaphone className="w-4 h-4 flex-shrink-0" /> },
    { id: 'services', label: t.servicesManager, icon: <Briefcase className="w-4 h-4 flex-shrink-0" /> },
    { id: 'sheets', label: t.sheetsSync, icon: <FileSpreadsheet className="w-4 h-4 flex-shrink-0" /> },
    { id: 'team', label: 'Team & Access', icon: <Users className="w-4 h-4 flex-shrink-0" />, badge: panelUser?.role === 'admin' ? 'Admin' : undefined }
  ];

  return (
    <div className="flex bg-slate-50 min-h-screen w-full text-slate-800 font-sans overflow-x-hidden">
      {/* Desktop Persistent Sidebar (Hidden on mobile < 768px) - Collapsible (Chota / Bada) */}
      <aside className={`hidden md:flex ${sidebarCollapsed ? 'w-18 px-2' : 'w-64 px-4'} bg-white border-r border-slate-200 h-screen flex-col py-5 sticky top-0 overflow-y-auto sidebar-scroll z-20 flex-shrink-0 transition-all duration-300 ease-in-out`}>
        <div className={`flex items-center ${sidebarCollapsed ? 'flex-col gap-3' : 'justify-between gap-2'} mb-6`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">G</div>
            {!sidebarCollapsed && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden">
                <span className="font-bold text-slate-800 text-lg leading-tight tracking-tight">{t.appName}</span>
                <span className="text-[10px] text-slate-400 font-medium">{t.appSub}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Location Selector */}
        {!sidebarCollapsed ? (
          <div className="mb-6">
            <div className="text-[10px] uppercase font-normal text-slate-400 tracking-wider mb-2 flex items-center justify-between">
              <span>{'Location'}</span>
              <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{locations.length}</span>
            </div>
            <select 
              value={activeLoc ? (activeLoc.v4Name || activeLoc.name) : (selectedLocation || '')}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full text-xs font-normal bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
            >
              {locations.length === 0 ? (
                <option value="">{authStatus ? ('No locations found') : ('Connect Google')}</option>
              ) : (
                locations.map(loc => {
                  const val = loc.v4Name || loc.name;
                  return (
                    <option key={val} value={val}>
                      {loc.title} {loc.storeCode ? `(${loc.storeCode})` : ''}
                    </option>
                  );
                })
              )}
            </select>
          </div>
        ) : (
          <div className="mb-4 flex justify-center" title={`Active: ${activeLoc?.title || 'No Location'}`}>
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        )}

        {/* Active Location Info Card */}
        {!sidebarCollapsed && activeLoc && (activeLoc as any).categories && (
          <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 shadow-sm">
            {(activeLoc as any).categories?.primaryCategory?.displayName && (
              <div className="flex items-center gap-1.5 mb-1.5 font-medium text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                {(activeLoc as any).categories.primaryCategory.displayName}
              </div>
            )}
            {(activeLoc as any).storefrontAddress?.locality && (
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="leading-tight">
                  {(activeLoc as any).storefrontAddress.addressLines?.[0]} {(activeLoc as any).storefrontAddress.locality}
                </span>
              </div>
            )}
            {activeLoc.storeCode && (
              <div className="mt-2 text-[9px] text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                Code: {activeLoc.storeCode}
              </div>
            )}
          </div>
        )}

        {/* Nav Tabs */}
        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full sidebar-item ${sidebarCollapsed ? 'justify-center px-0 relative group' : 'px-3'} ${activeTab === item.id ? 'sidebar-item-active' : ''}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <div className={`flex items-center justify-center flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-2.5'}`}>
                {item.icon}
              </div>
              {!sidebarCollapsed && (
                <>
                  <span className={`flex-1 text-left text-sm font-normal whitespace-nowrap ${activeTab === item.id ? 'text-blue-700' : 'text-slate-900'}`}>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`text-[9px] font-normal px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1.5 ${
                      typeof item.badge === 'number' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {sidebarCollapsed && item.badge !== undefined && (
                <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer Monitor Badge */}
        <div className="mt-auto space-y-3 pt-4 border-t border-slate-100">
          {!sidebarCollapsed ? (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center font-medium text-slate-700">
                  <span className="status-pulse"></span> {t.monitoringActive}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{"Today's Revs:"}</span>
                <span className="font-bold text-slate-700 font-mono">+{todayReviews.length} new</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`${t.monitoringActive}: +${todayReviews.length} new reviews today`}>
              <span className="status-pulse mr-0"></span>
            </div>
          )}

          {authStatus ? (
            <button 
              onClick={handleLogout} 
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors ${sidebarCollapsed ? 'p-2' : ''}`}
              title={sidebarCollapsed ? t.disconnect : undefined}
            >
              <LogOut className="w-3.5 h-3.5" />
              {!sidebarCollapsed && t.disconnect}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md text-xs transition-colors flex items-center justify-center gap-2 shadow-sm ${sidebarCollapsed ? 'px-1' : 'px-3'}`}
              title={sidebarCollapsed ? t.connectGoogle : undefined}
            >
              <img src="https://www.google.com/favicon.ico" className="w-3.5 h-3.5 invert brightness-200" alt="" />
              {!sidebarCollapsed && t.connectGoogle}
            </button>
          )}

          {/* PWA Install Button in Desktop Sidebar */}
          {!isAppInstalled && (
            <div className="mb-2">
              {!sidebarCollapsed ? (
                <button
                  type="button"
                  onClick={handleInstallAppClick}
                  className="w-full p-2 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border border-indigo-200/90 rounded-lg flex items-center gap-2 text-indigo-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="Install GBP Live Sync on Desktop / Mobile"
                >
                  <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="flex-1 text-left">Install App</span>
                  <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">App</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallAppClick}
                  className="w-full flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  title="Install App"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Panel User Profile & Logout */}
          <div className="pt-2 border-t border-slate-200/80">
            {!sidebarCollapsed ? (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-1.5">
                <div className="min-w-0 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {panelUser?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate leading-tight">
                      {panelUser?.name || 'User'}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <span className={`w-1.5 h-1.5 rounded-full ${panelUser?.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                      <span className="capitalize">{panelUser?.role || 'Member'}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePanelLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Sign Out from Panel"
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePanelLogout}
                className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title={`Sign Out (${panelUser?.name})`}
              >
                <Power className="w-4 h-4 text-rose-500" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Off-Canvas Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl p-6 flex flex-col z-10 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">G</div>
                  <span className="font-bold text-slate-800 text-base">{t.appName}</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Profile Switcher */}
              <div className="mb-4">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  {'Select Location'}
                </label>
                <select 
                  value={activeLoc ? (activeLoc.v4Name || activeLoc.name) : (selectedLocation || '')}
                  onChange={(e) => {
                    handleLocationChange(e.target.value);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-700 outline-none cursor-pointer"
                >
                  {locations.length === 0 ? (
                    <option value="">{authStatus ? ('No locations found') : ('Connect Google')}</option>
                  ) : (
                    locations.map(loc => {
                      const val = loc.v4Name || loc.name;
                      return (
                        <option key={val} value={val}>
                          {loc.title} {loc.storeCode ? `(${loc.storeCode})` : ''}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              {/* Install App Banner in Mobile Drawer */}
              {!isAppInstalled && (
                <div className="mb-4 p-3 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 leading-tight">Install App</div>
                      <div className="text-[10px] text-slate-500">Fast access on home screen</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleInstallAppClick();
                    }}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Install
                  </button>
                </div>
              )}

              {/* Mobile Nav Links */}
              <nav className="space-y-1 flex-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full sidebar-item text-sm ${activeTab === item.id ? 'sidebar-item-active' : ''}`}
                  >
                    <div className="flex items-center justify-center flex-shrink-0 mr-2.5">
                      {item.icon}
                    </div>
                    <span className={`flex-1 text-left text-sm font-normal whitespace-nowrap ${activeTab === item.id ? 'text-blue-700' : 'text-slate-900'}`}>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={`text-[9px] font-normal px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1.5 ${
                        typeof item.badge === 'number' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              {panelUser && (
                <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {panelUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate leading-tight">
                        {panelUser.name}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <span className={`w-1.5 h-1.5 rounded-full ${panelUser.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                        <span className="capitalize">{panelUser.role}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handlePanelLogout();
                    }}
                    className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1 border border-rose-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-3">
                {authStatus && (
                  <button 
                    onClick={handleLogout}
                    className="w-full text-xs text-red-600 font-semibold py-1.5 text-center"
                  >
                    {t.disconnect}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main onScroll={handleMainScroll} className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto sidebar-scroll pb-20 md:pb-8">
        {/* Sticky Header with Hamburger - Smoothly auto-hides on scroll down */}
        <header className={`h-13 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 md:px-8 text-sm flex-shrink-0 sticky top-0 z-30 shadow-2xs flex-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
          headerVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}>
          {/* Left section: Hamburger menu & Profile info (Strictly Single Line) */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-nowrap">
            {/* Hamburger on Mobile */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-8 h-8 flex items-center justify-center -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-lg focus:outline-none transition-colors cursor-pointer flex-shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Location / Business Title & Status (Single Line) */}
            <div 
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileMenuOpen(true);
                }
              }}
              className="flex items-center gap-1.5 sm:gap-2 min-w-0 cursor-pointer md:cursor-default group p-1 -m-1 rounded-lg hover:bg-slate-50 md:hover:bg-transparent transition-colors flex-nowrap"
              title={'Tap to switch location'}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>

              <div className="flex items-center gap-1.5 min-w-0 flex-nowrap">
                <span className="font-bold text-slate-800 text-xs sm:text-sm truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[240px] md:max-w-[320px] whitespace-nowrap">
                  {activeLoc?.title || (authStatus ? ('No Location') : ('Connect Account'))}
                </span>
                
                {/* Live pulsing dot right next to title */}
                {activeLoc && (
                  <span className="relative flex h-2 w-2 flex-shrink-0" title="Profile Live">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}

                {/* Subtle chevron on mobile */}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 md:hidden flex-shrink-0" />
                
                {/* Live Status badge on desktop */}
                {activeLoc && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right section: Header action buttons (Single Line & Uniform Height) */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 flex-nowrap">
            {/* Gemini AI Enable / Disable Header Toggle Button */}
            <button
              onClick={toggleGeminiAi}
              disabled={togglingAi}
              className={`h-8 sm:h-9 px-2 sm:px-2.5 border rounded-lg text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-all shadow-2xs cursor-pointer whitespace-nowrap flex-shrink-0 ${
                geminiEnabled
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600'
              }`}
              title={geminiEnabled 
                ? ('Gemini AI Active - Click to Disable') 
                : ('Gemini AI Disabled - Click to Enable')}
            >
              <Sparkles className={`w-3.5 h-3.5 ${geminiEnabled ? 'text-emerald-600 fill-emerald-100' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">
                {geminiEnabled 
                  ? ('AI: On') 
                  : ('AI: Off')}
              </span>
              <span className={`w-2 h-2 rounded-full ${geminiEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            </button>

            {/* Today's review counter chip */}
            <div 
              onClick={() => setActiveTab('reviews')}
              className="h-8 sm:h-9 px-2 sm:px-2.5 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 sm:gap-1.5 transition-colors shadow-2xs cursor-pointer whitespace-nowrap flex-shrink-0"
              title={`New reviews today: +${todayReviews.length} (Click to view)`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span className="hidden sm:inline text-slate-600">{"Today:"}</span>
              <strong className="text-blue-900 font-bold">+{todayReviews.length}</strong>
            </div>

            {/* Refresh Button with feedback */}
            <button 
              onClick={async () => {
                if (isRefreshing) return;
                setIsRefreshing(true);
                try {
                  await fetchLocations(true);
                  if (activeLoc) {
                    await loadAllData(activeLoc.v4Name || activeLoc.name, true);
                  }
                } finally {
                  setTimeout(() => setIsRefreshing(false), 600);
                }
              }}
              disabled={isRefreshing}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-500 hover:text-blue-600 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
              title={'Live Refresh from Google API'}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Panel User Pill & Sign Out */}
            {panelUser && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('team')}
                  className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'team'
                      ? 'bg-indigo-50 border border-indigo-300 text-indigo-700 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700'
                  }`}
                  title={`Logged in as ${panelUser.name} (${panelUser.role}). Click to manage team.`}
                >
                  <div className="w-5 h-5 rounded-md bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {panelUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-bold truncate max-w-[90px]">
                    {panelUser.name}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    panelUser.role === 'admin' 
                      ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {panelUser.role}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handlePanelLogout}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Sign Out from Panel"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Container - Full Screen Edge-to-Edge */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
          {!authStatus && (
            <div className="card p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {'Connect Your Google Business Profile'}
                </h3>
                <p className="text-xs text-blue-100 max-w-xl">
                  {'Connect your official Google account to sync live reviews, replies, posts, operating hours, and services in real-time.'}
                </p>
              </div>
              <button
                onClick={handleConnect}
                className="px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-2 flex-shrink-0"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
                {'Connect with Google'}
              </button>
            </div>
          )}

          {authStatus && locations.length === 0 && (
            <div className="card p-8 text-center text-slate-500 space-y-3 border-dashed border-2 border-slate-300">
              <Building2 className="w-10 h-10 mx-auto text-slate-400" />
              <h3 className="text-sm font-bold text-slate-700">
                {'No Business Locations Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {'Your connected Google account does not have any active Google Business Profile locations, or permissions are pending.'}
              </p>
              <button
                onClick={() => loadAllData()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                {'Retry Live Sync'}
              </button>
            </div>
          )}

          {/* ================= TAB: DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Responsive 4 Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="card p-5 border-l-4 border-l-blue-600">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                    {"Reviews Today"}
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{todayReviews.length}</div>
                  <div className="text-[11px] text-emerald-600 mt-2 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {todayReviews.length > 0 ? `+${todayReviews.length} new reviews today` : 'Live monitoring active'}
                  </div>
                </div>

                <div className="card p-5 border-l-4 border-l-amber-500">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                    <span>{'All-Time Average Rating'}</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full uppercase">All-Time</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    {avgRating}
                    <div className="flex text-amber-400">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(Number(avgRating)) ? 'fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 font-medium">
                    {`Total ${totalRatingsCount} customer ratings (All-Time)`}
                  </div>
                </div>

                <div className="card p-5 border-l-4 border-l-emerald-500">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                    <span>{'All-Time Response Rate'}</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full uppercase">All-Time</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{responseRate}%</div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">
                    {`${repliedReviews.length} replied / ${pendingReviews.length} pending (All-Time)`}
                  </div>
                </div>

                <div className="card p-5 border-l-4 border-l-indigo-500">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                    <span>{'Posts & Services Live'}</span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded-full uppercase">All-Time</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{posts.length + services.length}</div>
                  <div className="text-[11px] text-slate-400 mt-2 font-medium">
                    {`${posts.length} posts, ${services.length} services active (All-Time)`}
                  </div>
                </div>
              </div>

              {/* Daily WhatsApp Growth Banner */}
              <div className="card p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm shadow-emerald-600/20">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        {'Daily WhatsApp Growth Report'}
                      </h4>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-sm">
                        {locations.length} {'Profiles'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {'Generate complete daily review report with today vs before comparison for all profiles linked to this Google account.'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('whatsappReport')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm shadow-xs transition-all flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer flex-shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  {'Open WhatsApp Report'}
                </button>
              </div>


              {/* Two Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Today & Recent Reviews */}
                <div className="lg:col-span-2 card overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-sm">
                        {'Recent Reviews & Owner Replies'}
                      </h3>
                      <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                        {reviews.length} {'All-Time'}
                      </span>
                    </div>
                    <button 
                      onClick={() => setActiveTab('reviews')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {'View All'} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 overflow-y-auto max-h-[440px]">
                    {reviews.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 space-y-2">
                        <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-semibold text-slate-500">
                          {'No reviews found yet'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {'Live reviews from your Google Business Profile will appear here.'}
                        </p>
                      </div>
                    ) : (
                      reviews.slice(0, 5).map((rev) => {
                        const stars = parseRating(rev.starRating);
                        const hasReply = !!rev.reviewReply?.comment;
                        const todayReview = isToday(rev.createTime);

                        return (
                          <div key={rev.reviewId} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {rev.reviewer.profilePhotoUrl ? (
                                  <img 
                                    src={rev.reviewer.profilePhotoUrl} 
                                    className="w-8 h-8 rounded-full border border-slate-200"
                                    alt=""
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                    {(rev.reviewer.displayName || 'G').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-xs text-slate-800">{rev.reviewer.displayName}</span>
                                    {todayReview && (
                                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded">
                                        TODAY
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                    <div className="flex text-amber-400">
                                      {[1,2,3,4,5].map(i => (
                                        <Star key={i} className={`w-3 h-3 ${i <= stars ? 'fill-amber-400' : 'text-slate-200'}`} />
                                      ))}
                                    </div>
                                    <span>•</span>
                                    <span>{new Date(rev.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </div>
                              </div>

                              {hasReply ? (
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1 flex-shrink-0">
                                  <CheckCheck className="w-3 h-3" /> {'Replied'}
                                </span>
                              ) : (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReplyModal(rev, true)}
                                    className="px-2 py-1 text-[11px] font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                                    title="Draft instant personalized response with Gemini AI"
                                  >
                                    <Sparkles className="w-3 h-3" /> {'AI Reply'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReplyModal(rev, false)}
                                    className="px-2 py-1 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Open reply modal"
                                  >
                                    <MessageSquare className="w-3 h-3" /> {'Reply'}
                                  </button>
                                </div>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed sm:pl-11">
                              {rev.comment || <span className="italic text-slate-400">No written text provided.</span>}
                            </p>

                            {hasReply && (
                              <div className="sm:ml-11 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  <span>Response from owner</span>
                                  <span>{new Date(rev.reviewReply!.updateTime).toLocaleDateString()}</span>
                                </div>
                                <p className="text-slate-700 italic font-medium">"{rev.reviewReply!.comment}"</p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right: Star Rating Distribution & 7-Day Activity */}
                <div className="space-y-6">
                  {/* Rating Breakdown Card */}
                  <div className="card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        Rating Breakdown
                      </h4>
                      <span className="text-[11px] font-bold text-slate-500">
                        {reviews.length} Reviews
                      </span>
                    </div>
                    <div className="space-y-2 pt-1">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = ratingDistribution[stars] || 0;
                        const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2 text-xs">
                            <span className="flex items-center gap-1 font-bold text-slate-700 w-8 flex-shrink-0">
                              {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            </span>
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  stars >= 4 ? 'bg-amber-400' : stars === 3 ? 'bg-amber-300' : 'bg-red-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="font-mono text-slate-500 text-[11px] w-14 text-right flex-shrink-0">
                              {count} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 7 Days Bar */}
                  <div className="card p-5 space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      {'Last 7 Days Velocity'}
                    </h4>
                    <div className="space-y-2">
                      {weeklyDayBreakdown.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium w-16">{item.dayName}</span>
                          <div className="flex-1 mx-3 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, item.total * 30 + 10)}%` }}
                            />
                          </div>
                          <span className="font-mono text-slate-700 font-bold w-12 text-right">{item.total} revs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: GROWTH & QR TOOLS ================= */}
          {activeTab === 'growth' && (
            <GrowthTools 
              location={activeLoc} 
              reviews={reviews} 
              geminiEnabled={geminiEnabled} 
              onToggleAi={toggleGeminiAi} 
              onOpenWhatsAppReport={() => setActiveTab('whatsappReport')}
            />
          )}

          {/* ================= TAB: DAILY WHATSAPP REPORT ================= */}
          {activeTab === 'whatsappReport' && (
            <DailyWhatsAppReport 
              onSelectLocation={(locName) => {
                handleLocationChange(locName);
                setActiveTab('dashboard');
              }}
            />
          )}

          {/* ================= TAB: WEBSITE REVIEWS WIDGET ================= */}
          {activeTab === 'widget' && (
            <WebsiteWidget 
              locations={locations}
              activeLocation={activeLoc}
              onSelectLocation={handleLocationChange}
            />
          )}

          {/* ================= TAB: REVIEWS & REPLIES ================= */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{t.reviewsReplies}</h2>
                  <p className="text-slate-500 text-xs">
                    {'Monitor feedback, read merchant replies, and publish direct responses to Google.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleDownloadCsv}
                    className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </button>

                  <button 
                    onClick={() => setActiveTab('autoreply')}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {'Auto-Reply'}
                  </button>
                </div>
              </div>

              {/* Segmented Filter Control */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg overflow-x-auto text-xs font-semibold">
                {[
                  { id: 'all', label: `${'All'} (${reviews.length})` },
                  { id: 'today', label: `${'Today'} (${todayReviews.length})` },
                  { id: 'unreplied', label: `${'Pending'} (${pendingReviews.length})` },
                  { id: 'replied', label: `${'Replied'} (${repliedReviews.length})` },
                  { id: 'critical', label: 'Critical (1-3★)' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setReviewFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                      reviewFilter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Review Cards */}
              <div className="space-y-4">
                {displayedReviews.length === 0 ? (
                  <div className="card p-12 text-center text-slate-400 space-y-3">
                    <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                    <h3 className="text-sm font-bold text-slate-600">
                      {'No reviews found'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {'No live Google reviews found matching this filter for the selected location.'}
                    </p>
                  </div>
                ) : (
                  displayedReviews.map((rev) => {
                    const stars = parseRating(rev.starRating);
                    const hasReply = !!rev.reviewReply?.comment;

                    return (
                      <div key={rev.reviewId} className="card p-5 space-y-4 transition-all hover:shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {rev.reviewer.profilePhotoUrl ? (
                              <img 
                                src={rev.reviewer.profilePhotoUrl} 
                                className="w-10 h-10 rounded-full border border-slate-200 mt-0.5 flex-shrink-0"
                                alt=""
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-bold text-sm flex items-center justify-center mt-0.5 flex-shrink-0">
                                {(rev.reviewer.displayName || 'G').charAt(0).toUpperCase()}
                              </div>
                            )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-slate-800">{rev.reviewer.displayName}</h4>
                              {isToday(rev.createTime) && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                                  TODAY
                                </span>
                              )}
                              <span className="text-xs text-slate-400 font-mono">
                                {new Date(rev.createTime).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 mt-1 text-amber-400">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i <= stars ? 'fill-amber-400' : 'text-slate-200'}`} />
                              ))}
                              <span className="text-xs font-bold text-slate-600 ml-1">{stars} / 5</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                          {hasReply ? (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                              <CheckCheck className="w-3.5 h-3.5" /> {'Replied'}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {'Pending Reply'}
                            </span>
                          )}

                          {!hasReply ? (
                            <div className="flex items-center gap-1.5">
                              <button 
                                type="button"
                                onClick={() => handleOpenReplyModal(rev, true)}
                                className="px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-md shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                                title="Draft instant response with Gemini AI"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {'AI Reply'}
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleOpenReplyModal(rev, false)}
                                className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors flex items-center gap-1 cursor-pointer border border-blue-200"
                                title="Open reply modal"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                {'Reply'}
                              </button>
                            </div>
                          ) : (
                            <button 
                              type="button"
                              onClick={() => handleOpenReplyModal(rev, false)}
                              className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              {'Edit'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Review Text */}
                      <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed">
                        {rev.comment || <span className="text-slate-400 italic">User left a rating without written feedback.</span>}
                      </div>

                      {/* Reply Box */}
                      {hasReply && (
                        <div className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-lg space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-blue-600" />
                              Official Owner Response (Published on Google)
                            </span>
                            <button 
                              onClick={() => handleDeleteReply(rev.reviewId, rev.name)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete reply"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-slate-800 font-medium">"{rev.reviewReply!.comment}"</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              </div>
            </div>
          )}

          {/* ================= TAB: REPORTS & ANALYTICS ================= */}
          {activeTab === 'reports' && (
            <ReportErrorBoundary fallbackTitle="Review Analytics & Custom Reports">
              <ReportsDashboard
                locations={locations || []}
                activeLocation={activeLoc}
                reviews={reviews || []}
                todayReviews={todayReviews || []}
                repliedReviews={repliedReviews || []}
                pendingReviews={pendingReviews || []}
                avgRating={avgRating ?? 0}
                responseRate={responseRate ?? 0}
                weeklyDayBreakdown={weeklyDayBreakdown || []}
                onDownloadCsv={handleDownloadCsv}
                onSyncToSheets={() => handleSyncToSheets(true)}
                onSelectLocation={(loc) => handleLocationChange(loc.name)}
                onNavigateTab={(tab) => setActiveTab(tab as TabType)}
                isSyncing={syncStatus === 'syncing'}
              />
            </ReportErrorBoundary>
          )}

          {/* ================= TAB: AUTO-REPLY AI ================= */}
          {activeTab === 'autoreply' && (
            <div className="space-y-6">
              {/* Gemini AI Global Enable/Disable Toggle Banner */}
              <div className={`card p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                geminiEnabled 
                  ? 'bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white border-blue-200 shadow-xs' 
                  : 'bg-gradient-to-r from-slate-100/90 to-slate-50 border-slate-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg flex items-center justify-center ${
                    geminiEnabled ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-800 text-sm">
                        Google Gemini 2.5 Flash AI
                      </h3>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 ${
                        geminiEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${geminiEnabled ? 'bg-emerald-600 animate-pulse' : 'bg-slate-500'}`} />
                        {geminiEnabled ? ('Enabled') : ('Disabled')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {geminiEnabled
                        ? ('Gemini AI is actively crafting personalized, high-conversion responses for each review.')
                        : ('AI is turned off. System will use safe template replies without calling external AI API.')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                  <button
                    onClick={toggleGeminiAi}
                    disabled={togglingAi}
                    className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap ${
                      geminiEnabled
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>
                      {togglingAi ? '...' : (geminiEnabled 
                        ? ('Disable Gemini AI') 
                        : ('Enable Gemini AI'))}
                    </span>
                  </button>
                </div>
              </div>

              {aiSettingsFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{aiSettingsFeedback}</span>
                </div>
              )}

              <div className="card p-4 border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-800">{t.autoReply}</h2>
                    {activeLoc && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold px-2.5 py-0.5 rounded-md">
                        {activeLoc.title}
                      </span>
                    )}
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      aiRules?.enabled 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {aiRules?.enabled ? 'Auto-Reply ON for this Profile' : 'Auto-Reply OFF for this Profile'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    {`Manage auto-reply settings and rules specifically for "${activeLoc?.title || 'Selected Profile'}". Each profile operates independently.`}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  {locations.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Profile:</label>
                      <select
                        value={activeLoc ? (activeLoc.v4Name || activeLoc.name) : (selectedLocation || '')}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {locations.map(loc => {
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

                  <button 
                    onClick={handleAutoReplyAllPending}
                    disabled={autoReplyingAll || pendingReviews.length === 0}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-bold flex items-center gap-2 shadow-sm whitespace-nowrap flex-shrink-0 cursor-pointer"
                  >
                    {autoReplyingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                    <span>
                      {autoReplyingAll 
                        ? 'Auto-Replying New Reviews...' 
                        : `Auto-Reply (${pendingReviews.length} Pending on This Profile)`}
                    </span>
                  </button>
                </div>
              </div>

              {autoReplyProgress && (
                <div className="card p-4 bg-blue-50 border-blue-200 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-blue-900">
                    <span>Sending AI-crafted replies...</span>
                    <span>{autoReplyProgress.current} / {autoReplyProgress.total}</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(autoReplyProgress.current / autoReplyProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <AiRulesSettings 
                    onRulesUpdated={(updated) => setAiRules(updated)}
                    locationName={activeLoc?.v4Name || activeLoc?.name}
                    locationTitle={activeLoc?.title}
                  />
                </div>

                {/* Pending list */}
                <div className="xl:col-span-1">
                  <div className="card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm">
                      {'Pending Reviews'} ({pendingReviews.length})
                    </h3>
                  </div>

                  <div className="divide-y divide-slate-100 overflow-y-auto max-h-[350px]">
                    {pendingReviews.map(rev => (
                      <div key={rev.reviewId} className="py-2.5 space-y-1 text-xs">
                        <div className="flex justify-between font-bold">
                          <span>{rev.reviewer.displayName}</span>
                          <span className="text-amber-500">{parseRating(rev.starRating)} ★</span>
                        </div>
                        <p className="text-slate-600 line-clamp-2 italic">"{rev.comment || 'Rating without comment'}"</p>
                        <button
                          type="button"
                          onClick={() => handleOpenReplyModal(rev, true)}
                          className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 pt-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Draft AI Response
                        </button>
                      </div>
                    ))}
                    {pendingReviews.length === 0 && (
                      <div className="py-8 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                        <p className="font-semibold text-xs text-slate-600">All caught up!</p>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: PROFILE POSTS ================= */}
          {activeTab === 'posts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-800">{t.profilePosts}</h2>
                      {posts.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                          {posts.length} {postsNextPageToken ? '(Latest 6)' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs">
                      {'Publish updates, offers, and events directly onto your Google Search and Maps listing.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button 
                    onClick={() => selectedLocation && fetchPosts(selectedLocation, true)}
                    disabled={loadingPosts}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    title="Refresh posts from Google"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loadingPosts ? 'animate-spin' : ''}`} />
                    <span>{'Refresh'}</span>
                  </button>

                  <button 
                    onClick={() => setShowNewPostModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    {'Create Google Post'}
                  </button>
                </div>
              </div>

              {loadingPosts && posts.length === 0 ? (
                <div className="card p-12 text-center text-slate-400 space-y-3">
                  <RefreshCw className="w-8 h-8 mx-auto text-blue-500 animate-spin" />
                  <h3 className="text-sm font-bold text-slate-600">
                    {'Loading latest 6 posts from Google...'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {'Fetching the latest Google Business Profile posts quickly.'}
                  </p>
                </div>
              ) : posts.length === 0 ? (
                <div className="card p-12 text-center text-slate-400 space-y-3">
                  <Megaphone className="w-10 h-10 mx-auto text-slate-300" />
                  <h3 className="text-sm font-bold text-slate-600">
                    {'No Google Posts yet'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {'Click "Create Google Post" above to publish live updates, announcements, or offers directly to Google.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                  <div key={post.id} className="card overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    {post.mediaUrl && (
                      <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
                        {isVideoMedia(post.mediaUrl, post.mediaFormat) ? (
                          <video 
                            src={post.mediaUrl} 
                            controls 
                            className="w-full h-full object-cover bg-black" 
                          />
                        ) : (
                          <img src={post.mediaUrl} className="w-full h-full object-cover" alt="" />
                        )}
                        <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded shadow bg-slate-900/80 text-white uppercase tracking-wider backdrop-blur-sm">
                          {post.topicType}
                        </span>
                        {isVideoMedia(post.mediaUrl, post.mediaFormat) && (
                          <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded shadow bg-blue-600/90 text-white uppercase tracking-wider backdrop-blur-sm">
                            Video
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {new Date(post.createTime).toLocaleDateString()}
                          </span>
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live on Google
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {post.summary}
                        </p>

                        {post.offer?.couponCode && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs font-mono font-bold text-amber-900 flex items-center justify-between">
                            <span>Coupon: {post.offer.couponCode}</span>
                            <Tag className="w-3.5 h-3.5 text-amber-700" />
                          </div>
                        )}
                      </div>

                      {/* Action Bar: CTA Button + Edit & Delete Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                        {post.callToAction && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CTA Button</span>
                            <a 
                              href={post.callToAction.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-md"
                            >
                              {post.callToAction.actionType}
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => openEditPostModal(post)}
                            className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title="Edit this post"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            disabled={deletingPostId === post.id}
                            className="flex-1 py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                            title="Delete this post from Google"
                          >
                            {deletingPostId === post.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span>{deletingPostId === post.id ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}

              {posts.length > 0 && postsNextPageToken && (
                <div className="flex flex-col items-center justify-center pt-2 pb-6 gap-2">
                  <button
                    type="button"
                    onClick={handleLoadMorePosts}
                    disabled={loadingMorePosts}
                    className="px-6 py-2.5 bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loadingMorePosts ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>{'Loading next 6 posts from Google...'}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                        <span>{'Load 6 More Posts'}</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-slate-400">
                    {`Showing latest ${posts.length} posts. Click above to load older posts from Google.`}
                  </span>
                </div>
              )}

              {posts.length > 0 && !postsNextPageToken && (
                <div className="text-center py-4 text-xs text-slate-400 font-medium">
                  {`✓ All ${posts.length} posts loaded`}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB: SERVICES MANAGER ================= */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{t.servicesManager}</h2>
                  <p className="text-slate-500 text-xs">
                    {'Add and manage services offered on your Google Business listing.'}
                  </p>
                </div>

                <button 
                  onClick={() => setShowAddServiceModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  {'Add Service'}
                </button>
              </div>

              {services.length === 0 ? (
                <div className="card p-12 text-center text-slate-400 space-y-3">
                  <Briefcase className="w-10 h-10 mx-auto text-slate-300" />
                  <h3 className="text-sm font-bold text-slate-600">
                    {'No services listed yet'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {'Add the services and pricing your business offers so customers can discover them on Google Maps.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {services.map((srv) => (
                  <div key={srv.id} className="card p-5 space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {srv.category}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1">{srv.name}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-1 rounded">
                          {srv.priceType === 'FREE' ? 'FREE' : `${srv.priceType === 'STARTING_AT' ? 'From ' : ''}₹${srv.price}`}
                        </span>
                        <button 
                          onClick={async () => {
                            await fetch(`/api/gbp/services/${srv.id}`, { method: 'DELETE' });
                            setServices(prev => prev.filter(s => s.id !== srv.id));
                          }}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {srv.description || 'No service description provided.'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Check className="w-3 h-3" /> Synced to Google Profile
                      </span>
                      <span>Active</span>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* ================= TAB: SHEETS SYNC ================= */}
          {activeTab === 'sheets' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{t.sheetsSync}</h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {'Export all reviews, merchant replies, and weekly analytics directly to your Google Sheet.'}
                  </p>
                </div>

                {linkedSheet && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-3 py-1 rounded-md inline-flex items-center gap-1.5 self-start sm:self-auto shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Permanent Sheet Linked
                  </span>
                )}
              </div>

              {loadingSheetInfo ? (
                <div className="card p-8 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  <p className="text-xs">Checking connected Google Sheet...</p>
                </div>
              ) : linkedSheet ? (
                /* Connected State: Sheet is already created and remembered permanently! */
                <div className="space-y-6">
                  <div className="card p-6 bg-gradient-to-r from-emerald-50/70 via-white to-white border-emerald-200 rounded-xl space-y-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md shadow-emerald-600/20">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-base">
                              {linkedSheet.title || 'GBP Live Sync Spreadsheet'}
                            </h3>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                              Connected
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 font-mono">
                            ID: {linkedSheet.spreadsheetId}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                        <a
                          href={linkedSheet.spreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open in Google Sheets ↗</span>
                        </a>

                        <button
                          type="button"
                          onClick={handleDisconnectSheet}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-red-600 border border-slate-200 rounded-md text-xs font-semibold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                          title="Disconnect this sheet to connect another"
                        >
                          Change / Disconnect
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-white/80 border border-emerald-100 rounded-md text-xs text-slate-600 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-600">
                        ⚡ <strong>Note:</strong> This Google Sheet is permanently linked to your profile. No need to recreate it each time. Whenever you click export below, all updated reviews and analytics will automatically sync into this sheet.
                      </span>
                    </div>
                  </div>

                  {/* 2 Export Action Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleSyncToSheets(false)}
                      disabled={syncStatus === 'syncing'}
                      className="p-5 bg-white border border-slate-200 hover:border-blue-500 rounded-xl text-left space-y-3 transition-all group shadow-2xs cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-600 flex items-center justify-between">
                          <span>Export Reviews Log</span>
                          <span className="text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Sync Now →</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Pushes customer name, review ID, star rating, comment, date, and owner reply into the <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Reviews_Log</code> tab.</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => handleSyncToSheets(true)}
                      disabled={syncStatus === 'syncing'}
                      className="p-5 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl text-left space-y-3 transition-all group shadow-2xs cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-600 flex items-center justify-between">
                          <span>Export Full Analytics Report</span>
                          <span className="text-[11px] font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">Sync Now →</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Pushes summary metrics, today's review counts, and 7-day performance breakdown into the <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">GBP_Analytics_Report</code> tab.</p>
                      </div>
                    </button>
                  </div>

                  {syncFeedback && (
                    <div className={`p-3.5 rounded-md text-xs font-semibold flex items-center gap-2 ${syncStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {syncStatus === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />}
                      <span>{syncFeedback}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Not Connected State: Offer 1-Click Auto Create or Manual Link */
                <div className="card p-6 space-y-6">
                  {/* Option 1: 1-Click Auto Generate */}
                  <div className="p-5 bg-gradient-to-br from-blue-50/80 via-indigo-50/30 to-white border border-blue-200 rounded-xl space-y-3 shadow-2xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-100/80 px-2 py-0.5 rounded-md inline-block">
                          Recommended (One-Time Setup)
                        </span>
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base mt-1.5 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          1-Click Auto-Create & Link Google Sheet
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                          A permanent Google Sheet named <strong>{activeLoc?.title || 'Your Business'}</strong> will be automatically created in your Google Drive with ready-to-use <strong>Reviews_Log</strong> and <strong>GBP_Analytics_Report</strong> tabs. This is a one-time setup.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleAutoCreateSheet}
                        disabled={autoCreatingSheet}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap"
                      >
                        {autoCreatingSheet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>{autoCreatingSheet ? 'Creating Google Sheet in Drive...' : 'Create & Link Google Sheet Now'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Option 2: Connect Existing Sheet (Collapsible / Alternative) */}
                  <div className="pt-2 border-t border-slate-100">
                    {!showManualSheetInput ? (
                      <button
                        type="button"
                        onClick={() => setShowManualSheetInput(true)}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline underline-offset-2 cursor-pointer"
                      >
                        Already have an existing Google Sheet? Connect with Spreadsheet ID / URL →
                      </button>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">Connect Existing Spreadsheet ID or URL</label>
                          <button
                            type="button"
                            onClick={() => setShowManualSheetInput(false)}
                            className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="Paste Spreadsheet ID or full Google Sheet URL..." 
                            value={manualSheetInput}
                            onChange={(e) => setManualSheetInput(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-700 focus:border-blue-500 outline-none font-mono shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleLinkExistingSheet(manualSheetInput)}
                            disabled={!manualSheetInput.trim()}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-black disabled:opacity-50 text-white rounded-md text-xs font-bold transition-all flex-shrink-0 cursor-pointer whitespace-nowrap shadow-2xs"
                          >
                            Link Sheet
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Paste either the ID (between <code className="bg-white px-1 py-0.5 rounded border border-slate-200">/d/</code> and <code className="bg-white px-1 py-0.5 rounded border border-slate-200">/edit</code>) or paste the full Google Sheets link.
                        </p>
                      </div>
                    )}
                  </div>

                  {syncFeedback && (
                    <div className={`p-3.5 rounded-md text-xs font-semibold flex items-center gap-2 ${syncStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {syncStatus === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />}
                      <span>{syncFeedback}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB: TEAM MANAGEMENT ================= */}
          {activeTab === 'team' && (
            <TeamManagement currentUser={panelUser} />
          )}

        </div>
      </main>

      {/* Mobile Bottom Navigation (Visible on mobile < 768px) */}
      <MobileBottomNav 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingReviewsCount={pendingReviews.length}
        openMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* Modal: Reply to Review */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl card p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Reply to Google Review</h3>
                <p className="text-slate-400 text-xs">Response publishes directly to your Google Business Profile.</p>
              </div>
              <button onClick={() => setReplyingReview(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{replyingReview.reviewer.displayName}</span>
                <span className="text-amber-500 font-bold">{parseRating(replyingReview.starRating)} ★</span>
              </div>
              <p className="text-slate-600 italic">"{replyingReview.comment || 'No text comment provided'}"</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Your Response</label>
                <button
                  type="button"
                  onClick={() => handleGenerateAiReply(replyingReview)}
                  disabled={aiGeneratingReply}
                  className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                  title="Generate or polish reply with Gemini AI"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-purple-600 ${aiGeneratingReply ? 'animate-spin' : ''}`} />
                  {aiGeneratingReply ? 'Writing with Gemini...' : (replyText.trim() ? 'AI Rewrite Reply' : 'Generate Smart AI Reply')}
                </button>
              </div>

              <textarea 
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response to the customer or click Generate Smart AI Reply above..."
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-blue-500 outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                onClick={() => setReplyingReview(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitReply}
                disabled={sendingReply || !replyText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                {sendingReply ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sendingReply ? 'Publishing...' : 'Publish to Google'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Create Post */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full card p-6 space-y-4 shadow-xl max-h-[92vh] overflow-y-auto transition-all duration-300 ${showFbImporter ? 'max-w-5xl' : 'max-w-lg'}`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Create Google Business Post</h3>
              </div>
              <button 
                onClick={() => { setShowNewPostModal(false); setShowFbImporter(false); }} 
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className={`grid gap-5 ${showFbImporter ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Facebook Page Importer Panel */}
              {showFbImporter && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 flex flex-col">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>Facebook Page Feed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddFbPage(prev => !prev)}
                        className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors border border-blue-200"
                        title="Add and save a new Facebook page"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Page</span>
                      </button>
                      <a 
                        href={fbPageUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                        title="Open this Facebook page in new tab"
                      >
                        <span>Open Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Inline Add New Facebook Page Form */}
                  {showAddFbPage && (
                    <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg space-y-2 text-xs">
                      <div className="font-bold text-blue-800 text-[11px] flex items-center justify-between">
                        <span>Save New Facebook Page</span>
                        <button 
                          type="button" 
                          onClick={() => setShowAddFbPage(false)} 
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={newFbPageName}
                          onChange={(e) => setNewFbPageName(e.target.value)}
                          placeholder="Page Label (e.g. Coaching Sikar)"
                          className="p-1.5 bg-white border border-blue-300 rounded text-[11px] outline-none"
                        />
                        <input
                          type="text"
                          value={newFbPageUrl}
                          onChange={(e) => setNewFbPageUrl(e.target.value)}
                          placeholder="https://www.facebook.com/yourpage"
                          className="p-1.5 bg-white border border-blue-300 rounded text-[11px] outline-none font-mono"
                        />
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowAddFbPage(false)}
                          className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddFbPage}
                          disabled={!newFbPageUrl.trim()}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-[11px] font-bold cursor-pointer shadow-2xs"
                        >
                          Save & Load
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Compact Unified Bar: Page Select + URL Input + Load Button */}
                  <div className="flex items-center gap-1.5 w-full bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
                    <select
                      value={fbPageUrl}
                      onChange={(e) => handleSelectFbPage(e.target.value)}
                      className="w-24 sm:w-28 h-7 px-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer truncate shrink-0"
                      title="Select saved Facebook page"
                    >
                      {savedFbPages.map(p => (
                        <option key={p.url} value={p.url}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <input 
                      type="text" 
                      value={tempFbPageInput}
                      onChange={(e) => setTempFbPageInput(e.target.value)}
                      placeholder="Paste FB page URL..."
                      className="flex-1 min-w-0 h-7 px-2 bg-transparent text-[10px] text-slate-700 placeholder:text-slate-400 outline-none font-mono"
                    />

                    {savedFbPages.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveFbPage(fbPageUrl, e)}
                        title="Delete this saved page"
                        className="h-7 w-6 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer shrink-0 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSelectFbPage(tempFbPageInput)}
                      className="h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer whitespace-nowrap shadow-2xs shrink-0 flex items-center gap-1 transition-all"
                      title="Load Facebook Page Feed"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Load</span>
                    </button>
                  </div>

                  {/* Embedded Facebook Page Iframe Widget as per user spec */}
                  <div className="fb-page shadow-xs rounded-lg overflow-hidden bg-white w-full border border-slate-200 flex-1 min-h-[360px]">
                    <iframe
                      key={fbPageUrl}
                      src={`https://www.facebook.com/v17.0/plugins/page.php?adapt_container_width=true&app_id=&container_width=450&height=400&hide_cover=false&href=${encodeURIComponent(fbPageUrl)}&locale=en_US&sdk=joey&show_facepile=true&small_header=false&tabs=timeline&width=450`}
                      width="100%"
                      height="380"
                      style={{ border: 'none', overflow: 'hidden' }}
                      scrolling="yes"
                      frameBorder="0"
                      allowFullScreen={true}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      className="w-full h-full min-h-[360px]"
                      title="Facebook Page Live Timeline"
                    />
                  </div>

                  {/* Smart Post Extractor */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Post Content & Photo Extractor
                      </span>
                      <span className="text-[10px] text-slate-400">Copy text/image from feed above</span>
                    </div>
                    <textarea
                      rows={2}
                      value={fbPastedContent}
                      onChange={(e) => setFbPastedContent(e.target.value)}
                      placeholder="Paste post text, photo link, or embed code here..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-blue-500 resize-none font-sans"
                    />

                    {fbExtractionSuccess && (
                      <div className="p-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{fbExtractionSuccess}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        disabled={!fbPastedContent.trim() || extractingFbPost}
                        onClick={() => handleExtractFbPost(false, false)}
                        className="flex-1 min-w-[125px] py-1.5 px-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-[11px] rounded shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="Extracts caption into text content and photo into media upload"
                      >
                        {extractingFbPost ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Extracting...</span>
                          </>
                        ) : (
                          <span>⚡ Extract Caption & Photo</span>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={(!fbPastedContent.trim() && !newPostSummary.trim()) || extractingFbPost}
                        onClick={() => {
                          if (fbPastedContent.trim()) {
                            handleExtractFbPost(false, true);
                          } else {
                            handleAiPostAction(false);
                          }
                        }}
                        className="flex-1 min-w-[130px] py-1.5 px-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-[11px] rounded shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="Extracts post and rewrites Google post based specifically on this post's content"
                      >
                        {extractingFbPost ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Extracting...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span>Extract & AI Rewrite</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Post Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['STANDARD', 'OFFER', 'EVENT'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewPostType(type)}
                        className={`p-2 rounded-lg border font-bold text-center cursor-pointer transition-all ${newPostType === type ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                      >
                        {type === 'STANDARD' ? "What's New" : type === 'OFFER' ? 'Special Offer' : 'Event'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-1.5 flex-nowrap w-full overflow-hidden">
                    <label className="font-bold text-slate-800 text-xs shrink-0 whitespace-nowrap">Post Summary / Text</label>
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
                      <button
                        type="button"
                        onClick={() => handleAiPostAction(false)}
                        disabled={generatingAiPost}
                        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-md text-[10px] sm:text-[11px] font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                        title={newPostSummary.trim() ? "AI Rewrite & Polish this post with CTA" : "Auto-generate a new post draft with Gemini AI"}
                      >
                        <Sparkles className={`w-3 h-3 ${generatingAiPost ? 'animate-spin' : ''}`} />
                        <span>{generatingAiPost ? 'Writing...' : (newPostSummary.trim() ? 'AI Rewrite' : 'Generate with AI')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowFbImporter(prev => !prev)}
                        className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer shadow-2xs whitespace-nowrap shrink-0 ${
                          showFbImporter 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                        }`}
                        title="Import content from Facebook Page feed"
                      >
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span>{showFbImporter ? 'Hide FB' : 'Import from Facebook'}</span>
                      </button>
                    </div>
                  </div>
                  <textarea 
                    rows={4}
                    value={newPostSummary}
                    onChange={(e) => setNewPostSummary(e.target.value)}
                    placeholder="Announce your update, offers, or events on Google..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                {newPostType === 'OFFER' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Coupon Code (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="SPECIAL20"
                      value={newPostCoupon}
                      onChange={(e) => setNewPostCoupon(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-mono"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Call to Action (Button)</label>
                    <select 
                      value={newPostCtaType}
                      onChange={(e: any) => setNewPostCtaType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none cursor-pointer font-semibold"
                    >
                      <option value="NONE">None</option>
                      <option value="CALL">Call Now (Phone Call)</option>
                      <option value="LEARN_MORE">Learn More</option>
                      <option value="BOOK">Book</option>
                      <option value="ORDER">Order Online</option>
                      <option value="SHOP">Shop</option>
                      <option value="SIGN_UP">Sign Up</option>
                    </select>
                  </div>

                  <div>
                    {newPostCtaType === 'CALL' ? (
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Phone Number for Call (Optional)
                        </label>
                        <input 
                          type="text" 
                          value={newPostCtaUrl}
                          onChange={(e) => setNewPostCtaUrl(e.target.value)}
                          placeholder="+91 9610447938 (or blank for listing phone)"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-white font-mono"
                        />
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setNewPostCtaUrl('+91 9610447938')}
                            className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer font-mono"
                          >
                            +91 9610447938
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewPostCtaUrl('+91 9024031003')}
                            className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer font-mono"
                          >
                            +91 9024031003
                          </button>
                        </div>
                      </div>
                    ) : newPostCtaType === 'NONE' ? (
                      <div>
                        <label className="font-bold text-slate-400 block mb-1">Target Link URL</label>
                        <input 
                          type="text" 
                          disabled 
                          placeholder="No URL needed" 
                          className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-400 cursor-not-allowed font-medium" 
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Target Link URL (Optional)
                        </label>
                        <input 
                          type="text" 
                          value={newPostCtaUrl}
                          onChange={(e) => setNewPostCtaUrl(e.target.value)}
                          placeholder="https://... (Optional)"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-white font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Photo or Video URL</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={newPostMediaUrl}
                      onChange={(e) => setNewPostMediaUrl(e.target.value)}
                      placeholder="https://example.com/media.mp4 or upload below"
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-white"
                    />
                    <input 
                      ref={createFileInputRef}
                      type="file" 
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFilePicked(file, false);
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingWebp}
                      onClick={() => createFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                      title="Upload photo or video from your computer or phone"
                    >
                      {uploadingWebp ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Photo / Video</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supports photos (JPG, PNG, WebP) & videos (MP4, MOV, WebM) — auto-formatted for Google Business Profile.
                  </p>
                  {newPostMediaUrl && (
                    <div className="mt-2 relative inline-block group border border-slate-200 rounded-lg overflow-hidden bg-slate-100 shadow-2xs">
                      {isVideoMedia(newPostMediaUrl) ? (
                        <video 
                          src={newPostMediaUrl} 
                          controls 
                          className="w-48 h-28 object-cover rounded-lg bg-black" 
                        />
                      ) : (
                        <img 
                          src={newPostMediaUrl} 
                          alt="Post Preview" 
                          className="w-32 h-20 object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setNewPostMediaUrl('')}
                        className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-700 text-white w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center cursor-pointer shadow"
                        title="Remove media"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button 
                onClick={() => { setShowNewPostModal(false); setShowFbImporter(false); }} 
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreatePost}
                disabled={creatingPost || !newPostSummary.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                {creatingPost ? 'Publishing...' : 'Publish to Google'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Edit Post */}
      {showEditPostModal && editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full card p-6 space-y-4 shadow-xl max-h-[92vh] overflow-y-auto transition-all duration-300 ${showEditFbImporter ? 'max-w-5xl' : 'max-w-lg'}`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Edit Google Business Post</h3>
              </div>
              <button 
                onClick={() => { setShowEditPostModal(false); setEditingPost(null); setShowEditFbImporter(false); }} 
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className={`grid gap-5 ${showEditFbImporter ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Facebook Page Importer Panel */}
              {showEditFbImporter && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 flex flex-col">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>Facebook Page Feed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddFbPage(prev => !prev)}
                        className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors border border-blue-200"
                        title="Add and save a new Facebook page"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Page</span>
                      </button>
                      <a 
                        href={fbPageUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                        title="Open this Facebook page in new tab"
                      >
                        <span>Open Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Inline Add New Facebook Page Form */}
                  {showAddFbPage && (
                    <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg space-y-2 text-xs">
                      <div className="font-bold text-blue-800 text-[11px] flex items-center justify-between">
                        <span>Save New Facebook Page</span>
                        <button 
                          type="button" 
                          onClick={() => setShowAddFbPage(false)} 
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={newFbPageName}
                          onChange={(e) => setNewFbPageName(e.target.value)}
                          placeholder="Page Label (e.g. Coaching Sikar)"
                          className="p-1.5 bg-white border border-blue-300 rounded text-[11px] outline-none"
                        />
                        <input
                          type="text"
                          value={newFbPageUrl}
                          onChange={(e) => setNewFbPageUrl(e.target.value)}
                          placeholder="https://www.facebook.com/yourpage"
                          className="p-1.5 bg-white border border-blue-300 rounded text-[11px] outline-none font-mono"
                        />
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowAddFbPage(false)}
                          className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddFbPage}
                          disabled={!newFbPageUrl.trim()}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-[11px] font-bold cursor-pointer shadow-2xs"
                        >
                          Save & Load
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Compact Unified Bar: Page Select + URL Input + Load Button */}
                  <div className="flex items-center gap-1.5 w-full bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
                    <select
                      value={fbPageUrl}
                      onChange={(e) => handleSelectFbPage(e.target.value)}
                      className="w-24 sm:w-28 h-7 px-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer truncate shrink-0"
                      title="Select saved Facebook page"
                    >
                      {savedFbPages.map(p => (
                        <option key={p.url} value={p.url}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <input 
                      type="text" 
                      value={tempFbPageInput}
                      onChange={(e) => setTempFbPageInput(e.target.value)}
                      placeholder="Paste FB page URL..."
                      className="flex-1 min-w-0 h-7 px-2 bg-transparent text-[10px] text-slate-700 placeholder:text-slate-400 outline-none font-mono"
                    />

                    {savedFbPages.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveFbPage(fbPageUrl, e)}
                        title="Delete this saved page"
                        className="h-7 w-6 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer shrink-0 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSelectFbPage(tempFbPageInput)}
                      className="h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer whitespace-nowrap shadow-2xs shrink-0 flex items-center gap-1 transition-all"
                      title="Load Facebook Page Feed"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Load</span>
                    </button>
                  </div>

                  {/* Embedded Facebook Page Iframe Widget as per user spec */}
                  <div className="fb-page shadow-xs rounded-lg overflow-hidden bg-white w-full border border-slate-200 flex-1 min-h-[360px]">
                    <iframe
                      key={fbPageUrl}
                      src={`https://www.facebook.com/v17.0/plugins/page.php?adapt_container_width=true&app_id=&container_width=450&height=400&hide_cover=false&href=${encodeURIComponent(fbPageUrl)}&locale=en_US&sdk=joey&show_facepile=true&small_header=false&tabs=timeline&width=450`}
                      width="100%"
                      height="380"
                      style={{ border: 'none', overflow: 'hidden' }}
                      scrolling="yes"
                      frameBorder="0"
                      allowFullScreen={true}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      className="w-full h-full min-h-[360px]"
                      title="Facebook Page Live Timeline"
                    />
                  </div>

                  {/* Smart Post Extractor */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Post Content & Photo Extractor
                      </span>
                      <span className="text-[10px] text-slate-400">Copy text/image from feed above</span>
                    </div>
                    <textarea
                      rows={2}
                      value={fbPastedContent}
                      onChange={(e) => setFbPastedContent(e.target.value)}
                      placeholder="Paste post text, photo link, or embed code here..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-blue-500 resize-none font-sans"
                    />

                    {fbExtractionSuccess && (
                      <div className="p-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{fbExtractionSuccess}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        disabled={!fbPastedContent.trim() || extractingFbPost}
                        onClick={() => handleExtractFbPost(true, false)}
                        className="flex-1 min-w-[125px] py-1.5 px-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-[11px] rounded shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="Extracts caption into text content and photo into media upload"
                      >
                        {extractingFbPost ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Extracting...</span>
                          </>
                        ) : (
                          <span>⚡ Extract Caption & Photo</span>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={(!fbPastedContent.trim() && !editPostSummary.trim()) || extractingFbPost}
                        onClick={() => {
                          if (fbPastedContent.trim()) {
                            handleExtractFbPost(true, true);
                          } else {
                            handleAiPostAction(true);
                          }
                        }}
                        className="flex-1 min-w-[130px] py-1.5 px-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-[11px] rounded shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="Extracts post and rewrites Google post based specifically on this post's content"
                      >
                        {extractingFbPost ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Extracting...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span>Extract & AI Rewrite</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Post Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['STANDARD', 'OFFER', 'EVENT'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEditPostType(type)}
                        className={`p-2 rounded-md border font-bold text-center transition-all cursor-pointer ${editPostType === type ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                      >
                        {type === 'STANDARD' ? "What's New" : type === 'OFFER' ? 'Special Offer' : 'Event'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-1.5 flex-nowrap w-full overflow-hidden">
                    <label className="font-bold text-slate-800 text-xs shrink-0 whitespace-nowrap">Post Summary / Text</label>
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
                      <button
                        type="button"
                        onClick={() => handleAiPostAction(true)}
                        disabled={generatingAiPost}
                        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-md text-[10px] sm:text-[11px] font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                        title={editPostSummary.trim() ? "AI Rewrite & Polish this post with CTA" : "Auto-generate a new post draft with Gemini AI"}
                      >
                        <Sparkles className={`w-3 h-3 ${generatingAiPost ? 'animate-spin' : ''}`} />
                        <span>{generatingAiPost ? 'Writing...' : (editPostSummary.trim() ? 'AI Rewrite' : 'Generate with AI')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEditFbImporter(prev => !prev)}
                        className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer shadow-2xs whitespace-nowrap shrink-0 ${
                          showEditFbImporter 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                        }`}
                        title="Import content from Facebook Page feed"
                      >
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span>{showEditFbImporter ? 'Hide FB' : 'Import from Facebook'}</span>
                      </button>
                    </div>
                  </div>
                  <textarea 
                    rows={4}
                    value={editPostSummary}
                    onChange={(e) => setEditPostSummary(e.target.value)}
                    placeholder="Update your announcement or offer text..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                {editPostType === 'OFFER' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Coupon Code (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="SPECIAL20"
                      value={editPostCoupon}
                      onChange={(e) => setEditPostCoupon(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs outline-none font-mono"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Call to Action (Button)</label>
                    <select 
                      value={editPostCtaType}
                      onChange={(e: any) => setEditPostCtaType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs outline-none cursor-pointer font-semibold"
                    >
                      <option value="NONE">None</option>
                      <option value="CALL">Call Now (Phone Call)</option>
                      <option value="LEARN_MORE">Learn More</option>
                      <option value="BOOK">Book</option>
                      <option value="ORDER">Order Online</option>
                      <option value="SHOP">Shop</option>
                      <option value="SIGN_UP">Sign Up</option>
                    </select>
                  </div>

                  <div>
                    {editPostCtaType === 'CALL' ? (
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Phone Number for Call (Optional)
                        </label>
                        <input 
                          type="text" 
                          value={editPostCtaUrl}
                          onChange={(e) => setEditPostCtaUrl(e.target.value)}
                          placeholder="+91 9610447938 (or blank for listing phone)"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-500 focus:bg-white font-mono"
                        />
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setEditPostCtaUrl('+91 9610447938')}
                            className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer font-mono"
                          >
                            +91 9610447938
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditPostCtaUrl('+91 9024031003')}
                            className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer font-mono"
                          >
                            +91 9024031003
                          </button>
                        </div>
                      </div>
                    ) : editPostCtaType === 'NONE' ? (
                      <div>
                        <label className="font-bold text-slate-400 block mb-1">Target Link URL</label>
                        <input 
                          type="text" 
                          disabled 
                          placeholder="No URL needed" 
                          className="w-full p-2 bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-400 cursor-not-allowed font-medium" 
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Target Link URL (Optional)
                        </label>
                        <input 
                          type="text" 
                          value={editPostCtaUrl}
                          onChange={(e) => setEditPostCtaUrl(e.target.value)}
                          placeholder="https://... (Optional)"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-500 focus:bg-white font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Photo or Video URL</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={editPostMediaUrl}
                      onChange={(e) => setEditPostMediaUrl(e.target.value)}
                      placeholder="https://example.com/media.mp4 or upload below"
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-500 focus:bg-white"
                    />
                    <input 
                      ref={editFileInputRef}
                      type="file" 
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFilePicked(file, true);
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingWebp}
                      onClick={() => editFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md text-xs font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                      title="Upload photo or video from your computer or phone"
                    >
                      {uploadingWebp ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Photo / Video</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supports photos (JPG, PNG, WebP) & videos (MP4, MOV, WebM) — auto-formatted for Google Business Profile.
                  </p>
                  {editPostMediaUrl && (
                    <div className="mt-2 relative inline-block group border border-slate-200 rounded-lg overflow-hidden bg-slate-100 shadow-2xs">
                      {isVideoMedia(editPostMediaUrl) ? (
                        <video 
                          src={editPostMediaUrl} 
                          controls 
                          className="w-48 h-28 object-cover rounded-lg bg-black" 
                        />
                      ) : (
                        <img 
                          src={editPostMediaUrl} 
                          alt="Post Preview" 
                          className="w-32 h-20 object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setEditPostMediaUrl('')}
                        className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-700 text-white w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center cursor-pointer shadow"
                        title="Remove media"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => { setShowEditPostModal(false); setEditingPost(null); setShowEditFbImporter(false); }} 
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleUpdatePost}
                disabled={updatingPost || !editPostSummary.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {updatingPost && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{updatingPost ? 'Updating...' : 'Save Changes'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Add Service */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md card p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Add Business Service</h3>
              <button onClick={() => setShowAddServiceModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select 
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="Dining & Experiences">Dining & Experiences</option>
                  <option value="Catering & Events">Catering & Events</option>
                  <option value="Takeaway & Delivery">Takeaway & Delivery</option>
                  <option value="Reservations & VIP">Reservations & VIP</option>
                  <option value="Custom Service">Custom Service</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Service Name</label>
                <input 
                  type="text" 
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g. Birthday Party Hall Booking"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price Type</label>
                  <select 
                    value={newServicePriceType}
                    onChange={(e: any) => setNewServicePriceType(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  >
                    <option value="FIXED">Fixed Price</option>
                    <option value="STARTING_AT">Starting At</option>
                    <option value="FREE">Free</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price (₹)</label>
                  <input 
                    type="number" 
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    disabled={newServicePriceType === 'FREE'}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none disabled:opacity-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea 
                  rows={2}
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  placeholder="Details about what is included..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowAddServiceModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">
                Cancel
              </button>
              <button 
                onClick={handleAddService}
                disabled={!newServiceName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Save Service
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* PWA Install Guide Modal */}
      {showInstallGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative"
          >
            <button 
              onClick={() => setShowInstallGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Install GBP Live Sync</h3>
                <p className="text-xs text-slate-500">Fast 1-click access right from your screen</p>
              </div>
            </div>

            <div className="space-y-3.5 my-5 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">1</span>
                  Android (Chrome / Edge)
                </div>
                <p className="text-slate-600 pl-6.5 leading-relaxed">
                  Tap browser menu <strong>(⋮)</strong> at top-right &rarr; Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">2</span>
                  iPhone & iPad (Safari)
                </div>
                <p className="text-slate-600 pl-6.5 leading-relaxed">
                  Tap the <strong>Share</strong> button (box with up arrow) &rarr; Scroll down and tap <strong>"Add to Home Screen"</strong> (➕).
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">3</span>
                  Windows & Mac (Desktop)
                </div>
                <p className="text-slate-600 pl-6.5 leading-relaxed">
                  Look at the right side of the URL bar at the top &rarr; Click the <strong>Install icon</strong> (🖥️ or ⊕) &rarr; Click <strong>"Install"</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => setShowInstallGuideModal(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Got It, Thank You!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
