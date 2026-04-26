export type WorkoutSet = {
  id: string;
  weight: number | null;
  reps: number | null;
  isWarmup: boolean;
  completed: boolean;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  name: string;
  primaryMuscle: string | null;
  equipment: string | null;
  sets: WorkoutSet[];
};

export type ActiveWorkout = {
  startedAt: string;
  exercises: WorkoutExercise[];
};

export type Exercise = {
  id: string;
  user_id: string | null;
  name: string;
  primary_muscle: string | null;
  equipment: string | null;
  is_custom: boolean;
  created_at: string;
};

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
