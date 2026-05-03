import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MetricTile } from '@/components/MetricTile';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { WorkoutDetailExerciseCard } from '@/components/workout/WorkoutDetailExerciseCard';
import { useWorkoutById } from '@/hooks/useWorkoutById';
import { useUpdateWorkout, type WorkoutUpdatePayload } from '@/hooks/useUpdateWorkout';
import { useTheme } from '@/theme';
import type { WorkoutHistory, WorkoutHistorySet } from '@/hooks/useRecentWorkouts';

type EditState = {
  notes: string;
  // Working copy of all sets (modified or untouched), keyed by stable client id.
  // For original sets, clientId == server id. For inserted sets, clientId starts with "new-".
  sets: Array<{
    clientId: string;
    serverId: string | null; // null for inserted sets
    exercise_id: string;
    exercise_name: string;
    primary_muscle: string | null;
    weight: number | null;
    reps: number | null;
    is_warmup: boolean;
  }>;
};

function buildEditState(workout: WorkoutHistory): EditState {
  return {
    notes: workout.notes ?? '',
    sets: workout.sets.map((s) => ({
      clientId: s.id,
      serverId: s.id,
      exercise_id: s.exercise_id,
      exercise_name: s.exercise_name,
      primary_muscle: s.primary_muscle,
      weight: s.weight,
      reps: s.reps,
      is_warmup: s.is_warmup,
    })),
  };
}

function isDirty(workout: WorkoutHistory, edit: EditState): boolean {
  if ((workout.notes ?? '') !== edit.notes) return true;
  if (workout.sets.length !== edit.sets.filter((s) => s.serverId !== null).length) return true;
  if (edit.sets.some((s) => s.serverId === null)) return true;
  for (const original of workout.sets) {
    const current = edit.sets.find((s) => s.serverId === original.id);
    if (!current) return true; // deleted
    if (
      current.weight !== original.weight ||
      current.reps !== original.reps ||
      current.is_warmup !== original.is_warmup
    ) {
      return true;
    }
  }
  return false;
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

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
}

function groupByExercise(sets: WorkoutHistorySet[]) {
  const order: string[] = [];
  const groups = new Map<string, { name: string; muscle: string | null; sets: WorkoutHistorySet[] }>();
  for (const s of sets) {
    if (!groups.has(s.exercise_id)) {
      order.push(s.exercise_id);
      groups.set(s.exercise_id, { name: s.exercise_name, muscle: s.primary_muscle, sets: [] });
    }
    groups.get(s.exercise_id)!.sets.push(s);
  }
  return order.map((id) => ({ exerciseId: id, ...groups.get(id)! }));
}

