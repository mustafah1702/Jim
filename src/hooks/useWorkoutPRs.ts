import { useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

type PRBaseline = { bestWeight: number; bestVolume: number };
type PRResult = { isWeightPR: boolean; isVolumePR: boolean };

export function useWorkoutPRs() {
  const baselines = useRef<Map<string, PRBaseline>>(new Map());

  const fetchBaselines = useCallback(async (exerciseIds: string[]) => {
    const uncached = exerciseIds.filter((id) => !baselines.current.has(id));
    if (uncached.length === 0) return;

    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('personal_records')
      .select('exercise_id, record_type, record_value')
      .eq('user_id', userId)
      .in('exercise_id', uncached);

    if (error || !data) return;

    for (const id of uncached) {
      baselines.current.set(id, { bestWeight: 0, bestVolume: 0 });
    }

    for (const row of data) {
      const baseline = baselines.current.get(row.exercise_id);
      if (!baseline) continue;
      const val = Number(row.record_value);
      if (row.record_type === 'weight' && val > baseline.bestWeight) {
        baseline.bestWeight = val;
      } else if (row.record_type === 'volume' && val > baseline.bestVolume) {
        baseline.bestVolume = val;
      }
    }
  }, []);

  const checkPR = useCallback(
    (exerciseId: string, weight: number | null, reps: number | null): PRResult => {
      const no = { isWeightPR: false, isVolumePR: false };
      if (weight == null || reps == null || weight <= 0 || reps <= 0) return no;

      const baseline = baselines.current.get(exerciseId);
      if (!baseline) return no;

      return {
        isWeightPR: weight > baseline.bestWeight,
        isVolumePR: weight * reps > baseline.bestVolume,
      };
    },
    [],
  );

  const resetBaselines = useCallback(() => {
    baselines.current.clear();
  }, []);

  return { fetchBaselines, checkPR, resetBaselines };
}
