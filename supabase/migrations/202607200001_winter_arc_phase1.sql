-- Winter Arc Phase 1: RIR + set type on workout logging, daily check-ins, and
-- per-user fitness targets. Additive only — no existing column is removed or
-- renamed, and no historical row is rewritten.

-- 1. Extend set logging with RIR (reps in reserve, 0-4) and warmup/working type.
alter table public.workout_session_sets
  add column rir smallint check (rir between 0 and 4),
  add column set_type text not null default 'working'
    check (set_type in ('warmup', 'working'));

alter table public.workout_plan_sets
  add column target_rir smallint check (target_rir between 0 and 4);

-- 2. Daily check-ins: one row per user per day, everything but the date optional.
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null default current_date,
  weight_kg numeric(6, 2) check (weight_kg between 20 and 500),
  waist_cm numeric(5, 2) check (waist_cm between 30 and 300),
  sleep_hours numeric(4, 2) check (sleep_hours between 0 and 24),
  steps integer check (steps >= 0),
  calories integer check (calories >= 0),
  protein_g numeric(6, 2) check (protein_g >= 0),
  water_liters numeric(4, 2) check (water_liters >= 0),
  energy smallint check (energy between 1 and 10),
  mood smallint check (mood between 1 and 10),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

create index daily_checkins_user_date_idx
  on public.daily_checkins (user_id, checkin_date desc);

create trigger daily_checkins_set_updated_at
before update on public.daily_checkins
for each row execute function public.set_updated_at();

