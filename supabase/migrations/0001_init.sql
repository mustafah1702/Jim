-- =============================================================================
-- Jim — Initial schema (v1)
-- Run via Supabase SQL editor or `supabase db push` once Supabase CLI is set up.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles: 1:1 with auth.users
-- -----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "users read own profile" on profiles
  for select using (auth.uid() = id);
create policy "users insert own profile" on profiles
  for insert with check (auth.uid() = id);
create policy "users update own profile" on profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- exercises: pre-seeded library + user-created custom
-- user_id IS NULL  -> global/seeded exercise visible to all
-- user_id = auth.uid() -> custom exercise owned by user
-- -----------------------------------------------------------------------------
create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  primary_muscle text,
  equipment text,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

create index exercises_user_id_idx on exercises (user_id);
create index exercises_name_idx on exercises (name);

alter table exercises enable row level security;

create policy "anyone reads global or own exercises" on exercises
  for select using (user_id is null or auth.uid() = user_id);
create policy "users insert own custom exercises" on exercises
  for insert with check (auth.uid() = user_id and is_custom = true);
create policy "users update own custom exercises" on exercises
  for update using (auth.uid() = user_id);
create policy "users delete own custom exercises" on exercises
  for delete using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- templates: reusable workout templates / programs
-- -----------------------------------------------------------------------------
create table templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index templates_user_id_idx on templates (user_id);

alter table templates enable row level security;

create policy "users read own templates" on templates
  for select using (auth.uid() = user_id);
create policy "users insert own templates" on templates
  for insert with check (auth.uid() = user_id);
create policy "users update own templates" on templates
  for update using (auth.uid() = user_id);
create policy "users delete own templates" on templates
  for delete using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- template_exercises: ordered exercises within a template
-- -----------------------------------------------------------------------------
create table template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  position int not null,
  target_sets int,
  target_reps int,
  target_weight numeric
);

create index template_exercises_template_id_idx on template_exercises (template_id);

alter table template_exercises enable row level security;

create policy "users read own template_exercises" on template_exercises
  for select using (
    exists (select 1 from templates t where t.id = template_id and t.user_id = auth.uid())
  );
create policy "users write own template_exercises" on template_exercises
  for all using (
    exists (select 1 from templates t where t.id = template_id and t.user_id = auth.uid())
  ) with check (
    exists (select 1 from templates t where t.id = template_id and t.user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- workouts: actual logged workout sessions
-- -----------------------------------------------------------------------------
create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references templates(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index workouts_user_started_idx on workouts (user_id, started_at desc);

alter table workouts enable row level security;

create policy "users read own workouts" on workouts
  for select using (auth.uid() = user_id);
create policy "users insert own workouts" on workouts
  for insert with check (auth.uid() = user_id);
create policy "users update own workouts" on workouts
  for update using (auth.uid() = user_id);
create policy "users delete own workouts" on workouts
  for delete using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- workout_sets: individual sets logged within a workout
-- -----------------------------------------------------------------------------
create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  set_number int not null,
  weight numeric,
  reps int,
  rpe numeric,
  is_warmup boolean not null default false,
  completed_at timestamptz not null default now()
);

create index workout_sets_workout_id_idx on workout_sets (workout_id);
create index workout_sets_exercise_id_idx on workout_sets (exercise_id);

alter table workout_sets enable row level security;

create policy "users read own workout_sets" on workout_sets
  for select using (
    exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid())
  );
create policy "users write own workout_sets" on workout_sets
  for all using (
    exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- Seed: starter exercise library (global, user_id = null)
-- -----------------------------------------------------------------------------
insert into exercises (user_id, name, primary_muscle, equipment, is_custom) values
  -- Compound lifts
  (null, 'Back Squat', 'Quads', 'Barbell', false),
  (null, 'Front Squat', 'Quads', 'Barbell', false),
  (null, 'Bench Press', 'Chest', 'Barbell', false),
  (null, 'Incline Bench Press', 'Chest', 'Barbell', false),
  (null, 'Overhead Press', 'Shoulders', 'Barbell', false),
  (null, 'Deadlift', 'Back', 'Barbell', false),
  (null, 'Romanian Deadlift', 'Hamstrings', 'Barbell', false),
  (null, 'Barbell Row', 'Back', 'Barbell', false),
  (null, 'Pull-Up', 'Back', 'Bodyweight', false),
  (null, 'Chin-Up', 'Back', 'Bodyweight', false),
  (null, 'Dip', 'Chest', 'Bodyweight', false),

  -- Dumbbell movements
  (null, 'Dumbbell Bench Press', 'Chest', 'Dumbbell', false),
  (null, 'Dumbbell Incline Press', 'Chest', 'Dumbbell', false),
  (null, 'Dumbbell Shoulder Press', 'Shoulders', 'Dumbbell', false),
  (null, 'Dumbbell Row', 'Back', 'Dumbbell', false),
  (null, 'Dumbbell Lateral Raise', 'Shoulders', 'Dumbbell', false),
  (null, 'Dumbbell Curl', 'Biceps', 'Dumbbell', false),
  (null, 'Hammer Curl', 'Biceps', 'Dumbbell', false),
  (null, 'Bulgarian Split Squat', 'Quads', 'Dumbbell', false),
  (null, 'Dumbbell Lunge', 'Quads', 'Dumbbell', false),

  -- Machine / cable
  (null, 'Lat Pulldown', 'Back', 'Cable', false),
  (null, 'Seated Cable Row', 'Back', 'Cable', false),
  (null, 'Tricep Pushdown', 'Triceps', 'Cable', false),
  (null, 'Cable Fly', 'Chest', 'Cable', false),
  (null, 'Face Pull', 'Rear Delts', 'Cable', false),
  (null, 'Leg Press', 'Quads', 'Machine', false),
  (null, 'Leg Curl', 'Hamstrings', 'Machine', false),
  (null, 'Leg Extension', 'Quads', 'Machine', false),
  (null, 'Calf Raise', 'Calves', 'Machine', false),
  (null, 'Chest Press Machine', 'Chest', 'Machine', false),

  -- Accessories
  (null, 'Plank', 'Core', 'Bodyweight', false),
  (null, 'Hanging Leg Raise', 'Core', 'Bodyweight', false),
  (null, 'Cable Crunch', 'Core', 'Cable', false),
  (null, 'Push-Up', 'Chest', 'Bodyweight', false),
  (null, 'Skullcrusher', 'Triceps', 'Barbell', false),
  (null, 'Preacher Curl', 'Biceps', 'Barbell', false);
