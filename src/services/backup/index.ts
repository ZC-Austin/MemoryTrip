import * as FileSystem from 'expo-file-system/legacy';
import { getDb } from '../../db';
import {
  insertBackupQueueItem,
  getBackupItemByResourceId,
} from '../../db/queries/backup';
import { nowIso } from '../../utils/uuid';

// 파일명에서 안정적인 ID 생성 (예: memory_trip_backup_20260514.db → 20260514)
function stableIdFromFileName(fileName: string): string {
  return fileName.replace('memory_trip_backup_', '').replace('.db', '');
}

// ─── Paths ────────────────────────────────────────────────────────────────────

export function getBackupDir(): string {
  return `${FileSystem.documentDirectory}backups/`;
}

export function buildBackupFileName(date: Date = new Date()): string {
  const y  = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d  = String(date.getDate()).padStart(2, '0');
  return `memory_trip_backup_${y}${mo}${d}.db`;
}

function getBackupPath(fileName: string): string {
  return `${getBackupDir()}${fileName}`;
}

// ─── DB path ──────────────────────────────────────────────────────────────────

function getDbSourcePath(): string {
  return `${FileSystem.documentDirectory}SQLite/memorytrip.db`;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export interface BackupRecord {
  id:         string;
  fileName:   string;
  localPath:  string;
  sizeBytes:  number;
  createdAt:  string;
}

export async function createLocalBackup(): Promise<BackupRecord> {
  const backupDir = getBackupDir();
  const info = await FileSystem.getInfoAsync(backupDir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
  }

  // Checkpoint WAL so the backup file is complete
  try { getDb().execSync('PRAGMA wal_checkpoint(FULL);'); } catch { /* ignore */ }

  const fileName   = buildBackupFileName();
  const localPath  = getBackupPath(fileName);
  const srcPath    = getDbSourcePath();

  await FileSystem.copyAsync({ from: srcPath, to: localPath });

  const fileInfo = await FileSystem.getInfoAsync(localPath, { size: true });
  const sizeBytes = (fileInfo.exists && 'size' in fileInfo) ? (fileInfo.size ?? 0) : 0;
  const createdAt = nowIso();

  return { id: stableIdFromFileName(fileName), fileName, localPath, sizeBytes, createdAt };
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listLocalBackups(): Promise<BackupRecord[]> {
  const dir = getBackupDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) return [];

  const entries = await FileSystem.readDirectoryAsync(dir);
  const records: BackupRecord[] = [];

  for (const entry of entries) {
    if (!entry.startsWith('memory_trip_backup_') || !entry.endsWith('.db')) continue;
    const localPath = getBackupPath(entry);
    const fileInfo  = await FileSystem.getInfoAsync(localPath, { size: true });
    if (!fileInfo.exists) continue;

    const sizeBytes = ('size' in fileInfo) ? (fileInfo.size ?? 0) : 0;
    // Parse date from filename: memory_trip_backup_YYYYMMDD.db
    const dateStr = entry.replace('memory_trip_backup_', '').replace('.db', '');
    const createdAt = dateStr.length === 8
      ? `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T00:00:00Z`
      : nowIso();

    records.push({ id: stableIdFromFileName(entry), fileName: entry, localPath, sizeBytes, createdAt });
  }

  // Newest first
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ─── Prune ────────────────────────────────────────────────────────────────────

// 보관 정책: 일일 7일 · 주간 4주 · 월간 6개월
export async function pruneOldBackups(): Promise<void> {
  const backups = await listLocalBackups();
  if (backups.length === 0) return;

  const now   = new Date();
  const keep  = new Set<string>();

  // Group by YYYYMMDD key (from fileName)
  const byDay: Record<string, BackupRecord[]> = {};
  for (const b of backups) {
    const key = b.fileName.replace('memory_trip_backup_', '').replace('.db', '');
    (byDay[key] ??= []).push(b);
  }

  const dayKeys = Object.keys(byDay).sort().reverse(); // newest first

  // Daily: last 7
  dayKeys.slice(0, 7).forEach(k => byDay[k].forEach(b => keep.add(b.fileName)));

  // Weekly: one per week for last 4 weeks (Sunday as week anchor)
  const weeksKept = new Set<number>();
  for (const key of dayKeys) {
    if (weeksKept.size >= 4) break;
    const d = new Date(`${key.slice(0,4)}-${key.slice(4,6)}-${key.slice(6,8)}`);
    const msAgo  = now.getTime() - d.getTime();
    const daysAgo = msAgo / 86_400_000;
    if (daysAgo > 7 && daysAgo <= 28) {
      // Week number
      const weekNum = Math.floor(daysAgo / 7);
      if (!weeksKept.has(weekNum)) {
        weeksKept.add(weekNum);
        byDay[key].forEach(b => keep.add(b.fileName));
      }
    }
  }

  // Monthly: one per month for last 6 months
  const monthsKept = new Set<string>();
  for (const key of dayKeys) {
    if (monthsKept.size >= 6) break;
    const monthKey = key.slice(0, 6); // YYYYMM
    const d = new Date(`${key.slice(0,4)}-${key.slice(4,6)}-${key.slice(6,8)}`);
    const msAgo   = now.getTime() - d.getTime();
    const daysAgo = msAgo / 86_400_000;
    if (daysAgo > 28 && !monthsKept.has(monthKey)) {
      monthsKept.add(monthKey);
      byDay[key].forEach(b => keep.add(b.fileName));
    }
  }

  // Delete anything not kept
  for (const b of backups) {
    if (!keep.has(b.fileName)) {
      await FileSystem.deleteAsync(b.localPath, { idempotent: true });
    }
  }
}

// ─── Restore ──────────────────────────────────────────────────────────────────

export async function restoreFromBackup(record: BackupRecord): Promise<void> {
  const srcPath = record.localPath;
  const destPath = getDbSourcePath();

  const info = await FileSystem.getInfoAsync(srcPath);
  if (!info.exists) throw new Error('백업 파일을 찾을 수 없어요.');

  await FileSystem.copyAsync({ from: srcPath, to: destPath });
}

// ─── Enqueue ──────────────────────────────────────────────────────────────────

export async function enqueueDbBackup(record: BackupRecord): Promise<void> {
  // 이미 큐에 있으면 중복 등록 방지
  const existing = await getBackupItemByResourceId(record.id);
  if (existing && existing.status !== 'dead') return;

  await insertBackupQueueItem({
    resource_type: 'db_backup',
    resource_id:   record.id,
    local_path:    record.localPath,
    remote_path:   null,
    status:        'pending',
    retry_count:   0,
    next_retry_at: null,
    last_error:    null,
  });
}
