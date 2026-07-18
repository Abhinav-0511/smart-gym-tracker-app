-- Phase 4b (offline-first): soft-delete support for the finance tables.
--
-- Offline sync needs deletions to propagate as tombstones so a row removed on
-- one device does not reappear on another after a pull. We add a nullable
-- `deleted_at` to each finance table. A NULL value means "live"; a timestamp
-- means "deleted at that instant". Reads filter out non-NULL rows; the sync
-- engine still pulls them so the tombstone can replicate.
--
-- This migration is purely additive (nullable column, default NULL, no backfill)
-- and safe to run on a live database. Setting `deleted_at` is an UPDATE, which is
-- already covered by each table's existing owner UPDATE RLS policy — no policy
-- changes required.

alter table public.transactions          add column if not exists deleted_at timestamptz;
alter table public.finance_accounts       add column if not exists deleted_at timestamptz;
alter table public.transaction_categories add column if not exists deleted_at timestamptz;
alter table public.recurring_transactions add column if not exists deleted_at timestamptz;
alter table public.budgets                add column if not exists deleted_at timestamptz;
alter table public.savings_goals          add column if not exists deleted_at timestamptz;

-- Partial indexes keep the common "live rows for a user" scans fast now that
-- every query carries a `deleted_at is null` predicate.
create index if not exists transactions_live_idx
  on public.transactions (user_id) where deleted_at is null;
create index if not exists finance_accounts_live_idx
  on public.finance_accounts (user_id) where deleted_at is null;
create index if not exists transaction_categories_live_idx
  on public.transaction_categories (user_id) where deleted_at is null;
create index if not exists recurring_transactions_live_idx
  on public.recurring_transactions (user_id) where deleted_at is null;
create index if not exists budgets_live_idx
  on public.budgets (user_id) where deleted_at is null;
create index if not exists savings_goals_live_idx
  on public.savings_goals (user_id) where deleted_at is null;
