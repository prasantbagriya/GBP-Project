import React from 'react';
import { Clock, Bot, CheckCircle, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface ResponseHealthGaugeProps {
  replyRate?: number | string;
  totalReviews?: number | string;
  repliedCount?: number | string;
  pendingCount?: number | string;
  onViewUnreplied?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const ResponseHealthGauge: React.FC<ResponseHealthGaugeProps> = ({
  replyRate = 0,
  totalReviews = 0,
  repliedCount = 0,
  pendingCount = 0,
  onViewUnreplied,
  onNavigateTab,
}) => {
  const numReplyRate = Math.min(100, Math.max(0, Number(replyRate) || 0));
  const numTotal = Number(totalReviews) || 0;
  const numReplied = Number(repliedCount) || 0;
  const numPending = Number(pendingCount) || 0;

  // Semi-circle gauge calculation (angle 0 to 180 degrees)
  const radius = 60;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // half circle
  const progressOffset = circumference - (numReplyRate / 100) * circumference;

  const isHealthy = numReplyRate >= 85;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Customer Response SLA & Health Speedometer</h3>
          <p className="text-xs text-slate-500 mt-0.5">Turnaround speed, answered ratio, and review backlog</p>
        </div>
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold shadow-2xs ${
          isHealthy ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {isHealthy ? 'Target Met (>=85%)' : 'Backlog Detected'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
        {/* Left: Semi-circle Gauge */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative pt-2">
          <svg className="w-40 h-24 overflow-visible" viewBox="0 0 140 85">
            {/* Background Arc */}
            <path
              d="M 10 75 A 60 60 0 0 1 130 75"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Value Arc */}
            <path
              d="M 10 75 A 60 60 0 0 1 130 75"
              fill="none"
              stroke={numReplyRate >= 85 ? '#10b981' : numReplyRate >= 60 ? '#f59e0b' : '#ef4444'}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={isNaN(progressOffset) ? 0 : progressOffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Value Display */}
          <div className="text-center -mt-8">
            <span className="text-3xl font-bold text-slate-800 leading-none">{numReplyRate}%</span>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider mt-1">SLA Resolution</span>
          </div>
        </div>

        {/* Right: Backlog Breakdown */}
        <div className="sm:col-span-7 space-y-2.5">
          <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Reviews Answered</span>
            </div>
            <strong className="font-bold text-slate-900">{numReplied.toLocaleString()}</strong>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <AlertCircle className={`w-4 h-4 ${numPending > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
              <span>Pending Attention</span>
            </div>
            <strong className={`font-bold ${numPending > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
              {numPending.toLocaleString()}
            </strong>
          </div>

          {numPending > 0 && onViewUnreplied && (
            <button
              onClick={onViewUnreplied}
              className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-blue-200/60 shadow-2xs"
            >
              <span>Address {numPending} Pending Reviews</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('autoreply')}
              className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-purple-200/60 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Configure AI Auto-Reply</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
