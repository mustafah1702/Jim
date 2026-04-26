# Mid-Workout PR Detection

## Overview

When a user completes a set during an active workout, the app compares it against that exercise's historical best weight and volume. If it's a new PR, a trophy icon appears on the set row and the device gives a haptic buzz. Official PR records are still created by the existing database trigger on workout save.

## PR Types

- **Weight PR**: `set.weight > baseline.bestWeight`
- **Volume PR**: `set.weight * set.reps > baseline.bestVolume`

## Data Flow

1. **Workout start (template)** — fetch baselines for all pre-populated exercises in one query.
2. **Exercise added mid-workout** — fetch baseline for that exercise lazily.
3. **Set completed** — compare locally against cached baselines. Show trophy + haptic if PR.
4. **Workout save** — no changes. Existing `workout_sets_record_prs` trigger inserts official `personal_records` rows.

## New Hook: `useWorkoutPRs`

### State

```typescript
type PRBaseline = { bestWeight: number; bestVolume: number }
type PRResult = { isWeightPR: boolean; isVolumePR: boolean }
```

A `Map<exerciseId, PRBaseline>` of cached baselines, persisted for the duration of the workout session.

### API

- `fetchBaselines(exerciseIds: string[]): Promise<void>` — queries `personal_records` for max `record_value` grouped by `exercise_id` and `record_type` where `exercise_id in (...)`. Skips IDs already cached. Stores results in the map.
- `checkPR(exerciseId: string, weight: number | null, reps: number | null): PRResult` — pure local comparison against cached baseline. Returns `{ isWeightPR: false, isVolumePR: false }` if no baseline exists yet (query still in flight) or if weight/reps are null.

### Baseline Query

```sql
SELECT exercise_id, record_type, MAX(record_value) as best_value
FROM personal_records
WHERE user_id = $userId
  AND exercise_id IN ($exerciseIds)
GROUP BY exercise_id, record_type
```

Returns at most 2 rows per exercise (one for `'weight'`, one for `'volume'`).

## UI Changes

### SetRow Component

- When a set is completed (`completed === true`) and is not a warmup (`isWarmup === false`), call `checkPR(exerciseId, weight, reps)`.
- If either `isWeightPR` or `isVolumePR` is true:
  - Show a trophy icon (`Ionicons trophy`) to the right of the completion checkmark.
  - Trigger `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`.
- Haptic fires once on the transition to completed (not on every render).
- If the user edits weight/reps on an already-completed set, re-evaluate PR status — icon appears or disappears accordingly, but no additional haptic.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| First-ever set for an exercise | No baseline in DB. Any weight > 0 is a weight PR, any volume > 0 is a volume PR. Matches DB trigger which creates baseline PRs on first save. |
| Multiple PR sets in same workout | Baselines are fetched once and static for the session. If you hit 200 lbs then 205 lbs, both show as PRs. The DB trigger determines the official record on save. |
| Warmup sets | Skip PR check entirely. Matches DB trigger behavior (`is_warmup = false` filter). |
| Editing a completed set | Re-run PR check with new values. Icon appears/disappears. No re-haptic. |
| Weight or reps is null/zero | Not a PR. `checkPR` returns false for both. |
| Network failure fetching baselines | Baselines stay empty. No PRs shown (false negatives are acceptable; false positives are not). |

## Dependencies

- `expo-haptics` — needs to be installed (`npx expo install expo-haptics`).
- No database schema changes.
- No changes to the workout save flow.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/useWorkoutPRs.ts` | Create — hook with baseline fetching and PR comparison |
| `src/components/workout/SetRow.tsx` | Modify — add trophy icon and haptic trigger |
| `src/components/workout/ExerciseCard.tsx` | Modify — pass `checkPR` and `exerciseId` to SetRow |
| `app/workout.tsx` | Modify — initialize `useWorkoutPRs`, fetch baselines on mount and exercise add |
