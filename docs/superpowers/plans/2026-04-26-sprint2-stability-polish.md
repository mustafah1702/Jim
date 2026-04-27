# Sprint 2: Stability & Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add workout notes, haptic feedback, skeleton/spinner loading states, pull-to-refresh, and error handling to make Jim feel stable and polished for V1.

**Architecture:** Five independent features implemented sequentially. Each feature is self-contained — no feature depends on another. Shared components (Skeleton, OfflineBanner) are created in the task that first needs them.

**Tech Stack:** React Native, Expo 54, Zustand, React Query (TanStack), Supabase, expo-haptics

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types/workout.ts` | Modify | Add `notes` field to `ActiveWorkout` |
| `src/stores/workoutStore.ts` | Modify | Add `setNotes` action, init `notes` in start methods |
| `src/hooks/useSaveWorkout.ts` | Modify | Include `notes` in workout insert |
| `app/workout.tsx` | Modify | Notes UI, save haptic, save retry |
| `src/components/workout/WorkoutHistoryCard.tsx` | Modify | Display notes in history cards |
| `src/components/workout/SetRow.tsx` | Modify | Set completion haptic |
| `src/components/workout/ExerciseCard.tsx` | Modify | Rest timer haptic |
| `src/components/Skeleton.tsx` | Create | Animated skeleton placeholder component |
| `app/(tabs)/index.tsx` | Modify | Loading skeletons, pull-to-refresh |
| `app/(tabs)/history.tsx` | Modify | Loading skeletons, pull-to-refresh |
| `app/(tabs)/templates.tsx` | Modify | Loading skeletons, pull-to-refresh |
| `app/(tabs)/progress.tsx` | Modify | Loading spinner, pull-to-refresh |
| `app/(tabs)/profile.tsx` | Modify | Loading spinner for stats |
| `src/components/OfflineBanner.tsx` | Create | Offline detection banner using React Query onlineManager |
| `app/_layout.tsx` | Modify | Mount OfflineBanner globally |
| `src/lib/queryClient.ts` | Modify | Add MutationCache with global error handler |

---

### Task 1: Add notes field to ActiveWorkout type

**Files:**
- Modify: `src/types/workout.ts:18-21`

- [ ] **Step 1: Add notes to ActiveWorkout**

In `src/types/workout.ts`, change the `ActiveWorkout` type from:

```typescript
export type ActiveWorkout = {
  startedAt: string;
  exercises: WorkoutExercise[];
};
```

to:

```typescript
export type ActiveWorkout = {
  startedAt: string;
  notes: string | null;
  exercises: WorkoutExercise[];
};
```

---

### Task 2: Add setNotes action to workout store

**Files:**
- Modify: `src/stores/workoutStore.ts:16-53` (type definition), `src/stores/workoutStore.ts:60-89` (start methods)

- [ ] **Step 1: Add setNotes to WorkoutState type**

In `src/stores/workoutStore.ts`, add after the `discardWorkout` line (line 26) in the `WorkoutState` type:

```typescript
  setNotes: (notes: string) => void;
```

So the Lifecycle section becomes:

```typescript
  // Lifecycle
  startWorkout: () => void;
  startFromTemplate: (template: Template) => void;
  discardWorkout: () => void;
  setNotes: (notes: string) => void;
```

- [ ] **Step 2: Initialize notes in startWorkout**

Change `startWorkout` from:

```typescript
  startWorkout: () =>
    set({
      workout: { startedAt: new Date().toISOString(), exercises: [] },
      restEndAt: null,
    }),
```

to:

```typescript
  startWorkout: () =>
    set({
      workout: { startedAt: new Date().toISOString(), notes: null, exercises: [] },
      restEndAt: null,
    }),
