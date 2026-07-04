-- Production integrity and least-privilege hardening.
-- Critical state transitions and derived records are owned by PostgreSQL.

-- Normalize catalog uniqueness consistently with the creation RPC.
drop index if exists public.exercise_catalog_name_unique_idx;
create unique index exercise_catalog_normalized_name_unique_idx
  on public.exercise_catalog (
    lower(regexp_replace(trim(name), '[[:space:]]+', ' ', 'g'))
  );

alter table public.exercise_catalog
  add constraint exercise_catalog_name_normalized_check
  check (
    name = regexp_replace(trim(name), '[[:space:]]+', ' ', 'g')
    and name !~ '[[:cntrl:]]'
  );

alter table public.profiles
  add constraint profiles_avatar_url_check
  check (
    avatar_url is null
    or (
      char_length(avatar_url) <= 2048
      and avatar_url ~* '^https?://'
    )
  ),
  add constraint profiles_fitness_goal_length_check
  check (fitness_goal is null or char_length(trim(fitness_goal)) <= 200),
  add constraint profiles_normalized_text_check
  check (
    full_name = trim(full_name)
    and full_name !~ '[[:cntrl:]]'
    and timezone = trim(timezone)
  );

alter table public.workout_plans
  add constraint workout_plans_name_normalized_check
  check (
    name = regexp_replace(trim(name), '[[:space:]]+', ' ', 'g')
    and name !~ '[[:cntrl:]]'
  );

alter table public.workout_plan_days
  add constraint workout_plan_days_type_normalized_check
  check (
    workout_type = regexp_replace(trim(workout_type), '[[:space:]]+', ' ', 'g')
    and workout_type !~ '[[:cntrl:]]'
  );

alter table public.workout_sessions
  add constraint workout_sessions_started_state_check
  check (status = 'planned' or started_at is not null),
  add constraint workout_sessions_closed_state_check
  check (
    (status in ('completed', 'cancelled')) = (completed_at is not null)
  );

alter table public.workout_session_sets
  add constraint workout_session_sets_completion_state_check
  check (is_completed = (completed_at is not null));

alter table public.workout_plan_sets
  add constraint workout_plan_sets_reasonable_reps_check
  check (target_reps <= 1000),
  add constraint workout_plan_sets_reasonable_weight_check
  check (target_weight_kg is null or target_weight_kg <= 2000);

alter table public.workout_session_sets
  add constraint workout_session_sets_reasonable_reps_check
  check (reps is null or reps <= 1000),
  add constraint workout_session_sets_reasonable_weight_check
  check (weight_kg is null or weight_kg <= 2000);

create or replace function public.validate_profile_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from pg_catalog.pg_timezone_names
    where name = new.timezone
  ) then
    raise exception 'Profile timezone is not a valid IANA timezone.'
      using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger profiles_validate_timezone
before insert or update of timezone on public.profiles
for each row execute function public.validate_profile_timezone();

revoke execute on function public.validate_profile_timezone()
from public, anon, authenticated;

-- Manual records need database-level race protection as well as UI validation.
delete from public.personal_records as duplicate
using public.personal_records as keeper
where duplicate.source = 'manual'
  and keeper.source = 'manual'
  and duplicate.user_id = keeper.user_id
  and duplicate.exercise_id = keeper.exercise_id
  and duplicate.weight_kg = keeper.weight_kg
  and duplicate.achieved_on = keeper.achieved_on
  and duplicate.id > keeper.id;

create unique index personal_records_manual_unique_idx
  on public.personal_records (user_id, exercise_id, weight_kg, achieved_on)
  where source = 'manual';

delete from public.user_achievements
where achievement_key not in (
  'first_workout',
  'beast_mode',
  'week_warrior',
  'iron_will',
  'pr_crusher',
  'centurion',
  'tracking_started'
);

alter table public.user_achievements
  add constraint user_achievements_known_key_check
  check (
    achievement_key in (
      'first_workout',
      'beast_mode',
      'week_warrior',
      'iron_will',
      'pr_crusher',
      'centurion',
      'tracking_started'
    )
  );

create index workout_sessions_user_status_date_idx
  on public.workout_sessions (user_id, status, workout_date desc);

create index workout_session_sets_completed_exercise_idx
  on public.workout_session_sets (workout_session_exercise_id, is_completed);

create index workout_plan_exercises_day_exercise_idx
  on public.workout_plan_exercises (workout_plan_day_id, exercise_id);

