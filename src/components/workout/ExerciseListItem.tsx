import { Pressable, StyleSheet, View } from 'react-native';
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
          backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{exercise.name}</Text>
        <Text variant="caption" tone="muted">
          {[exercise.primary_muscle, exercise.equipment].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {exercise.is_custom && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.accent + '20',
              borderRadius: theme.radius.sm,
              paddingVertical: 2,
              paddingHorizontal: 6,
            },
          ]}
        >
          <Text variant="caption" tone="accent" style={{ fontSize: 11, fontWeight: '600' }}>
            Custom
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  badge: {},
});
