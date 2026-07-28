import { useColorScheme } from 'react-native';

import { ColorScheme, getColors, ThemeColors } from './colors';
import { spacing, Spacing } from './spacing';
import { typography, TypographyVariant } from './typography';

export type Theme = {
  colors: ThemeColors;
  spacing: Spacing;
  typography: typeof typography;
  colorScheme: ColorScheme;
};

function resolveColorScheme(scheme: ReturnType<typeof useColorScheme>): ColorScheme {
  return scheme === 'dark' ? 'dark' : 'light';
}

export function useTheme(): Theme {
  const scheme = resolveColorScheme(useColorScheme());

  return {
    colors: getColors(scheme),
    spacing,
    typography,
    colorScheme: scheme,
  };
}

export type { TypographyVariant };
