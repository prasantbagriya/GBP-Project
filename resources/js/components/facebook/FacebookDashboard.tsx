import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Share2, 
  MessageSquare, 
  Settings, 
  Bot, 
  ExternalLink, 
  LogOut, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  ThumbsUp, 
  Key, 
  ShieldCheck, 
  HelpCircle,
  X,
  ChevronDown,
  Layers,
  Inbox
} from 'lucide-react';
import { FacebookPageItem } from '../../types';
import { FacebookPostStudio } from './FacebookPostStudio';
import { FacebookCommentsModerator } from './FacebookCommentsModerator';
import { FacebookPageSettings } from './FacebookPageSettings';
import { FacebookInbox } from './FacebookInbox';
import { FacebookAiRules } from './FacebookAiRules';

type FbSubTab = 'posts' | 'comments' | 'settings' | 'inbox' | 'rules';

export const FacebookDashboard: React.FC = () => {
  const [configured, setConfigured] = useState<boolean>(true);
  const [pages, setPages] = useState<FacebookPageItem[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<FbSubTab>('posts');
  const [loading, setLoading] = useState<boolean>(true);

  // Manual token modal
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>('');
  const [manualPageId, setManualPageId] = useState<string>('me');
  const [connectingManual, setConnectingManual] = useState<boolean>(false);

  // Connecting OAuth
  const [connectingOauth, setConnectingOauth] = useState<boolean>(false);

  // Focus comment post ID if navigated from Post Studio
  const [focusedPostId, setFocusedPostId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  useEffect(() => {
    checkStatus();

    // Check URL query parameters for OAuth redirects
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');
    const msgParam = params.get('message');
    if (statusParam === 'connected') {
      setFeedback({ type: 'success', message: 'Facebook Page successfully connected!' });
      window.history.replaceState({}, document.title, window.location.pathname + '?tab=facebook');
    } else if (statusParam === 'error' && msgParam) {
      setFeedback({ type: 'error', message: decodeURIComponent(msgParam) });
    } else if (statusParam === 'warning' && msgParam) {
      setFeedback({ type: 'warning', message: decodeURIComponent(msgParam) });
    }
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fb/status');
      const data = await res.json();
      setConfigured(Boolean(data.configured));
      setPages(data.pages || []);
      if (data.pages && data.pages.length > 0) {
        if (!selectedPageId || !data.pages.some((p: FacebookPageItem) => p.id === selectedPageId)) {
          setSelectedPageId(data.pages[0].id);
        }
      } else {
        setSelectedPageId(null);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to check Facebook status.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthConnect = async () => {
    setConnectingOauth(true);
    try {
      const res = await fetch('/api/fb/auth-url');
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setFeedback({ type: 'error', message: data.message || 'Facebook App ID is not configured.' });
        setConnectingOauth(false);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Could not connect to Facebook OAuth.' });
      setConnectingOauth(false);
    }
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;

    setConnectingManual(true);
    try {
      const res = await fetch('/api/fb/manual-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          access_token: manualToken.trim(),
          page_id: manualPageId.trim() || 'me',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowManualModal(false);
        setManualToken('');
        setManualPageId('me');
        setFeedback({ type: 'success', message: data.message });
        checkStatus();
      } else {
        alert(data.message || 'Connection failed.');
      }
    } catch (err) {
      alert('Network error connecting page.');
    } finally {
      setConnectingManual(false);
    }
  };

  const handleDisconnect = async (id: number) => {
    if (!confirm('Are you sure you want to disconnect this Facebook Page from the system?')) {
      return;
    }

    try {
      const res = await fetch(`/api/fb/pages/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        checkStatus();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to disconnect page.' });
    }
  };

  const activePage = pages.find(p => p.id === selectedPageId) || pages[0] || null;

  return (
    <div className="space-y-6">
      {/* Top Header Banner - Only shown when NO page is connected */}
      {pages.length === 0 && (
        <div className="card p-5 sm:p-6 bg-slate-900 text-white border border-slate-800 shadow-xs relative overflow-hidden rounded-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-medium flex items-center gap-1">
                  <Share2 className="w-3 h-3" /> Meta Graph API v21
                </span>
                <span className="text-[11px] text-slate-400">Token Sync</span>
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Facebook Page Management Suite
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Post updates, moderate comments with Gemini AI, reply to Messenger inquiries, and control page settings live.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowManualModal(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Page via Token</span>
              </button>

              <button
                type="button"
                onClick={handleOAuthConnect}
                disabled={connectingOauth}
                className="px-3.5 py-1.5 bg-white text-blue-800 hover:bg-blue-50 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                {connectingOauth ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Share2 className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>Connect Facebook Page</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div className={`p-3.5 rounded-lg flex items-center justify-between gap-2 text-xs font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : feedback.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* If No Pages Connected: Onboarding Card */}
      {loading ? (
        <div className="card p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Checking connected Facebook accounts...</p>
        </div>
      ) : pages.length === 0 ? (
        <div className="card p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
            <Share2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-800">
              No Facebook Page Connected Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Connect your official Facebook Page to manage posts, auto-reply to comments with Gemini AI, and respond to direct customer messages.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleOAuthConnect}
              disabled={connectingOauth}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Connect via Facebook Login</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManualModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <Key className="w-4 h-4 text-indigo-600" />
              <span>Connect via Page Access Token</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-left text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-Loss Permanent Token Storage</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Tokens are permanently saved in your local database so you never have to re-login repeatedly.
            </p>
          </div>
        </div>
      ) : activePage ? (
        <>
          {/* Active Page Bar & Sub-Tabs Navigation */}
          <div className="card p-3.5 sm:p-4 space-y-3.5 rounded-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              {/* Page Selector */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md overflow-hidden bg-blue-50 border border-slate-200 shrink-0 flex items-center justify-center">
                  {activePage.avatar_url ? (
                    <img src={activePage.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-5 h-5 text-blue-600" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {pages.length > 1 ? (
                      <select
                        value={activePage.id}
                        onChange={(e) => setSelectedPageId(Number(e.target.value))}
                        className="font-bold text-slate-800 text-sm bg-transparent outline-none cursor-pointer border-b border-dashed border-slate-300 pr-4"
                      >
                        {pages.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.followers_count.toLocaleString()} fans)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <h3 className="font-bold text-slate-800 text-sm">
                        {activePage.name}
                      </h3>
                    )}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {activePage.category || 'Page'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-blue-600 font-semibold">
                      <Users className="w-3.5 h-3.5" />
                      {activePage.followers_count.toLocaleString()} Followers
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                      {activePage.likes_count.toLocaleString()} Likes
                    </span>
                  </div>
                </div>
              </div>

              {/* Page Quick Actions */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => setShowManualModal(true)}
                  className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                  title="Connect another page with access token"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="whitespace-nowrap">Add Page</span>
                </button>

                <a
                  href={`https://facebook.com/${activePage.page_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">View on Facebook</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleDisconnect(activePage.id)}
                  className="px-2.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                  title="Disconnect Page"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Disconnect</span>
                </button>
              </div>
            </div>

            {/* Sub-Tabs Navigation */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              <button
                type="button"
                onClick={() => setActiveSubTab('posts')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeSubTab === 'posts' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Posts Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('comments')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeSubTab === 'comments' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Comments & Moderation</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('inbox')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeSubTab === 'inbox' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Messenger Inbox</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('settings')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeSubTab === 'settings' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Page Info & Settings</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('rules')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeSubTab === 'rules' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Auto-Reply Rules</span>
              </button>
            </div>
          </div>

          {/* Sub-Tab Content Rendering */}
          <div className="pt-1">
            {activeSubTab === 'posts' && (
              <FacebookPostStudio
                page={activePage}
                onOpenComments={(postId) => {
                  setFocusedPostId(postId);
                  setActiveSubTab('comments');
                }}
              />
            )}

            {activeSubTab === 'comments' && (
              <FacebookCommentsModerator
                page={activePage}
                initialPostId={focusedPostId}
              />
            )}

            {activeSubTab === 'inbox' && (
              <FacebookInbox page={activePage} />
            )}

            {activeSubTab === 'settings' && (
              <FacebookPageSettings
                page={activePage}
                onPageUpdated={(updated) => {
                  setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
                }}
              />
            )}

            {activeSubTab === 'rules' && (
              <FacebookAiRules page={activePage} />
            )}
          </div>
        </>
      ) : null}

      {/* CONNECT VIA MANUAL TOKEN MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-md w-full bg-white shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>Connect Page via Access Token</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              If you generated a Page Access Token from Graph API Explorer or Meta Business Suite, paste it here to connect immediately.
            </p>

            <form onSubmit={handleManualConnect} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Page Access Token <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  rows={3}
                  required
                  placeholder="EAA..."
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Page ID (Optional, defaults to 'me')
                </label>
                <input
                  type="text"
                  value={manualPageId}
                  onChange={(e) => setManualPageId(e.target.value)}
                  placeholder="e.g., 104857291823"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connectingManual || !manualToken.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {connectingManual ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Connect Page</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
