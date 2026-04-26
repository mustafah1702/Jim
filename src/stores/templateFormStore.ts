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
