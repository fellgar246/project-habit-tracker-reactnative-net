export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  success: string;
  danger: string;
  border: string;
};

export const lightColors: ThemeColors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#1A1D26',
  textMuted: '#6B7280',
  primary: '#4F46E5',
  success: '#059669',
  danger: '#DC2626',
  border: '#E5E7EB',
};

export const darkColors: ThemeColors = {
  background: '#0F1117',
  surface: '#1A1D26',
  text: '#F9FAFB',
  textMuted: '#9CA3AF',
  primary: '#818CF8',
  success: '#34D399',
  danger: '#F87171',
  border: '#374151',
};

export function getColors(scheme: ColorScheme): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors;
}
