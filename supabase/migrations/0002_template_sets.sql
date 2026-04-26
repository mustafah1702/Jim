-- template_sets: per-set targets within a template exercise
create table template_sets (
  id uuid primary key default gen_random_uuid(),
  template_exercise_id uuid not null references template_exercises(id) on delete cascade,
  set_number int not null,
  target_reps int,
  target_weight numeric
);

create index template_sets_template_exercise_id_idx on template_sets (template_exercise_id);

alter table template_sets enable row level security;

create policy "users read own template_sets" on template_sets
  for select using (
    exists (
      select 1 from template_exercises te
      join templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.user_id = auth.uid()
    )
  );
create policy "users write own template_sets" on template_sets
  for all using (
    exists (
      select 1 from template_exercises te
      join templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from template_exercises te
      join templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.user_id = auth.uid()
    )
  );

-- Drop unused columns from template_exercises (targets now live per-set)
alter table template_exercises drop column target_sets;
alter table template_exercises drop column target_reps;
alter table template_exercises drop column target_weight;
