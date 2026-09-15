import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';
import { colors, darkColors, getColors, lightColors } from './colors';
import type { ColorTokens, ColorScheme } from './colors';
import { fontSize, fontWeight, iconSize, radius, shadow, spacing } from './spacing';

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  iconSize: typeof iconSize;
  shadow: typeof shadow;
  isDark: boolean;
}

function resolveScheme(preference: 'light' | 'dark' | 'system', system: 'light' | 'dark' | null): ColorScheme {
  if (preference === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.settings.themeMode);
  const scheme = resolveScheme(themeMode, systemScheme ?? 'light');
  const tokens = getColors(scheme);

  return {
    scheme,
    colors: tokens,
    spacing,
    radius,
    fontSize,
    fontWeight,
    iconSize,
    shadow,
    isDark: scheme === 'dark',
  };
}

export { colors, darkColors, lightColors, getColors };
export type { ColorTokens, ColorScheme };
export { spacing, radius, fontSize, fontWeight, iconSize, shadow };
export * from './colors';
export * from './spacing';