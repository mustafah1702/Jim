import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme, typography } from '@/theme';

type Variant = keyof typeof typography;
type Tone = 'primary' | 'secondary' | 'muted' | 'accent' | 'danger' | 'success';

type TextProps = RNTextProps & {
  variant?: Variant;
  tone?: Tone;
};

export function Text({ variant = 'body', tone = 'primary', style, children, ...rest }: TextProps) {
  const theme = useTheme();

  const toneColor: Record<Tone, string> = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    accent: theme.colors.accent,
    danger: theme.colors.danger,
    success: theme.colors.success,
  };

  return (
    <RNText
      style={[typography[variant] as TextStyle, { color: toneColor[tone] }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
