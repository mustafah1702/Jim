import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { Exercise } from '@/types/workout';

type ExerciseListItemProps = {
  exercise: Exercise;
  onSelect: (exercise: Exercise) => void;
};

export function ExerciseListItem({ exercise, onSelect }: ExerciseListItemProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => onSelect(exercise)}
      style={({ pressed }) => [
        styles.item,
        {
          backgroundColor: pressed ? theme.colors.surfacePressed : theme.colors.background,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text variant="caption" tone="muted">
          {[exercise.primary_muscle, exercise.equipment].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <View style={styles.trailing}>
        {exercise.is_custom && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: theme.colors.accentSoft,
                borderRadius: theme.radius.sm,
                paddingVertical: 2,
                paddingHorizontal: 6,
              },
            ]}
          >
            <Text variant="caption" tone="accent" style={{ fontSize: 11, fontWeight: '700' }}>
              Custom
            </Text>
          </View>
        )}
        <Ionicons name="add-circle-outline" size={22} color={theme.colors.accent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: 12,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {},
});
