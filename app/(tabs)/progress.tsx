import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MetricTile } from '@/components/MetricTile';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { VolumeChart } from '@/components/progress/VolumeChart';
import { PRTrendChart } from '@/components/progress/PRTrendChart';
import { MuscleBreakdown } from '@/components/progress/MuscleBreakdown';
import { FrequencyGrid } from '@/components/progress/FrequencyGrid';
import { useProgressStats } from '@/hooks/useProgressStats';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';

function formatVolume(volume: number): string {
  if (volume === 0) return '0';
  if (volume < 1000) return volume.toFixed(0);
  if (volume < 10000) return (volume / 1000).toFixed(1) + 'k';
  return Math.round(volume / 1000) + 'k';
}

export default function ProgressScreen() {
  const theme = useTheme();
  const router = useRouter();
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const { data: stats } = useProgressStats();

  const handleStart = () => {
    startWorkout();
    router.push('/workout');
  };

  const hasData = stats && stats.totalWorkouts > 0;

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
      >
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="display">Progress</Text>
          <Text variant="body" tone="secondary">
            Track strength trends and consistency as your log grows.
          </Text>
        </View>

        {hasData ? (
          <>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <MetricTile
                label="Workouts"
                value={String(stats.totalWorkouts)}
                icon="barbell-outline"
                tone="accent"
              />
              <MetricTile
                label="Streak"
                value={stats.currentStreak > 0 ? `${stats.currentStreak}w` : '0'}
                icon="flame-outline"
                tone="success"
              />
              <MetricTile
                label="Volume"
                value={formatVolume(stats.totalVolume)}
                icon="stats-chart-outline"
              />
            </View>

            {stats.weeklyVolume.length > 0 && <VolumeChart data={stats.weeklyVolume} />}

            {stats.prTrend.length > 0 && <PRTrendChart data={stats.prTrend} />}

            {stats.muscleBreakdown.length > 0 && <MuscleBreakdown data={stats.muscleBreakdown} />}

            {stats.weeklyFrequency.length > 0 && <FrequencyGrid data={stats.weeklyFrequency} />}
          </>
        ) : (
          <Card muted>
            <EmptyState
              icon="trending-up-outline"
              title="Progress charts are waiting"
              description="Complete workouts to unlock exercise trends, volume changes, and personal bests."
              action={<Button label="Log Workout" icon="add" fullWidth={false} onPress={handleStart} />}
            />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
