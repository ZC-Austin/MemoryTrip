import { create } from 'zustand';
import type { EquipmentRecord, NewEquipmentRecord } from '../types';
import { getEquipmentRecord, upsertEquipmentRecord } from '../db/queries/equipment';

interface EquipmentStore {
  record:        EquipmentRecord | null;
  currentTripId: string | null;
  isLoading:     boolean;
  error:         string | null;

  loadRecord:   (tripId: string) => Promise<void>;
  saveRecord:   (data: NewEquipmentRecord) => Promise<EquipmentRecord>;
  clearRecord:  () => void;
  clearError:   () => void;
}

export const useEquipmentStore = create<EquipmentStore>((set) => ({
  record:        null,
  currentTripId: null,
  isLoading:     false,
  error:         null,

  loadRecord: async (tripId) => {
    set({ isLoading: true, error: null });
    try {
      const record = await getEquipmentRecord(tripId);
      set({ record, currentTripId: tripId, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  saveRecord: async (data) => {
    try {
      const record = await upsertEquipmentRecord(data);
      set({ record });
      return record;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  clearRecord: () => set({ record: null, currentTripId: null }),
  clearError:  () => set({ error: null }),
}));
