// ─── Primitive 토큰 ────────────────────────────────────────────────────────────
// 컴포넌트가 직접 참조하지 않는 원시 값. semantic 토큰의 소스.
// ⚠️ 현재 값은 placeholder. 브랜드 컬러 확정 시 아래 hex만 교체.

export const palette = {
  teal:   { 50: '#E1F5EE', 100: '#9FE1CB', 200: '#5DCAA5', 400: '#1D9E75', 600: '#0F6E56', 800: '#085041', 900: '#04342C' },
  amber:  { 50: '#FAEEDA', 100: '#FAC775', 200: '#EF9F27', 400: '#BA7517', 600: '#854F0B', 800: '#633806', 900: '#412402' },
  coral:  { 50: '#FAECE7', 100: '#F5C4B3', 200: '#F0997B', 400: '#D85A30', 600: '#993C1D', 800: '#712B13', 900: '#4A1B0C' },
  pink:   { 50: '#FBEAF0', 100: '#F4C0D1', 200: '#ED93B1', 400: '#D4537E', 600: '#993556', 800: '#72243E', 900: '#4B1528' },
  purple: { 50: '#EEEDFE', 100: '#CECBF6', 200: '#AFA9EC', 400: '#7F77DD', 600: '#534AB7', 800: '#3C3489', 900: '#26215C' },
  blue:   { 50: '#E6F1FB', 100: '#B5D4F4', 200: '#85B7EB', 400: '#378ADD', 600: '#185FA5', 800: '#0C447C', 900: '#042C53' },
  green:  { 50: '#EAF3DE', 100: '#C0DD97', 200: '#97C459', 400: '#639922', 600: '#3B6D11', 800: '#27500A', 900: '#173404' },
  red:    { 50: '#FCEBEB', 100: '#F7C1C1', 200: '#F09595', 400: '#E24B4A', 600: '#A32D2D', 800: '#791F1F', 900: '#501313' },
  gray:   { 50: '#F1EFE8', 100: '#D3D1C7', 200: '#B4B2A9', 400: '#888780', 600: '#5F5E5A', 800: '#444441', 900: '#2C2C2A' },
} as const;

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 14,
  full: 9999,
} as const;

export const fontSize = {
  xs: 10,
  sm: 11,
  base: 12,
  md: 13,
  lg: 14,
  xl: 16,
  '2xl': 18,
  '3xl': 22,
  '4xl': 32,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
};

export const fontFamily = {
  sans: 'System',
  mono: 'Courier',
} as const;

// ─── Semantic 토큰 ─────────────────────────────────────────────────────────────
// 컴포넌트는 이 값만 참조한다.

export const lightTheme = {
  colors: {
    // Brand
    primary:       palette.teal[200],
    onPrimary:     palette.teal[900],
    accent:        palette.amber[200],
    onAccent:      palette.amber[900],

    // Status
    success:       palette.green[200],
    onSuccess:     palette.green[900],
    warning:       palette.amber[200],
    onWarning:     palette.amber[900],
    danger:        palette.red[200],
    onDanger:      palette.red[900],
    info:          palette.blue[200],
    onInfo:        palette.blue[900],

    // Surface
    background:    '#FFFFFF',
    surface:       '#FFFFFF',
    surfaceMuted:  palette.gray[50],
    border:        'rgba(0,0,0,0.10)',
    borderStrong:  'rgba(0,0,0,0.20)',

    // Text
    textPrimary:   '#1F1F1F',
    textSecondary: '#6B6B6B',
    textTertiary:  '#9B9B9B',
    textDisabled:  '#C0C0C0',
  },
  space,
  radius,
  fontSize,
  fontWeight,
  fontFamily,
} as const;

export type Theme = typeof lightTheme;

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary:       palette.teal[400],
    onPrimary:     palette.teal[50],
    accent:        palette.amber[400],
    onAccent:      palette.amber[50],

    success:       palette.green[400],
    onSuccess:     palette.green[50],
    warning:       palette.amber[400],
    onWarning:     palette.amber[50],
    danger:        palette.red[400],
    onDanger:      palette.red[50],
    info:          palette.blue[400],
    onInfo:        palette.blue[50],

    background:    '#0F0F0F',
    surface:       '#1A1A1A',
    surfaceMuted:  palette.gray[900],
    border:        'rgba(255,255,255,0.10)',
    borderStrong:  'rgba(255,255,255,0.20)',

    textPrimary:   '#F5F5F5',
    textSecondary: '#B0B0B0',
    textTertiary:  '#707070',
    textDisabled:  '#555555',
  },
};

// 형태별 액센트 팔레트 매핑 (Phase 2+ 전용 필드 도입 시 활용)
export const tripTypeAccent = {
  trip:        palette.teal,
  camping:     palette.coral,
  hiking:      palette.green,
  car_camping: palette.amber,
} as const;
