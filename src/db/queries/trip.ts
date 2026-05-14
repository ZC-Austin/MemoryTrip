import { getDb } from '../index';
import { uuid, nowIso } from '../../utils/uuid';
import type { Trip, TripType, TripWithStatus, TripStatus, TripStats, NewTrip, UpdateTrip } from '../../types';

// SQLite 원시 행 타입 (companions = JSON 문자열)
interface TripRow extends Omit<Trip, 'companions' | 'trip_type'> {
  companions: string | null;
  trip_type: string;
}

interface TripWithStatusRow extends TripRow {
  status: string;
}

function fromRow(row: TripRow): Trip {
  return {
    ...row,
    trip_type: row.trip_type as TripType,
    companions: row.companions ? (JSON.parse(row.companions) as string[]) : [],
  };
}

// ─── 활동 기반 상태 포함 CTE ──────────────────────────────────────────────────

const STATUS_CTE = `
WITH last_activity AS (
  SELECT trip_id, MAX(updated_at) AS last_at FROM (
    SELECT trip_id, updated_at FROM photo
    UNION ALL SELECT trip_id, updated_at FROM place
    UNION ALL SELECT trip_id, updated_at FROM expense
    UNION ALL SELECT trip_id, updated_at FROM diary_entry
  ) GROUP BY trip_id
)
`;

const STATUS_CASE = `
  CASE
    WHEN t.start_date > date('now') THEN 'planned'
    WHEN t.end_date IS NOT NULL AND t.end_date < date('now') THEN 'completed'
    WHEN t.start_date <= date('now')
      AND (t.end_date IS NULL OR t.end_date >= date('now'))
      AND COALESCE(la.last_at, t.updated_at) >= datetime('now', '-14 days')
      THEN 'in_progress'
    WHEN t.end_date IS NULL
      AND COALESCE(la.last_at, t.updated_at) < datetime('now', '-14 days')
      THEN 'no_end_date'
    ELSE 'completed'
  END AS status
`;

// ─── 조회 ─────────────────────────────────────────────────────────────────────

export async function getTripById(id: string): Promise<TripWithStatus | null> {
  const db = getDb();
  const row = await db.getFirstAsync<TripWithStatusRow>(
    `${STATUS_CTE}
     SELECT t.*, ${STATUS_CASE}
     FROM trip t
     LEFT JOIN last_activity la ON t.id = la.trip_id
     WHERE t.id = ?`,
    [id],
  );
  if (!row) return null;
  return { ...fromRow(row), status: row.status as TripStatus };
}

export async function getAllTrips(): Promise<TripWithStatus[]> {
  const db = getDb();
  const rows = await db.getAllAsync<TripWithStatusRow>(
    `${STATUS_CTE}
     SELECT t.*, ${STATUS_CASE}
     FROM trip t
     LEFT JOIN last_activity la ON t.id = la.trip_id
     ORDER BY t.updated_at DESC`,
  );
  return rows.map(row => ({ ...fromRow(row), status: row.status as TripStatus }));
}

// 홈 화면: 가장 최근 진행 중 여행 1건
export async function getActiveTrip(): Promise<TripWithStatus | null> {
  const db = getDb();
  const row = await db.getFirstAsync<TripWithStatusRow>(
    `${STATUS_CTE}
     SELECT t.*, ${STATUS_CASE}
     FROM trip t
     LEFT JOIN last_activity la ON t.id = la.trip_id
     WHERE t.start_date <= date('now')
       AND (t.end_date IS NULL OR t.end_date >= date('now'))
     ORDER BY t.updated_at DESC
     LIMIT 1`,
  );
  if (!row) return null;
  return { ...fromRow(row), status: row.status as TripStatus };
}

// 홈 화면: 가장 최근 예정 여행 1건
export async function getNextPlannedTrip(): Promise<TripWithStatus | null> {
  const db = getDb();
  const row = await db.getFirstAsync<TripWithStatusRow>(
    `${STATUS_CTE}
     SELECT t.*, ${STATUS_CASE}
     FROM trip t
     LEFT JOIN last_activity la ON t.id = la.trip_id
     WHERE t.start_date > date('now')
     ORDER BY t.start_date ASC
     LIMIT 1`,
  );
  if (!row) return null;
  return { ...fromRow(row), status: row.status as TripStatus };
}

