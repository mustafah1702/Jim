import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export type WorkoutHistorySet = {
  id: string;
  exercise_id: string;
  weight: number | null;
  reps: number | null;
  is_warmup: boolean;
  exercise_name: string;
  primary_muscle: string | null;
};

export type WorkoutHistory = {
  id: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  sets: WorkoutHistorySet[];
};

export function useRecentWorkouts(limit = 5) {
  const session = useAuthStore((s) => s.session);

  return useQuery<WorkoutHistory[]>({
    queryKey: ['workouts', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select(
          `
          id, started_at, ended_at, notes,
          workout_sets (
            id, exercise_id, weight, reps, is_warmup,
            exercises (name, primary_muscle)
          )
        `
        )
        .eq('user_id', session!.user.id)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data ?? []).map((w: any) => ({
        id: w.id,
        started_at: w.started_at,
        ended_at: w.ended_at,
        notes: w.notes,
        sets: (w.workout_sets ?? []).map((s: any) => ({
          id: s.id,
          exercise_id: s.exercise_id,
          weight: s.weight,
          reps: s.reps,
          is_warmup: s.is_warmup,
          exercise_name: s.exercises?.name ?? 'Unknown',
          primary_muscle: s.exercises?.primary_muscle ?? null,
        })),
      }));
    },
    enabled: !!session,
    staleTime: 30_000,
  });
}
