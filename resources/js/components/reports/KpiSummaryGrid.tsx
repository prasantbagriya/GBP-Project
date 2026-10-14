import React from 'react';
import { MessageSquare, TrendingUp, Star, ShieldCheck, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface KpiSummaryGridProps {
  totalReviews?: number | string;
  periodGrowth?: number | string;
  growthPct?: number | string;
  avgRating?: number | string;
  replyRate?: number | string;
  repliedCount?: number | string;
  scopeLabel?: string;
}

export const KpiSummaryGrid: React.FC<KpiSummaryGridProps> = ({
  totalReviews = 0,
  periodGrowth = 0,
  growthPct = 0,
  avgRating = 0,
  replyRate = 0,
  repliedCount = 0,
  scopeLabel = 'All Profiles',
}) => {
  const numTotal = Number(totalReviews) || 0;
  const numGrowth = Number(periodGrowth) || 0;
  const numGrowthPct = Number(growthPct) || 0;
  const numRating = Number(avgRating) || 0;
  const numReplyRate = Number(replyRate) || 0;
  const numReplied = Number(repliedCount) || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Reviews */}
      <div className="card p-5 border-l-4 border-l-blue-600 relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-600">Total Reviews</span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-normal truncate max-w-[120px] whitespace-nowrap shrink-0">
            {scopeLabel}
          </span>
        </div>
        <div className="text-3xl font-bold text-slate-800 leading-tight">
          {numTotal.toLocaleString()}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-normal">
          <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>All verified customer ratings</span>
        </div>
      </div>

      {/* 2. Review Velocity & Growth */}
      <div className="card p-5 border-l-4 border-l-emerald-500 relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-600">Period Growth</span>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded flex items-center gap-0.5 font-medium border border-emerald-200 whitespace-nowrap shrink-0">
            <ArrowUpRight className="w-3 h-3 shrink-0" />
            +{numGrowthPct}%
          </span>
        </div>
        <div className="text-3xl font-bold text-slate-800 leading-tight">
          +{numGrowth}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-normal">
          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
          <span>New reviews in selected timeframe</span>
        </div>
      </div>

      {/* 3. Average Rating */}
      <div className="card p-5 border-l-4 border-l-amber-500 relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-600">Average Rating</span>
          <div className="flex items-center text-amber-400">
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-800 leading-tight flex items-baseline gap-1.5">
          <span>{numRating.toFixed(1)}</span>
          <span className="text-sm font-normal text-slate-400">/ 5.0</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-normal">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Weighted reputation index</span>
        </div>
      </div>

      {/* 4. Response SLA Rate */}
      <div className="card p-5 border-l-4 border-l-indigo-500 relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-600">Response SLA</span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap shrink-0 ${
            numReplyRate >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {numReplyRate >= 90 ? 'Healthy' : 'Backlog'}
          </span>
        </div>
        <div className="text-3xl font-bold text-slate-800 leading-tight">
          {numReplyRate}%
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-normal">
          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>{numReplied} of {numTotal} reviews answered</span>
        </div>
      </div>
    </div>
  );
};
