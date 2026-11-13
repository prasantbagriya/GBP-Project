import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  User,
  Bot,
  Send,
  Sparkles,
  Lock,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Globe,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Volume2,
  VolumeX,
  Bookmark,
  ChevronDown,
  Info,
  Phone,
  Mail,
  MapPin,
  Star,
  Users,
  X,
  ArrowRight,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { ChatConversationItem, ChatMessageItem, ChatCannedResponseItem, PanelUser } from '../../types';

interface ChatInboxProps {
  panelUser: PanelUser | null;
}

export const ChatInbox: React.FC<ChatInboxProps> = ({ panelUser }) => {
  const [conversations, setConversations] = useState<ChatConversationItem[]>([]);
  const [counts, setCounts] = useState({ all: 0, unassigned: 0, mine: 0, bot: 0, resolved: 0 });
  const [activeFilter, setActiveFilter] = useState<'all' | 'unassigned' | 'mine' | 'bot' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: number; name: string; email: string; role: string }>>([]);

  // Mobile / Responsive Navigation state: 'list' (inbox queue) | 'chat' (active message thread) | 'details' (visitor telemetry)
  const [mobilePane, setMobilePane] = useState<'list' | 'chat' | 'details'>('list');
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(true);

  // Message composer
  const [replyText, setReplyText] = useState('');
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Canned responses
  const [cannedResponses, setCannedResponses] = useState<ChatCannedResponseItem[]>([]);
  const [showCannedDropdown, setShowCannedDropdown] = useState(false);

  // Status & Priority updating
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reassigning, setReassigning] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number>(0);

  // Synthesize pleasant sound notification using Web Audio API
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (_) {}
  };

  // Fetch conversations list
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const params = new URLSearchParams({
        filter: activeFilter,
        search: searchQuery
      });
      const res = await fetch(`/api/chat/admin/conversations?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
        if (data.counts) setCounts(data.counts);

        // Auto-select first if none selected on desktop
        if (!selectedUuid && data.conversations.length > 0 && window.innerWidth >= 1024) {
          setSelectedUuid(data.conversations[0].uuid);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  // Fetch full details & messages of selected conversation
  const fetchConversationDetails = async (uuid: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/admin/conversations/${uuid}`);
      const data = await res.json();
      if (data.success) {
        setSelectedConversation(data.conversation);
        setMessages(data.messages || []);
        if (data.team_members) setTeamMembers(data.team_members);

        // Check for new message sound
        if (data.messages && data.messages.length > 0) {
          const maxId = Math.max(...data.messages.map((m: any) => m.id));
          if (lastMessageIdRef.current > 0 && maxId > lastMessageIdRef.current) {
            const latestMsg = data.messages.find((m: any) => m.id === maxId);
            if (latestMsg && latestMsg.sender_type === 'visitor') {
              playNotificationSound();
            }
          }
          lastMessageIdRef.current = maxId;
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversation details', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Fetch canned responses
  const fetchCanned = async () => {
    try {
      const res = await fetch('/api/chat/admin/canned-responses');
      const data = await res.json();
      if (data.success) {
        setCannedResponses(data.canned_responses || []);
      }
    } catch (err) {
      console.error('Failed to load canned responses', err);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchCanned();
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    if (selectedUuid) {
      fetchConversationDetails(selectedUuid);
    }
  }, [selectedUuid]);

  // Real-time polling & sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true);
      if (selectedUuid) {
        fetchConversationDetails(selectedUuid, true);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedUuid, activeFilter]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Select a conversation and switch to chat view immediately
  const handleOpenConversation = (uuid: string) => {
    setSelectedUuid(uuid);
    setMobilePane('chat');
  };

  // Send reply or private note
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedUuid || sendingMessage) return;

    setSendingMessage(true);
    try {
      const res = await fetch(`/api/chat/admin/conversations/${selectedUuid}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          content: replyText.trim(),
          message_type: isPrivateNote ? 'private_note' : 'text'
        })
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
        setReplyText('');
        // Refresh conversation list state
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Generate 1-click AI Reply Assist using Google Gemini
  const handleGenerateAiReply = async () => {
    if (!selectedUuid || generatingAi) return;
    setGeneratingAi(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/chat/admin/conversations/${selectedUuid}/ai-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success && data.suggested_reply) {
        setReplyText(data.suggested_reply);
        setIsPrivateNote(false);
      } else {
        let msg = data.error || 'Could not generate AI reply.';
        if (typeof msg === 'string' && (msg.includes('quota') || msg.includes('429'))) {
          msg = 'Gemini AI quota limit reached for this free-tier key. Please try again shortly or configure an upgraded API key.';
        }
        setAiError(msg);
        setTimeout(() => setAiError(null), 8000);
      }
    } catch (err: any) {
      console.error('AI suggestion failed', err);
      setAiError(err?.message || 'Failed to reach AI service.');
      setTimeout(() => setAiError(null), 8000);
    } finally {
      setGeneratingAi(false);
    }
  };

  // Assign conversation to a team member
  const handleAssignAgent = async (userId: number | null) => {
    if (!selectedUuid || reassigning) return;
    setReassigning(true);
    try {
      const res = await fetch(`/api/chat/admin/conversations/${selectedUuid}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        fetchConversationDetails(selectedUuid, true);
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to assign agent', err);
    } finally {
      setReassigning(false);
    }
  };

  // Update conversation status (active, resolved, closed)
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedUuid || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/chat/admin/conversations/${selectedUuid}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchConversationDetails(selectedUuid, true);
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Insert canned response
  const handleInsertCanned = (content: string) => {
    setReplyText(content);
    setShowCannedDropdown(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[780px] max-h-[85vh] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
      
      {/* ======================================================== */}
      {/* COLUMN 1: CONVERSATIONS QUEUE & FILTERS */}
      {/* ======================================================== */}
      <div
        className={`w-full lg:w-80 xl:w-96 flex flex-col border-r border-slate-200 bg-slate-50/50 shrink-0 ${
          mobilePane === 'list' ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {/* Header & Search */}
        <div className="p-3.5 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Inbox Queue</h3>
                <p className="text-xs text-slate-500">Live website visitors</p>
              </div>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
              className={`p-2 rounded-lg border transition ${
                soundEnabled
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search visitor, email, phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                activeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setActiveFilter('unassigned')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                activeFilter === 'unassigned'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Waiting ({counts.unassigned})
            </button>
            <button
              onClick={() => setActiveFilter('mine')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                activeFilter === 'mine'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              My Chats ({counts.mine})
            </button>
            <button
              onClick={() => setActiveFilter('bot')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                activeFilter === 'bot'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Bot ({counts.bot})
            </button>
            <button
              onClick={() => setActiveFilter('resolved')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                activeFilter === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Closed
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loadingList ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium text-slate-600">No conversations found</p>
              <p className="text-[11px]">Incoming website visitor chats will appear here in real-time.</p>
            </div>
          ) : (
            conversations.map(conv => {
              const isSelected = selectedUuid === conv.uuid;
              return (
                <div
                  key={conv.uuid}
                  onClick={() => handleOpenConversation(conv.uuid)}
                  className={`p-3.5 cursor-pointer transition flex items-start gap-3 select-none relative group ${
                    isSelected
                      ? 'bg-indigo-50/90 border-l-4 border-indigo-600 shadow-xs'
                      : 'hover:bg-slate-100/80 bg-white'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-semibold text-xs uppercase shadow-2xs">
                      {conv.visitor_name ? (
                        conv.visitor_name.charAt(0).toUpperCase()
                      ) : (
                        <User className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    {conv.status === 'bot' ? (
                      <span
                        className="absolute -bottom-1 -right-1 p-0.5 bg-purple-500 rounded-full text-white"
                        title="Handled by Bot"
                      >
                        <Bot className="w-3 h-3" />
                      </span>
                    ) : (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"
                        title="Online"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-semibold text-slate-900 text-xs truncate">
                        {conv.visitor_name || 'Anonymous Visitor'}
                      </h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {conv.last_message_at
                          ? new Date(conv.last_message_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : ''}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {conv.last_message ? (
                        <span>
                          {conv.last_message.sender_type === 'agent' && (
                            <span className="font-semibold text-indigo-600">You: </span>
                          )}
                          {conv.last_message.content}
                        </span>
                      ) : (
                        <span className="italic text-slate-400">Chat initiated</span>
                      )}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            conv.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : conv.status === 'waiting'
                              ? 'bg-amber-100 text-amber-700'
                              : conv.status === 'bot'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {conv.status.toUpperCase()}
                        </span>

                        {conv.assigned_user ? (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate max-w-[90px]">
                            <UserCheck className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="truncate">{conv.assigned_user.name}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium">Unassigned</span>
                        )}
                      </div>

                      {/* Explicit Open Chat Action Pill */}
                      <span className="text-[11px] font-semibold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-0.5 transition">
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* COLUMN 2: ACTIVE CONVERSATION TIMELINE */}
      {/* ======================================================== */}
      <div
        className={`flex-1 flex flex-col bg-slate-50/40 min-w-0 ${
          mobilePane === 'chat' ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {selectedConversation ? (
          <>
            {/* Top Chat Header Bar */}
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Back to List Button for Mobile / Small screens */}
                <button
                  type="button"
                  onClick={() => setMobilePane('list')}
                  className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl flex items-center gap-1 text-xs font-bold transition"
                  title="Back to conversations list"
                >
                  <ChevronLeft className="w-5 h-5 text-indigo-600" />
                  <span>Queue</span>
                </button>

                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
                  {selectedConversation.visitor_name ? (
                    selectedConversation.visitor_name.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {selectedConversation.visitor_name || 'Visitor'}
                    </h3>
                    <span
                      className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        selectedConversation.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedConversation.status === 'waiting'
                          ? 'bg-amber-100 text-amber-800'
                          : selectedConversation.status === 'bot'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {selectedConversation.status}
                    </span>
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    {selectedConversation.visitor_page_url ? (
                      <>
                        <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px] sm:max-w-xs">
                          {selectedConversation.visitor_page_url}
                        </span>
                      </>
                    ) : (
                      <span>Active Website Visitor</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Resolve / Reopen Status Toggle */}
                {selectedConversation.status !== 'resolved' ? (
                  <button
                    onClick={() => handleStatusChange('resolved')}
                    disabled={updatingStatus}
                    className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Resolve</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange('active')}
                    disabled={updatingStatus}
                    className="px-2.5 sm:px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reopen</span>
                  </button>
                )}

                {/* Toggle Visitor Telemetry Sidebar */}
                <button
                  type="button"
                  onClick={() => setShowDetailsSidebar(!showDetailsSidebar)}
                  className={`p-1.5 rounded-xl border transition ${
                    showDetailsSidebar
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                  }`}
                  title="Toggle Visitor Info"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/30">
              {loadingMessages ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-500" />
                  <p className="text-xs mt-2">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">No messages in this chat yet.</p>
                  <p className="text-[11px]">Type below to send the first response to this visitor.</p>
                </div>
              ) : (
                messages.map(m => {
                  // Internal Private Whisper Note
                  if (m.message_type === 'private_note') {
                    return (
                      <div
                        key={m.uuid}
                        className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 max-w-xl mx-auto my-2.5 shadow-xs"
                      >
                        <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold mb-1">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Internal Private Note ({m.sender_name})</span>
                          <span className="text-[10px] text-amber-600/80 ml-auto font-normal">
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-amber-950 leading-relaxed font-sans">{m.content}</p>
                        <p className="text-[10px] text-amber-600/70 mt-1 italic">
                          🔒 Visible only to internal team members. Visitor cannot see this.
                        </p>
                      </div>
                    );
                  }

                  // System Event Message
                  if (m.sender_type === 'system') {
                    return (
                      <div key={m.uuid} className="text-center my-2">
                        <span className="bg-slate-200/80 text-slate-600 text-[11px] px-3 py-1 rounded-full font-medium inline-block shadow-2xs">
                          {m.content}
                        </span>
                      </div>
                    );
                  }

                  const isVisitor = m.sender_type === 'visitor';
                  const isAgent = m.sender_type === 'agent';
                  const isBot = m.sender_type === 'bot';

                  return (
                    <div key={m.uuid} className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                        <span className="font-semibold text-slate-600">{m.sender_name}</span>
                        <span>•</span>
                        <span>
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                          isAgent
                            ? 'bg-indigo-600 text-white rounded-br-xs'
                            : isBot
                            ? 'bg-white border border-purple-200 text-slate-900 rounded-bl-xs'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>

                        {/* Interactive Buttons metadata if sent by bot */}
                        {m.metadata?.buttons && m.metadata.buttons.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-purple-100 flex flex-wrap gap-1.5">
                            {m.metadata.buttons.map((b: any, idx: number) => (
                              <span
                                key={idx}
                                className="bg-purple-50 text-purple-700 border border-purple-200 text-[11px] px-2.5 py-1 rounded-full font-medium"
                              >
                                {b.text}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input & Action Panel */}
            <div className="p-3 bg-white border-t border-slate-200 space-y-2.5">
              {/* Message Mode Switcher: Public Reply vs Private Whisper Note */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsPrivateNote(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      !isPrivateNote
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Public Reply</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivateNote(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      isPrivateNote
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:text-amber-700'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Private Note</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Canned Responses Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCannedDropdown(!showCannedDropdown)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Canned</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {showCannedDropdown && (
                      <div className="absolute bottom-full mb-2 right-0 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 max-h-56 overflow-y-auto">
                        <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Saved Templates</p>
                        {cannedResponses.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleInsertCanned(item.content)}
                            className="w-full text-left px-2 py-1.5 hover:bg-indigo-50 rounded-lg text-xs transition"
                          >
                            <span className="font-semibold text-indigo-600 mr-1">{item.shortcut}</span>
                            <span className="text-slate-700 truncate">{item.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 1-Click AI Reply Assist using Gemini */}
                  <button
                    type="button"
                    onClick={handleGenerateAiReply}
                    disabled={generatingAi}
                    className="px-2.5 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{generatingAi ? 'Generating...' : 'AI Assist'}</span>
                  </button>
                </div>
              </div>

              {/* Notice indicator for Private Note mode */}
              {isPrivateNote && (
                <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-1.5 font-medium animate-in fade-in">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Internal Note Mode: The visitor will NOT see this message. Visible only to team members.</span>
                </div>
              )}

              {/* AI Error Notification Banner */}
              {aiError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="truncate">{aiError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiError(null)}
                    className="text-rose-400 hover:text-rose-600 shrink-0 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Textarea & Send button */}
              <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    isPrivateNote
                      ? 'Write a private internal note for the team (Enter to submit)...'
                      : 'Type your message to visitor (Enter to send, Shift+Enter for new line)...'
                  }
                  className={`flex-1 p-2.5 sm:p-3 border rounded-xl text-xs outline-none transition resize-none ${
                    isPrivateNote
                      ? 'bg-amber-50/60 border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-500 text-slate-900'
                      : 'bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-900'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sendingMessage}
                  className={`p-3 rounded-xl text-white font-semibold transition shrink-0 shadow-sm ${
                    isPrivateNote
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
            <MessageSquare className="w-12 h-12 text-slate-300" />
            <h4 className="font-semibold text-slate-700 text-sm">Select a Conversation</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Choose an active visitor from the left queue to respond, view their current page telemetry, or assign them to a team member.
            </p>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* COLUMN 3: VISITOR CONTEXT & ASSIGNMENT SIDEBAR */}
      {/* ======================================================== */}
      {selectedConversation && showDetailsSidebar && (
        <div className="w-full lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white p-4 overflow-y-auto space-y-4 shrink-0 shadow-lg lg:shadow-none animate-in slide-in-from-right duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Visitor Telemetry</h4>
            </div>
            <button
              onClick={() => setShowDetailsSidebar(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              title="Hide sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Team Member Real-Time Assignment */}
          <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Assigned Team Member
            </label>
            <select
              value={selectedConversation.assigned_user?.id || ''}
              onChange={e => handleAssignAgent(e.target.value ? parseInt(e.target.value, 10) : null)}
              disabled={reassigning}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">(Unassigned / Bot Queue)</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </div>

          {/* Contact Details */}
          <div className="space-y-2.5">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contact Info</h5>

            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-900 truncate">
                {selectedConversation.visitor_name || 'Anonymous Visitor'}
              </span>
            </div>

            {selectedConversation.visitor_email && (
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href={`mailto:${selectedConversation.visitor_email}`}
                  className="text-indigo-600 hover:underline truncate"
                >
                  {selectedConversation.visitor_email}
                </a>
              </div>
            )}

            {selectedConversation.visitor_phone && (
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href={`tel:${selectedConversation.visitor_phone}`}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  {selectedConversation.visitor_phone}
                </a>
              </div>
            )}

            {selectedConversation.visitor_ip && (
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">
                  {selectedConversation.visitor_city || 'Location'}: {selectedConversation.visitor_ip}
                </span>
              </div>
            )}
          </div>

          {/* Live Page Context */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Browsing Telemetry</h5>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold">Active Webpage:</p>
                <p className="text-slate-800 font-medium truncate" title={selectedConversation.visitor_page_url}>
                  {selectedConversation.visitor_page_url || 'Unknown page'}
                </p>
              </div>
              {selectedConversation.visitor_referrer && (
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Referrer Source:</p>
                  <p className="text-slate-600 truncate">{selectedConversation.visitor_referrer}</p>
                </div>
              )}
            </div>
          </div>

          {/* CSAT Feedback (if rated) */}
          {selectedConversation.csat_rating && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>CSAT Rating: {selectedConversation.csat_rating}/5 Stars</span>
              </div>
              {selectedConversation.csat_feedback && (
                <p className="text-xs text-amber-900 italic mt-1">"{selectedConversation.csat_feedback}"</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
