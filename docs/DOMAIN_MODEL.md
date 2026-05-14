# Memory Trip — 도메인 모델

본 문서는 Memory Trip의 **데이터 엔티티와 그 관계**를 정의한다.
- 무엇이 공통이고 무엇이 형태 전용인가
- 무엇이 무엇에 의존하는가
- 어떤 필드가 필수이고 어떤 필드가 선택인가

기능/화면 명세는 [REQUIREMENTS.md](./REQUIREMENTS.md), 아키텍처/저장 정책은 [CLAUDE.md](../CLAUDE.md) 참조.

---

## 0. 핵심 설계 결정 (요약)

이후 섹션을 이해하기 전에 알아둘 결정들.

1. **비용은 `Expense` 한 테이블로 일원화.** 다른 테이블 어디에도 비용 컬럼 없음. 입력 UX는 한 폼에서 받되 저장 시 자동으로 Expense 행으로 변환.
2. **모든 "장소"는 `Place` + `xxx_details` 분리 구조.** Lodging/Restaurant/Campsite는 Place의 한 타입.
3. **감정/일자 메모는 `DiaryEntry` 로 통합.** `date NULL` = 여행 전체 종합 기록 (가장 기억에 남는 순간 / 다시 가고 싶은 장소 등 trip-level 자유 텍스트도 여기로).
4. **`Tag`는 전역 + Trip/Place/Photo 모두 태그 가능 + 카테고리 옵션.** 연결은 3개의 join 테이블 (`trip_tag`, `place_tag`, `photo_tag`) — DB가 무결성 보장.
5. **Companion은 `Trip.companions` JSON 배열 컬럼.** 별도 테이블 없음. 통계 필요해지면 Phase 2+ 정규화.
6. **통화는 `Expense.currency NOT NULL DEFAULT 'KRW'`.** Phase 1은 단일 통화지만 컬럼은 미리 둠.
7. **Photo 위치는 단일 `gps_lat/lng` + `location_source`.** 출처(`exif|gps|manual`) 추적 가능.
8. **Place 방문 시점은 `visited_at` 단일 timestamp.** 체크인/체크아웃 같은 기간 정보는 `LodgingDetails`/`CampsiteDetails` 로.
9. **평점 미입력은 `NULL`** (0 아님). "0점 평가"와 "평가 안 함"을 구분.
10. **여행 진입점: 홈 메인 CTA "출발".** 클릭 → 바텀 시트 모달(제목+형태+시작일 3필드) → Trip 생성 → 진행 중 상세 화면 직행. 시작일을 자유 입력하므로 출발 전 / 도착 후 / 사후 등록 모두 동일 진입점. 보조: "사진으로 만들기"(Phase 1) / 자동 제안(Phase 2+).
11. **Trip 상태는 `status` 컬럼 없이 날짜만으로 derive.** 별도 상태 컬럼 X. **종료일 입력 = 마무리 액션** (satisfaction 무관).
    - `start_date > today` → **예정**
    - `start_date <= today` 그리고 (`end_date IS NULL` 또는 `today <= end_date`) → **진행 중**
    - `end_date IS NOT NULL` 그리고 `end_date < today` → **완료**
    - 즉, 종료일을 입력하지 않으면 영원히 진행 중. 종료일 입력 시점이 의식적인 "끝남" 선언.
    - satisfaction / summary / best_moment 등 회고 데이터는 **의무 아니라 선택** — 언제든 입력/수정 가능.
12. **`start_date` 필수, `end_date` NULLable.** end_date는 사용자가 마무리 시점에 입력 (또는 생성 시 미리 입력 가능).

---

## 1. 엔티티 분류

엔티티를 **공통 / 여행 전용 / 캠핑 전용** 3개 그룹으로 나눈다.

### 1.1 공통 엔티티 (모든 형태)

