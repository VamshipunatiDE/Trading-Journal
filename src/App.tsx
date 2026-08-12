import React, { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Trade, UserSettings, WatchlistItem, JournalNote } from './types';
import { DEFAULT_USER_SETTINGS, SAMPLE_TRADES, SAMPLE_WATCHLIST, SAMPLE_NOTES } from './data/sampleData';
import {
  getTrades,
  saveTrade,
  deleteTrade,
  getWatchlist,
  saveWatchlistItem,
  deleteWatchlistItem,
  getNotes,
  saveNote,
  deleteNote,
  getSettings,
  saveSettings
} from './lib/db';

// Layout Components
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';

// Modal Components
import { TradeFormModal } from './components/TradeFormModal';
import { AuthModal } from './components/AuthModal';
import { AvatarCropModal } from './components/AvatarCropModal';
import { AvatarLightboxModal } from './components/AvatarLightboxModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { TradesPage } from './pages/TradesPage';
import { CalendarPage } from './pages/CalendarPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RiskPage } from './pages/RiskPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { NotesPage } from './pages/NotesPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  // Navigation Page State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trades' | 'calendar' | 'analytics' | 'risk' | 'watchlist' | 'notes' | 'settings'>('dashboard');

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // App Main State
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals State
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // Avatar Crop & Lightbox State
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Mobile Sidebar State
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Listen to Auth State
  useEffect(() => {
    if (!auth) return;
    try {
      const unsubscribe = onAuthStateChanged(auth, user => {
        setCurrentUser(user);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('Auth listener initialization notice:', err);
    }
  }, []);

  // Fetch / Sync Data
  const loadAppData = useCallback(async () => {
    setIsLoading(true);
    const uid = currentUser?.uid || 'guest';

    try {
      const fetchedSettings = await getSettings(uid);
      const fetchedTrades = await getTrades(uid);
      const fetchedWatchlist = await getWatchlist(uid);
      const fetchedNotes = await getNotes(uid);

      setSettings(fetchedSettings);
      setTrades(fetchedTrades);
      setWatchlist(fetchedWatchlist);
      setNotes(fetchedNotes);
    } catch (err) {
      console.error('Failed to load DB data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  // Apply Theme Class to Root HTML element
  useEffect(() => {
    const themeClass = `theme-${settings.theme || 'terminal-dark'}`;
    document.documentElement.className = themeClass;
  }, [settings.theme]);

  // Trade Handlers
  const handleOpenNewTrade = () => {
    setEditingTrade(null);
    setIsTradeModalOpen(true);
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setIsTradeModalOpen(true);
  };

  const handleCloneTrade = (trade: Trade) => {
    const cloned: Trade = {
      ...trade,
      id: `trd_${Date.now()}`,
      tradeDate: new Date().toISOString().split('T')[0],
      createdAt: Date.now()
    };
    setEditingTrade(cloned);
    setIsTradeModalOpen(true);
  };

  const handleSaveTrade = async (tradeToSave: Trade) => {
    const updated = await saveTrade(tradeToSave);
    setTrades(prev => {
      const idx = prev.findIndex(t => t.id === updated.id);
      if (idx >= 0) {
        const arr = [...prev];
        arr[idx] = updated;
        return arr;
      }
      return [updated, ...prev];
    });
    setIsTradeModalOpen(false);
  };

  const handleDeleteTrade = async (tradeId: string) => {
    if (!window.confirm('Are you sure you want to delete this trade execution?')) return;
    const uid = currentUser?.uid || 'guest';
    await deleteTrade(tradeId, uid);
    setTrades(prev => prev.filter(t => t.id !== tradeId));
  };

  // Watchlist Handlers
  const handleSaveWatchlist = async (item: WatchlistItem) => {
    const updated = await saveWatchlistItem(item);
    setWatchlist(prev => {
      const idx = prev.findIndex(w => w.id === updated.id);
      if (idx >= 0) {
        const arr = [...prev];
        arr[idx] = updated;
        return arr;
      }
      return [updated, ...prev];
    });
  };

  const handleDeleteWatchlist = async (itemId: string) => {
    if (!window.confirm('Remove stock setup from watchlist?')) return;
    const uid = currentUser?.uid || 'guest';
    await deleteWatchlistItem(itemId, uid);
    setWatchlist(prev => prev.filter(w => w.id !== itemId));
  };

  const handleNewTradeFromWatchlist = (preset: { symbol: string; sector: string; entryPrice?: number }) => {
    const newTradePreset: Trade = {
      id: `trd_${Date.now()}`,
      userId: currentUser?.uid || 'guest',
      tradeDate: new Date().toISOString().split('T')[0],
      stockName: preset.symbol,
      sector: preset.sector,
      exchange: 'NSE',
      direction: 'Long',
      segment: 'Equity',
      tradeType: 'Intraday',
      incomeCategory: 'Daily',
      strategy: 'Breakout',
      entryPrice: preset.entryPrice || 100,
      quantity: 10,
      capitalUsed: (preset.entryPrice || 100) * 10,
      leverage: 1,
      stopLoss: (preset.entryPrice || 100) * 0.95,
      target: (preset.entryPrice || 100) * 1.05,
      status: 'Open',
      notes: `Entered trade from watchlist setup: ${preset.symbol}`,
      charges: settings.defaultCharges,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setEditingTrade(newTradePreset);
    setIsTradeModalOpen(true);
  };

  // Notes Handlers
  const handleSaveNote = async (note: JournalNote) => {
    const updated = await saveNote(note);
    setNotes(prev => {
      const idx = prev.findIndex(n => n.id === updated.id);
      if (idx >= 0) {
        const arr = [...prev];
        arr[idx] = updated;
        return arr;
      }
      return [updated, ...prev];
    });
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Delete this journal note?')) return;
    const uid = currentUser?.uid || 'guest';
    await deleteNote(noteId, uid);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  // Settings Handlers
  const handleSaveSettings = async (newSettings: UserSettings) => {
    const updated = await saveSettings(newSettings);
    setSettings(updated);
  };

  // Avatar Crop Save Handler
  const handleCroppedAvatarSave = async (croppedBase64: string) => {
    const newSettings = { ...settings, photoUrl: croppedBase64 };
    await handleSaveSettings(newSettings);
    setCropImageSrc(null);
  };

  // Auth Signout
  const handleSignOut = async () => {
    await signOut(auth);
    loadAppData();
  };

  return (
    <div className="min-h-screen bg-[#0B0E13] text-gray-100 flex flex-col md:flex-row font-sans selection:bg-[#3ED9B8]/30 selection:text-[#3ED9B8]">
      {/* Navigation Sidebar */}
      <Sidebar
        currentPage={activeTab}
        onSelectPage={(page) => setActiveTab(page as any)}
        settings={settings}
        trades={trades}
        onAvatarClick={() => setIsLightboxOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar
          settings={settings}
          trades={trades}
          currentUser={currentUser}
          onThemeChange={(newTheme) => handleSaveSettings({ ...settings, theme: newTheme })}
          onNewTrade={handleOpenNewTrade}
          onEditTrade={handleEditTrade}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)}
        />

        {/* Dynamic Main Body Content */}
        <main className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3ED9B8]"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardPage
                  trades={trades}
                  settings={settings}
                  onOpenNewTrade={handleOpenNewTrade}
                  onEditTrade={handleEditTrade}
                  onDeleteTrade={handleDeleteTrade}
                />
              )}

              {activeTab === 'trades' && (
                <TradesPage
                  trades={trades}
                  settings={settings}
                  onNewTrade={handleOpenNewTrade}
                  onEditTrade={handleEditTrade}
                  onDeleteTrade={handleDeleteTrade}
                  onCloneTrade={handleCloneTrade}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarPage
                  trades={trades}
                  settings={settings}
                  onEditTrade={handleEditTrade}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsPage
                  trades={trades}
                  settings={settings}
                />
              )}

              {activeTab === 'risk' && (
                <RiskPage
                  settings={settings}
                  trades={trades}
                />
              )}

              {activeTab === 'watchlist' && (
                <WatchlistPage
                  watchlist={watchlist}
                  settings={settings}
                  onSaveItem={handleSaveWatchlist}
                  onDeleteItem={handleDeleteWatchlist}
                  onNewTradeFromWatchlist={handleNewTradeFromWatchlist}
                />
              )}

              {activeTab === 'notes' && (
                <NotesPage
                  notes={notes}
                  trades={trades}
                  settings={settings}
                  onSaveNote={handleSaveNote}
                  onDeleteNote={handleDeleteNote}
                  onEditTrade={handleEditTrade}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsPage
                  settings={settings}
                  trades={trades}
                  watchlist={watchlist}
                  notes={notes}
                  onSaveSettings={handleSaveSettings}
                  onOpenAvatarCrop={src => setCropImageSrc(src)}
                  onOpenAvatarLightbox={() => setIsLightboxOpen(true)}
                  onRefreshData={loadAppData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      {isTradeModalOpen && (
        <TradeFormModal
          isOpen={isTradeModalOpen}
          trade={editingTrade}
          settings={settings}
          onClose={() => setIsTradeModalOpen(false)}
          onSave={handleSaveTrade}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={() => {
            setIsAuthModalOpen(false);
            loadAppData();
          }}
        />
      )}

      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onCropComplete={handleCroppedAvatarSave}
        />
      )}

      {isLightboxOpen && (
        <AvatarLightboxModal
          isOpen={isLightboxOpen}
          photoUrl={settings.photoUrl}
          name={settings.name}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </div>
  );
}
