export type TripType = 'trip' | 'camping';

export type TripStatus = 'planned' | 'in_progress' | 'no_end_date' | 'completed';

export interface Trip {
  id: string;
  title: string;
  start_date: string;       // 'YYYY-MM-DD'
  end_date: string | null;  // NULL = 기간 미정
  trip_type: TripType;
  country: string | null;
  city: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  purpose: string | null;
  satisfaction: number | null; // 1~5
  summary: string | null;
  companions: string[];        // JSON array → 앱에서 파싱
  hero_photo_id: string | null;
  created_at: string;
  updated_at: string;
}

export type NewTrip = Omit<Trip, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTrip = Partial<Omit<Trip, 'id' | 'created_at'>>;

export interface TripWithStatus extends Trip {
  status: TripStatus;
}

export interface TripStats {
  trip_id: string;
  total_expense: number;
  photo_count: number;
  place_count: number;
  night_count: number;
  day_count: number;
  daily_avg_expense: number;
  top_category: string | null;
}
