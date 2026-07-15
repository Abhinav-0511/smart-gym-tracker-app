-- RLS for support_tickets + feedback, plus an admin read policy on profiles.
-- Users are scoped to their own rows; admins (public.is_admin()) get a wider,
-- read/triage view. This is the real security boundary — the client route guard
-- is only UX.

alter table public.support_tickets enable row level security;
alter table public.feedback enable row level security;

-- --- support_tickets ------------------------------------------------------
-- Users can create and read their own tickets (so they can see admin replies /
-- status), but cannot modify them after submission.
create policy "Users can create their own support tickets"
on public.support_tickets
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can read their own support tickets"
on public.support_tickets
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Admins can read every ticket and update status / reply.
create policy "Admins can read all support tickets"
on public.support_tickets
for select
to authenticated
using (public.is_admin());

create policy "Admins can update support tickets"
on public.support_tickets
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- --- feedback -------------------------------------------------------------
create policy "Users can create their own feedback"
on public.feedback
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can read their own feedback"
on public.feedback
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Admins can read all feedback"
on public.feedback
for select
to authenticated
using (public.is_admin());

-- --- profiles: admin read -------------------------------------------------
-- Alongside the existing owner "for all" policy, admins may read every profile
-- (permissive policies combine with OR). Admins still cannot write other users'
-- profiles — no admin update/insert policy is granted.
create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

grant select, insert, update, delete on public.support_tickets to authenticated;
grant select, insert, update, delete on public.feedback to authenticated;
