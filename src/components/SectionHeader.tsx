import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Text variant="headline">{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.action}>
          <Text variant="caption" tone="accent" style={{ fontWeight: '700' }}>
            {actionLabel}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
