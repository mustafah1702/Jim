import { create } from 'zustand';
import type { ActiveWorkout, WorkoutSet } from '@/types/workout';

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
  discardWorkout: () => void;

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

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workout: null,
  restEndAt: null,
  restDuration: 90,

  startWorkout: () =>
    set({
      workout: { startedAt: new Date().toISOString(), exercises: [] },
      restEndAt: null,
    }),

  discardWorkout: () => set({ workout: null, restEndAt: null }),

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
    const d = duration ?? get().restDuration;
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
}));
