import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MetricTile } from '@/components/MetricTile';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';

export default function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const startWorkout = useWorkoutStore((s) => s.startWorkout);

  const handleStart = () => {
    startWorkout();
    router.push('/workout');
  };

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
          <Text variant="display">History</Text>
          <Text variant="body" tone="secondary">
            Review completed sessions once you start saving workouts.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <MetricTile label="Logged" value="0" icon="calendar-outline" tone="accent" />
          <MetricTile label="Sets" value="0" icon="checkmark-circle-outline" />
          <MetricTile label="Volume" value="0" icon="stats-chart-outline" tone="success" />
        </View>

        <Card muted>
          <EmptyState
            icon="time-outline"
            title="No workout history yet"
            description="Finish a workout and it will show up here with your exercises, sets, and totals."
            action={<Button label="Start Workout" icon="add" fullWidth={false} onPress={handleStart} />}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
