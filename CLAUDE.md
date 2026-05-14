# Memory Trip — CLAUDE.md

Memory Trip은 여행과 캠핑의 순간을 사진, 장소, 감정, 비용과 함께 기록하고,
시간이 지나도 당시의 분위기와 추억을 다시 떠올릴 수 있도록 만드는
**모바일 기반 여행 기억 아카이브 앱**이다.

이 문서는 Claude가 본 코드베이스에서 작업할 때의 컨텍스트와 규칙을 정의한다.

> 📌 **관련 문서**
> - 제품 요구사항·화면 구성·필드 정의 → [REQUIREMENTS.md](./docs/REQUIREMENTS.md)
> - 엔티티 관계·공통/전용 분리·의존성 → [DOMAIN_MODEL.md](./docs/DOMAIN_MODEL.md)
> - SQLite 스키마 (CREATE TABLE / 인덱스 / 쿼리) → [SCHEMA.md](./docs/SCHEMA.md)
> - 디자인 토큰 (색상 / 간격 / 모서리 / 폰트) → [DESIGN_TOKENS.md](./docs/DESIGN_TOKENS.md)
> - UI 목업 아카이브 → [dev/docs/mockups/](./docs/mockups/)
>
> 본 문서(CLAUDE.md)는 **아키텍처·기술·코드 규칙**만 다룬다.

---

## 1. 기술 스택

| 분류 | 사용 |
|---|---|
| Framework | React Native (Expo) |
| 언어 | TypeScript (strict) |
| 로컬 DB | Expo SQLite |
| 상태관리 | Zustand |
| 네비게이션 | React Navigation |
| 지도 | react-native-maps |
| 이미지 | expo-image-picker |
| 위치 | expo-location |
| 파일 | expo-file-system |

> **원칙**: 새 라이브러리 추가는 신중히. 가능한 한 Expo 생태계 내에서 해결한다.

---

## 2. 폴더 구조

```
src/
  screens/        # 화면 단위 컴포넌트 (Trip, Place, Expense 등)
  components/     # 재사용 UI 컴포넌트
  navigation/     # React Navigation 설정
  stores/         # Zustand 스토어 (도메인별로 분리)
  db/             # SQLite 스키마, 마이그레이션, 쿼리 모듈
  services/       # 백업, 동기화, 위치, 이미지 처리 등 비즈니스 로직
  hooks/          # 커스텀 훅
  theme/          # 디자인 토큰, ThemeProvider
  types/          # 전역 타입 정의
  utils/          # 순수 유틸 함수
  constants/      # 상수 (경로, enum 등)
assets/           # 정적 리소스
docs/             # 개발 문서 (REQUIREMENTS, DOMAIN_MODEL, SCHEMA, DESIGN_TOKENS, mockups)
CLAUDE.md         # 본 문서 (프로젝트 루트)
```

**규칙**
- 화면은 `screens/`, 그 화면 안에서만 쓰는 컴포넌트는 `screens/<화면명>/components/`
- DB 접근은 반드시 `db/` 모듈을 거친다. 화면에서 SQLite를 직접 호출하지 않는다.
- 백업/동기화/외부 IO는 `services/`에 격리한다.
- 색상·간격·모서리·폰트는 `theme/` 토큰을 참조 (CLAUDE.md §8 참조).

---

## 3. 데이터 저장 전략

### 3.1 앱 데이터 (SQLite)

모든 핵심 메타데이터는 SQLite 로컬 DB에 저장한다.

저장 대상: 여행, 장소, 비용, 감정, 숙소, 식당, 캠핑장, 태그, 메모, 동기화 상태.

> 상세 스키마는 [SCHEMA.md](./docs/SCHEMA.md), 엔티티 관계는 [DOMAIN_MODEL.md](./docs/DOMAIN_MODEL.md) 참조.

### 3.2 SQLite 테이블 관계 (요약)

```
Trip (1) ──┬── (N) Place ─ details (lodging / restaurant / campsite)
           ├── (N) Photo ─ (place_id 옵션)
           ├── (N) Expense ─ (place_id 옵션)
           ├── (N) Transportation
           ├── (0..1) EquipmentRecord
           └── (N) DiaryEntry

Tag (전역) ── trip_tag / place_tag / photo_tag (3개 join)
```

- 모든 도메인 엔티티의 PK는 UUID v4 (오프라인 환경에서 충돌 없음).
- 모든 row는 `created_at`, `updated_at` 컬럼.
- 사진/백업 등 동기화 대상은 `sync_status` 컬럼.

### 3.3 사진 저장

사진은 **"로컬 우선 + 개인 클라우드 백업"** 구조.

저장 순서:
1. 기기 로컬 파일 시스템에 저장
2. SQLite에 메타데이터 (경로, 촬영시각, 위치, tripId 등) 저장
3. 백업 큐 (`backup_queue` 테이블) 에 등록
4. 네트워크 연결 시 백그라운드로 클라우드 업로드

**로컬 경로 규칙**
```
${FileSystem.documentDirectory}photos/{tripId}/{photoId}.jpg
${FileSystem.documentDirectory}photos/{tripId}/thumbs/{photoId}.jpg
```

**클라우드 백업 대상**
| 플랫폼 | 기본값 |
|---|---|
| iPhone | iCloud Drive |
| Android | Google Drive |

