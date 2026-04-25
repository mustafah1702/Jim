import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

type IconButtonProps = Omit<PressableProps, 'style'> & {
  icon: keyof typeof Ionicons.glyphMap;
  tone?: 'default' | 'accent' | 'danger';
  variant?: 'plain' | 'soft' | 'outline';
  size?: number;
};

export function IconButton({
  icon,
  tone = 'default',
  variant = 'soft',
  size = 40,
  disabled,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();
  const color = {
    default: theme.colors.textPrimary,
    accent: theme.colors.accent,
    danger: theme.colors.danger,
  }[tone];
  const softBg = {
    default: theme.colors.surfaceMuted,
    accent: theme.colors.accentSoft,
    danger: theme.colors.dangerSoft,
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: theme.radius.md,
          backgroundColor: variant === 'soft' ? softBg : 'transparent',
          borderColor: variant === 'outline' ? theme.colors.border : 'transparent',
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
      ]}
      {...rest}
    >
      <Ionicons name={icon} size={Math.round(size * 0.48)} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
