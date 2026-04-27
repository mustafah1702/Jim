# Sprint 3: Quality of Life — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four quality-of-life features: delete workout history (swipe-to-delete), keyboard handling improvements (auto-focus/tab-through), workout timer persistence (AsyncStorage), and better empty states.

**Architecture:** Each feature is independent and touches different files. Delete workout uses `react-native-gesture-handler`'s `Swipeable` with a React Query delete mutation. Keyboard handling adds ref forwarding through `ExerciseCard` → `SetRow` with `onSubmitEditing`. Workout persistence uses Zustand's `persist` middleware backed by AsyncStorage with a recovery prompt in the root layout. Empty states are copy-only changes.

**Tech Stack:** React Native, Expo 54, Zustand (persist middleware), React Query, AsyncStorage, react-native-gesture-handler (new dependency)

---

## File Map

**New files:**
- `src/hooks/useDeleteWorkout.ts` — React Query mutation for deleting workouts

**Modified files:**
- `src/components/workout/WorkoutHistoryCard.tsx` — wrap in Swipeable for swipe-to-delete
- `src/components/workout/SetRow.tsx` — accept refs, wire up onSubmitEditing
- `src/components/workout/ExerciseCard.tsx` — create/manage ref arrays, pass to SetRow
- `src/components/template/TemplateSetRow.tsx` — accept refs, wire up onSubmitEditing
- `src/components/template/TemplateExerciseCard.tsx` — create/manage ref arrays, pass to TemplateSetRow
- `src/stores/workoutStore.ts` — add Zustand persist middleware
- `app/_layout.tsx` — add workout recovery prompt after hydration
- `app/(tabs)/profile.tsx` — clear persisted workout on sign-out
- `app/(tabs)/index.tsx` — update empty state copy
- `app/(tabs)/history.tsx` — update empty state copy
- `app/(tabs)/templates.tsx` — update empty state copy
- `app/(tabs)/progress.tsx` — update empty state copy
- `app/workout.tsx` — update empty state copy

---

## Task 1: Install react-native-gesture-handler

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the dependency**

```bash
cd /Users/mustafahasan/Desktop/Code/Jim && npx expo install react-native-gesture-handler
```

- [ ] **Step 2: Verify installation**

```bash
node -e "console.log(require('react-native-gesture-handler/package.json').version)"
```

Expected: prints a version number (e.g., `2.x.x`)

- [ ] **Step 3: Add GestureHandlerRootView to root layout**

In `app/_layout.tsx`, add the import and wrap the app:

```typescript
import { GestureHandlerRootView } from 'react-native-gesture-handler';
```

Change the return in `RootLayout` from:

```typescript
return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <AuthGate />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
```

To:

```typescript
return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <AuthGate />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
```

---

## Task 2: Create useDeleteWorkout hook

**Files:**
- Create: `src/hooks/useDeleteWorkout.ts`

- [ ] **Step 1: Create the hook file**

