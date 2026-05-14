import { getDb, withTransaction } from '../index';
import { uuid, nowIso } from '../../utils/uuid';
import type { Photo, LocationSource, SyncStatus, NewPhoto, UpdatePhoto } from '../../types';

interface PhotoRow extends Omit<Photo, 'location_source' | 'sync_status'> {
  location_source: string | null;
  sync_status: string;
}

function fromRow(row: PhotoRow): Photo {
  return {
    ...row,
    location_source: (row.location_source as LocationSource) ?? null,
    sync_status: row.sync_status as SyncStatus,
  };
}

// ─── 조회 ─────────────────────────────────────────────────────────────────────

export async function getPhotosByTripId(
  tripId: string,
  sortBy: 'date' | 'place' = 'date',
): Promise<Photo[]> {
  const db = getDb();
  const order =
    sortBy === 'place'
      ? 'p.place_id ASC, p.taken_at ASC'
      : 'p.taken_at ASC, p.created_at ASC';
  const rows = await db.getAllAsync<PhotoRow>(
    `SELECT p.* FROM photo p WHERE p.trip_id = ? ORDER BY ${order}`,
    [tripId],
  );
  return rows.map(fromRow);
}

export async function getPhotoById(id: string): Promise<Photo | null> {
  const row = await getDb().getFirstAsync<PhotoRow>(
    'SELECT * FROM photo WHERE id = ?', [id],
  );
  return row ? fromRow(row) : null;
}

// ─── 삽입 ─────────────────────────────────────────────────────────────────────

export async function insertPhoto(data: NewPhoto): Promise<Photo> {
  const db = getDb();
  const now = nowIso();
  const id = uuid();

  await db.runAsync(
    `INSERT INTO photo
       (id, trip_id, place_id, local_path, thumb_path, memo,
        gps_lat, gps_lng, location_source, taken_at, sync_status, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, data.trip_id, data.place_id ?? null,
      data.local_path, data.thumb_path ?? null, data.memo ?? null,
      data.gps_lat ?? null, data.gps_lng ?? null,
      data.location_source ?? null, data.taken_at ?? null,
      data.sync_status ?? 'pending', now, now,
    ],
  );

  return { ...data, id, sync_status: data.sync_status ?? 'pending', created_at: now, updated_at: now };
}

// 갤러리 다중 선택 후 일괄 저장 — 단일 트랜잭션
export async function insertPhotos(photos: NewPhoto[]): Promise<Photo[]> {
  return withTransaction(async () => {
    const results: Photo[] = [];
    for (const data of photos) {
      results.push(await insertPhoto(data));
    }
    return results;
  });
}

// ─── 수정 ─────────────────────────────────────────────────────────────────────

export async function updatePhoto(id: string, data: UpdatePhoto): Promise<void> {
  const db = getDb();
  const now = nowIso();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.place_id        !== undefined) { fields.push('place_id = ?');        values.push(data.place_id); }
  if (data.thumb_path      !== undefined) { fields.push('thumb_path = ?');      values.push(data.thumb_path); }
  if (data.memo            !== undefined) { fields.push('memo = ?');            values.push(data.memo); }
  if (data.gps_lat         !== undefined) { fields.push('gps_lat = ?');         values.push(data.gps_lat); }
  if (data.gps_lng         !== undefined) { fields.push('gps_lng = ?');         values.push(data.gps_lng); }
  if (data.location_source !== undefined) { fields.push('location_source = ?'); values.push(data.location_source); }
  if (data.taken_at        !== undefined) { fields.push('taken_at = ?');        values.push(data.taken_at); }
  if (data.sync_status     !== undefined) { fields.push('sync_status = ?');     values.push(data.sync_status); }

  if (fields.length === 0) return;
  fields.push('updated_at = ?');
  values.push(now, id);
  await db.runAsync(`UPDATE photo SET ${fields.join(', ')} WHERE id = ?`, values);
}

// ─── 삭제 ─────────────────────────────────────────────────────────────────────

export async function deletePhoto(id: string): Promise<void> {
  // 트리거: trg_photo_delete_clear_hero, trg_photo_delete_backup 자동 실행
  await getDb().runAsync('DELETE FROM photo WHERE id = ?', [id]);
}

export async function deletePhotosByTripId(tripId: string): Promise<void> {
  await getDb().runAsync('DELETE FROM photo WHERE trip_id = ?', [tripId]);
}
