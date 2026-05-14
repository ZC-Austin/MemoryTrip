import { getDb } from '../index';
import { uuid, nowIso } from '../../utils/uuid';
import type { EquipmentRecord, NewEquipmentRecord, UpdateEquipmentRecord } from '../../types';

interface EquipmentRow extends Omit<EquipmentRecord, 'used_items' | 'missing_items' | 'next_time_items'> {
  used_items: string | null;
  missing_items: string | null;
  next_time_items: string | null;
}

function fromRow(row: EquipmentRow): EquipmentRecord {
  return {
    ...row,
    used_items:       row.used_items       ? (JSON.parse(row.used_items)       as string[]) : [],
    missing_items:    row.missing_items    ? (JSON.parse(row.missing_items)    as string[]) : [],
    next_time_items:  row.next_time_items  ? (JSON.parse(row.next_time_items)  as string[]) : [],
  };
}

// ─── 조회 ─────────────────────────────────────────────────────────────────────

export async function getEquipmentRecord(tripId: string): Promise<EquipmentRecord | null> {
  const row = await getDb().getFirstAsync<EquipmentRow>(
    'SELECT * FROM equipment_record WHERE trip_id = ?', [tripId],
  );
  return row ? fromRow(row) : null;
}

// ─── Upsert (여행당 1건) ──────────────────────────────────────────────────────

export async function upsertEquipmentRecord(data: NewEquipmentRecord): Promise<EquipmentRecord> {
  const db = getDb();
  const existing = await getEquipmentRecord(data.trip_id);
  const now = nowIso();

  const used        = JSON.stringify(data.used_items ?? []);
  const missing     = JSON.stringify(data.missing_items ?? []);
  const next_time   = JSON.stringify(data.next_time_items ?? []);

  if (existing) {
    await db.runAsync(
      `UPDATE equipment_record
         SET used_items = ?, missing_items = ?, next_time_items = ?, updated_at = ?
       WHERE trip_id = ?`,
      [used, missing, next_time, now, data.trip_id],
    );
    return { ...existing, ...data, updated_at: now };
  }

  const id = uuid();
  await db.runAsync(
    `INSERT INTO equipment_record
       (id, trip_id, used_items, missing_items, next_time_items, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?)`,
    [id, data.trip_id, used, missing, next_time, now, now],
  );

  return {
    id,
    trip_id:        data.trip_id,
    used_items:     data.used_items ?? [],
    missing_items:  data.missing_items ?? [],
    next_time_items: data.next_time_items ?? [],
    created_at: now,
    updated_at: now,
  };
}
