export interface EquipmentRecord {
  id: string;
  trip_id: string;
  used_items: string[];       // JSON array → 앱에서 파싱
  missing_items: string[];
  next_time_items: string[];
  created_at: string;
  updated_at: string;
}

export type NewEquipmentRecord = Omit<EquipmentRecord, 'id' | 'created_at' | 'updated_at'>;
export type UpdateEquipmentRecord = Partial<Omit<EquipmentRecord, 'id' | 'trip_id' | 'created_at'>>;
