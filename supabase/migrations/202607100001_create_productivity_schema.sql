-- Productivity workspace schema: habits, habit completion logs, tasks, and
-- workspace-scoped notifications. Consistent with the Fitness core schema,
-- aggregates such as habit streaks and completion rates are derived from the
-- habit_logs source records (in the service layer / views) rather than stored.

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  description text check (description is null or char_length(description) <= 1000),
  category text not null default 'other' check (
    category in (
      'health', 'fitness', 'learning', 'mindfulness',
      'productivity', 'finance', 'social', 'creativity', 'other'
    )
  ),
  icon text not null default 'circle-check' check (char_length(trim(icon)) between 1 and 40),
  color text not null default 'blue' check (
    color in (
      'slate', 'blue', 'indigo', 'violet', 'purple', 'pink', 'rose', 'red',
      'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan'
    )
  ),
  frequency text not null default 'daily' check (
    frequency in ('daily', 'weekdays', 'custom')
  ),
  -- ISO weekdays (1 = Monday … 7 = Sunday) targeted by a 'custom' frequency.
  custom_days smallint[] check (
    custom_days is null
    or (
      array_length(custom_days, 1) between 1 and 7
      and custom_days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
    )
  ),
  target_value numeric(10, 2) check (target_value is null or target_value > 0),
  unit text check (unit is null or char_length(trim(unit)) between 1 and 30),
  reminder_enabled boolean not null default false,
  reminder_time time,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (frequency <> 'custom' or (custom_days is not null and array_length(custom_days, 1) >= 1)),
  check (not reminder_enabled or reminder_time is not null)
);

create index habits_user_status_idx
  on public.habits (user_id, status, created_at desc);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  -- Denormalised owner for direct RLS + efficient per-user calendar reads,
  -- mirroring how workout_sessions carries user_id.
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  value numeric(10, 2) check (value is null or value >= 0),
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

create index habit_logs_habit_date_idx
  on public.habit_logs (habit_id, log_date desc);

create index habit_logs_user_date_idx
  on public.habit_logs (user_id, log_date desc);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text check (description is null or char_length(description) <= 2000),
  priority text not null default 'medium' check (
    priority in ('low', 'medium', 'high', 'urgent')
  ),
  due_date date,
  due_time time,
  -- Hard deadline. 'overdue' is derived (pending and deadline/due date in the
  -- past) rather than stored, so it never drifts out of sync with the clock.
  deadline timestamptz,
  repeat text not null default 'none' check (
    repeat in ('none', 'daily', 'weekly', 'monthly', 'yearly')
  ),
  reminder_enabled boolean not null default false,
  reminder_at timestamptz,
  location text check (location is null or char_length(trim(location)) between 1 and 200),
  notes text check (notes is null or char_length(notes) <= 5000),
  attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array'),
  status text not null default 'pending' check (
    status in ('pending', 'completed', 'cancelled', 'archived')
  ),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'completed' or completed_at is not null),
  check (not reminder_enabled or reminder_at is not null)
);

create index tasks_user_status_due_idx
  on public.tasks (user_id, status, due_date);

create index tasks_user_deadline_idx
  on public.tasks (user_id, deadline)
  where deadline is not null;

create index tasks_user_created_idx
  on public.tasks (user_id, created_at desc);

create table public.productivity_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'task_reminder', 'task_due_soon', 'task_overdue',
    'habit_reminder', 'daily_summary', 'weekly_summary',
    'monthly_summary', 'system'
  )),
  title text not null check (char_length(trim(title)) between 1 and 120),
  message text not null check (char_length(trim(message)) between 1 and 500),
  icon text not null check (char_length(trim(icon)) between 1 and 40),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  action_url text check (
    action_url is null
    or action_url in (
      '/productivity', '/productivity/habits',
      '/productivity/tasks', '/productivity/calendar'
    )
  ),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  dedupe_key text check (
    dedupe_key is null or char_length(trim(dedupe_key)) between 1 and 200
  ),
  -- When set, the client surfaces the notification at/after this instant. This
  -- keeps the table push-notification ready without any client changes.
  scheduled_for timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index productivity_notifications_user_created_idx
  on public.productivity_notifications (user_id, created_at desc, id desc);

create index productivity_notifications_user_unread_idx
  on public.productivity_notifications (user_id, created_at desc)
  where read_at is null;

create index productivity_notifications_user_scheduled_idx
  on public.productivity_notifications (user_id, scheduled_for)
  where scheduled_for is not null;

create unique index productivity_notifications_user_dedupe_idx
  on public.productivity_notifications (user_id, dedupe_key)
  where dedupe_key is not null;

-- updated_at maintenance reuses the existing shared trigger function.
create trigger habits_set_updated_at
before update on public.habits
for each row execute function public.set_updated_at();

create trigger habit_logs_set_updated_at
before update on public.habit_logs
for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

-- Correct, non-fragile aggregate. Streaks require frequency-aware date logic and
-- are computed in the service layer from habit_logs; this view exposes the plain
-- roll-ups (totals, first/last completion) that need no such logic.
create view public.habit_completion_totals
with (security_invoker = true)
as
select
  habit.id as habit_id,
  habit.user_id,
  count(log.id) filter (where log.completed) as completed_count,
  max(log.log_date) filter (where log.completed) as last_completed_on,
  min(log.log_date) filter (where log.completed) as first_completed_on
from public.habits as habit
left join public.habit_logs as log on log.habit_id = habit.id
group by habit.id, habit.user_id;
