-- Phase 11: persistent, user-owned in-app notifications.
-- Notifications are emitted from authoritative database changes so retries and
-- alternate clients cannot bypass or duplicate them.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'workout_reminder', 'workout_started', 'workout_completed',
    'workout_cancelled', 'personal_record', 'achievement_unlocked',
    'profile_updated', 'avatar_updated', 'plan_created', 'plan_deleted',
    'plan_activated', 'exercise_added', 'exercise_removed',
    'exercise_created', 'weekly_summary', 'system'
  )),
  title text not null check (char_length(trim(title)) between 1 and 120),
  message text not null check (char_length(trim(message)) between 1 and 500),
  icon text not null check (char_length(trim(icon)) between 1 and 40),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  action_url text check (
    action_url is null
    or (
      action_url in ('/', '/workout', '/plan', '/prs', '/progress', '/profile')
    )
  ),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  dedupe_key text check (
    dedupe_key is null or char_length(trim(dedupe_key)) between 1 and 200
  ),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc, id desc);

create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create unique index notifications_user_dedupe_idx
  on public.notifications (user_id, dedupe_key)
  where dedupe_key is not null;

alter table public.notifications enable row level security;
alter table public.notifications replica identity full;

create policy "Users can read their own notifications"
on public.notifications for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can mark their own notifications read"
on public.notifications for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own notifications"
on public.notifications for delete to authenticated
using ((select auth.uid()) = user_id);

grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
revoke insert on public.notifications from anon, authenticated;

create or replace function public.fittrack_create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_icon text,
  p_priority text default 'normal',
  p_action_url text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_dedupe_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_id uuid;
begin
  if p_user_id is null then
    return null;
  end if;

  insert into public.notifications (
    user_id, type, title, message, icon, priority, action_url, metadata, dedupe_key
  )
  values (
    p_user_id, p_type, trim(p_title), trim(p_message), p_icon, p_priority,
    p_action_url, coalesce(p_metadata, '{}'::jsonb), p_dedupe_key
  )
  on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing
  returning id into notification_id;

  return notification_id;
end;
$$;

revoke all on function public.fittrack_create_notification(
  uuid, text, text, text, text, text, text, jsonb, text
) from public, anon, authenticated;

