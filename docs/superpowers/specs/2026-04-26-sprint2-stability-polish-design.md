# Sprint 2: Stability & Polish — Design Spec

## Overview

Sprint 2 adds five features to Jim that improve reliability, feel, and usability: workout notes, haptic feedback, skeleton/spinner loading states, pull-to-refresh, and error handling for offline/edge cases. All five are independent and implemented feature-by-feature in the order below.

---

## 1. Workout Notes

### Goal
Let users jot down how a session went. The DB column (`workouts.notes`) already exists and `useRecentWorkouts` already fetches it.

### Changes

**Type update — `src/types/workout.ts`:**
- Add `notes: string | null` to `ActiveWorkout`.

**Store — `src/stores/workoutStore.ts`:**
- Add `setNotes(notes: string)` action that updates `workout.notes`.
- `startWorkout` and `startFromTemplate` initialize `notes: null`.

**Save hook — `src/hooks/useSaveWorkout.ts`:**
- Include `notes: workout.notes` in the `workouts` insert payload.

**Workout screen — `app/workout.tsx`:**
- Below `WorkoutHeader`, add a collapsible notes section:
  - Default state: a tap target showing "Add notes..." (muted text with a pencil icon).
  - Expanded state: multiline `TextInput` (placeholder: "How did it go?", max ~500 chars).
  - Calls `setNotes` on text change.

**History card — `src/components/workout/WorkoutHistoryCard.tsx`:**
- If `workout.notes` is non-null and non-empty, render a muted caption line below the stats row, truncated to 2 lines with `numberOfLines={2}`.

---

## 2. Haptic Feedback

### Goal
Add tactile feedback at three key moments to make the app feel native.

### Changes

All haptics use the existing `expo-haptics` dependency (already installed and imported in `SetRow.tsx`).

**Set completion — `src/components/workout/SetRow.tsx`:**
- In `toggleCompleted`, when toggling to `completed: true`, fire `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`.
- The existing PR haptic (`ImpactFeedbackStyle.Medium`) in the `useEffect` stays as-is — it fires additionally when a PR is detected.

