# Memory Trip — 디자인 토큰

본 문서는 앱의 **색상 / 간격 / 모서리 / 폰트** 등 시각 속성을 단일 진실 원천(single source of truth)으로 정의한다.

- 모든 컴포넌트는 hex / px 직접 사용 금지. **반드시 토큰을 참조**한다.
- 브랜드 색상이 바뀌어도 토큰만 수정하면 전체 앱이 일괄 변경됨.
- 라이트/다크 모드, 형태별 액센트 등 동적 전환의 기반이 된다.

> ⚠️ **현재 모든 색상은 placeholder.** 실제 brand color 확정 전에도 개발 진행 가능하도록 임시 값으로 정의함. 확정 시 본 문서의 hex만 교체하면 됨.

---

## 0. 두 계층의 토큰

```
[Primitive 토큰]    teal-500 = #14B8A6, gray-50 = #F9FAFB, ...
       ↓ 매핑
[Semantic 토큰]     primary = teal-500, surface = gray-50, ...
       ↓ 사용
[컴포넌트 코드]     theme.colors.primary
```

- **Primitive**: 색상 그 자체 (값). 컴포넌트가 직접 참조하지 않음.
- **Semantic**: 의미 (역할). 컴포넌트는 이것만 참조.
- 라이트/다크 모드 전환 = Semantic → Primitive 매핑만 바꿈.

---

## 1. 컬러 램프 (Primitive)

각 컬러는 9단계 (50 ~ 900). 50 = 가장 옅음, 900 = 가장 진함.

### 1.1 Brand / Accent 컬러

| 이름 | 50 | 100 | 200 | 400 | 600 | 800 | 900 |
|---|---|---|---|---|---|---|---|
| **teal** | #E1F5EE | #9FE1CB | #5DCAA5 | #1D9E75 | #0F6E56 | #085041 | #04342C |
| **amber** | #FAEEDA | #FAC775 | #EF9F27 | #BA7517 | #854F0B | #633806 | #412402 |
| **coral** | #FAECE7 | #F5C4B3 | #F0997B | #D85A30 | #993C1D | #712B13 | #4A1B0C |
| **pink** | #FBEAF0 | #F4C0D1 | #ED93B1 | #D4537E | #993556 | #72243E | #4B1528 |
| **purple** | #EEEDFE | #CECBF6 | #AFA9EC | #7F77DD | #534AB7 | #3C3489 | #26215C |
| **blue** | #E6F1FB | #B5D4F4 | #85B7EB | #378ADD | #185FA5 | #0C447C | #042C53 |
| **green** | #EAF3DE | #C0DD97 | #97C459 | #639922 | #3B6D11 | #27500A | #173404 |
| **red** | #FCEBEB | #F7C1C1 | #F09595 | #E24B4A | #A32D2D | #791F1F | #501313 |
| **gray** | #F1EFE8 | #D3D1C7 | #B4B2A9 | #888780 | #5F5E5A | #444441 | #2C2C2A |

> 위 값은 placeholder. 브랜드 컬러 확정 시 같은 9단계 구조 유지하며 교체.

### 1.2 사용 가이드

- 50 / 100 → 카드 배경, 칩 배경 (소프트 fill)
- 200 → 활성 상태 강조 (hover/active 등)
- 400 → 아이콘 / 버튼 (mid-tone)
- 600 → 텍스트 강조 / 보더
- 800 / 900 → 본문 텍스트 (높은 대비)

---

## 2. 의미 기반 토큰 (Semantic)

컴포넌트가 참조하는 유일한 색상 인터페이스.

### 2.1 Brand

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `primary` | teal-200 | teal-400 | 메인 CTA (출발 버튼 등), 선택 상태 |
| `onPrimary` | teal-900 | teal-50 | primary 배경 위 텍스트 / 아이콘 |
| `accent` | amber-200 | amber-400 | 활성 강조 (진행 중 카드 stripe) |
| `onAccent` | amber-900 | amber-50 | accent 배경 위 텍스트 |

### 2.2 Status (의미 색상)

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `success` | green-200 | green-400 | 성공 / 저장됨 / 권한 허용됨 |
| `warning` | amber-200 | amber-400 | 주의 / 종료일 미정 |
| `danger` | red-200 | red-400 | 삭제 / 오류 / 권한 거부 |
| `info` | blue-200 | blue-400 | 정보 / 예정 여행 배지 |

