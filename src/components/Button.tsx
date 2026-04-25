import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const variantStyle: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: {
      bg: theme.colors.accent,
      fg: '#FFFFFF',
      border: theme.colors.accent,
    },
    secondary: {
      bg: theme.colors.surfaceElevated,
      fg: theme.colors.textPrimary,
      border: theme.colors.border,
    },
    ghost: {
      bg: 'transparent',
      fg: theme.colors.textPrimary,
      border: 'transparent',
    },
  };

  const v = variantStyle[variant];

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderRadius: theme.radius.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <Text variant="bodyStrong" style={{ color: v.fg, textAlign: 'center' }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
