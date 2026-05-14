import { getDb } from '../index';
import { uuid, nowIso } from '../../utils/uuid';
import type { Tag, TagCategory, NewTag } from '../../types';

// ─── 조회 ─────────────────────────────────────────────────────────────────────

export async function getAllTags(): Promise<Tag[]> {
  return getDb().getAllAsync<Tag>('SELECT * FROM tag ORDER BY name ASC');
}

export async function getTagsByTripId(tripId: string): Promise<Tag[]> {
  return getDb().getAllAsync<Tag>(
    `SELECT t.* FROM tag t
     JOIN trip_tag tt ON t.id = tt.tag_id
     WHERE tt.trip_id = ?
     ORDER BY t.name ASC`,
    [tripId],
  );
}

export async function getTagsByPlaceId(placeId: string): Promise<Tag[]> {
  return getDb().getAllAsync<Tag>(
    `SELECT t.* FROM tag t
     JOIN place_tag pt ON t.id = pt.tag_id
     WHERE pt.place_id = ?
     ORDER BY t.name ASC`,
    [placeId],
  );
}

export async function getTagsByPhotoId(photoId: string): Promise<Tag[]> {
  return getDb().getAllAsync<Tag>(
    `SELECT t.* FROM tag t
     JOIN photo_tag pht ON t.id = pht.tag_id
     WHERE pht.photo_id = ?
     ORDER BY t.name ASC`,
    [photoId],
  );
}

// ─── Upsert ───────────────────────────────────────────────────────────────────
// (name, category) UNIQUE → 동일 이름·카테고리 태그는 재사용

export async function upsertTag(data: NewTag): Promise<Tag> {
  const db = getDb();
  const existing = await db.getFirstAsync<Tag>(
    `SELECT * FROM tag WHERE name = ? AND COALESCE(category, '') = ?`,
    [data.name, data.category ?? ''],
  );
  if (existing) return existing;

  const id = uuid();
  const now = nowIso();
  await db.runAsync(
    'INSERT INTO tag (id, name, category, created_at) VALUES (?,?,?,?)',
    [id, data.name, data.category ?? null, now],
  );
  return { id, name: data.name, category: (data.category as TagCategory) ?? null, created_at: now };
}

// ─── Trip 태그 연결 ───────────────────────────────────────────────────────────

export async function addTripTag(tripId: string, tagId: string): Promise<void> {
  await getDb().runAsync(
    'INSERT OR IGNORE INTO trip_tag (trip_id, tag_id) VALUES (?,?)',
    [tripId, tagId],
  );
}

export async function removeTripTag(tripId: string, tagId: string): Promise<void> {
  await getDb().runAsync(
    'DELETE FROM trip_tag WHERE trip_id = ? AND tag_id = ?',
    [tripId, tagId],
  );
}

// ─── Place 태그 연결 ──────────────────────────────────────────────────────────

export async function addPlaceTag(placeId: string, tagId: string): Promise<void> {
  await getDb().runAsync(
    'INSERT OR IGNORE INTO place_tag (place_id, tag_id) VALUES (?,?)',
    [placeId, tagId],
  );
}

export async function removePlaceTag(placeId: string, tagId: string): Promise<void> {
  await getDb().runAsync(
    'DELETE FROM place_tag WHERE place_id = ? AND tag_id = ?',
    [placeId, tagId],
  );
}

// ─── Photo 태그 연결 ──────────────────────────────────────────────────────────

export async function addPhotoTag(photoId: string, tagId: string): Promise<void> {
  await getDb().runAsync(
    'INSERT OR IGNORE INTO photo_tag (photo_id, tag_id) VALUES (?,?)',
    [photoId, tagId],
  );
}

export async function removePhotoTag(photoId: string, tagId: string): Promise<void> {
  await getDb().runAsync(
    'DELETE FROM photo_tag WHERE photo_id = ? AND tag_id = ?',
    [photoId, tagId],
  );
}
