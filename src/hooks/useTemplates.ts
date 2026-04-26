import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Template } from '@/types/workout';

export function useTemplates() {
  return useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select(`
          id, name, notes, created_at, updated_at,
          template_exercises (
            id, exercise_id, position,
            exercises ( name, primary_muscle, equipment ),
            template_sets ( id, set_number, target_reps, target_weight )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        notes: t.notes,
        created_at: t.created_at,
        updated_at: t.updated_at,
        exercises: (t.template_exercises ?? [])
          .sort((a: any, b: any) => a.position - b.position)
          .map((te: any) => ({
            id: te.id,
            exerciseId: te.exercise_id,
            name: te.exercises.name,
            primaryMuscle: te.exercises.primary_muscle,
            equipment: te.exercises.equipment,
            sets: (te.template_sets ?? [])
              .sort((a: any, b: any) => a.set_number - b.set_number)
              .map((ts: any) => ({
                id: ts.id,
                targetReps: ts.target_reps,
                targetWeight: ts.target_weight,
              })),
          })),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
