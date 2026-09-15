export interface ColorTokens {
  primary: string;
  primaryDark: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  muted: string;
  danger: string;
  success: string;
  warning: string;
  border: string;
}

export const lightColors: ColorTokens = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  secondary: '#64748B',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#94A3B8',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  border: '#E2E8F0',
};

export const darkColors: ColorTokens = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  secondary: '#94A3B8',
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  muted: '#64748B',
  danger: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  border: '#334155',
};

export const colors = {
  light: lightColors,
  dark: darkColors,
};

export type ColorScheme = 'light' | 'dark';

export function getColors(scheme: ColorScheme): ColorTokens {
  return scheme === 'dark' ? darkColors : lightColors;
}