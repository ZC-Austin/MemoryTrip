import { getDb, withTransaction } from '../index';
import { uuid, nowIso } from '../../utils/uuid';
import type {
  Place, PlaceType, PlaceWithDetails,
  LodgingDetails, RestaurantDetails,
  CampsiteDetails, CampingType, BugLevel,
  NewPlace, UpdatePlace,
  NewLodgingDetails, NewRestaurantDetails, NewCampsiteDetails,
} from '../../types';

// ─── Row 파서 ─────────────────────────────────────────────────────────────────

interface PlaceRow extends Omit<Place, 'revisit' | 'type'> {
  revisit: number | null;
  type: string;
}

interface CampsiteRow extends Omit<CampsiteDetails, 'has_electricity' | 'recommend_family' | 'recommend_solo' | 'camping_type' | 'bug_level'> {
  has_electricity: number | null;
  recommend_family: number | null;
  recommend_solo: number | null;
  camping_type: string | null;
  bug_level: string | null;
}

function placeFromRow(row: PlaceRow): Place {
  return {
    ...row,
    type: row.type as PlaceType,
    revisit: row.revisit === null ? null : Boolean(row.revisit),
  };
}

function campsiteFromRow(row: CampsiteRow): CampsiteDetails {
  return {
    ...row,
    camping_type: (row.camping_type as CampingType) ?? null,
    bug_level: (row.bug_level as BugLevel) ?? null,
    has_electricity: row.has_electricity === null ? null : Boolean(row.has_electricity),
    recommend_family: row.recommend_family === null ? null : Boolean(row.recommend_family),
    recommend_solo: row.recommend_solo === null ? null : Boolean(row.recommend_solo),
  };
}

async function fetchDetails(place: Place): Promise<PlaceWithDetails> {
  const db = getDb();
  if (place.type === 'lodging') {
    const d = await db.getFirstAsync<LodgingDetails>(
      'SELECT * FROM lodging_details WHERE place_id = ?', [place.id],
    );
    return { ...place, type: 'lodging', details: d ?? null };
  }
  if (place.type === 'restaurant') {
    const d = await db.getFirstAsync<RestaurantDetails>(
      'SELECT * FROM restaurant_details WHERE place_id = ?', [place.id],
    );
    return { ...place, type: 'restaurant', details: d ?? null };
  }
  const rawD = await db.getFirstAsync<CampsiteRow>(
    'SELECT * FROM campsite_details WHERE place_id = ?', [place.id],
  );
  return {
    ...place,
    type: 'campsite',
    details: rawD ? campsiteFromRow(rawD) : null,
  };
}

// ─── 조회 ─────────────────────────────────────────────────────────────────────

export async function getPlacesByTripId(tripId: string): Promise<PlaceWithDetails[]> {
  const db = getDb();
  const rows = await db.getAllAsync<PlaceRow>(
    'SELECT * FROM place WHERE trip_id = ? ORDER BY visited_at ASC, created_at ASC',
    [tripId],
  );
  const places = rows.map(placeFromRow);
  return Promise.all(places.map(fetchDetails));
}

export async function getPlaceById(id: string): Promise<PlaceWithDetails | null> {
  const db = getDb();
  const row = await db.getFirstAsync<PlaceRow>('SELECT * FROM place WHERE id = ?', [id]);
  if (!row) return null;
  return fetchDetails(placeFromRow(row));
}

// ─── 삽입 (Place + 해당 details 트랜잭션) ────────────────────────────────────

type InsertPlaceTyped =
  | { type: 'lodging';    details?: NewLodgingDetails }
  | { type: 'restaurant'; details?: NewRestaurantDetails }
  | { type: 'campsite';   details?: NewCampsiteDetails };