각 status에도 `on{Status}` 짝 토큰 (텍스트 색).

### 2.3 Surface / Background

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `background` | #FFFFFF | #0F0F0F | 페이지 배경 |
| `surface` | #FFFFFF | #1A1A1A | 카드 / 모달 배경 |
| `surfaceMuted` | gray-50 | gray-900 | 보조 영역 (통계 카드 등) |
| `border` | rgba(0,0,0,0.10) | rgba(255,255,255,0.10) | 0.5px 보더 default |
| `borderStrong` | rgba(0,0,0,0.20) | rgba(255,255,255,0.20) | 입력 필드 등 강조 |

### 2.4 Text 계층

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `textPrimary` | #1F1F1F | #F5F5F5 | 본문 / 제목 |
| `textSecondary` | #6B6B6B | #B0B0B0 | 보조 (날짜, 메타) |
| `textTertiary` | #9B9B9B | #707070 | 힌트 / placeholder |
| `textDisabled` | #C0C0C0 | #555555 | 비활성 |

### 2.5 형태별 차별화 (옵션)

여행 형태마다 다른 액센트를 줄 수 있도록 제공.

| 토큰 | trip | camping | (Phase 2+) hiking | car_camping |
|---|---|---|---|---|
| `tripTypeAccent` | teal | coral | green | amber |

---

## 3. 비-컬러 토큰

### 3.1 간격 (spacing)

```
space-0  = 0
space-1  = 4px
space-2  = 8px
space-3  = 12px
space-4  = 16px   ← default 컴포넌트 패딩
space-5  = 20px
space-6  = 24px
space-8  = 32px
space-10 = 40px
```

### 3.2 모서리 (radius)

```
radius-xs  = 4px    ← 작은 칩
radius-sm  = 6px    ← 썸네일
radius-md  = 8px    ← 입력 필드, 작은 카드 (default)
radius-lg  = 10px   ← 일반 카드
radius-xl  = 12px   ← 큰 카드 / CTA
radius-2xl = 14px   ← 모달, hero 영역
radius-full = 9999  ← 칩 / pill
```

### 3.3 폰트 사이즈

```
font-xs    = 10px   ← 메타 (촬영 시간, 통계 라벨)
font-sm    = 11px   ← 보조 텍스트
font-base  = 12px   ← 본문 default
font-md    = 13px   ← 강조 본문 / CTA 라벨
font-lg    = 14px   ← 카드 제목
font-xl    = 16px   ← 화면 제목
font-2xl   = 18px   ← 통계 숫자
font-3xl   = 22px   ← 큰 헤더
font-4xl   = 32px   ← 키패드 / 금액 디스플레이
```

### 3.4 폰트 무게

```
weight-regular = 400   ← 본문 default
weight-medium  = 500   ← 강조 / 헤더 (단 두 단계만 사용)
```

> 600/700 사용 안 함. 라이트한 시각 톤 유지.

### 3.5 폰트 패밀리

```
font-sans  = system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif
font-mono  = "SF Mono", Menlo, Consolas, monospace   ← 코드 / 숫자 정렬용
```

---

## 4. TypeScript 토큰 export 형식 (구현 가이드)

`src/theme/tokens.ts` 작성 시 다음 패턴.

