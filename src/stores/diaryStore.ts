import { create } from 'zustand';
import type { DiaryEntry, NewDiaryEntry } from '../types';
import {
  getDiaryEntriesByTripId,
  getDiaryEntryByDate,
  upsertDiaryEntry,
  deleteDiaryEntry,
} from '../db/queries/diary';

interface DiaryStore {
  entries:       DiaryEntry[];
  currentTripId: string | null;
  isLoading:     boolean;
  error:         string | null;

  loadEntries:  (tripId: string) => Promise<void>;
  saveEntry:    (data: NewDiaryEntry) => Promise<DiaryEntry>;
  removeEntry:  (id: string) => Promise<void>;
  // trip-level 종합 기록 (entry_date = null)
  getTripLevelEntry: () => DiaryEntry | undefined;
  clearEntries:  () => void;
  clearError:    () => void;
}

export const useDiaryStore = create<DiaryStore>((set, get) => ({
  entries:       [],
  currentTripId: null,
  isLoading:     false,
  error:         null,

  loadEntries: async (tripId) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await getDiaryEntriesByTripId(tripId);
      set({ entries, currentTripId: tripId, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  saveEntry: async (data) => {
    try {
      const entry = await upsertDiaryEntry(data);
      set(s => {
        const exists = s.entries.some(e => e.id === entry.id);
        return {
          entries: exists
            ? s.entries.map(e => e.id === entry.id ? entry : e)
            : [...s.entries, entry],
        };
      });
      return entry;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  removeEntry: async (id) => {
    try {
      await deleteDiaryEntry(id);
      set(s => ({ entries: s.entries.filter(e => e.id !== id) }));
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  getTripLevelEntry: () => {
    return get().entries.find(e => e.entry_date === null);
  },

  clearEntries: () => set({ entries: [], currentTripId: null }),
  clearError:   () => set({ error: null }),
}));
