import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Sparkles, 
  Send, 
  ThumbsUp, 
  EyeOff, 
  Eye, 
  Trash2, 
  RefreshCw, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  ChevronDown,
  Filter
} from 'lucide-react';
import { FacebookPageItem, FacebookPostItem, FacebookCommentItem } from '../../types';

interface FacebookCommentsModeratorProps {
  page: FacebookPageItem;
  initialPostId?: string | null;
}

export const FacebookCommentsModerator: React.FC<FacebookCommentsModeratorProps> = ({
  page,
  initialPostId,
}) => {
  const [posts, setPosts] = useState<FacebookPostItem[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string>(initialPostId || '');
  const [comments, setComments] = useState<FacebookCommentItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);

  // Replying state per comment
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [page.id]);

  useEffect(() => {
    if (initialPostId) {
      setSelectedPostId(initialPostId);
    }
  }, [initialPostId]);

  useEffect(() => {
    if (selectedPostId) {
      fetchComments(selectedPostId);
    } else {
      setComments([]);
    }
  }, [selectedPostId]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/fb/pages/${page.id}/posts?limit=30`);
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        setPosts(data.posts);
        if (!selectedPostId && data.posts.length > 0) {
          setSelectedPostId(data.posts[0].id);
        }
      }
    } catch (err) {
      // ignore
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchComments = async (postId: string) => {
    setLoadingComments(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/fb/pages/${page.id}/posts/${postId}/comments?limit=50`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments || []);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to fetch comments.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Could not connect to fetch comments.' });
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAiSuggestReply = async (comment: FacebookCommentItem) => {
    setGeneratingAi(comment.id);
    setActiveReplyId(comment.id);

    try {
      const res = await fetch('/api/fb/comment/ai-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          comment: comment.message,
          userName: comment.from?.name || 'Customer',
          tone: 'Warm & Courteous',
          businessName: page.name,
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setReplyDrafts(prev => ({
          ...prev,
          [comment.id]: data.reply,
        }));
      } else {
        alert('Could not generate AI reply.');
      }
    } catch (err) {
      alert('Error generating reply.');
    } finally {
      setGeneratingAi(null);
    }
  };

  const handleSendReply = async (commentId: string) => {
    const text = replyDrafts[commentId]?.trim();
    if (!text) {
      alert('Please type or generate a reply message first.');
      return;
    }

    setSendingReply(commentId);
    try {
      const res = await fetch(`/api/fb/pages/${page.id}/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Reply published to Facebook!' });
        setReplyDrafts(prev => ({ ...prev, [commentId]: '' }));
        setActiveReplyId(null);
        if (selectedPostId) fetchComments(selectedPostId);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to publish reply.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to post reply.' });
    } finally {
      setSendingReply(null);
    }
  };

  const handleToggleHide = async (comment: FacebookCommentItem) => {
    const newHidden = !comment.is_hidden;
    try {
      const res = await fetch(`/api/fb/pages/${page.id}/comments/${comment.id}/hide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ is_hidden: newHidden }),
      });
      const data = await res.json();
      if (data.success) {
        setComments(prev => prev.map(c => c.id === comment.id ? { ...c, is_hidden: newHidden } : c));
        setFeedback({ type: 'success', message: newHidden ? 'Comment hidden from public view.' : 'Comment unhidden.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Action failed.' });
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/fb/pages/${page.id}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Liked comment as Page!' });
      }
    } catch (err) {
      // ignore
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to permanently delete this comment from Facebook?')) {
      return;
    }

    try {
      const res = await fetch(`/api/fb/pages/${page.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
      });
      const data = await res.json();
      if (data.success) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setFeedback({ type: 'success', message: 'Comment deleted successfully.' });
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to delete.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Delete failed.' });
    }
  };

  const selectedPost = posts.find(p => p.id === selectedPostId);

  return (
    <div className="space-y-6">
      {/* Top Header & Post Selector */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span>Comments & Interactions Moderator</span>
            </h3>
            <p className="text-xs text-slate-500">
              Moderate user comments, like, hide spam, and post instant AI-powered replies.
            </p>
          </div>

          <button
            type="button"
            onClick={() => selectedPostId && fetchComments(selectedPostId)}
            disabled={loadingComments}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loadingComments ? 'animate-spin' : ''}`} />
            <span>Refresh Comments</span>
          </button>
        </div>

        {/* Post Selection Dropdown */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Select Post to Moderate:</span>
          </label>
          <select
            value={selectedPostId}
            onChange={(e) => setSelectedPostId(e.target.value)}
            disabled={loadingPosts}
            className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
          >
            {posts.length === 0 ? (
              <option value="">No posts available</option>
            ) : (
              posts.map((p) => {
                const preview = p.message ? p.message.substring(0, 80) : '(Photo or Link post)';
                const date = new Date(p.created_time).toLocaleDateString([], { month: 'short', day: 'numeric' });
                return (
                  <option key={p.id} value={p.id}>
                    [{date}] {preview}...
                  </option>
                );
              })
            )}
          </select>
        </div>

        {/* Selected Post Mini Preview */}
        {selectedPost && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center gap-3">
            {selectedPost.full_picture && (
              <img src={selectedPost.full_picture} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-slate-700 font-medium line-clamp-1">
                {selectedPost.message || '(Photo/Link Post)'}
              </p>
              <span className="text-[11px] text-slate-400">
                {selectedPost.likes?.summary?.total_count || 0} Likes • {comments.length} Comments Loaded
              </span>
            </div>
          </div>
        )}
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-2 text-xs font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Comments List */}
      {loadingComments ? (
        <div className="card p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-7 h-7 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Fetching comments from Facebook...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-700">No Comments on this Post Yet</p>
          <p className="text-[11px] text-slate-500">
            Comments posted by customers will appear here for 1-click reply and moderation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isReplying = activeReplyId === comment.id;
            const currentDraft = replyDrafts[comment.id] || '';
            const isAiGenerating = generatingAi === comment.id;
            const isSubmitting = sendingReply === comment.id;

            return (
              <div 
                key={comment.id} 
                className={`card p-4 space-y-3 border transition-colors ${comment.is_hidden ? 'bg-slate-50/80 border-dashed border-amber-300 opacity-75' : 'bg-white border-slate-200'}`}
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center">
                      {comment.from?.picture?.data?.url ? (
                        <img src={comment.from.picture.data.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {comment.from?.name || 'Facebook User'}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(comment.created_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Comment Action Badges */}
                  <div className="flex items-center gap-1">
                    {comment.is_hidden && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Hidden from Public
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleLikeComment(comment.id)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                      title="Like Comment as Page"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleHide(comment)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded cursor-pointer"
                      title={comment.is_hidden ? 'Unhide comment' : 'Hide comment (Spam/Abuse)'}
                    >
                      {comment.is_hidden ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete Comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Comment Body */}
                <div className="pl-10">
                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-normal">
                    {comment.message}
                  </p>
                </div>

                {/* Existing Replies if any */}
                {comment.comments?.data && comment.comments.data.length > 0 && (
                  <div className="pl-10 space-y-2 pt-1">
                    {comment.comments.data.map((reply) => (
                      <div key={reply.id} className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-900 text-[11px]">
                            {reply.from?.name || page.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(reply.created_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px] leading-relaxed">
                          {reply.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons: Reply / AI Draft */}
                <div className="pl-10 flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveReplyId(isReplying ? null : comment.id)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isReplying ? 'Cancel Reply' : 'Write Reply'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAiSuggestReply(comment)}
                    disabled={isAiGenerating}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-100 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isAiGenerating ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Thinking...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>1-Click AI Reply</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Reply Input Box */}
                {isReplying && (
                  <div className="pl-10 pt-2 space-y-2">
                    <textarea
                      value={currentDraft}
                      onChange={(e) => setReplyDrafts({ ...replyDrafts, [comment.id]: e.target.value })}
                      rows={2}
                      placeholder="Write your official response..."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveReplyId(null)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-md cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendReply(comment.id)}
                        disabled={isSubmitting}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Posting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Post Reply</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