```ts
// ============ Primitive ============
export const palette = {
  teal:   { 50: '#E1F5EE', 100: '#9FE1CB', 200: '#5DCAA5', /* ... */ 900: '#04342C' },
  amber:  { 50: '#FAEEDA', /* ... */ 900: '#412402' },
  coral:  { /* ... */ },
  // ...
} as const;

export const space   = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, /* ... */ } as const;
export const radius  = { xs: 4, sm: 6, md: 8, lg: 10, xl: 12, '2xl': 14, full: 9999 } as const;
export const fontSize = { xs: 10, sm: 11, base: 12, md: 13, lg: 14, xl: 16, '2xl': 18, '3xl': 22, '4xl': 32 } as const;
export const fontWeight = { regular: '400', medium: '500' } as const;

// ============ Semantic (light) ============
export const lightTheme = {
  colors: {
    primary:        palette.teal[200],
    onPrimary:      palette.teal[900],
    accent:         palette.amber[200],
    onAccent:       palette.amber[900],
    success:        palette.green[200],
    onSuccess:      palette.green[900],
    warning:        palette.amber[200],
    onWarning:      palette.amber[900],
    danger:         palette.red[200],
    onDanger:       palette.red[900],
    info:           palette.blue[200],
    onInfo:         palette.blue[900],
    background:     '#FFFFFF',
    surface:        '#FFFFFF',
    surfaceMuted:   palette.gray[50],
    border:         'rgba(0,0,0,0.10)',
    borderStrong:   'rgba(0,0,0,0.20)',
    textPrimary:    '#1F1F1F',
    textSecondary:  '#6B6B6B',
    textTertiary:   '#9B9B9B',
    textDisabled:   '#C0C0C0',
  },
  space,
  radius,
  fontSize,
  fontWeight,
} as const;

export type Theme = typeof lightTheme;

// ============ Semantic (dark) ============
export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary:        palette.teal[400],
    onPrimary:      palette.teal[50],
    // ... 같은 패턴으로 매핑
  },
};
```

`src/theme/ThemeProvider.tsx` 에서 React Context로 제공:

```tsx
const ThemeContext = createContext<Theme>(lightTheme);
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme();    // 'light' | 'dark'
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};
```

컴포넌트 사용:

```tsx
const ThemedButton = () => {
  const { colors, radius, space } = useTheme();
  return (
    <Pressable style={{
      backgroundColor: colors.primary,
      borderRadius: radius.xl,
      paddingHorizontal: space[4],
      paddingVertical: space[3],
    }}>
      <Text style={{ color: colors.onPrimary }}>출발</Text>
    </Pressable>
  );
};
```

---

## 5. 사용 규칙 (필독)

### 5.1 절대 금지

```tsx
// ❌ hex 직접 사용
<View style={{ backgroundColor: '#9FE1CB' }} />

// ❌ palette primitive 직접 사용
<View style={{ backgroundColor: palette.teal[200] }} />

// ❌ 매직 넘버 spacing
<View style={{ padding: 16, borderRadius: 12 }} />
```

### 5.2 권장

```tsx
// ✅ semantic 토큰 + theme 훅
const { colors, space, radius } = useTheme();
<View style={{
  backgroundColor: colors.primary,
  padding: space[4],
  borderRadius: radius.xl,
}} />
```

### 5.3 예외 (palette 직접 허용)

색상이 의미가 없고 순수 시각적 다양화일 때만 (예: 사진 placeholder의 카테고리별 색상 — 이런 경우는 별도 `categoryColors` 매핑을 만들어 사용).

---

## 6. 색상 변경 시나리오별 예상 작업량

| 시나리오 | 변경 위치 | 예상 시간 |
|---|---|---|
| 브랜드 컬러 변경 (teal → 다른 색) | `palette.teal` 9개 hex 교체 | 5분 |
| 다크 모드 미세 조정 | `darkTheme.colors` 일부 매핑 변경 | 10분 |
| 형태별 액센트 도입 | `tripTypeAccent` 매핑 + 컴포넌트가 형태 인지하도록 | 1시간 |
| 사용자 커스텀 액센트 (Phase 3+) | Theme Provider가 user setting 읽기 | 반나절 |
| 신규 status 색상 추가 | semantic + 컴포넌트 적용 | 30분 |

토큰 시스템이 없으면 위 작업이 **각각 며칠씩** 걸리거나 일관성 깨짐.

---

## 7. 다음 단계

1. `src/theme/tokens.ts` — 본 문서를 코드로
2. `src/theme/ThemeProvider.tsx` — Context + useColorScheme 통합
3. `src/theme/useTheme.ts` — typed hook
4. 컴포넌트 작성 시 항상 `useTheme()` 사용
5. ESLint 규칙으로 hex 직접 사용 검출 (옵션)

---

## 8. 참조

- 목업의 c-* 클래스는 placeholder 매핑일 뿐. 실제 코드는 본 문서의 semantic 토큰 사용.
- 라이트/다크 모드 토글은 [REQUIREMENTS.md §4.9.2.4](./REQUIREMENTS.md) 의 테마 설정으로 노출.
