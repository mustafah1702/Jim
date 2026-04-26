# Templates Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to create, edit, delete, and start workouts from reusable workout templates with per-set targets.

**Architecture:** Zustand store for template form state (mirrors workoutStore), React Query hooks for Supabase CRUD, full-screen modal for template creation/editing, and a `startFromTemplate` action on workoutStore to hydrate workouts from templates.

**Tech Stack:** React Native (Expo), TypeScript, Zustand, TanStack React Query, Supabase (PostgreSQL + RLS)

**Spec:** `docs/superpowers/specs/2026-04-25-templates-design.md`

---

## File Structure

**New files:**
- `supabase/migrations/0002_template_sets.sql` — DB migration: create template_sets, drop unused columns
- `src/types/workout.ts` — Add TemplateSet, TemplateExercise, Template types (modify existing)
- `src/stores/templateFormStore.ts` — Zustand store for template form state
- `src/hooks/useTemplates.ts` — React Query hook to fetch templates
- `src/hooks/useSaveTemplate.ts` — Mutation hook for create/update
- `src/hooks/useDeleteTemplate.ts` — Mutation hook for delete
- `src/components/template/TemplateSetRow.tsx` — Set row for template form (weight + reps inputs)
- `src/components/template/TemplateExerciseCard.tsx` — Exercise card for template form
- `src/components/template/TemplateCard.tsx` — Template card for template list
- `app/template-form.tsx` — Full-screen modal for creating/editing templates

**Modified files:**
- `app/_layout.tsx` — Register template-form route
- `app/exercise-picker.tsx` — Accept `mode` query param for template vs workout
- `src/stores/workoutStore.ts` — Add `startFromTemplate` action
- `app/(tabs)/templates.tsx` — Replace placeholder with real template list

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/0002_template_sets.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- template_sets: per-set targets within a template exercise
create table template_sets (
  id uuid primary key default gen_random_uuid(),
  template_exercise_id uuid not null references template_exercises(id) on delete cascade,
  set_number int not null,
  target_reps int,
  target_weight numeric
);

create index template_sets_template_exercise_id_idx on template_sets (template_exercise_id);

alter table template_sets enable row level security;

create policy "users read own template_sets" on template_sets
  for select using (
    exists (
      select 1 from template_exercises te
      join templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.user_id = auth.uid()
    )
  );
create policy "users write own template_sets" on template_sets
  for all using (
    exists (
      select 1 from template_exercises te
      join templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from template_exercises te
      join templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.user_id = auth.uid()
    )
  );

-- Drop unused columns from template_exercises (targets now live per-set)
alter table template_exercises drop column target_sets;
alter table template_exercises drop column target_reps;
alter table template_exercises drop column target_weight;
```

- [ ] **Step 2: Run the migration against Supabase**

Run the SQL in the Supabase SQL editor or via CLI:
```bash
supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0002_template_sets.sql
git commit -m "feat: add template_sets table and drop unused template_exercises columns"
```

---

### Task 2: TypeScript Types

**Files:**
- Modify: `src/types/workout.ts`

- [ ] **Step 1: Add template types to the end of `src/types/workout.ts`**

Append after the existing `Exercise` type:

```typescript
export type TemplateSet = {
  id: string;
  targetReps: number | null;
  targetWeight: number | null;
};

export type TemplateExercise = {
  id: string;
  exerciseId: string;
  name: string;
  primaryMuscle: string | null;
  equipment: string | null;
  sets: TemplateSet[];
};

export type Template = {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  exercises: TemplateExercise[];
};
```

- [ ] **Step 2: Verify the app still compiles**

```bash
npx expo start --clear
```

Check that the app launches without TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/workout.ts
git commit -m "feat: add TemplateSet, TemplateExercise, and Template types"
```

---

### Task 3: Template Form Store

**Files:**
- Create: `src/stores/templateFormStore.ts`

- [ ] **Step 1: Create `src/stores/templateFormStore.ts`**

