import React from 'react';
import { Sparkles, ThumbsUp, AlertCircle, MessageSquare } from 'lucide-react';

interface AiSentimentTopicsCardProps {
  positiveCount: number;
  neutralCount: number;
  criticalCount: number;
  topKeywords: string[];
  summaryText?: string;
  onKeywordClick?: (keyword: string) => void;
}

export const AiSentimentTopicsCard: React.FC<AiSentimentTopicsCardProps> = ({
  positiveCount,
  neutralCount,
  criticalCount,
  topKeywords,
  summaryText,
  onKeywordClick,
}) => {
  const total = Math.max(positiveCount + neutralCount + criticalCount, 1);
  const posPct = Math.round((positiveCount / total) * 100);
  const neuPct = Math.round((neutralCount / total) * 100);
  const critPct = Math.max(0, 100 - posPct - neuPct);

  // Default intelligent tags if none extracted yet
  const keywords = topKeywords && topKeywords.length > 0 
    ? topKeywords 
    : ['Teaching Quality', 'Staff Courtesy', 'Facility Cleanliness', 'Fast Service', 'Management', 'Location Access'];

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-slate-800">Gemini AI Sentiment & Topic Intelligence</h3>
        </div>
        <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
          Customer Voice AI
        </span>
      </div>

      {/* Polarity Split Bar */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-emerald-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Positive ({posPct}%)
          </span>
          <span className="text-amber-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Neutral ({neuPct}%)
          </span>
          <span className="text-red-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Critical ({critPct}%)
          </span>
        </div>

        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div style={{ width: `${posPct}%` }} className="bg-emerald-500 transition-all duration-500" title={`Positive: ${posPct}%`} />
          <div style={{ width: `${neuPct}%` }} className="bg-amber-400 transition-all duration-500" title={`Neutral: ${neuPct}%`} />
          <div style={{ width: `${critPct}%` }} className="bg-red-500 transition-all duration-500" title={`Critical: ${critPct}%`} />
        </div>
      </div>

      {/* AI Summary Highlight */}
      {summaryText && (
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700 leading-relaxed">
          <span className="font-semibold text-purple-700 mr-1">AI Executive Digest:</span>
          {summaryText}
        </div>
      )}

      {/* Key Topic Badges Cloud */}
      <div>
        <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-2">
          Frequent Mentioned Topics & Themes
        </div>
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw, idx) => (
            <button
              key={idx}
              onClick={() => onKeywordClick && onKeywordClick(kw)}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer font-normal shadow-2xs"
            >
              <MessageSquare className="w-3 h-3 text-slate-400" />
              <span>#{kw}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
