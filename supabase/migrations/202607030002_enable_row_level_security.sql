-- RLS is enabled on every public table. Shared exercises are read-only for
-- authenticated users; all remaining records are isolated by auth.uid().

alter table public.profiles enable row level security;
alter table public.exercise_catalog enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_plan_days enable row level security;
alter table public.workout_plan_exercises enable row level security;
alter table public.workout_plan_sets enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_session_exercises enable row level security;
alter table public.workout_session_sets enable row level security;
alter table public.body_weight_entries enable row level security;
alter table public.personal_records enable row level security;
alter table public.user_achievements enable row level security;

create policy "Authenticated users can read exercises"
on public.exercise_catalog
for select
to authenticated
using (true);

create policy "Users can manage their own profile"
on public.profiles
for all
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can manage their own plans"
on public.workout_plans
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage days in their own plans"
on public.workout_plan_days
for all
to authenticated
using (
  exists (
    select 1
    from public.workout_plans
    where workout_plans.id = workout_plan_days.workout_plan_id
      and workout_plans.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workout_plans
    where workout_plans.id = workout_plan_days.workout_plan_id
      and workout_plans.user_id = (select auth.uid())
  )
);

create policy "Users can manage exercises in their own plan days"
on public.workout_plan_exercises
for all
to authenticated
using (
  exists (
    select 1
    from public.workout_plan_days
    join public.workout_plans
      on workout_plans.id = workout_plan_days.workout_plan_id
    where workout_plan_days.id = workout_plan_exercises.workout_plan_day_id
      and workout_plans.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workout_plan_days
    join public.workout_plans
      on workout_plans.id = workout_plan_days.workout_plan_id
    where workout_plan_days.id = workout_plan_exercises.workout_plan_day_id
      and workout_plans.user_id = (select auth.uid())
  )
);

create policy "Users can manage sets in their own plan exercises"
on public.workout_plan_sets
for all
to authenticated
using (
  exists (
    select 1
    from public.workout_plan_exercises
    join public.workout_plan_days
      on workout_plan_days.id = workout_plan_exercises.workout_plan_day_id
    join public.workout_plans
      on workout_plans.id = workout_plan_days.workout_plan_id
    where workout_plan_exercises.id = workout_plan_sets.workout_plan_exercise_id
      and workout_plans.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workout_plan_exercises
    join public.workout_plan_days
      on workout_plan_days.id = workout_plan_exercises.workout_plan_day_id
    join public.workout_plans
      on workout_plans.id = workout_plan_days.workout_plan_id
    where workout_plan_exercises.id = workout_plan_sets.workout_plan_exercise_id
      and workout_plans.user_id = (select auth.uid())
  )
);

create policy "Users can manage their own workout sessions"
on public.workout_sessions
for all
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    workout_plan_day_id is null
    or exists (
      select 1
      from public.workout_plan_days
      join public.workout_plans
        on workout_plans.id = workout_plan_days.workout_plan_id
      where workout_plan_days.id = workout_sessions.workout_plan_day_id
        and workout_plans.user_id = (select auth.uid())
    )
  )
);

create policy "Users can manage exercises in their own sessions"
on public.workout_session_exercises
for all
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions
    where workout_sessions.id = workout_session_exercises.workout_session_id
      and workout_sessions.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workout_sessions
    where workout_sessions.id = workout_session_exercises.workout_session_id
      and workout_sessions.user_id = (select auth.uid())
  )
  and (
    workout_plan_exercise_id is null
    or exists (
      select 1
      from public.workout_plan_exercises
      join public.workout_plan_days
        on workout_plan_days.id = workout_plan_exercises.workout_plan_day_id
      join public.workout_plans
        on workout_plans.id = workout_plan_days.workout_plan_id
      where workout_plan_exercises.id = workout_session_exercises.workout_plan_exercise_id
        and workout_plans.user_id = (select auth.uid())
    )
  )
);

create policy "Users can manage sets in their own session exercises"
on public.workout_session_sets
for all
to authenticated
using (
  exists (
    select 1
    from public.workout_session_exercises
    join public.workout_sessions
      on workout_sessions.id = workout_session_exercises.workout_session_id
    where workout_session_exercises.id = workout_session_sets.workout_session_exercise_id
      and workout_sessions.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workout_session_exercises
    join public.workout_sessions
      on workout_sessions.id = workout_session_exercises.workout_session_id
    where workout_session_exercises.id = workout_session_sets.workout_session_exercise_id
      and workout_sessions.user_id = (select auth.uid())
  )
);

create policy "Users can manage their own body weight entries"
on public.body_weight_entries
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage their own personal records"
on public.personal_records
for all
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    workout_session_set_id is null
    or exists (
      select 1
      from public.workout_session_sets
      join public.workout_session_exercises
        on workout_session_exercises.id = workout_session_sets.workout_session_exercise_id
      join public.workout_sessions
        on workout_sessions.id = workout_session_exercises.workout_session_id
      where workout_session_sets.id = personal_records.workout_session_set_id
        and workout_sessions.user_id = (select auth.uid())
    )
  )
);

create policy "Users can manage their own achievement unlocks"
on public.user_achievements
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select on public.exercise_catalog to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.workout_plans to authenticated;
grant select, insert, update, delete on public.workout_plan_days to authenticated;
grant select, insert, update, delete on public.workout_plan_exercises to authenticated;
grant select, insert, update, delete on public.workout_plan_sets to authenticated;
grant select, insert, update, delete on public.workout_sessions to authenticated;
grant select, insert, update, delete on public.workout_session_exercises to authenticated;
grant select, insert, update, delete on public.workout_session_sets to authenticated;
grant select, insert, update, delete on public.body_weight_entries to authenticated;
grant select, insert, update, delete on public.personal_records to authenticated;
grant select, insert, update, delete on public.user_achievements to authenticated;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
