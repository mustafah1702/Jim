import { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

type CardProps = {
  children: ReactNode;
  muted?: boolean;
  style?: ViewStyle;
};

export function Card({ children, muted = false, style }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: muted ? theme.colors.surfaceMuted : theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
