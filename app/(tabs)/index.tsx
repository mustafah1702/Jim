import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MetricTile } from '@/components/MetricTile';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
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
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const activeWorkout = useWorkoutStore((s) => s.workout);

  const { data: weeklyStats, isLoading: statsLoading } = useWeeklyStats();
  const { data: recentWorkouts, isLoading: recentLoading } = useRecentWorkouts(5);

  const handleStartEmpty = () => {
    startWorkout();
    router.push('/workout');
  };

  return (
    <Screen padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.accent} />
        }
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
          {statsLoading && !weeklyStats ? (
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.md,
                    gap: theme.spacing.sm,
                  }}
                >
                  <Skeleton width={28} height={28} borderRadius={theme.radius.sm} />
                  <Skeleton width={48} height={22} />
                  <Skeleton width={64} height={12} />
                </View>
              ))}
            </View>
          ) : (
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
          )}
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <SectionHeader title="Recent" actionLabel="History" onAction={() => router.push('/history')} />
          {recentLoading && !recentWorkouts ? (
            <View style={{ gap: theme.spacing.md }}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.lg,
                    gap: theme.spacing.md,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Skeleton width="60%" height={16} />
                    <Skeleton width={40} height={16} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                    <Skeleton width={50} height={12} />
                    <Skeleton width={50} height={12} />
                    <Skeleton width={50} height={12} />
                  </View>
                </View>
              ))}
            </View>
          ) : recentWorkouts && recentWorkouts.length > 0 ? (
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
