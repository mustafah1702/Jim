# Sprint 3: Quality of Life — Design Spec

## Overview

Sprint 3 adds four quality-of-life features to Jim before the V1 submission sprint: delete workout history, keyboard handling improvements, workout timer persistence, and better empty states for first-time users.

---

## Feature 1: Delete Workout History

### Interaction
- Swipe-left on any `WorkoutHistoryCard` reveals a red "Delete" button using `Swipeable` from `react-native-gesture-handler`.
- Tapping "Delete" shows a confirmation `Alert.alert`: title "Delete Workout?", message "This cannot be undone.", buttons Cancel / Delete.
- Works on both the History screen and the Today screen's recent workouts section (both use `WorkoutHistoryCard`).

### Data Flow
- New `useDeleteWorkout` hook with a React Query mutation.
- Calls `supabase.from('workouts').delete().eq('id', workoutId)`.
- RLS ensures only the owner can delete.
- `workout_sets` are cascade-deleted via foreign key `ON DELETE CASCADE`.
- Personal records tied to deleted sets are left intact — recalculating PRs is out of scope for V1.
- On success: invalidate React Query cache for workouts, weekly stats, and progress data.

### Files Touched
- `src/components/workout/WorkoutHistoryCard.tsx` — wrap in `Swipeable`, render delete action, call `useDeleteWorkout` internally
- New `src/hooks/useDeleteWorkout.ts` — React Query mutation
- No changes to `history.tsx` or `index.tsx` — the card handles deletion self-contained via the hook

---

## Feature 2: Keyboard Handling Improvements

### Auto-Focus Flow
- Within a single `ExerciseCard`, tapping "Next" on a weight field focuses the reps field in the same row.
- Tapping "Done" on a reps field focuses the weight field of the next set row (if it exists), otherwise dismisses the keyboard.
- Focus does NOT jump across exercises. The last set's "Done" in an exercise dismisses the keyboard.

### Ref Management
- `ExerciseCard` creates an array of refs: one per set, each containing `{ weightRef, repsRef }`.
- Refs are passed down to `SetRow` components.
- When a new set is added via "Add Set", auto-focus the new set's weight field.

### Return Key Types
- Weight field: `returnKeyType="next"` (already set).
- Reps field (not last set in exercise): `returnKeyType="next"`.
- Reps field (last set in exercise): `returnKeyType="done"`.

### Template Form
- Apply the same tab-through pattern to `template-form.tsx` if it uses similar set inputs.
- Ensure `KeyboardAvoidingView` is present.

### Files Touched
- `src/components/workout/SetRow.tsx` — accept refs, wire up `onSubmitEditing`
- `src/components/workout/ExerciseCard.tsx` — create and manage ref arrays, pass to SetRow
- `app/template-form.tsx` — add KeyboardAvoidingView if missing, apply same pattern if applicable

---

## Feature 3: Workout Timer Persistence

### Persistence Mechanism
- Add Zustand `persist` middleware to `useWorkoutStore`, backed by AsyncStorage.
- Store key: `"jim-active-workout"`.
- All state auto-persists: `workout`, `restEndAt`, `restDuration`.
- Zustand handles hydration automatically on app launch.

### Recovery Flow (in `_layout.tsx`)
- After auth check + store hydration, check if `workout` is non-null.
- If saved workout exists and is **< 24 hours old**: show `Alert.alert` — "Resume Workout?" with message "You have an unfinished workout from [X hours/minutes ago]." Buttons: Resume / Discard.
- If saved workout exists and is **>= 24 hours old**: show `Alert.alert` — "Discard Old Workout?" with message "You have a workout from [date] that was never finished." Button: Discard only.
- **Resume**: navigate to `/workout` screen.
- **Discard**: call `workoutStore.cancelWorkout()` to clear state (AsyncStorage cleared automatically by persist middleware).

### Rest Timer
- `restEndAt` is stored as an ISO timestamp, so on resume the timer correctly shows remaining time or has already expired.
- No special handling needed for expired timers.

### Edge Cases
- Signing out clears the persisted workout state by calling `workoutStore.cancelWorkout()` in the sign-out handler.
- Hydration completes before the recovery check — use Zustand persist's `onRehydrateStorage` / `hasHydrated` flag.

### Files Touched
- `src/stores/workoutStore.ts` — add persist middleware with AsyncStorage
- `app/_layout.tsx` — add recovery prompt logic after hydration + auth
- `src/stores/authStore.ts` — clear persisted workout in sign-out action

---

## Feature 4: First-Launch Experience / Better Empty States

### Approach
Enhance existing `EmptyState` instances with more actionable, guiding copy. No onboarding carousel, no new screens.

### Updated Empty States

| Screen | Location | New Title | New Description |
|--------|----------|-----------|-----------------|
| Today (recent) | `index.tsx` | "Ready to train?" | "Tap the button below to log your first workout, or create a template to get started faster." |
| History | `history.tsx` | "Your workouts will show up here" | "After you finish a workout, you'll see it here with your sets, volume, and duration." |
| Templates | `templates.tsx` | "Save time with templates" | "Templates let you pre-build workouts so you can start training with one tap." |
| Progress | `progress.tsx` | "Track your progress" | "Log a few workouts and you'll see volume trends, PRs, and muscle group breakdowns here." |
| Workout (no exercises) | `workout.tsx` | "Add your first exercise" | "Tap 'Add Exercise' below to pick from 36+ exercises or create your own." |

### Design Principles
- Titles are action-oriented or explanatory.
- Descriptions explain what will appear and what to do next.
- Existing action buttons remain unchanged.
- No "first launch" state tracking needed — empty states disappear naturally after user action.

### Files Touched
- `app/(tabs)/index.tsx` — update EmptyState props
- `app/(tabs)/history.tsx` — update EmptyState props
- `app/(tabs)/templates.tsx` — update EmptyState props
- `app/(tabs)/progress.tsx` — update EmptyState props
- `app/workout.tsx` — update EmptyState props
