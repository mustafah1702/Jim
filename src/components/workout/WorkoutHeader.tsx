import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { useTimer } from '@/hooks/useTimer';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';

type WorkoutHeaderProps = {
  onFinish: () => void;
  finishing: boolean;
};

export function WorkoutHeader({ onFinish, finishing }: WorkoutHeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const workout = useWorkoutStore((s) => s.workout);
  const discardWorkout = useWorkoutStore((s) => s.discardWorkout);
  const totalVolume = useWorkoutStore((s) => s.getTotalVolume());
  const totalSets = useWorkoutStore((s) => s.getTotalSets());
  const exerciseCount = workout?.exercises.length ?? 0;
  const elapsed = useTimer(workout?.startedAt ?? null);

  const handleDiscard = () => {
    Alert.alert('Discard Workout', 'Are you sure you want to discard this workout?', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          discardWorkout();
          router.back();
        },
      },
    ]);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
          gap: theme.spacing.md,
        },
      ]}
    >
      <View style={styles.topRow}>
        <IconButton icon="close" tone="danger" variant="soft" onPress={handleDiscard} />

        <View style={styles.timerWrap}>
          <Text variant="label" tone="muted">
            ACTIVE
          </Text>
          <Text variant="number">{elapsed}</Text>
        </View>

        <Button
          label={finishing ? 'Saving' : 'Finish'}
          size="sm"
          fullWidth={false}
          icon="checkmark"
          onPress={onFinish}
          disabled={finishing}
        />
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        <Text variant="title">Workout</Text>
        <Text variant="body" tone="secondary">
          Keep the log moving. Long press a set to delete it.
        </Text>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'Exercises', value: exerciseCount },
          { label: 'Sets', value: totalSets },
          { label: 'Volume', value: totalVolume.toLocaleString() },
        ].map((stat) => (
          <View
            key={stat.label}
            style={[
              styles.statPill,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <Text variant="bodyStrong">{stat.value}</Text>
            <Text variant="caption" tone="muted">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerWrap: {
    alignItems: 'center',
    gap: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
});
