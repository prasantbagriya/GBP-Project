import React, { useState } from 'react';
import { Target, TrendingUp, Calendar, Zap, CheckCircle2 } from 'lucide-react';

interface MilestoneForecasterCardProps {
  currentReviews?: number | string;
  avgDailyVelocity?: number | string;
  avgRating?: number | string;
}

export const MilestoneForecasterCard: React.FC<MilestoneForecasterCardProps> = ({
  currentReviews = 0,
  avgDailyVelocity = 1.5,
  avgRating = 0,
}) => {
  const numCurrent = Number(currentReviews) || 0;

  // Common milestone calculation
  const getNextMilestone = (count: number) => {
    if (count < 50) return 50;
    if (count < 100) return 100;
    if (count < 250) return 250;
    if (count < 500) return 500;
    if (count < 1000) return 1000;
    if (count < 2000) return 2000;
    if (count < 5000) return 5000;
    return Math.ceil((count + 100) / 500) * 500;
  };

  const defaultTarget = getNextMilestone(numCurrent);
  const [targetCount, setTargetCount] = useState<number>(defaultTarget);
  const [customInput, setCustomInput] = useState<string>('');
  const [isEditingCustom, setIsEditingCustom] = useState(false);

  const velocity = Math.max(Number(avgDailyVelocity) || 0.1, 0.1);
  const reviewsNeeded = Math.max(0, targetCount - numCurrent);
  const daysNeeded = Math.ceil(reviewsNeeded / velocity);

  // Projected ETA date
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + (isNaN(daysNeeded) ? 30 : daysNeeded));
  const formattedEta = reviewsNeeded === 0 
    ? 'Goal Achieved!' 
    : projectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  // Progress percentage
  const progressPct = Math.min(100, Math.round((numCurrent / Math.max(targetCount, 1)) * 100));

  // Quick preset options
  const presets = [
    defaultTarget,
    defaultTarget < 500 ? 500 : 1000,
    defaultTarget < 1000 ? 1000 : 2500,
  ].filter((val, idx, self) => self.indexOf(val) === idx && val > numCurrent);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customInput, 10);
    if (!isNaN(parsed) && parsed > numCurrent) {
      setTargetCount(parsed);
      setIsEditingCustom(false);
      setCustomInput('');
    }
  };

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Milestone Forecaster & Target Planner</h3>
            <p className="text-[11px] text-slate-400">Pace projection based on rolling velocity</p>
          </div>
        </div>

        {/* Milestone Preset Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => { setTargetCount(preset); setIsEditingCustom(false); }}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                targetCount === preset && !isEditingCustom
                  ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {preset} Reviews
            </button>
          ))}
          <button
            onClick={() => setIsEditingCustom(!isEditingCustom)}
            className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
              isEditingCustom
                ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Custom...
          </button>
        </div>
      </div>

      {/* Custom target input form */}
      {isEditingCustom && (
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-xs text-slate-600">Set target review count:</span>
          <input
            type="number"
            min={numCurrent + 1}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={`e.g. ${numCurrent + 100}`}
            className="w-32 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 bg-white"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded font-medium hover:bg-indigo-700"
          >
            Apply Target
          </button>
        </form>
      )}

      {/* Main Forecast Body */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Current vs Target */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Target Progress</div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-slate-800">{numCurrent.toLocaleString()}</span>
            <span className="text-xs text-slate-400 ml-1.5">/ {targetCount.toLocaleString()}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {reviewsNeeded === 0 ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Target reached!
              </span>
            ) : (
              <span>{reviewsNeeded.toLocaleString()} reviews remaining</span>
            )}
          </div>
        </div>

        {/* Metric 2: Estimated Arrival Date (ETA) */}
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-col justify-between">
          <div className="text-[11px] uppercase tracking-wider text-indigo-500 font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Estimated Date (ETA)</span>
          </div>
          <div className="mt-1 text-xl font-bold text-indigo-900">
            {formattedEta}
          </div>
          <div className="text-[11px] text-indigo-700 mt-1 font-medium">
            {reviewsNeeded === 0 ? 'Completed' : `~${daysNeeded} days at current velocity`}
          </div>
        </div>

        {/* Metric 3: Current Velocity & Acceleration */}
        <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex flex-col justify-between">
          <div className="text-[11px] uppercase tracking-wider text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Current Velocity</span>
          </div>
          <div className="mt-1 text-xl font-bold text-emerald-900">
            {velocity.toFixed(1)} <span className="text-xs font-normal text-emerald-700">rev/day</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            {Math.round(velocity * 7)} reviews/week run-rate
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-500">Progress to {targetCount.toLocaleString()} Reviews</span>
          <span className="font-semibold text-slate-800">{isNaN(progressPct) ? 0 : progressPct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${isNaN(progressPct) ? 0 : progressPct}%` }}
          />
        </div>
      </div>

      {/* Velocity Strategies & Accelerated Plans */}
      {reviewsNeeded > 0 && (
        <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-950">Sprint Acceleration Option:</div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Want to hit <strong className="font-semibold">{targetCount} reviews in 30 days</strong>? You need an average of{' '}
              <strong className="font-semibold text-amber-950">{(reviewsNeeded / 30).toFixed(1)} reviews/day</strong>. Share your review link via WhatsApp or enable the automated review request banner.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
