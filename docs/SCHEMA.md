# Memory Trip — SQLite 스키마

본 문서는 [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) 의 엔티티/관계를 SQLite `CREATE TABLE` 문으로 구체화한다.
Phase 1 범위 (`trip` + `camping`).

- 아키텍처/저장 정책: [CLAUDE.md](../CLAUDE.md)
- 도메인 모델: [DOMAIN_MODEL.md](./DOMAIN_MODEL.md)
- 제품 요구사항: [REQUIREMENTS.md](./REQUIREMENTS.md)

---

## 0. 컨벤션

### 0.1 자료형 선택

| 도메인 타입 | SQLite 컬럼 타입 | 비고 |
|---|---|---|
| UUID | `TEXT` | UUID v4 문자열 (36자) |
| 날짜 (YYYY-MM-DD) | `TEXT` | ISO 8601 |
| 일시 (timestamp) | `TEXT` | ISO 8601 with TZ (`2026-05-14T14:23:00+09:00`) |
| boolean | `INTEGER` | 0 / 1 |
| 배열 / 구조체 | `TEXT` | JSON 인코딩 |
| 정수 | `INTEGER` | |
| 금액 / GPS 좌표 | `REAL` | 부동소수 |

> SQLite는 동적 타입이지만 컬럼 타입 affinity로 정렬·캐스팅 동작이 달라지므로 명시한다.

### 0.2 공통 컬럼

대부분 도메인 엔티티에 다음 컬럼을 둔다.
- `id TEXT PRIMARY KEY` — UUID v4
- `created_at TEXT NOT NULL` — 행 생성 시각
- `updated_at TEXT NOT NULL` — 마지막 수정 시각

> `created_at`/`updated_at` 은 앱이 INSERT/UPDATE 시점에 채운다. 트리거는 사용하지 않음 (앱 명시 통제).

### 0.3 문자열 enum 검증

enum 컬럼은 `TEXT` + `CHECK` 제약으로 값 검증.

### 0.4 외래 키 / cascade

PRAGMA로 FK 활성화 필수.
```sql
PRAGMA foreign_keys = ON;
```
- Trip 자식 → `ON DELETE CASCADE`
- Place / Photo 참조 (선택적) → `ON DELETE SET NULL`
- Tag link 양방향 → `ON DELETE CASCADE`

### 0.5 권장 PRAGMA

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;       -- 동시 읽기/쓰기 성능
PRAGMA synchronous = NORMAL;     -- 모바일 적합
PRAGMA temp_store = MEMORY;
```

---

## 1. 테이블 정의

생성 순서는 의존성 역방향(부모 먼저).

### 1.1 `trip`

```sql
CREATE TABLE trip (
  id            TEXT PRIMARY KEY,                          -- UUID v4
  title         TEXT NOT NULL CHECK (length(title) > 0),
  start_date    TEXT NOT NULL,                              -- 'YYYY-MM-DD'
  end_date      TEXT,                                       -- NULL 허용 ("기간 미정")
  trip_type     TEXT NOT NULL CHECK (trip_type IN ('trip', 'camping')),
  country       TEXT,
  city          TEXT,
  gps_lat       REAL,
  gps_lng       REAL,
  purpose       TEXT,
  satisfaction  INTEGER CHECK (satisfaction IS NULL OR satisfaction BETWEEN 1 AND 5),
  summary       TEXT,
  companions    TEXT,                                       -- JSON array, e.g. '["철수","영희"]'
  hero_photo_id TEXT,                                       -- nullable, FK 후속 추가
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  CHECK (end_date IS NULL OR end_date >= start_date)
);

-- hero_photo_id FK는 photo 테이블 생성 후 ALTER로 추가 (순환 참조 회피)
```

### 1.2 `place`

장소 통합 부모 (Lodging/Restaurant/Campsite 공통).

```sql
CREATE TABLE place (
  id          TEXT PRIMARY KEY,
  trip_id     TEXT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('lodging', 'restaurant', 'campsite')),
  name        TEXT NOT NULL CHECK (length(name) > 0),
  gps_lat     REAL,
  gps_lng     REAL,
  visited_at  TEXT,                                         -- ISO timestamp
  rating      INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  pros        TEXT,
  cons        TEXT,
  revisit     INTEGER CHECK (revisit IS NULL OR revisit IN (0, 1)),
  memo        TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

### 1.3 `lodging_details`

