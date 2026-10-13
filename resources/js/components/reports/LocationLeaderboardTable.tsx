import React from 'react';
import { Award, TrendingUp, Star, ArrowRight, Building2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ProfileReportItem } from '../../types';

interface LocationLeaderboardTableProps {
  locationsData?: ProfileReportItem[];
  onSelectLocation?: (locationName: string) => void;
}

export const LocationLeaderboardTable: React.FC<LocationLeaderboardTableProps> = ({
  locationsData = [],
  onSelectLocation,
}) => {
  const list = Array.isArray(locationsData) ? locationsData : [];

  if (list.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-400">
        <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40 text-blue-500" />
        <p className="text-sm font-medium text-slate-600">No multi-location data available</p>
        <p className="text-xs text-slate-400 mt-1">Connect your Google Business Profile to view cross-branch leaderboards.</p>
      </div>
    );
  }

  // Sort descending by total reviews
  const sorted = [...list].sort((a, b) => (Number(b?.totalReviews) || 0) - (Number(a?.totalReviews) || 0));
  const topBranch = sorted[0];
  const fastestGrowth = [...list].sort((a, b) => (Number(b?.difference) || 0) - (Number(a?.difference) || 0))[0];

  return (
    <div className="card overflow-hidden space-y-0">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-800">Multi-Location Branch Performance Leaderboard</h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
              {list.length} Profiles Linked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-branch benchmarking across all Google Business Profiles under your account
          </p>
        </div>

        {/* Quick Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {topBranch && (
            <div className="px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-md text-[11px] text-amber-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Top Branch: <strong>{topBranch.title || topBranch.name}</strong></span>
            </div>
          )}
          {fastestGrowth && Number(fastestGrowth.difference) > 0 && (
            <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-md text-[11px] text-emerald-900 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>Fastest: <strong>+{Number(fastestGrowth.difference)} new</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse data-table">
          <thead>
            <tr>
              <th className="w-12 text-center">Rank</th>
              <th>Branch / Location</th>
              <th>Total Reviews</th>
              <th>Weekly Growth</th>
              <th>Avg Rating</th>
              <th>Pending Replies</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, idx) => {
              const rank = idx + 1;
              const isTop = rank === 1;
              const pending = Number(item?.pendingCount) || 0;
              const hasBacklog = pending > 0;
              const totalRevs = Number(item?.totalReviews) || 0;
              const diff = Number(item?.difference) || 0;
              const avg = Number(item?.averageRating) || 0;

              return (
                <tr 
                  key={item.id || item.name || idx} 
                  className={`hover:bg-slate-50/80 transition-colors ${isTop ? 'bg-amber-50/20' : ''}`}
                >
                  {/* Rank */}
                  <td className="text-center font-bold text-slate-500 font-mono">
                    {isTop ? (
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 inline-flex items-center justify-center text-xs">
                        🥇
                      </span>
                    ) : rank === 2 ? (
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 inline-flex items-center justify-center text-xs">
                        🥈
                      </span>
                    ) : rank === 3 ? (
                      <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 inline-flex items-center justify-center text-xs">
                        🥉
                      </span>
                    ) : (
                      `#${rank}`
                    )}
                  </td>

                  {/* Title */}
                  <td>
                    <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                      {item.title || item.name || 'Unnamed Location'}
                      {item.storeCode && (
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          ({item.storeCode})
                        </span>
                      )}
                    </div>
                    {item.address && (
                      <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                        {item.address}
                      </div>
                    )}
                  </td>

                  {/* Total Reviews */}
                  <td className="font-bold text-slate-800 font-mono text-sm">
                    {totalRevs.toLocaleString()}
                  </td>

                  {/* 7-Day Change */}
                  <td>
                    {diff > 0 ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <TrendingUp className="w-3 h-3" />
                        +{diff}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs font-mono">0</span>
                    )}
                  </td>

                  {/* Rating */}
                  <td>
                    <div className="flex items-center gap-1 font-semibold text-slate-700 text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{avg.toFixed(1)}</span>
                    </div>
                  </td>

                  {/* Pending */}
                  <td>
                    {hasBacklog ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        {pending} to reply
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        All replied
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="text-right">
                    <button
                      onClick={() => onSelectLocation && onSelectLocation(item.name || item.id)}
                      className="px-2.5 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <span>Deep Dive</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
