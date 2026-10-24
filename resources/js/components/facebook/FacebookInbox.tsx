import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  RefreshCw, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Search,
  ExternalLink
} from 'lucide-react';
import { FacebookPageItem, FacebookConversationItem, FacebookMessageItem } from '../../types';

interface FacebookInboxProps {
  page: FacebookPageItem;
}

export const FacebookInbox: React.FC<FacebookInboxProps> = ({ page }) => {
  const [conversations, setConversations] = useState<FacebookConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<FacebookMessageItem[]>([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchConversations();
  }, [page.id]);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
    } else {
      setMessages([]);
    }
  }, [selectedConvId]);

  const fetchConversations = async () => {
    setLoadingConv(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/fb/pages/${page.id}/conversations?limit=30`);
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        if (!selectedConvId && data.conversations.length > 0) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Could not load Messenger conversations.' });
    } finally {
      setLoadingConv(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/fb/pages/${page.id}/conversations/${convId}/messages?limit=40`);
      const data = await res.json();
      if (data.success) {
        // Facebook returns in reverse chronological order -> reverse for natural chat flow
        setMessages((data.messages || []).slice().reverse());
      }
    } catch (err) {
      // ignore
    } finally {
      setLoadingMessages(false);
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConvId);
  const otherSender = selectedConv?.senders?.data?.find(s => s.id !== page.page_id) || selectedConv?.senders?.data?.[0];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !otherSender?.id) return;

    setSending(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/fb/pages/${page.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          recipient_id: otherSender.id,
          text: replyText.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReplyText('');
        if (selectedConvId) fetchMessages(selectedConvId);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to send message.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Message failed to send.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Facebook Messenger Direct Inbox</span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time customer inquiries from Facebook Messenger.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchConversations}
          disabled={loadingConv}
          className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loadingConv ? 'animate-spin' : ''}`} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-xl flex items-center gap-2 text-xs font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Two-Column Messenger Card */}
      <div className="card overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px] max-h-[640px] border border-slate-200">
        {/* Left Column: Conversation List (4 Cols) */}
        <div className="md:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3 border-b border-slate-200 bg-white">
            <span className="text-xs font-bold text-slate-700 block mb-1">
              Conversations ({conversations.length})
            </span>
            <span className="text-[10px] text-slate-400">
              Customer inquiries sent to {page.name}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConv ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span>Loading conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                <MessageSquare className="w-6 h-6 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">No Messages Yet</p>
                <p className="text-[11px]">When customers message your Facebook page, they will appear here.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConvId === conv.id;
                const sender = conv.senders?.data?.find(s => s.id !== page.page_id) || conv.senders?.data?.[0];

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-3 flex items-start gap-3 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/80 border-l-4 border-l-blue-600' : 'hover:bg-slate-100/70'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs">
                      {sender?.name ? sender.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {sender?.name || 'Customer'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(conv.updated_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {conv.snippet || 'No message content'}
                      </p>
                    </div>

                    {conv.unread_count && conv.unread_count > 0 ? (
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                        {conv.unread_count}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Thread History & Reply (8 Cols) */}
        <div className="md:col-span-8 flex flex-col bg-white">
          {selectedConv ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {otherSender?.name ? otherSender.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      {otherSender?.name || 'Customer'}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      via Facebook Messenger
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Live Connected
                </span>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {loadingMessages ? (
                  <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                    <span>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No message history found.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isFromPage = msg.from?.id === page.page_id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isFromPage ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${isFromPage ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 px-1">
                          {new Date(msg.created_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a message to customer..."
                  className="flex-1 text-xs border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {sending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Select a Conversation</p>
              <p className="text-[11px] text-slate-400">Choose a chat from the left column to view message history and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
