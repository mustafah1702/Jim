import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTemplateFormStore } from '@/stores/templateFormStore';

export function useSaveTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { template, editingId } = useTemplateFormStore.getState();
      const session = useAuthStore.getState().session;
      if (!template || !session) throw new Error('No template form or session');

      if (editingId) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('templates')
          .update({ name: template.name, updated_at: new Date().toISOString() })
          .eq('id', editingId);
        if (updateError) throw updateError;

        // Delete old exercises (cascade deletes sets)
        const { error: deleteError } = await supabase
          .from('template_exercises')
          .delete()
          .eq('template_id', editingId);
        if (deleteError) throw deleteError;

        // Re-insert exercises and sets
        await insertExercisesAndSets(editingId, template.exercises);
      } else {
        // Create new template
        const { data: row, error: insertError } = await supabase
          .from('templates')
          .insert({ user_id: session.user.id, name: template.name })
          .select('id')
          .single();
        if (insertError) throw insertError;

        await insertExercisesAndSets(row.id, template.exercises);
      }
    },
    onSuccess: () => {
      useTemplateFormStore.getState().discardTemplate();
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

async function insertExercisesAndSets(
  templateId: string,
  exercises: { exerciseId: string; sets: { targetReps: number | null; targetWeight: number | null }[] }[],
) {
  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];
    const { data: teRow, error: teError } = await supabase
      .from('template_exercises')
      .insert({
        template_id: templateId,
        exercise_id: exercise.exerciseId,
        position: i,
      })
      .select('id')
      .single();
    if (teError) throw teError;

    if (exercise.sets.length > 0) {
      const setRows = exercise.sets.map((s, j) => ({
        template_exercise_id: teRow.id,
        set_number: j + 1,
        target_reps: s.targetReps,
        target_weight: s.targetWeight,
      }));
      const { error: setsError } = await supabase
        .from('template_sets')
        .insert(setRows);
      if (setsError) throw setsError;
    }
  }
}
