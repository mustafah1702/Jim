import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MetricTile } from '@/components/MetricTile';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { WorkoutHistoryCard } from '@/components/workout/WorkoutHistoryCard';
import { useRecentWorkouts } from '@/hooks/useRecentWorkouts';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';

function formatVolume(volume: number): string {
  if (volume === 0) return '0';
  if (volume < 1000) return volume.toFixed(0);
  if (volume < 10000) return (volume / 1000).toFixed(1) + 'k';
  return Math.round(volume / 1000) + 'k';
}

export default function HistoryScreen() {
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
  const { data: workouts, isLoading } = useRecentWorkouts(50);

  const handleStart = () => {
    startWorkout();
    router.push('/workout');
  };

  const totalWorkouts = workouts?.length ?? 0;
  let totalSets = 0;
  let totalVolume = 0;

  for (const w of workouts ?? []) {
    for (const s of w.sets) {
      totalSets++;
      totalVolume += (s.weight ?? 0) * (s.reps ?? 0);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
          gap: theme.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.accent} />
        }
      >
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="display">History</Text>
          <Text variant="body" tone="secondary">
            All your completed sessions in one place.
          </Text>
        </View>

        {isLoading && !workouts ? (
          <>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surfaceElevated,
                    borderRadius: theme.radius.lg,
                    padding: theme.spacing.md,
                    gap: theme.spacing.sm,
                  }}
                >
                  <Skeleton width={28} height={28} borderRadius={theme.radius.sm} />
                  <Skeleton width={56} height={28} />
                  <Skeleton width={64} height={12} />
                </View>
              ))}
            </View>
            <View style={{ gap: theme.spacing.md }}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: theme.colors.surfaceElevated,
                    borderRadius: theme.radius.lg,
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
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <MetricTile
                label="Logged"
                value={String(totalWorkouts)}
                icon="calendar-outline"
                tone="accent"
              />
              <MetricTile
                label="Sets"
                value={String(totalSets)}
                icon="checkmark-circle-outline"
              />
              <MetricTile
                label="Volume"
                value={formatVolume(totalVolume)}
                icon="stats-chart-outline"
                tone="success"
              />
            </View>

            {workouts && workouts.length > 0 ? (
              <View style={{ gap: theme.spacing.md }}>
                {workouts.map((w) => (
                  <WorkoutHistoryCard key={w.id} workout={w} />
                ))}
              </View>
            ) : (
              <Card muted>
                <EmptyState
                  icon="time-outline"
                  title="Your workouts will show up here"
                  description="After you finish a workout, you'll see it here with your sets, volume, and duration."
                  action={<Button label="Start Workout" icon="add" fullWidth={false} onPress={handleStart} />}
                />
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
