import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Folder,
  Tag
} from 'lucide-react';
import { ChatCannedResponseItem } from '../../types';

export const CannedResponsesManager: React.FC = () => {
  const [responses, setResponses] = useState<ChatCannedResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [shortcut, setShortcut] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [saving, setSaving] = useState(false);

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat/admin/canned-responses');
      const data = await res.json();
      if (data.success) {
        setResponses(data.canned_responses || []);
      }
    } catch (err) {
      console.error('Failed to load canned responses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setShortcut('');
    setTitle('');
    setContent('');
    setCategory('General');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ChatCannedResponseItem) => {
    setEditingId(item.id);
    setShortcut(item.shortcut);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortcut || !title || !content || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/chat/admin/canned-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          shortcut,
          title,
          content,
          category
        })
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchResponses();
      }
    } catch (err) {
      console.error('Failed to save canned response', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this canned shortcut?')) return;
    try {
      await fetch(`/api/chat/admin/canned-responses/${id}`, { method: 'DELETE' });
      fetchResponses();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const filtered = responses.filter(r =>
    r.shortcut.toLowerCase().includes(search.toLowerCase()) ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-600" />
            Canned Responses & Quick Replies
          </h3>
          <p className="text-xs text-slate-500">
            Agents can type shortcuts like <span className="font-mono text-indigo-600">/hello</span> or <span className="font-mono text-indigo-600">/pricing</span> in the live chat to instantly send pre-crafted responses.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Canned Reply
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter shortcuts or keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Responses Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-400 text-xs">Loading canned responses...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-400 text-xs">No canned responses found.</div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 transition relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                  {item.shortcut}
                </span>
                <span className="text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  {item.category}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-xs truncate">{item.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-3 mt-1 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200/60">
                  {item.content}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 transition"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm">
                {editingId ? 'Edit Canned Response' : 'Create New Canned Response'}
              </h4>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shortcut (e.g. /pricing)</label>
                  <input
                    type="text"
                    required
                    value={shortcut}
                    onChange={(e) => setShortcut(e.target.value)}
                    placeholder="/hello"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="General">General</option>
                    <option value="Greetings">Greetings</option>
                    <option value="Sales">Sales</option>
                    <option value="Support">Support</option>
                    <option value="Closing">Closing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Title / Internal Name</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Warm Welcome Greeting"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Response Content</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter full reply text that will be inserted..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  {saving ? 'Saving...' : 'Save Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