-- Let transactional reorder functions defer position uniqueness until commit.
alter table public.workout_plan_exercises
  drop constraint workout_plan_exercises_workout_plan_day_id_position_key,
  add constraint workout_plan_exercises_day_position_unique
    unique (workout_plan_day_id, position)
    deferrable initially immediate;

alter table public.workout_plan_sets
  drop constraint workout_plan_sets_workout_plan_exercise_id_set_number_key,
  add constraint workout_plan_sets_exercise_number_unique
    unique (workout_plan_exercise_id, set_number)
    deferrable initially immediate;

create or replace function public.guard_workout_session_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  -- Preserve immutable session snapshots when a referenced plan day is
  -- deleted. The foreign key is intentionally ON DELETE SET NULL.
  if tg_op = 'UPDATE'
    and new.workout_plan_day_id is null
    and old.workout_plan_day_id is not null
    and new.status is not distinct from old.status
    and new.user_id is not distinct from old.user_id
    and new.workout_date is not distinct from old.workout_date
    and new.title is not distinct from old.title
    and new.notes is not distinct from old.notes
    and new.started_at is not distinct from old.started_at
    and new.completed_at is not distinct from old.completed_at
    and new.created_at is not distinct from old.created_at
  then
    return new;
  end if;

  if old.status in ('completed', 'cancelled') then
    raise exception 'Finalized workout sessions are immutable.'
      using errcode = '55000';
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Workout sessions must be cancelled, not deleted.'
      using errcode = '55000';
  end if;

  if new.status is distinct from old.status then
    raise exception 'Workout status transitions must use the close workout RPC.'
      using errcode = '55000';
  end if;

  if new.user_id is distinct from old.user_id
    or new.workout_plan_day_id is distinct from old.workout_plan_day_id
    or new.workout_date is distinct from old.workout_date
    or new.title is distinct from old.title
    or new.started_at is distinct from old.started_at
    or new.completed_at is distinct from old.completed_at
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Only workout notes may be edited directly.'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

create trigger workout_sessions_guard_history
before update or delete on public.workout_sessions
for each row execute function public.guard_workout_session_history();