export default function WorkoutDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: workout, isLoading, error } = useWorkoutById(id);
  const updateMutation = useUpdateWorkout();

  const [mode, setMode] = useState<'read' | 'edit'>('read');
  const [edit, setEdit] = useState<EditState | null>(null);

  useEffect(() => {
    if (mode === 'edit' && workout && edit === null) {
      setEdit(buildEditState(workout));
    }
    if (mode === 'read') {
      setEdit(null);
    }
  }, [mode, workout, edit]);

  const dirty = mode === 'edit' && workout && edit ? isDirty(workout, edit) : false;

  const handleStartEdit = () => {
    if (!workout) return;
    setEdit(buildEditState(workout));
    setMode('edit');
  };

  const handleCancel = () => {
    if (dirty) {
      Alert.alert('Discard changes?', 'Your edits will be lost.', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setEdit(null);
            setMode('read');
          },
        },
      ]);
    } else {
      setEdit(null);
      setMode('read');
    }
  };

  const handleSave = () => {
    if (!workout || !edit || !dirty) return;

    const originalSetsById = new Map(workout.sets.map((s) => [s.id, s]));
    const setsToUpdate: WorkoutUpdatePayload['setsToUpdate'] = [];
    const keptServerIds = new Set<string>();
    const affected = new Set<string>();

    for (const s of edit.sets) {
      if (s.serverId) {
        keptServerIds.add(s.serverId);
        const orig = originalSetsById.get(s.serverId);
        if (
          orig &&
          (orig.weight !== s.weight || orig.reps !== s.reps || orig.is_warmup !== s.is_warmup)
        ) {
          setsToUpdate.push({
            id: s.serverId,
            weight: s.weight,
            reps: s.reps,
            is_warmup: s.is_warmup,
          });
          affected.add(s.exercise_id);
        }
      } else {
        affected.add(s.exercise_id);
      }
    }

    const setsToDelete: string[] = [];
    for (const original of workout.sets) {
      if (!keptServerIds.has(original.id)) {
        setsToDelete.push(original.id);
        affected.add(original.exercise_id);
      }
    }

    const setsToInsert: WorkoutUpdatePayload['setsToInsert'] = [];
    const perExerciseCounters = new Map<string, number>();
    for (const s of edit.sets) {
      const next = (perExerciseCounters.get(s.exercise_id) ?? 0) + 1;
      perExerciseCounters.set(s.exercise_id, next);
      if (!s.serverId) {
        setsToInsert.push({
          exercise_id: s.exercise_id,
          weight: s.weight,
          reps: s.reps,
          is_warmup: s.is_warmup,
          set_number: next,
        });
      }
    }

    const payload: WorkoutUpdatePayload = {
      workoutId: workout.id,
      notes: edit.notes.trim().length > 0 ? edit.notes : null,
      setsToUpdate,
      setsToDelete,
      setsToInsert,
      affectedExerciseIds: [...affected],
      workoutEndedAt: workout.ended_at,
    };

    updateMutation.mutate(payload, {
      onSuccess: () => {
        setEdit(null);
        setMode('read');
      },
      onError: (err: any) => {
        Alert.alert('Save failed', err?.message ?? 'Could not save changes. Try again.');
      },
    });
  };

  return (
    <Screen edges={['top']} padded={false}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        {mode === 'read' ? (
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={theme.colors.accent} />
          </Pressable>
        ) : (
          <Pressable onPress={handleCancel} hitSlop={8}>
            <Text variant="bodyStrong" style={{ color: theme.colors.danger }}>
              Cancel
            </Text>
          </Pressable>
        )}
        <Text variant="bodyStrong">Workout</Text>
        {mode === 'read' ? (
          <Pressable onPress={handleStartEdit} hitSlop={8} disabled={!workout}>
            <Text
              variant="bodyStrong"
              style={{ color: workout ? theme.colors.accent : theme.colors.textMuted }}
            >
              Edit
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={handleSave} hitSlop={8} disabled={!dirty || updateMutation.isPending}>
            <Text
              variant="bodyStrong"
              style={{ color: dirty && !updateMutation.isPending ? theme.colors.accent : theme.colors.textMuted }}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
          gap: theme.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.md,
                    gap: theme.spacing.sm,
                  }}
                >
                  <Skeleton width={48} height={22} />
                  <Skeleton width={64} height={12} />
                </View>
              ))}
            </View>
            {[0, 1].map((i) => (
              <View
                key={i}
                style={{
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.lg,
                  gap: theme.spacing.md,
                }}
              >
                <Skeleton width="60%" height={16} />
                <Skeleton width="100%" height={36} />
                <Skeleton width="100%" height={36} />
              </View>
            ))}
          </>
        ) : error ? (
          <Card muted>
            <EmptyState
              icon="warning-outline"
              title="Couldn't load workout"
              description="Something went wrong. Try again."
            />
          </Card>
        ) : !workout ? (
          <Card muted>
            <EmptyState
              icon="help-circle-outline"
              title="Workout not found"
              description="This workout no longer exists."
            />
          </Card>
        ) : mode === 'edit' && edit ? (
          <EditModeBody workout={workout} edit={edit} setEdit={setEdit} />
        ) : (
          <ReadModeBody workout={workout} />
        )}
      </ScrollView>
    </Screen>
  );
}

