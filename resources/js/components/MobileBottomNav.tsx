import React from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  Megaphone,
  MessageCircle, 
  TrendingUp, 
  Menu
} from 'lucide-react';
import { TabType } from '../types';

interface MobileBottomNavProps {
  activeTab: TabType;
  setActiveTab: (t: TabType) => void;
  pendingReviewsCount: number;
  openMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingReviewsCount,
  openMobileMenu
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-sm border-t border-slate-200 z-40 px-1 flex items-center justify-between shadow-lg">
      {/* 1. Dashboard */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex-1 flex flex-col items-center justify-center h-full py-1 relative transition-colors cursor-pointer ${
          activeTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
        }`}
        title="Dashboard"
      >
        <BarChart3 className="w-4.5 h-4.5 shrink-0" />
        <span className="text-[11px] mt-0.5 leading-none whitespace-nowrap truncate max-w-full">
          Home
        </span>
        {activeTab === 'dashboard' && (
          <span className="absolute top-0 w-6 h-0.5 bg-indigo-600 rounded-full" />
        )}
      </button>

      {/* 2. WhatsApp Report */}
      <button
        onClick={() => setActiveTab('whatsappReport')}
        className={`flex-1 flex flex-col items-center justify-center h-full py-1 relative transition-colors cursor-pointer ${
          activeTab === 'whatsappReport' ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
        }`}
        title="WhatsApp report"
      >
        <div className="relative shrink-0">
          <MessageCircle className="w-4.5 h-4.5" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-600 ring-1 ring-white"></span>
        </div>
        <span className="text-[11px] mt-0.5 leading-none whitespace-nowrap truncate max-w-full">
          WhatsApp
        </span>
        {activeTab === 'whatsappReport' && (
          <span className="absolute top-0 w-6 h-0.5 bg-indigo-600 rounded-full" />
        )}
      </button>

      {/* 3. Reviews */}
      <button
        onClick={() => setActiveTab('reviews')}
        className={`flex-1 flex flex-col items-center justify-center h-full py-1 relative transition-colors cursor-pointer ${
          activeTab === 'reviews' ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
        }`}
        title="Reviews"
      >
        <div className="relative shrink-0">
          <MessageSquare className="w-4.5 h-4.5" />
          {pendingReviewsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 ring-1 ring-white"></span>
          )}
        </div>
        <span className="text-[11px] mt-0.5 leading-none whitespace-nowrap truncate max-w-full">
          Reviews
        </span>
        {activeTab === 'reviews' && (
          <span className="absolute top-0 w-6 h-0.5 bg-indigo-600 rounded-full" />
        )}
      </button>

      {/* 4. Reports */}
      <button
        onClick={() => setActiveTab('reports')}
        className={`flex-1 flex flex-col items-center justify-center h-full py-1 relative transition-colors cursor-pointer ${
          activeTab === 'reports' ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
        }`}
        title="Reports"
      >
        <TrendingUp className="w-4.5 h-4.5 shrink-0" />
        <span className="text-[11px] mt-0.5 leading-none whitespace-nowrap truncate max-w-full">
          Reports
        </span>
        {activeTab === 'reports' && (
          <span className="absolute top-0 w-6 h-0.5 bg-indigo-600 rounded-full" />
        )}
      </button>

      {/* 5. Profile Posts */}
      <button
        onClick={() => setActiveTab('posts')}
        className={`flex-1 flex flex-col items-center justify-center h-full py-1 relative transition-colors cursor-pointer ${
          activeTab === 'posts' ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900 font-medium'
        }`}
        title="Profile posts"
      >
        <Megaphone className="w-4.5 h-4.5 shrink-0" />
        <span className="text-[11px] mt-0.5 leading-none whitespace-nowrap truncate max-w-full">
          Posts
        </span>
        {activeTab === 'posts' && (
          <span className="absolute top-0 w-6 h-0.5 bg-indigo-600 rounded-full" />
        )}
      </button>

      {/* 6. More Menu */}
      <button
        onClick={openMobileMenu}
        className="flex-1 flex flex-col items-center justify-center h-full py-1 relative transition-colors text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
        title="More menu"
      >
        <Menu className="w-4.5 h-4.5 shrink-0" />
        <span className="text-[11px] mt-0.5 leading-none whitespace-nowrap truncate max-w-full">
          More
        </span>
      </button>
    </nav>
  );
};