```typescript
import { create } from 'zustand';
import type { Template, TemplateExercise, TemplateSet } from '@/types/workout';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function createEmptyTemplateSet(): TemplateSet {
  return { id: uuid(), targetReps: null, targetWeight: null };
}

type TemplateFormState = {
  template: { name: string; exercises: TemplateExercise[] } | null;
  editingId: string | null;

  startNewTemplate: () => void;
  loadTemplate: (template: Template) => void;
  setName: (name: string) => void;
  addExercise: (exercise: {
    id: string;
    name: string;
    primary_muscle: string | null;
    equipment: string | null;
  }) => void;
  removeExercise: (exerciseClientId: string) => void;
  addSet: (exerciseClientId: string) => void;
  removeSet: (exerciseClientId: string, setId: string) => void;
  updateSet: (
    exerciseClientId: string,
    setId: string,
    updates: Partial<Pick<TemplateSet, 'targetReps' | 'targetWeight'>>,
  ) => void;
  discardTemplate: () => void;
};

export const useTemplateFormStore = create<TemplateFormState>((set) => ({
  template: null,
  editingId: null,

  startNewTemplate: () =>
    set({ template: { name: '', exercises: [] }, editingId: null }),

  loadTemplate: (template) =>
    set({
      template: {
        name: template.name,
        exercises: template.exercises.map((e) => ({
          ...e,
          id: uuid(),
          sets: e.sets.map((s) => ({ ...s, id: uuid() })),
        })),
      },
      editingId: template.id,
    }),

  setName: (name) =>
    set((state) => {
      if (!state.template) return state;
      return { template: { ...state.template, name } };
    }),

  addExercise: (exercise) =>
    set((state) => {
      if (!state.template) return state;
      return {
        template: {
          ...state.template,
          exercises: [
            ...state.template.exercises,
            {
              id: uuid(),
              exerciseId: exercise.id,
              name: exercise.name,
              primaryMuscle: exercise.primary_muscle,
              equipment: exercise.equipment,
              sets: [createEmptyTemplateSet()],
            },
          ],
        },
      };
    }),

  removeExercise: (exerciseClientId) =>
    set((state) => {
      if (!state.template) return state;
      return {
        template: {
          ...state.template,
          exercises: state.template.exercises.filter((e) => e.id !== exerciseClientId),
        },
      };
    }),

  addSet: (exerciseClientId) =>
    set((state) => {
      if (!state.template) return state;
      return {
        template: {
          ...state.template,
          exercises: state.template.exercises.map((e) => {
            if (e.id !== exerciseClientId) return e;
            const lastSet = e.sets[e.sets.length - 1];
            const newSet: TemplateSet = lastSet
              ? { id: uuid(), targetReps: lastSet.targetReps, targetWeight: lastSet.targetWeight }
              : createEmptyTemplateSet();
            return { ...e, sets: [...e.sets, newSet] };
          }),
        },
      };
    }),

  removeSet: (exerciseClientId, setId) =>
    set((state) => {
      if (!state.template) return state;
      return {
        template: {
          ...state.template,
          exercises: state.template.exercises.map((e) => {
            if (e.id !== exerciseClientId) return e;
            return { ...e, sets: e.sets.filter((s) => s.id !== setId) };
          }),
        },
      };
    }),

  updateSet: (exerciseClientId, setId, updates) =>
    set((state) => {
      if (!state.template) return state;
      return {
        template: {
          ...state.template,
          exercises: state.template.exercises.map((e) => {
            if (e.id !== exerciseClientId) return e;
            return {
              ...e,
              sets: e.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)),
            };
          }),
        },
      };
    }),

  discardTemplate: () => set({ template: null, editingId: null }),
}));
```

- [ ] **Step 2: Verify the app still compiles**

```bash
npx expo start --clear
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/templateFormStore.ts
git commit -m "feat: add templateFormStore for template creation/editing state"
```

---

### Task 4: Add `startFromTemplate` to Workout Store

**Files:**
- Modify: `src/stores/workoutStore.ts`

