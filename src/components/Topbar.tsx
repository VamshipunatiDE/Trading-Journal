import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, User as UserIcon, Moon, Sun, Sparkles, Menu, Flame } from 'lucide-react';
import { ThemeName, UserSettings, Trade } from '../types';
import { NIFTY_500_STOCKS } from '../data/nifty500';
import { User } from 'firebase/auth';

import { DEFAULT_USER_SETTINGS } from '../data/sampleData';

interface TopbarProps {
  settings?: UserSettings;
  trades?: Trade[];
  currentUser?: User | null;
  onThemeChange?: (theme: ThemeName) => void;
  onNewTrade?: (presetStock?: { symbol: string; sector: string }) => void;
  onOpenNewTrade?: (presetStock?: { symbol: string; sector: string }) => void;
  onEditTrade?: (trade: Trade) => void;
  onOpenAuth?: () => void;
  onOpenAuthModal?: () => void;
  onToggleMobileSidebar?: () => void;
  onOpenAvatarLightbox?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  settings,
  trades = [],
  currentUser = null,
  onThemeChange,
  onNewTrade,
  onOpenNewTrade,
  onEditTrade,
  onOpenAuth,
  onOpenAuthModal,
  onToggleMobileSidebar
}) => {
  const safeSettings = settings || DEFAULT_USER_SETTINGS;
  const currentTheme = safeSettings.theme || 'terminal-dark';
  const safeTrades = trades || [];

  const handleNewTradeClick = (preset?: { symbol: string; sector: string }) => {
    if (onNewTrade) onNewTrade(preset);
    else if (onOpenNewTrade) onOpenNewTrade(preset);
  };

  const handleAuthClick = () => {
    if (onOpenAuth) onOpenAuth();
    else if (onOpenAuthModal) onOpenAuthModal();
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Search Logic
  const matchingTrades = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return safeTrades.filter(t =>
      t.stockName.toLowerCase().includes(q) ||
      t.strategy.toLowerCase().includes(q) ||
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      t.id.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchQuery, safeTrades]);

  const matchingNiftyStocks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return NIFTY_500_STOCKS.filter(s =>
      s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchQuery]);

  const themesList: { id: ThemeName; label: string; icon: any }[] = [
    { id: 'terminal-dark', label: 'Terminal Dark', icon: Moon },
    { id: 'paper-light', label: 'Paper Light', icon: Sun },
    { id: 'candlestick-ticker', label: 'Candlestick Ticker', icon: Sparkles },
    { id: 'neon-glow', label: 'Neon Glow', icon: Flame }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B0E13]/90 backdrop-blur-md border-b border-gray-800/80 px-4 py-3 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#12161E] transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="font-display font-extrabold text-lg text-white tracking-tight">
            TRADING<span className="text-[#3ED9B8]">JOURNAL</span>
          </span>
          <span className="text-[10px] bg-[#191F2A] border border-[#3ED9B8]/30 text-[#3ED9B8] px-2 py-0.5 rounded-full font-mono font-semibold">
            PRO
          </span>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            placeholder="Global search trades, strategies, or Nifty 500 stocks..."
            className="w-full bg-[#12161E] border border-gray-800/90 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:border-[#3ED9B8] focus:outline-none transition shadow-inner font-mono"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>

        {/* Global Search Results Dropdown */}
        {showSearchDropdown && (searchQuery.trim().length > 0) && (
          <div className="absolute z-50 left-0 right-0 mt-2 bg-[#12161E] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto divide-y divide-gray-800">
            {/* Section 1: Your Trades */}
            <div className="p-2">
              <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Your Logged Trades ({matchingTrades.length})
              </div>
              {matchingTrades.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-gray-500 italic">No matching trades found</div>
              ) : (
                matchingTrades.map(trade => (
                  <button
                    key={trade.id}
                    onClick={() => {
                      onEditTrade(trade);
                      setShowSearchDropdown(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#191F2A] transition flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-white flex items-center gap-2">
                        <span>{trade.stockName}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans ${trade.direction === 'Long' ? 'bg-[#3ED9B8]/20 text-[#3ED9B8]' : 'bg-[#E28B5C]/20 text-[#E28B5C]'}`}>
                          {trade.direction}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{trade.strategy} • {trade.tradeDate}</div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-800/60 px-2 py-0.5 rounded">
                      Open Trade
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Section 2: Nifty 500 Stocks */}
            <div className="p-2">
              <div className="px-2 py-1 text-[10px] font-semibold text-[#3ED9B8] uppercase tracking-wider">
                Nifty 500 Stocks (Instant New Trade)
              </div>
              {matchingNiftyStocks.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-gray-500 italic">No Nifty stock match</div>
              ) : (
                matchingNiftyStocks.map(stock => (
                  <button
                    key={stock.symbol}
                    onClick={() => {
                      handleNewTradeClick({ symbol: stock.symbol, sector: stock.sector });
                      setShowSearchDropdown(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#191F2A] transition flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-[#3ED9B8]">{stock.symbol}</div>
                      <div className="text-[11px] text-gray-400">{stock.name}</div>
                    </div>
                    <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                      + New Trade
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-xl bg-[#12161E] border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition flex items-center gap-1.5 text-xs"
            title="Switch Theme"
          >
            <Sparkles className="w-4 h-4 text-[#3ED9B8]" />
            <span className="hidden lg:inline capitalize font-medium">{currentTheme.replace('-', ' ')}</span>
          </button>

          {showThemeMenu && (
            <div className="absolute z-50 right-0 mt-2 w-48 bg-[#12161E] border border-gray-800 rounded-2xl shadow-2xl p-1.5 space-y-1">
              {themesList.map(t => {
                const Icon = t.icon;
                const isSel = currentTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (onThemeChange) onThemeChange(t.id);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 transition ${
                      isSel ? 'bg-[#191F2A] text-[#3ED9B8] font-semibold' : 'text-gray-300 hover:bg-[#161B24]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Auth / Account Button */}
        <button
          onClick={handleAuthClick}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#12161E] border border-gray-800 text-gray-300 hover:text-white hover:border-[#3ED9B8]/50 transition flex items-center gap-2 text-xs"
        >
          <UserIcon className="w-4 h-4 text-[#3ED9B8]" />
          <span className="hidden sm:inline font-mono">
            {currentUser ? currentUser.email?.split('@')[0] : 'Sign In'}
          </span>
        </button>

        {/* New Trade Primary Button */}
        <button
          onClick={() => handleNewTradeClick()}
          className="px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-[#3ED9B8] hover:bg-[#34c4a5] text-black font-semibold text-xs flex items-center gap-1.5 transition shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Trade</span>
        </button>
      </div>
    </header>
  );
};
