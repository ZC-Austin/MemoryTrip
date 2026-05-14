import { create } from 'zustand';
import type { Photo, NewPhoto, UpdatePhoto } from '../types';
import {
  getPhotosByTripId,
  insertPhoto,
  insertPhotos,
  updatePhoto,
  deletePhoto,
} from '../db/queries/photo';

interface PhotoStore {
  photos:        Photo[];
  currentTripId: string | null;
  sortBy:        'date' | 'place';
  isLoading:     boolean;
  error:         string | null;

  loadPhotos:   (tripId: string, sortBy?: 'date' | 'place') => Promise<void>;
  addPhoto:     (data: NewPhoto) => Promise<Photo>;
  addPhotos:    (data: NewPhoto[]) => Promise<Photo[]>;
  updatePhoto:  (id: string, data: UpdatePhoto) => Promise<void>;
  removePhoto:  (id: string) => Promise<void>;
  setSortBy:    (sortBy: 'date' | 'place') => Promise<void>;
  clearPhotos:  () => void;
  clearError:   () => void;
}

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  photos:        [],
  currentTripId: null,
  sortBy:        'date',
  isLoading:     false,
  error:         null,

  loadPhotos: async (tripId, sortBy) => {
    const effectiveSortBy = sortBy ?? get().sortBy;
    set({ isLoading: true, error: null });
    try {
      const photos = await getPhotosByTripId(tripId, effectiveSortBy);
      set({ photos, currentTripId: tripId, sortBy: effectiveSortBy, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  addPhoto: async (data) => {
    try {
      const photo = await insertPhoto(data);
      set(s => ({ photos: [...s.photos, photo] }));
      return photo;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  addPhotos: async (data) => {
    try {
      const photos = await insertPhotos(data);
      set(s => ({ photos: [...s.photos, ...photos] }));
      return photos;
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  updatePhoto: async (id, data) => {
    try {
      await updatePhoto(id, data);
      set(s => ({
        photos: s.photos.map(p => p.id === id ? { ...p, ...data } : p),
      }));
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  removePhoto: async (id) => {
    try {
      await deletePhoto(id);
      set(s => ({ photos: s.photos.filter(p => p.id !== id) }));
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  setSortBy: async (sortBy) => {
    const { currentTripId } = get();
    if (!currentTripId) { set({ sortBy }); return; }
    set({ sortBy, isLoading: true });
    try {
      const photos = await getPhotosByTripId(currentTripId, sortBy);
      set({ photos, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  clearPhotos: () => set({ photos: [], currentTripId: null }),
  clearError:  () => set({ error: null }),
}));
