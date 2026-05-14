import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error('DB not initialized. Call initDb() first.');
  return _db;
}

export async function initDb(): Promise<void> {
  const db = SQLite.openDatabaseSync('memorytrip.db');

  // WAL 모드 + FK 활성화. execAsync는 세미콜론 구분 다중 문 지원.
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA temp_store = MEMORY;
  `);

  await runMigrations(db);
  _db = db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number | null }>(
    'SELECT MAX(version) AS version FROM schema_version',
  );
  const current = row?.version ?? 0;

  for (const { version, sql } of migrations) {
    if (version > current) {
      await db.withTransactionAsync(async () => {
        await db.execAsync(sql);
        await db.runAsync(
          'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
          [version, new Date().toISOString()],
        );
      });
    }
  }
}

// 여러 쿼리를 하나의 트랜잭션으로 묶을 때 사용.
// services/ 또는 화면에서 복합 INSERT 시 이것으로 래핑.
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const db = getDb();
  let result!: T;
  await db.withTransactionAsync(async () => {
    result = await fn();
  });
  return result;
}
