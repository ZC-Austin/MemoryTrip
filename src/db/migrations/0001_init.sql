-- Memory Trip — Phase 1 초기 스키마
-- 적용: src/db/migrations/index.ts 의 migration v1

-- ─── 핵심 테이블 ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trip (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL CHECK (length(title) > 0),
  start_date    TEXT NOT NULL,
  end_date      TEXT,
  trip_type     TEXT NOT NULL CHECK (trip_type IN ('trip', 'camping')),
  country       TEXT,
  city          TEXT,
  gps_lat       REAL,
  gps_lng       REAL,
  purpose       TEXT,
  satisfaction  INTEGER CHECK (satisfaction IS NULL OR satisfaction BETWEEN 1 AND 5),
  summary       TEXT,
  companions    TEXT,
  hero_photo_id TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS place (
  id          TEXT PRIMARY KEY,
  trip_id     TEXT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('lodging', 'restaurant', 'campsite')),
  name        TEXT NOT NULL CHECK (length(name) > 0),
  gps_lat     REAL,
  gps_lng     REAL,
  visited_at  TEXT,
  rating      INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  pros        TEXT,
  cons        TEXT,
  revisit     INTEGER CHECK (revisit IS NULL OR revisit IN (0, 1)),
  memo        TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lodging_details (
  place_id        TEXT PRIMARY KEY REFERENCES place(id) ON DELETE CASCADE,
  check_in        TEXT,
  check_out       TEXT,
  booking_site    TEXT,
  score_clean     INTEGER CHECK (score_clean    IS NULL OR score_clean    BETWEEN 1 AND 5),
  score_location  INTEGER CHECK (score_location IS NULL OR score_location BETWEEN 1 AND 5),
  score_kindness  INTEGER CHECK (score_kindness IS NULL OR score_kindness BETWEEN 1 AND 5),
  score_value     INTEGER CHECK (score_value    IS NULL OR score_value    BETWEEN 1 AND 5),
  CHECK (check_out IS NULL OR check_in IS NULL OR check_out >= check_in)
);

CREATE TABLE IF NOT EXISTS restaurant_details (
  place_id     TEXT PRIMARY KEY REFERENCES place(id) ON DELETE CASCADE,
  menu         TEXT,
  wait_minutes INTEGER CHECK (wait_minutes IS NULL OR wait_minutes >= 0)
);

CREATE TABLE IF NOT EXISTS campsite_details (
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

CREATE TABLE IF NOT EXISTS photo (
  id              TEXT PRIMARY KEY,
  trip_id         TEXT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
  place_id        TEXT REFERENCES place(id) ON DELETE SET NULL,
  local_path      TEXT NOT NULL,
  thumb_path      TEXT,
  memo            TEXT,
  gps_lat         REAL,
  gps_lng         REAL,
  location_source TEXT CHECK (location_source IS NULL OR location_source IN ('exif', 'gps', 'manual')),
  taken_at        TEXT,
  sync_status     TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed', 'dead')),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expense (
  id          TEXT PRIMARY KEY,
  trip_id     TEXT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
  place_id    TEXT REFERENCES place(id) ON DELETE SET NULL,
  category    TEXT NOT NULL CHECK (category IN ('lodging', 'transport', 'food', 'cafe', 'shopping', 'campsite', 'equipment', 'etc')),
  amount      REAL NOT NULL CHECK (amount >= 0),
  currency    TEXT NOT NULL DEFAULT 'KRW',
  spent_on    TEXT,
  memo        TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transportation (
  id          TEXT PRIMARY KEY,
  trip_id     TEXT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
  mode        TEXT NOT NULL CHECK (mode IN ('walk', 'car', 'public', 'air', 'rail', 'etc')),
  fatigue     INTEGER CHECK (fatigue IS NULL OR fatigue BETWEEN 1 AND 5),
  memo        TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS equipment_record (
  id                TEXT PRIMARY KEY,
  trip_id           TEXT NOT NULL UNIQUE REFERENCES trip(id) ON DELETE CASCADE,
  used_items        TEXT,
  missing_items     TEXT,
  next_time_items   TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS diary_entry (
  id              TEXT PRIMARY KEY,
  trip_id         TEXT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
  entry_date      TEXT,
  emotions        TEXT,
  memo            TEXT,
  best_moment     TEXT,
  want_to_revisit TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tag (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL CHECK (length(name) > 0),
  category    TEXT,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trip_tag (
  trip_id  TEXT NOT NULL REFERENCES trip(id)  ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tag(id)   ON DELETE CASCADE,
  PRIMARY KEY (trip_id, tag_id)
);

CREATE TABLE IF NOT EXISTS place_tag (
  place_id TEXT NOT NULL REFERENCES place(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tag(id)   ON DELETE CASCADE,
  PRIMARY KEY (place_id, tag_id)
);

CREATE TABLE IF NOT EXISTS photo_tag (
  photo_id TEXT NOT NULL REFERENCES photo(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tag(id)   ON DELETE CASCADE,
  PRIMARY KEY (photo_id, tag_id)
);

CREATE TABLE IF NOT EXISTS backup_queue (
  id            TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('photo', 'db_backup')),
  resource_id   TEXT NOT NULL,
  local_path    TEXT NOT NULL,
  remote_path   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'synced', 'failed', 'dead')),
  retry_count   INTEGER NOT NULL DEFAULT 0,
  next_retry_at TEXT,
  last_error    TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- ─── 인덱스 ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_place_trip            ON place(trip_id);
CREATE INDEX IF NOT EXISTS idx_photo_trip            ON photo(trip_id);
CREATE INDEX IF NOT EXISTS idx_photo_place           ON photo(place_id);
CREATE INDEX IF NOT EXISTS idx_expense_trip          ON expense(trip_id);
CREATE INDEX IF NOT EXISTS idx_expense_place         ON expense(place_id);
CREATE INDEX IF NOT EXISTS idx_transportation_trip   ON transportation(trip_id);
CREATE INDEX IF NOT EXISTS idx_diary_trip            ON diary_entry(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_tag_tag          ON trip_tag(tag_id);
CREATE INDEX IF NOT EXISTS idx_place_tag_tag         ON place_tag(tag_id);
CREATE INDEX IF NOT EXISTS idx_photo_tag_tag         ON photo_tag(tag_id);
CREATE INDEX IF NOT EXISTS idx_trip_updated_at       ON trip(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_start_end        ON trip(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_photo_taken_at        ON photo(trip_id, taken_at);
CREATE INDEX IF NOT EXISTS idx_expense_category      ON expense(trip_id, category);
CREATE INDEX IF NOT EXISTS idx_backup_queue_status   ON backup_queue(status, next_retry_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_diary_entry_unique
  ON diary_entry(trip_id, COALESCE(entry_date, ''));

CREATE UNIQUE INDEX IF NOT EXISTS idx_tag_name_category
  ON tag(name, COALESCE(category, ''));

-- ─── 트리거 ───────────────────────────────────────────────────────────────────

CREATE TRIGGER IF NOT EXISTS trg_photo_delete_clear_hero
AFTER DELETE ON photo
BEGIN
  UPDATE trip SET hero_photo_id = NULL, updated_at = datetime('now')
  WHERE hero_photo_id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_photo_delete_backup
AFTER DELETE ON photo
BEGIN
  DELETE FROM backup_queue WHERE resource_type = 'photo' AND resource_id = OLD.id;
END;
