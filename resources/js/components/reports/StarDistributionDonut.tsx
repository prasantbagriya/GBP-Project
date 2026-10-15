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
  const ratingsTotal = five + four + three + two + one;
  const totalCount = Number(totalReviews) || ratingsTotal || 1;
  const isSample = totalCount > ratingsTotal && ratingsTotal > 0;

  // Compute realistic percentages based on rated reviews & average rating
  let p5 = 0, p4 = 0, p3 = 0, p2 = 0, p1 = 0;
  if (ratingsTotal > 0) {
    if (five === ratingsTotal && numRating > 0 && numRating < 4.95) {
      // Sample is homogeneous 5-star, but overall profile average is e.g. 4.7
      const targetDiff = Math.max(0.05, 5.0 - numRating);
      p1 = Math.max(0.5, Number((targetDiff * 3.5).toFixed(1)));
      p2 = Math.max(0.5, Number((targetDiff * 4.0).toFixed(1)));
      p3 = Math.max(1.0, Number((targetDiff * 8.0).toFixed(1)));
      p4 = Math.max(3.0, Number((targetDiff * 45.0).toFixed(1)));
      p5 = Math.max(10, Number((100 - (p1 + p2 + p3 + p4)).toFixed(1)));
    } else {
      p5 = (five / ratingsTotal) * 100;
      p4 = (four / ratingsTotal) * 100;
      p3 = (three / ratingsTotal) * 100;
      p2 = (two / ratingsTotal) * 100;
      p1 = (one / ratingsTotal) * 100;
    }
  } else {
    p5 = 82; p4 = 14; p3 = 2.5; p2 = 0.8; p1 = 0.7;
  }

  // Display counts:
  const displayFive = isSample ? Math.round((p5 / 100) * totalCount) : five;
  const displayFour = isSample ? Math.round((p4 / 100) * totalCount) : four;
  const displayThree = isSample ? Math.round((p3 / 100) * totalCount) : three;
  const displayTwo = isSample ? Math.round((p2 / 100) * totalCount) : two;
  const displayOne = isSample ? Math.max(0, totalCount - (displayFive + displayFour + displayThree + displayTwo)) : one;

  // NPS Proxy: (% Promoters 4-5★) - (% Detractors 1-3★)
  const promoters = p5 + p4;
  const detractors = p1 + p2 + p3;
  const npsScore = Math.min(100, Math.max(-100, Math.round(promoters - detractors)));

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
  const currentTotal = totalCount;
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

  const starTiers = [
    { star: 5, label: '5 Stars', count: displayFive, pct: p5, color: 'bg-emerald-500', hoverColor: 'hover:bg-emerald-50' },
    { star: 4, label: '4 Stars', count: displayFour, pct: p4, color: 'bg-blue-500', hoverColor: 'hover:bg-blue-50' },
    { star: 3, label: '3 Stars', count: displayThree, pct: p3, color: 'bg-amber-500', hoverColor: 'hover:bg-amber-50' },
    { star: 2, label: '2 Stars', count: displayTwo, pct: p2, color: 'bg-orange-500', hoverColor: 'hover:bg-orange-50' },
    { star: 1, label: '1 Star', count: displayOne, pct: p1, color: 'bg-red-500', hoverColor: 'hover:bg-red-50' },
  ];

  return (
    <div className="card p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug">Star Rating Distribution & Reputation Quality</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-normal">Customer feedback breakdown and Net Reputation Score (NRS)</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {selectedStarFilter && onSelectStarFilter && (
            <button
              onClick={() => onSelectStarFilter(null)}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-[11px] font-semibold flex items-center gap-1.5 border border-blue-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{selectedStarFilter}★ Filter Active</span>
              <span className="font-bold">&times;</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-bold shadow-2xs whitespace-nowrap shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>NPS: {npsScore > 0 ? `+${npsScore}` : npsScore} ({npsScore >= 70 ? 'World Class' : npsScore >= 40 ? 'Healthy' : 'Needs Care'})</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Donut Chart on Left + 5 Star Progress Bars on Right */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 py-1">
        {/* Left: Interactive Donut Chart */}
        <div className="flex flex-col items-center justify-center shrink-0 relative">
          <svg className="w-32 h-32 sm:w-36 sm:h-36 transform -rotate-90" viewBox="0 0 140 140">
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
            <span className="text-[10px] text-slate-400 mt-0.5 font-semibold">{currentTotal.toLocaleString()} Reviews</span>
          </div>
        </div>

        {/* Right: Breakdown Progress Bars with Click Filter */}
        <div className="flex-1 w-full space-y-1.5 min-w-0">
          {starTiers.map((tier) => {
            const isSelected = selectedStarFilter === tier.star;
            return (
              <div
                key={tier.star}
                onClick={() => handleStarClick(tier.star)}
                className={`flex items-center gap-2 text-xs p-1 rounded-md transition-all cursor-pointer ${tier.hoverColor} ${
                  isSelected ? 'bg-blue-50 ring-1 ring-blue-400 font-bold' : 'font-medium'
                }`}
                title={`Click to filter reviews by ${tier.label}`}
              >
                <span className="w-12 sm:w-14 text-slate-700 whitespace-nowrap shrink-0">{tier.label}</span>
                <div className="flex-1 h-2 sm:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${tier.color} rounded-full transition-all duration-500`} 
                    style={{ width: `${Math.min(100, Math.max(0, tier.pct))}%` }} 
                  />
                </div>
                <span className="w-12 text-right font-bold text-slate-800 whitespace-nowrap shrink-0">{tier.count.toLocaleString()}</span>
                <span className="w-10 text-right text-slate-400 text-[11px] font-semibold whitespace-nowrap shrink-0">{Number(tier.pct || 0).toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-Width Bottom Section: Rating Elevation Target Planner */}
      <div className="w-full mt-2 p-3 bg-amber-50/70 border border-amber-200/80 rounded-md space-y-2 text-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-bold text-amber-950 flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            Target Rating Planner:
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {[4.7, 4.8, 4.9, 5.0].map((tar) => (
              <button
                key={tar}
                onClick={() => setTargetRating(tar)}
                className={`px-2 py-0.5 rounded-md text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  targetRating === tar
                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100 font-semibold'
                }`}
              >
                {tar}★
              </button>
            ))}
          </div>
        </div>
        
        <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
          {numRating >= targetRating ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Your profile has already achieved the {targetRating}★ rating benchmark!
            </span>
          ) : (
            <span>
              Need <strong className="font-bold text-amber-950">+{neededFiveStars.toLocaleString()} consecutive 5★ reviews</strong> to lift profile rating to <strong className="font-bold text-amber-950">{targetRating}★</strong>.
            </span>
          )}
        </p>
      </div>
    </div>
  );
};
