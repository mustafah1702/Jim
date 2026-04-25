import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';

export default function TodayScreen() {
  const theme = useTheme();
  const router = useRouter();
  const startWorkout = useWorkoutStore((s) => s.startWorkout);

  const handleStartEmpty = () => {
    startWorkout();
    router.push('/workout');
  };

  return (
    <Screen>
      <View style={{ flex: 1, gap: theme.spacing.xl, paddingTop: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="caption" tone="muted">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text variant="display">Ready to lift?</Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.md }}>
          <Button label="Start empty workout" onPress={handleStartEmpty} />
          <Button label="Start from template" variant="secondary" onPress={() => {}} />
        </View>
      </View>
    </Screen>
  );
}
