import React from 'react';
import {
  LayoutDashboard,
  Table,
  Calendar as CalendarIcon,
  BarChart3,
  ShieldAlert,
  Bookmark,
  FileText,
  Settings as SettingsIcon,
  User,
  TrendingUp,
  X
} from 'lucide-react';
import { UserSettings, Trade } from '../types';
import { calculateAccountMetrics, fmtPct } from '../lib/calculations';

import { DEFAULT_USER_SETTINGS } from '../data/sampleData';

interface SidebarProps {
  currentPage?: string;
  activeTab?: string;
  onSelectPage?: (page: string) => void;
  setActiveTab?: (page: any) => void;
  settings?: UserSettings;
  trades?: Trade[];
  onAvatarClick?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  activeTab,
  onSelectPage,
  setActiveTab,
  settings,
  trades = [],
  onAvatarClick,
  mobileOpen = false,
  onCloseMobile
}) => {
  const safeSettings = settings || DEFAULT_USER_SETTINGS;
  const activePage = currentPage || activeTab || 'dashboard';

  const handlePageSelect = (page: string) => {
    if (onSelectPage) onSelectPage(page);
    if (setActiveTab) setActiveTab(page);
    if (onCloseMobile) onCloseMobile();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trades', label: 'Trades', icon: Table },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'risk', label: 'Risk Management', icon: ShieldAlert },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const summaryStats = calculateAccountMetrics(trades, safeSettings);
  const growthPct = summaryStats.accountGrowthPct;

  // Mini sparkline data points
  const points = summaryStats.equityCurve.slice(-10).map(e => e.cumulativePnl);
  const minPnl = Math.min(...points, 0);
  const maxPnl = Math.max(...points, 1);
  const pnlRange = maxPnl - minPnl || 1;

  const sparklinePolyline = points
    .map((val, idx) => {
      const x = (idx / (points.length - 1 || 1)) * 100;
      const y = 28 - ((val - minPnl) / pnlRange) * 24;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#0B0E13]/95 border-r border-gray-800/80 text-gray-300 w-64 select-none">
      {/* Profile Header */}
      <div className="p-4 border-b border-gray-800/80 flex items-center justify-between">
        <button
          onClick={onAvatarClick}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#12161E] transition w-full text-left group"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#3ED9B8] bg-gray-900 shrink-0 flex items-center justify-center shadow-md">
            {safeSettings.photoUrl ? (
              <img src={safeSettings.photoUrl} alt={safeSettings.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-[#3ED9B8]" />
            )}
          </div>
          <div className="overflow-hidden">
            <h2 className="font-display font-bold text-sm text-white group-hover:text-[#3ED9B8] transition truncate">
              {safeSettings.name || 'Trader Profile'}
            </h2>
            <p className="text-[11px] text-gray-400 font-mono truncate">{safeSettings.brokerName || 'Zerodha'}</p>
          </div>
        </button>

        <button onClick={onCloseMobile} className="md:hidden p-1 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handlePageSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition ${
                isActive
                  ? 'bg-[#191F2A] text-[#3ED9B8] border border-[#3ED9B8]/30 font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-[#12161E]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#3ED9B8]' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer: Equity Sparkline Card */}
      <div className="p-3 border-t border-gray-800/80">
        <div className="bg-[#12161E] border border-gray-800 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#3ED9B8]" />
              Account Growth
            </span>
            <span className={`font-mono font-bold text-xs ${growthPct >= 0 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}`}>
              {fmtPct(growthPct)}
            </span>
          </div>

          {/* SVG Sparkline */}
          <div className="h-7 w-full overflow-hidden pt-1">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke={growthPct >= 0 ? '#3ED9B8' : '#E28B5C'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklinePolyline}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block h-screen sticky top-0 z-30 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
