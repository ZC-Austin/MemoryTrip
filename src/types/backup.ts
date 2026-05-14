import type { SyncStatus } from './photo';

export type BackupResourceType = 'photo' | 'db_backup';

export interface BackupQueueItem {
  id: string;
  resource_type: BackupResourceType;
  resource_id: string;       // photo.id 또는 백업 파일명
  local_path: string;
  remote_path: string | null; // 업로드 완료 후 채움
  status: SyncStatus;
  retry_count: number;
  next_retry_at: string | null; // ISO timestamp
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export type NewBackupQueueItem = Omit<BackupQueueItem, 'id' | 'created_at' | 'updated_at'>;
