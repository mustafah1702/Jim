import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';

export default function TemplatesScreen() {
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
          <Text variant="display">Templates</Text>
          <Text variant="body" tone="secondary">
            Save repeatable workouts here when template building is added.
          </Text>
        </View>

        <Card style={{ gap: theme.spacing.md }}>
          <Text variant="headline">Starter Structure</Text>
          <View style={{ gap: theme.spacing.sm }}>
            {['Upper Body', 'Lower Body', 'Push Pull Legs'].map((name) => (
              <View
                key={name}
                style={{
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surfaceMuted,
                }}
              >
                <Text variant="bodyStrong">{name}</Text>
                <Text variant="caption" tone="secondary">
                  Template placeholder
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Card muted>
          <EmptyState
            compact
            icon="list-outline"
            title="No saved templates"
            description="For now, start empty and build your session as you lift."
            action={<Button label="Start Empty Workout" icon="add" fullWidth={false} onPress={handleStart} />}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