```

- [ ] **Step 3: Initialize notes in startFromTemplate**

Change the `startFromTemplate` workout object from:

```typescript
      workout: {
        startedAt: new Date().toISOString(),
        exercises: template.exercises.map((te) => ({
```

to:

```typescript
      workout: {
        startedAt: new Date().toISOString(),
        notes: null,
        exercises: template.exercises.map((te) => ({
```

- [ ] **Step 4: Add setNotes implementation**

Add after the `discardWorkout` implementation (after line 91):

```typescript
  setNotes: (notes) =>
    set((state) => {
      if (!state.workout) return state;
      return { workout: { ...state.workout, notes } };
    }),
```

---

### Task 3: Save notes to Supabase

**Files:**
- Modify: `src/hooks/useSaveWorkout.ts:16-24`

- [ ] **Step 1: Include notes in workout insert**

In `src/hooks/useSaveWorkout.ts`, change the workout insert from:

```typescript
      const { data: workoutRow, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: session.user.id,
          started_at: workout.startedAt,
          ended_at: new Date().toISOString(),
        })
        .select('id')
        .single();
```

to:

```typescript
      const { data: workoutRow, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: session.user.id,
          started_at: workout.startedAt,
          ended_at: new Date().toISOString(),
          notes: workout.notes,
        })
        .select('id')
        .single();
```

---

### Task 4: Add notes UI to workout screen

**Files:**
- Modify: `app/workout.tsx`

- [ ] **Step 1: Add imports and store selectors**

In `app/workout.tsx`, add `useState` to the React import and `TextInput` and `Pressable` to the react-native import:

Change:

```typescript
import { useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
```

to:

```typescript
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
```

Add Ionicons import after the router import:

```typescript
import { Ionicons } from '@expo/vector-icons';
```

- [ ] **Step 2: Add store selectors and state**

Inside `WorkoutScreen`, after the existing store selectors (after line 21), add:

```typescript
  const notes = useWorkoutStore((s) => s.workout?.notes ?? '');
  const setNotes = useWorkoutStore((s) => s.setNotes);
  const [notesExpanded, setNotesExpanded] = useState(false);
```

- [ ] **Step 3: Add collapsible notes section in the ScrollView**

In the `ScrollView`, add the notes section right before the empty state / exercises block (before `{workout.exercises.length === 0 && (`):

```tsx
          {notesExpanded ? (
            <TextInput
              style={{
                backgroundColor: theme.colors.surfaceElevated,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                color: theme.colors.textPrimary,
                fontSize: 15,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did it go?"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={500}
              selectionColor={theme.colors.accent}
            />
          ) : (
            <Pressable
              onPress={() => setNotesExpanded(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
                paddingVertical: theme.spacing.sm,
              }}
            >
              <Ionicons name="create-outline" size={16} color={theme.colors.textMuted} />
              <Text variant="body" tone="muted">
                {notes ? notes : 'Add notes...'}
              </Text>
            </Pressable>
          )}
```

- [ ] **Step 4: Auto-expand if notes exist**

Update the `useState` for `notesExpanded` to auto-expand when there are existing notes. Change:

```typescript
  const [notesExpanded, setNotesExpanded] = useState(false);
```

to:

```typescript
  const [notesExpanded, setNotesExpanded] = useState(notes.length > 0);
```

---

### Task 5: Display notes in workout history cards

**Files:**
- Modify: `src/components/workout/WorkoutHistoryCard.tsx:80-101`

- [ ] **Step 1: Add notes display below stats row**

In `WorkoutHistoryCard`, add a notes line after the `statsRow` View (after the closing `</View>` of `styles.statsRow`, before the closing `</Card>`):

Change the end of the return from:

```tsx
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
          <Text variant="caption" tone="secondary">
            {formatDuration(workout.started_at, workout.ended_at)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="checkmark-circle-outline" size={14} color={theme.colors.textMuted} />
          <Text variant="caption" tone="secondary">
            {totalSets} sets
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="barbell-outline" size={14} color={theme.colors.textMuted} />
          <Text variant="caption" tone="secondary">
            {formatVolume(totalVolume)} vol
          </Text>
        </View>
      </View>
    </Card>
```

to:

```tsx
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
          <Text variant="caption" tone="secondary">
            {formatDuration(workout.started_at, workout.ended_at)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="checkmark-circle-outline" size={14} color={theme.colors.textMuted} />
          <Text variant="caption" tone="secondary">
            {totalSets} sets
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="barbell-outline" size={14} color={theme.colors.textMuted} />
          <Text variant="caption" tone="secondary">
            {formatVolume(totalVolume)} vol
          </Text>
        </View>
      </View>

      {workout.notes ? (
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {workout.notes}
        </Text>
      ) : null}
    </Card>
```

---

### Task 6: Add haptic on set completion

**Files:**
- Modify: `src/components/workout/SetRow.tsx:50-59`

- [ ] **Step 1: Add light haptic when completing a set**

In `SetRow.tsx`, change `toggleCompleted` from:

```typescript
  const toggleCompleted = () => {
    // Parse current values before completing
    if (!set.completed) {
      const w = parseFloat(weightText);
      const r = parseInt(repsText, 10);
      if (!isNaN(w)) onUpdate({ weight: w });
      if (!isNaN(r)) onUpdate({ reps: r });
    }
    onUpdate({ completed: !set.completed });
  };
```

to:

```typescript
  const toggleCompleted = () => {
    // Parse current values before completing
    if (!set.completed) {
      const w = parseFloat(weightText);
      const r = parseInt(repsText, 10);
      if (!isNaN(w)) onUpdate({ weight: w });
      if (!isNaN(r)) onUpdate({ reps: r });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onUpdate({ completed: !set.completed });
  };
```

Note: `Haptics` is already imported in this file.

---

### Task 7: Add haptic on rest timer start

**Files:**
- Modify: `src/components/workout/ExerciseCard.tsx:86-91`

- [ ] **Step 1: Add Haptics import**

In `ExerciseCard.tsx`, add the import after the existing imports:

```typescript
import * as Haptics from 'expo-haptics';
```

- [ ] **Step 2: Add medium haptic before startRestTimer call**

Change the `onUpdate` callback in the SetRow from:

```typescript
            onUpdate={(updates) => {
              updateSet(exercise.id, set.id, updates);
              if (updates.completed === true) {
                startRestTimer();
              }
            }}
```

to:

```typescript
            onUpdate={(updates) => {
              updateSet(exercise.id, set.id, updates);
              if (updates.completed === true) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                startRestTimer();
              }
            }}
```

---

### Task 8: Add haptic on workout save

**Files:**
- Modify: `app/workout.tsx:56-69`

- [ ] **Step 1: Add Haptics import**

In `app/workout.tsx`, add after the existing imports:

```typescript
import * as Haptics from 'expo-haptics';
```

- [ ] **Step 2: Add success haptic in save onSuccess**

Change the `saveMutation.mutate` call from:

```typescript
          saveMutation.mutate(undefined, {
            onSuccess: () => router.back(),
            onError: (error) => {
              Alert.alert('Error', `Failed to save workout: ${error.message}`);
            },
          });
```

to:

```typescript
          saveMutation.mutate(undefined, {
            onSuccess: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            },
            onError: (error) => {
              Alert.alert('Save Failed', error.message, [
                { text: 'OK', style: 'cancel' },
                { text: 'Retry', onPress: () => saveMutation.mutate() },
              ]);
            },
          });
```

Note: This step also implements the workout save retry from the error handling feature (Task 14), since we're already editing this exact code block.

---

### Task 9: Create Skeleton component

**Files:**
- Create: `src/components/Skeleton.tsx`

- [ ] **Step 1: Create the Skeleton component**

Create `src/components/Skeleton.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { Animated, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

type SkeletonProps = {
  width?: ViewStyle['width'];
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceMuted,
          opacity,
        },
        style,
      ]}
    />
  );
}
```

---

### Task 10: Add loading skeletons to Today screen

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Add imports**

In `app/(tabs)/index.tsx`, add the Skeleton import:

```typescript
import { Skeleton } from '@/components/Skeleton';
```

- [ ] **Step 2: Destructure isLoading from hooks**

Change:

```typescript
  const { data: weeklyStats } = useWeeklyStats();
  const { data: recentWorkouts } = useRecentWorkouts(5);
```

to:

```typescript
  const { data: weeklyStats, isLoading: statsLoading } = useWeeklyStats();
  const { data: recentWorkouts, isLoading: recentLoading } = useRecentWorkouts(5);
```

- [ ] **Step 3: Add skeleton for This Week metrics**

Replace the This Week section from:

```tsx
        <View style={{ gap: theme.spacing.md }}>
          <SectionHeader title="This Week" />
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <MetricTile
              label="Workouts"
              value={String(weeklyStats?.workouts ?? 0)}
              icon="barbell-outline"
              tone="accent"
            />
            <MetricTile
              label="Volume"
              value={formatVolume(weeklyStats?.volume ?? 0)}
              icon="trending-up-outline"
            />
            <MetricTile
              label="PRs"
              value={String(weeklyStats?.prs ?? 0)}
              icon="trophy-outline"
              tone="success"
            />
          </View>
        </View>
```

to:

```tsx
        <View style={{ gap: theme.spacing.md }}>
          <SectionHeader title="This Week" />
          {statsLoading && !weeklyStats ? (
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.md,
                    gap: theme.spacing.sm,
                  }}
                >
                  <Skeleton width={28} height={28} borderRadius={theme.radius.sm} />
                  <Skeleton width={48} height={22} />
                  <Skeleton width={64} height={12} />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <MetricTile
                label="Workouts"
                value={String(weeklyStats?.workouts ?? 0)}
                icon="barbell-outline"
                tone="accent"
              />
              <MetricTile
                label="Volume"
                value={formatVolume(weeklyStats?.volume ?? 0)}
                icon="trending-up-outline"
              />
              <MetricTile
                label="PRs"
                value={String(weeklyStats?.prs ?? 0)}
                icon="trophy-outline"
                tone="success"
              />
            </View>
          )}
        </View>
```

- [ ] **Step 4: Add skeleton for Recent section**

Replace the Recent section from:

```tsx
        <View style={{ gap: theme.spacing.md }}>
          <SectionHeader title="Recent" actionLabel="History" onAction={() => router.push('/history')} />
          {recentWorkouts && recentWorkouts.length > 0 ? (
            recentWorkouts.map((w) => <WorkoutHistoryCard key={w.id} workout={w} />)
          ) : (
            <Card muted>
              <EmptyState
                compact
                icon="time-outline"
                title="No workouts logged"
                description="Finished workouts will appear here with volume, sets, and duration."
                action={
                  <Button
                    label="Log first workout"
                    icon="add"
                    size="sm"
                    fullWidth={false}
                    onPress={handleStartEmpty}
                  />
                }
              />
            </Card>
          )}
        </View>
```

to:

```tsx
        <View style={{ gap: theme.spacing.md }}>
          <SectionHeader title="Recent" actionLabel="History" onAction={() => router.push('/history')} />
          {recentLoading && !recentWorkouts ? (
            <View style={{ gap: theme.spacing.md }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: theme.colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.lg,
                    gap: theme.spacing.md,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Skeleton width="60%" height={16} />
                    <Skeleton width={40} height={12} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <Skeleton width={50} height={12} />
                    <Skeleton width={50} height={12} />
                    <Skeleton width={50} height={12} />
                  </View>
                </View>
              ))}
            </View>
          ) : recentWorkouts && recentWorkouts.length > 0 ? (
            recentWorkouts.map((w) => <WorkoutHistoryCard key={w.id} workout={w} />)
          ) : (
            <Card muted>
              <EmptyState
                compact
                icon="time-outline"
                title="No workouts logged"
                description="Finished workouts will appear here with volume, sets, and duration."
                action={
                  <Button
                    label="Log first workout"
                    icon="add"
                    size="sm"
                    fullWidth={false}
                    onPress={handleStartEmpty}
                  />
                }
              />
            </Card>
          )}
        </View>
```

---

### Task 11: Add loading skeletons to History screen

**Files:**
- Modify: `app/(tabs)/history.tsx`

- [ ] **Step 1: Add Skeleton import**

Add to imports:

```typescript
import { Skeleton } from '@/components/Skeleton';
```

- [ ] **Step 2: Destructure isLoading**

Change:

```typescript
  const { data: workouts } = useRecentWorkouts(50);
```

to:

```typescript
  const { data: workouts, isLoading } = useRecentWorkouts(50);
```

- [ ] **Step 3: Add skeleton for metrics and workout list**

Replace everything after the header text `</View>` (after "All your completed sessions in one place.") and before the closing `</ScrollView>` with:

```tsx
        {isLoading && !workouts ? (
          <>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.md,
                    gap: theme.spacing.sm,
                  }}
                >
                  <Skeleton width={28} height={28} borderRadius={theme.radius.sm} />
                  <Skeleton width={48} height={22} />
                  <Skeleton width={64} height={12} />
                </View>
              ))}
            </View>
            <View style={{ gap: theme.spacing.md }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: theme.colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.lg,
                    gap: theme.spacing.md,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Skeleton width="60%" height={16} />
                    <Skeleton width={40} height={12} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <Skeleton width={50} height={12} />
                    <Skeleton width={50} height={12} />
                    <Skeleton width={50} height={12} />
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <MetricTile
                label="Logged"
                value={String(totalWorkouts)}
                icon="calendar-outline"
                tone="accent"
              />
              <MetricTile
                label="Sets"
                value={String(totalSets)}
                icon="checkmark-circle-outline"
              />
              <MetricTile
                label="Volume"
                value={formatVolume(totalVolume)}
                icon="stats-chart-outline"
                tone="success"
              />
            </View>

            {workouts && workouts.length > 0 ? (
              <View style={{ gap: theme.spacing.md }}>
                {workouts.map((w) => (
                  <WorkoutHistoryCard key={w.id} workout={w} />
                ))}
              </View>
            ) : (
              <Card muted>
                <EmptyState
                  icon="time-outline"
                  title="No workout history yet"
                  description="Finish a workout and it will show up here with your exercises, sets, and totals."
                  action={<Button label="Start Workout" icon="add" fullWidth={false} onPress={handleStart} />}
                />
              </Card>
            )}
          </>
        )}
```

---

### Task 12: Add loading skeletons to Templates screen

**Files:**
- Modify: `app/(tabs)/templates.tsx`

- [ ] **Step 1: Add Skeleton import**

Add to imports:

```typescript
import { Skeleton } from '@/components/Skeleton';
import { Card } from '@/components/Card';
```

Note: `Card` is not currently imported in templates.tsx — we need it for the skeleton card containers.

- [ ] **Step 2: Replace text-based loading with skeletons**

Change the `!hasTemplates` block from:

```tsx
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
```

to:

```tsx
        {isLoading && !templates ? (
          <View style={{ gap: theme.spacing.md }}>
            {[1, 2, 3].map((i) => (
              <Card key={i} style={{ gap: theme.spacing.md }}>
                <Skeleton width="50%" height={18} />
                <Skeleton width="80%" height={14} />
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                  <Skeleton width={80} height={32} borderRadius={theme.radius.sm} />
                  <Skeleton width={80} height={32} borderRadius={theme.radius.sm} />
                </View>
              </Card>
            ))}
          </View>
        ) : !hasTemplates ? (
          <EmptyState
            icon="clipboard-outline"
            title="No templates yet"
            description="Create a template to save your go-to exercises and start workouts faster."
            action={
              <Button
                label="Create Template"
                icon="add"
                fullWidth={false}
                onPress={handleCreate}
              />
            }
          />
```

---

### Task 13: Add loading states to Progress and Profile screens

**Files:**
- Modify: `app/(tabs)/progress.tsx`
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Add imports to Progress screen**

In `app/(tabs)/progress.tsx`, add:

```typescript
import { ActivityIndicator } from 'react-native';
import { Skeleton } from '@/components/Skeleton';
```

- [ ] **Step 2: Destructure isLoading in Progress**

Change:

```typescript
  const { data: stats } = useProgressStats();
```

to:

```typescript
  const { data: stats, isLoading } = useProgressStats();
```

- [ ] **Step 3: Add loading state to Progress screen**

Change the content block after the header text. Replace from `{hasData ? (` through the end of the empty state to:

```tsx
        {isLoading && !stats ? (
          <>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.md,
                    gap: theme.spacing.sm,
                  }}
                >
                  <Skeleton width={28} height={28} borderRadius={theme.radius.sm} />
                  <Skeleton width={48} height={22} />
                  <Skeleton width={64} height={12} />
                </View>
              ))}
            </View>
            <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxxl }}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
          </>
        ) : hasData ? (
          <>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <MetricTile
                label="Workouts"
                value={String(stats.totalWorkouts)}
                icon="barbell-outline"
                tone="accent"
              />
              <MetricTile
                label="Streak"
                value={stats.currentStreak > 0 ? `${stats.currentStreak}w` : '0'}
                icon="flame-outline"
                tone="success"
              />
              <MetricTile
                label="Volume"
                value={formatVolume(stats.totalVolume)}
                icon="stats-chart-outline"
              />
            </View>

            {stats.weeklyVolume.length > 0 && <VolumeChart data={stats.weeklyVolume} />}

            {stats.prTrend.length > 0 && <PRTrendChart data={stats.prTrend} />}

            {stats.muscleBreakdown.length > 0 && <MuscleBreakdown data={stats.muscleBreakdown} />}

            {stats.weeklyFrequency.length > 0 && <FrequencyGrid data={stats.weeklyFrequency} />}
          </>
        ) : (
          <Card muted>
            <EmptyState
              icon="trending-up-outline"
              title="Progress charts are waiting"
              description="Complete workouts to unlock exercise trends, volume changes, and personal bests."
              action={<Button label="Log Workout" icon="add" fullWidth={false} onPress={handleStart} />}
            />
          </Card>
        )}
