import { useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { AddExerciseButton } from '@/components/workout/AddExerciseButton';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { RestTimerBanner } from '@/components/workout/RestTimerBanner';
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { useSaveWorkout } from '@/hooks/useSaveWorkout';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';

export default function WorkoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const workout = useWorkoutStore((s) => s.workout);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const getTotalSets = useWorkoutStore((s) => s.getTotalSets);
  const saveMutation = useSaveWorkout();

  // Start workout if navigated here without one active
  useEffect(() => {
    if (!workout) startWorkout();
  }, []);

  const handleFinish = () => {
    const completedSets = getTotalSets();
    if (completedSets === 0) {
      Alert.alert(
        'No Completed Sets',
        'You haven\'t completed any sets. Do you want to discard this workout?',
        [
          { text: 'Keep Going', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              useWorkoutStore.getState().discardWorkout();
              router.back();
            },
          },
        ],
      );
      return;
    }

    Alert.alert('Finish Workout', `Save workout with ${completedSets} completed set${completedSets !== 1 ? 's' : ''}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: () => {
          saveMutation.mutate(undefined, {
            onSuccess: () => router.back(),
            onError: (error) => {
              Alert.alert('Error', `Failed to save workout: ${error.message}`);
            },
          });
        },
      },
    ]);
  };

  if (!workout) return null;

  return (
    <Screen edges={['top']} padded={false}>
      <WorkoutHeader onFinish={handleFinish} finishing={saveMutation.isPending} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.lg,
            gap: theme.spacing.md,
            paddingBottom: 100, // room for rest timer banner
          }}
          keyboardShouldPersistTaps="handled"
        >
          {workout.exercises.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxxl }}>
              <Text variant="body" tone="muted">
                Add an exercise to get started
              </Text>
            </View>
          )}

          {workout.exercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}

          <AddExerciseButton />
        </ScrollView>
      </KeyboardAvoidingView>

      <RestTimerBanner />
    </Screen>
  );
}
