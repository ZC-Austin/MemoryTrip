import { getDb } from '../index';
import { uuid, nowIso } from '../../utils/uuid';
import type { BackupQueueItem, BackupResourceType, SyncStatus, NewBackupQueueItem } from '../../types';

interface BackupRow extends Omit<BackupQueueItem, 'status' | 'resource_type'> {
  status: string;
  resource_type: string;
}

function fromRow(row: BackupRow): BackupQueueItem {
  return {
    ...row,
    status: row.status as SyncStatus,
    resource_type: row.resource_type as BackupResourceType,
  };
}

// ─── 조회 ─────────────────────────────────────────────────────────────────────

// 업로드 대기 / 재시도 가능 항목 — BackupWorker가 주기적으로 호출
export async function getPendingBackupItems(limit = 10): Promise<BackupQueueItem[]> {
  const rows = await getDb().getAllAsync<BackupRow>(
    `SELECT * FROM backup_queue
     WHERE status IN ('pending', 'failed')
       AND (next_retry_at IS NULL OR next_retry_at <= datetime('now'))
     ORDER BY created_at ASC
     LIMIT ?`,
    [limit],
  );
  return rows.map(fromRow);
}

export async function getDeadBackupItems(): Promise<BackupQueueItem[]> {
  const rows = await getDb().getAllAsync<BackupRow>(
    "SELECT * FROM backup_queue WHERE status = 'dead' ORDER BY created_at ASC",
  );
  return rows.map(fromRow);
}

export async function getBackupItemByResourceId(
  resourceId: string,
): Promise<BackupQueueItem | null> {
  const row = await getDb().getFirstAsync<BackupRow>(
    'SELECT * FROM backup_queue WHERE resource_id = ?', [resourceId],
  );
  return row ? fromRow(row) : null;
}

// ─── 삽입 ─────────────────────────────────────────────────────────────────────

export async function insertBackupQueueItem(data: NewBackupQueueItem): Promise<BackupQueueItem> {
  const db = getDb();
  const now = nowIso();
  const id = uuid();

  await db.runAsync(
    `INSERT INTO backup_queue
       (id, resource_type, resource_id, local_path, remote_path,
        status, retry_count, next_retry_at, last_error, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, data.resource_type, data.resource_id, data.local_path,
      data.remote_path ?? null, data.status ?? 'pending',
      data.retry_count ?? 0, data.next_retry_at ?? null,
      data.last_error ?? null, now, now,
    ],
  );

  return {
    ...data,
    id, status: data.status ?? 'pending',
    retry_count: data.retry_count ?? 0,
    created_at: now, updated_at: now,
  };
}

// ─── 상태 갱신 ────────────────────────────────────────────────────────────────

export async function markBackupSyncing(id: string): Promise<void> {
  await getDb().runAsync(
    "UPDATE backup_queue SET status = 'syncing', updated_at = ? WHERE id = ?",
    [nowIso(), id],
  );
}

export async function markBackupSynced(id: string, remotePath: string): Promise<void> {
  await getDb().runAsync(
    `UPDATE backup_queue SET status = 'synced', remote_path = ?, updated_at = ? WHERE id = ?`,
    [remotePath, nowIso(), id],
  );
}

// 지수 백오프 재시도 정책: 30s → 2m → 10m → 1h → 6h → dead
const BACKOFF_SECONDS = [30, 120, 600, 3_600, 21_600];

export async function markBackupFailed(
  id: string,
  error: string,
): Promise<void> {
  const db = getDb();
  const now = nowIso();
  const row = await db.getFirstAsync<{ retry_count: number }>(
    'SELECT retry_count FROM backup_queue WHERE id = ?', [id],
  );
  if (!row) return;

  const retryCount = row.retry_count + 1;
  if (retryCount > BACKOFF_SECONDS.length) {
    await db.runAsync(
      `UPDATE backup_queue
         SET status = 'dead', retry_count = ?, last_error = ?, next_retry_at = NULL, updated_at = ?
       WHERE id = ?`,
      [retryCount, error, now, id],
    );
    return;
  }

  const delaySec = BACKOFF_SECONDS[retryCount - 1] ?? BACKOFF_SECONDS.at(-1)!;
  const nextRetry = new Date(Date.now() + delaySec * 1000).toISOString();

  await db.runAsync(
    `UPDATE backup_queue
       SET status = 'failed', retry_count = ?, last_error = ?, next_retry_at = ?, updated_at = ?
     WHERE id = ?`,
    [retryCount, error, nextRetry, now, id],
  );
}

// ─── 삭제 ─────────────────────────────────────────────────────────────────────

export async function deleteBackupQueueItem(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM backup_queue WHERE id = ?', [id]);
}
