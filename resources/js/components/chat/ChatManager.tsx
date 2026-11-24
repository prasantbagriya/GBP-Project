import React, { useState } from 'react';
import {
  MessageSquare,
  Workflow,
  Sliders,
  Bookmark,
  BarChart2,
  Sparkles,
  Layers,
  Globe,
  Users
} from 'lucide-react';
import { PanelUser } from '../../types';
import { ChatInbox } from './ChatInbox';
import { FlowBuilder } from './FlowBuilder';
import { WidgetCustomizer } from './WidgetCustomizer';
import { CannedResponsesManager } from './CannedResponsesManager';
import { ChatAnalyticsView } from './ChatAnalyticsView';

interface ChatManagerProps {
  panelUser: PanelUser | null;
}

export const ChatManager: React.FC<ChatManagerProps> = ({ panelUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'inbox' | 'builder' | 'widget' | 'canned' | 'analytics'>('inbox');

  return (
    <div className="space-y-5 w-full max-w-full min-w-0 overflow-x-hidden">
      
      {/* Header Banner */}
      <div className="card p-4 sm:p-5 bg-white text-slate-900 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg shrink-0">
              <MessageSquare className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              Website Live Support & Chatbot
            </h2>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Real-time visitor inbox, team member routing, visual drag-and-drop auto-reply builder, and embeddable website widget.
          </p>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveSubTab('inbox')}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'inbox' ? 'bg-indigo-600 text-white font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Live inbox
          </button>

          <button
            onClick={() => setActiveSubTab('builder')}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'builder' ? 'bg-indigo-600 text-white font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            Flow builder
          </button>

          <button
            onClick={() => setActiveSubTab('widget')}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'widget' ? 'bg-indigo-600 text-white font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Widget & embed
          </button>

          <button
            onClick={() => setActiveSubTab('canned')}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'canned' ? 'bg-indigo-600 text-white font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Canned replies
          </button>

          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'analytics' ? 'bg-indigo-600 text-white font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Analytics
          </button>
        </div>
      </div>

      {/* Active Sub-Tab Content */}
      <div className="w-full">
        {activeSubTab === 'inbox' && <ChatInbox panelUser={panelUser} />}
        {activeSubTab === 'builder' && <FlowBuilder />}
        {activeSubTab === 'widget' && <WidgetCustomizer />}
        {activeSubTab === 'canned' && <CannedResponsesManager />}
        {activeSubTab === 'analytics' && <ChatAnalyticsView />}
      </div>
    </div>
  );
};
