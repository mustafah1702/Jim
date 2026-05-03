import { useTheme } from '@/theme';
import { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

type CardProps = {
  children: ReactNode;
  muted?: boolean;
  style?: ViewStyle;
};

export function Card({ children, muted = false, style }: CardProps) {
  const theme = useTheme();
  const isDark = theme.scheme === 'dark';

  const elevation: ViewStyle = isDark
    ? { borderWidth: 1, borderColor: theme.colors.border }
    : Platform.select({
        ios: {
          shadowColor: theme.colors.shadow,
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 2 },
        },
        android: { elevation: 1 },
        default: {},
      }) ?? {};

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: muted ? theme.colors.surfaceMuted : theme.colors.surfaceElevated,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
        },
        elevation,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
});