```sql
CREATE TABLE lodging_details (
  place_id        TEXT PRIMARY KEY REFERENCES place(id) ON DELETE CASCADE,
  check_in        TEXT,                                     -- 'YYYY-MM-DD'
  check_out       TEXT,
  booking_site    TEXT,
  score_clean     INTEGER CHECK (score_clean    IS NULL OR score_clean    BETWEEN 1 AND 5),
  score_location  INTEGER CHECK (score_location IS NULL OR score_location BETWEEN 1 AND 5),
  score_kindness  INTEGER CHECK (score_kindness IS NULL OR score_kindness BETWEEN 1 AND 5),
  score_value     INTEGER CHECK (score_value    IS NULL OR score_value    BETWEEN 1 AND 5),
  CHECK (check_out IS NULL OR check_in IS NULL OR check_out >= check_in)
);
```

### 1.4 `restaurant_details`

```sql
CREATE TABLE restaurant_details (
  place_id     TEXT PRIMARY KEY REFERENCES place(id) ON DELETE CASCADE,
  menu         TEXT,                                        -- 자유 텍스트 (다중 메뉴는 줄바꿈 또는 JSON)
  wait_minutes INTEGER CHECK (wait_minutes IS NULL OR wait_minutes >= 0)
);
```

### 1.5 `campsite_details`

```sql
CREATE TABLE campsite_details (
  place_id          TEXT PRIMARY KEY REFERENCES place(id) ON DELETE CASCADE,
  check_in          TEXT,
  check_out         TEXT,
  site_no           TEXT,
  camping_type      TEXT CHECK (camping_type IS NULL OR camping_type IN ('auto', 'backpack', 'glamping', 'caravan', 'etc')),
  has_electricity   INTEGER CHECK (has_electricity IS NULL OR has_electricity IN (0, 1)),
  score_toilet      INTEGER CHECK (score_toilet  IS NULL OR score_toilet  BETWEEN 1 AND 5),
  score_shower      INTEGER CHECK (score_shower  IS NULL OR score_shower  BETWEEN 1 AND 5),
  score_quiet       INTEGER CHECK (score_quiet   IS NULL OR score_quiet   BETWEEN 1 AND 5),
  score_view        INTEGER CHECK (score_view    IS NULL OR score_view    BETWEEN 1 AND 5),
  score_manner      INTEGER CHECK (score_manner  IS NULL OR score_manner  BETWEEN 1 AND 5),
  bug_level         TEXT CHECK (bug_level IS NULL OR bug_level IN ('none', 'few', 'some', 'many')),
  recommend_family  INTEGER CHECK (recommend_family IS NULL OR recommend_family IN (0, 1)),
  recommend_solo    INTEGER CHECK (recommend_solo   IS NULL OR recommend_solo   IN (0, 1)),
  CHECK (check_out IS NULL OR check_in IS NULL OR check_out >= check_in)
);
```

### 1.6 `photo`

```sql
CREATE TABLE photo (
  id              TEXT PRIMARY KEY,
  trip_id         TEXT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
  place_id        TEXT REFERENCES place(id) ON DELETE SET NULL,
  local_path      TEXT NOT NULL,                            -- ${doc}photos/{tripId}/{photoId}.jpg
  thumb_path      TEXT,                                     -- 썸네일 경로 (옵션)
  memo            TEXT,
  gps_lat         REAL,
  gps_lng         REAL,
  location_source TEXT CHECK (location_source IS NULL OR location_source IN ('exif', 'gps', 'manual')),
  taken_at        TEXT,                                     -- ISO timestamp
  sync_status     TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed', 'dead')),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- 이제 trip.hero_photo_id 의 FK 추가
-- (SQLite는 ALTER TABLE ... ADD CONSTRAINT 미지원 → 마이그레이션 시 테이블 재생성으로 처리)
-- 실제로는 앱 레벨 무결성으로 충분. NOT ENFORCED 컬럼.
```

> SQLite는 `ALTER TABLE ADD CONSTRAINT` 를 지원하지 않으므로 `trip.hero_photo_id` FK는 런타임 검증으로 둔다 (Photo 삭제 시 앱이 trip.hero_photo_id를 직접 NULL로 업데이트).

### 1.7 `expense`

