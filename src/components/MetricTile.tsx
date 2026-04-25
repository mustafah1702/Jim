import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

type MetricTileProps = {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'default' | 'accent' | 'success';
  style?: ViewStyle;
};

export function MetricTile({ label, value, icon, tone = 'default', style }: MetricTileProps) {
  const theme = useTheme();
  const color = tone === 'success' ? theme.colors.success : tone === 'accent' ? theme.colors.accent : theme.colors.textSecondary;
  const bg = tone === 'success' ? theme.colors.successSoft : tone === 'accent' ? theme.colors.accentSoft : theme.colors.surfaceMuted;

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
        },
        style,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: bg, borderRadius: theme.radius.sm }]}>
        {icon ? <Ionicons name={icon} size={16} color={color} /> : null}
      </View>
      <Text variant="title" style={{ fontSize: 22 }}>
        {value}
      </Text>
      <Text variant="caption" tone="secondary" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
