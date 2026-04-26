import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MetricTile } from '@/components/MetricTile';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { WorkoutHistoryCard } from '@/components/workout/WorkoutHistoryCard';
import { useRecentWorkouts } from '@/hooks/useRecentWorkouts';
import { useWeeklyStats } from '@/hooks/useWeeklyStats';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';

function formatVolume(volume: number): string {
  if (volume === 0) return '0';
  if (volume < 1000) return volume.toFixed(0);
  if (volume < 10000) return (volume / 1000).toFixed(1) + 'k';
  return Math.round(volume / 1000) + 'k';
}

export default function TodayScreen() {
  const theme = useTheme();
  const router = useRouter();
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const activeWorkout = useWorkoutStore((s) => s.workout);

  const { data: weeklyStats } = useWeeklyStats();
  const { data: recentWorkouts } = useRecentWorkouts(5);

  const handleStartEmpty = () => {
    startWorkout();
    router.push('/workout');
  };

  return (
    <Screen padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
          gap: theme.spacing.xl,
        }}
      >
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="label" tone="muted">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text variant="display">Ready to lift?</Text>
          <Text variant="body" tone="secondary">
            Start fast, track cleanly, and keep the session moving.
          </Text>
        </View>

        <Card style={{ gap: theme.spacing.lg }}>
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="headline">Today</Text>
            <Text variant="body" tone="secondary">
              {activeWorkout
                ? `${activeWorkout.exercises.length} exercise${activeWorkout.exercises.length === 1 ? '' : 's'} in progress`
                : 'No active workout yet'}
            </Text>
          </View>
          <View style={{ gap: theme.spacing.md }}>
            <Button
              label={activeWorkout ? 'Resume Workout' : 'Start Workout'}
              icon={activeWorkout ? 'play' : 'add'}
              onPress={() => {
                if (!activeWorkout) startWorkout();
                router.push('/workout');
              }}
            />
            <Button
              label="Start from Template"
              icon="list-outline"
              variant="secondary"
              onPress={() => router.push('/templates')}
            />
          </View>
        </Card>

        <View style={{ gap: theme.spacing.md }}>
          <SectionHeader title="This Week" />
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <MetricTile
              label="Workouts"
              value={String(weeklyStats?.workouts ?? 0)}
              icon="barbell-outline"
              tone="accent"
            />
            <MetricTile
              label="Volume"
              value={formatVolume(weeklyStats?.volume ?? 0)}
              icon="trending-up-outline"
            />
            <MetricTile
              label="PRs"
              value={String(weeklyStats?.prs ?? 0)}
              icon="trophy-outline"
              tone="success"
            />
          </View>
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <SectionHeader title="Recent" actionLabel="History" onAction={() => router.push('/history')} />
          {recentWorkouts && recentWorkouts.length > 0 ? (
            recentWorkouts.map((w) => <WorkoutHistoryCard key={w.id} workout={w} />)
          ) : (
            <Card muted>
              <EmptyState
                compact
                icon="time-outline"
                title="No workouts logged"
                description="Finished workouts will appear here with volume, sets, and duration."
                action={
                  <Button
                    label="Log first workout"
                    icon="add"
                    size="sm"
                    fullWidth={false}
                    onPress={handleStartEmpty}
                  />
                }
              />
            </Card>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
