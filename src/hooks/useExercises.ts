import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Exercise } from '@/types/workout';

export function useExercises() {
  return useQuery<Exercise[]>({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Exercise[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
