import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
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
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
          gap: theme.spacing.md,
        },
      ]}
    >
      {/* Top row: Discard / Timer / Finish */}
      <View style={styles.topRow}>
        <Pressable onPress={handleDiscard} hitSlop={8}>
          <Text variant="body" tone="danger">
            Discard
          </Text>
        </Pressable>

        <Text variant="number">{elapsed}</Text>

        <Pressable
          onPress={onFinish}
          disabled={finishing}
          style={[
            styles.finishBtn,
            {
              backgroundColor: theme.colors.accent,
              borderRadius: theme.radius.sm,
              paddingVertical: theme.spacing.xs,
              paddingHorizontal: theme.spacing.md,
              opacity: finishing ? 0.5 : 1,
            },
          ]}
        >
          <Text variant="bodyStrong" style={{ color: '#FFFFFF' }}>
            {finishing ? 'Saving...' : 'Finish'}
          </Text>
        </Pressable>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text variant="caption" tone="muted">
          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
        </Text>
        <Text variant="caption" tone="muted">
          ·
        </Text>
        <Text variant="caption" tone="muted">
          {totalSets} set{totalSets !== 1 ? 's' : ''}
        </Text>
        <Text variant="caption" tone="muted">
          ·
        </Text>
        <Text variant="caption" tone="muted">
          {totalVolume.toLocaleString()} lbs
        </Text>
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
  finishBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
});
