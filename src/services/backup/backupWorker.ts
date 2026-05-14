/**
 * BackupWorker — 백업 큐의 pending/failed 항목을 주기적으로 처리한다.
 *
 * Phase 1: 로컬 백업 파일만 처리 (클라우드 업로드는 후속 Phase 에서 구현).
 * 큐 항목의 resource_type 이 'db_backup' 이면 파일 존재 여부를 확인하고
 * 존재하면 synced 로 마킹, 없으면 failed 로 마킹한다.
 */
import * as FileSystem from 'expo-file-system/legacy';
import {
  getPendingBackupItems,
  markBackupSyncing,
  markBackupSynced,
  markBackupFailed,
} from '../../db/queries/backup';
import { pruneOldBackups } from './index';

const POLL_INTERVAL_MS = 30_000; // 30초

async function processNextBatch(): Promise<void> {
  const items = await getPendingBackupItems(5);

  for (const item of items) {
    try {
      await markBackupSyncing(item.id);

      if (item.resource_type === 'db_backup') {
        const info = await FileSystem.getInfoAsync(item.local_path);
        if (!info.exists) {
          await markBackupFailed(item.id, '로컬 백업 파일을 찾을 수 없음');
          continue;
        }
        // Phase 1: 로컬 확인만. remote_path 는 local_path 로 기록.
        await markBackupSynced(item.id, item.local_path);
      } else if (item.resource_type === 'photo') {
        const info = await FileSystem.getInfoAsync(item.local_path);
        if (!info.exists) {
          await markBackupFailed(item.id, '사진 파일을 찾을 수 없음');
          continue;
        }
        // Phase 1: 로컬 파일 확인 후 synced
        await markBackupSynced(item.id, item.local_path);
      } else {
        await markBackupFailed(item.id, `알 수 없는 resource_type: ${item.resource_type}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await markBackupFailed(item.id, msg);
    }
  }

  // 오래된 백업 정리
  await pruneOldBackups();
}

export function startWorker(): () => void {
  let active = true;

  const tick = async () => {
    if (!active) return;
    try {
      await processNextBatch();
    } catch {
      // 워커 자체가 죽지 않도록 에러 흡수
    }
    if (active) {
      setTimeout(tick, POLL_INTERVAL_MS);
    }
  };

  // 첫 실행은 약간 딜레이 후 (앱 초기화 완료 대기)
  setTimeout(tick, 5_000);

  return () => { active = false; };
}
