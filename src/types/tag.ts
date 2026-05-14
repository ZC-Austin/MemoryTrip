export type TagCategory = 'style' | 'feature' | 'season' | 'mood';

export interface Tag {
  id: string;
  name: string;
  category: TagCategory | null;
  created_at: string;
}

export interface TripTag {
  trip_id: string;
  tag_id: string;
}

export interface PlaceTag {
  place_id: string;
  tag_id: string;
}

export interface PhotoTag {
  photo_id: string;
  tag_id: string;
}

export type NewTag = Omit<Tag, 'id' | 'created_at'>;
