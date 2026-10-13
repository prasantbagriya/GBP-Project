import React from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  Megaphone,
  MessageCircle, 
  Code, 
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-1 flex items-center justify-between shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      {/* 1. Dashboard */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex-1 flex flex-col items-center justify-center h-full py-1 relative transition-colors cursor-pointer ${
          activeTab === 'dashboard' ? 'text-blue-700 font-normal' : 'text-slate-900 hover:text-black font-normal'
        }`}
        title="Dashboard"
      >
        <BarChart3 className="w-4.5 h-4.5 flex-shrink-0" />
        <span className="text-[11px] font-normal mt-0.5 leading-none whitespace-nowrap truncate max-w-full">
          Home
        </span>
        {activeTab === 'dashboard' && (
          <span className="absolute top-0 w-6 h-0.5 bg-blue-600 rounded-full" />
        )}
      </button>

      {/* 2. WhatsApp Report */}
      <button
        onClick={() => setActiveTab('whatsappReport')}
        className={`flex-1 flex flex-col items-center justify-center h-full py-1 relative transition-colors cursor-pointer ${
          activeTab === 'whatsappReport' ? 'text-emerald-700 font-normal' : 'text-slate-900 hover:text-emerald-800 font-normal'
        }`}
        title="WhatsApp Report"
      >
        <div className="relative flex-shrink-0">
          <MessageCircle className="w-4.5 h-4.5 text-emerald-600" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ring-1 ring-white"></span>
        </div>
        <span className="text-[11px] font-normal mt-0.5 leading-none whitespace-nowrap truncate max-w-full text-emerald-700">
          WhatsApp
        </span>
        {activeTab === 'whatsappReport' && (
          <span className="absolute top-0 w-6 h-0.5 bg-emerald-600 rounded-full" />
        )}
      </button>

      {/* 3. Reviews */}
      <button
        onClick={() => setActiveTab('reviews')}
        className={`flex-1 flex flex-col items-center justify-center h-full py-1 relative transition-colors cursor-pointer ${
          activeTab === 'reviews' ? 'text-blue-700 font-normal' : 'text-slate-900 hover:text-black font-normal'
        }`}
        title="Reviews & Replies"
      >
        <div className="relative flex-shrink-0">
          <MessageSquare className="w-4.5 h-4.5" />
          {pendingReviewsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 ring-1 ring-white"></span>
          )}
        </div>
        <span className="text-[11px] font-normal mt-0.5 leading-none whitespace-nowrap truncate max-w-full">
          Reviews
        </span>
        {activeTab === 'reviews' && (
          <span className="absolute top-0 w-6 h-0.5 bg-blue-600 rounded-full" />
        )}
      </button>

      {/* 4. Widget */}
      <button
        onClick={() => setActiveTab('widget')}
        className={`flex-1 flex flex-col items-center justify-center h-full py-1 relative transition-colors cursor-pointer ${
          activeTab === 'widget' ? 'text-blue-700 font-normal' : 'text-slate-900 hover:text-black font-normal'
        }`}
        title="Website Widget"
      >
        <Code className="w-4.5 h-4.5 flex-shrink-0" />
        <span className="text-[11px] font-normal mt-0.5 leading-none whitespace-nowrap truncate max-w-full">
          Widget
        </span>
        {activeTab === 'widget' && (
          <span className="absolute top-0 w-6 h-0.5 bg-blue-600 rounded-full" />
        )}
      </button>

      {/* 5. Profile Posts (Replaces QR) */}
      <button
        onClick={() => setActiveTab('posts')}
        className={`flex-1 flex flex-col items-center justify-center h-full py-1 relative transition-colors cursor-pointer ${
          activeTab === 'posts' ? 'text-blue-700 font-normal' : 'text-slate-900 hover:text-black font-normal'
        }`}
        title="Profile Posts"
      >
        <Megaphone className="w-4.5 h-4.5 flex-shrink-0" />
        <span className="text-[11px] font-normal mt-0.5 leading-none whitespace-nowrap truncate max-w-full">
          Posts
        </span>
        {activeTab === 'posts' && (
          <span className="absolute top-0 w-6 h-0.5 bg-blue-600 rounded-full" />
        )}
      </button>

      {/* 6. More Menu */}
      <button
        onClick={openMobileMenu}
        className="flex-1 flex flex-col items-center justify-center h-full py-1 relative transition-colors text-slate-900 hover:text-black font-normal cursor-pointer"
        title="More Menu"
      >
        <Menu className="w-4.5 h-4.5 flex-shrink-0" />
        <span className="text-[11px] font-normal mt-0.5 leading-none whitespace-nowrap truncate max-w-full">
          More
        </span>
      </button>
    </nav>
  );
};
