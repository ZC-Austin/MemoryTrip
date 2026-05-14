import { create } from 'zustand';
import type { Tag, TagCategory, NewTag } from '../types';
import {
  getAllTags,
  getTagsByTripId,
  getTagsByPlaceId,
  getTagsByPhotoId,
  upsertTag,
  addTripTag,
  removeTripTag,
  addPlaceTag,
  removePlaceTag,
  addPhotoTag,
  removePhotoTag,
} from '../db/queries/tag';

interface TagStore {
  allTags:   Tag[];
  tripTags:  Tag[];   // 현재 여행에 연결된 태그
  isLoading: boolean;
  error:     string | null;

  loadAllTags:     () => Promise<void>;
  loadTripTags:    (tripId: string) => Promise<void>;
  getOrCreateTag:  (name: string, category?: TagCategory) => Promise<Tag>;

  linkToTrip:    (tripId: string,  tagId: string) => Promise<void>;
  unlinkFromTrip:(tripId: string,  tagId: string) => Promise<void>;
  linkToPlace:   (placeId: string, tagId: string) => Promise<void>;
  unlinkFromPlace:(placeId: string,tagId: string) => Promise<void>;
  linkToPhoto:   (photoId: string, tagId: string) => Promise<void>;
  unlinkFromPhoto:(photoId: string,tagId: string) => Promise<void>;

  clearError: () => void;
}

export const useTagStore = create<TagStore>((set, get) => ({
  allTags:   [],
  tripTags:  [],
  isLoading: false,
  error:     null,

  loadAllTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const allTags = await getAllTags();
      set({ allTags, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  loadTripTags: async (tripId) => {
    try {
      const tripTags = await getTagsByTripId(tripId);
      set({ tripTags });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  getOrCreateTag: async (name, category) => {
    try {
      const tag = await upsertTag({ name, category: category ?? null });
      // allTags에 없으면 추가
      set(s => ({
        allTags: s.allTags.some(t => t.id === tag.id) ? s.allTags : [...s.allTags, tag],
      }));
      return tag;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  linkToTrip: async (tripId, tagId) => {
    try {
      await addTripTag(tripId, tagId);
      const tripTags = await getTagsByTripId(tripId);
      set({ tripTags });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  unlinkFromTrip: async (tripId, tagId) => {
    try {
      await removeTripTag(tripId, tagId);
      set(s => ({ tripTags: s.tripTags.filter(t => t.id !== tagId) }));
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  linkToPlace: async (placeId, tagId) => {
    try { await addPlaceTag(placeId, tagId); }
    catch (e) { set({ error: String(e) }); throw e; }
  },

  unlinkFromPlace: async (placeId, tagId) => {
    try { await removePlaceTag(placeId, tagId); }
    catch (e) { set({ error: String(e) }); throw e; }
  },

  linkToPhoto: async (photoId, tagId) => {
    try { await addPhotoTag(photoId, tagId); }
    catch (e) { set({ error: String(e) }); throw e; }
  },

  unlinkFromPhoto: async (photoId, tagId) => {
    try { await removePhotoTag(photoId, tagId); }
    catch (e) { set({ error: String(e) }); throw e; }
  },

  clearError: () => set({ error: null }),
}));
