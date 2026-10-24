import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Sparkles, 
  Calendar, 
  Clock, 
  Send, 
  Trash2, 
  ExternalLink, 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Eye
} from 'lucide-react';
import { FacebookPageItem, FacebookPostItem } from '../../types';

interface FacebookPostStudioProps {
  page: FacebookPageItem;
  onOpenComments: (postId: string) => void;
}

export const FacebookPostStudio: React.FC<FacebookPostStudioProps> = ({
  page,
  onOpenComments,
}) => {
  const [posts, setPosts] = useState<FacebookPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New post form state
  const [message, setMessage] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // AI Prompt Modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('Engaging & Welcoming');
  const [aiLanguage, setAiLanguage] = useState('Hinglish & English');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [page.id]);

  const fetchPosts = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/fb/pages/${page.id}/posts?limit=25`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to load posts.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Could not connect to server to fetch posts.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !photoFile && !linkUrl.trim()) {
      alert('Please add a message, photo, or link.');
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      if (message.trim()) formData.append('message', message.trim());
      if (linkUrl.trim()) formData.append('link', linkUrl.trim());
      if (photoFile) formData.append('photo', photoFile);

      if (isScheduled && scheduledTime) {
        formData.append('published', '0');
        const unixTimestamp = Math.floor(new Date(scheduledTime).getTime() / 1000);
        formData.append('scheduled_publish_time', unixTimestamp.toString());
      } else {
        formData.append('published', '1');
      }

      const res = await fetch(`/api/fb/pages/${page.id}/posts`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message || 'Post submitted successfully!' });
        setShowCreateModal(false);
        setMessage('');
        setLinkUrl('');
        removePhoto();
        setIsScheduled(false);
        setScheduledTime('');
        fetchPosts();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to publish post.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error creating post.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post from your Facebook Page? This cannot be undone.')) {
      return;
    }

    setDeletingId(postId);
    try {
      const res = await fetch(`/api/fb/pages/${page.id}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        setFeedback({ type: 'success', message: 'Post deleted from Facebook.' });
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to delete post.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to delete post.' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerateAi = async () => {
    if (!aiTopic.trim()) {
      alert('Please enter a topic or announcement objective.');
      return;
    }

    setGeneratingAi(true);
    try {
      const res = await fetch('/api/fb/posts/ai-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          topic: aiTopic,
          tone: aiTone,
          language: aiLanguage,
          businessName: page.name,
        }),
      });

      const data = await res.json();
      if (data.success && data.post_text) {
        setMessage(data.post_text);
        setShowAiModal(false);
        setAiTopic('');
      } else {
        alert(data.message || 'Could not generate copy.');
      }
    } catch (err) {
      alert('Failed to generate AI post.');
    } finally {
      setGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Posts Studio</span>
            <span className="text-xs font-normal text-slate-500">
              ({posts.length} recent posts)
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Create, schedule, and manage Facebook Page updates directly from here.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchPosts(true)}
            disabled={refreshing}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Post</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-lg flex items-center gap-2 text-xs font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Posts List / Grid */}
      {loading ? (
        <div className="card p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading page posts from Facebook...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 space-y-3">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No Posts Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't published any posts on this page yet, or your token needs permission refresh.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="mt-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md cursor-pointer shadow-xs"
          >
            Publish First Post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => {
            const likesCount = post.likes?.summary?.total_count ?? 0;
            const commentsCount = post.comments?.summary?.total_count ?? 0;
            const sharesCount = post.shares?.count ?? 0;

            return (
              <div key={post.id} className="card flex flex-col justify-between overflow-hidden border border-slate-200 hover:shadow-md transition-shadow">
                <div>
                  {/* Post Header */}
                  <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-blue-100 shrink-0 flex items-center justify-center">
                        {page.avatar_url ? (
                          <img src={page.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate block">
                          {page.name}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(post.created_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {post.permalink_url && (
                        <a
                          href={post.permalink_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                          title="Open on Facebook"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        disabled={deletingId === post.id}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Delete Post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Post Image (if any) */}
                  {post.full_picture && (
                    <div className="w-full h-48 bg-slate-100 overflow-hidden border-b border-slate-100">
                      <img
                        src={post.full_picture}
                        alt="Post media"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Post Message */}
                  <div className="p-4">
                    <p className="text-xs text-slate-700 whitespace-pre-wrap line-clamp-4 leading-relaxed">
                      {post.message || <span className="italic text-slate-400">(Photo / Link attachment only)</span>}
                    </p>
                  </div>
                </div>

                {/* Post Footer & Engagement Metrics */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-blue-600" title="Likes">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {likesCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenComments(post.id)}
                      className="flex items-center gap-1 font-semibold text-emerald-600 hover:underline cursor-pointer"
                      title="View & Reply Comments"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {commentsCount} comments
                    </button>
                    {sharesCount > 0 && (
                      <span className="flex items-center gap-1" title="Shares">
                        <Share2 className="w-3.5 h-3.5" />
                        {sharesCount}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenComments(post.id)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Moderate</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW POST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="card max-w-xl w-full bg-white shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Create Facebook Page Post</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Post Message / Content
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAiModal(true)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Write with Gemini AI</span>
                  </button>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="What's happening? Share news, admission announcements, discounts or achievements..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Photo Upload Area */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Attach Photo (Optional)
                </label>
                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-48 w-full bg-slate-50 flex items-center justify-center">
                    <img src={photoPreview} alt="Preview" className="max-h-48 object-contain" />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-colors">
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">Click to upload image (JPG, PNG, WebP)</span>
                    <span className="text-[10px] text-slate-400">Max size 15MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Optional Link */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Optional Website Link
                </label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com/admission"
                    className="w-full text-xs outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Scheduling Options */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Schedule for later?
                  </span>
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="rounded text-blue-600 cursor-pointer"
                  />
                </div>

                {isScheduled && (
                  <div className="pt-2">
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Pick Date & Time (Must be at least 15 min in advance)
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{isScheduled ? 'Schedule Post' : 'Publish to Facebook'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GEMINI AI POST GENERATOR MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-md w-full bg-white shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>AI Social Post Copywriter</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Topic / Announcement Details
                </label>
                <textarea
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  rows={3}
                  placeholder="e.g., Admissions open for 2026 batches, 20% discount this week, new branch opening in Sikar..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tone of Voice
                </label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white outline-none"
                >
                  <option value="Engaging & Welcoming">Engaging & Welcoming</option>
                  <option value="Professional & Authoritative">Professional & Authoritative</option>
                  <option value="Urgent & Promotional">Urgent & Promotional (Sales / Discount)</option>
                  <option value="Inspirational & Motivational">Inspirational & Motivational</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Language Preference
                </label>
                <select
                  value={aiLanguage}
                  onChange={(e) => setAiLanguage(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white outline-none"
                >
                  <option value="Hinglish & English">Hinglish & English (Best for Social)</option>
                  <option value="Hindi">Pure Hindi</option>
                  <option value="English">English</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={generatingAi}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {generatingAi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Writing Copy...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
