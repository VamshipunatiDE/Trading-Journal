import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Trade, WatchlistItem, JournalNote, UserSettings } from '../types';
import { DEFAULT_USER_SETTINGS, SAMPLE_TRADES, SAMPLE_WATCHLIST, SAMPLE_NOTES } from '../data/sampleData';

const LOCAL_STORAGE_PREFIX = 'trading_journal_v2_';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('localStorage read error', e);
    return fallback;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.error('localStorage write error', e);
  }
}

// ================= USER SETTINGS =================

export async function fetchUserSettings(userId: string): Promise<UserSettings> {
  const localKey = `settings_${userId}`;
  const cached = getLocal<UserSettings | null>(localKey, null);

  if (db && userId && userId !== 'guest') {
    try {
      const docRef = doc(db, 'settings', userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as UserSettings;
        setLocal(localKey, data);
        return data;
      }
    } catch (err) {
      console.warn('Firestore fetch settings failed, using cache/default:', err);
    }
  }

  if (cached) return cached;
  const defaultUser = { ...DEFAULT_USER_SETTINGS, userId };
  setLocal(localKey, defaultUser);
  return defaultUser;
}

export async function saveUserSettings(settings: UserSettings): Promise<UserSettings> {
  const localKey = `settings_${settings.userId}`;
  const updated = { ...settings, updatedAt: Date.now() };
  setLocal(localKey, updated);

  if (db && settings.userId && settings.userId !== 'guest') {
    try {
      const docRef = doc(db, 'settings', settings.userId);
      await setDoc(docRef, updated, { merge: true });
    } catch (err) {
      console.warn('Firestore save settings failed:', err);
    }
  }
  return updated;
}

// ================= TRADES =================

export async function fetchTrades(userId: string): Promise<Trade[]> {
  const localKey = `trades_${userId}`;
  const cached = getLocal<Trade[]>(localKey, []);

  if (db && userId && userId !== 'guest') {
    try {
      const q = query(collection(db, 'trades'), where('userId', '==', userId));
      const querySnap = await getDocs(q);
      const fetched: Trade[] = [];
      querySnap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as Trade);
      });
      setLocal(localKey, fetched);
      return fetched;
    } catch (err) {
      console.warn('Firestore fetch trades failed, using local cache:', err);
    }
  }

  return cached;
}

export async function saveTrade(trade: Trade): Promise<Trade> {
  const localKey = `trades_${trade.userId}`;
  const trades = getLocal<Trade[]>(localKey, []);
  const index = trades.findIndex(t => t.id === trade.id);
  const updated = { ...trade, updatedAt: Date.now() };

  if (index >= 0) {
    trades[index] = updated;
  } else {
    trades.push(updated);
  }
  setLocal(localKey, trades);

  if (db && trade.userId && trade.userId !== 'guest') {
    try {
      const docRef = doc(db, 'trades', trade.id);
      await setDoc(docRef, updated, { merge: true });
    } catch (err) {
      console.warn('Firestore save trade failed:', err);
    }
  }
  return updated;
}

export async function deleteTrade(tradeId: string, userId: string): Promise<void> {
  const localKey = `trades_${userId}`;
  const trades = getLocal<Trade[]>(localKey, []);
  const filtered = trades.filter(t => t.id !== tradeId);
  setLocal(localKey, filtered);

  if (db && userId && userId !== 'guest') {
    try {
      await deleteDoc(doc(db, 'trades', tradeId));
    } catch (err) {
      console.warn('Firestore delete trade failed:', err);
    }
  }
}

// ================= WATCHLIST =================

export async function fetchWatchlist(userId: string): Promise<WatchlistItem[]> {
  const localKey = `watchlist_${userId}`;
  const cached = getLocal<WatchlistItem[]>(localKey, []);

  if (db && userId && userId !== 'guest') {
    try {
      const q = query(collection(db, 'watchlist'), where('userId', '==', userId));
      const querySnap = await getDocs(q);
      const fetched: WatchlistItem[] = [];
      querySnap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as WatchlistItem);
      });
      setLocal(localKey, fetched);
      return fetched;
    } catch (err) {
      console.warn('Firestore fetch watchlist failed, using cache:', err);
    }
  }

  return cached;
}

export async function saveWatchlistItem(item: WatchlistItem): Promise<WatchlistItem> {
  const localKey = `watchlist_${item.userId}`;
  const list = getLocal<WatchlistItem[]>(localKey, []);
  const index = list.findIndex(w => w.id === item.id);

  if (index >= 0) {
    list[index] = item;
  } else {
    list.push(item);
  }
  setLocal(localKey, list);

  if (db && item.userId && item.userId !== 'guest') {
    try {
      await setDoc(doc(db, 'watchlist', item.id), item, { merge: true });
    } catch (err) {
      console.warn('Firestore save watchlist failed:', err);
    }
  }
  return item;
}

