-- Core schema for the FitTrack MVP.
-- Aggregates such as streaks, workout totals, and strength progress are derived
-- from source records and intentionally are not stored in separate tables.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 100),
  avatar_url text,
  fitness_goal text,
  experience_level text check (
    experience_level is null
    or experience_level in ('beginner', 'intermediate', 'advanced')
  ),
  height_cm numeric(5, 2) check (height_cm is null or height_cm between 50 and 300),
  timezone text not null default 'UTC' check (char_length(trim(timezone)) between 1 and 100),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercise_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  category text check (
    category is null
    or category in ('push', 'pull', 'legs', 'core', 'cardio', 'other')
  ),
  equipment text,
  uses_bodyweight boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index exercise_catalog_name_unique_idx
  on public.exercise_catalog (lower(name));

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_plans_user_id_idx
  on public.workout_plans (user_id);

create unique index workout_plans_one_active_per_user_idx
  on public.workout_plans (user_id)
  where is_active;

create table public.workout_plan_days (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  workout_type text not null check (char_length(trim(workout_type)) between 1 and 60),
  is_rest_day boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_plan_id, day_of_week)
);

create index workout_plan_days_plan_id_idx
  on public.workout_plan_days (workout_plan_id);

create table public.workout_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_plan_day_id uuid not null references public.workout_plan_days(id) on delete cascade,
  exercise_id uuid not null references public.exercise_catalog(id) on delete restrict,
  position smallint not null check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_plan_day_id, position)
);

create index workout_plan_exercises_day_id_idx
  on public.workout_plan_exercises (workout_plan_day_id);

create index workout_plan_exercises_exercise_id_idx
  on public.workout_plan_exercises (exercise_id);

create table public.workout_plan_sets (
  id uuid primary key default gen_random_uuid(),
  workout_plan_exercise_id uuid not null references public.workout_plan_exercises(id) on delete cascade,
  set_number smallint not null check (set_number > 0),
  target_reps smallint not null check (target_reps > 0),
  target_weight_kg numeric(7, 2) check (target_weight_kg is null or target_weight_kg >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_plan_exercise_id, set_number)
);

create index workout_plan_sets_exercise_id_idx
  on public.workout_plan_sets (workout_plan_exercise_id);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_plan_day_id uuid references public.workout_plan_days(id) on delete set null,
  workout_date date not null default current_date,
  title text not null check (char_length(trim(title)) between 1 and 100),
  status text not null default 'planned' check (
    status in ('planned', 'in_progress', 'completed', 'cancelled')
  ),
  notes text check (notes is null or char_length(notes) <= 5000),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_at is null or started_at is null or completed_at >= started_at),
  check (status <> 'completed' or completed_at is not null)
);

create index workout_sessions_user_date_idx
  on public.workout_sessions (user_id, workout_date desc);

create index workout_sessions_plan_day_id_idx
  on public.workout_sessions (workout_plan_day_id)
  where workout_plan_day_id is not null;

create unique index workout_sessions_one_in_progress_per_user_idx
  on public.workout_sessions (user_id)
  where status = 'in_progress';

create table public.workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercise_catalog(id) on delete restrict,
  workout_plan_exercise_id uuid references public.workout_plan_exercises(id) on delete set null,
  position smallint not null check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_session_id, position)
);

create index workout_session_exercises_session_id_idx
  on public.workout_session_exercises (workout_session_id);

create index workout_session_exercises_exercise_id_idx
  on public.workout_session_exercises (exercise_id);

create table public.workout_session_sets (
  id uuid primary key default gen_random_uuid(),
  workout_session_exercise_id uuid not null references public.workout_session_exercises(id) on delete cascade,
  set_number smallint not null check (set_number > 0),
  reps smallint check (reps is null or reps >= 0),
  weight_kg numeric(7, 2) check (weight_kg is null or weight_kg >= 0),
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_completed or reps is not null),
  check (not is_completed or completed_at is not null),
  unique (workout_session_exercise_id, set_number)
);

create index workout_session_sets_session_exercise_id_idx
  on public.workout_session_sets (workout_session_exercise_id);

create table public.body_weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_on date not null default current_date,
  weight_kg numeric(6, 2) not null check (weight_kg between 20 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, recorded_on)
);

create index body_weight_entries_user_date_idx
  on public.body_weight_entries (user_id, recorded_on desc);

create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercise_catalog(id) on delete restrict,
  workout_session_set_id uuid references public.workout_session_sets(id) on delete set null,
  weight_kg numeric(7, 2) not null check (weight_kg >= 0),
  achieved_on date not null default current_date,
  source text not null check (source in ('auto', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source = 'auto' and workout_session_set_id is not null)
    or (source = 'manual' and workout_session_set_id is null)
  )
);

create index personal_records_user_date_idx
  on public.personal_records (user_id, achieved_on desc);

create index personal_records_user_exercise_idx
  on public.personal_records (user_id, exercise_id, weight_kg desc);

create unique index personal_records_auto_set_unique_idx
  on public.personal_records (workout_session_set_id)
  where workout_session_set_id is not null;

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null check (
    achievement_key = lower(achievement_key)
    and achievement_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'
  ),
  unlocked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, achievement_key)
);

create index user_achievements_user_id_idx
  on public.user_achievements (user_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger exercise_catalog_set_updated_at
before update on public.exercise_catalog
for each row execute function public.set_updated_at();

create trigger workout_plans_set_updated_at
before update on public.workout_plans
for each row execute function public.set_updated_at();

create trigger workout_plan_days_set_updated_at
before update on public.workout_plan_days
for each row execute function public.set_updated_at();

create trigger workout_plan_exercises_set_updated_at
before update on public.workout_plan_exercises
for each row execute function public.set_updated_at();

create trigger workout_plan_sets_set_updated_at
before update on public.workout_plan_sets
for each row execute function public.set_updated_at();

create trigger workout_sessions_set_updated_at
before update on public.workout_sessions
for each row execute function public.set_updated_at();

create trigger workout_session_exercises_set_updated_at
before update on public.workout_session_exercises
for each row execute function public.set_updated_at();

create trigger workout_session_sets_set_updated_at
before update on public.workout_session_sets
for each row execute function public.set_updated_at();

create trigger body_weight_entries_set_updated_at
before update on public.body_weight_entries
for each row execute function public.set_updated_at();

create trigger personal_records_set_updated_at
before update on public.personal_records
for each row execute function public.set_updated_at();
