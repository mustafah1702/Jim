import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { WorkoutHistory } from '@/hooks/useRecentWorkouts';

export function useWorkoutById(id: string | undefined) {
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  return useQuery<WorkoutHistory | null>({
    queryKey: ['workouts', 'detail', id],
    queryFn: async () => {
      if (!id) return null;

      // Cache-first ONLY on the initial fetch. On refetch (after a save), this
      // query already has data, so skip the recent-workouts cache (which may
      // also be mid-refetch with stale values) and go straight to the network.
      const hasExistingData =
        queryClient.getQueryData<WorkoutHistory | null>(['workouts', 'detail', id]) !== undefined;

      if (!hasExistingData) {
        const recentCaches = queryClient.getQueriesData<WorkoutHistory[]>({
          queryKey: ['workouts', 'recent'],
        });
        for (const [, list] of recentCaches) {
          if (!list) continue;
          const found = list.find((w) => w.id === id);
          if (found) return found;
        }
      }

      // Fallback: fetch single workout from Supabase.
      const { data, error } = await supabase
        .from('workouts')
        .select(
          `
          id, started_at, ended_at, notes,
          workout_sets (
            id, exercise_id, weight, reps, is_warmup, set_number,
            exercises (name, primary_muscle)
          )
        `,
        )
        .eq('id', id)
        .eq('user_id', session!.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // no rows
        throw error;
      }
      if (!data) return null;

      return {
        id: data.id,
        started_at: data.started_at,
        ended_at: data.ended_at,
        notes: data.notes,
        sets: (data.workout_sets ?? [])
          .sort((a: any, b: any) => (a.set_number ?? 0) - (b.set_number ?? 0))
          .map((s: any) => ({
            id: s.id,
            exercise_id: s.exercise_id,
            weight: s.weight,
            reps: s.reps,
            is_warmup: s.is_warmup,
            exercise_name: s.exercises?.name ?? 'Unknown',
            primary_muscle: s.exercises?.primary_muscle ?? null,
          })),
      };
    },
    enabled: !!id && !!session,
    staleTime: 30_000,
  });
}
