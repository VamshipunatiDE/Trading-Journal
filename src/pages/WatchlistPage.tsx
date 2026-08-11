import React, { useState, useMemo } from 'react';
import { Plus, Bookmark, Search, Trash2, Edit2, Play, ExternalLink, CheckCircle } from 'lucide-react';
import { WatchlistItem, UserSettings, WatchlistPriority, WatchlistStatus } from '../types';
import { NIFTY_500_STOCKS, NSE_SECTORS } from '../data/nifty500';

import { DEFAULT_USER_SETTINGS } from '../data/sampleData';

interface WatchlistPageProps {
  watchlist?: WatchlistItem[];
  settings?: UserSettings;
  onSaveItem?: (item: WatchlistItem) => void;
  onDeleteItem?: (itemId: string) => void;
  onNewTradeFromWatchlist?: (presetStock: { symbol: string; sector: string; entryPrice?: number }) => void;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  watchlist = [],
  settings,
  onSaveItem,
  onDeleteItem,
  onNewTradeFromWatchlist
}) => {
  const safeSettings = settings || DEFAULT_USER_SETTINGS;
  const currency = safeSettings.currency || 'INR';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  // Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<WatchlistItem> | null>(null);

  const [stockSearch, setStockSearch] = useState('');
  const [showStockDropdown, setShowStockDropdown] = useState(false);

  const filteredItems = useMemo(() => {
    return watchlist.filter(item => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mSymbol = item.stockName.toLowerCase().includes(q);
        const mReason = item.reason.toLowerCase().includes(q);
        if (!mSymbol && !mReason) return false;
      }

      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && item.priority !== priorityFilter) return false;

      return true;
    });
  }, [watchlist, searchTerm, statusFilter, priorityFilter]);

  const filteredNiftyStocks = useMemo(() => {
    if (!stockSearch.trim()) return NIFTY_500_STOCKS.slice(0, 8);
    const q = stockSearch.toLowerCase();
    return NIFTY_500_STOCKS.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [stockSearch]);

  const handleOpenAddModal = () => {
    setEditingItem({
      id: `wl_${Date.now()}`,
      userId: settings.userId || 'guest',
      stockName: 'HDFCBANK',
      sector: 'Financial Services',
      entryZone: '1600 - 1620',
      target: 1720,
      stopLoss: 1570,
      reason: 'Support level retest with bullish divergence',
      priority: 'High',
      status: 'Watching',
      createdAt: Date.now()
    });
    setStockSearch('HDFCBANK');
    setShowModal(true);
  };

  const handleOpenEditModal = (item: WatchlistItem) => {
    setEditingItem(item);
    setStockSearch(item.stockName);
    setShowModal(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.stockName) return;

    const finalItem: WatchlistItem = {
      id: editingItem.id || `wl_${Date.now()}`,
      userId: settings.userId || 'guest',
      stockName: editingItem.stockName,
      sector: editingItem.sector || 'Other',
      entryZone: editingItem.entryZone || '',
      target: Number(editingItem.target) || 0,
      stopLoss: Number(editingItem.stopLoss) || 0,
      reason: editingItem.reason || '',
      priority: (editingItem.priority as WatchlistPriority) || 'High',
      status: (editingItem.status as WatchlistStatus) || 'Watching',
      createdAt: editingItem.createdAt || Date.now()
    };

    onSaveItem(finalItem);
    setShowModal(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#12161E] border border-gray-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">
            Watchlist & Setup Monitor
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Track potential setups, breakout zones, & convert directly to logged trades
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#3ED9B8] hover:bg-[#34c4a5] text-black font-semibold text-xs flex items-center gap-2 transition shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Add Watchlist Item
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#12161E] border border-gray-800/90 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search stock or thesis reason..."
            className="w-full bg-[#161B24] border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:border-[#3ED9B8] focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:border-[#3ED9B8] focus:outline-none"
          >
            <option value="All">Status: All</option>
            <option value="Watching">Watching</option>
            <option value="Triggered">Triggered</option>
            <option value="Invalid">Invalid</option>
          </select>
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:border-[#3ED9B8] focus:outline-none"
          >
            <option value="All">Priority: All</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Watchlist Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#12161E] border border-gray-800 p-12 text-center rounded-2xl text-xs text-gray-500">
          No watchlist items found. Click "Add Watchlist Item" to monitor key trading levels.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-[#12161E] border border-gray-800/90 hover:border-gray-700/80 p-5 rounded-2xl transition shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-base text-white">{item.stockName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {item.priority}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    item.status === 'Triggered' ? 'bg-[#3ED9B8]/20 text-[#3ED9B8]' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <p className="text-[11px] text-gray-400 font-medium mb-3">{item.sector}</p>

                <div className="bg-[#161B24] p-3 rounded-xl border border-gray-800 grid grid-cols-3 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-gray-500 block">Entry Zone</span>
                    <span className="font-mono font-bold text-gray-200">{item.entryZone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Target</span>
                    <span className="font-mono font-bold text-[#3ED9B8]">{item.target || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Stop Loss</span>
                    <span className="font-mono font-bold text-[#E28B5C]">{item.stopLoss || '-'}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-300 italic bg-[#191F2A] p-2.5 rounded-xl border border-gray-800/60">
                  "{item.reason}"
                </p>
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
                <button
                  onClick={() => onNewTradeFromWatchlist({ symbol: item.stockName, sector: item.sector })}
                  className="px-3 py-1.5 rounded-xl bg-[#3ED9B8]/15 hover:bg-[#3ED9B8]/25 text-[#3ED9B8] font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  Log Trade
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#12161E] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="font-display font-semibold text-lg text-white mb-4">
              {editingItem.id ? 'Edit Watchlist Item' : 'Add Stock to Watchlist'}
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div className="relative">
                <label className="block text-gray-400 mb-1">Stock Symbol</label>
                <input
                  type="text"
                  value={stockSearch}
                  onChange={e => {
                    setStockSearch(e.target.value);
                    setEditingItem({ ...editingItem, stockName: e.target.value });
                    setShowStockDropdown(true);
                  }}
                  onFocus={() => setShowStockDropdown(true)}
                  placeholder="Search Nifty 500 symbol..."
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:border-[#3ED9B8] focus:outline-none"
                  required
                />

                {showStockDropdown && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-[#191F2A] border border-gray-800 rounded-xl max-h-40 overflow-y-auto divide-y divide-gray-800">
                    {filteredNiftyStocks.map(stock => (
                      <button
                        key={stock.symbol}
                        type="button"
                        onClick={() => {
                          setStockSearch(stock.symbol);
                          setEditingItem({ ...editingItem, stockName: stock.symbol, sector: stock.sector });
                          setShowStockDropdown(false);
                        }}
                        className="w-full text-left p-2 hover:bg-[#222a38] text-xs flex items-center justify-between"
                      >
                        <span className="font-mono font-bold text-[#3ED9B8]">{stock.symbol}</span>
                        <span className="text-[10px] text-gray-400">{stock.sector}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Sector</label>
                <select
                  value={editingItem.sector}
                  onChange={e => setEditingItem({ ...editingItem, sector: e.target.value })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-[#3ED9B8] focus:outline-none"
                >
                  {NSE_SECTORS.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Entry Zone</label>
                  <input
                    type="text"
                    value={editingItem.entryZone || ''}
                    onChange={e => setEditingItem({ ...editingItem, entryZone: e.target.value })}
                    placeholder="e.g. 1600-1620"
                    className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Target</label>
                  <input
                    type="number"
                    value={editingItem.target || ''}
                    onChange={e => setEditingItem({ ...editingItem, target: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Stop Loss</label>
                  <input
                    type="number"
                    value={editingItem.stopLoss || ''}
                    onChange={e => setEditingItem({ ...editingItem, stopLoss: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Priority</label>
                  <select
                    value={editingItem.priority}
                    onChange={e => setEditingItem({ ...editingItem, priority: e.target.value as any })}
                    className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-semibold"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Status</label>
                  <select
                    value={editingItem.status}
                    onChange={e => setEditingItem({ ...editingItem, status: e.target.value as any })}
                    className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-semibold"
                  >
                    <option value="Watching">Watching</option>
                    <option value="Triggered">Triggered</option>
                    <option value="Invalid">Invalid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Rationale / Thesis</label>
                <textarea
                  rows={3}
                  value={editingItem.reason || ''}
                  onChange={e => setEditingItem({ ...editingItem, reason: e.target.value })}
                  placeholder="Record why this stock is on your radar..."
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl p-3 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3ED9B8] text-black font-semibold rounded-xl"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
