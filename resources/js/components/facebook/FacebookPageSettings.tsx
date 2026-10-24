import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  FileText, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Info
} from 'lucide-react';
import { FacebookPageItem } from '../../types';

interface FacebookPageSettingsProps {
  page: FacebookPageItem;
  onPageUpdated: (updatedPage: FacebookPageItem) => void;
}

const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

export const FacebookPageSettings: React.FC<FacebookPageSettingsProps> = ({
  page,
  onPageUpdated,
}) => {
  const [about, setAbout] = useState(page.about || '');
  const [phone, setPhone] = useState(page.phone || '');
  const [website, setWebsite] = useState(page.website || '');
  const [hours, setHours] = useState<Record<string, string>>(() => {
    return page.hours_json || {
      'mon_1_open': '08:00', 'mon_1_close': '20:00',
      'tue_1_open': '08:00', 'tue_1_close': '20:00',
      'wed_1_open': '08:00', 'wed_1_close': '20:00',
      'thu_1_open': '08:00', 'thu_1_close': '20:00',
      'fri_1_open': '08:00', 'fri_1_close': '20:00',
      'sat_1_open': '08:00', 'sat_1_close': '18:00',
      'sun_1_open': 'closed', 'sun_1_close': 'closed',
    };
  });

  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setAbout(page.about || '');
    setPhone(page.phone || '');
    setWebsite(page.website || '');
    if (page.hours_json) {
      setHours(page.hours_json);
    }
  }, [page]);

  const handleHourChange = (dayKey: string, field: 'open' | 'close', value: string) => {
    setHours(prev => ({
      ...prev,
      [`${dayKey}_1_${field}`]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/fb/pages/${page.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          about,
          phone,
          website,
          hours,
        }),
      });

      const data = await res.json();
      if (data.success && data.page) {
        onPageUpdated(data.page);
        setFeedback({ type: 'success', message: 'Page settings updated live on Facebook!' });
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to update page settings.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error updating settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLiveRefresh = async () => {
    setRefreshing(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/fb/pages/${page.id}`);
      const data = await res.json();
      if (data.success && data.page) {
        onPageUpdated(data.page);
        setFeedback({ type: 'success', message: 'Synced latest live info from Facebook Graph API.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Refresh failed.' });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div className={`p-3.5 rounded-lg flex items-center gap-2 text-xs font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-800">Page Bio & Description</h4>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              About / Bio
            </label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={3}
              placeholder="Describe your business, coaching institute, or services..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              This summary is displayed on your Facebook Page's main About card.
            </p>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Phone className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-800">Contact & Web Information</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Primary Phone / WhatsApp</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9610447938"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Official Website Link</span>
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-800">Operating Hours</h4>
            </div>
            <span className="text-[11px] text-slate-400">Synced to Facebook Page Timing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const openVal = hours[`${day.key}_1_open`] || '08:00';
              const closeVal = hours[`${day.key}_1_close`] || '20:00';
              const isClosed = openVal === 'closed';

              return (
                <div key={day.key} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{day.label}</span>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isClosed}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleHourChange(day.key, 'open', 'closed');
                            handleHourChange(day.key, 'close', 'closed');
                          } else {
                            handleHourChange(day.key, 'open', '08:00');
                            handleHourChange(day.key, 'close', '20:00');
                          }
                        }}
                        className="rounded text-blue-600"
                      />
                      <span>Closed</span>
                    </label>
                  </div>

                  {!isClosed ? (
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="time"
                        value={openVal}
                        onChange={(e) => handleHourChange(day.key, 'open', e.target.value)}
                        className="p-1.5 bg-white border border-slate-300 rounded text-xs w-full outline-none"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="time"
                        value={closeVal}
                        onChange={(e) => handleHourChange(day.key, 'close', e.target.value)}
                        className="p-1.5 bg-white border border-slate-300 rounded text-xs w-full outline-none"
                      />
                    </div>
                  ) : (
                    <div className="text-[11px] text-rose-500 font-semibold py-1">
                      Closed all day
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleLiveRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live from Facebook</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving to Facebook...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes to Facebook</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
