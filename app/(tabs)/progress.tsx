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

export default function ProgressScreen() {
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
          <Text variant="display">Progress</Text>
          <Text variant="body" tone="secondary">
            Track strength trends and consistency as your log grows.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <MetricTile label="Best Lift" value="-" icon="trophy-outline" tone="accent" />
          <MetricTile label="Avg Sets" value="0" icon="repeat-outline" />
          <MetricTile label="Trend" value="-" icon="analytics-outline" tone="success" />
        </View>

        <Card style={{ gap: theme.spacing.md }}>
          <View style={{ height: 120, justifyContent: 'flex-end', flexDirection: 'row', gap: theme.spacing.sm }}>
            {[32, 54, 42, 76, 64, 92].map((height, index) => (
              <View
                key={index}
                style={{
                  flex: 1,
                  height,
                  borderRadius: theme.radius.sm,
                  backgroundColor: index === 5 ? theme.colors.accent : theme.colors.surfaceMuted,
                  alignSelf: 'flex-end',
                }}
              />
            ))}
          </View>
          <Text variant="caption" tone="muted">
            Preview data shown until workouts are logged.
          </Text>
        </Card>

        <Card muted>
          <EmptyState
            compact
            icon="trending-up-outline"
            title="Progress charts are waiting"
            description="Complete workouts to unlock exercise trends, volume changes, and personal bests."
            action={<Button label="Log Workout" icon="add" fullWidth={false} onPress={handleStart} />}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
