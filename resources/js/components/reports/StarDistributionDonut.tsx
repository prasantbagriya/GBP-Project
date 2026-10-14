import React, { useState } from 'react';
import { Star, ShieldCheck, Flame, Filter, CheckCircle2 } from 'lucide-react';

interface StarDistributionDonutProps {
  ratingsCount?: {
    five?: number;
    four?: number;
    three?: number;
    two?: number;
    one?: number;
  };
  totalReviews?: number | string;
  avgRating?: number | string;
  selectedStarFilter?: number | null;
  onSelectStarFilter?: (star: number | null) => void;
}

export const StarDistributionDonut: React.FC<StarDistributionDonutProps> = ({
  ratingsCount = {},
  totalReviews = 0,
  avgRating = 0,
  selectedStarFilter = null,
  onSelectStarFilter,
}) => {
  const five = Number(ratingsCount?.five) || 0;
  const four = Number(ratingsCount?.four) || 0;
  const three = Number(ratingsCount?.three) || 0;
  const two = Number(ratingsCount?.two) || 0;
  const one = Number(ratingsCount?.one) || 0;

  const numRating = Number(avgRating) || 0;
  const numTotal = Math.max(Number(totalReviews) || 0, five + four + three + two + one, 1);

  const p5 = (five / numTotal) * 100;
  const p4 = (four / numTotal) * 100;
  const p3 = (three / numTotal) * 100;
  const p2 = (two / numTotal) * 100;
  const p1 = (one / numTotal) * 100;

  // NPS Proxy: (% Promoters 4-5★) - (% Detractors 1-3★)
  const promoters = ((five + four) / numTotal) * 100;
  const detractors = ((one + two + three) / numTotal) * 100;
  const npsScore = Math.round(promoters - detractors);

  // SVG Donut calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // Offsets for 5 slices
  const s5 = (p5 / 100) * circumference;
  const s4 = (p4 / 100) * circumference;
  const s3 = (p3 / 100) * circumference;
  const s2 = (p2 / 100) * circumference;
  const s1 = (p1 / 100) * circumference;

  const o5 = 0;
  const o4 = s5;
  const o3 = s5 + s4;
  const o2 = s5 + s4 + s3;
  const o1 = s5 + s4 + s3 + s2;

  // Interactive Target Rating Selector
  const [targetRating, setTargetRating] = useState<number>(4.9);
  const currentTotal = Number(totalReviews) || 0;
  const currentSum = numRating * currentTotal;
  const neededFiveStars = Math.max(
    0,
    Math.ceil((targetRating * currentTotal - currentSum) / Math.max(5 - targetRating, 0.05))
  );

  const handleStarClick = (starVal: number) => {
    if (onSelectStarFilter) {
      if (selectedStarFilter === starVal) {
        onSelectStarFilter(null);
      } else {
        onSelectStarFilter(starVal);
      }
    }
  };

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Star Rating Distribution & Reputation Quality</h3>
          <p className="text-xs text-slate-500 mt-0.5">Customer feedback breakdown and Net Reputation Score (NRS)</p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedStarFilter && onSelectStarFilter && (
            <button
              onClick={() => onSelectStarFilter(null)}
              className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-[11px] font-semibold flex items-center gap-1 border border-blue-200 transition-colors"
            >
              <span>{selectedStarFilter}★ Filter Active</span>
              <span className="font-bold">&times;</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>NPS: {npsScore > 0 ? `+${npsScore}` : npsScore} ({npsScore >= 70 ? 'World Class' : npsScore >= 40 ? 'Healthy' : 'Needs Care'})</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
        {/* Left: Interactive Donut Chart */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 140 140">
            {/* Background Circle */}
            <circle cx="70" cy="70" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="18" />

            {/* 5 Star Slice (Emerald) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth={selectedStarFilter === 5 ? 22 : 18}
              strokeDasharray={`${s5} ${circumference - s5}`}
              strokeDashoffset={-o5}
              className="cursor-pointer transition-all hover:opacity-80"
              onClick={() => handleStarClick(5)}
            />

            {/* 4 Star Slice (Blue) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#3b82f6"
              strokeWidth={selectedStarFilter === 4 ? 22 : 18}
              strokeDasharray={`${s4} ${circumference - s4}`}
              strokeDashoffset={-o4}
              className="cursor-pointer transition-all hover:opacity-80"
              onClick={() => handleStarClick(4)}
            />

            {/* 3 Star Slice (Amber) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth={selectedStarFilter === 3 ? 22 : 18}
              strokeDasharray={`${s3} ${circumference - s3}`}
              strokeDashoffset={-o3}
              className="cursor-pointer transition-all hover:opacity-80"
              onClick={() => handleStarClick(3)}
            />

            {/* 2 Star Slice (Orange) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#f97316"
              strokeWidth={selectedStarFilter === 2 ? 22 : 18}
              strokeDasharray={`${s2} ${circumference - s2}`}
              strokeDashoffset={-o2}
              className="cursor-pointer transition-all hover:opacity-80"
              onClick={() => handleStarClick(2)}
            />

            {/* 1 Star Slice (Red) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#ef4444"
              strokeWidth={selectedStarFilter === 1 ? 22 : 18}
              strokeDasharray={`${s1} ${circumference - s1}`}
              strokeDashoffset={-o1}
              className="cursor-pointer transition-all hover:opacity-80"
              onClick={() => handleStarClick(1)}
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-800 leading-none">{numRating.toFixed(1)}</span>
            <div className="flex items-center text-amber-400 mt-1">
              <Star className="w-3 h-3 fill-current" />
              <Star className="w-3 h-3 fill-current" />
              <Star className="w-3 h-3 fill-current" />
              <Star className="w-3 h-3 fill-current" />
              <Star className="w-3 h-3 fill-current" />
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">{currentTotal.toLocaleString()} Reviews</span>
          </div>
        </div>

        {/* Right: Breakdown Progress Bars with Click Filter */}
        <div className="sm:col-span-7 space-y-2">
          {[
            { star: 5, label: '5 Stars', count: five, pct: p5, color: 'bg-emerald-500', hoverColor: 'hover:bg-emerald-50' },
            { star: 4, label: '4 Stars', count: four, pct: p4, color: 'bg-blue-500', hoverColor: 'hover:bg-blue-50' },
            { star: 3, label: '3 Stars', count: three, pct: p3, color: 'bg-amber-500', hoverColor: 'hover:bg-amber-50' },
            { star: 2, label: '2 Stars', count: two, pct: p2, color: 'bg-orange-500', hoverColor: 'hover:bg-orange-50' },
            { star: 1, label: '1 Star', count: one, pct: p1, color: 'bg-red-500', hoverColor: 'hover:bg-red-50' },
          ].map((tier) => {
            const isSelected = selectedStarFilter === tier.star;
            return (
              <div
                key={tier.star}
                onClick={() => handleStarClick(tier.star)}
                className={`flex items-center gap-2 text-xs p-1 rounded-md transition-all cursor-pointer ${tier.hoverColor} ${
                  isSelected ? 'bg-blue-50 ring-1 ring-blue-400 font-semibold' : ''
                }`}
                title={`Click to filter reviews by ${tier.label}`}
              >
                <span className="w-14 text-slate-700 whitespace-nowrap">{tier.label}</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${tier.color} rounded-full transition-all duration-500`} 
                    style={{ width: `${Math.min(100, Math.max(0, tier.pct))}%` }} 
                  />
                </div>
                <span className="w-10 text-right font-bold text-slate-800">{tier.count}</span>
                <span className="w-10 text-right text-slate-400 text-[11px]">{Number(tier.pct || 0).toFixed(0)}%</span>
              </div>
            );
          })}

          {/* Rating Elevation Target Planner */}
          <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                Target Rating Planner:
              </span>
              <div className="flex items-center gap-1">
                {[4.7, 4.8, 4.9, 5.0].map((tar) => (
                  <button
                    key={tar}
                    onClick={() => setTargetRating(tar)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                      targetRating === tar
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {tar}★
                  </button>
                ))}
              </div>
            </div>
            
            <p className="text-[11px] text-amber-900 leading-relaxed">
              {numRating >= targetRating ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Your profile has already achieved the {targetRating}★ rating benchmark!
                </span>
              ) : (
                <span>
                  Need <strong>+{neededFiveStars} consecutive 5★ reviews</strong> to lift profile rating to <strong>{targetRating}★</strong>.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
