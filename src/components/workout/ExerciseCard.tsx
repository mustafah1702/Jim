import { useRef, useEffect, createRef } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { SetRow, type SetRowRef } from '@/components/workout/SetRow';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';
import type { WorkoutExercise } from '@/types/workout';

type ExerciseCardProps = {
  exercise: WorkoutExercise;
  checkPR: (exerciseId: string, weight: number | null, reps: number | null) => { isWeightPR: boolean; isVolumePR: boolean };
};

export function ExerciseCard({ exercise, checkPR }: ExerciseCardProps) {
  const theme = useTheme();
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer);

  const setRefs = useRef<React.RefObject<SetRowRef | null>[]>([]);

  // Keep refs array in sync with sets count
  while (setRefs.current.length < exercise.sets.length) {
    setRefs.current.push(createRef<SetRowRef>());
  }
  if (setRefs.current.length > exercise.sets.length) {
    setRefs.current.length = exercise.sets.length;
  }

  const prevSetsCount = useRef(exercise.sets.length);

  useEffect(() => {
    // Auto-focus new set when added
    if (exercise.sets.length > prevSetsCount.current) {
      const lastRef = setRefs.current[exercise.sets.length - 1];
      setTimeout(() => lastRef?.current?.focusWeight(), 50);
    }
    prevSetsCount.current = exercise.sets.length;
  }, [exercise.sets.length]);

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

      {exercise.sets.map((set, i) => {
        const pr =
          set.completed && !set.isWarmup
            ? checkPR(exercise.exerciseId, set.weight, set.reps)
            : { isWeightPR: false, isVolumePR: false };

        const isLastSet = i === exercise.sets.length - 1;

        return (
          <SetRow
            key={set.id}
            ref={setRefs.current[i]}
            set={set}
            index={i}
            isPR={pr.isWeightPR || pr.isVolumePR}
            isLastSet={isLastSet}
            onUpdate={(updates) => {
              updateSet(exercise.id, set.id, updates);
              if (updates.completed === true) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                startRestTimer();
              }
            }}
            onRemove={() => removeSet(exercise.id, set.id)}
            onSubmitLastField={() => {
              if (!isLastSet) {
                setRefs.current[i + 1]?.current?.focusWeight();
              }
              // Last set in exercise: keyboard dismisses naturally
            }}
          />
        );
      })}

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
