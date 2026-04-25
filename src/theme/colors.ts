const palette = {
  black: '#0A0A0B',
  nearBlack: '#121214',
  charcoal: '#1C1C1F',
  graphite: '#2A2A2E',
  slate: '#48484E',
  steel: '#8E8E93',
  fog: '#C7C7CC',
  paper: '#F2F2F7',
  white: '#FFFFFF',

  accent: '#FF5A1F',
  accentMuted: '#FF8C5A',

  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
};

export const lightColors = {
  background: palette.paper,
  surface: palette.white,
  surfaceElevated: palette.white,
  border: palette.fog,
  textPrimary: palette.black,
  textSecondary: palette.slate,
  textMuted: palette.steel,
  accent: palette.accent,
  accentMuted: palette.accentMuted,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
};

export const darkColors = {
  background: palette.black,
  surface: palette.nearBlack,
  surfaceElevated: palette.charcoal,
  border: palette.graphite,
  textPrimary: palette.white,
  textSecondary: palette.fog,
  textMuted: palette.steel,
  accent: palette.accent,
  accentMuted: palette.accentMuted,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
};

export type ThemeColors = typeof lightColors;
