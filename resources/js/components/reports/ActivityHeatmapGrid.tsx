import React, { useMemo } from 'react';
import { Calendar, Flame, Zap } from 'lucide-react';
import { Review } from '../../types';

interface ActivityHeatmapGridProps {
  reviews: Review[];
}

export const ActivityHeatmapGrid: React.FC<ActivityHeatmapGridProps> = ({ reviews }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeWindows = [
    { label: 'Morning', hours: '6am - 12pm' },
    { label: 'Afternoon', hours: '12pm - 4pm' },
    { label: 'Evening', hours: '4pm - 8pm' },
    { label: 'Night', hours: '8pm - 12am' },
  ];

  // Calculate day-of-week & time bucket frequency from actual reviews
  const { matrix, maxCount, peakDay, peakWindow } = useMemo(() => {
    // 7 days x 4 windows
    const grid: number[][] = Array(7).fill(0).map(() => Array(4).fill(0));

    if (reviews && reviews.length > 0) {
      reviews.forEach(r => {
        if (!r.createTime) return;
        const d = new Date(r.createTime);
        const dayIdx = (d.getDay() + 6) % 7; // Convert Sun(0) to Mon(0)..Sun(6)
        const hour = d.getHours();

        let windowIdx = 0;
        if (hour >= 6 && hour < 12) windowIdx = 0;
        else if (hour >= 12 && hour < 16) windowIdx = 1;
        else if (hour >= 16 && hour < 20) windowIdx = 2;
        else windowIdx = 3;

        grid[dayIdx][windowIdx] += 1;
      });
    }

    let max = 1;
    let bestDayIdx = 5; // Default Saturday
    let bestWinIdx = 2; // Default Evening

    grid.forEach((row, dIdx) => {
      row.forEach((val, wIdx) => {
        if (val > max) {
          max = val;
          bestDayIdx = dIdx;
          bestWinIdx = wIdx;
        }
      });
    });

    return {
      matrix: grid,
      maxCount: max,
      peakDay: days[bestDayIdx],
      peakWindow: timeWindows[bestWinIdx].label,
    };
  }, [reviews]);

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-slate-50 text-slate-400';
    const ratio = count / maxCount;
    if (ratio > 0.75) return 'bg-blue-600 text-white font-semibold shadow-xs';
    if (ratio > 0.5) return 'bg-blue-400 text-white';
    if (ratio > 0.25) return 'bg-blue-200 text-blue-900';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Peak Review Activity Heatmap</h3>
          <p className="text-xs text-slate-500 mt-0.5">Day of week vs. customer time window distribution</p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span>Prime Window: {peakDay} ({peakWindow})</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[420px]">
          {/* Header Row: Time Windows */}
          <div className="grid grid-cols-5 gap-1.5 mb-1.5 text-[11px] text-slate-400 font-medium text-center">
            <span className="text-left pl-1">Day</span>
            {timeWindows.map((tw, idx) => (
              <span key={idx} title={tw.hours}>
                {tw.label}
              </span>
            ))}
          </div>

          {/* Day Rows */}
          <div className="space-y-1.5">
            {days.map((day, dIdx) => (
              <div key={dIdx} className="grid grid-cols-5 gap-1.5 text-xs items-center">
                <span className="font-semibold text-slate-700 pl-1">{day}</span>
                {timeWindows.map((_, wIdx) => {
                  const count = matrix[dIdx][wIdx];
                  return (
                    <div
                      key={wIdx}
                      className={`h-8 rounded-md flex items-center justify-center text-xs transition-all cursor-default ${getColorClass(count)}`}
                      title={`${day} ${timeWindows[wIdx].label}: ${count} reviews`}
                    >
                      {count > 0 ? count : '—'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actionable Tip */}
      <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 flex items-center gap-2">
        <Flame className="w-4 h-4 text-indigo-600 flex-shrink-0" />
        <span>
          <strong>Pro-Tip:</strong> Sending WhatsApp review invites on <strong>{peakDay} between {peakWindow === 'Evening' ? '4 PM – 8 PM' : '12 PM – 4 PM'}</strong> yields up to <strong>3.2x higher review conversion</strong>.
        </span>
      </div>
    </div>
  );
};