export async function deleteWatchlistItem(itemId: string, userId: string): Promise<void> {
  const localKey = `watchlist_${userId}`;
  const list = getLocal<WatchlistItem[]>(localKey, []);
  const filtered = list.filter(w => w.id !== itemId);
  setLocal(localKey, filtered);

  if (db && userId && userId !== 'guest') {
    try {
      await deleteDoc(doc(db, 'watchlist', itemId));
    } catch (err) {
      console.warn('Firestore delete watchlist item failed:', err);
    }
  }
}

// ================= NOTES =================

export async function fetchNotes(userId: string): Promise<JournalNote[]> {
  const localKey = `notes_${userId}`;
  const cached = getLocal<JournalNote[]>(localKey, []);

  if (db && userId && userId !== 'guest') {
    try {
      const q = query(collection(db, 'notes'), where('userId', '==', userId));
      const querySnap = await getDocs(q);
      const fetched: JournalNote[] = [];
      querySnap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as JournalNote);
      });
      setLocal(localKey, fetched);
      return fetched;
    } catch (err) {
      console.warn('Firestore fetch notes failed, using cache:', err);
    }
  }

  return cached;
}

export async function saveNote(note: JournalNote): Promise<JournalNote> {
  const localKey = `notes_${note.userId}`;
  const notes = getLocal<JournalNote[]>(localKey, []);
  const index = notes.findIndex(n => n.id === note.id);
  const updated = { ...note, updatedAt: Date.now() };

  if (index >= 0) {
    notes[index] = updated;
  } else {
    notes.push(updated);
  }
  setLocal(localKey, notes);

  if (db && note.userId && note.userId !== 'guest') {
    try {
      await setDoc(doc(db, 'notes', note.id), updated, { merge: true });
    } catch (err) {
      console.warn('Firestore save note failed:', err);
    }
  }
  return updated;
}

export async function deleteNote(noteId: string, userId: string): Promise<void> {
  const localKey = `notes_${userId}`;
  const notes = getLocal<JournalNote[]>(localKey, []);
  const filtered = notes.filter(n => n.id !== noteId);
  setLocal(localKey, filtered);

  if (db && userId && userId !== 'guest') {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
    } catch (err) {
      console.warn('Firestore delete note failed:', err);
    }
  }
}

// Aliases for compatibility
export const getSettings = fetchUserSettings;
export const saveSettings = saveUserSettings;

export async function getTrades(userId: string): Promise<Trade[]> {
  const trades = await fetchTrades(userId);
  if (trades.length === 0) {
    const seeded = await seedSampleData(userId);
    return seeded.trades;
  }
  return trades;
}

export async function getWatchlist(userId: string): Promise<WatchlistItem[]> {
  const list = await fetchWatchlist(userId);
  if (list.length === 0) {
    const seeded = await seedSampleData(userId);
    return seeded.watchlist;
  }
  return list;
}

export async function getNotes(userId: string): Promise<JournalNote[]> {
  const notes = await fetchNotes(userId);
  if (notes.length === 0) {
    const seeded = await seedSampleData(userId);
    return seeded.notes;
  }
  return notes;
}


export async function seedSampleData(userId: string): Promise<{ trades: Trade[]; watchlist: WatchlistItem[]; notes: JournalNote[] }> {
  const trades: Trade[] = SAMPLE_TRADES.map(t => ({ ...t, userId }));
  const watchlist: WatchlistItem[] = SAMPLE_WATCHLIST.map(w => ({ ...w, userId }));
  const notes: JournalNote[] = SAMPLE_NOTES.map(n => ({ ...n, userId }));

  for (const t of trades) {
    await saveTrade(t);
  }
  for (const w of watchlist) {
    await saveWatchlistItem(w);
  }
  for (const n of notes) {
    await saveNote(n);
  }

  return { trades, watchlist, notes };
}

// ================= BACKUP & RESTORE =================

export interface BackupData {
  version: string;
  exportDate: string;
  settings: UserSettings;
  trades: Trade[];
  watchlist: WatchlistItem[];
  notes: JournalNote[];
}

export async function exportBackup(userId: string): Promise<BackupData> {
  const settings = await fetchUserSettings(userId);
  const trades = await fetchTrades(userId);
  const watchlist = await fetchWatchlist(userId);
  const notes = await fetchNotes(userId);

  return {
    version: '2.0',
    exportDate: new Date().toISOString(),
    settings,
    trades,
    watchlist,
    notes
  };
}

export async function restoreBackup(userId: string, data: BackupData): Promise<void> {
  if (!data || !data.trades) throw new Error('Invalid backup file format');

  if (data.settings) {
    await saveUserSettings({ ...data.settings, userId });
  }

  // Restore trades
  for (const t of data.trades) {
    await saveTrade({ ...t, userId });
  }

  // Restore watchlist
  for (const w of data.watchlist || []) {
    await saveWatchlistItem({ ...w, userId });
  }

  // Restore notes
  for (const n of data.notes || []) {
    await saveNote({ ...n, userId });
  }
}
