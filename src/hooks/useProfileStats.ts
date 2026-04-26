import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export type ProfileStats = {
  totalWorkouts: number;
  daysActive: number;
};

export function useProfileStats() {
  const session = useAuthStore((s) => s.session);

  return useQuery<ProfileStats>({
    queryKey: ['profile', 'stats'],
    queryFn: async () => {
      const userId = session!.user.id;

      const { data, error } = await supabase
        .from('workouts')
        .select('started_at')
        .eq('user_id', userId);

      if (error) throw error;

      const workouts = data ?? [];
      const uniqueDays = new Set(
        workouts.map((w) => new Date(w.started_at).toDateString()),
      );

      return {
        totalWorkouts: workouts.length,
        daysActive: uniqueDays.size,
      };
    },
    enabled: !!session,
    staleTime: 60_000,
  });
}