```

- [ ] **Step 4: Add loading spinner to Profile screen**

In `app/(tabs)/profile.tsx`, add to the imports:

```typescript
import { ActivityIndicator } from 'react-native';
```

Wait — `ActivityIndicator` is available from `react-native` which is already imported. Just add `ActivityIndicator` to the existing destructure. Change:

```typescript
import { ActionSheetIOS, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
```

to:

```typescript
import { ActionSheetIOS, ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
```

- [ ] **Step 5: Destructure isLoading in Profile**

Change:

```typescript
  const { data: stats } = useProfileStats();
```

to:

```typescript
  const { data: stats, isLoading: statsLoading } = useProfileStats();
```

- [ ] **Step 6: Add loading state for profile KPIs**

Replace the KPIs section from:

```tsx
        {/* KPIs */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <MetricTile
            label="Total Workouts"
            value={String(stats?.totalWorkouts ?? 0)}
            icon="barbell-outline"
            tone="accent"
          />
          <MetricTile
            label="Days Active"
            value={String(stats?.daysActive ?? 0)}
            icon="calendar-outline"
            tone="success"
          />
        </View>
```

to:

```tsx
        {/* KPIs */}
        {statsLoading && !stats ? (
          <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
            <ActivityIndicator size="small" color={theme.colors.accent} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <MetricTile
              label="Total Workouts"
              value={String(stats?.totalWorkouts ?? 0)}
              icon="barbell-outline"
              tone="accent"
            />
            <MetricTile
              label="Days Active"
              value={String(stats?.daysActive ?? 0)}
              icon="calendar-outline"
              tone="success"
            />
          </View>
        )}
```

---

### Task 14: Add pull-to-refresh to Today screen

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Add imports**

Add `useState` and `RefreshControl` to the existing imports. Change:

```typescript
import { ScrollView, View } from 'react-native';
```

to:

```typescript
import { RefreshControl, ScrollView, View } from 'react-native';
```

Add `useState` to React (if not already present — it may not be in index.tsx):

Add at the top or extend the existing React import. Since index.tsx doesn't currently import React hooks, add:

```typescript
import { useState } from 'react';
```

Add the query client import:

```typescript
import { useQueryClient } from '@tanstack/react-query';
```

- [ ] **Step 2: Add refresh state and handler**

Inside `TodayScreen`, after the existing hook calls, add:

```typescript
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };
```

- [ ] **Step 3: Add RefreshControl to ScrollView**

Add the `refreshControl` prop to the `ScrollView`:

Change:

```tsx
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
```

to:

```tsx
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.accent} />
        }
        contentContainerStyle={{
```

---

### Task 15: Add pull-to-refresh to History screen

**Files:**
- Modify: `app/(tabs)/history.tsx`

- [ ] **Step 1: Add imports**

Change:

```typescript
import { ScrollView, View } from 'react-native';
```

to:

```typescript
import { RefreshControl, ScrollView, View } from 'react-native';
```

Add:

```typescript
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
```

- [ ] **Step 2: Add refresh state and handler**

Inside `HistoryScreen`, after the existing hook calls (after `const { data: workouts, isLoading } = useRecentWorkouts(50);`), add:

```typescript
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };
```

- [ ] **Step 3: Add RefreshControl to ScrollView**

Change:

```tsx
      <ScrollView
        contentContainerStyle={{
```

to:

```tsx
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.accent} />
        }
        contentContainerStyle={{
```

---

### Task 16: Add pull-to-refresh to Templates screen

**Files:**
- Modify: `app/(tabs)/templates.tsx`

- [ ] **Step 1: Add imports**

Change:

```typescript
import { Alert, ScrollView, View } from 'react-native';
```

to:

```typescript
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
```

Add:

```typescript
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
```

- [ ] **Step 2: Add refresh state and handler**

Inside `TemplatesScreen`, after the existing hook calls, add:

```typescript
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };
```

- [ ] **Step 3: Add RefreshControl to ScrollView**

Change:

```tsx
      <ScrollView
        contentContainerStyle={{
```

to:

```tsx
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.accent} />
        }
        contentContainerStyle={{
```

---

### Task 17: Add pull-to-refresh to Progress screen

**Files:**
- Modify: `app/(tabs)/progress.tsx`

- [ ] **Step 1: Add imports**

Change:

```typescript
import { ScrollView, View } from 'react-native';
```

to:

```typescript
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
```

Note: `ActivityIndicator` was added in Task 13. If executing sequentially, it's already there. If executing this task standalone, include it.

Add:

```typescript
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
```

- [ ] **Step 2: Add refresh state and handler**

Inside `ProgressScreen`, after the existing hook calls, add:

```typescript
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };
```

- [ ] **Step 3: Add RefreshControl to ScrollView**

Change:

```tsx
      <ScrollView
        contentContainerStyle={{
```

to:

```tsx
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.accent} />
        }
        contentContainerStyle={{
```

---

### Task 18: Create OfflineBanner component

**Files:**
- Create: `src/components/OfflineBanner.tsx`

- [ ] **Step 1: Create the OfflineBanner component**

Create `src/components/OfflineBanner.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { onlineManager } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';

export function OfflineBanner() {
  const theme = useTheme();
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());
  const [slideAnim] = useState(() => new Animated.Value(isOnline ? -50 : 0));

  useEffect(() => {
    const unsubscribe = onlineManager.subscribe((online) => {
      setIsOnline(online);
      Animated.timing(slideAnim, {
        toValue: online ? -50 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    return () => unsubscribe();
  }, [slideAnim]);

  if (isOnline) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.warningSoft,
          borderBottomColor: theme.colors.border,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={14} color={theme.colors.warning} />
      <Text variant="caption" style={{ color: theme.colors.warning, fontWeight: '600' }}>
        You're offline
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
```

---

### Task 19: Mount OfflineBanner in root layout

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add import**

In `app/_layout.tsx`, add:

```typescript
import { OfflineBanner } from '@/components/OfflineBanner';
```

- [ ] **Step 2: Add OfflineBanner above Stack in AuthGate**

Change the `AuthGate` return from:

```tsx
  return (
    <Stack screenOptions={{ headerShown: false }}>
```

to:

```tsx
  return (
    <>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
```

And change the closing from:

```tsx
    </Stack>
  );
```

to:

```tsx
    </Stack>
    </>
  );
```

Also add the `View` import — actually, we're using a Fragment, not a View. Add the Fragment import. Since we're using `<>`, no import is needed.

---

### Task 20: Add global mutation error handling

**Files:**
- Modify: `src/lib/queryClient.ts`

- [ ] **Step 1: Add MutationCache with global error handler**

Replace the entire file content of `src/lib/queryClient.ts`:

```typescript
import { Alert } from 'react-native';
import { MutationCache, QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Only show alert if the mutation doesn't have its own onError handler
      if (!mutation.options.onError) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong');
      }
    },
  }),
});
```

---

### Task 21: Verify the app compiles

- [ ] **Step 1: Run TypeScript check**

Run: `cd /Users/mustafahasan/Desktop/Code/Jim && npx tsc --noEmit`

Expected: No type errors. If there are errors, fix them before proceeding.

- [ ] **Step 2: Start the app and verify**

Run: `npx expo start`

Manually verify:
1. Today screen shows skeletons briefly on first load, then data
2. History screen shows skeletons briefly on first load
3. Templates screen shows skeleton cards during loading
4. Progress screen shows skeleton metrics + spinner for charts
5. Profile screen shows spinner for stats
6. Pull down on any tab — all data refreshes
7. Start a workout, toggle a set complete — feel light haptic
8. Rest timer starts — feel medium haptic
9. Add notes to a workout, finish — feel success haptic, notes saved
10. View the saved workout in history — notes visible
11. Toggle airplane mode — "You're offline" banner appears
12. Toggle airplane mode off — banner disappears