-- 3. Fitness targets: one row per user, defaults applied client-side when absent.
create table public.fitness_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  protein_target_g numeric(6, 2) not null default 145 check (protein_target_g >= 0),
  steps_target integer not null default 8000 check (steps_target >= 0),
  sleep_target_hours numeric(4, 2) not null default 8 check (sleep_target_hours between 0 and 24),
  calorie_target integer check (calorie_target >= 0),
  water_target_liters numeric(4, 2) check (water_target_liters >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger fitness_targets_set_updated_at
before update on public.fitness_targets
for each row execute function public.set_updated_at();

-- 4. RLS — same simple owner-scoped template used for Finance/Productivity.
alter table public.daily_checkins enable row level security;
alter table public.fitness_targets enable row level security;

create policy "Users can manage their own daily check-ins"
on public.daily_checkins
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage their own fitness targets"
on public.fitness_targets
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.daily_checkins to authenticated;
grant select, insert, update, delete on public.fitness_targets to authenticated;

-- 5. RPC updates: thread rir/set_type through the existing "provided" pattern.
drop function if exists public.update_workout_session_set(
  uuid, uuid, smallint, boolean, numeric, boolean, boolean, boolean
);

create or replace function public.update_workout_session_set(
  p_session_id uuid,
  p_set_id uuid,
  p_reps smallint,
  p_reps_provided boolean,
  p_weight_kg numeric,
  p_weight_provided boolean,
  p_is_completed boolean,
  p_completed_provided boolean,
  p_rir smallint default null,
  p_rir_provided boolean default false,
  p_set_type text default null,
  p_set_type_provided boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  edited_status text;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if not coalesce(p_reps_provided, false)
    and not coalesce(p_weight_provided, false)
    and not coalesce(p_completed_provided, false)
    and not coalesce(p_rir_provided, false)
    and not coalesce(p_set_type_provided, false)
  then
    return true;
  end if;

  if p_set_type_provided and p_set_type not in ('warmup', 'working') then
    raise exception 'Invalid set type.' using errcode = '22023';
  end if;

  update public.workout_session_sets as session_set
  set
    reps = case when p_reps_provided then p_reps else session_set.reps end,
    weight_kg = case
      when p_weight_provided then p_weight_kg
      else session_set.weight_kg
    end,
    is_completed = case
      when p_completed_provided then p_is_completed
      else session_set.is_completed
    end,
    completed_at = case
      when p_completed_provided and p_is_completed then now()
      when p_completed_provided then null
      else session_set.completed_at
    end,
    rir = case when p_rir_provided then p_rir else session_set.rir end,
    set_type = case
      when p_set_type_provided then p_set_type
      else session_set.set_type
    end
  from public.workout_session_exercises as session_exercise
  join public.workout_sessions as session
    on session.id = session_exercise.workout_session_id
  where session_set.id = p_set_id
    and session_set.workout_session_exercise_id = session_exercise.id
    and session.id = p_session_id
    and session.user_id = request_user_id
    and session.status in ('in_progress', 'completed')
  returning session.status into edited_status;

  if not found then
    raise exception 'Workout set is not part of an active session.'
      using errcode = 'P0002';
  end if;

  if edited_status = 'completed' then
    delete from public.personal_records
    where user_id = request_user_id and source = 'auto';
    perform public.fittrack_reconcile_personal_records(request_user_id);
    perform public.fittrack_reconcile_achievements(request_user_id);
  end if;

  return true;
end;
$$;

revoke execute on function public.update_workout_session_set(
  uuid, uuid, smallint, boolean, numeric, boolean, boolean, boolean,
  smallint, boolean, text, boolean
)
from public, anon;
grant execute on function public.update_workout_session_set(
  uuid, uuid, smallint, boolean, numeric, boolean, boolean, boolean,
  smallint, boolean, text, boolean
)
to authenticated;

drop function if exists public.add_workout_session_set(uuid, uuid);

create or replace function public.add_workout_session_set(
  p_session_id uuid,
  p_session_exercise_id uuid,
  p_set_type text default 'working'
)
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
  last_rir smallint;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if p_set_type not in ('warmup', 'working') then
    raise exception 'Invalid set type.' using errcode = '22023';
  end if;

  perform 1
  from public.workout_session_exercises as session_exercise
  join public.workout_sessions as session
    on session.id = session_exercise.workout_session_id
  where session_exercise.id = p_session_exercise_id
    and session.id = p_session_id
    and session.user_id = request_user_id
    and session.status in ('in_progress', 'completed')
  for update of session_exercise;
  if not found then
    raise exception 'Workout exercise is not part of an active session.'
      using errcode = 'P0002';
  end if;

  select set_number, reps, weight_kg, rir
  into last_number, last_reps, last_weight, last_rir
  from public.workout_session_sets
  where workout_session_exercise_id = p_session_exercise_id
  order by set_number desc
  limit 1;

  insert into public.workout_session_sets (
    workout_session_exercise_id, set_number, reps, weight_kg, is_completed,
    rir, set_type
  )
  values (
    p_session_exercise_id,
    coalesce(last_number, 0) + 1,
    coalesce(last_reps, 10),
    last_weight,
    false,
    last_rir,
    p_set_type
  )
  returning id into new_set_id;

  return new_set_id;
end;
$$;

revoke execute on function public.add_workout_session_set(uuid, uuid, text)
from public, anon;
grant execute on function public.add_workout_session_set(uuid, uuid, text)
to authenticated;

-- start_workout_session: also seed each new set's rir from the plan's target_rir.
create or replace function public.start_workout_session(
  p_plan_day_id uuid,
  p_workout_date date default current_date
)
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

  if exists (
    select 1
    from public.workout_sessions as session
    where session.user_id = request_user_id
      and session.workout_plan_day_id = plan_day.id
      and session.workout_date = p_workout_date
      and session.status = 'completed'
  ) then
    raise exception 'This workout has already been completed today.'
      using errcode = '23505';
  end if;

  insert into public.workout_sessions (
    user_id, workout_plan_day_id, workout_date, title, status, started_at
  )
  values (
    request_user_id,
    plan_day.id,
    p_workout_date,
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
    completed_at,
    rir,
    set_type
  )
  select
    session_exercise.id,
    plan_set.set_number,
    plan_set.target_reps,
    plan_set.target_weight_kg,
    false,
    null,
    plan_set.target_rir,
    'working'
  from public.workout_session_exercises as session_exercise
  join public.workout_plan_sets as plan_set
    on plan_set.workout_plan_exercise_id
      = session_exercise.workout_plan_exercise_id
  where session_exercise.workout_session_id = new_session_id;

  return new_session_id;
end;
$$;

revoke execute on function public.start_workout_session(uuid, date)
from public, anon;
grant execute on function public.start_workout_session(uuid, date)
to authenticated;