- [ ] **Step 1: Add the `Template` import and `startFromTemplate` to the type**

At the top of `src/stores/workoutStore.ts`, update the import:

```typescript
import type { ActiveWorkout, Template, WorkoutSet } from '@/types/workout';
```

Add to the `WorkoutState` type, after `startWorkout`:

```typescript
  startFromTemplate: (template: Template) => void;
```

- [ ] **Step 2: Implement `startFromTemplate` in the store**

Add after the `startWorkout` implementation (after line 62):

```typescript
  startFromTemplate: (template) =>
    set({
      workout: {
        startedAt: new Date().toISOString(),
        exercises: template.exercises.map((te) => ({
          id: uuid(),
          exerciseId: te.exerciseId,
          name: te.name,
          primaryMuscle: te.primaryMuscle,
          equipment: te.equipment,
          sets:
            te.sets.length > 0
              ? te.sets.map((ts) => ({
                  id: uuid(),
                  weight: ts.targetWeight,
                  reps: ts.targetReps,
                  isWarmup: false,
                  completed: false,
                }))
              : [createEmptySet()],
        })),
      },
      restEndAt: null,
    }),
```

- [ ] **Step 3: Verify the app still compiles**

```bash
npx expo start --clear
```

- [ ] **Step 4: Commit**

```bash
git add src/stores/workoutStore.ts
git commit -m "feat: add startFromTemplate action to workout store"
```

---

### Task 5: Data Hooks (useTemplates, useSaveTemplate, useDeleteTemplate)

**Files:**
- Create: `src/hooks/useTemplates.ts`
- Create: `src/hooks/useSaveTemplate.ts`
- Create: `src/hooks/useDeleteTemplate.ts`

- [ ] **Step 1: Create `src/hooks/useTemplates.ts`**

```typescript
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
```

- [ ] **Step 2: Create `src/hooks/useSaveTemplate.ts`**

```typescript
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
```

- [ ] **Step 3: Create `src/hooks/useDeleteTemplate.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}
```

- [ ] **Step 4: Verify the app still compiles**

```bash
npx expo start --clear
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTemplates.ts src/hooks/useSaveTemplate.ts src/hooks/useDeleteTemplate.ts
git commit -m "feat: add template CRUD hooks (useTemplates, useSaveTemplate, useDeleteTemplate)"
```

---

### Task 6: Template Set Row Component

**Files:**
- Create: `src/components/template/TemplateSetRow.tsx`

- [ ] **Step 1: Create `src/components/template/TemplateSetRow.tsx`**

This is a simplified version of the workout `SetRow` — no warmup toggle, no completion checkmark, just weight/reps inputs with a remove button.

```typescript
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { TemplateSet } from '@/types/workout';

type TemplateSetRowProps = {
  set: TemplateSet;
  index: number;
  onUpdate: (updates: Partial<Pick<TemplateSet, 'targetReps' | 'targetWeight'>>) => void;
  onRemove: () => void;
};

export function TemplateSetRow({ set, index, onUpdate, onRemove }: TemplateSetRowProps) {
  const theme = useTheme();
  const [weightText, setWeightText] = useState(
    set.targetWeight != null ? String(set.targetWeight) : '',
  );
  const [repsText, setRepsText] = useState(
    set.targetReps != null ? String(set.targetReps) : '',
  );

  const handleWeightBlur = () => {
    const val = parseFloat(weightText);
    onUpdate({ targetWeight: isNaN(val) ? null : val });
  };

  const handleRepsBlur = () => {
    const val = parseInt(repsText, 10);
    onUpdate({ targetReps: isNaN(val) ? null : val });
  };

  return (
    <View style={[styles.row, { paddingHorizontal: theme.spacing.sm }]}>
      <View
        style={[
          styles.setLabel,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderRadius: theme.radius.sm,
          },
        ]}
      >
        <Text variant="caption" tone="muted" style={{ fontWeight: '600', textAlign: 'center' }}>
          {index + 1}
        </Text>
      </View>

      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.sm,
          },
        ]}
        value={weightText}
        onChangeText={setWeightText}
        onBlur={handleWeightBlur}
        placeholder="lbs"
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.accent}
        keyboardType="decimal-pad"
        returnKeyType="next"
      />

      <Text variant="caption" tone="muted" style={{ marginHorizontal: 2 }}>
        ×
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.sm,
          },
        ]}
        value={repsText}
        onChangeText={setRepsText}
        onBlur={handleRepsBlur}
        placeholder="reps"
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.accent}
        keyboardType="number-pad"
        returnKeyType="done"
      />

      <Pressable onPress={onRemove} hitSlop={8}>
        <Ionicons name="close-circle" size={22} color={theme.colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setLabel: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
});
```