export async function insertPlaceWithDetails(
  base: Omit<NewPlace, 'type'>,
  typed: InsertPlaceTyped,
): Promise<Place> {
  return withTransaction(async () => {
    const db = getDb();
    const now = nowIso();
    const id = uuid();
    const revisit = base.revisit === null || base.revisit === undefined
      ? null
      : base.revisit ? 1 : 0;

    await db.runAsync(
      `INSERT INTO place
         (id, trip_id, type, name, gps_lat, gps_lng, visited_at,
          rating, pros, cons, revisit, memo, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, base.trip_id, typed.type, base.name,
        base.gps_lat ?? null, base.gps_lng ?? null, base.visited_at ?? null,
        base.rating ?? null, base.pros ?? null, base.cons ?? null,
        revisit, base.memo ?? null, now, now,
      ],
    );

    if (typed.type === 'lodging' && typed.details) {
      const d = typed.details;
      await db.runAsync(
        `INSERT INTO lodging_details
           (place_id, check_in, check_out, booking_site,
            score_clean, score_location, score_kindness, score_value)
         VALUES (?,?,?,?,?,?,?,?)`,
        [id, d.check_in ?? null, d.check_out ?? null, d.booking_site ?? null,
         d.score_clean ?? null, d.score_location ?? null,
         d.score_kindness ?? null, d.score_value ?? null],
      );
    } else if (typed.type === 'restaurant' && typed.details) {
      const d = typed.details;
      await db.runAsync(
        'INSERT INTO restaurant_details (place_id, menu, wait_minutes) VALUES (?,?,?)',
        [id, d.menu ?? null, d.wait_minutes ?? null],
      );
    } else if (typed.type === 'campsite' && typed.details) {
      const d = typed.details;
      await db.runAsync(
        `INSERT INTO campsite_details
           (place_id, check_in, check_out, site_no, camping_type,
            has_electricity, score_toilet, score_shower, score_quiet,
            score_view, score_manner, bug_level, recommend_family, recommend_solo)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id, d.check_in ?? null, d.check_out ?? null, d.site_no ?? null,
          d.camping_type ?? null,
          d.has_electricity === null || d.has_electricity === undefined ? null : (d.has_electricity ? 1 : 0),
          d.score_toilet ?? null, d.score_shower ?? null, d.score_quiet ?? null,
          d.score_view ?? null, d.score_manner ?? null, d.bug_level ?? null,
          d.recommend_family === null || d.recommend_family === undefined ? null : (d.recommend_family ? 1 : 0),
          d.recommend_solo === null || d.recommend_solo === undefined ? null : (d.recommend_solo ? 1 : 0),
        ],
      );
    }

    const place: Place = {
      ...base, id,
      type: typed.type,
      revisit: base.revisit ?? null,
      created_at: now, updated_at: now,
    };
    return place;
  });
}

// ─── 수정 ─────────────────────────────────────────────────────────────────────

