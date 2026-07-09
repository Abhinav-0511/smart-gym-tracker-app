-- Allow a set to be dropped from an in-progress or completed workout
-- session, matching the equivalent plan-editing capability.

alter table public.workout_session_sets
  drop constraint workout_session_sets_workout_session_exercise_id_set_number_key,
  add constraint workout_session_sets_exercise_number_unique
    unique (workout_session_exercise_id, set_number)
    deferrable initially immediate;

create or replace function public.remove_workout_session_set(
  p_session_id uuid,
  p_set_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  target_exercise_id uuid;
  edited_status text;
  remaining_sets integer;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select session_set.workout_session_exercise_id, session.status
  into target_exercise_id, edited_status
  from public.workout_session_sets as session_set
  join public.workout_session_exercises as session_exercise
    on session_exercise.id = session_set.workout_session_exercise_id
  join public.workout_sessions as session
    on session.id = session_exercise.workout_session_id
  where session_set.id = p_set_id
    and session.id = p_session_id
    and session.user_id = request_user_id
    and session.status in ('in_progress', 'completed')
  for update of session_exercise;

  if not found then
    raise exception 'Workout set is not part of an active session.'
      using errcode = 'P0002';
  end if;

  select count(*) into remaining_sets
  from public.workout_session_sets
  where workout_session_exercise_id = target_exercise_id;

  if remaining_sets <= 1 then
    raise exception 'An exercise must keep at least one set.'
      using errcode = '23514';
  end if;

  delete from public.workout_session_sets where id = p_set_id;

  set constraints workout_session_sets_exercise_number_unique deferred;
  update public.workout_session_sets as session_set
  set set_number = numbered.new_number
  from (
    select id, row_number() over (order by set_number, id)::integer as new_number
    from public.workout_session_sets
    where workout_session_exercise_id = target_exercise_id
  ) as numbered
  where session_set.id = numbered.id;

  if edited_status = 'completed' then
    delete from public.personal_records
    where user_id = request_user_id and source = 'auto';
    perform public.fittrack_reconcile_personal_records(request_user_id);
    perform public.fittrack_reconcile_achievements(request_user_id);
  end if;

  return true;
end;
$$;

revoke execute on function public.remove_workout_session_set(uuid, uuid)
from public, anon;
grant execute on function public.remove_workout_session_set(uuid, uuid)
to authenticated;