| 엔티티 | 카디널리티 | 설명 |
|---|---|---|
| `Trip` | (루트) | 여행 한 건. `companions` JSON 컬럼 포함 |
| `Place` | Trip 1 ─ N | 장소 (숙소/식당/캠핑장 등 통합) |
| `Photo` | Trip 1 ─ N | 사진. 선택적으로 Place에 연결 |
| `Expense` | Trip 1 ─ N | 비용. 선택적으로 Place에 연결 |
| `DiaryEntry` | Trip 1 ─ N | 일기 (감정 + 메모 + best_moment + want_to_revisit). `date NULL` 가능 |
| `Tag` | (전역) | 전역 태그. category 옵션 |
| `TripTag` | Trip N ─ N Tag | Trip ↔ Tag 연결 |
| `PlaceTag` | Place N ─ N Tag | Place ↔ Tag 연결 |
| `PhotoTag` | Photo N ─ N Tag | Photo ↔ Tag 연결 |

### 1.2 여행 전용 엔티티 (`trip_type = 'trip'`)

| 엔티티 | 카디널리티 | 설명 |
|---|---|---|
| `LodgingDetails` | Place(type='lodging') 1 ─ 1 | 숙소 전용 상세 (check_in/out 포함) |
| `RestaurantDetails` | Place(type='restaurant') 1 ─ 1 | 식당 전용 상세 |
| `Transportation` | Trip 1 ─ N | 이동 구간 |

### 1.3 캠핑 전용 엔티티 (`trip_type = 'camping'`)

| 엔티티 | 카디널리티 | 설명 |
|---|---|---|
| `CampsiteDetails` | Place(type='campsite') 1 ─ 1 | 캠핑장 전용 상세 (check_in/out 포함) |
| `EquipmentRecord` | Trip 1 ─ 1 | 장비 기록 |

> "전용"의 의미: 해당 형태의 **생성/수정 화면에서만 폼이 노출**된다. DB 제약은 아님.

---

## 2. ER 다이어그램

```mermaid
erDiagram
    Trip ||--o{ Place : "포함"
    Trip ||--o{ Photo : "포함"
    Trip ||--o{ Expense : "포함"
    Trip ||--o{ DiaryEntry : "포함"
    Trip ||--o{ Transportation : "포함 (trip 전용)"
    Trip ||--o| EquipmentRecord : "포함 (camping 전용)"

    Trip ||--o{ TripTag : ""
    Place ||--o{ PlaceTag : ""
    Photo ||--o{ PhotoTag : ""
    Tag ||--o{ TripTag : ""
    Tag ||--o{ PlaceTag : ""
    Tag ||--o{ PhotoTag : ""

    Place ||--o| LodgingDetails : "type=lodging"
    Place ||--o| RestaurantDetails : "type=restaurant"
    Place ||--o| CampsiteDetails : "type=campsite"

    Photo }o--o| Place : "선택적 연결"
    Expense }o--o| Place : "선택적 연결"

    Trip {
        uuid id PK
        string title
        date start_date
        date end_date "NULLable"
        string trip_type "trip|camping"
        string country
        string city
        float gps_lat
        float gps_lng
        string purpose
        int satisfaction "1-5, NULLable"
        string summary
        string companions "JSON array"
        uuid hero_photo_id FK
        timestamp created_at
        timestamp updated_at
    }

    Place {
        uuid id PK
        uuid trip_id FK
        string type "lodging|restaurant|campsite"
        string name
        float gps_lat
        float gps_lng
        timestamp visited_at
        int rating "1-5, NULLable"
        string pros
        string cons
        bool revisit
        string memo
    }

    LodgingDetails {
        uuid place_id PK_FK
        date check_in
        date check_out
        string booking_site
        int score_clean "1-5, NULLable"
        int score_location "1-5, NULLable"
        int score_kindness "1-5, NULLable"
        int score_value "1-5, NULLable"
    }

    RestaurantDetails {
        uuid place_id PK_FK
        string menu
        int wait_minutes
    }

    CampsiteDetails {
        uuid place_id PK_FK
        date check_in
        date check_out
        string site_no
        string camping_type "auto|backpack|glamping|caravan|etc"
        bool has_electricity
        int score_toilet "1-5"
        int score_shower "1-5"
        int score_quiet "1-5"
        int score_view "1-5"
        int score_manner "1-5"
        string bug_level "none|few|some|many"
        bool recommend_family
        bool recommend_solo
    }

    Photo {
        uuid id PK
        uuid trip_id FK
        uuid place_id FK "nullable"
        string local_path
        string memo
        float gps_lat
        float gps_lng
        string location_source "exif|gps|manual|null"
        timestamp taken_at
        string sync_status
    }

    Expense {
        uuid id PK
        uuid trip_id FK
        uuid place_id FK "nullable"
        string category "lodging|transport|food|cafe|shopping|campsite|equipment|etc"
        number amount
        string currency "default KRW"
        date spent_on
        string memo
    }

    Transportation {
        uuid id PK
        uuid trip_id FK
        string mode "walk|car|public|air|rail|etc"
        int fatigue "1-5, NULLable"
        string memo
    }

    EquipmentRecord {
        uuid id PK
        uuid trip_id FK
        string used_items "JSON array"
        string missing_items "JSON array"
        string next_time_items "JSON array"
    }

    DiaryEntry {
        uuid id PK
        uuid trip_id FK
        date entry_date "NULL = trip-level 종합"
        string emotions "JSON array of enum"
        string memo
        string best_moment
        string want_to_revisit
        timestamp created_at
        timestamp updated_at
    }

    Tag {
        uuid id PK
        string name
        string category "style|emotion|season|etc, NULLable"
        timestamp created_at
    }

    TripTag {
        uuid trip_id PK_FK
        uuid tag_id PK_FK
    }

    PlaceTag {
        uuid place_id PK_FK
        uuid tag_id PK_FK
    }

    PhotoTag {
        uuid photo_id PK_FK
        uuid tag_id PK_FK
    }
```

