import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
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
      fg: theme.colors.textInverse,
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
    danger: {
      bg: theme.colors.dangerSoft,
      fg: theme.colors.danger,
      border: theme.colors.dangerSoft,
    },
  };

  const v = variantStyle[variant];
  const sizeStyle: Record<Size, { py: number; px: number; icon: number }> = {
    sm: { py: theme.spacing.sm, px: theme.spacing.md, icon: 16 },
    md: { py: theme.spacing.md, px: theme.spacing.lg, icon: 18 },
    lg: { py: theme.spacing.lg, px: theme.spacing.xl, icon: 20 },
  };
  const s = sizeStyle[size];

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderRadius: theme.radius.md,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
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
        <View style={styles.content}>
          {icon && iconPosition === 'left' ? (
            <Ionicons name={icon} size={s.icon} color={v.fg} />
          ) : null}
          <Text variant="bodyStrong" style={{ color: v.fg, textAlign: 'center' }}>
            {label}
          </Text>
          {icon && iconPosition === 'right' ? (
            <Ionicons name={icon} size={s.icon} color={v.fg} />
          ) : null}
        </View>
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
  content: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
