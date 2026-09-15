import { useTheme as useThemeInternal, Theme } from '@/theme';

export type { Theme };

export function useTheme(): Theme {
  return useThemeInternal();
}

export function useIsDark(): boolean {
  return useThemeInternal().isDark;
}

export function useColors() {
  return useThemeInternal().colors;
}