---

## 3. 형태별 입력 매트릭스

| 데이터 | `trip` | `camping` | 비고 |
|---|---|---|---|
| 공통 메타 (3.1) | ✅ 필수 | ✅ 필수 | 양쪽 동일 |
| 사진 | ✅ 권장 | ✅ 권장 | 0건도 가능 |
| 비용 (Expense) | ✅ 선택 | ✅ 선택 | 자유 입력 + 폼 자동 생성 |
| 일기 (DiaryEntry) | ✅ 선택 | ✅ 선택 | 일자별(date 있음) 또는 종합(date NULL) |
| 태그 | ✅ 선택 | ✅ 선택 | Trip/Place/Photo 어디든 |
| Place(type=lodging) | ✅ 0~N | ❌ 폼 미노출 | 숙소 |
| Place(type=restaurant) | ✅ 0~N | ❌ 폼 미노출 | 식당 |
| Transportation | ✅ 0~N | ❌ 폼 미노출 | 이동 구간 |
| Place(type=campsite) | ❌ 폼 미노출 | ✅ **1개 이상 필수** | 캠핑장 |
| EquipmentRecord | ❌ 폼 미노출 | ✅ 0~1 | 한 여행에 1건 |

---

## 4. 데이터 의존성

### 4.1 강한 의존성 (FK + CASCADE)

```
모든 하위 엔티티 → Trip (NOT NULL, ON DELETE CASCADE)
  ├─ Place
  ├─ Photo
  ├─ Expense
  ├─ Transportation
  ├─ EquipmentRecord
  ├─ DiaryEntry
  ├─ TripTag
  ├─ PlaceTag (간접: Place 통해)
  └─ PhotoTag (간접: Photo 통해)

Place → details (PK + FK NOT NULL, ON DELETE CASCADE)
  ├─ LodgingDetails.place_id
  ├─ RestaurantDetails.place_id
  └─ CampsiteDetails.place_id

Tag link 테이블 (NOT NULL, ON DELETE CASCADE 양방향)
  ├─ TripTag.{trip_id, tag_id}
  ├─ PlaceTag.{place_id, tag_id}
  └─ PhotoTag.{photo_id, tag_id}

Trip.hero_photo_id → Photo (NULLable, ON DELETE SET NULL)
```

