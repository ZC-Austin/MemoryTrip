import { getDb } from '../index';
import { uuid, nowIso } from '../../utils/uuid';
import type { Expense, ExpenseCategory, ExpenseSummary, NewExpense, UpdateExpense } from '../../types';

// ─── 조회 ─────────────────────────────────────────────────────────────────────

export async function getExpensesByTripId(tripId: string): Promise<Expense[]> {
  return getDb().getAllAsync<Expense>(
    'SELECT * FROM expense WHERE trip_id = ? ORDER BY spent_on ASC, created_at ASC',
    [tripId],
  );
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  return getDb().getFirstAsync<Expense>('SELECT * FROM expense WHERE id = ?', [id]);
}

export async function getExpenseSummary(tripId: string): Promise<ExpenseSummary> {
  const db = getDb();

  const [totalRow, categoryRows, tripRow] = await Promise.all([
    db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM expense WHERE trip_id = ?',
      [tripId],
    ),
    db.getAllAsync<{ category: string; total: number }>(
      `SELECT category, SUM(amount) AS total
       FROM expense WHERE trip_id = ?
       GROUP BY category ORDER BY total DESC`,
      [tripId],
    ),
    db.getFirstAsync<{ start_date: string; end_date: string | null }>(
      'SELECT start_date, end_date FROM trip WHERE id = ?',
      [tripId],
    ),
  ]);

  const total = totalRow?.total ?? 0;
  const endDate = tripRow?.end_date ?? new Date().toISOString().slice(0, 10);
  const startDate = tripRow?.start_date ?? endDate;
  const dayCount = Math.max(
    1,
    Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000,
    ) + 1,
  );

  return {
    total,
    daily_avg: dayCount > 0 ? total / dayCount : 0,
    by_category: categoryRows.map(r => ({
      category: r.category as ExpenseCategory,
      total: r.total,
    })),
  };
}

// ─── 삽입 ─────────────────────────────────────────────────────────────────────

export async function insertExpense(data: NewExpense): Promise<Expense> {
  const db = getDb();
  const now = nowIso();
  const id = uuid();

  await db.runAsync(
    `INSERT INTO expense
       (id, trip_id, place_id, category, amount, currency, spent_on, memo, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      id, data.trip_id, data.place_id ?? null,
      data.category, data.amount, data.currency ?? 'KRW',
      data.spent_on ?? null, data.memo ?? null, now, now,
    ],
  );

  return { ...data, id, currency: data.currency ?? 'KRW', created_at: now, updated_at: now };
}

// ─── 수정 ─────────────────────────────────────────────────────────────────────

export async function updateExpense(id: string, data: UpdateExpense): Promise<void> {
  const db = getDb();
  const now = nowIso();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.place_id !== undefined) { fields.push('place_id = ?'); values.push(data.place_id); }
  if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
  if (data.amount   !== undefined) { fields.push('amount = ?');   values.push(data.amount); }
  if (data.currency !== undefined) { fields.push('currency = ?'); values.push(data.currency); }
  if (data.spent_on !== undefined) { fields.push('spent_on = ?'); values.push(data.spent_on); }
  if (data.memo     !== undefined) { fields.push('memo = ?');     values.push(data.memo); }

  if (fields.length === 0) return;
  fields.push('updated_at = ?');
  values.push(now, id);
  await db.runAsync(`UPDATE expense SET ${fields.join(', ')} WHERE id = ?`, values);
}

// ─── 삭제 ─────────────────────────────────────────────────────────────────────

export async function deleteExpense(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM expense WHERE id = ?', [id]);
}

// Place 삭제 시 비용 보존 — place_id만 NULL로 (ON DELETE SET NULL이 처리하지만 명시적 함수 제공)
export async function unlinkExpensesFromPlace(placeId: string): Promise<void> {
  await getDb().runAsync(
    `UPDATE expense SET place_id = NULL, updated_at = ? WHERE place_id = ?`,
    [nowIso(), placeId],
  );
}
