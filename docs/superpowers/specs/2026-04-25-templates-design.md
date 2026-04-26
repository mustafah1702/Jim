# Templates Feature — Design Spec

## Context

The Jim workout app currently supports starting empty workouts and building them exercise-by-exercise. Users who repeat the same workout routines have no way to save and reuse them. The Templates feature lets users create reusable workout blueprints with exercises and per-set targets, then start a pre-filled workout from any template with one tap.

The database schema for `templates` and `template_exercises` already exists. We need to add a `template_sets` table, build the UI, state management, and data hooks.

## Decisions Made

- **Empty state initially** — no starter templates, just a "Create Template" CTA
- **Full-screen modal** for creating/editing templates (consistent with workout screen)
- **Per-set targets** — each set row has its own optional reps and weight (supports pyramids, drop sets, etc.)
- **Pre-fill all fields** when starting a workout from a template — user just taps checkmarks
- **1 empty set** default when an exercise has no sets defined in the template
- **Edit in place** + delete via overflow menu
- **Zustand store** for template form state (mirrors workoutStore pattern)
- **Exercise picker reuse** with `mode` query param to route additions to the correct store

## Data Model

### New DB Table: `template_sets`

```sql
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
```

The existing `target_sets`, `target_reps`, `target_weight` columns on `template_exercises` become unused. They can be dropped in a future migration.

### TypeScript Types

Add to `src/types/workout.ts`:

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

## State Management

### `src/stores/templateFormStore.ts` (new)

Zustand store for managing in-progress template creation/editing. Mirrors `workoutStore` patterns.

**State:**
- `template: { name: string; exercises: TemplateExercise[] } | null`
- `editingId: string | null` — null = creating, string = editing existing

**Actions:**
- `startNewTemplate()` — initializes empty template form
- `loadTemplate(template: Template)` — loads existing template for editing, sets `editingId`
- `setName(name: string)`
- `addExercise(exercise: { id, name, primary_muscle, equipment })` — adds exercise with 1 empty set
- `removeExercise(exerciseClientId: string)`
- `addSet(exerciseClientId: string)` — adds empty set row, inherits previous set's values
- `removeSet(exerciseClientId: string, setId: string)`
- `updateSet(exerciseClientId: string, setId: string, updates: Partial<TemplateSet>)`
- `discardTemplate()` — clears form state

### `workoutStore` addition

Add `startFromTemplate(template: Template)` action:
- Creates a new `ActiveWorkout` with `startedAt` timestamp
- For each template exercise, creates a `WorkoutExercise` with:
  - Sets mapped from `template.exercises[].sets` → `WorkoutSet` with `weight = targetWeight`, `reps = targetReps`, `completed = false`
  - If exercise has 0 sets, creates 1 empty set

## Data Hooks

### `src/hooks/useTemplates.ts` (new)

React Query hook. Fetches user's templates with exercises and sets joined.

Query key: `['templates']`

Supabase query: select from `templates`, join `template_exercises` (ordered by position), join `template_sets` (ordered by set_number), join `exercises` (for name/muscle/equipment).

### `src/hooks/useSaveTemplate.ts` (new)

Mutation hook for create and update:
- **Create**: Insert `templates` row → bulk insert `template_exercises` with positions → bulk insert `template_sets` for each exercise
- **Update**: Update `templates` row (name, updated_at) → delete existing `template_exercises` for that template (cascade deletes sets) → re-insert exercises and sets
- Reads form state from `templateFormStore`
- Invalidates `['templates']` on success

### `src/hooks/useDeleteTemplate.ts` (new)

Mutation hook. Deletes from `templates` (cascade handles exercises and sets). Invalidates `['templates']` on success.

## Screens & Navigation

### `app/template-form.tsx` (new)

Full-screen modal registered in `app/_layout.tsx` with `presentation: 'fullScreenModal'`.

**Layout:**
- Header: Cancel (left, red) | "New Template" or "Edit Template" (center) | Save (right, green)
- Name text input
- Exercise cards, each containing:
  - Exercise name + muscle/equipment subtitle + Remove button
  - Column headers: SET | LBS | REPS
  - Set rows with weight input, reps input, × remove button
  - "Add Set" button
- "+ Add Exercise" button at bottom (navigates to `/exercise-picker?mode=template`)

**Behavior:**
- Save is disabled until name is non-empty and at least 1 exercise is added
- Cancel shows confirmation alert if form has changes
- On save success: dismisses modal

### `app/(tabs)/templates.tsx` (updated)

Replace placeholder content:

**Empty state:** Icon, "No templates yet" title, description, "Create Template" button → navigates to `/template-form`

**With templates:** 
- Header: "Templates" title + "+ New" button
- Scrollable list of template cards, each showing:
  - Template name
  - Exercise count + unique muscle groups
  - Preview chips for first 2 exercises (e.g., "Bench Press · 3×10 @ 135")
  - "+N more" chip if more exercises
  - "Start Workout" button
  - Overflow menu (⋯) with Edit and Delete options

**Start Workout flow:** Calls `workoutStore.startFromTemplate(template)` then `router.push('/workout')`

**Edit flow:** Calls `templateFormStore.loadTemplate(template)` then `router.push('/template-form')`

**Delete flow:** Confirmation alert → calls `useDeleteTemplate` mutation

### `app/exercise-picker.tsx` (modified)

Accept `mode` query param via `useLocalSearchParams`. When `mode === 'template'`, the `handleSelect` function calls `templateFormStore.addExercise()` instead of `workoutStore.addExercise()`.

### `app/_layout.tsx` (modified)

Register the new template-form route:

```tsx
<Stack.Screen
  name="template-form"
  options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
/>
```

## Files to Create/Modify

**New files:**
- `supabase/migrations/0002_template_sets.sql` — new table + RLS
- `src/types/workout.ts` — add TemplateSet, TemplateExercise, Template types
- `src/stores/templateFormStore.ts` — template form Zustand store
- `src/hooks/useTemplates.ts` — query hook
- `src/hooks/useSaveTemplate.ts` — create/update mutation
- `src/hooks/useDeleteTemplate.ts` — delete mutation
- `app/template-form.tsx` — template creation/editing modal
- `src/components/template/TemplateCard.tsx` — template list card component
- `src/components/template/TemplateExerciseCard.tsx` — exercise card for template form
- `src/components/template/TemplateSetRow.tsx` — set row for template form

**Modified files:**
- `app/(tabs)/templates.tsx` — replace placeholder with real template list
- `app/exercise-picker.tsx` — add mode param support
- `app/_layout.tsx` — register template-form route
- `src/stores/workoutStore.ts` — add `startFromTemplate` action

## Verification

1. **Create template**: Open Templates tab → tap Create Template → enter name → add exercises via picker → add sets with targets → Save → verify template appears in list
2. **Start from template**: Tap "Start Workout" on a template card → verify workout opens with all exercises and sets pre-filled with correct weights/reps → complete sets and finish workout normally
3. **Edit template**: Tap ⋯ → Edit on a template → verify form loads with existing data → modify and save → verify changes persist
4. **Delete template**: Tap ⋯ → Delete → confirm → verify template removed from list
5. **Empty sets**: Create template with exercise that has no set targets → start workout → verify 1 empty set created
6. **Exercise picker routing**: Verify picking exercises in template form adds to template (not active workout), and picking in workout still works normally