// 홈 화면 요약 통계
export async function getTripStats(id: string): Promise<TripStats> {
  const db = getDb();

  const [expenseRow, photoRow, placeRow, tripRow] = await Promise.all([
    db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM expense WHERE trip_id = ?',
      [id],
    ),
    db.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) AS cnt FROM photo WHERE trip_id = ?',
      [id],
    ),
    db.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) AS cnt FROM place WHERE trip_id = ?',
      [id],
    ),
    db.getFirstAsync<{ start_date: string; end_date: string | null }>(
      'SELECT start_date, end_date FROM trip WHERE id = ?',
      [id],
    ),
    db.getFirstAsync<{ category: string | null }>(
      `SELECT category FROM expense WHERE trip_id = ?
       GROUP BY category ORDER BY SUM(amount) DESC LIMIT 1`,
      [id],
    ),
  ]);

  const total = expenseRow?.total ?? 0;
  const endDate = tripRow?.end_date ?? new Date().toISOString().slice(0, 10);
  const startDate = tripRow?.start_date ?? endDate;
  const dayCount = Math.max(
    1,
    Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000,
    ) + 1,
  );
  const nightCount = Math.max(0, dayCount - 1);

  // top_category는 별도 쿼리 (Promise.all 순서와 무관하게 추가 쿼리)
  const topRow = await db.getFirstAsync<{ category: string | null }>(
    `SELECT category FROM expense WHERE trip_id = ?
     GROUP BY category ORDER BY SUM(amount) DESC LIMIT 1`,
    [id],
  );

  return {
    trip_id: id,
    total_expense: total,
    photo_count: photoRow?.cnt ?? 0,
    place_count: placeRow?.cnt ?? 0,
    night_count: nightCount,
    day_count: dayCount,
    daily_avg_expense: dayCount > 0 ? total / dayCount : 0,
    top_category: topRow?.category ?? null,
  };
}

// ─── 변경 ─────────────────────────────────────────────────────────────────────

export async function insertTrip(data: NewTrip): Promise<Trip> {
  const db = getDb();
  const now = nowIso();
  const id = uuid();
  const companions = JSON.stringify(data.companions ?? []);

  await db.runAsync(
    `INSERT INTO trip
       (id, title, start_date, end_date, trip_type, country, city,
        gps_lat, gps_lng, purpose, satisfaction, summary, companions,
        hero_photo_id, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, data.title, data.start_date, data.end_date ?? null,
      data.trip_type, data.country ?? null, data.city ?? null,
      data.gps_lat ?? null, data.gps_lng ?? null, data.purpose ?? null,
      data.satisfaction ?? null, data.summary ?? null, companions,
      data.hero_photo_id ?? null, now, now,
    ],
  );

  return { ...data, id, companions: data.companions ?? [], created_at: now, updated_at: now };
}

export async function updateTrip(id: string, data: UpdateTrip): Promise<void> {
  const db = getDb();
  const now = nowIso();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.title          !== undefined) { fields.push('title = ?');           values.push(data.title); }
  if (data.start_date     !== undefined) { fields.push('start_date = ?');      values.push(data.start_date); }
  if (data.end_date       !== undefined) { fields.push('end_date = ?');        values.push(data.end_date); }
  if (data.trip_type      !== undefined) { fields.push('trip_type = ?');       values.push(data.trip_type); }
  if (data.country        !== undefined) { fields.push('country = ?');         values.push(data.country); }
  if (data.city           !== undefined) { fields.push('city = ?');            values.push(data.city); }
  if (data.gps_lat        !== undefined) { fields.push('gps_lat = ?');         values.push(data.gps_lat); }
  if (data.gps_lng        !== undefined) { fields.push('gps_lng = ?');         values.push(data.gps_lng); }
  if (data.purpose        !== undefined) { fields.push('purpose = ?');         values.push(data.purpose); }
  if (data.satisfaction   !== undefined) { fields.push('satisfaction = ?');    values.push(data.satisfaction); }
  if (data.summary        !== undefined) { fields.push('summary = ?');         values.push(data.summary); }
  if (data.companions     !== undefined) { fields.push('companions = ?');      values.push(JSON.stringify(data.companions)); }
  if (data.hero_photo_id  !== undefined) { fields.push('hero_photo_id = ?');   values.push(data.hero_photo_id); }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(now, id);

  await db.runAsync(`UPDATE trip SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteTrip(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM trip WHERE id = ?', [id]);
}

// 홈 화면 전체 통계 (단일 쿼리)
export interface OverallStats {
  tripCount: number;
  photoCount: number;
  placeCount: number;
  nightCount: number;
}

export async function getOverallStats(): Promise<OverallStats> {
  const row = await getDb().getFirstAsync<{
    trip_count: number;
    photo_count: number;
    place_count: number;
    night_count: number;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM trip)  AS trip_count,
      (SELECT COUNT(*) FROM photo) AS photo_count,
      (SELECT COUNT(*) FROM place) AS place_count,
      (SELECT COALESCE(SUM(
        CASE
          WHEN end_date IS NOT NULL
          THEN MAX(0, CAST(julianday(end_date) - julianday(start_date) AS INTEGER))
          ELSE 0
        END
      ), 0) FROM trip) AS night_count
  `);
  return {
    tripCount:  row?.trip_count  ?? 0,
    photoCount: row?.photo_count ?? 0,
    placeCount: row?.place_count ?? 0,
    nightCount: row?.night_count ?? 0,
  };
}
