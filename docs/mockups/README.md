# Memory Trip — UI 목업 아카이브

본 디렉토리는 [REQUIREMENTS.md](../REQUIREMENTS.md) 의 화면 정의를 시각화한 목업을 보관한다.
모든 목업은 모바일 (~360px 폭) 기준으로 작성됨.

## 파일 목록

| 파일 | 화면 | REQUIREMENTS 매핑 |
|---|---|---|
| `01_home.svg` | 홈 (3가지 상태: 평상시 / 진행 중·사진 0장 / 진행 중·사진 있음) | §4.1 |
| `02_create_flow.svg` | 출발 흐름 (홈 → 바텀 시트 모달 → 진행 중 상세) | §4.4 |
| `03_trip_list.svg` | 여행 목록 (4가지 상태 배지: 예정 / 진행 중 / 종료일 미정 / 완료) | §4.2 |
| `04_photo_gallery.svg` | 사진 갤러리 (그리드 / 단일 뷰 / 다중 선택) | §4.5 |
| `05_quickadd_photo_place.svg` | 빠른 추가: 사진 미리보기 + 장소(숙소) 폼 | §4.3.3.3, §4.3.3.4 |
| `06_quickadd_expense_diary.svg` | 빠른 추가: 비용(키패드) + 일기(감정 칩) | §4.3.3.5, §4.3.3.6 |
| `07_wrapup.svg` | 여행 도장 짓기 (홈 진입 카드 + 8섹션 풀스크린) | §4.4-A |
| `08_settings.svg` | 설정 (5섹션: 백업/저장소/권한/앱/정보) | §4.9 |

## 디자인 시스템

- **폰트**: system-ui, -apple-system, sans-serif
- **컬러 램프**: c-teal (브랜드 / CTA), c-amber (active / 강조), c-coral / c-pink / c-purple / c-blue / c-green (다양화), c-gray (중립)
- **각 램프 100 stop** 을 fill 로 사용 (소프트 파스텔), text는 800/900 stop 으로 대비
- **테두리**: 0.5px solid (default) / 1px dashed (강조 — 종료일 미정 카드)
- **모서리**: rx 6px (작은) / 8px (medium) / 10~14px (카드, 모달)

## 뷰 권장사항

- **VS Code**: SVG Preview 익스텐션 추천
- **브라우저**: 파일 직접 열기 (드래그 또는 `file://` 경로)
- 각 SVG는 standalone (외부 의존성 없음, 인라인 스타일 포함)

## 갱신 정책

REQUIREMENTS.md 또는 DOMAIN_MODEL.md 의 화면 정의가 변경되면 해당 목업도 갱신.
변경 이력은 git history 로 추적.
