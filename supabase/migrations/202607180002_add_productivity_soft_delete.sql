-- Phase 5 (offline-first): soft-delete support for the productivity tables.
--
-- Same rationale as the finance soft-delete migration: deletions must propagate
-- as tombstones so a row removed on one device is not resurrected by a pull on
-- another. Only `tasks` and `habits` need it — `habit_logs` represents a
-- completion as a `completed` boolean toggle (undo sets it false), so it never
-- hard-deletes and needs no `deleted_at`.
--
-- Purely additive (nullable, default NULL, no backfill); setting `deleted_at` is
-- an UPDATE already covered by the existing owner RLS policies.

alter table public.tasks  add column if not exists deleted_at timestamptz;
alter table public.habits add column if not exists deleted_at timestamptz;

create index if not exists tasks_live_idx
  on public.tasks (user_id) where deleted_at is null;
create index if not exists habits_live_idx
  on public.habits (user_id) where deleted_at is null;
