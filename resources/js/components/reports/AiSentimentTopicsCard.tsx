import React, { useState } from 'react';
import { Sparkles, ThumbsUp, AlertCircle, MessageSquare, X, Star } from 'lucide-react';
import { Review } from '../../types';

interface AiSentimentTopicsCardProps {
  positiveCount: number;
  neutralCount: number;
  criticalCount: number;
  topKeywords?: string[];
  summaryText?: string;
  reviews?: Review[];
  onKeywordClick?: (keyword: string) => void;
}

export const AiSentimentTopicsCard: React.FC<AiSentimentTopicsCardProps> = ({
  positiveCount,
  neutralCount,
  criticalCount,
  topKeywords = [],
  summaryText,
  reviews = [],
  onKeywordClick,
}) => {
  const [activeKeywordModal, setActiveKeywordModal] = useState<string | null>(null);

  const total = Math.max(positiveCount + neutralCount + criticalCount, 1);
  const posPct = Math.round((positiveCount / total) * 100);
  const neuPct = Math.round((neutralCount / total) * 100);
  const critPct = Math.max(0, 100 - posPct - neuPct);

  // Default intelligent tags if none extracted yet
  const keywords = topKeywords && topKeywords.length > 0 
    ? topKeywords 
    : ['Faculty & Staff', 'Service Quality', 'Fast Response', 'Campus Environment', 'Management', 'Teaching Standards'];

  // Reviews matching selected keyword
  const matchingReviews = activeKeywordModal
    ? reviews.filter(r => (r.comment || '').toLowerCase().includes(activeKeywordModal.toLowerCase()))
    : [];

  const handleTagClick = (kw: string) => {
    setActiveKeywordModal(kw);
    if (onKeywordClick) {
      onKeywordClick(kw);
    }
  };

  return (
    <div className="card p-5 space-y-4 relative">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-800">Gemini AI Sentiment & Topic Intelligence</h3>
        </div>
        <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200 font-semibold">
          Customer Voice AI
        </span>
      </div>

      {/* Polarity Split Bar */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-emerald-700 flex items-center gap-1 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Positive ({posPct}%)
          </span>
          <span className="text-amber-700 flex items-center gap-1 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Neutral ({neuPct}%)
          </span>
          <span className="text-red-700 flex items-center gap-1 font-semibold">
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
        <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-xs text-slate-700 leading-relaxed shadow-2xs">
          <span className="font-bold text-purple-800 mr-1 flex items-center gap-1 mb-0.5">
            <Sparkles className="w-3 h-3 text-purple-600" />
            Executive AI Reputation Analysis:
          </span>
          <p className="text-slate-600">{summaryText}</p>
        </div>
      )}

      {/* Key Topic Badges Cloud */}
      <div>
        <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Frequently Mentioned Themes & Keywords</span>
          <span className="text-[10px] text-purple-600 font-normal">Click topic to inspect reviews</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw, idx) => (
            <button
              key={idx}
              onClick={() => handleTagClick(kw)}
              className="px-2.5 py-1 bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-slate-200 text-slate-700 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer font-medium shadow-2xs active:scale-95"
            >
              <MessageSquare className="w-3 h-3 text-slate-400 group-hover:text-purple-500" />
              <span>#{kw}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Matching Reviews Modal / Drilldown */}
      {activeKeywordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Reviews Mentioning "#{activeKeywordModal}"</h4>
                  <span className="text-xs text-slate-500">{matchingReviews.length} customer reviews found</span>
                </div>
              </div>
              <button
                onClick={() => setActiveKeywordModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {matchingReviews.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <p>No customer reviews directly mention "{activeKeywordModal}".</p>
                  <p className="mt-1 text-slate-500">This keyword was extracted as a related theme or sentiment tag.</p>
                </div>
              ) : (
                matchingReviews.map((r, i) => {
                  const ratingNum = typeof r.starRating === 'number' 
                    ? r.starRating 
                    : r.starRating === 'FIVE' ? 5 : r.starRating === 'FOUR' ? 4 : r.starRating === 'THREE' ? 3 : r.starRating === 'TWO' ? 2 : 1;

                  return (
                    <div key={r.reviewId || i} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{r.reviewer?.displayName || 'Customer'}</span>
                        <div className="flex items-center text-amber-400 font-semibold gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{ratingNum}★</span>
                        </div>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{r.comment || 'No written text provided.'}</p>
                      {r.reviewReply?.comment && (
                        <div className="p-2 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900 mt-1">
                          <span className="font-semibold block">Owner Reply:</span>
                          {r.reviewReply.comment}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveKeywordModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
