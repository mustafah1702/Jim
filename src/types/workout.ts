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
