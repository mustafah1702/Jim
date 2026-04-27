import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { AddExerciseButton } from '@/components/workout/AddExerciseButton';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { RestTimerBanner } from '@/components/workout/RestTimerBanner';
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { Ionicons } from '@expo/vector-icons';
import { useSaveWorkout } from '@/hooks/useSaveWorkout';
import { useWorkoutPRs } from '@/hooks/useWorkoutPRs';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';
import { Text } from '@/components/Text';

export default function WorkoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const workout = useWorkoutStore((s) => s.workout);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const getTotalSets = useWorkoutStore((s) => s.getTotalSets);
  const notes = useWorkoutStore((s) => s.workout?.notes ?? '');
  const setNotes = useWorkoutStore((s) => s.setNotes);
  const [notesExpanded, setNotesExpanded] = useState(notes.length > 0);
  const saveMutation = useSaveWorkout();
  const { fetchBaselines, checkPR } = useWorkoutPRs();

  // Start workout if navigated here without one active
  useEffect(() => {
    if (!workout) startWorkout();
  }, []);

  useEffect(() => {
    if (!workout || workout.exercises.length === 0) return;
    const exerciseIds = workout.exercises.map((e) => e.exerciseId);
    fetchBaselines(exerciseIds);
  }, [workout?.exercises.length]);

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
            onSuccess: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            },
            onError: (error) => {
              Alert.alert('Save Failed', error.message, [
                { text: 'OK', style: 'cancel' },
                { text: 'Retry', onPress: () => saveMutation.mutate() },
              ]);
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
            paddingBottom: 120,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {notesExpanded ? (
            <TextInput
              style={{
                backgroundColor: theme.colors.surfaceElevated,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                color: theme.colors.textPrimary,
                fontSize: 15,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did it go?"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={500}
              selectionColor={theme.colors.accent}
            />
          ) : (
            <Pressable
              onPress={() => setNotesExpanded(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
                paddingVertical: theme.spacing.sm,
              }}
            >
              <Ionicons name="create-outline" size={16} color={theme.colors.textMuted} />
              <Text variant="body" tone="muted">
                {notes ? notes : 'Add notes...'}
              </Text>
            </Pressable>
          )}

          {workout.exercises.length === 0 && (
            <View
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surfaceElevated,
              }}
            >
              <EmptyState
                icon="barbell-outline"
                title="Build your workout"
                description="Add your first exercise, then log weight and reps as you move."
              />
            </View>
          )}

          {workout.exercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} checkPR={checkPR} />
          ))}

          <AddExerciseButton />
        </ScrollView>
      </KeyboardAvoidingView>

      <RestTimerBanner />
    </Screen>
  );
}