- [ ] **Step 2: Commit**

```bash
mkdir -p src/components/template
git add src/components/template/TemplateSetRow.tsx
git commit -m "feat: add TemplateSetRow component"
```

---

### Task 7: Template Exercise Card Component

**Files:**
- Create: `src/components/template/TemplateExerciseCard.tsx`

- [ ] **Step 1: Create `src/components/template/TemplateExerciseCard.tsx`**

```typescript
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { TemplateSetRow } from '@/components/template/TemplateSetRow';
import { useTemplateFormStore } from '@/stores/templateFormStore';
import { useTheme } from '@/theme';
import type { TemplateExercise } from '@/types/workout';

type TemplateExerciseCardProps = {
  exercise: TemplateExercise;
};

export function TemplateExerciseCard({ exercise }: TemplateExerciseCardProps) {
  const theme = useTheme();
  const addSet = useTemplateFormStore((s) => s.addSet);
  const removeSet = useTemplateFormStore((s) => s.removeSet);
  const updateSet = useTemplateFormStore((s) => s.updateSet);
  const removeExercise = useTemplateFormStore((s) => s.removeExercise);

  return (
    <Card style={{ gap: theme.spacing.md, padding: theme.spacing.md }}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Text variant="headline" numberOfLines={1}>
            {exercise.name}
          </Text>
          {(exercise.primaryMuscle || exercise.equipment) && (
            <Text variant="caption" tone="secondary">
              {[exercise.primaryMuscle, exercise.equipment].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>
        <Pressable onPress={() => removeExercise(exercise.id)} hitSlop={8}>
          <Text variant="caption" style={{ color: theme.colors.danger, fontWeight: '600' }}>
            Remove
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.columnHeaders,
          { paddingHorizontal: theme.spacing.sm },
        ]}
      >
        <Text variant="caption" tone="muted" style={styles.setLabelHeader}>
          SET
        </Text>
        <Text variant="caption" tone="muted" style={styles.colHeader}>
          LBS
        </Text>
        <Text variant="caption" tone="muted" style={{ marginHorizontal: 2 }}>
          {'  '}
        </Text>
        <Text variant="caption" tone="muted" style={styles.colHeader}>
          REPS
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {exercise.sets.map((set, i) => (
        <TemplateSetRow
          key={set.id}
          set={set}
          index={i}
          onUpdate={(updates) => updateSet(exercise.id, set.id, updates)}
          onRemove={() => removeSet(exercise.id, set.id)}
        />
      ))}

      <Pressable
        onPress={() => addSet(exercise.id)}
        style={[
          styles.addSetBtn,
          {
            paddingVertical: theme.spacing.md,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surfaceMuted,
          },
        ]}
      >
        <Ionicons name="add" size={16} color={theme.colors.accent} />
        <Text variant="caption" tone="accent" style={{ fontWeight: '600' }}>
          Add Set
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setLabelHeader: {
    width: 28,
    textAlign: 'center',
    fontWeight: '600',
  },
  colHeader: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/template/TemplateExerciseCard.tsx
git commit -m "feat: add TemplateExerciseCard component"
```

---

### Task 8: Template Form Screen

