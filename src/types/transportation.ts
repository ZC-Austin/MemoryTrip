export type TransportMode = 'walk' | 'car' | 'public' | 'air' | 'rail' | 'etc';

export interface Transportation {
  id: string;
  trip_id: string;
  mode: TransportMode;
  fatigue: number | null; // 1~5
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export type NewTransportation = Omit<Transportation, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTransportation = Partial<Omit<Transportation, 'id' | 'trip_id' | 'created_at'>>;
