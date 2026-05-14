import { create } from 'zustand';
import type {
  Place, PlaceWithDetails, UpdatePlace,
  NewPlace, NewLodgingDetails, NewRestaurantDetails, NewCampsiteDetails,
} from '../types';
import {
  getPlacesByTripId,
  insertPlaceWithDetails,
  updatePlace,
  updateLodgingDetails,
  updateRestaurantDetails,
  updateCampsiteDetails,
  deletePlace,
} from '../db/queries/place';

type InsertPlaceTyped =
  | { type: 'lodging';    details?: NewLodgingDetails }
  | { type: 'restaurant'; details?: NewRestaurantDetails }
  | { type: 'campsite';   details?: NewCampsiteDetails };

interface PlaceStore {
  places:        PlaceWithDetails[];
  currentTripId: string | null;
  isLoading:     boolean;
  error:         string | null;

  loadPlaces:               (tripId: string) => Promise<void>;
  addPlace:                 (base: Omit<NewPlace, 'type'>, typed: InsertPlaceTyped) => Promise<Place>;
  updatePlace:              (id: string, data: UpdatePlace) => Promise<void>;
  updateLodgingDetails:     (placeId: string, data: Partial<NewLodgingDetails>) => Promise<void>;
  updateRestaurantDetails:  (placeId: string, data: Partial<NewRestaurantDetails>) => Promise<void>;
  updateCampsiteDetails:    (placeId: string, data: Partial<NewCampsiteDetails>) => Promise<void>;
  removePlace:              (id: string) => Promise<void>;
  clearPlaces:              () => void;
  clearError:               () => void;
}

export const usePlaceStore = create<PlaceStore>((set, get) => ({
  places:        [],
  currentTripId: null,
  isLoading:     false,
  error:         null,

  loadPlaces: async (tripId) => {
    set({ isLoading: true, error: null });
    try {
      const places = await getPlacesByTripId(tripId);
      set({ places, currentTripId: tripId, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  addPlace: async (base, typed) => {
    try {
      const place = await insertPlaceWithDetails(base, typed);
      // 추가 후 전체 목록 리로드 (details 포함 최신 상태 보장)
      const { currentTripId } = get();
      if (currentTripId) {
        const places = await getPlacesByTripId(currentTripId);
        set({ places });
      }
      return place;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  updatePlace: async (id, data) => {
    try {
      await updatePlace(id, data);
      set(s => ({
        places: s.places.map(p =>
          p.id === id ? { ...p, ...data } as PlaceWithDetails : p,
        ),
      }));
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  updateLodgingDetails: async (placeId, data) => {
    try {
      await updateLodgingDetails(placeId, data);
      set(s => ({
        places: s.places.map(p =>
          p.id === placeId && p.type === 'lodging'
            ? { ...p, details: p.details ? { ...p.details, ...data } : null }
            : p,
        ),
      }));
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  updateRestaurantDetails: async (placeId, data) => {
    try {
      await updateRestaurantDetails(placeId, data);
      set(s => ({
        places: s.places.map(p =>
          p.id === placeId && p.type === 'restaurant'
            ? { ...p, details: p.details ? { ...p.details, ...data } : null }
            : p,
        ),
      }));
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  updateCampsiteDetails: async (placeId, data) => {
    try {
      await updateCampsiteDetails(placeId, data);
      set(s => ({
        places: s.places.map(p =>
          p.id === placeId && p.type === 'campsite'
            ? { ...p, details: p.details ? { ...p.details, ...data } : null }
            : p,
        ),
      }));
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  removePlace: async (id) => {
    try {
      await deletePlace(id);
      set(s => ({ places: s.places.filter(p => p.id !== id) }));
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  clearPlaces: () => set({ places: [], currentTripId: null }),
  clearError:  () => set({ error: null }),
}));
