import { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  style?: ViewStyle;
};

export function EmptyState({ icon, title, description, action, compact = false, style }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          gap: compact ? theme.spacing.sm : theme.spacing.md,
          paddingVertical: compact ? theme.spacing.lg : theme.spacing.xxxl,
          paddingHorizontal: theme.spacing.lg,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            width: compact ? 40 : 52,
            height: compact ? 40 : 52,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.accentSoft,
          },
        ]}
      >
        <Ionicons name={icon} size={compact ? 20 : 24} color={theme.colors.accent} />
      </View>
      <View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
        <Text variant={compact ? 'bodyStrong' : 'headline'} style={{ textAlign: 'center' }}>
          {title}
        </Text>
        {description ? (
          <Text variant="body" tone="secondary" style={{ textAlign: 'center', maxWidth: 300 }}>
            {description}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
