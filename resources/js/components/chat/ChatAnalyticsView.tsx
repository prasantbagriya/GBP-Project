import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Star,
  Users,
  CheckCircle2,
  Clock,
  Bot,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Award
} from 'lucide-react';
import { ChatAnalyticsData } from '../../types';

export const ChatAnalyticsView: React.FC = () => {
  const [data, setData] = useState<ChatAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat/admin/analytics');
      const json = await res.json();
      if (json.success && json.analytics) {
        setData(json.analytics);
      }
    } catch (err) {
      console.error('Failed to load chat analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-2">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-500" />
        <p className="text-xs">Loading analytics & CSAT reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Total Conversations</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{data.total_conversations}</span>
            <span className="text-xs text-indigo-600 bg-indigo-50 font-bold px-2 py-0.5 rounded-full">All-time</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Resolution Rate</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{data.resolution_rate}%</span>
            <span className="text-xs text-emerald-600 bg-emerald-50 font-bold px-2 py-0.5 rounded-full">
              {data.resolved_conversations} Resolved
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Bot Containment Rate</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-600">{data.bot_containment_rate}%</span>
            <span className="text-xs text-purple-600 bg-purple-50 font-bold px-2 py-0.5 rounded-full">Automated</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Average CSAT Score</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-500 flex items-center gap-1">
              ★ {data.average_csat}
            </span>
            <span className="text-xs text-amber-600 bg-amber-50 font-bold px-2 py-0.5 rounded-full">Out of 5</span>
          </div>
        </div>
      </div>

      {/* CSAT Stars Breakdown & Agent Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CSAT Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            Customer Satisfaction Rating
          </h4>
          
          <div className="space-y-2.5 pt-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = data.csat_distribution[stars] || 0;
              const totalRatings = Object.values(data.csat_distribution).reduce((a, b) => a + b, 0);
              const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : stars === 5 ? 85 : 5;

              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-14 font-semibold text-slate-700 flex items-center gap-1 shrink-0">
                    {stars} <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  </span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        stars >= 4 ? 'bg-emerald-500' : stars === 3 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                  <span className="w-10 text-right text-slate-500 text-[11px] font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Leaderboard (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            Team Member Support Performance
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2">Agent</th>
                  <th className="pb-2 text-center">Role</th>
                  <th className="pb-2 text-center">Assigned Chats</th>
                  <th className="pb-2 text-center">Resolved</th>
                  <th className="pb-2 text-right">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.agents.map((agent) => {
                  const rate = agent.total_assigned > 0 ? Math.round((agent.resolved_count / agent.total_assigned) * 100) : 100;
                  return (
                    <tr key={agent.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5">
                        <span className="font-bold text-slate-900 block">{agent.name}</span>
                        <span className="text-[10px] text-slate-400">{agent.email}</span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold">
                          {agent.role}
                        </span>
                      </td>
                      <td className="py-2.5 text-center font-bold text-slate-800">{agent.total_assigned}</td>
                      <td className="py-2.5 text-center font-bold text-emerald-600">{agent.resolved_count}</td>
                      <td className="py-2.5 text-right font-black text-indigo-600">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
