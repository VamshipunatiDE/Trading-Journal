import React, { useState, useMemo } from 'react';
import { Plus, FileText, Search, Trash2, Edit2, Calendar, Sparkles } from 'lucide-react';
import { JournalNote, NoteType, Trade, UserSettings, MergedNoteItem } from '../types';
import { fmtCurrency } from '../lib/calculations';

import { DEFAULT_USER_SETTINGS } from '../data/sampleData';

interface NotesPageProps {
  notes?: JournalNote[];
  trades?: Trade[];
  settings?: UserSettings;
  onSaveNote?: (note: JournalNote) => void;
  onDeleteNote?: (noteId: string) => void;
  onEditTrade?: (trade: Trade) => void;
}

export const NotesPage: React.FC<NotesPageProps> = ({
  notes = [],
  trades = [],
  settings,
  onSaveNote,
  onDeleteNote,
  onEditTrade
}) => {
  const safeSettings = settings || DEFAULT_USER_SETTINGS;
  const currency = safeSettings.currency || 'INR';

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<JournalNote> | null>(null);

  // Merge Manual Notes + Trade Rationale Notes into unified stream
  const mergedItems = useMemo<MergedNoteItem[]>(() => {
    const list: MergedNoteItem[] = [];

    // 1. Manual Notes
    notes.forEach(n => {
      list.push({
        id: n.id,
        source: 'manual',
        title: n.title || 'Untitled Journal Note',
        body: n.body,
        type: n.type,
        date: n.date,
        createdAt: n.createdAt
      });
    });

    // 2. Trade Notes
    trades.forEach(t => {
      if (t.notes && t.notes.trim()) {
        const grossPnl = t.status === 'Closed' ? (t.exitPrice! - t.entryPrice) * t.quantity * (t.direction === 'Long' ? 1 : -1) : 0;
        const totalChg = (t.charges?.brokerage || 0) + (t.charges?.stt || 0);
        const netPnl = grossPnl - totalChg;

        list.push({
          id: `trade_note_${t.id}`,
          source: 'trade',
          title: `Trade Note: ${t.stockName} (${t.direction} ${t.strategy})`,
          body: t.notes,
          type: 'Trade Note',
          date: t.tradeDate,
          stockName: t.stockName,
          pnl: netPnl,
          status: t.status,
          tradeId: t.id,
          createdAt: t.createdAt
        });
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes, trades]);

  const filteredItems = useMemo(() => {
    return mergedItems.filter(item => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mTitle = item.title.toLowerCase().includes(q);
        const mBody = item.body.toLowerCase().includes(q);
        if (!mTitle && !mBody) return false;
      }

      if (typeFilter !== 'All' && item.type !== typeFilter) return false;

      return true;
    });
  }, [mergedItems, searchTerm, typeFilter]);

  const handleOpenAddModal = () => {
    setEditingNote({
      id: `note_${Date.now()}`,
      userId: settings.userId || 'guest',
      title: 'Weekly Performance Review',
      body: '',
      type: 'Weekly Review',
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (note: JournalNote) => {
    setEditingNote(note);
    setShowModal(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editingNote.body) return;

    const finalNote: JournalNote = {
      id: editingNote.id || `note_${Date.now()}`,
      userId: settings.userId || 'guest',
      title: editingNote.title || 'Journal Entry',
      body: editingNote.body,
      type: (editingNote.type as NoteType) || 'Daily Note',
      date: editingNote.date || new Date().toISOString().split('T')[0],
      createdAt: editingNote.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    onSaveNote(finalNote);
    setShowModal(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#12161E] border border-gray-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">
            Trading Journal & Lessons
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Unified repository merging manual reviews with live trade execution rationale
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#3ED9B8] hover:bg-[#34c4a5] text-black font-semibold text-xs flex items-center gap-2 transition shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Create Note
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#12161E] border border-gray-800/90 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search notes body, title, lessons..."
            className="w-full bg-[#161B24] border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:border-[#3ED9B8] focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:border-[#3ED9B8] focus:outline-none"
          >
            <option value="All">Type: All</option>
            <option value="Daily Note">Daily Note</option>
            <option value="Weekly Review">Weekly Review</option>
            <option value="Monthly Review">Monthly Review</option>
            <option value="Lesson Learned">Lesson Learned</option>
            <option value="Mistake">Mistake</option>
            <option value="Idea">Idea</option>
            <option value="Trade Note">Trade Note (Auto Synced)</option>
          </select>
        </div>
      </div>

      {/* Notes Masonry/Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#12161E] border border-gray-800 p-12 text-center rounded-2xl text-xs text-gray-500">
          No notes found. Click "Create Note" to document trading observations or lessons.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`bg-[#12161E] border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition space-y-4 ${
                item.source === 'trade'
                  ? 'border-[#3ED9B8]/30 hover:border-[#3ED9B8]'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    item.source === 'trade'
                      ? 'bg-[#3ED9B8]/20 text-[#3ED9B8]'
                      : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {item.type}
                  </span>

                  <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    {item.date}
                  </span>
                </div>

                <h3 className="font-display font-semibold text-sm text-white mb-2">
                  {item.title}
                </h3>

                {item.source === 'trade' && item.pnl !== undefined && (
                  <div className="mb-2 text-xs font-mono">
                    Net P&L:{' '}
                    <span className={item.pnl >= 0 ? 'text-[#3ED9B8] font-bold' : 'text-[#E28B5C] font-bold'}>
                      {fmtCurrency(item.pnl, currency)}
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {item.body}
                </p>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
                {item.source === 'manual' ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => handleOpenEditModal(notes.find(n => n.id === item.id)!)}
                      className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteNote(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const trd = trades.find(t => t.id === item.tradeId);
                      if (trd) onEditTrade(trd);
                    }}
                    className="text-xs text-[#3ED9B8] hover:underline"
                  >
                    View Associated Trade →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Note Modal */}
      {showModal && editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#12161E] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="font-display font-semibold text-lg text-white mb-4">
              {editingNote.id ? 'Edit Journal Note' : 'Create Journal Note'}
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={editingNote.title || ''}
                  onChange={e => setEditingNote({ ...editingNote, title: e.target.value })}
                  placeholder="e.g. Weekly Review - August Week 2"
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Category / Type</label>
                  <select
                    value={editingNote.type || 'Daily Note'}
                    onChange={e => setEditingNote({ ...editingNote, type: e.target.value as NoteType })}
                    className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-semibold"
                  >
                    <option value="Daily Note">Daily Note</option>
                    <option value="Weekly Review">Weekly Review</option>
                    <option value="Monthly Review">Monthly Review</option>
                    <option value="Lesson Learned">Lesson Learned</option>
                    <option value="Mistake">Mistake</option>
                    <option value="Idea">Idea</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={editingNote.date || new Date().toISOString().split('T')[0]}
                    onChange={e => setEditingNote({ ...editingNote, date: e.target.value })}
                    className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Note Content</label>
                <textarea
                  rows={5}
                  value={editingNote.body || ''}
                  onChange={e => setEditingNote({ ...editingNote, body: e.target.value })}
                  placeholder="Record your observations, key takeaways, mindset reflections..."
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl p-3 text-white text-sm"
                  required
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
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