**Files:**
- Create: `app/template-form.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create `app/template-form.tsx`**

```typescript
import { useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { TemplateExerciseCard } from '@/components/template/TemplateExerciseCard';
import { useSaveTemplate } from '@/hooks/useSaveTemplate';
import { useTemplateFormStore } from '@/stores/templateFormStore';
import { useTheme } from '@/theme';

export default function TemplateFormScreen() {
  const theme = useTheme();
  const router = useRouter();
  const template = useTemplateFormStore((s) => s.template);
  const editingId = useTemplateFormStore((s) => s.editingId);
  const setName = useTemplateFormStore((s) => s.setName);
  const startNewTemplate = useTemplateFormStore((s) => s.startNewTemplate);
  const discardTemplate = useTemplateFormStore((s) => s.discardTemplate);
  const saveMutation = useSaveTemplate();

  useEffect(() => {
    if (!template) startNewTemplate();
  }, []);

  const canSave =
    template != null &&
    template.name.trim().length > 0 &&
    template.exercises.length > 0;

  const handleCancel = () => {
    if (template && (template.name.trim() || template.exercises.length > 0)) {
      Alert.alert('Discard Template?', 'Your changes will be lost.', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            discardTemplate();
            router.back();
          },
        },
      ]);
    } else {
      discardTemplate();
      router.back();
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    saveMutation.mutate(undefined, {
      onSuccess: () => router.back(),
      onError: (error) => {
        Alert.alert('Error', `Failed to save template: ${error.message}`);
      },
    });
  };

  if (!template) return null;

  return (
    <Screen edges={['top']} padded={false}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        }}
      >
        <Pressable onPress={handleCancel} hitSlop={8}>
          <Text variant="bodyStrong" style={{ color: theme.colors.danger }}>
            Cancel
          </Text>
        </Pressable>
        <Text variant="headline">
          {editingId ? 'Edit Template' : 'New Template'}
        </Text>
        <Pressable onPress={handleSave} disabled={!canSave || saveMutation.isPending} hitSlop={8}>
          <Text
            variant="bodyStrong"
            style={{
              color: theme.colors.accent,
              opacity: canSave && !saveMutation.isPending ? 1 : 0.4,
            }}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.lg,
            gap: theme.spacing.md,
            paddingBottom: 120,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextField
            placeholder="Template Name (e.g., Upper Body)"
            value={template.name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
          />

          {template.exercises.map((exercise) => (
            <TemplateExerciseCard key={exercise.id} exercise={exercise} />
          ))}

          <Pressable
            onPress={() => router.push('/exercise-picker?mode=template')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: theme.spacing.lg,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surfaceElevated,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="add-circle-outline" size={20} color={theme.colors.accent} />
            <Text variant="bodyStrong" tone="accent">
              Add Exercise
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
```

- [ ] **Step 2: Register route in `app/_layout.tsx`**

In the `AuthGate` component's `<Stack>`, add after the `exercise-picker` `<Stack.Screen>`:

```tsx
      <Stack.Screen
        name="template-form"
        options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
      />
```

- [ ] **Step 3: Verify the app compiles and the modal opens**

```bash
npx expo start --clear
```

Navigate to the template form to confirm it renders.

- [ ] **Step 4: Commit**

```bash
git add app/template-form.tsx app/_layout.tsx
git commit -m "feat: add template form modal screen and register route"
```

---

### Task 9: Exercise Picker Mode Support

**Files:**
- Modify: `app/exercise-picker.tsx`

- [ ] **Step 1: Update the exercise picker to accept a `mode` query param**

At the top of the file, add the import for `useLocalSearchParams` and the template form store:

Replace:
```typescript
import { useRouter } from 'expo-router';
```

With:
```typescript
import { useLocalSearchParams, useRouter } from 'expo-router';
```

Add import:
```typescript
import { useTemplateFormStore } from '@/stores/templateFormStore';
```

- [ ] **Step 2: Update the component to use the mode param**

Inside `ExercisePickerScreen`, after the existing store hooks, add:

```typescript
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const addTemplateExercise = useTemplateFormStore((s) => s.addExercise);
```

Replace the `handleSelect` function:

```typescript
  const handleSelect = (exercise: Exercise) => {
    if (mode === 'template') {
      addTemplateExercise({
        id: exercise.id,
        name: exercise.name,
        primary_muscle: exercise.primary_muscle,
        equipment: exercise.equipment,
      });
    } else {
      addExercise({
        id: exercise.id,
        name: exercise.name,
        primary_muscle: exercise.primary_muscle,
        equipment: exercise.equipment,
      });
    }
    router.back();
  };
```

- [ ] **Step 3: Verify both modes work**

1. Start a workout → Add Exercise → verify it adds to workout
2. Create a template → Add Exercise → verify it adds to template form

- [ ] **Step 4: Commit**

```bash
git add app/exercise-picker.tsx
git commit -m "feat: support template mode in exercise picker"
```

---

### Task 10: Template Card Component

**Files:**
- Create: `src/components/template/TemplateCard.tsx`

- [ ] **Step 1: Create `src/components/template/TemplateCard.tsx`**

```typescript
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { Template } from '@/types/workout';

type TemplateCardProps = {
  template: Template;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function TemplateCard({ template, onStart, onEdit, onDelete }: TemplateCardProps) {
  const theme = useTheme();

  const muscles = [
    ...new Set(
      template.exercises
        .map((e) => e.primaryMuscle)
        .filter(Boolean),
    ),
  ];
  const summary = `${template.exercises.length} exercise${template.exercises.length !== 1 ? 's' : ''}${
    muscles.length > 0 ? ' · ' + muscles.join(', ') : ''
  }`;

  const handleOverflow = () => {
    Alert.alert(template.name, undefined, [
      { text: 'Edit', onPress: onEdit },
      { text: 'Delete', style: 'destructive', onPress: () => confirmDelete() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    );
  };

  // Build preview chips for first 2 exercises
  const previewExercises = template.exercises.slice(0, 2);
  const remaining = template.exercises.length - previewExercises.length;

  function formatExerciseChip(e: Template['exercises'][number]): string {
    const setCount = e.sets.length;
    if (setCount === 0) return e.name;
    const firstSet = e.sets[0];
    const reps = firstSet.targetReps;
    const weight = firstSet.targetWeight;
    let label = `${e.name} · ${setCount}`;
    if (reps != null) label += `×${reps}`;
    if (weight != null) label += ` @ ${weight}`;
    return label;
  }

  return (
    <Card style={{ gap: theme.spacing.md }}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Text variant="headline">{template.name}</Text>
          <Text variant="caption" tone="secondary">
            {summary}
          </Text>
        </View>
        <IconButton
          icon="ellipsis-horizontal"
          size={34}
          variant="plain"
          onPress={handleOverflow}
        />
      </View>

      <View style={styles.chips}>
        {previewExercises.map((e) => (
          <View
            key={e.id}
            style={[
              styles.chip,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {formatExerciseChip(e)}
            </Text>
          </View>
        ))}
        {remaining > 0 && (
          <View
            style={[
              styles.chip,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <Text variant="caption" tone="muted">
              +{remaining} more
            </Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={onStart}
        style={({ pressed }) => [
          styles.startBtn,
          {
            backgroundColor: theme.colors.accentSoft,
            borderRadius: theme.radius.md,
            paddingVertical: theme.spacing.md,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons name="play" size={16} color={theme.colors.accent} />
        <Text variant="bodyStrong" tone="accent">
          Start Workout
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/template/TemplateCard.tsx
git commit -m "feat: add TemplateCard component for template list"
```

---

### Task 11: Templates Tab Screen

**Files:**
- Modify: `app/(tabs)/templates.tsx`

- [ ] **Step 1: Replace the contents of `app/(tabs)/templates.tsx`**

```typescript
import { Alert, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TemplateCard } from '@/components/template/TemplateCard';
import { useDeleteTemplate } from '@/hooks/useDeleteTemplate';
import { useTemplates } from '@/hooks/useTemplates';
import { useTemplateFormStore } from '@/stores/templateFormStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';
import type { Template } from '@/types/workout';

export default function TemplatesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: templates, isLoading } = useTemplates();
  const deleteMutation = useDeleteTemplate();
  const startFromTemplate = useWorkoutStore((s) => s.startFromTemplate);
  const loadTemplate = useTemplateFormStore((s) => s.loadTemplate);

  const handleCreate = () => {
    useTemplateFormStore.getState().startNewTemplate();
    router.push('/template-form');
  };

  const handleStart = (template: Template) => {
    startFromTemplate(template);
    router.push('/workout');
  };

  const handleEdit = (template: Template) => {
    loadTemplate(template);
    router.push('/template-form');
  };

  const handleDelete = (templateId: string) => {
    deleteMutation.mutate(templateId, {
      onError: (error) => {
        Alert.alert('Error', `Failed to delete template: ${error.message}`);
      },
    });
  };

  const hasTemplates = templates && templates.length > 0;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
          gap: theme.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text variant="display">Templates</Text>
            <Text variant="body" tone="secondary">
              Save and reuse your favorite workouts.
            </Text>
          </View>
          {hasTemplates && (
            <Button
              label="+ New"
              size="sm"
              fullWidth={false}
              onPress={handleCreate}
            />
          )}
        </View>

        {!hasTemplates ? (
          <EmptyState
            icon="clipboard-outline"
            title={isLoading ? 'Loading templates...' : 'No templates yet'}
            description={
              isLoading
                ? 'Pulling your templates.'
                : 'Create a template to save your go-to exercises and start workouts faster.'
            }
            action={
              !isLoading ? (
                <Button
                  label="Create Template"
                  icon="add"
                  fullWidth={false}
                  onPress={handleCreate}
                />
              ) : undefined
            }
          />
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onStart={() => handleStart(template)}
                onEdit={() => handleEdit(template)}
                onDelete={() => handleDelete(template.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
```

- [ ] **Step 2: Test the full flow**

1. Open the app → go to Templates tab → verify empty state shows
2. Tap "Create Template" → verify template form modal opens
3. Enter a name, add exercises, add sets with targets
4. Tap "Save" → verify you're back on Templates tab with the new template in the list
5. Tap "Start Workout" on the template → verify workout opens pre-filled
6. Tap ⋯ → Edit → verify form loads with existing data, modify, save
7. Tap ⋯ → Delete → confirm → verify template removed

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/templates.tsx
git commit -m "feat: replace templates placeholder with full template list and CRUD"
```

---

### Task 12: Final Verification

- [ ] **Step 1: End-to-end test — create template**

1. Open Templates tab → "Create Template"
2. Name: "Upper Body"
3. Add Bench Press → set 3 sets: 135×10, 155×8, 175×6
4. Add Dumbbell Lateral Raise → leave 1 empty set
5. Save → verify card appears with correct preview

- [ ] **Step 2: End-to-end test — start from template**

1. Tap "Start Workout" on "Upper Body"
2. Verify Bench Press has 3 sets pre-filled: 135/10, 155/8, 175/6 — all incomplete
3. Verify Lateral Raise has 1 empty set
4. Complete some sets, finish workout normally

- [ ] **Step 3: End-to-end test — edit template**

1. Tap ⋯ → Edit on "Upper Body"
2. Change name to "Upper Body A"
3. Remove an exercise, add a new one
4. Save → verify changes reflected

- [ ] **Step 4: End-to-end test — delete template**

1. Tap ⋯ → Delete → Cancel → verify still exists
2. Tap ⋯ → Delete → Delete → verify removed from list

- [ ] **Step 5: Verify exercise picker still works for workouts**

1. Start an empty workout (not from template)
2. Add Exercise → pick one → verify it adds to the workout, not a template

- [ ] **Step 6: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: address issues found during template feature verification"
```
