import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { usePreferencesStore, type Preferences } from '@/stores/preferencesStore';

export function usePreferences() {
  const session = useAuthStore((s) => s.session);
  const load = usePreferencesStore((s) => s.load);

  const query = useQuery({
    queryKey: ['preferences'],
    queryFn: async (): Promise<Preferences> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('weight_unit, rest_timer_seconds, theme')
        .eq('id', session!.user.id)
        .single();

      if (error) throw error;

      return {
        weightUnit: data.weight_unit as Preferences['weightUnit'],
        restTimerSeconds: data.rest_timer_seconds as number,
        theme: data.theme as Preferences['theme'],
      };
    },
    enabled: !!session,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) {
      load(query.data);
    }
  }, [query.data, load]);

  return query;
}