create or replace function public.guard_workout_plan_state()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and (
    new.user_id is distinct from old.user_id
    or new.is_active is distinct from old.is_active
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Plan ownership and activation must use a trusted RPC.'
      using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger workout_plans_guard_state
before update on public.workout_plans
for each row execute function public.guard_workout_plan_state();

create or replace function public.guard_workout_session_children()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_session_id uuid;
  parent_status text;
begin
  if current_user not in ('authenticated', 'anon') then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if tg_table_name = 'workout_session_exercises' then
    parent_session_id := coalesce(new.workout_session_id, old.workout_session_id);
  else
    select exercise.workout_session_id
    into parent_session_id
    from public.workout_session_exercises as exercise
    where exercise.id = coalesce(
      new.workout_session_exercise_id,
      old.workout_session_exercise_id
    );
  end if;

  -- The optional template link is metadata only. Allow its FK to clear when
  -- a plan exercise is removed without changing the session snapshot.
  if tg_table_name = 'workout_session_exercises'
    and tg_op = 'UPDATE'
    and new.workout_plan_exercise_id is null
    and old.workout_plan_exercise_id is not null
    and new.workout_session_id is not distinct from old.workout_session_id
    and new.exercise_id is not distinct from old.exercise_id
    and new.position is not distinct from old.position
    and new.created_at is not distinct from old.created_at
  then
    return new;
  end if;

  select session.status
  into parent_status
  from public.workout_sessions as session
  where session.id = parent_session_id;

  if parent_status is distinct from 'in_progress' then
    raise exception 'Finalized workout history is immutable.'
      using errcode = '55000';
  end if;

  if tg_table_name = 'workout_session_sets'
    and tg_op = 'UPDATE'
    and (
      new.workout_session_exercise_id
        is distinct from old.workout_session_exercise_id
      or new.set_number is distinct from old.set_number
      or new.created_at is distinct from old.created_at
    )
  then
    raise exception 'Workout set identity cannot be changed.'
      using errcode = '55000';
  end if;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create trigger workout_session_exercises_guard_history
before insert or update or delete on public.workout_session_exercises
for each row execute function public.guard_workout_session_children();

create trigger workout_session_sets_guard_history
before insert or update or delete on public.workout_session_sets
for each row execute function public.guard_workout_session_children();

create or replace function public.guard_personal_record_provenance()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if tg_op = 'INSERT' and new.source = 'auto' then
    raise exception 'Automatic records can only be created by PostgreSQL.'
      using errcode = '42501';
  end if;

  if tg_op in ('UPDATE', 'DELETE') and old.source = 'auto' then
    raise exception 'Automatic personal records are immutable.'
      using errcode = '55000';
  end if;

  if tg_op = 'UPDATE' and (
    new.source is distinct from old.source
    or new.user_id is distinct from old.user_id
    or new.workout_session_set_id is distinct from old.workout_session_set_id
  ) then
    raise exception 'Personal record provenance cannot be changed.'
      using errcode = '55000';
  end if;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create trigger personal_records_guard_provenance
before insert or update or delete on public.personal_records
for each row execute function public.guard_personal_record_provenance();

create or replace function public.guard_achievement_provenance()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    raise exception 'Achievement unlocks can only be written by PostgreSQL.'
      using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create trigger user_achievements_guard_provenance
before insert or update or delete on public.user_achievements
for each row execute function public.guard_achievement_provenance();

-- Internal historical PR reconciliation. Execution is never granted to clients.
create or replace function public.fittrack_reconcile_personal_records(
  target_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate record;
  prior_best numeric;
  inserted_count integer := 0;
begin
  for candidate in
    select
      session_set.id as set_id,
      session_exercise.exercise_id,
      session_set.weight_kg,
      session.workout_date,
      session_set.completed_at
    from public.workout_session_sets as session_set
    join public.workout_session_exercises as session_exercise
      on session_exercise.id = session_set.workout_session_exercise_id
    join public.workout_sessions as session
      on session.id = session_exercise.workout_session_id
    where session.user_id = target_user_id
      and session.status = 'completed'
      and session_set.is_completed
      and session_set.weight_kg is not null
      and not exists (
        select 1
        from public.personal_records as existing
        where existing.workout_session_set_id = session_set.id
      )
    order by session.workout_date, session_set.completed_at, session_set.id
  loop
    select greatest(
      coalesce((
        select max(prior_set.weight_kg)
        from public.workout_session_sets as prior_set
        join public.workout_session_exercises as prior_exercise
          on prior_exercise.id = prior_set.workout_session_exercise_id
        join public.workout_sessions as prior_session
          on prior_session.id = prior_exercise.workout_session_id
        where prior_session.user_id = target_user_id
          and prior_session.status = 'completed'
          and prior_exercise.exercise_id = candidate.exercise_id
          and prior_set.is_completed
          and prior_set.weight_kg is not null
          and (
            prior_session.workout_date < candidate.workout_date
            or (
              prior_session.workout_date = candidate.workout_date
              and (prior_set.completed_at, prior_set.id)
                < (candidate.completed_at, candidate.set_id)
            )
          )
      ), -1),
      coalesce((
        select max(manual.weight_kg)
        from public.personal_records as manual
        where manual.user_id = target_user_id
          and manual.exercise_id = candidate.exercise_id
          and manual.source = 'manual'
          and manual.achieved_on <= candidate.workout_date
      ), -1)
    ) into prior_best;

    if candidate.weight_kg > prior_best then
      insert into public.personal_records (
        user_id,
        exercise_id,
        workout_session_set_id,
        weight_kg,
        achieved_on,
        source
      )
      values (
        target_user_id,
        candidate.exercise_id,
        candidate.set_id,
        candidate.weight_kg,
        candidate.workout_date,
        'auto'
      )
      on conflict (workout_session_set_id)
        where workout_session_set_id is not null
        do nothing;

      if found then inserted_count := inserted_count + 1; end if;
    end if;
  end loop;

  return inserted_count;
end;
$$;

revoke all on function public.fittrack_reconcile_personal_records(uuid)
from public, anon, authenticated;

-- Rebuild automatic records from immutable completed-session source data.
delete from public.personal_records where source = 'auto';
do $$
declare
  target_user record;
begin
  for target_user in select id from public.profiles loop
    perform public.fittrack_reconcile_personal_records(target_user.id);
  end loop;
end;
$$;

create or replace function public.reconcile_personal_records()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  return public.fittrack_reconcile_personal_records(request_user_id);
end;
$$;

revoke execute on function public.reconcile_personal_records()
from public, anon;
grant execute on function public.reconcile_personal_records()
to authenticated;

create or replace function public.fittrack_streak_unlock_at(
  target_user_id uuid,
  target_days integer
)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  with workout_dates as (
    select distinct session.workout_date
    from public.workout_sessions as session
    where session.user_id = target_user_id
      and session.status = 'completed'
  ),
  grouped_dates as (
    select
      workout_date,
      workout_date - row_number() over (order by workout_date)::integer as run
    from workout_dates
  ),
  qualifying_run as (
    select min(workout_date) as started_on
    from grouped_dates
    group by run
    having count(*) >= target_days
    order by min(workout_date)
    limit 1
  ),
  unlock_date as (
    select started_on + (target_days - 1) as unlocked_on
    from qualifying_run
  )
  select min(session.completed_at)
  from public.workout_sessions as session
  join unlock_date on unlock_date.unlocked_on = session.workout_date
  where session.user_id = target_user_id
    and session.status = 'completed';
$$;

revoke all on function public.fittrack_streak_unlock_at(uuid, integer)
from public, anon, authenticated;

create or replace function public.fittrack_reconcile_achievements(
  target_user_id uuid
)
returns setof public.user_achievements
language plpgsql
security definer
set search_path = ''
as $$
declare
  qualified_at timestamptz;
begin
  select min(session.completed_at) into qualified_at
  from public.workout_sessions as session
  where session.user_id = target_user_id and session.status = 'completed';
  if qualified_at is not null then
    return query
      insert into public.user_achievements (user_id, achievement_key, unlocked_at)
      values (target_user_id, 'first_workout', qualified_at)
      on conflict (user_id, achievement_key) do nothing returning *;
  end if;

  select completed_at into qualified_at
  from public.workout_sessions
  where user_id = target_user_id and status = 'completed'
  order by workout_date, completed_at, id
  offset 99 limit 1;
  if qualified_at is not null then
    return query
      insert into public.user_achievements (user_id, achievement_key, unlocked_at)
      values (target_user_id, 'beast_mode', qualified_at)
      on conflict (user_id, achievement_key) do nothing returning *;
  end if;

  qualified_at := public.fittrack_streak_unlock_at(target_user_id, 7);
  if qualified_at is not null then
    return query
      insert into public.user_achievements (user_id, achievement_key, unlocked_at)
      values (target_user_id, 'week_warrior', qualified_at)
      on conflict (user_id, achievement_key) do nothing returning *;
  end if;

  qualified_at := public.fittrack_streak_unlock_at(target_user_id, 30);
  if qualified_at is not null then
    return query
      insert into public.user_achievements (user_id, achievement_key, unlocked_at)
      values (target_user_id, 'iron_will', qualified_at)
      on conflict (user_id, achievement_key) do nothing returning *;
  end if;

  select achieved_on::timestamptz into qualified_at
  from public.personal_records
  where user_id = target_user_id
  order by achieved_on, created_at, id
  offset 4 limit 1;
  if qualified_at is not null then
    return query
      insert into public.user_achievements (user_id, achievement_key, unlocked_at)
      values (target_user_id, 'pr_crusher', qualified_at)
      on conflict (user_id, achievement_key) do nothing returning *;
  end if;

  select record.achieved_on::timestamptz into qualified_at
  from public.personal_records as record
  join public.exercise_catalog as exercise on exercise.id = record.exercise_id
  where record.user_id = target_user_id
    and lower(regexp_replace(trim(exercise.name), '[[:space:]]+', ' ', 'g'))
      = 'bench press'
    and record.weight_kg >= 100
  order by record.achieved_on, record.created_at, record.id
  limit 1;
  if qualified_at is not null then
    return query
      insert into public.user_achievements (user_id, achievement_key, unlocked_at)
      values (target_user_id, 'centurion', qualified_at)
      on conflict (user_id, achievement_key) do nothing returning *;
  end if;

  select recorded_on::timestamptz into qualified_at
  from public.body_weight_entries
  where user_id = target_user_id
  order by recorded_on, id
  limit 1;
  if qualified_at is not null then
    return query
      insert into public.user_achievements (user_id, achievement_key, unlocked_at)
      values (target_user_id, 'tracking_started', qualified_at)
      on conflict (user_id, achievement_key) do nothing returning *;
  end if;
end;
$$;

revoke all on function public.fittrack_reconcile_achievements(uuid)
from public, anon, authenticated;

-- Remove any previously client-forged unlocks and deterministically rebuild
-- them from completed workouts, trusted PRs, and body-weight history.
delete from public.user_achievements;
do $$
declare
  target_user record;
begin
  for target_user in select id from public.profiles loop
    perform public.fittrack_reconcile_achievements(target_user.id);
  end loop;
end;
$$;

create or replace function public.reconcile_achievements()
returns setof public.user_achievements
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  return query
    select * from public.fittrack_reconcile_achievements(request_user_id);
end;
$$;

revoke execute on function public.reconcile_achievements()
from public, anon;
grant execute on function public.reconcile_achievements()
to authenticated;

create or replace function public.start_workout_session(p_plan_day_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  existing_session_id uuid;
  new_session_id uuid;
  plan_day record;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(request_user_id::text, 0));

  select session.id into existing_session_id
  from public.workout_sessions as session
  where session.user_id = request_user_id and session.status = 'in_progress'
  limit 1;
  if existing_session_id is not null then return existing_session_id; end if;

  select day.id, day.workout_type, day.is_rest_day
  into plan_day
  from public.workout_plan_days as day
  join public.workout_plans as plan on plan.id = day.workout_plan_id
  where day.id = p_plan_day_id and plan.user_id = request_user_id
  for update of day;

  if not found then
    raise exception 'Workout plan day not found.' using errcode = 'P0002';
  end if;
  if plan_day.is_rest_day then
    raise exception 'A rest day cannot be started as a workout.'
      using errcode = '22023';
  end if;

  insert into public.workout_sessions (
    user_id, workout_plan_day_id, title, status, started_at
  )
  values (
    request_user_id,
    plan_day.id,
    plan_day.workout_type || ' Day',
    'in_progress',
    now()
  )
  returning id into new_session_id;

  insert into public.workout_session_exercises (
    workout_session_id, exercise_id, workout_plan_exercise_id, position
  )
  select new_session_id, exercise.exercise_id, exercise.id, exercise.position
  from public.workout_plan_exercises as exercise
  where exercise.workout_plan_day_id = plan_day.id
  order by exercise.position;

  insert into public.workout_session_sets (
    workout_session_exercise_id,
    set_number,
    reps,
    weight_kg,
    is_completed,
    completed_at
  )
  select
    session_exercise.id,
    plan_set.set_number,
    plan_set.target_reps,
    plan_set.target_weight_kg,
    false,
    null
  from public.workout_session_exercises as session_exercise
  join public.workout_plan_sets as plan_set
    on plan_set.workout_plan_exercise_id
      = session_exercise.workout_plan_exercise_id
  where session_exercise.workout_session_id = new_session_id;

  return new_session_id;
end;
$$;

revoke execute on function public.start_workout_session(uuid)
from public, anon;
grant execute on function public.start_workout_session(uuid)
to authenticated;

create or replace function public.close_workout_session(
  p_session_id uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  if p_status not in ('completed', 'cancelled') then
    raise exception 'Invalid final workout status.' using errcode = '22023';
  end if;

  update public.workout_sessions
  set status = p_status, completed_at = now()
  where id = p_session_id
    and user_id = request_user_id
    and status = 'in_progress';

  if not found then
    raise exception 'This workout is already locked.' using errcode = '55000';
  end if;

  if p_status = 'completed' then
    perform public.fittrack_reconcile_personal_records(request_user_id);
    perform public.fittrack_reconcile_achievements(request_user_id);
  end if;

  return true;
end;
$$;

revoke execute on function public.close_workout_session(uuid, text)
from public, anon;
grant execute on function public.close_workout_session(uuid, text)
to authenticated;

create or replace function public.add_workout_session_exercise(
  p_session_id uuid,
  p_exercise_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  new_exercise_id uuid;
  next_position integer;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  perform 1
  from public.workout_sessions
  where id = p_session_id
    and user_id = request_user_id
    and status = 'in_progress'
  for update;
  if not found then
    raise exception 'This workout is locked and can no longer be edited.'
      using errcode = '55000';
  end if;

  perform 1 from public.exercise_catalog where id = p_exercise_id;
  if not found then
    raise exception 'Exercise not found.' using errcode = 'P0002';
  end if;

  select coalesce(max(position), 0) + 1 into next_position
  from public.workout_session_exercises
  where workout_session_id = p_session_id;

  insert into public.workout_session_exercises (
    workout_session_id, exercise_id, position
  )
  values (p_session_id, p_exercise_id, next_position)
  returning id into new_exercise_id;

  insert into public.workout_session_sets (
    workout_session_exercise_id, set_number, reps, is_completed
  )
  select new_exercise_id, set_number, 10, false
  from generate_series(1, 3) as set_number;

  return new_exercise_id;
end;
$$;

revoke execute on function public.add_workout_session_exercise(uuid, uuid)
from public, anon;
grant execute on function public.add_workout_session_exercise(uuid, uuid)
to authenticated;

create or replace function public.create_workout_plan(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  normalized_name text;
  new_plan_id uuid;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  normalized_name := regexp_replace(trim(p_name), '[[:space:]]+', ' ', 'g');
  if normalized_name is null
    or char_length(normalized_name) < 1
    or char_length(normalized_name) > 100
  then
    raise exception 'Plan name must be between 1 and 100 characters.'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(request_user_id::text, 1));
  select id into new_plan_id
  from public.workout_plans
  where user_id = request_user_id
    and lower(regexp_replace(trim(name), '[[:space:]]+', ' ', 'g'))
      = lower(normalized_name)
  order by created_at, id
  limit 1;
  if new_plan_id is not null then return new_plan_id; end if;

  insert into public.workout_plans (user_id, name, is_active)
  values (
    request_user_id,
    normalized_name,
    not exists (
      select 1 from public.workout_plans where user_id = request_user_id
    )
  )
  returning id into new_plan_id;
  return new_plan_id;
end;
$$;

revoke execute on function public.create_workout_plan(text)
from public, anon;
grant execute on function public.create_workout_plan(text)
to authenticated;

create or replace function public.activate_workout_plan(p_plan_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(request_user_id::text, 1));
  perform 1 from public.workout_plans
  where id = p_plan_id and user_id = request_user_id;
  if not found then
    raise exception 'Workout plan not found.' using errcode = 'P0002';
  end if;

  update public.workout_plans set is_active = false
  where user_id = request_user_id and is_active and id <> p_plan_id;
  update public.workout_plans set is_active = true
  where id = p_plan_id and user_id = request_user_id;
  return true;
end;
$$;

revoke execute on function public.activate_workout_plan(uuid)
from public, anon;
grant execute on function public.activate_workout_plan(uuid)
to authenticated;

create or replace function public.delete_workout_plan(p_plan_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  deleted_was_active boolean;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(request_user_id::text, 1));

  delete from public.workout_plans
  where id = p_plan_id and user_id = request_user_id
  returning is_active into deleted_was_active;
  if not found then
    raise exception 'Workout plan not found.' using errcode = 'P0002';
  end if;

  if deleted_was_active then
    update public.workout_plans
    set is_active = true
    where id = (
      select id from public.workout_plans
      where user_id = request_user_id
      order by created_at, id
      limit 1
    );
  end if;
  return true;
end;
$$;

revoke execute on function public.delete_workout_plan(uuid)
from public, anon;
grant execute on function public.delete_workout_plan(uuid)
to authenticated;

create or replace function public.add_plan_exercise_with_sets(
  p_day_id uuid,
  p_exercise_id uuid,
  p_allow_duplicate boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  new_exercise_id uuid;
  next_position integer;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  perform 1
  from public.workout_plan_days as day
  join public.workout_plans as plan on plan.id = day.workout_plan_id
  where day.id = p_day_id and plan.user_id = request_user_id
  for update of day;
  if not found then
    raise exception 'Workout plan day not found.' using errcode = 'P0002';
  end if;

  perform 1 from public.exercise_catalog where id = p_exercise_id;
  if not found then
    raise exception 'Exercise not found.' using errcode = 'P0002';
  end if;

  if not p_allow_duplicate and exists (
    select 1 from public.workout_plan_exercises
    where workout_plan_day_id = p_day_id and exercise_id = p_exercise_id
  ) then
    raise exception 'This exercise is already part of the selected day.'
      using errcode = '23505';
  end if;

  select coalesce(max(position), 0) + 1 into next_position
  from public.workout_plan_exercises where workout_plan_day_id = p_day_id;

  insert into public.workout_plan_exercises (
    workout_plan_day_id, exercise_id, position
  )
  values (p_day_id, p_exercise_id, next_position)
  returning id into new_exercise_id;

  insert into public.workout_plan_sets (
    workout_plan_exercise_id, set_number, target_reps, target_weight_kg
  )
  select new_exercise_id, set_number, 10, null
  from generate_series(1, 3) as set_number;

  return new_exercise_id;
end;
$$;

revoke execute on function public.add_plan_exercise_with_sets(uuid, uuid, boolean)
from public, anon;
grant execute on function public.add_plan_exercise_with_sets(uuid, uuid, boolean)
to authenticated;

create or replace function public.add_plan_set(p_plan_exercise_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  new_set_id uuid;
  last_number integer;
  last_reps integer;
  last_weight numeric;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  perform 1
  from public.workout_plan_exercises as exercise
  join public.workout_plan_days as day on day.id = exercise.workout_plan_day_id
  join public.workout_plans as plan on plan.id = day.workout_plan_id
  where exercise.id = p_plan_exercise_id
    and plan.user_id = request_user_id
  for update of exercise;
  if not found then
    raise exception 'Planned exercise not found.' using errcode = 'P0002';
  end if;

  select set_number, target_reps, target_weight_kg
  into last_number, last_reps, last_weight
  from public.workout_plan_sets
  where workout_plan_exercise_id = p_plan_exercise_id
  order by set_number desc
  limit 1;

  insert into public.workout_plan_sets (
    workout_plan_exercise_id, set_number, target_reps, target_weight_kg
  )
  values (
    p_plan_exercise_id,
    coalesce(last_number, 0) + 1,
    coalesce(last_reps, 10),
    last_weight
  )
  returning id into new_set_id;
  return new_set_id;
end;
$$;

revoke execute on function public.add_plan_set(uuid)
from public, anon;
grant execute on function public.add_plan_set(uuid)
to authenticated;

create or replace function public.reorder_plan_exercises(
  p_day_id uuid,
  p_ordered_ids uuid[]
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  expected_count integer;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  if p_ordered_ids is null
    or cardinality(p_ordered_ids) <> (
      select count(distinct item) from unnest(p_ordered_ids) as item
    )
  then
    raise exception 'Exercise ordering contains duplicate entries.'
      using errcode = '22023';
  end if;

  perform 1
  from public.workout_plan_days as day
  join public.workout_plans as plan on plan.id = day.workout_plan_id
  where day.id = p_day_id and plan.user_id = request_user_id
  for update of day;
  if not found then
    raise exception 'Workout plan day not found.' using errcode = 'P0002';
  end if;

  select count(*) into expected_count
  from public.workout_plan_exercises where workout_plan_day_id = p_day_id;
  if expected_count <> cardinality(p_ordered_ids)
    or exists (
      select 1 from unnest(p_ordered_ids) as requested(id)
      where not exists (
        select 1 from public.workout_plan_exercises as exercise
        where exercise.id = requested.id
          and exercise.workout_plan_day_id = p_day_id
      )
    )
  then
    raise exception 'Exercise ordering does not match the selected day.'
      using errcode = '22023';
  end if;

  set constraints workout_plan_exercises_day_position_unique deferred;
  update public.workout_plan_exercises as exercise
  set position = requested.position
  from unnest(p_ordered_ids) with ordinality as requested(id, position)
  where exercise.id = requested.id
    and exercise.workout_plan_day_id = p_day_id;
  return true;
end;
$$;

revoke execute on function public.reorder_plan_exercises(uuid, uuid[])
from public, anon;
grant execute on function public.reorder_plan_exercises(uuid, uuid[])
to authenticated;

create or replace function public.remove_plan_set(p_set_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  target_exercise_id uuid;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select plan_set.workout_plan_exercise_id into target_exercise_id
  from public.workout_plan_sets as plan_set
  join public.workout_plan_exercises as exercise
    on exercise.id = plan_set.workout_plan_exercise_id
  join public.workout_plan_days as day
    on day.id = exercise.workout_plan_day_id
  join public.workout_plans as plan on plan.id = day.workout_plan_id
  where plan_set.id = p_set_id and plan.user_id = request_user_id
  for update of exercise;
  if not found then
    raise exception 'The planned set could not be found.' using errcode = 'P0002';
  end if;

  delete from public.workout_plan_sets where id = p_set_id;
  set constraints workout_plan_sets_exercise_number_unique deferred;
  update public.workout_plan_sets as plan_set
  set set_number = numbered.new_number
  from (
    select id, row_number() over (order by set_number, id)::integer as new_number
    from public.workout_plan_sets
    where workout_plan_exercise_id = target_exercise_id
  ) as numbered
  where plan_set.id = numbered.id;
  return true;
end;
$$;

revoke execute on function public.remove_plan_set(uuid)
from public, anon;
grant execute on function public.remove_plan_set(uuid)
to authenticated;

-- Harden and replace the catalog creation function from the prior migration.
create or replace function public.create_exercise_catalog_item(p_name text)
returns public.exercise_catalog
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  normalized_name text;
  catalog_item public.exercise_catalog;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  if p_name is null or p_name ~ '[[:cntrl:]]' then
    raise exception 'Exercise name is invalid.' using errcode = '22023';
  end if;

  normalized_name := regexp_replace(trim(p_name), '[[:space:]]+', ' ', 'g');
  if char_length(normalized_name) < 1 or char_length(normalized_name) > 120 then
    raise exception 'Exercise name must be between 1 and 120 characters.'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(lower(normalized_name), 2)
  );
  select exercise.* into catalog_item
  from public.exercise_catalog as exercise
  where lower(regexp_replace(trim(exercise.name), '[[:space:]]+', ' ', 'g'))
    = lower(normalized_name)
  limit 1;
  if found then return catalog_item; end if;

  insert into public.exercise_catalog (name, category, uses_bodyweight)
  values (normalized_name, 'other', false)
  returning * into catalog_item;
  return catalog_item;
end;
$$;

revoke execute on function public.create_exercise_catalog_item(text)
from public, anon;
grant execute on function public.create_exercise_catalog_item(text)
to authenticated;

-- Replace broad critical-table policies with operation-specific policies.
drop policy "Users can manage their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "Users can create their own profile"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy "Users can manage their own plans" on public.workout_plans;
create policy "Users can read their own plans"
on public.workout_plans for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can update their own plan details"
on public.workout_plans for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy "Users can manage their own workout sessions"
on public.workout_sessions;
create policy "Users can read their own workout sessions"
on public.workout_sessions for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can update their active workout notes"
on public.workout_sessions for update to authenticated
using ((select auth.uid()) = user_id and status = 'in_progress')
with check ((select auth.uid()) = user_id and status = 'in_progress');

drop policy "Users can manage exercises in their own sessions"
on public.workout_session_exercises;
create policy "Users can read exercises in their own sessions"
on public.workout_session_exercises for select to authenticated
using (
  exists (
    select 1 from public.workout_sessions as session
    where session.id = workout_session_exercises.workout_session_id
      and session.user_id = (select auth.uid())
  )
);
create policy "Users can remove exercises from active sessions"
on public.workout_session_exercises for delete to authenticated
using (
  exists (
    select 1 from public.workout_sessions as session
    where session.id = workout_session_exercises.workout_session_id
      and session.user_id = (select auth.uid())
      and session.status = 'in_progress'
  )
);

drop policy "Users can manage sets in their own session exercises"
on public.workout_session_sets;
create policy "Users can read sets in their own sessions"
on public.workout_session_sets for select to authenticated
using (
  exists (
    select 1
    from public.workout_session_exercises as exercise
    join public.workout_sessions as session
      on session.id = exercise.workout_session_id
    where exercise.id = workout_session_sets.workout_session_exercise_id
      and session.user_id = (select auth.uid())
  )
);
create policy "Users can update sets in active sessions"
on public.workout_session_sets for update to authenticated
using (
  exists (
    select 1
    from public.workout_session_exercises as exercise
    join public.workout_sessions as session
      on session.id = exercise.workout_session_id
    where exercise.id = workout_session_sets.workout_session_exercise_id
      and session.user_id = (select auth.uid())
      and session.status = 'in_progress'
  )
)
with check (
  exists (
    select 1
    from public.workout_session_exercises as exercise
    join public.workout_sessions as session
      on session.id = exercise.workout_session_id
    where exercise.id = workout_session_sets.workout_session_exercise_id
      and session.user_id = (select auth.uid())
      and session.status = 'in_progress'
  )
);

drop policy "Users can manage their own personal records"
on public.personal_records;
create policy "Users can read their own personal records"
on public.personal_records for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can create manual personal records"
on public.personal_records for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and source = 'manual'
  and workout_session_set_id is null
);
create policy "Users can update manual personal records"
on public.personal_records for update to authenticated
using ((select auth.uid()) = user_id and source = 'manual')
with check (
  (select auth.uid()) = user_id
  and source = 'manual'
  and workout_session_set_id is null
);
create policy "Users can delete manual personal records"
on public.personal_records for delete to authenticated
using ((select auth.uid()) = user_id and source = 'manual');

drop policy "Users can manage their own achievement unlocks"
on public.user_achievements;
create policy "Users can read their own achievement unlocks"
on public.user_achievements for select to authenticated
using ((select auth.uid()) = user_id);

-- Least privilege: compound and derived writes must pass through RPCs.
revoke delete on public.profiles from authenticated;
revoke insert, delete on public.workout_plans from authenticated;
revoke insert on public.workout_plan_exercises from authenticated;
revoke insert on public.workout_plan_sets from authenticated;
revoke insert on public.workout_session_exercises from authenticated;
revoke insert, delete on public.workout_session_sets from authenticated;
revoke insert, delete on public.workout_sessions from authenticated;
revoke insert, update, delete on public.user_achievements from authenticated;

revoke execute on function public.guard_workout_session_history()
from public, anon, authenticated;
revoke execute on function public.guard_workout_plan_state()
from public, anon, authenticated;
revoke execute on function public.guard_workout_session_children()
from public, anon, authenticated;
revoke execute on function public.guard_personal_record_provenance()
from public, anon, authenticated;
revoke execute on function public.guard_achievement_provenance()
from public, anon, authenticated;
