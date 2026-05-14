import { create } from 'zustand';
import type { TripWithStatus, TripStatus, TripType, TripStats, NewTrip, UpdateTrip } from '../types';
import {
  getAllTrips,
  getTripById,
  getOverallStats,
  getTripStats,
  insertTrip,
  updateTrip,
  deleteTrip,
  type OverallStats,
} from '../db/queries/trip';

export type FilterType   = TripType | 'all';
export type FilterStatus = TripStatus | 'all';
export type SortOrder    = 'updated_at' | 'start_date' | 'satisfaction';

// ─── 필터 적용 (순수 함수) ────────────────────────────────────────────────────

function applyFilters(
  trips: TripWithStatus[],
  filterType: FilterType,
  filterStatus: FilterStatus,
  filterYear: number | null,
  searchQuery: string,
  sortOrder: SortOrder,
): TripWithStatus[] {
  let result = [...trips];

  if (filterType !== 'all') {
    result = result.filter(t => t.trip_type === filterType);
  }
  if (filterStatus !== 'all') {
    result = result.filter(t => t.status === filterStatus);
  }
  if (filterYear !== null) {
    result = result.filter(t => new Date(t.start_date).getFullYear() === filterYear);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.summary?.toLowerCase().includes(q) ?? false) ||
      (t.city?.toLowerCase().includes(q) ?? false) ||
      (t.country?.toLowerCase().includes(q) ?? false) ||
      t.companions.some(c => c.toLowerCase().includes(q)),
    );
  }

  result.sort((a, b) => {
    if (sortOrder === 'start_date')   return b.start_date.localeCompare(a.start_date);
    if (sortOrder === 'satisfaction') return (b.satisfaction ?? 0) - (a.satisfaction ?? 0);
    return b.updated_at.localeCompare(a.updated_at);
  });

  return result;
}

// ─── 스토어 타입 ──────────────────────────────────────────────────────────────

interface TripStore {
  trips:            TripWithStatus[];
  filteredTrips:    TripWithStatus[];
  currentTrip:      TripWithStatus | null;
  currentTripStats: TripStats | null;
  overallStats:     OverallStats | null;
  isLoading:        boolean;
  error:            string | null;

  filterType:   FilterType;
  filterStatus: FilterStatus;
  filterYear:   number | null;
  searchQuery:  string;
  sortOrder:    SortOrder;

  loadTrips:            () => Promise<void>;
  loadCurrentTrip:      (id: string) => Promise<void>;
  loadCurrentTripStats: () => Promise<void>;
  loadOverallStats:     () => Promise<void>;
  createTrip:           (data: NewTrip) => Promise<TripWithStatus>;
  updateCurrentTrip:    (data: UpdateTrip) => Promise<void>;
  removeTrip:           (id: string) => Promise<void>;
  clearCurrentTrip:     () => void;
  clearError:           () => void;

  setFilterType:   (type: FilterType) => void;
  setFilterStatus: (status: FilterStatus) => void;
  setFilterYear:   (year: number | null) => void;
  setSearchQuery:  (q: string) => void;
  setSortOrder:    (order: SortOrder) => void;
  resetFilters:    () => void;
}

// ─── 스토어 ───────────────────────────────────────────────────────────────────

export const useTripStore = create<TripStore>((set, get) => ({
  trips:            [],
  filteredTrips:    [],
  currentTrip:      null,
  currentTripStats: null,
  overallStats:     null,
  isLoading:        false,
  error:            null,

  filterType:   'all',
  filterStatus: 'all',
  filterYear:   null,
  searchQuery:  '',
  sortOrder:    'updated_at',

  // ─── 조회

  loadTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      const trips = await getAllTrips();
      const { filterType, filterStatus, filterYear, searchQuery, sortOrder } = get();
      set({
        trips,
        filteredTrips: applyFilters(trips, filterType, filterStatus, filterYear, searchQuery, sortOrder),
        isLoading: false,
      });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  loadCurrentTrip: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const trip = await getTripById(id);
      set({ currentTrip: trip, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  loadCurrentTripStats: async () => {
    const { currentTrip } = get();
    if (!currentTrip) return;
    try {
      const stats = await getTripStats(currentTrip.id);
      set({ currentTripStats: stats });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  loadOverallStats: async () => {
    try {
      const stats = await getOverallStats();
      set({ overallStats: stats });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  // ─── 변경

  createTrip: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const trip = await insertTrip(data);
      await get().loadTrips();
      const created = await getTripById(trip.id);
      set({ currentTrip: created, isLoading: false });
      return created!;
    } catch (e) {
      set({ error: String(e), isLoading: false });
      throw e;
    }
  },

  updateCurrentTrip: async (data) => {
    const { currentTrip } = get();
    if (!currentTrip) return;
    set({ isLoading: true, error: null });
    try {
      await updateTrip(currentTrip.id, data);
      const updated = await getTripById(currentTrip.id);
      set({ currentTrip: updated, isLoading: false });
      await get().loadTrips();
    } catch (e) {
      set({ error: String(e), isLoading: false });
      throw e;
    }
  },

  removeTrip: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteTrip(id);
      const { currentTrip } = get();
      if (currentTrip?.id === id) set({ currentTrip: null, currentTripStats: null });
      await get().loadTrips();
      set({ isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
      throw e;
    }
  },

  clearCurrentTrip: () => set({ currentTrip: null, currentTripStats: null }),
  clearError:       () => set({ error: null }),

  // ─── 필터

  setFilterType: (filterType) => {
    const s = get();
    const filtered = applyFilters(s.trips, filterType, s.filterStatus, s.filterYear, s.searchQuery, s.sortOrder);
    set({ filterType, filteredTrips: filtered });
  },

  setFilterStatus: (filterStatus) => {
    const s = get();
    const filtered = applyFilters(s.trips, s.filterType, filterStatus, s.filterYear, s.searchQuery, s.sortOrder);
    set({ filterStatus, filteredTrips: filtered });
  },

  setFilterYear: (filterYear) => {
    const s = get();
    const filtered = applyFilters(s.trips, s.filterType, s.filterStatus, filterYear, s.searchQuery, s.sortOrder);
    set({ filterYear, filteredTrips: filtered });
  },

  setSearchQuery: (searchQuery) => {
    const s = get();
    const filtered = applyFilters(s.trips, s.filterType, s.filterStatus, s.filterYear, searchQuery, s.sortOrder);
    set({ searchQuery, filteredTrips: filtered });
  },

  setSortOrder: (sortOrder) => {
    const s = get();
    const filtered = applyFilters(s.trips, s.filterType, s.filterStatus, s.filterYear, s.searchQuery, sortOrder);
    set({ sortOrder, filteredTrips: filtered });
  },

  resetFilters: () => {
    const { trips } = get();
    set({
      filterType:    'all',
      filterStatus:  'all',
      filterYear:    null,
      searchQuery:   '',
      sortOrder:     'updated_at',
      filteredTrips: applyFilters(trips, 'all', 'all', null, '', 'updated_at'),
    });
  },
}));
