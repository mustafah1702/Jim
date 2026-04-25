import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useWorkoutStore } from '@/stores/workoutStore';

export function useSaveWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const workout = useWorkoutStore.getState().workout;
      const session = useAuthStore.getState().session;
      if (!workout || !session) throw new Error('No active workout or session');

      // Insert the workout row
      const { data: workoutRow, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: session.user.id,
          started_at: workout.startedAt,
          ended_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (workoutError) throw workoutError;

      // Build all completed sets
      const sets: {
        workout_id: string;
        exercise_id: string;
        set_number: number;
        weight: number | null;
        reps: number | null;
        is_warmup: boolean;
        completed_at: string;
      }[] = [];

      for (const exercise of workout.exercises) {
        let setNumber = 1;
        for (const s of exercise.sets) {
          if (!s.completed) continue;
          sets.push({
            workout_id: workoutRow.id,
            exercise_id: exercise.exerciseId,
            set_number: setNumber++,
            weight: s.weight,
            reps: s.reps,
            is_warmup: s.isWarmup,
            completed_at: new Date().toISOString(),
          });
        }
      }

      if (sets.length > 0) {
        const { error: setsError } = await supabase.from('workout_sets').insert(sets);
        if (setsError) throw setsError;
      }
    },
    onSuccess: () => {
      useWorkoutStore.getState().discardWorkout();
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
