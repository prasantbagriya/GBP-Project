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
      <div className="card p-4 sm:p-6 bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-800 text-white rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-2 bg-white/20 rounded-xl text-white shrink-0 shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight">
              Website Live Support & Drag-and-Drop Chatbot
            </h2>
            <span className="bg-emerald-500/90 text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded-full shadow-2xs">
              Real-time Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl leading-relaxed">
            Real-time live visitor inbox, team member routing, visual drag-and-drop auto-reply builder, and embeddable website widget.
          </p>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shrink-0 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveSubTab('inbox')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'inbox' ? 'bg-white text-indigo-900 shadow-md' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Live Inbox
          </button>

          <button
            onClick={() => setActiveSubTab('builder')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'builder' ? 'bg-white text-indigo-900 shadow-md' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            Flow Builder
          </button>

          <button
            onClick={() => setActiveSubTab('widget')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'widget' ? 'bg-white text-indigo-900 shadow-md' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Widget & Embed
          </button>

          <button
            onClick={() => setActiveSubTab('canned')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'canned' ? 'bg-white text-indigo-900 shadow-md' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Canned Replies
          </button>

          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'analytics' ? 'bg-white text-indigo-900 shadow-md' : 'text-white/80 hover:text-white hover:bg-white/10'
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
