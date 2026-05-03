import { Platform, TextStyle } from 'react-native';

const systemFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const typography = {
  display: {
    fontFamily: systemFont,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: systemFont,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headline: {
    fontFamily: systemFont,
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    fontFamily: systemFont,
    fontSize: 16,
    fontWeight: '400',
  },
  bodyStrong: {
    fontFamily: systemFont,
    fontSize: 16,
    fontWeight: '600',
  },
  caption: {
    fontFamily: systemFont,
    fontSize: 13,
    fontWeight: '400',
  },
  label: {
    fontFamily: systemFont,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
  },
  number: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 18,
    fontWeight: '600',
  },
} satisfies Record<string, TextStyle>;