Create `src/hooks/useDeleteWorkout.ts`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutId: string) => {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
```

- [ ] **Step 2: Verify the file compiles**

```bash
cd /Users/mustafahasan/Desktop/Code/Jim && npx tsc --noEmit src/hooks/useDeleteWorkout.ts 2>&1 | head -20
```

Expected: no errors (or only unrelated warnings)

---

## Task 3: Add swipe-to-delete to WorkoutHistoryCard

**Files:**
- Modify: `src/components/workout/WorkoutHistoryCard.tsx`

- [ ] **Step 1: Add Swipeable with delete action**

Replace the entire `WorkoutHistoryCard.tsx` with:

```typescript
import { useRef } from 'react';
import { Alert, Animated, Pressable, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { useDeleteWorkout } from '@/hooks/useDeleteWorkout';
import { useTheme } from '@/theme';
import type { WorkoutHistory } from '@/hooks/useRecentWorkouts';

type WorkoutHistoryCardProps = {
  workout: WorkoutHistory;
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return '--';
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `${hours}h ${rem}m`;
}

function formatVolume(volume: number): string {
  if (volume === 0) return '0';
  if (volume < 1000) return volume.toFixed(0);
  if (volume < 10000) return (volume / 1000).toFixed(1) + 'k';
  return Math.round(volume / 1000) + 'k';
}

export function WorkoutHistoryCard({ workout }: WorkoutHistoryCardProps) {
  const theme = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const deleteMutation = useDeleteWorkout();

  // Group sets by exercise
  const exerciseMap = new Map<string, string>();
  let totalSets = 0;
  let totalVolume = 0;

  for (const s of workout.sets) {
    if (!exerciseMap.has(s.exercise_id)) {
      exerciseMap.set(s.exercise_id, s.exercise_name);
    }
    totalSets++;
    totalVolume += (s.weight ?? 0) * (s.reps ?? 0);
  }

  const exerciseNames = [...exerciseMap.values()];
  const displayNames = exerciseNames.slice(0, 3);
  const remaining = exerciseNames.length - displayNames.length;

  const handleDelete = () => {
    swipeableRef.current?.close();
    Alert.alert('Delete Workout?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteMutation.mutate(workout.id);
        },
      },
    ]);
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Pressable
        onPress={handleDelete}
        style={[
          styles.deleteAction,
          {
            backgroundColor: theme.colors.danger,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center', gap: 2 }}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text variant="caption" style={{ color: '#fff', fontWeight: '600' }}>
            Delete
          </Text>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <Card style={{ gap: theme.spacing.md }}>
        <View style={styles.topRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {displayNames.join(', ')}
            </Text>
            {remaining > 0 && (
              <Text variant="caption" tone="muted">
                +{remaining} more
              </Text>
            )}
          </View>
          <Text variant="caption" tone="muted">
            {timeAgo(workout.started_at)}
          </Text>
        </View>

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
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginLeft: 8,
  },
});
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/mustafahasan/Desktop/Code/Jim && npx tsc --noEmit 2>&1 | head -20
```

Expected: no type errors

- [ ] **Step 3: Test manually**

Open the app, go to History tab, swipe left on a workout card. Verify:
- Red "Delete" button appears on swipe
- Tapping it shows confirmation alert
- Confirming deletes the workout and card disappears
- Also test on the Today screen's recent workouts section

---

## Task 4: Add keyboard auto-focus to SetRow

**Files:**
- Modify: `src/components/workout/SetRow.tsx`

- [ ] **Step 1: Add ref forwarding and onSubmitEditing**

Replace the entire `SetRow.tsx` with:

```typescript
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { WorkoutSet } from '@/types/workout';

export type SetRowRef = {
  focusWeight: () => void;
  focusReps: () => void;
};

type SetRowProps = {
  set: WorkoutSet;
  index: number;
  isPR: boolean;
  isLastSet: boolean;
  onUpdate: (updates: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'isWarmup' | 'completed'>>) => void;
  onRemove: () => void;
  onSubmitLastField: () => void;
};

export const SetRow = forwardRef<SetRowRef, SetRowProps>(function SetRow(
  { set, index, isPR, isLastSet, onUpdate, onRemove, onSubmitLastField },
  ref,
) {
  const theme = useTheme();
  const weightRef = useRef<TextInput>(null);
  const repsRef = useRef<TextInput>(null);
  const [weightText, setWeightText] = useState(set.weight != null ? String(set.weight) : '');
  const [repsText, setRepsText] = useState(set.reps != null ? String(set.reps) : '');

  const prevCompletedRef = useRef(set.completed);

  useImperativeHandle(ref, () => ({
    focusWeight: () => weightRef.current?.focus(),
    focusReps: () => repsRef.current?.focus(),
  }));

  useEffect(() => {
    if (isPR && set.completed && !prevCompletedRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    prevCompletedRef.current = set.completed;
  }, [set.completed, isPR]);

  const handleWeightBlur = () => {
    const val = parseFloat(weightText);
    onUpdate({ weight: isNaN(val) ? null : val });
  };

  const handleRepsBlur = () => {
    const val = parseInt(repsText, 10);
    onUpdate({ reps: isNaN(val) ? null : val });
  };

  const handleLongPress = () => {
    Alert.alert('Delete Set', 'Remove this set?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onRemove },
    ]);
  };

  const toggleWarmup = () => onUpdate({ isWarmup: !set.isWarmup });

  const toggleCompleted = () => {
    if (!set.completed) {
      const w = parseFloat(weightText);
      const r = parseInt(repsText, 10);
      if (!isNaN(w)) onUpdate({ weight: w });
      if (!isNaN(r)) onUpdate({ reps: r });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onUpdate({ completed: !set.completed });
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      style={[
        styles.row,
        {
          backgroundColor: set.completed
            ? theme.colors.success + '18'
            : theme.colors.surfaceElevated,
          borderColor: set.completed ? theme.colors.success : theme.colors.border,
          borderRadius: theme.radius.sm,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.sm,
        },
      ]}
    >
      <Pressable
        onPress={toggleWarmup}
        style={[
          styles.setLabel,
          {
            backgroundColor: set.isWarmup ? theme.colors.accentSoft : theme.colors.surfaceMuted,
            borderRadius: theme.radius.sm,
          },
        ]}
      >
        <Text
          variant="caption"
          tone={set.isWarmup ? 'accent' : 'muted'}
          style={{ fontWeight: '600', textAlign: 'center' }}
        >
          {set.isWarmup ? 'W' : index + 1}
        </Text>
      </Pressable>

      <TextInput
        ref={weightRef}
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
        onSubmitEditing={() => repsRef.current?.focus()}
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
        ref={repsRef}
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
        onSubmitEditing={onSubmitLastField}
        placeholder="reps"
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.accent}
        keyboardType="number-pad"
        returnKeyType={isLastSet ? 'done' : 'next'}
      />

      {isPR && (
        <Ionicons name="trophy" size={20} color={theme.colors.warning} />
      )}

      <Pressable onPress={toggleCompleted} hitSlop={8}>
        <Ionicons
          name={set.completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={26}
          color={set.completed ? theme.colors.success : theme.colors.textMuted}
        />
      </Pressable>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
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

Key changes from original:
- `forwardRef` with `useImperativeHandle` exposing `focusWeight()` and `focusReps()`
- Weight `onSubmitEditing` → focuses reps field in same row
- Reps `onSubmitEditing` → calls `onSubmitLastField` (parent decides: focus next row or dismiss)
- New props: `isLastSet` (controls returnKeyType), `onSubmitLastField` (callback for reps submit)

---

## Task 5: Wire up ref management in ExerciseCard

**Files:**
- Modify: `src/components/workout/ExerciseCard.tsx`

- [ ] **Step 1: Add ref array and pass to SetRow**

Replace the entire `ExerciseCard.tsx` with:

```typescript
import { useRef, useEffect, createRef } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { Text } from '@/components/Text';
import { SetRow, type SetRowRef } from '@/components/workout/SetRow';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTheme } from '@/theme';
import type { WorkoutExercise } from '@/types/workout';

type ExerciseCardProps = {
  exercise: WorkoutExercise;
  checkPR: (exerciseId: string, weight: number | null, reps: number | null) => { isWeightPR: boolean; isVolumePR: boolean };
};

export function ExerciseCard({ exercise, checkPR }: ExerciseCardProps) {
  const theme = useTheme();
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer);

  const setRefs = useRef<React.RefObject<SetRowRef | null>[]>([]);

  // Keep refs array in sync with sets count
  while (setRefs.current.length < exercise.sets.length) {
    setRefs.current.push(createRef<SetRowRef>());
  }
  if (setRefs.current.length > exercise.sets.length) {
    setRefs.current.length = exercise.sets.length;
  }

  const prevSetsCount = useRef(exercise.sets.length);

  useEffect(() => {
    // Auto-focus new set when added
    if (exercise.sets.length > prevSetsCount.current) {
      const lastRef = setRefs.current[exercise.sets.length - 1];
      setTimeout(() => lastRef?.current?.focusWeight(), 50);
    }
    prevSetsCount.current = exercise.sets.length;
  }, [exercise.sets.length]);

  const handleOverflowMenu = () => {
    Alert.alert(exercise.name, undefined, [
      {
        text: 'Remove Exercise',
        style: 'destructive',
        onPress: () => removeExercise(exercise.id),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

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
        <IconButton icon="ellipsis-horizontal" size={34} variant="plain" onPress={handleOverflowMenu} />
      </View>

      <View
        style={[
          styles.columnHeaders,
          {
            paddingHorizontal: theme.spacing.sm,
          },
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
        <View style={{ width: 26 }} />
      </View>

      {exercise.sets.map((set, i) => {
        const pr =
          set.completed && !set.isWarmup
            ? checkPR(exercise.exerciseId, set.weight, set.reps)
            : { isWeightPR: false, isVolumePR: false };

        const isLastSet = i === exercise.sets.length - 1;

        return (
          <SetRow
            key={set.id}
            ref={setRefs.current[i]}
            set={set}
            index={i}
            isPR={pr.isWeightPR || pr.isVolumePR}
            isLastSet={isLastSet}
            onUpdate={(updates) => {
              updateSet(exercise.id, set.id, updates);
              if (updates.completed === true) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                startRestTimer();
              }
            }}
            onRemove={() => removeSet(exercise.id, set.id)}
            onSubmitLastField={() => {
              if (!isLastSet) {
                setRefs.current[i + 1]?.current?.focusWeight();
              }
              // Last set in exercise: keyboard dismisses naturally
            }}
          />
        );
      })}

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

Key changes from original:
- `setRefs` array kept in sync with sets count
- Auto-focus new set's weight field via `useEffect` on `exercise.sets.length`
- `onSubmitLastField` callback chains to the next set's weight field, or dismisses on last set
- Passes new `isLastSet` and `onSubmitLastField` props to `SetRow`

---

## Task 6: Add keyboard auto-focus to TemplateSetRow and TemplateExerciseCard

**Files:**
- Modify: `src/components/template/TemplateSetRow.tsx`
- Modify: `src/components/template/TemplateExerciseCard.tsx`

- [ ] **Step 1: Update TemplateSetRow with ref forwarding**

Replace `src/components/template/TemplateSetRow.tsx` with:

```typescript
import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import type { TemplateSet } from '@/types/workout';

export type TemplateSetRowRef = {
  focusWeight: () => void;
  focusReps: () => void;
};

type TemplateSetRowProps = {
  set: TemplateSet;
  index: number;
  isLastSet: boolean;
  onUpdate: (updates: Partial<Pick<TemplateSet, 'targetReps' | 'targetWeight'>>) => void;
  onRemove: () => void;
  onSubmitLastField: () => void;
};

export const TemplateSetRow = forwardRef<TemplateSetRowRef, TemplateSetRowProps>(
  function TemplateSetRow({ set, index, isLastSet, onUpdate, onRemove, onSubmitLastField }, ref) {
    const theme = useTheme();
    const weightRef = useRef<TextInput>(null);
    const repsRef = useRef<TextInput>(null);
    const [weightText, setWeightText] = useState(
      set.targetWeight != null ? String(set.targetWeight) : '',
    );
    const [repsText, setRepsText] = useState(
      set.targetReps != null ? String(set.targetReps) : '',
    );

    useImperativeHandle(ref, () => ({
      focusWeight: () => weightRef.current?.focus(),
      focusReps: () => repsRef.current?.focus(),
    }));

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
          ref={weightRef}
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
          onSubmitEditing={() => repsRef.current?.focus()}
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
          ref={repsRef}
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
          onSubmitEditing={onSubmitLastField}
          placeholder="reps"
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.accent}
          keyboardType="number-pad"
          returnKeyType={isLastSet ? 'done' : 'next'}
        />

        <Pressable onPress={onRemove} hitSlop={8}>
          <Ionicons name="close-circle" size={22} color={theme.colors.danger} />
        </Pressable>
      </View>
    );
  },
);

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

- [ ] **Step 2: Update TemplateExerciseCard with ref management**

Replace `src/components/template/TemplateExerciseCard.tsx` with:

```typescript
import { useRef, useEffect, createRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { TemplateSetRow, type TemplateSetRowRef } from '@/components/template/TemplateSetRow';
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

  const setRefs = useRef<React.RefObject<TemplateSetRowRef | null>[]>([]);

  while (setRefs.current.length < exercise.sets.length) {
    setRefs.current.push(createRef<TemplateSetRowRef>());
  }
  if (setRefs.current.length > exercise.sets.length) {
    setRefs.current.length = exercise.sets.length;
  }

  const prevSetsCount = useRef(exercise.sets.length);

  useEffect(() => {
    if (exercise.sets.length > prevSetsCount.current) {
      const lastRef = setRefs.current[exercise.sets.length - 1];
      setTimeout(() => lastRef?.current?.focusWeight(), 50);
    }
    prevSetsCount.current = exercise.sets.length;
  }, [exercise.sets.length]);

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

      {exercise.sets.map((set, i) => {
        const isLastSet = i === exercise.sets.length - 1;

        return (
          <TemplateSetRow
            key={set.id}
            ref={setRefs.current[i]}
            set={set}
            index={i}
            isLastSet={isLastSet}
            onUpdate={(updates) => updateSet(exercise.id, set.id, updates)}
            onRemove={() => removeSet(exercise.id, set.id)}
            onSubmitLastField={() => {
              if (!isLastSet) {
                setRefs.current[i + 1]?.current?.focusWeight();
              }
            }}
          />
        );
      })}

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

- [ ] **Step 2: Verify compilation**

```bash
cd /Users/mustafahasan/Desktop/Code/Jim && npx tsc --noEmit 2>&1 | head -20
```

Expected: no type errors

---

## Task 7: Add Zustand persist middleware to workoutStore

**Files:**
- Modify: `src/stores/workoutStore.ts`

- [ ] **Step 1: Add persist middleware**

Replace the entire `src/stores/workoutStore.ts` with:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActiveWorkout, Template, WorkoutSet } from '@/types/workout';
import { usePreferencesStore } from '@/stores/preferencesStore';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function createEmptySet(): WorkoutSet {
  return { id: uuid(), weight: null, reps: null, isWarmup: false, completed: false };
}

type WorkoutState = {
  workout: ActiveWorkout | null;

  // Rest timer
  restEndAt: string | null;
  restDuration: number;

  // Lifecycle
  startWorkout: () => void;
  startFromTemplate: (template: Template) => void;
  discardWorkout: () => void;
  setNotes: (notes: string) => void;

  // Exercises
  addExercise: (exercise: {
    id: string;
    name: string;
    primary_muscle: string | null;
    equipment: string | null;
  }) => void;
  removeExercise: (exerciseClientId: string) => void;

  // Sets
  addSet: (exerciseClientId: string) => void;
  removeSet: (exerciseClientId: string, setId: string) => void;
  updateSet: (
    exerciseClientId: string,
    setId: string,
    updates: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'isWarmup' | 'completed'>>,
  ) => void;

  // Rest timer actions
  startRestTimer: (duration?: number) => void;
  skipRestTimer: () => void;

  // Computed
  getTotalVolume: () => number;
  getTotalSets: () => number;
};

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      workout: null,
      restEndAt: null,
      restDuration: 90,

      startWorkout: () =>
        set({
          workout: { startedAt: new Date().toISOString(), notes: null, exercises: [] },
          restEndAt: null,
        }),

      startFromTemplate: (template) =>
        set({
          workout: {
            startedAt: new Date().toISOString(),
            notes: null,
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

      discardWorkout: () => set({ workout: null, restEndAt: null }),

      setNotes: (notes) =>
        set((state) => {
          if (!state.workout) return state;
          return { workout: { ...state.workout, notes } };
        }),

      addExercise: (exercise) =>
        set((state) => {
          if (!state.workout) return state;
          return {
            workout: {
              ...state.workout,
              exercises: [
                ...state.workout.exercises,
                {
                  id: uuid(),
                  exerciseId: exercise.id,
                  name: exercise.name,
                  primaryMuscle: exercise.primary_muscle,
                  equipment: exercise.equipment,
                  sets: [createEmptySet()],
                },
              ],
            },
          };
        }),

      removeExercise: (exerciseClientId) =>
        set((state) => {
          if (!state.workout) return state;
          return {
            workout: {
              ...state.workout,
              exercises: state.workout.exercises.filter((e) => e.id !== exerciseClientId),
            },
          };
        }),

      addSet: (exerciseClientId) =>
        set((state) => {
          if (!state.workout) return state;
          return {
            workout: {
              ...state.workout,
              exercises: state.workout.exercises.map((e) => {
                if (e.id !== exerciseClientId) return e;
                const lastSet = e.sets[e.sets.length - 1];
                const newSet: WorkoutSet = lastSet
                  ? { id: uuid(), weight: lastSet.weight, reps: lastSet.reps, isWarmup: false, completed: false }
                  : createEmptySet();
                return { ...e, sets: [...e.sets, newSet] };
              }),
            },
          };
        }),

      removeSet: (exerciseClientId, setId) =>
        set((state) => {
          if (!state.workout) return state;
          return {
            workout: {
              ...state.workout,
              exercises: state.workout.exercises.map((e) => {
                if (e.id !== exerciseClientId) return e;
                return { ...e, sets: e.sets.filter((s) => s.id !== setId) };
              }),
            },
          };
        }),

      updateSet: (exerciseClientId, setId, updates) =>
        set((state) => {
          if (!state.workout) return state;
          return {
            workout: {
              ...state.workout,
              exercises: state.workout.exercises.map((e) => {
                if (e.id !== exerciseClientId) return e;
                return {
                  ...e,
                  sets: e.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)),
                };
              }),
            },
          };
        }),

      startRestTimer: (duration) => {
        const d = duration ?? usePreferencesStore.getState().restTimerSeconds;
        set({ restEndAt: new Date(Date.now() + d * 1000).toISOString() });
      },

      skipRestTimer: () => set({ restEndAt: null }),

      getTotalVolume: () => {
        const workout = get().workout;
        if (!workout) return 0;
        let total = 0;
        for (const ex of workout.exercises) {
          for (const s of ex.sets) {
            if (s.completed && s.weight && s.reps) {
              total += s.weight * s.reps;
            }
          }
        }
        return total;
      },

      getTotalSets: () => {
        const workout = get().workout;
        if (!workout) return 0;
        let count = 0;
        for (const ex of workout.exercises) {
          for (const s of ex.sets) {
            if (s.completed) count++;
          }
        }
        return count;
      },
    }),
    {
      name: 'jim-active-workout',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        workout: state.workout,
        restEndAt: state.restEndAt,
        restDuration: state.restDuration,
      }),
    },
  ),
);
```

Key changes from original:
- Wrapped `create` call with `persist(...)` middleware
- Added `createJSONStorage(() => AsyncStorage)` for storage backend
- Added `partialize` to only persist `workout`, `restEndAt`, `restDuration` (not functions)
- Store key: `"jim-active-workout"`

- [ ] **Step 2: Verify compilation**

```bash
cd /Users/mustafahasan/Desktop/Code/Jim && npx tsc --noEmit 2>&1 | head -20
```

Expected: no type errors

---

## Task 8: Add workout recovery prompt to root layout

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add recovery prompt logic**

Replace the entire `app/_layout.tsx` with:

```typescript
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Alert, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/lib/queryClient';
import { initAuth, useAuthStore } from '@/stores/authStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { OfflineBanner } from '@/components/OfflineBanner';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function formatTimeAgo(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return new Date(isoDate).toLocaleDateString();
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <AuthGate />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AuthGate() {
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const segments = useSegments();
  const router = useRouter();

  const splashHidden = useRef(false);
  const recoveryChecked = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync();
    }

    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, hydrated, segments, router]);

  // Workout recovery prompt
  useEffect(() => {
    if (!hydrated || !session || recoveryChecked.current) return;
    recoveryChecked.current = true;

    // Wait a tick for navigation to settle
    const timer = setTimeout(() => {
      const workout = useWorkoutStore.getState().workout;
      if (!workout) return;

      const ms = Date.now() - new Date(workout.startedAt).getTime();
      const hoursOld = ms / (1000 * 60 * 60);

      if (hoursOld >= 24) {
        Alert.alert(
          'Discard Old Workout?',
          `You have a workout from ${new Date(workout.startedAt).toLocaleDateString()} that was never finished.`,
          [
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => useWorkoutStore.getState().discardWorkout(),
            },
          ],
        );
      } else {
        Alert.alert(
          'Resume Workout?',
          `You have an unfinished workout from ${formatTimeAgo(workout.startedAt)}.`,
          [
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => useWorkoutStore.getState().discardWorkout(),
            },
            {
              text: 'Resume',
              onPress: () => router.push('/workout'),
            },
          ],
        );
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [hydrated, session, router]);

  return (
    <>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="workout"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen
          name="exercise-picker"
          options={{ presentation: 'modal', gestureEnabled: true }}
        />
        <Stack.Screen
          name="template-form"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
      </Stack>
    </>
  );
}
```

Key changes from original:
- Added `GestureHandlerRootView` wrapper (from Task 1)
- Added `formatTimeAgo` helper function
- Added workout recovery `useEffect` after hydration + session are ready
- `recoveryChecked` ref ensures the prompt only shows once per app launch
- 500ms delay to let navigation settle before showing the alert

---

## Task 9: Clear persisted workout on sign-out

**Files:**
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Import workout store and clear on sign-out**

In `app/(tabs)/profile.tsx`, add the import at the top (alongside existing imports):

```typescript
import { useWorkoutStore } from '@/stores/workoutStore';
```

Then change the `handleSignOut` function from:

```typescript
const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };
```

To:

```typescript
const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          useWorkoutStore.getState().discardWorkout();
          supabase.auth.signOut();
        },
      },
    ]);
  };
```

Also update `handleDeleteAccount` to clear workout before sign-out. Change:

```typescript
            await supabase.auth.signOut();
```

To:

```typescript
            useWorkoutStore.getState().discardWorkout();
            await supabase.auth.signOut();
```

---

## Task 10: Update empty state copy

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/history.tsx`
- Modify: `app/(tabs)/templates.tsx`
- Modify: `app/(tabs)/progress.tsx`
- Modify: `app/workout.tsx`

- [ ] **Step 1: Update Today screen empty state**

In `app/(tabs)/index.tsx`, change:

```typescript
                title="No workouts logged"
                description="Finished workouts will appear here with volume, sets, and duration."
```

To:

```typescript
                title="Ready to train?"
                description="Tap the button below to log your first workout, or create a template to get started faster."
```

- [ ] **Step 2: Update History screen empty state**

In `app/(tabs)/history.tsx`, change:

```typescript
                  title="No workout history yet"
                  description="Finish a workout and it will show up here with your exercises, sets, and totals."
```

To:

```typescript
                  title="Your workouts will show up here"
                  description="After you finish a workout, you'll see it here with your sets, volume, and duration."
```

- [ ] **Step 3: Update Templates screen empty state**

In `app/(tabs)/templates.tsx`, change:

```typescript
            title="No templates yet"
            description="Create a template to save your go-to exercises and start workouts faster."
```

To:

```typescript
            title="Save time with templates"
            description="Templates let you pre-build workouts so you can start training with one tap."
```

- [ ] **Step 4: Update Progress screen empty state**

In `app/(tabs)/progress.tsx`, change:

```typescript
              title="Progress charts are waiting"
              description="Complete workouts to unlock exercise trends, volume changes, and personal bests."
```

To:

```typescript
              title="Track your progress"
              description="Log a few workouts and you'll see volume trends, PRs, and muscle group breakdowns here."
```

- [ ] **Step 5: Update Workout screen empty state**

In `app/workout.tsx`, change:

```typescript
                title="Build your workout"
                description="Add your first exercise, then log weight and reps as you move."
```

To:

```typescript
                title="Add your first exercise"
                description="Tap 'Add Exercise' below to pick from 36+ exercises or create your own."
```

---

## Task 11: Final verification

- [ ] **Step 1: Type check the entire project**

```bash
cd /Users/mustafahasan/Desktop/Code/Jim && npx tsc --noEmit 2>&1 | tail -5
```

Expected: no type errors

- [ ] **Step 2: Start the dev server and verify**

```bash
cd /Users/mustafahasan/Desktop/Code/Jim && npx expo start
```

Manual verification checklist:
1. **Swipe-to-delete:** Go to History, swipe left on a workout card, see red Delete button, confirm deletion works
2. **Keyboard flow:** Start workout, add exercise, type weight → tap Next → reps focused. Tap Done → next set's weight focused. Last set Done → keyboard dismisses
3. **Persistence:** Start workout, add exercise, kill app, reopen → see "Resume Workout?" prompt. Resume navigates to workout screen with state intact. Discard clears everything.
4. **Stale workout:** (Hard to test naturally) Set device clock forward 25 hours, reopen → see "Discard Old Workout?" with no Resume option
5. **Sign-out clears workout:** Start workout, sign out, sign back in → no recovery prompt
6. **Empty states:** Sign up fresh account, check all 5 screens show updated copy
7. **Template keyboard:** Create template, add exercise, verify tab-through works in template set rows