```sql
CREATE TABLE expense (
  id          TEXT PRIMARY KEY,
  trip_id     TEXT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
  place_id    TEXT REFERENCES place(id) ON DELETE SET NULL,
  category    TEXT NOT NULL CHECK (category IN ('lodging', 'transport', 'food', 'cafe', 'shopping', 'campsite', 'equipment', 'etc')),
  amount      REAL NOT NULL CHECK (amount >= 0),
  currency    TEXT NOT NULL DEFAULT 'KRW',                 -- ISO 4217
  spent_on    TEXT,                                         -- 'YYYY-MM-DD' (옵션)
  memo        TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

### 1.8 `transportation`

```sql
CREATE TABLE transportation (
  id          TEXT PRIMARY KEY,
  trip_id     TEXT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
  mode        TEXT NOT NULL CHECK (mode IN ('walk', 'car', 'public', 'air', 'rail', 'etc')),
  fatigue     INTEGER CHECK (fatigue IS NULL OR fatigue BETWEEN 1 AND 5),
  memo        TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

### 1.9 `equipment_record`

```sql
CREATE TABLE equipment_record (
  id                TEXT PRIMARY KEY,
  trip_id           TEXT NOT NULL UNIQUE REFERENCES trip(id) ON DELETE CASCADE,  -- 1:1
  used_items        TEXT,                                   -- JSON array
  missing_items     TEXT,                                   -- JSON array
  next_time_items   TEXT,                                   -- JSON array
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
```

### 1.10 `diary_entry`

```sql
CREATE TABLE diary_entry (
  id              TEXT PRIMARY KEY,
  trip_id         TEXT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
  entry_date      TEXT,                                     -- 'YYYY-MM-DD' or NULL (=trip-level 종합)
  emotions        TEXT,                                     -- JSON array, e.g. '["행복","힐링"]'
  memo            TEXT,
  best_moment     TEXT,                                     -- trip-level 또는 일자별
  want_to_revisit TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- (trip_id, entry_date) UNIQUE — entry_date NULL인 trip-level 행도 trip당 1건
-- SQLite는 NULL을 모두 다른 값으로 취급 → COALESCE 트릭 사용
CREATE UNIQUE INDEX idx_diary_entry_unique
  ON diary_entry(trip_id, COALESCE(entry_date, ''));
```

### 1.11 `tag`

```sql
CREATE TABLE tag (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL CHECK (length(name) > 0),
  category    TEXT,                                         -- 'style' | 'feature' | 'season' | 'mood' | NULL
  created_at  TEXT NOT NULL
);

-- name + (category 또는 빈 문자열) UNIQUE
CREATE UNIQUE INDEX idx_tag_name_category
  ON tag(name, COALESCE(category, ''));
```

### 1.12 Tag link 테이블 (3개)

```sql
CREATE TABLE trip_tag (
  trip_id  TEXT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tag(id)  ON DELETE CASCADE,
  PRIMARY KEY (trip_id, tag_id)
);

CREATE TABLE place_tag (
  place_id TEXT NOT NULL REFERENCES place(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tag(id)   ON DELETE CASCADE,
  PRIMARY KEY (place_id, tag_id)
);

CREATE TABLE photo_tag (
  photo_id TEXT NOT NULL REFERENCES photo(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tag(id)   ON DELETE CASCADE,
  PRIMARY KEY (photo_id, tag_id)
);
```

### 1.13 `backup_queue`

사진 / 백업 파일 등 원격 업로드 대상 큐.

```sql
CREATE TABLE backup_queue (
  id           TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('photo', 'db_backup')),
  resource_id  TEXT NOT NULL,                               -- photo.id 또는 백업 파일명
  local_path   TEXT NOT NULL,
  remote_path  TEXT,                                        -- 업로드 완료 후 채움
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'synced', 'failed', 'dead')),
  retry_count  INTEGER NOT NULL DEFAULT 0,
  next_retry_at TEXT,                                       -- ISO timestamp, 백오프
  last_error   TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
```

---

## 2. 인덱스

### 2.1 외래 키 인덱스

SQLite는 FK 컬럼에 자동 인덱스를 만들지 않으므로 명시한다.

```sql
CREATE INDEX idx_place_trip            ON place(trip_id);
CREATE INDEX idx_photo_trip            ON photo(trip_id);
CREATE INDEX idx_photo_place           ON photo(place_id);
CREATE INDEX idx_expense_trip          ON expense(trip_id);
CREATE INDEX idx_expense_place         ON expense(place_id);
CREATE INDEX idx_transportation_trip   ON transportation(trip_id);
CREATE INDEX idx_diary_trip            ON diary_entry(trip_id);
CREATE INDEX idx_trip_tag_tag          ON trip_tag(tag_id);
CREATE INDEX idx_place_tag_tag         ON place_tag(tag_id);
CREATE INDEX idx_photo_tag_tag         ON photo_tag(tag_id);
```

### 2.2 쿼리 패턴 인덱스

```sql
-- 목록 정렬: 최근순 (updated_at DESC)
CREATE INDEX idx_trip_updated_at ON trip(updated_at DESC);

-- 시작일/종료일 범위 쿼리 (status derive)
CREATE INDEX idx_trip_start_end  ON trip(start_date, end_date);

-- 사진 갤러리: 날짜순 정렬
CREATE INDEX idx_photo_taken_at  ON photo(trip_id, taken_at);

-- 비용 카테고리별 합산
CREATE INDEX idx_expense_category ON expense(trip_id, category);

-- 동기화 큐: 대기 중인 항목 빠른 조회
CREATE INDEX idx_backup_queue_status ON backup_queue(status, next_retry_at);
```

---

## 3. 트리거 (선택적)

Phase 1 은 앱 레벨에서 처리하지만, 안정성을 위해 일부는 트리거로 자동화할 수 있다.

### 3.1 사진 INSERT 시 backup_queue 자동 등록

```sql
CREATE TRIGGER trg_photo_insert_backup
AFTER INSERT ON photo
WHEN NEW.sync_status = 'pending'
BEGIN
  INSERT INTO backup_queue (id, resource_type, resource_id, local_path, status, retry_count, created_at, updated_at)
  VALUES (
    lower(hex(randomblob(16))),  -- UUID 임시 생성 (더 나은 방법은 앱에서 UUID 주입)
    'photo',
    NEW.id,
    NEW.local_path,
    'pending',
    0,
    datetime('now'),
    datetime('now')
  );
END;
```

> 권장: UUID 생성은 앱이 주입하는 것이 안정적. 트리거의 randomblob은 fallback.

### 3.2 사진 DELETE 시 backup_queue 정리

```sql
CREATE TRIGGER trg_photo_delete_backup
AFTER DELETE ON photo
BEGIN
  DELETE FROM backup_queue WHERE resource_type = 'photo' AND resource_id = OLD.id;
END;
```

### 3.3 Place 삭제 시 trip.hero_photo_id 정리

`hero_photo_id`는 photo를 직접 가리키지만, place 삭제로 photo가 cascade되면 hero_photo_id가 stale 됨.
앱 레벨에서 Place 삭제 트랜잭션에 포함하거나, 다음 트리거 사용:

```sql
CREATE TRIGGER trg_photo_delete_clear_hero
AFTER DELETE ON photo
BEGIN
  UPDATE trip SET hero_photo_id = NULL, updated_at = datetime('now')
  WHERE hero_photo_id = OLD.id;
END;
```

---

## 4. 자주 쓰는 쿼리

### 4.1 Trip 상태 derive (날짜 기반)

```sql
-- 오늘 기준 상태
SELECT
  id, title, trip_type, start_date, end_date,
  CASE
    WHEN start_date > date('now')                                                      THEN 'planned'
    WHEN start_date <= date('now') AND (end_date IS NULL OR end_date >= date('now')) THEN 'in_progress'
    WHEN end_date IS NOT NULL AND end_date < date('now')                              THEN 'completed'
  END AS status
FROM trip;
```

### 4.2 진행 중 vs 종료일 미정 구분 (최근 14일 활동)

```sql
WITH last_activity AS (
  SELECT trip_id, MAX(updated_at) AS last_at FROM (
    SELECT trip_id, updated_at FROM photo
    UNION ALL SELECT trip_id, updated_at FROM place
    UNION ALL SELECT trip_id, updated_at FROM expense
    UNION ALL SELECT trip_id, updated_at FROM diary_entry
  ) GROUP BY trip_id
)
SELECT t.*, la.last_at,
  CASE
    WHEN t.start_date <= date('now')
     AND (t.end_date IS NULL OR t.end_date >= date('now'))
     AND COALESCE(la.last_at, t.updated_at) >= datetime('now', '-14 days')
      THEN 'in_progress'
    WHEN t.end_date IS NULL AND COALESCE(la.last_at, t.updated_at) < datetime('now', '-14 days')
      THEN 'no_end_date'
    ELSE NULL
  END AS list_status
FROM trip t
LEFT JOIN last_activity la ON t.id = la.trip_id;
```

### 4.3 Trip 총 비용 / 카테고리별

```sql
-- 총 비용
SELECT SUM(amount) FROM expense WHERE trip_id = ?;

-- 카테고리별
SELECT category, SUM(amount) AS total
FROM expense WHERE trip_id = ?
GROUP BY category ORDER BY total DESC;

-- 1일 평균 (end_date 있을 때만 의미)
SELECT
  (SELECT SUM(amount) FROM expense WHERE trip_id = t.id) * 1.0
  / (julianday(t.end_date) - julianday(t.start_date) + 1) AS daily_avg
FROM trip t WHERE t.id = ?;
```

### 4.4 Place + details join (타입별)

```sql
-- 한 여행의 모든 숙소
SELECT p.*, ld.check_in, ld.check_out, ld.booking_site, ld.score_clean
FROM place p
JOIN lodging_details ld ON p.id = ld.place_id
WHERE p.trip_id = ? AND p.type = 'lodging'
ORDER BY p.visited_at;

-- 한 여행의 모든 캠핑장
SELECT p.*, cd.site_no, cd.camping_type, cd.has_electricity, cd.score_quiet
FROM place p
JOIN campsite_details cd ON p.id = cd.place_id
WHERE p.trip_id = ? AND p.type = 'campsite';
```

### 4.5 사진 갤러리 (날짜순 그룹)

```sql
SELECT
  date(taken_at) AS day,
  COUNT(*) AS cnt
FROM photo
WHERE trip_id = ?
GROUP BY date(taken_at)
ORDER BY day DESC;

-- 특정 일자 사진들
SELECT * FROM photo
WHERE trip_id = ? AND date(taken_at) = ?
ORDER BY taken_at;
```

### 4.6 다음 백업 큐 항목 가져오기

```sql
SELECT * FROM backup_queue
WHERE status IN ('pending', 'failed')
  AND (next_retry_at IS NULL OR next_retry_at <= datetime('now'))
ORDER BY created_at
LIMIT 10;
```

---

## 5. 마이그레이션 패턴

### 5.1 버전 관리

```sql
CREATE TABLE schema_version (
  version    INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

INSERT INTO schema_version (version, applied_at) VALUES (1, datetime('now'));
```

앱 부팅 시 `MAX(version)` 조회 → 필요한 마이그레이션 순차 실행.

### 5.2 Phase 2+ 형태 추가 시

새 형태(`hiking`, `car_camping` 등) 추가는 다음만 필요 — **기존 테이블 변경 없음**.

```sql
-- 1. trip.trip_type CHECK 제약 갱신 (테이블 재생성 필요)
-- 2. place.type CHECK 제약 갱신
-- 3. 새 details 테이블 추가
CREATE TABLE hiking_details (
  place_id          TEXT PRIMARY KEY REFERENCES place(id) ON DELETE CASCADE,
  course_name       TEXT,
  distance_km       REAL,
  elevation_gain_m  INTEGER,
  difficulty        TEXT CHECK (difficulty IN ('easy', 'moderate', 'hard', 'expert')),
  reached_summit    INTEGER CHECK (reached_summit IN (0, 1))
);
```

### 5.3 SQLite CHECK 제약 변경

SQLite는 `ALTER TABLE ... DROP CONSTRAINT` 를 지원하지 않음. CHECK 변경은 다음 패턴.

```sql
BEGIN;
  CREATE TABLE trip_new (...);                      -- 새 정의
  INSERT INTO trip_new SELECT * FROM trip;          -- 데이터 복사
  DROP TABLE trip;
  ALTER TABLE trip_new RENAME TO trip;
  -- 인덱스/트리거 재생성
COMMIT;
```

---

## 6. ER 요약

```
trip (1) ─┬─ place (N)
          │   ├─ lodging_details (0..1)
          │   ├─ restaurant_details (0..1)
          │   └─ campsite_details (0..1)
          ├─ photo (N) ─ (place_id 옵션)
          ├─ expense (N) ─ (place_id 옵션)
          ├─ transportation (N)
          ├─ equipment_record (0..1)
          ├─ diary_entry (N)
          └─ trip_tag (N) ─ tag (N)

place ─ place_tag (N) ─ tag
photo ─ photo_tag (N) ─ tag

backup_queue : 독립 (resource_type + resource_id 로 사진/DB 백업 참조)
```

---

## 7. 다음 단계

1. `src/db/migrations/0001_init.sql` — 본 스키마를 마이그레이션 파일로
2. `src/db/index.ts` — DB 초기화 / 마이그레이션 러너
3. `src/db/queries/` — 도메인별 쿼리 함수 (trip, place, photo, expense, diary, tag)
4. `src/types/` — 본 스키마에 대응하는 TypeScript 타입 정의
5. `src/services/backup/` — backup_queue 워커 (지수 백오프, 재시도)
