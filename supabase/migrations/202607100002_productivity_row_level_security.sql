-- RLS for the Productivity workspace. Every row is isolated by auth.uid();
-- habit_logs additionally validate that the referenced habit is owned by the
-- same user, mirroring how session children validate their parent's ownership.

alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.tasks enable row level security;
alter table public.productivity_notifications enable row level security;

create policy "Users can manage their own habits"
on public.habits
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage their own habit logs"
on public.habit_logs
for all
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.habits
    where habits.id = habit_logs.habit_id
      and habits.user_id = (select auth.uid())
  )
);

create policy "Users can manage their own tasks"
on public.tasks
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage their own productivity notifications"
on public.productivity_notifications
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.habits to authenticated;
grant select, insert, update, delete on public.habit_logs to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.productivity_notifications to authenticated;

-- The aggregate view runs with the querying user's privileges (security_invoker),
-- so the underlying habits/habit_logs RLS still applies to every read.
grant select on public.habit_completion_totals to authenticated;