create or replace function public.notify_workout_session_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.status = 'in_progress' then
    perform public.fittrack_create_notification(
      new.user_id, 'workout_started', 'Workout started',
      new.title || ' is ready to continue.', 'dumbbell', 'normal', '/workout',
      jsonb_build_object('session_id', new.id),
      'workout-started:' || new.id::text
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'completed' then
      perform public.fittrack_create_notification(
        new.user_id, 'workout_completed', 'Workout complete',
        'Great work finishing ' || new.title || '.', 'circle-check', 'normal', '/workout',
        jsonb_build_object('session_id', new.id),
        'workout-completed:' || new.id::text
      );
    elsif new.status = 'cancelled' then
      perform public.fittrack_create_notification(
        new.user_id, 'workout_cancelled', 'Workout cancelled',
        new.title || ' was cancelled.', 'circle-x', 'low', '/workout',
        jsonb_build_object('session_id', new.id),
        'workout-cancelled:' || new.id::text
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger workout_sessions_create_notifications
after insert or update of status on public.workout_sessions
for each row execute function public.notify_workout_session_change();

create or replace function public.notify_personal_record_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  exercise_name text;
begin
  select exercise.name into exercise_name
  from public.exercise_catalog as exercise where exercise.id = new.exercise_id;

  perform public.fittrack_create_notification(
    new.user_id, 'personal_record', 'New personal record',
    coalesce(exercise_name, 'Exercise') || ': ' || new.weight_kg::text || ' kg.',
    'trophy', 'high', '/prs',
    jsonb_build_object('record_id', new.id, 'exercise_id', new.exercise_id),
    'personal-record:' || new.id::text
  );
  return new;
end;
$$;

create trigger personal_records_create_notifications
after insert on public.personal_records
for each row execute function public.notify_personal_record_created();

create or replace function public.notify_achievement_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.fittrack_create_notification(
    new.user_id, 'achievement_unlocked', 'Achievement unlocked',
    initcap(replace(new.achievement_key, '_', ' ')) || ' is now yours.',
    'award', 'high', '/',
    jsonb_build_object('achievement_key', new.achievement_key),
    'achievement:' || new.id::text
  );
  return new;
end;
$$;

create trigger user_achievements_create_notifications
after insert on public.user_achievements
for each row execute function public.notify_achievement_created();

create or replace function public.notify_workout_plan_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.fittrack_create_notification(
      new.user_id, 'plan_created', 'Workout plan created',
      new.name || ' is ready to build.', 'clipboard-plus', 'normal', '/plan',
      jsonb_build_object('plan_id', new.id), 'plan-created:' || new.id::text
    );
    return new;
  elsif tg_op = 'DELETE' then
    perform public.fittrack_create_notification(
      old.user_id, 'plan_deleted', 'Workout plan deleted',
      old.name || ' was removed.', 'trash-2', 'low', '/plan',
      jsonb_build_object('plan_id', old.id), 'plan-deleted:' || old.id::text
    );
    return old;
  elsif new.is_active and not old.is_active then
    perform public.fittrack_create_notification(
      new.user_id, 'plan_activated', 'Active plan changed',
      new.name || ' is now your active plan.', 'circle-check', 'normal', '/plan',
      jsonb_build_object('plan_id', new.id),
      'plan-activated:' || new.id::text || ':' || new.updated_at::text
    );
  end if;
  return new;
end;
$$;

create trigger workout_plans_create_notifications
after insert or update of is_active or delete on public.workout_plans
for each row execute function public.notify_workout_plan_change();

create or replace function public.notify_plan_exercise_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  exercise_name text;
  event_row public.workout_plan_exercises%rowtype;
begin
  if tg_op = 'DELETE' then
    event_row := old;
  else
    event_row := new;
  end if;

  select plan.user_id, exercise.name
    into target_user_id, exercise_name
  from public.workout_plan_days as day
  join public.workout_plans as plan on plan.id = day.workout_plan_id
  join public.exercise_catalog as exercise on exercise.id = event_row.exercise_id
  where day.id = event_row.workout_plan_day_id;

  if target_user_id is not null then
    perform public.fittrack_create_notification(
      target_user_id,
      case when tg_op = 'DELETE' then 'exercise_removed' else 'exercise_added' end,
      case when tg_op = 'DELETE' then 'Exercise removed' else 'Exercise added' end,
      coalesce(exercise_name, 'Exercise') ||
        case when tg_op = 'DELETE' then ' was removed from your plan.' else ' was added to your plan.' end,
      case when tg_op = 'DELETE' then 'minus-circle' else 'plus-circle' end,
      'low', '/plan',
      jsonb_build_object('plan_exercise_id', event_row.id),
      lower(replace(tg_op, 'INSERT', 'added')) || ':plan-exercise:' || event_row.id::text
    );
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger workout_plan_exercises_create_notifications
after insert or delete on public.workout_plan_exercises
for each row execute function public.notify_plan_exercise_change();

create or replace function public.notify_profile_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.avatar_url is distinct from new.avatar_url then
    perform public.fittrack_create_notification(
      new.id, 'avatar_updated', 'Avatar updated',
      'Your new profile photo is live.', 'image', 'low', '/profile',
      '{}'::jsonb, 'avatar-updated:' || new.updated_at::text
    );
  end if;

  if row(
    old.full_name, old.fitness_goal, old.experience_level,
    old.height_cm, old.timezone, old.theme
  ) is distinct from row(
    new.full_name, new.fitness_goal, new.experience_level,
    new.height_cm, new.timezone, new.theme
  ) then
    perform public.fittrack_create_notification(
      new.id, 'profile_updated', 'Profile updated',
      'Your profile changes were saved.', 'user-check', 'low', '/profile',
      '{}'::jsonb, 'profile-updated:' || new.updated_at::text
    );
  end if;
  return new;
end;
$$;

create trigger profiles_create_notifications
after update on public.profiles
for each row execute function public.notify_profile_change();

create or replace function public.notify_custom_exercise_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := auth.uid();
begin
  if request_user_id is not null then
    perform public.fittrack_create_notification(
      request_user_id, 'exercise_created', 'Custom exercise created',
      new.name || ' was added to the exercise catalog.', 'sparkles', 'normal', '/plan',
      jsonb_build_object('exercise_id', new.id),
      'exercise-created:' || new.id::text
    );
  end if;
  return new;
end;
$$;

create trigger exercise_catalog_create_notifications
after insert on public.exercise_catalog
for each row execute function public.notify_custom_exercise_created();

-- Supabase Realtime delivers inserts/updates/deletes to the owning client. RLS
-- is still applied before a row is delivered.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
