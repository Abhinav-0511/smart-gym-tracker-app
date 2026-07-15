-- Help Center + Admin foundation. Adds:
--   * profiles columns for admin role, onboarding state, and one-time milestones
--   * support_tickets and feedback tables (in-app support + feedback capture)
--   * public.is_admin() helper used by every admin RLS policy / RPC
--
-- Derived data (dashboard stats, user lists) is NOT materialised here; it is
-- computed on demand by the admin RPCs in a later migration, consistent with the
-- rest of the app where aggregates live in the service/RPC layer, never stored.

-- ---------------------------------------------------------------------------
-- profiles: admin flag, onboarding completion, and a small bag of one-time
-- milestone flags ("viewed_fitness_progress", "fitness_checklist_done", …).
-- milestones is a plain jsonb map of string -> bool, written idempotently.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists milestones jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- is_admin(): true when the current user's profile is flagged as admin. Marked
-- SECURITY DEFINER + STABLE so it can be called safely inside RLS policies
-- without recursing through profiles' own row-level security.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Support tickets. Users create their own; admins read/triage every ticket.
-- email is captured at submission time so support history survives account
-- email changes and is readable without a join.
-- ---------------------------------------------------------------------------
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null check (char_length(trim(email)) between 3 and 320),
  category text not null default 'question' check (
    category in ('question', 'bug', 'feature_request', 'other')
  ),
  subject text not null check (char_length(trim(subject)) between 1 and 160),
  description text not null check (char_length(trim(description)) between 1 and 5000),
  screenshot_url text check (screenshot_url is null or char_length(screenshot_url) <= 500),
  status text not null default 'open' check (
    status in ('open', 'in_progress', 'resolved', 'closed')
  ),
  admin_reply text check (admin_reply is null or char_length(admin_reply) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_tickets_user_idx
  on public.support_tickets (user_id, created_at desc);

create index support_tickets_status_idx
  on public.support_tickets (status, created_at desc);

create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Feedback. A lightweight rating + comment, tagged by module. Immutable once
-- submitted (no updated_at); admins read only.
-- ---------------------------------------------------------------------------
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null check (char_length(trim(email)) between 3 and 320),
  rating smallint not null check (rating between 1 and 5),
  module text not null default 'general' check (
    module in ('fitness', 'productivity', 'finance', 'general')
  ),
  comment text check (comment is null or char_length(comment) <= 2000),
  created_at timestamptz not null default now()
);

create index feedback_created_idx on public.feedback (created_at desc);
create index feedback_rating_idx on public.feedback (rating, created_at desc);
create index feedback_module_idx on public.feedback (module, created_at desc);
