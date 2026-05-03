import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export type WorkoutUpdatePayload = {
  workoutId: string;
  notes: string | null;
  setsToUpdate: Array<{
    id: string;
    weight: number | null;
    reps: number | null;
    is_warmup: boolean;
  }>;
  setsToDelete: string[];
  setsToInsert: Array<{
    exercise_id: string;
    weight: number | null;
    reps: number | null;
    is_warmup: boolean;
    set_number: number;
  }>;
  affectedExerciseIds: string[];
  workoutEndedAt: string | null;
};

export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: WorkoutUpdatePayload) => {
      const session = useAuthStore.getState().session;
      if (!session) throw new Error('No session');
      const userId = session.user.id;

      {
        const { error } = await supabase
          .from('workouts')
          .update({ notes: payload.notes })
          .eq('id', payload.workoutId)
          .eq('user_id', userId);
        if (error) throw error;
      }

      for (const s of payload.setsToUpdate) {
        const { error } = await supabase
          .from('workout_sets')
          .update({ weight: s.weight, reps: s.reps, is_warmup: s.is_warmup })
          .eq('id', s.id);
        if (error) throw error;
      }

      if (payload.setsToDelete.length > 0) {
        const { error } = await supabase
          .from('workout_sets')
          .delete()
          .in('id', payload.setsToDelete);
        if (error) throw error;
      }

      if (payload.setsToInsert.length > 0) {
        const completedAt = payload.workoutEndedAt ?? new Date().toISOString();
        const rows = payload.setsToInsert.map((s) => ({
          workout_id: payload.workoutId,
          exercise_id: s.exercise_id,
          weight: s.weight,
          reps: s.reps,
          is_warmup: s.is_warmup,
          set_number: s.set_number,
          completed_at: completedAt,
        }));
        const { error } = await supabase.from('workout_sets').insert(rows);
        if (error) throw error;
      }

      for (const exerciseId of payload.affectedExerciseIds) {
        await recalculatePRsForExercise(userId, exerciseId);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'detail', variables.workoutId] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyStats'] });
    },
  });
}

async function recalculatePRsForExercise(userId: string, exerciseId: string) {
  const { data, error } = await supabase
    .from('workout_sets')
    .select('weight, reps, workouts!inner(user_id)')
    .eq('exercise_id', exerciseId)
    .eq('workouts.user_id', userId)
    .eq('is_warmup', false)
    .not('weight', 'is', null)
    .not('reps', 'is', null);

  if (error) throw error;

  let bestWeight = 0;
  let bestVolume = 0;
  for (const row of (data ?? []) as Array<{ weight: number | null; reps: number | null }>) {
    const w = Number(row.weight);
    const r = Number(row.reps);
    if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r <= 0) continue;
    if (w > bestWeight) bestWeight = w;
    const vol = w * r;
    if (vol > bestVolume) bestVolume = vol;
  }

  await supabase.from('personal_records').upsert(
    {
      user_id: userId,
      exercise_id: exerciseId,
      record_type: 'weight',
      record_value: bestWeight,
    },
    { onConflict: 'user_id,exercise_id,record_type' },
  );

  await supabase.from('personal_records').upsert(
    {
      user_id: userId,
      exercise_id: exerciseId,
      record_type: 'volume',
      record_value: bestVolume,
    },
    { onConflict: 'user_id,exercise_id,record_type' },
  );
}