> 위 값은 **기본값**일 뿐, 설정 화면에서 사용자가 변경 가능하다.
> (Phase 1 — iCloud / Google Drive 지원. 그 외 클라우드는 추후 검토)

---

## 4. 오프라인 우선 원칙

앱은 **인터넷 없이도 반드시 동작해야 한다.**
이유: 주요 사용 환경이 오지 캠핑장, 산간, 해외 여행지 등 네트워크가 불안정한 곳이기 때문.

원칙:
- 모든 입력은 즉시 로컬 SQLite에 저장하고, UI는 로컬 상태를 진실로 본다.
- 네트워크 호출은 백그라운드 작업으로만 트리거한다 (UI 블로킹 금지).
- 업로드 실패는 큐에 남겨두고 재시도한다.

---

## 5. 동기화 상태 머신

모든 업로드 대상 (사진, 백업 파일 등) 은 `sync_status` 값을 가진다.

| 상태 | 의미 | 다음 전이 |
|---|---|---|
| `pending` | 업로드 대기 | → `syncing` |
| `syncing` | 업로드 진행 중 | → `synced` / `failed` |
| `synced` | 업로드 완료 | (종착) |
| `failed` | 일시 실패, 재시도 가능 | → `pending` (재시도) / `dead` |
| `dead` | 영구 실패 (사용자 개입 필요) | (수동 복구) |

**재시도 정책**
- 지수 백오프: 30초 → 2분 → 10분 → 1시간 → 6시간
- 최대 재시도 횟수: 5회
- 5회 실패 시 `dead` 상태로 전이 후 사용자에게 알림

---

## 6. 백업 및 복구 정책

### 6.1 핵심 원칙

본 앱은 로컬 SQLite 기반이므로 다음 시나리오를 반드시 고려한다.
- DB 파일 손상
- 앱 삭제 후 재설치
- 기기 분실 / 교체

→ **모든 여행 데이터는 복구 가능해야 한다.**

### 6.2 자동 로컬 백업

앱은 주기적으로 SQLite 백업 파일을 생성한다.

**파일명 규칙**
```text
memory_trip_backup_YYYYMMDD.db
```

**저장 위치**
```
${FileSystem.documentDirectory}backups/
```

**보관 정책**
- 일일 백업: 최근 7일치 보관
- 주간 백업: 최근 4주치 보관
- 월간 백업: 최근 6개월치 보관
- 그 이상은 자동 삭제

### 6.3 클라우드 백업

로컬 백업 파일은 위 클라우드 백업 대상 (iCloud / Google Drive) 에 자동 업로드한다.

### 6.4 복구 시나리오

| 트리거 | 동작 |
|---|---|
| 앱 첫 실행 시 클라우드에 백업 발견 | 복구 여부를 사용자에게 묻는 모달 표시 |
| 설정 → "백업에서 복구" 수동 선택 | 복구 가능한 백업 목록 표시 후 사용자 선택 |
| DB 무결성 검사 실패 | 가장 최근 정상 백업으로 자동 롤백 후 알림 |

---

## 7. 권한 처리

| 권한 | 용도 | 거부 시 fallback |
|---|---|---|
| 위치 (`expo-location`) | 장소/사진 자동 태깅 | 수동 장소 입력으로 대체 |
| 카메라/사진 (`expo-image-picker`) | 사진 첨부 | 사진 없이 텍스트 기록만 가능 |
| 파일 시스템 | 백업/복구 | 클라우드 백업만 활성화 |

권한 거부는 항상 **앱 사용을 막지 않는다.** 기능 일부만 비활성화한다.

---

## 8. 코드 컨벤션

- TypeScript `strict: true`. `any` 사용 금지 (불가피하면 `unknown` 후 타입 가드).
- 컴포넌트: PascalCase (`TripCard.tsx`), 훅: `useXxx` (`useTripList.ts`).
- DB 쿼리 함수: 동사로 시작 (`getTripById`, `insertPlace`).
- import 순서: 외부 라이브러리 → 내부 절대경로 → 상대경로 → 타입.
- 비동기는 `async/await` 우선, `.then()` 체이닝 지양.
- 한국어 주석 OK. 단, 도메인 용어는 코드에서 영어로 통일.
- **색상·간격·모서리·폰트는 반드시 [디자인 토큰](./docs/DESIGN_TOKENS.md) 참조.** hex / px 매직 넘버 직접 사용 금지. `useTheme()` 훅으로 접근.

---

## 9. 자주 쓰는 명령어

```bash
# 개발 서버
npx expo start

# 타입 체크
npx tsc --noEmit

# 린트
npx eslint .

# 빌드 (EAS)
eas build --platform ios
eas build --platform android
```

---

## 10. 작업 시 Claude에게 요청하는 행동 원칙

- 새 도메인 엔티티 추가 시 → 반드시 SQLite 스키마, 마이그레이션, `db/` 쿼리 모듈, 타입 정의를 함께 수정한다.
- 사진/파일 IO 코드를 작성할 때는 **로컬 우선 → 큐 등록 → 백업** 순서를 지킨다.
- 네트워크 호출을 추가할 때는 오프라인 fallback과 재시도 정책을 같이 설계한다.
- 사용자 데이터를 변경하는 코드는 항상 트랜잭션 안에서 실행한다.
- 모든 신규 화면은 권한 거부 케이스를 함께 처리한다.
- 색상/스타일은 hex 직접 쓰지 말고 토큰 참조.