### 4.2 약한 의존성 — 장소 연결

`Photo`, `Expense` 는 **선택적으로** `Place` 에 연결될 수 있다.

```
Photo.place_id   → Place (NULLable, ON DELETE SET NULL)
Expense.place_id → Place (NULLable, ON DELETE SET NULL)
```

**Place 통합의 이점**
- 단일 FK라 SQLite가 무결성 보장
- 지도 화면(REQUIREMENTS §3.7) 에서 `SELECT * FROM place WHERE trip_id = ?` 한 방
- 새 장소 타입 추가 시 Place 변경 없음

### 4.3 비용 일원화 (Expense)

**모든 비용은 `Expense` 한 테이블에 저장.** 다른 테이블 어디에도 비용 컬럼 없음.

#### 입력 UX
사용자 경험은 그대로. 숙소/식당/캠핑장/이동 폼에 가격 입력란이 있고, 저장 시 트랜잭션으로 Place(또는 Transportation) + Expense 자동 생성.

| 폼 | 가격 입력 시 | 가격 미입력 시 |
|---|---|---|
| 숙소 폼 | Expense 자동 생성 (`category='lodging'`, `place_id=숙소.id`) | Expense 행 생성 안 함 |
| 식당 폼 | Expense 자동 생성 (`food`, place_id) | Expense 행 생성 안 함 |
| 캠핑장 폼 | Expense 자동 생성 (`campsite`, place_id) | Expense 행 생성 안 함 |
| 이동 폼 | Expense 자동 생성 (`transport`, place_id NULL) | Expense 행 생성 안 함 |
| 비용 화면 직접 입력 | Expense 행 생성 (place_id 선택적) | — |

#### 수정/삭제
- 폼에서 가격 변경 → 연결 Expense 업데이트
- 폼에서 가격 제거 → 연결 Expense 삭제
- Place 삭제 → 연결 Expense의 place_id만 NULL (비용 보존)

#### 합산
```sql
SELECT SUM(amount) FROM expense WHERE trip_id = ?;
SELECT category, SUM(amount) FROM expense WHERE trip_id = ? GROUP BY category;
SELECT SUM(amount) FROM expense WHERE place_id = ?;
```

중복 계산 위험 없음. 비용의 진실 원천은 `expense` 테이블 하나.

### 4.4 일기 통합 (DiaryEntry)

**감정 / 일자별 메모 / Trip-level 자유 텍스트가 모두 `DiaryEntry` 한 테이블.**

| 시나리오 | DiaryEntry 행 |
|---|---|
| 일자별 일기 (3월 5일의 기분) | `entry_date='2026-03-05'`, `emotions=['행복']`, `memo='바다 좋음'` |
| 여행 전체 종합 회고 | `entry_date=NULL`, `best_moment='야간 산책'`, `want_to_revisit='우도'` |
| 일자별 + 종합 모두 입력 | 행 여러 개. UI에서 자연스럽게 분기 |

**제약**: 같은 `(trip_id, entry_date)` 조합은 1건만 (UNIQUE). `entry_date=NULL`인 종합 기록도 trip당 1건.

```sql
CREATE UNIQUE INDEX idx_diary_unique ON diary_entry(trip_id, entry_date);
```

> SQLite 는 NULL 을 모두 다른 값으로 취급하므로, `entry_date=NULL`인 행이 여러 개 들어갈 수 있음. 앱 레벨 검증 + INSERT OR REPLACE 패턴 사용.

### 4.5 태그 모델

`Tag` 는 **전역**(모든 여행에서 공유). `name + category` 가 유니크.

```sql
CREATE UNIQUE INDEX idx_tag_name_cat ON tag(name, COALESCE(category, ''));
```

