// ─── 탭 루트 ──────────────────────────────────────────────────────────────────
export const TAB = {
  HOME:     'TabHome',
  TRIPS:    'TabTrips',
  SETTINGS: 'TabSettings',
} as const;

// ─── 홈 스택 ─────────────────────────────────────────────────────────────────
export const HOME_STACK = {
  HOME: 'Home',
} as const;

// ─── 여행 스택 (목록 + 상세 + 생성/수정) ─────────────────────────────────────
export const TRIP_STACK = {
  TRIP_LIST:        'TripList',
  TRIP_DETAIL:      'TripDetail',
  TRIP_CREATE:      'TripCreate',      // 바텀 시트 모달
  TRIP_EDIT:        'TripEdit',        // 전체 폼 수정
  TRIP_WRAP_UP:     'TripWrapUp',      // 여행 도장 짓기
  PHOTO_GALLERY:    'PhotoGallery',
} as const;

// ─── 빠른 추가 화면 (modal stack) ─────────────────────────────────────────────
export const QUICK_ADD = {
  CAMERA:         'QuickAddCamera',
  GALLERY:        'QuickAddGallery',
  PHOTO_PREVIEW:  'QuickAddPhotoPreview',  // 카메라/갤러리 공통 미리보기
  PLACE:          'QuickAddPlace',
  EXPENSE:        'QuickAddExpense',
  DIARY:          'QuickAddDiary',
} as const;

// ─── 설정 스택 ────────────────────────────────────────────────────────────────
export const SETTINGS_STACK = {
  SETTINGS:             'Settings',
  SETTINGS_BACKUP:      'SettingsBackup',
  SETTINGS_BACKUP_LIST: 'SettingsBackupList',
  SETTINGS_RESTORE:     'SettingsRestore',
} as const;

// ─── 전체 라우트 이름 (타입 도출용) ───────────────────────────────────────────
export const ROUTES = {
  ...TAB,
  ...HOME_STACK,
  ...TRIP_STACK,
  ...QUICK_ADD,
  ...SETTINGS_STACK,
} as const;

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES];
