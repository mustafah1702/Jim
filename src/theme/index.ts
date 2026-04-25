import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from './colors';
import { radius, spacing } from './spacing';
import { typography } from './typography';

export type Theme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  scheme: 'light' | 'dark';
};

export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  radius,
  typography,
  scheme: 'light',
};

export const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  radius,
  typography,
  scheme: 'dark',
};

export const useTheme = (): Theme => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
};

export { spacing, radius, typography };