function ReadModeBody({ workout }: { workout: WorkoutHistory }) {
  const theme = useTheme();

  let totalSets = 0;
  let totalVolume = 0;
  for (const s of workout.sets) {
    totalSets++;
    totalVolume += (s.weight ?? 0) * (s.reps ?? 0);
  }

  const groups = groupByExercise(workout.sets);

  return (
    <>
      <Text variant="caption" tone="muted">
        {formatDateTime(workout.started_at)}
      </Text>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <MetricTile
          label="Duration"
          value={formatDuration(workout.started_at, workout.ended_at)}
          icon="time-outline"
        />
        <MetricTile
          label="Sets"
          value={String(totalSets)}
          icon="checkmark-circle-outline"
          tone="accent"
        />
        <MetricTile
          label="Volume"
          value={formatVolume(totalVolume)}
          icon="barbell-outline"
          tone="success"
        />
      </View>

      {workout.notes ? (
        <Card muted>
          <Text variant="body">{workout.notes}</Text>
        </Card>
      ) : null}

      <View style={{ gap: theme.spacing.md }}>
        {groups.map((g) => (
          <WorkoutDetailExerciseCard
            key={g.exerciseId}
            mode="read"
            exerciseName={g.name}
            primaryMuscle={g.muscle}
            sets={g.sets.map((s) => ({
              clientId: s.id,
              weight: s.weight,
              reps: s.reps,
              is_warmup: s.is_warmup,
            }))}
          />
        ))}
      </View>
    </>
  );
}

function EditModeBody({
  workout,
  edit,
  setEdit,
}: {
  workout: WorkoutHistory;
  edit: EditState;
  setEdit: (next: EditState) => void;
}) {
  const theme = useTheme();

  let totalSets = 0;
  let totalVolume = 0;
  for (const s of edit.sets) {
    totalSets++;
    totalVolume += (s.weight ?? 0) * (s.reps ?? 0);
  }

  const order: string[] = [];
  const groups = new Map<
    string,
    { name: string; muscle: string | null; sets: typeof edit.sets }
  >();
  for (const s of edit.sets) {
    if (!groups.has(s.exercise_id)) {
      order.push(s.exercise_id);
      groups.set(s.exercise_id, { name: s.exercise_name, muscle: s.primary_muscle, sets: [] });
    }
    groups.get(s.exercise_id)!.sets.push(s);
  }

  const updateSet = (
    clientId: string,
    updates: { weight?: number | null; reps?: number | null; is_warmup?: boolean },
  ) => {
    setEdit({
      ...edit,
      sets: edit.sets.map((s) => (s.clientId === clientId ? { ...s, ...updates } : s)),
    });
  };

  const deleteSet = (clientId: string) => {
    setEdit({ ...edit, sets: edit.sets.filter((s) => s.clientId !== clientId) });
  };

  const addSet = (exerciseId: string) => {
    const exerciseSets = edit.sets.filter((s) => s.exercise_id === exerciseId);
    const last = exerciseSets[exerciseSets.length - 1];
    const meta = last ?? edit.sets.find((s) => s.exercise_id === exerciseId)!;
    setEdit({
      ...edit,
      sets: [
        ...edit.sets,
        {
          clientId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          serverId: null,
          exercise_id: meta.exercise_id,
          exercise_name: meta.exercise_name,
          primary_muscle: meta.primary_muscle,
          weight: last?.weight ?? null,
          reps: last?.reps ?? null,
          is_warmup: false,
        },
      ],
    });
  };

  return (
    <>
      <Text variant="caption" tone="muted">
        {formatDateTime(workout.started_at)}
      </Text>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <MetricTile
          label="Duration"
          value={formatDuration(workout.started_at, workout.ended_at)}
          icon="time-outline"
        />
        <MetricTile label="Sets" value={String(totalSets)} icon="checkmark-circle-outline" tone="accent" />
        <MetricTile label="Volume" value={formatVolume(totalVolume)} icon="barbell-outline" tone="success" />
      </View>

      <Card muted>
        <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>
          Notes
        </Text>
        <TextField
          value={edit.notes}
          onChangeText={(text) => setEdit({ ...edit, notes: text })}
          placeholder="How did this workout feel?"
          multiline
        />
      </Card>

      <View style={{ gap: theme.spacing.md }}>
        {order.map((exerciseId) => {
          const g = groups.get(exerciseId)!;
          return (
            <WorkoutDetailExerciseCard
              key={exerciseId}
              mode="edit"
              exerciseName={g.name}
              primaryMuscle={g.muscle}
              sets={g.sets}
              onChangeSet={updateSet}
              onDeleteSet={deleteSet}
              onAddSet={() => addSet(exerciseId)}
            />
          );
        })}
      </View>
    </>
  );
}
