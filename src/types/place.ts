export type PlaceType = 'lodging' | 'restaurant' | 'campsite';

export interface Place {
  id: string;
  trip_id: string;
  type: PlaceType;
  name: string;
  gps_lat: number | null;
  gps_lng: number | null;
  visited_at: string | null; // ISO timestamp
  rating: number | null;     // 1~5
  pros: string | null;
  cons: string | null;
  revisit: boolean | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface LodgingDetails {
  place_id: string;
  check_in: string | null;       // 'YYYY-MM-DD'
  check_out: string | null;
  booking_site: string | null;
  score_clean: number | null;    // 1~5
  score_location: number | null;
  score_kindness: number | null;
  score_value: number | null;
}

export interface RestaurantDetails {
  place_id: string;
  menu: string | null;
  wait_minutes: number | null;
}

export type CampingType = 'auto' | 'backpack' | 'glamping' | 'caravan' | 'etc';
export type BugLevel = 'none' | 'few' | 'some' | 'many';

export interface CampsiteDetails {
  place_id: string;
  check_in: string | null;
  check_out: string | null;
  site_no: string | null;
  camping_type: CampingType | null;
  has_electricity: boolean | null;
  score_toilet: number | null;   // 1~5
  score_shower: number | null;
  score_quiet: number | null;
  score_view: number | null;
  score_manner: number | null;
  bug_level: BugLevel | null;
  recommend_family: boolean | null;
  recommend_solo: boolean | null;
}

// 장소 + 타입별 상세를 합친 discriminated union
export type PlaceWithDetails =
  | (Place & { type: 'lodging';     details: LodgingDetails | null })
  | (Place & { type: 'restaurant';  details: RestaurantDetails | null })
  | (Place & { type: 'campsite';    details: CampsiteDetails | null });

export type NewPlace = Omit<Place, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePlace = Partial<Omit<Place, 'id' | 'trip_id' | 'created_at'>>;

export type NewLodgingDetails = Omit<LodgingDetails, 'place_id'>;
export type NewRestaurantDetails = Omit<RestaurantDetails, 'place_id'>;
export type NewCampsiteDetails = Omit<CampsiteDetails, 'place_id'>;
