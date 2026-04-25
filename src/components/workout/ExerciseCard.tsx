import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { SetRow } from '@/components/workout/SetRow';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';
import type { WorkoutExercise } from '@/types/workout';

type ExerciseCardProps = {
  exercise: WorkoutExercise;
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const theme = useTheme();
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer);

  const handleOverflowMenu = () => {
    Alert.alert(exercise.name, undefined, [
      {
        text: 'Remove Exercise',
        style: 'destructive',
        onPress: () => removeExercise(exercise.id),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Card style={{ gap: theme.spacing.md, padding: theme.spacing.md }}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Text variant="headline" numberOfLines={1}>
            {exercise.name}
          </Text>
          {(exercise.primaryMuscle || exercise.equipment) && (
            <Text variant="caption" tone="secondary">
              {[exercise.primaryMuscle, exercise.equipment].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>
        <IconButton icon="ellipsis-horizontal" size={34} variant="plain" onPress={handleOverflowMenu} />
      </View>

      <View
        style={[
          styles.columnHeaders,
          {
            paddingHorizontal: theme.spacing.sm,
          },
        ]}
      >
        <Text variant="caption" tone="muted" style={styles.setLabelHeader}>
          SET
        </Text>
        <Text variant="caption" tone="muted" style={styles.colHeader}>
          LBS
        </Text>
        <Text variant="caption" tone="muted" style={{ marginHorizontal: 2 }}>
          {'  '}
        </Text>
        <Text variant="caption" tone="muted" style={styles.colHeader}>
          REPS
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {exercise.sets.map((set, i) => (
        <SetRow
          key={set.id}
          set={set}
          index={i}
          onUpdate={(updates) => {
            updateSet(exercise.id, set.id, updates);
            // Start rest timer when completing a set
            if (updates.completed === true) {
              startRestTimer();
            }
          }}
          onRemove={() => removeSet(exercise.id, set.id)}
        />
      ))}

      <Pressable
        onPress={() => addSet(exercise.id)}
        style={[
          styles.addSetBtn,
          {
            paddingVertical: theme.spacing.md,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surfaceMuted,
          },
        ]}
      >
        <Ionicons name="add" size={16} color={theme.colors.accent} />
        <Text variant="caption" tone="accent" style={{ fontWeight: '600' }}>
          Add Set
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setLabelHeader: {
    width: 28,
    textAlign: 'center',
    fontWeight: '600',
  },
  colHeader: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
