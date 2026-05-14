import { getDb } from '../index';
import { uuid, nowIso } from '../../utils/uuid';
import type { DiaryEntry, EmotionTag, NewDiaryEntry, UpdateDiaryEntry } from '../../types';

interface DiaryRow extends Omit<DiaryEntry, 'emotions'> {
  emotions: string | null;
}

function fromRow(row: DiaryRow): DiaryEntry {
  return {
    ...row,
    emotions: row.emotions ? (JSON.parse(row.emotions) as EmotionTag[]) : [],
  };
}

// ─── 조회 ─────────────────────────────────────────────────────────────────────

export async function getDiaryEntriesByTripId(tripId: string): Promise<DiaryEntry[]> {
  const rows = await getDb().getAllAsync<DiaryRow>(
    `SELECT * FROM diary_entry WHERE trip_id = ?
     ORDER BY COALESCE(entry_date, '') ASC`,
    [tripId],
  );
  return rows.map(fromRow);
}

// date = null → trip-level 종합 기록 조회
export async function getDiaryEntryByDate(
  tripId: string,
  date: string | null,
): Promise<DiaryEntry | null> {
  const db = getDb();
  const row = date
    ? await db.getFirstAsync<DiaryRow>(
        'SELECT * FROM diary_entry WHERE trip_id = ? AND entry_date = ?',
        [tripId, date],
      )
    : await db.getFirstAsync<DiaryRow>(
        'SELECT * FROM diary_entry WHERE trip_id = ? AND entry_date IS NULL',
        [tripId],
      );
  return row ? fromRow(row) : null;
}

// ─── Upsert ───────────────────────────────────────────────────────────────────
// (trip_id, entry_date) UNIQUE + SQLite NULL 특성 → entry_date NULL인 행은
// 앱 레벨에서 기존 row를 확인 후 INSERT 또는 UPDATE로 처리.

export async function upsertDiaryEntry(data: NewDiaryEntry): Promise<DiaryEntry> {
  const db = getDb();
  const now = nowIso();
  const emotions = JSON.stringify(data.emotions ?? []);

  const existing = await getDiaryEntryByDate(data.trip_id, data.entry_date ?? null);

  if (existing) {
    await db.runAsync(
      `UPDATE diary_entry SET
         emotions = ?, memo = ?, best_moment = ?, want_to_revisit = ?, updated_at = ?
       WHERE id = ?`,
      [emotions, data.memo ?? null, data.best_moment ?? null, data.want_to_revisit ?? null, now, existing.id],
    );
    return { ...existing, ...data, emotions: data.emotions ?? [], updated_at: now };
  }

  const id = uuid();
  await db.runAsync(
    `INSERT INTO diary_entry
       (id, trip_id, entry_date, emotions, memo, best_moment, want_to_revisit, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      id, data.trip_id, data.entry_date ?? null, emotions,
      data.memo ?? null, data.best_moment ?? null, data.want_to_revisit ?? null,
      now, now,
    ],
  );

  return {
    id, ...data,
    emotions: data.emotions ?? [],
    created_at: now, updated_at: now,
  };
}

// ─── 삭제 ─────────────────────────────────────────────────────────────────────

export async function deleteDiaryEntry(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM diary_entry WHERE id = ?', [id]);
}
