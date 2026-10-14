import React, { useState, useMemo } from 'react';
import { 
  Award, 
  TrendingUp, 
  Star, 
  ArrowRight, 
  Building2, 
  AlertTriangle, 
  ShieldCheck, 
  Search, 
  ArrowUpDown,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { ProfileReportItem } from '../../types';

interface LocationLeaderboardTableProps {
  locationsData?: ProfileReportItem[];
  onSelectLocation?: (locationKey: string) => void;
  onNavigateTab?: (tab: string) => void;
}

type SortField = 'reviews' | 'growth' | 'rating' | 'pending';

export const LocationLeaderboardTable: React.FC<LocationLeaderboardTableProps> = ({
  locationsData = [],
  onSelectLocation,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('reviews');
  const [sortAsc, setSortAsc] = useState(false);

  const list = Array.isArray(locationsData) ? locationsData : [];

  // Filter & Sort
  const processedList = useMemo(() => {
    let result = [...list];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        item => 
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.address && item.address.toLowerCase().includes(q)) ||
          (item.storeCode && item.storeCode.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortField === 'reviews') {
        valA = Number(a.totalReviews) || 0;
        valB = Number(b.totalReviews) || 0;
      } else if (sortField === 'growth') {
        valA = Number(a.difference || a.todayNewReviews) || 0;
        valB = Number(b.difference || b.todayNewReviews) || 0;
      } else if (sortField === 'rating') {
        valA = Number(a.averageRating) || 0;
        valB = Number(b.averageRating) || 0;
      } else if (sortField === 'pending') {
        valA = Number(a.pendingCount) || 0;
        valB = Number(b.pendingCount) || 0;
      }

      return sortAsc ? valA - valB : valB - valA;
    });

    return result;
  }, [list, searchQuery, sortField, sortAsc]);

  const topBranch = useMemo(() => {
    if (list.length === 0) return null;
    return [...list].sort((a, b) => (Number(b.totalReviews) || 0) - (Number(a.totalReviews) || 0))[0];
  }, [list]);

  const fastestGrowth = useMemo(() => {
    if (list.length === 0) return null;
    return [...list].sort((a, b) => (Number(b.difference || b.todayNewReviews) || 0) - (Number(a.difference || a.todayNewReviews) || 0))[0];
  }, [list]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  if (list.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-400">
        <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40 text-blue-500" />
        <p className="text-sm font-medium text-slate-700">No Multi-Location Profiles Loaded Yet</p>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto font-normal">
          Connect your Google Business Profiles or click Live Refresh above to populate cross-branch rankings.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden space-y-0">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500 shrink-0" />
            <h3 className="text-sm font-medium text-slate-800">Multi-Location Branch Performance Leaderboard</h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-normal whitespace-nowrap shrink-0">
              {list.length} Profiles Linked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Cross-branch benchmarking across all Google Business Profiles under your account
          </p>
        </div>

        {/* Quick Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {topBranch && (
            <div className="px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded text-[11px] text-amber-900 flex items-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>Top Branch: <strong className="font-medium">{topBranch.title || topBranch.name}</strong></span>
            </div>
          )}
          {fastestGrowth && (Number(fastestGrowth.difference || fastestGrowth.todayNewReviews) > 0) && (
            <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded text-[11px] text-emerald-900 flex items-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0">
              <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Fastest: <strong className="font-medium">+{Number(fastestGrowth.difference || fastestGrowth.todayNewReviews)} new</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Search & Sort Controls Toolbar */}
      <div className="p-3 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search branches by title, store code, or address..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all font-normal"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-slate-700 whitespace-nowrap shrink-0">Sort by:</span>
          
          <button
            onClick={() => toggleSort('reviews')}
            className={`px-2.5 py-1 rounded border text-[11px] font-normal flex items-center gap-1 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              sortField === 'reviews' 
                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-2xs font-medium' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Reviews</span>
            {sortField === 'reviews' && <ArrowUpDown className="w-3 h-3 ml-0.5 shrink-0" />}
          </button>

          <button
            onClick={() => toggleSort('growth')}
            className={`px-2.5 py-1 rounded border text-[11px] font-normal flex items-center gap-1 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              sortField === 'growth' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-2xs font-medium' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Growth</span>
            {sortField === 'growth' && <ArrowUpDown className="w-3 h-3 ml-0.5 shrink-0" />}
          </button>

          <button
            onClick={() => toggleSort('rating')}
            className={`px-2.5 py-1 rounded border text-[11px] font-normal flex items-center gap-1 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              sortField === 'rating' 
                ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-2xs font-medium' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Rating</span>
            {sortField === 'rating' && <ArrowUpDown className="w-3 h-3 ml-0.5 shrink-0" />}
          </button>

          <button
            onClick={() => toggleSort('pending')}
            className={`px-2.5 py-1 rounded border text-[11px] font-normal flex items-center gap-1 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              sortField === 'pending' 
                ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-2xs font-medium' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Pending</span>
            {sortField === 'pending' && <ArrowUpDown className="w-3 h-3 ml-0.5 shrink-0" />}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse data-table">
          <thead>
            <tr>
              <th className="w-12 text-center whitespace-nowrap shrink-0">Rank</th>
              <th className="whitespace-nowrap shrink-0">Branch / Location</th>
              <th className="whitespace-nowrap shrink-0">Total Reviews</th>
              <th className="whitespace-nowrap shrink-0">Growth Pace</th>
              <th className="whitespace-nowrap shrink-0">Avg Rating</th>
              <th className="whitespace-nowrap shrink-0">Response SLA Status</th>
              <th className="text-right whitespace-nowrap shrink-0">Action</th>
            </tr>
          </thead>
          <tbody>
            {processedList.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400 text-xs font-normal">
                  No branches found matching "{searchQuery}".
                </td>
              </tr>
            ) : (
              processedList.map((item, idx) => {
                const rank = idx + 1;
                const isTop = rank === 1;
                const pending = Number(item?.pendingCount) || 0;
                const hasBacklog = pending > 0;
                const totalRevs = Number(item?.totalReviews) || 0;
                const diff = Number(item?.difference || item?.todayNewReviews) || 0;
                const avg = Number(item?.averageRating) || 0;
                const key = item.name || item.id || (item as any).v4Name;

                return (
                  <tr 
                    key={key || idx} 
                    className={`hover:bg-slate-50/80 transition-colors ${isTop ? 'bg-amber-50/20' : ''}`}
                  >
                    {/* Rank */}
                    <td className="text-center font-medium text-slate-500 font-mono whitespace-nowrap shrink-0">
                      {rank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 inline-flex items-center justify-center text-xs shadow-2xs">
                          🥇
                        </span>
                      ) : rank === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 inline-flex items-center justify-center text-xs shadow-2xs">
                          🥈
                        </span>
                      ) : rank === 3 ? (
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 inline-flex items-center justify-center text-xs shadow-2xs">
                          🥉
                        </span>
                      ) : (
                        `#${rank}`
                      )}
                    </td>

                    {/* Title */}
                    <td>
                      <div className="font-medium text-slate-800 text-sm flex items-center gap-1.5 whitespace-nowrap">
                        <span>{item.title || item.name || 'Unnamed Location'}</span>
                        {item.storeCode && (
                          <span className="text-[10px] font-mono text-slate-400 font-normal">
                            ({item.storeCode})
                          </span>
                        )}
                      </div>
                      {item.address && (
                        <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                          {item.address}
                        </div>
                      )}
                    </td>

                    {/* Total Reviews */}
                    <td className="font-medium text-slate-800 font-mono text-sm whitespace-nowrap shrink-0">
                      {totalRevs.toLocaleString()}
                    </td>

                    {/* Change */}
                    <td className="whitespace-nowrap shrink-0">
                      {diff > 0 ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0">
                          <TrendingUp className="w-3 h-3 shrink-0" />
                          +{diff}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono">0</span>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="whitespace-nowrap shrink-0">
                      <div className="flex items-center gap-1 font-medium text-slate-700 text-xs whitespace-nowrap shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        <span>{avg.toFixed(1)}</span>
                      </div>
                    </td>

                    {/* Pending */}
                    <td className="whitespace-nowrap shrink-0">
                      {hasBacklog ? (
                        <button
                          onClick={() => {
                            if (onSelectLocation && key) onSelectLocation(key);
                            if (onNavigateTab) onNavigateTab('reviews');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-normal text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          title="Click to view and answer unreplied reviews"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{pending} to reply</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-normal text-emerald-700 bg-emerald-50/60 px-2.5 py-0.5 rounded-full border border-emerald-100 whitespace-nowrap shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>100% Replied</span>
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="text-right whitespace-nowrap shrink-0">
                      <button
                        onClick={() => onSelectLocation && key && onSelectLocation(key)}
                        className="px-2.5 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all inline-flex items-center gap-1 cursor-pointer font-medium border border-blue-100 shadow-2xs whitespace-nowrap shrink-0"
                      >
                        <span>Deep Dive</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
