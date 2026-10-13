import React, { useState } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';

interface DataPoint {
  label: string;
  dateStr: string;
  count: number;
  avgRating: number | string;
  fiveStars: number;
}

interface ReviewTrajectoryChartProps {
  data?: DataPoint[];
  timeframe?: string;
}

export const ReviewTrajectoryChart: React.FC<ReviewTrajectoryChartProps> = ({ data = [], timeframe = '30d' }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const list = Array.isArray(data) ? data : [];

  if (list.length === 0) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center min-h-[280px] text-slate-400">
        <Calendar className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-xs">No review velocity data available for this timeframe.</p>
      </div>
    );
  }

  const maxVal = Math.max(...list.map(d => Number(d?.count) || 0), 5);
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingX = 20;
  const paddingY = 20;

  const points = list.map((d, i) => {
    const cnt = Number(d?.count) || 0;
    const x = paddingX + (i / Math.max(list.length - 1, 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (cnt / maxVal) * (chartHeight - paddingY * 2);
    return { 
      x: isNaN(x) ? paddingX : x, 
      y: isNaN(y) ? chartHeight - paddingY : y, 
      ...d,
      count: cnt,
      avgRating: Number(d?.avgRating) || 0,
    };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const lastPt = points[points.length - 1] || { x: chartWidth - paddingX, y: chartHeight - paddingY };
  const firstPt = points[0] || { x: paddingX, y: chartHeight - paddingY };
  const areaD = `${pathD} L ${lastPt.x} ${chartHeight - paddingY} L ${firstPt.x} ${chartHeight - paddingY} Z`;

  const totalReviewsInPeriod = list.reduce((sum, d) => sum + (Number(d?.count) || 0), 0);

  return (
    <div className="card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Review Growth Trajectory & Daily Velocity</h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              {timeframe}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {totalReviewsInPeriod} reviews acquired in selected window
          </p>
        </div>

        {hoveredIndex !== null && points[hoveredIndex] && (
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg flex items-center gap-3">
            <div>
              <span className="text-slate-400 text-[10px] block">{points[hoveredIndex].dateStr}</span>
              <span className="font-semibold">{points[hoveredIndex].count} Reviews</span>
            </div>
            <div className="border-l border-slate-700 pl-2">
              <span className="text-amber-400 font-semibold">{points[hoveredIndex].avgRating.toFixed(1)}★ Avg</span>
            </div>
          </div>
        )}
      </div>

      {/* SVG Area Chart */}
      <div className="relative w-full overflow-hidden">
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="w-full h-44 overflow-visible"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#f1f5f9" strokeDasharray="3 3" />
          <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#f1f5f9" strokeDasharray="3 3" />
          <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#e2e8f0" />

          {/* Fill Area */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Line Path */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="#2563eb" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Data Points */}
          {points.map((pt, idx) => (
            <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === idx ? 6 : 3.5}
                fill={hoveredIndex === idx ? '#1d4ed8' : '#ffffff'}
                stroke="#2563eb"
                strokeWidth={hoveredIndex === idx ? 3 : 2}
                className="transition-all"
              />
            </g>
          ))}
        </svg>

        {/* X Axis Labels */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 px-2 mt-1">
          <span>{list[0]?.label || ''}</span>
          {list.length > 2 && <span>{list[Math.floor(list.length / 2)]?.label || ''}</span>}
          <span>{list[list.length - 1]?.label || 'Today'}</span>
        </div>
      </div>
    </div>
  );
};
