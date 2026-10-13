import React from 'react';
import { Star, ShieldCheck, Flame } from 'lucide-react';

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
}

export const StarDistributionDonut: React.FC<StarDistributionDonutProps> = ({
  ratingsCount = {},
  totalReviews = 0,
  avgRating = 0,
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

  // Required 5-star calculation to reach 4.9★
  const targetRating = 4.9;
  const currentTotal = Number(totalReviews) || 0;
  const currentSum = numRating * currentTotal;
  const neededFiveStars = Math.max(
    0,
    Math.ceil((targetRating * currentTotal - currentSum) / (5 - targetRating))
  );

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Star Rating Distribution & Reputation Quality</h3>
          <p className="text-xs text-slate-500 mt-0.5">Customer feedback breakdown and Net Reputation Score (NRS)</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{npsScore >= 70 ? 'World Class NPS' : npsScore >= 40 ? 'Healthy NPS' : 'Attention Needed'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
        {/* Left: Donut Chart */}
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
              strokeWidth="18"
              strokeDasharray={`${s5} ${circumference - s5}`}
              strokeDashoffset={-o5}
            />

            {/* 4 Star Slice (Blue) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#3b82f6"
              strokeWidth="18"
              strokeDasharray={`${s4} ${circumference - s4}`}
              strokeDashoffset={-o4}
            />

            {/* 3 Star Slice (Amber) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="18"
              strokeDasharray={`${s3} ${circumference - s3}`}
              strokeDashoffset={-o3}
            />

            {/* 2 Star Slice (Orange) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#f97316"
              strokeWidth="18"
              strokeDasharray={`${s2} ${circumference - s2}`}
              strokeDashoffset={-o2}
            />

            {/* 1 Star Slice (Red) */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#ef4444"
              strokeWidth="18"
              strokeDasharray={`${s1} ${circumference - s1}`}
              strokeDashoffset={-o1}
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-800 leading-none">{numRating.toFixed(1)}</span>
            <div className="flex items-center text-amber-400 mt-1">
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">{currentTotal.toLocaleString()} Reviews</span>
          </div>
        </div>

        {/* Right: Breakdown Progress Bars */}
        <div className="sm:col-span-7 space-y-2">
          {[
            { label: '5 Stars', count: five, pct: p5, color: 'bg-emerald-500' },
            { label: '4 Stars', count: four, pct: p4, color: 'bg-blue-500' },
            { label: '3 Stars', count: three, pct: p3, color: 'bg-amber-500' },
            { label: '2 Stars', count: two, pct: p2, color: 'bg-orange-500' },
            { label: '1 Star', count: one, pct: p1, color: 'bg-red-500' },
          ].map((tier, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="w-14 text-slate-600 font-normal whitespace-nowrap">{tier.label}</span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${tier.color} rounded-full transition-all duration-500`} 
                  style={{ width: `${Math.min(100, Math.max(0, tier.pct))}%` }} 
                />
              </div>
              <span className="w-8 text-right font-medium text-slate-700">{tier.count}</span>
              <span className="w-10 text-right text-slate-400 text-[11px]">{Number(tier.pct || 0).toFixed(0)}%</span>
            </div>
          ))}

          {/* Rating Elevation Tip */}
          {numRating < targetRating && neededFiveStars > 0 && (
            <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Need <strong>+{neededFiveStars} consecutive 5★ reviews</strong> to lift profile rating to <strong>4.9★</strong>.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
