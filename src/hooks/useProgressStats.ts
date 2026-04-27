import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export type WeekVolume = {
  weekLabel: string;
  volume: number;
};

export type PRPoint = {
  date: string;
  cumulativePRs: number;
};

export type MuscleVolume = {
  muscle: string;
  volume: number;
};

export type WeekFrequency = {
  weekLabel: string;
  count: number;
};

export type ProgressStats = {
  totalWorkouts: number;
  totalVolume: number;
  currentStreak: number;
  weeklyVolume: WeekVolume[];
  prTrend: PRPoint[];
  muscleBreakdown: MuscleVolume[];
  weeklyFrequency: WeekFrequency[];
};

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(monday: Date): string {
  return `${monday.getMonth() + 1}/${monday.getDate()}`;
}

function formatDateLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function useProgressStats() {
  const session = useAuthStore((s) => s.session);

  return useQuery<ProgressStats>({
    queryKey: ['workouts', 'progress-stats'],
    queryFn: async () => {
      const userId = session!.user.id;

      // Fetch all workouts with sets and exercise info
      const { data: workouts, error: wErr } = await supabase
        .from('workouts')
        .select(
          `
          id, started_at, ended_at,
          workout_sets (
            exercise_id, weight, reps, is_warmup,
            exercises (name, primary_muscle)
          )
        `
        )
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: true });

      if (wErr) throw wErr;

      if (!workouts || workouts.length === 0) {
        return {
          totalWorkouts: 0,
          totalVolume: 0,
          currentStreak: 0,
          weeklyVolume: [],
          prTrend: [],
          muscleBreakdown: [],
          weeklyFrequency: [],
        };
      }

      // --- Total workouts & volume ---
      let totalVolume = 0;
      for (const w of workouts) {
        for (const s of w.workout_sets ?? []) {
          totalVolume += (s.weight ?? 0) * (s.reps ?? 0);
        }
      }

      // --- Current streak (consecutive weeks with workouts, counting back from this week) ---
      const now = new Date();
      const thisMonday = getMonday(now);
      const workoutWeeks = new Set<string>();
      for (const w of workouts) {
        const monday = getMonday(new Date(w.started_at));
        workoutWeeks.add(monday.toISOString());
      }

      let currentStreak = 0;
      const checkMonday = new Date(thisMonday);
      while (true) {
        if (workoutWeeks.has(checkMonday.toISOString())) {
          currentStreak++;
          checkMonday.setDate(checkMonday.getDate() - 7);
        } else {
          break;
        }
      }

      // --- Weekly volume (last 8 weeks) ---
      const weeklyVolumeMap = new Map<string, number>();
      const weekLabels: { key: string; label: string }[] = [];
      for (let i = 7; i >= 0; i--) {
        const monday = new Date(thisMonday);
        monday.setDate(monday.getDate() - i * 7);
        const key = monday.toISOString();
        weeklyVolumeMap.set(key, 0);
        weekLabels.push({ key, label: formatWeekLabel(monday) });
      }

      for (const w of workouts) {
        const monday = getMonday(new Date(w.started_at));
        const key = monday.toISOString();
        if (weeklyVolumeMap.has(key)) {
          let vol = weeklyVolumeMap.get(key)!;
          for (const s of w.workout_sets ?? []) {
            vol += (s.weight ?? 0) * (s.reps ?? 0);
          }
          weeklyVolumeMap.set(key, vol);
        }
      }

      const weeklyVolume: WeekVolume[] = weekLabels.map(({ key, label }) => ({
        weekLabel: label,
        volume: weeklyVolumeMap.get(key) ?? 0,
      }));

      // --- PR trend (cumulative PRs over time) ---
      const { data: personalRecords, error: prErr } = await supabase
        .from('personal_records')
        .select('achieved_at')
        .eq('user_id', userId)
        .order('achieved_at', { ascending: true });

      if (prErr) throw prErr;

      const prPoints: PRPoint[] = [];
      let cumulativePRs = 0;
      let currentDateKey: string | null = null;
      let currentPoint: PRPoint | null = null;

      for (const record of personalRecords ?? []) {
        const date = new Date(record.achieved_at);
        const dateKey = getDateKey(date);
        cumulativePRs++;

        if (dateKey === currentDateKey && currentPoint) {
          currentPoint.cumulativePRs = cumulativePRs;
        } else {
          currentDateKey = dateKey;
          currentPoint = {
            date: formatDateLabel(date),
            cumulativePRs,
          };
          prPoints.push(currentPoint);
        }
      }

      // --- Muscle group breakdown (all-time volume by primary_muscle) ---
      const muscleMap = new Map<string, number>();
      for (const w of workouts) {
        for (const s of w.workout_sets ?? []) {
          const muscle = (s as any).exercises?.primary_muscle ?? 'Other';
          const vol = (s.weight ?? 0) * (s.reps ?? 0);
          muscleMap.set(muscle, (muscleMap.get(muscle) ?? 0) + vol);
        }
      }

      const muscleBreakdown: MuscleVolume[] = [...muscleMap.entries()]
        .map(([muscle, volume]) => ({ muscle, volume }))
        .sort((a, b) => b.volume - a.volume);

      // --- Weekly frequency (last 8 weeks) ---
      const weeklyCountMap = new Map<string, number>();
      for (const { key } of weekLabels) {
        weeklyCountMap.set(key, 0);
      }
      for (const w of workouts) {
        const monday = getMonday(new Date(w.started_at));
        const key = monday.toISOString();
        if (weeklyCountMap.has(key)) {
          weeklyCountMap.set(key, weeklyCountMap.get(key)! + 1);
        }
      }

      const weeklyFrequency: WeekFrequency[] = weekLabels.map(({ key, label }) => ({
        weekLabel: label,
        count: weeklyCountMap.get(key) ?? 0,
      }));

      return {
        totalWorkouts: workouts.length,
        totalVolume,
        currentStreak,
        weeklyVolume,
        prTrend: prPoints,
        muscleBreakdown,
        weeklyFrequency,
      };
    },
    enabled: !!session,
    staleTime: 60_000,
  });
}
