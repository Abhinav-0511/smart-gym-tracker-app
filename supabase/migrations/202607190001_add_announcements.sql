-- Global announcements. Admins broadcast a message to every user; each user sees
-- a given announcement exactly once (on their next app start), then it is marked
-- read for them and never shown again.
--
--   * announcements       — the broadcast messages (admin-authored)
--   * announcement_views  — per-user "I have seen this" records (dedupe = shown once)
--
-- Reads/writes are guarded by RLS: any signed-in user can read active
-- announcements, only admins (public.is_admin()) can author or manage them, and
-- each user can only record/read their own views. Two SECURITY DEFINER helpers
-- keep the client flow to a single round-trip each.

-- ---------------------------------------------------------------------------
-- announcements: an admin-authored message shown to all users.
-- ---------------------------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  body text not null check (char_length(trim(body)) between 1 and 2000),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Latest active announcement lookups are the hot path (every app start).
create index announcements_active_idx
  on public.announcements (created_at desc)
  where is_active;

create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- announcement_views: one row per (announcement, user) once the user has seen it.
-- Its existence is what makes an announcement show only a single time.
-- ---------------------------------------------------------------------------
create table public.announcement_views (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

create index announcement_views_user_idx
  on public.announcement_views (user_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.announcements enable row level security;
alter table public.announcement_views enable row level security;

-- announcements: every signed-in user reads active ones; admins read all and are
-- the only ones who may create, edit or delete.
create policy "Anyone can read active announcements"
on public.announcements for select to authenticated
using (is_active or public.is_admin());

create policy "Admins can create announcements"
on public.announcements for insert to authenticated
with check (public.is_admin());

create policy "Admins can update announcements"
on public.announcements for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete announcements"
on public.announcements for delete to authenticated
using (public.is_admin());

-- announcement_views: each user only ever touches their own rows.
create policy "Users can read their own announcement views"
on public.announcement_views for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can record their own announcement views"
on public.announcement_views for insert to authenticated
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.announcements to authenticated;
grant select, insert on public.announcement_views to authenticated;

-- ---------------------------------------------------------------------------
-- get_unseen_announcement(): the single most recent active announcement the
-- current user has not yet seen, or NULL when there is none. Called once at app
-- start to decide whether to pop the announcement dialog.
-- ---------------------------------------------------------------------------
create or replace function public.get_unseen_announcement()
returns public.announcements
language sql
security definer
stable
set search_path = public
as $$
  select a.*
  from public.announcements a
  where a.is_active
    and not exists (
      select 1 from public.announcement_views v
      where v.announcement_id = a.id
        and v.user_id = auth.uid()
    )
  order by a.created_at desc
  limit 1;
$$;

grant execute on function public.get_unseen_announcement() to authenticated;

-- ---------------------------------------------------------------------------
-- mark_announcement_seen(): idempotently record that the current user has seen
-- an announcement, so it is never shown to them again.
-- ---------------------------------------------------------------------------
create or replace function public.mark_announcement_seen(p_announcement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_announcement_id is null then
    return;
  end if;

  insert into public.announcement_views (announcement_id, user_id)
  values (p_announcement_id, auth.uid())
  on conflict (announcement_id, user_id) do nothing;
end;
$$;

grant execute on function public.mark_announcement_seen(uuid) to authenticated;
