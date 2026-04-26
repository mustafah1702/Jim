-- personal_records: PR events linked back to the exact set that set the record
create table personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  workout_set_id uuid not null references workout_sets(id) on delete cascade,
  record_type text not null check (record_type in ('weight', 'volume')),
  record_value numeric not null check (record_value > 0),
  previous_record_value numeric check (previous_record_value is null or previous_record_value >= 0),
  achieved_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (workout_set_id, record_type)
);

create index personal_records_user_achieved_idx
  on personal_records (user_id, achieved_at desc);
create index personal_records_user_exercise_type_achieved_idx
  on personal_records (user_id, exercise_id, record_type, achieved_at desc);
create index personal_records_workout_set_id_idx
  on personal_records (workout_set_id);

alter table personal_records enable row level security;

create policy "users read own personal_records" on personal_records
  for select using (auth.uid() = user_id);

-- PR rows are maintained by database triggers so clients cannot spoof records.
create or replace function public.validate_personal_record_workout_set()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  set_user_id uuid;
  set_exercise_id uuid;
  set_completed_at timestamptz;
begin
  select w.user_id, ws.exercise_id, ws.completed_at
    into set_user_id, set_exercise_id, set_completed_at
  from workout_sets ws
  join workouts w on w.id = ws.workout_id
  where ws.id = new.workout_set_id;

  if set_user_id is null then
    raise exception 'workout_set % does not exist', new.workout_set_id;
  end if;

  if new.user_id <> set_user_id then
    raise exception 'personal_record user_id must match workout owner';
  end if;

  if new.exercise_id <> set_exercise_id then
    raise exception 'personal_record exercise_id must match workout_set exercise_id';
  end if;

  if new.achieved_at is null then
    new.achieved_at := set_completed_at;
  end if;

  return new;
end;
$$;

create trigger personal_records_validate_workout_set
  before insert or update on personal_records
  for each row execute function public.validate_personal_record_workout_set();

create or replace function public.record_workout_set_prs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  with eligible_sets as (
    select
      w.user_id,
      ws.exercise_id,
      ws.id as workout_set_id,
      ws.set_number,
      ws.completed_at,
      w.started_at,
      ws.weight,
      ws.reps,
      ws.weight * ws.reps as volume
    from new_workout_sets ws
    join workouts w on w.id = ws.workout_id
    where ws.is_warmup = false
      and ws.weight is not null
      and ws.weight > 0
      and ws.reps is not null
      and ws.reps > 0
  ),
  candidate_records as (
    select
      user_id,
      exercise_id,
      workout_set_id,
      set_number,
      completed_at,
      started_at,
      'weight'::text as record_type,
      weight as record_value
    from eligible_sets

    union all

    select
      user_id,
      exercise_id,
      workout_set_id,
      set_number,
      completed_at,
      started_at,
      'volume'::text as record_type,
      volume as record_value
    from eligible_sets
  ),
  with_previous as (
    select
      cr.*,
      (
        select max(pr.record_value)
        from personal_records pr
        where pr.user_id = cr.user_id
          and pr.exercise_id = cr.exercise_id
          and pr.record_type = cr.record_type
      ) as historical_best,
      max(cr.record_value) over (
        partition by cr.user_id, cr.exercise_id, cr.record_type
        order by cr.completed_at, cr.started_at, cr.set_number, cr.workout_set_id
        rows between unbounded preceding and 1 preceding
      ) as previous_new_best
    from candidate_records cr
  ),
  pr_rows as (
    select
      user_id,
      exercise_id,
      workout_set_id,
      record_type,
      record_value,
      case
        when historical_best is null and previous_new_best is null then null
        else greatest(coalesce(historical_best, 0), coalesce(previous_new_best, 0))
      end as previous_record_value,
      completed_at as achieved_at
    from with_previous
    where record_value > greatest(coalesce(historical_best, 0), coalesce(previous_new_best, 0))
  )
  insert into personal_records (
    user_id,
    exercise_id,
    workout_set_id,
    record_type,
    record_value,
    previous_record_value,
    achieved_at
  )
  select
    user_id,
    exercise_id,
    workout_set_id,
    record_type,
    record_value,
    previous_record_value,
    achieved_at
  from pr_rows
  on conflict (workout_set_id, record_type) do nothing;

  return null;
end;
$$;

create trigger workout_sets_record_prs
  after insert on workout_sets
  referencing new table as new_workout_sets
  for each statement execute function public.record_workout_set_prs();

-- Backfill existing logged sets. The first valid logged set for an exercise becomes
-- the baseline PR with previous_record_value = null.
with eligible_sets as (
  select
    w.user_id,
    ws.exercise_id,
    ws.id as workout_set_id,
    ws.set_number,
    ws.completed_at,
    w.started_at,
    ws.weight,
    ws.reps,
    ws.weight * ws.reps as volume
  from workout_sets ws
  join workouts w on w.id = ws.workout_id
  where ws.is_warmup = false
    and ws.weight is not null
    and ws.weight > 0
    and ws.reps is not null
    and ws.reps > 0
),
candidate_records as (
  select
    user_id,
    exercise_id,
    workout_set_id,
    set_number,
    completed_at,
    started_at,
    'weight'::text as record_type,
    weight as record_value
  from eligible_sets

  union all

  select
    user_id,
    exercise_id,
    workout_set_id,
    set_number,
    completed_at,
    started_at,
    'volume'::text as record_type,
    volume as record_value
  from eligible_sets
),
with_previous as (
  select
    cr.*,
    max(cr.record_value) over (
      partition by cr.user_id, cr.exercise_id, cr.record_type
      order by cr.completed_at, cr.started_at, cr.set_number, cr.workout_set_id
      rows between unbounded preceding and 1 preceding
    ) as previous_record_value
  from candidate_records cr
)
insert into personal_records (
  user_id,
  exercise_id,
  workout_set_id,
  record_type,
  record_value,
  previous_record_value,
  achieved_at
)
select
  user_id,
  exercise_id,
  workout_set_id,
  record_type,
  record_value,
  previous_record_value,
  completed_at as achieved_at
from with_previous
where record_value > coalesce(previous_record_value, 0)
on conflict (workout_set_id, record_type) do nothing;