연결은 3개의 join 테이블:
- `TripTag(trip_id, tag_id)` — 여행 스타일 태그
- `PlaceTag(place_id, tag_id)` — 장소 특성 태그 ("바다뷰", "조용한")
- `PhotoTag(photo_id, tag_id)` — 사진 태그

**카테고리 예시 (선택)**
- `style`: 가족여행, 혼자, 출장, 워케이션
- `feature`: 바다뷰, 산뷰, 조용한, 도심
- `season`: 봄, 여름, 가을, 겨울
- `mood`: 힐링, 액티브, 식도락
- (NULL 가능 — 카테고리 없는 자유 태그)

**왜 polymorphic 안 쓰는가**
- Place 결정 때와 동일: 단일 FK가 DB 무결성 보장
- 3개 테이블이지만 각각 단순 (PK = 두 컬럼)
- Trip/Place/Photo 삭제 시 해당 join 테이블만 cascade — 깔끔

---

## 5. 필수 vs 선택 필드 (Phase 1)

### 5.1 Trip (공통)

| 필드 | 필수 | 비고 |
|---|---|---|
| title | ✅ | 비어있으면 저장 불가 |
| start_date | ✅ | "지금 시작"은 today 자동 입력 |
| end_date | ⛔ 선택 | NULL 허용 ("기간 미정" 가능). 입력 시 end ≥ start |
| trip_type | ✅ | enum |
| country / city / gps | ⛔ 선택 | |
| purpose / summary | ⛔ 선택 | 여행 중/후 입력 |
| satisfaction | ⛔ 선택 | **마무리 시점 입력 권장** — 입력 여부가 "완료" 판정 기준 (§0 #11) |
| companions | ⛔ 선택 | JSON 배열, `[]` 또는 NULL |
| hero_photo_id | ⛔ 선택 | |

### 5.2 Place (공통 부모)

| 필드 | 필수 | 비고 |
|---|---|---|
| trip_id, type, name | ✅ | |
| visited_at | ⛔ 선택 | 단일 timestamp |
| gps / rating / pros / cons / revisit / memo | ⛔ 선택 | |

### 5.3 LodgingDetails / CampsiteDetails

- 모든 details 필드 선택. details 행 자체가 없는 경우도 허용.
- check_in/check_out 둘 다 선택 (기록 안 해도 됨)

### 5.4 RestaurantDetails

- 모든 필드 선택. 행 자체가 없어도 됨.

### 5.5 Transportation / EquipmentRecord

- Transportation: `mode` 만 필수. 나머지 선택. 0건 허용.
- EquipmentRecord: 한 여행에 0~1건. 모든 필드 선택. JSON 배열로 저장.

### 5.6 DiaryEntry

- `trip_id` 필수.
- `entry_date` 선택 (NULL = trip 종합).
- `emotions / memo / best_moment / want_to_revisit` 모두 선택. (단, 4개 모두 비어있으면 행 의미 없음 — 앱 레벨 검증)

### 5.7 Tag / TagLink

- Tag.name 필수. Tag.category 선택.
- 모든 link 테이블 양쪽 FK 필수 (PK 구성).

### 5.8 형태별 추가 제약

- `trip_type = 'camping'` → **Place(type='campsite')가 최소 1건** (앱 레벨 검증).
- `trip_type = 'trip'` → 추가 제약 없음.

---

## 6. 결정/미정 항목 정리

| 항목 | 상태 | 비고 |
|---|---|---|
| 비용 구조 | ✅ 결정 | Expense 일원화 |
| 장소 모델 | ✅ 결정 | Place + details |
| Diary 통합 | ✅ 결정 | EmotionRecord + DailyMemo + Trip-level 자유 텍스트 → DiaryEntry |
| Tag 구조 | ✅ 결정 | 전역 + Trip/Place/Photo 모두 + 카테고리 옵션 + 3개 join 테이블 |
| Companion | ✅ 결정 | Trip.companions JSON 배열 |
| Currency 컬럼 | ✅ 결정 | Expense.currency NOT NULL DEFAULT 'KRW' |
| Photo 위치 | ✅ 결정 | 단일 gps + location_source |
| Place 방문 시점 | ✅ 결정 | visited_at 단일. 체크인/아웃은 details |
| 평점 미입력 | ✅ 결정 | NULL (0 아님) |
| 캠핑장 멀티 박지 | ✅ 결정 | Trip 1 ─ N Place(campsite) 허용 |
| Equipment 1:1 | ✅ 결정 | 여행당 1건 |
| 형태 변경 시 데이터 처리 | ✅ 결정 | 숨김 (보존) |
| 진입점 | ✅ 결정 | 메인 CTA "출발" — 바텀 시트 모달(3필드) → 진행 중 상세 직행 |
| Trip status 컬럼 | ✅ 결정 | 추가 안 함. **종료일만으로 derive** (예정/진행중/완료) |
| 마무리 액션 | ✅ 결정 | "마무리 버튼" 없음. **종료일 입력 = 마무리**. 회고는 선택 |
| 회고 화면 명칭 | ✅ 결정 | "여행 도장 짓기" — 도장(stamp) 메타포 |
| start_date / end_date | ✅ 결정 | start 필수, end NULLable |
| 모드 외 추가 정보 입력 | ⏳ Phase 2+ | "추가 정보 토글" 옵션 검토 |
| 다중 통화 환전 | ⏳ Phase 4 | currency 컬럼은 미리 둠 |
| Companion 정규화 (Person 엔티티) | ⏳ Phase 2+ | 통계 필요 시 |
| EXIF vs Manual 우선순위 | ⏳ UI 정책 | 스키마 영향 없음 |
| 검색 자연어 수준 | ⏳ Phase 3+ | 별도 인덱스 검토 |
| Soft delete | ⏳ Phase 4 | 백업/복구 정책에 포함 |
| HEIC 처리 | ⏳ services/image | 스키마 영향 없음 |

---

## 7. 화면 폼 분기 가이드 (구현 힌트)

생성/수정 화면(REQUIREMENTS §4.4)은 다음 구조로 분기한다.

```
[공통 입력 섹션] (Trip 기본 정보 — 항상 표시)
   │
   ├─ trip_type 선택 → 'trip'
   │     ├─ [숙소 입력 섹션] (선택, 추가 버튼으로 N건)
   │     │     → 저장 시 Place(type=lodging) + LodgingDetails + Expense 자동 생성
   │     ├─ [식당 입력 섹션] (선택, 추가 버튼으로 N건)
   │     │     → Place(type=restaurant) + RestaurantDetails + Expense 자동 생성
   │     └─ [이동 입력 섹션] (선택, 추가 버튼으로 N건)
   │           → Transportation + Expense(transport) 자동 생성
   │
   └─ trip_type 선택 → 'camping'
         ├─ [캠핑장 입력 섹션] (필수 1건 이상)
         │     → Place(type=campsite) + CampsiteDetails + Expense 자동 생성
         └─ [장비 기록 섹션] (선택)
               → EquipmentRecord

[공통 입력 섹션 — 사진 / 비용 / 일기 / 태그] (항상 표시)
```

권장 구현
- 형태별 섹션은 **컴포넌트 맵** 등록 (`{ trip: TripModeForm, camping: CampingModeForm }`)
- 각 폼의 "가격" 입력은 폼 상태에만 두고, 저장 트랜잭션에서 Place + Expense 행으로 변환
- 새 형태(`hiking` 등) 추가 시 맵에 항목만 추가

---

## 8. 다음 단계

1. **SCHEMA.md** — 위 모델을 SQLite `CREATE TABLE` 문으로 구체화 (인덱스, FK, CHECK 제약 포함)
2. **types/** TypeScript 타입 정의
3. **db/** 쿼리 함수 (Place + details join 헬퍼, 폼 → Place + Expense 트랜잭션 헬퍼 포함)
4. **stores/** Zustand 스토어 (도메인별 분리)
5. 화면 폼 분기 구현
