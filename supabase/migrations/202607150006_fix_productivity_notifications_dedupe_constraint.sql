-- Fix productivity_notifications upsert dedupe.
--
-- The original schema deduplicated notifications with a *partial* unique index:
--
--   create unique index productivity_notifications_user_dedupe_idx
--     on public.productivity_notifications (user_id, dedupe_key)
--     where dedupe_key is not null;
--
-- The service upserts with `onConflict: "user_id,dedupe_key"`. PostgreSQL's
-- ON CONFLICT inference cannot match a partial index unless the statement
-- repeats the index predicate, and PostgREST offers no way to attach that
-- predicate. Every insert therefore failed with:
--   "there is no unique or exclusion constraint matching the ON CONFLICT
--    specification" (400 Bad Request).
--
-- Replace the partial index with a full unique constraint on the same columns.
-- NULLs are distinct by default in Postgres, so notifications without a
-- dedupe_key (e.g. per-task reminders) can still be inserted freely, while
-- ON CONFLICT inference now works for the deduplicated ones.

drop index if exists public.productivity_notifications_user_dedupe_idx;

alter table public.productivity_notifications
  add constraint productivity_notifications_user_dedupe_key
  unique (user_id, dedupe_key);
