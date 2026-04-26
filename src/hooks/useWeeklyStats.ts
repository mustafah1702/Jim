import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export type WeeklyStats = {
  workouts: number;
  volume: number;
  prs: number;
};

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - diff);
  return monday.toISOString();
}

export function useWeeklyStats() {
  const session = useAuthStore((s) => s.session);
  const weekStart = getWeekStart();

  return useQuery<WeeklyStats>({
    queryKey: ['workouts', 'weekly-stats', weekStart],
    queryFn: async () => {
      const userId = session!.user.id;

      // 1. Get this week's workouts
      const { data: weekWorkouts, error: wError } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', userId)
        .gte('started_at', weekStart);

      if (wError) throw wError;

      const weekWorkoutIds = (weekWorkouts ?? []).map((w) => w.id);

      if (weekWorkoutIds.length === 0) {
        return { workouts: 0, volume: 0, prs: 0 };
      }

      // 2. Get this week's sets
      const { data: weekSets, error: sError } = await supabase
        .from('workout_sets')
        .select('exercise_id, weight, reps')
        .in('workout_id', weekWorkoutIds);

      if (sError) throw sError;

      // Calculate total volume
      let volume = 0;
      const weekMaxWeight = new Map<string, number>();
      const weekMaxVolume = new Map<string, number>();

      for (const s of weekSets ?? []) {
        const w = s.weight ?? 0;
        const r = s.reps ?? 0;
        volume += w * r;

        if (s.weight != null) {
          const prevW = weekMaxWeight.get(s.exercise_id) ?? 0;
          if (s.weight > prevW) weekMaxWeight.set(s.exercise_id, s.weight);
        }

        const setVolume = w * r;
        if (setVolume > 0) {
          const prevV = weekMaxVolume.get(s.exercise_id) ?? 0;
          if (setVolume > prevV) weekMaxVolume.set(s.exercise_id, setVolume);
        }
      }

      // 3. Get previous workouts (before this week) for PR comparison
      const exerciseIds = [
        ...new Set([...weekMaxWeight.keys(), ...weekMaxVolume.keys()]),
      ];
      let prs = 0;

      if (exerciseIds.length === 0) {
        return { workouts: weekWorkoutIds.length, volume, prs: 0 };
      }

      const { data: prevWorkouts, error: pError } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', userId)
        .lt('started_at', weekStart);

      if (pError) throw pError;

      const prevWorkoutIds = (prevWorkouts ?? []).map((w) => w.id);

      if (prevWorkoutIds.length === 0) {
        // No history — every exercise gets weight PR + volume PR
        prs = exerciseIds.length * 2;
      } else {
        const { data: prevSets, error: psError } = await supabase
          .from('workout_sets')
          .select('exercise_id, weight, reps')
          .in('workout_id', prevWorkoutIds)
          .in('exercise_id', exerciseIds);

        if (psError) throw psError;

        const prevMaxWeight = new Map<string, number>();
        const prevMaxVol = new Map<string, number>();

        for (const s of prevSets ?? []) {
          if (s.weight != null) {
            const cur = prevMaxWeight.get(s.exercise_id) ?? 0;
            if (s.weight > cur) prevMaxWeight.set(s.exercise_id, s.weight);
          }
          const sv = (s.weight ?? 0) * (s.reps ?? 0);
          if (sv > 0) {
            const cur = prevMaxVol.get(s.exercise_id) ?? 0;
            if (sv > cur) prevMaxVol.set(s.exercise_id, sv);
          }
        }

        for (const id of exerciseIds) {
          const wkW = weekMaxWeight.get(id) ?? 0;
          const prW = prevMaxWeight.get(id) ?? 0;
          if (wkW > prW) prs++;

          const wkV = weekMaxVolume.get(id) ?? 0;
          const prV = prevMaxVol.get(id) ?? 0;
          if (wkV > prV) prs++;
        }
      }

      return { workouts: weekWorkoutIds.length, volume, prs };
    },
    enabled: !!session,
    staleTime: 30_000,
  });
}