**Rest timer start — `src/components/workout/ExerciseCard.tsx`:**
- At line 89, where `startRestTimer()` is called on set completion, fire `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` immediately before the call.
- Also in `RestTimerBanner.tsx` `handleExtend` (+30s button) — no haptic needed there, it's a minor adjustment not a timer start.
- Do NOT put the haptic inside the Zustand store (stores shouldn't have side effects).

**Workout save — `app/workout.tsx`:**
- In the `saveMutation.mutate` `onSuccess` callback, fire `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`.

---

## 3. Loading States

### Goal
Show skeleton placeholders for text/card content and spinners for charts/non-text content while data loads.

### Changes

**New component — `src/components/Skeleton.tsx`:**
- Props: `width`, `height`, `borderRadius` (all optional with sensible defaults).
- Renders a `View` with `backgroundColor: theme.colors.surfaceMuted`.
- Subtle opacity pulse animation using React Native `Animated` API (loop between 0.3 and 0.7 opacity, ~1s duration).

**Today screen — `app/(tabs)/index.tsx`:**
- Destructure `isLoading` from `useWeeklyStats()` and `useRecentWorkouts()`.
- When loading: skeleton row for 3 MetricTiles + 2-3 skeleton card shapes in the Recent section.

**History screen — `app/(tabs)/history.tsx`:**
- Destructure `isLoading` from `useRecentWorkouts(50)`.
- When loading: skeleton metric tiles row + 3 skeleton card shapes.

**Templates screen — `app/(tabs)/templates.tsx`:**
- Already has `isLoading` from `useTemplates()`.
- Replace the current text-based "Loading templates..." with 2-3 skeleton card shapes.

**Progress screen — `app/(tabs)/progress.tsx`:**
- Destructure `isLoading` from `useProgressStats()`.
- When loading: skeleton metric tiles row. Chart sections show a centered `ActivityIndicator` spinner.

**Profile screen — `app/(tabs)/profile.tsx`:**
- Destructure `isLoading` from `useProfileStats()`.
- Show `ActivityIndicator` spinner for the stats section while loading.

**Pattern:** Render skeletons when `isLoading && !data`. Once data arrives, render the real content. This avoids flashing skeletons on subsequent renders when cached data is available.

---

## 4. Pull-to-Refresh

### Goal
Let users pull down on any tab to refresh all data.

### Changes

**All four tab screens** (Today, History, Templates, Progress):
- Import `RefreshControl` from `react-native`.
- Import `useQueryClient` from `@tanstack/react-query`.
- Add local `const [refreshing, setRefreshing] = useState(false)`.
- `handleRefresh`:
  ```
  setRefreshing(true);
  await queryClient.invalidateQueries();
  setRefreshing(false);
  ```
- Add `refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.accent} />}` to the `ScrollView`.

**Global invalidation:** Pulling on any tab invalidates all queries via `queryClient.invalidateQueries()`, so switching tabs shows fresh data everywhere.

---

## 5. Error Handling & Edge Cases

### Goal
Handle offline state, auth failures, and save errors gracefully without crashing.

### Changes

**Offline banner — `src/components/OfflineBanner.tsx`:**
- New component that subscribes to React Query's `onlineManager`.
- Uses `useSyncExternalStore` or a `useState` + `onlineManager.subscribe()` pattern to track online status.
- When offline: renders a small bar with yellow/warning background, text "You're offline", positioned at the top of the screen.
- When online: renders nothing.
- Animated — slides in/out smoothly.

**Banner placement — `app/_layout.tsx`:**
- Render `<OfflineBanner />` inside the `AuthGate` component, above the `<Stack>`.

**Auth token handling — `src/stores/authStore.ts`:**
- Already functional: `autoRefreshToken: true` on the Supabase client handles token refresh. `onAuthStateChange` already listens for session changes and updates the store. The `AuthGate` in `_layout.tsx` redirects to sign-in when session becomes null.
- No code changes needed — existing implementation handles this correctly.

**Workout save retry — `app/workout.tsx`:**
- Update the error alert in `handleFinish` to include a "Retry" button:
  ```
  Alert.alert('Save Failed', error.message, [
    { text: 'OK', style: 'cancel' },
    { text: 'Retry', onPress: () => saveMutation.mutate(...) },
  ]);
  ```

**Global mutation error handling — `src/lib/queryClient.ts`:**
- Add `MutationCache` with a default `onError` callback that shows `Alert.alert('Error', error.message)` for any mutation that doesn't have its own `onError` handler.

**Empty states:**
- Already well-handled across all screens with the `EmptyState` component. No changes needed.

---

## Files Modified

| File | Features |
|------|----------|
| `src/types/workout.ts` | Notes |
| `src/stores/workoutStore.ts` | Notes |
| `src/hooks/useSaveWorkout.ts` | Notes |
| `app/workout.tsx` | Notes, Haptics, Error handling |
| `src/components/workout/WorkoutHistoryCard.tsx` | Notes |
| `src/components/workout/SetRow.tsx` | Haptics |
| `src/components/Skeleton.tsx` | Loading (new file) |
| `app/(tabs)/index.tsx` | Loading, Pull-to-refresh |
| `app/(tabs)/history.tsx` | Loading, Pull-to-refresh |
| `app/(tabs)/templates.tsx` | Loading, Pull-to-refresh |
| `app/(tabs)/progress.tsx` | Loading, Pull-to-refresh |
| `app/(tabs)/profile.tsx` | Loading |
| `src/components/OfflineBanner.tsx` | Error handling (new file) |
| `app/_layout.tsx` | Error handling |
| `src/lib/queryClient.ts` | Error handling |

## New Files

- `src/components/Skeleton.tsx`
- `src/components/OfflineBanner.tsx`

## Dependencies

No new npm dependencies. All features use existing packages:
- `expo-haptics` (already installed)
- `@tanstack/react-query` `onlineManager` and `MutationCache` (already installed)
- React Native `RefreshControl`, `Animated`, `ActivityIndicator` (built-in)
