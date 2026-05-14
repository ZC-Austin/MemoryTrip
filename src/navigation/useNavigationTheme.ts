import { useColorScheme } from 'react-native';
import type { Theme as NavTheme } from '@react-navigation/native';
import { lightTheme, darkTheme } from '../theme/tokens';

// 앱 디자인 토큰 → React Navigation 테마 매핑
export function useNavigationTheme(): NavTheme {
  const scheme = useColorScheme();
  const t = scheme === 'dark' ? darkTheme : lightTheme;

  return {
    dark: scheme === 'dark',
    colors: {
      primary:      t.colors.primary,
      background:   t.colors.background,
      card:         t.colors.surface,
      text:         t.colors.textPrimary,
      border:       t.colors.border,
      notification: t.colors.danger,
    },
    fonts: {
      regular: { fontFamily: t.fontFamily.sans, fontWeight: t.fontWeight.regular },
      medium:  { fontFamily: t.fontFamily.sans, fontWeight: t.fontWeight.medium },
      bold:    { fontFamily: t.fontFamily.sans, fontWeight: t.fontWeight.medium },
      heavy:   { fontFamily: t.fontFamily.sans, fontWeight: t.fontWeight.medium },
    },
  };
}
