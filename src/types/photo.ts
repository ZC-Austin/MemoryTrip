export type LocationSource = 'exif' | 'gps' | 'manual';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'dead';

export interface Photo {
  id: string;
  trip_id: string;
  place_id: string | null;
  local_path: string;        // ${doc}photos/{tripId}/{photoId}.jpg
  thumb_path: string | null; // ${doc}photos/{tripId}/thumbs/{photoId}.jpg
  memo: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  location_source: LocationSource | null;
  taken_at: string | null;   // ISO timestamp
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export type NewPhoto = Omit<Photo, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePhoto = Partial<Omit<Photo, 'id' | 'trip_id' | 'created_at'>>;