export async function updatePlace(id: string, data: UpdatePlace): Promise<void> {
  const db = getDb();
  const now = nowIso();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name       !== undefined) { fields.push('name = ?');       values.push(data.name); }
  if (data.gps_lat    !== undefined) { fields.push('gps_lat = ?');    values.push(data.gps_lat); }
  if (data.gps_lng    !== undefined) { fields.push('gps_lng = ?');    values.push(data.gps_lng); }
  if (data.visited_at !== undefined) { fields.push('visited_at = ?'); values.push(data.visited_at); }
  if (data.rating     !== undefined) { fields.push('rating = ?');     values.push(data.rating); }
  if (data.pros       !== undefined) { fields.push('pros = ?');       values.push(data.pros); }
  if (data.cons       !== undefined) { fields.push('cons = ?');       values.push(data.cons); }
  if (data.revisit    !== undefined) { fields.push('revisit = ?');    values.push(data.revisit === null ? null : (data.revisit ? 1 : 0)); }
  if (data.memo       !== undefined) { fields.push('memo = ?');       values.push(data.memo); }

  if (fields.length === 0) return;
  fields.push('updated_at = ?');
  values.push(now, id);
  await db.runAsync(`UPDATE place SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function updateLodgingDetails(
  placeId: string,
  data: Partial<NewLodgingDetails>,
): Promise<void> {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  if (data.check_in       !== undefined) { fields.push('check_in = ?');       values.push(data.check_in); }
  if (data.check_out      !== undefined) { fields.push('check_out = ?');      values.push(data.check_out); }
  if (data.booking_site   !== undefined) { fields.push('booking_site = ?');   values.push(data.booking_site); }
  if (data.score_clean    !== undefined) { fields.push('score_clean = ?');    values.push(data.score_clean); }
  if (data.score_location !== undefined) { fields.push('score_location = ?'); values.push(data.score_location); }
  if (data.score_kindness !== undefined) { fields.push('score_kindness = ?'); values.push(data.score_kindness); }
  if (data.score_value    !== undefined) { fields.push('score_value = ?');    values.push(data.score_value); }
  if (fields.length === 0) return;
  values.push(placeId);
  await db.runAsync(
    `UPDATE lodging_details SET ${fields.join(', ')} WHERE place_id = ?`, values,
  );
}

export async function updateRestaurantDetails(
  placeId: string,
  data: Partial<NewRestaurantDetails>,
): Promise<void> {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  if (data.menu         !== undefined) { fields.push('menu = ?');         values.push(data.menu); }
  if (data.wait_minutes !== undefined) { fields.push('wait_minutes = ?'); values.push(data.wait_minutes); }
  if (fields.length === 0) return;
  values.push(placeId);
  await db.runAsync(
    `UPDATE restaurant_details SET ${fields.join(', ')} WHERE place_id = ?`, values,
  );
}

export async function updateCampsiteDetails(
  placeId: string,
  data: Partial<NewCampsiteDetails>,
): Promise<void> {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  if (data.check_in        !== undefined) { fields.push('check_in = ?');        values.push(data.check_in); }
  if (data.check_out       !== undefined) { fields.push('check_out = ?');       values.push(data.check_out); }
  if (data.site_no         !== undefined) { fields.push('site_no = ?');         values.push(data.site_no); }
  if (data.camping_type    !== undefined) { fields.push('camping_type = ?');    values.push(data.camping_type); }
  if (data.has_electricity !== undefined) { fields.push('has_electricity = ?'); values.push(data.has_electricity === null ? null : (data.has_electricity ? 1 : 0)); }
  if (data.score_toilet    !== undefined) { fields.push('score_toilet = ?');    values.push(data.score_toilet); }
  if (data.score_shower    !== undefined) { fields.push('score_shower = ?');    values.push(data.score_shower); }
  if (data.score_quiet     !== undefined) { fields.push('score_quiet = ?');     values.push(data.score_quiet); }
  if (data.score_view      !== undefined) { fields.push('score_view = ?');      values.push(data.score_view); }
  if (data.score_manner    !== undefined) { fields.push('score_manner = ?');    values.push(data.score_manner); }
  if (data.bug_level       !== undefined) { fields.push('bug_level = ?');       values.push(data.bug_level); }
  if (data.recommend_family !== undefined) { fields.push('recommend_family = ?'); values.push(data.recommend_family === null ? null : (data.recommend_family ? 1 : 0)); }
  if (data.recommend_solo  !== undefined) { fields.push('recommend_solo = ?');  values.push(data.recommend_solo === null ? null : (data.recommend_solo ? 1 : 0)); }
  if (fields.length === 0) return;
  values.push(placeId);
  await db.runAsync(
    `UPDATE campsite_details SET ${fields.join(', ')} WHERE place_id = ?`, values,
  );
}

// ─── 삭제 ─────────────────────────────────────────────────────────────────────

export async function deletePlace(id: string): Promise<void> {
  // CASCADE → lodging_details / restaurant_details / campsite_details 자동 삭제
  // ON DELETE SET NULL → photo.place_id, expense.place_id 자동 NULL 처리
  await getDb().runAsync('DELETE FROM place WHERE id = ?', [id]);
}
