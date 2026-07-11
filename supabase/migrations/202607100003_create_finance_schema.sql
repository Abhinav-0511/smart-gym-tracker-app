-- Personal Finance workspace schema: accounts, categories, transactions,
-- recurring templates, budgets, and savings goals. Consistent with the Fitness
-- and Productivity schemas, derived aggregates (account balances, budget spend,
-- monthly reports, savings completion %) are computed in the service/lib layer
-- from these source records rather than stored, so they never drift.
--
-- Notes on the spec's suggested tables that are intentionally NOT materialised:
--   * budget_progress  -> derived from transactions in budget-progress.ts
--   * monthly_reports   -> derived from transactions in analytics.ts
--   * payment_methods   -> a fixed catalogue enforced by a CHECK constraint
--                          (see the payment_method columns) and mirrored in TS.

-- ---------------------------------------------------------------------------
-- Accounts (cash, bank, cards, wallets). A user's real-world money buckets.
-- ---------------------------------------------------------------------------
create table public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  type text not null default 'bank' check (
    type in ('cash', 'bank', 'credit_card', 'wallet', 'other')
  ),
  currency char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  -- Opening balance; the live balance is initial_balance + net of transactions,
  -- computed in the service layer.
  initial_balance numeric(14, 2) not null default 0,
  icon text not null default 'wallet' check (char_length(trim(icon)) between 1 and 40),
  color text not null default 'blue' check (
    color in (
      'slate', 'blue', 'indigo', 'violet', 'purple', 'pink', 'rose', 'red',
      'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan'
    )
  ),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index finance_accounts_user_idx
  on public.finance_accounts (user_id, is_archived, created_at);

-- ---------------------------------------------------------------------------
-- Categories. A blend of seeded defaults (is_default) and user-created ones.
-- Defaults are seeded idempotently by the client on first load, keeping every
-- category a real, owned row that transactions can reference cleanly.
-- ---------------------------------------------------------------------------
create table public.transaction_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  slug text not null check (char_length(trim(slug)) between 1 and 60),
  kind text not null check (kind in ('income', 'expense')),
  icon text not null default 'circle' check (char_length(trim(icon)) between 1 and 40),
  color text not null default 'slate' check (
    color in (
      'slate', 'blue', 'indigo', 'violet', 'purple', 'pink', 'rose', 'red',
      'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan'
    )
  ),
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A slug is unique per user per kind; the same idea can exist as both an
  -- income and an expense category (e.g. "gift").
  unique (user_id, kind, slug)
);

create index transaction_categories_user_kind_idx
  on public.transaction_categories (user_id, kind, sort_order);

-- ---------------------------------------------------------------------------
-- Recurring transaction templates (salary, rent, subscriptions, …). These are
-- the source of the dashboard's "upcoming bills"; posting one creates a real
-- transaction that links back via recurring_transaction_id.
-- ---------------------------------------------------------------------------
create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.finance_accounts(id) on delete set null,
  category_id uuid references public.transaction_categories(id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  title text not null check (char_length(trim(title)) between 1 and 120),
  payment_method text not null default 'cash' check (
    payment_method in (
      'cash', 'upi', 'debit_card', 'credit_card',
      'bank_transfer', 'digital_wallet', 'other'
    )
  ),
  frequency text not null check (
    frequency in ('weekly', 'monthly', 'quarterly', 'yearly')
  ),
  next_run_on date not null default current_date,
  start_on date not null default current_date,
  end_on date,
  notes text check (notes is null or char_length(notes) <= 2000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_on is null or end_on >= start_on)
);

create index recurring_transactions_user_idx
  on public.recurring_transactions (user_id, is_active, next_run_on);

-- ---------------------------------------------------------------------------
-- Transactions: the heart of the module. Income, expense, or transfer.
-- ---------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.finance_accounts(id) on delete set null,
  category_id uuid references public.transaction_categories(id) on delete set null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(14, 2) not null check (amount > 0),
  title text not null check (char_length(trim(title)) between 1 and 120),
  notes text check (notes is null or char_length(notes) <= 2000),
  payment_method text not null default 'cash' check (
    payment_method in (
      'cash', 'upi', 'debit_card', 'credit_card',
      'bank_transfer', 'digital_wallet', 'other'
    )
  ),
  occurred_on date not null default current_date,
  occurred_at time,
  tags text[] not null default '{}'::text[] check (
    array_length(tags, 1) is null or array_length(tags, 1) <= 20
  ),
  receipt_url text check (receipt_url is null or char_length(receipt_url) <= 500),
  -- Destination account for a 'transfer'. Required only for transfers.
  transfer_account_id uuid references public.finance_accounts(id) on delete set null,
  recurring_transaction_id uuid references public.recurring_transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (type <> 'transfer' or transfer_account_id is not null)
);

create index transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc, created_at desc);

create index transactions_user_type_date_idx
  on public.transactions (user_id, type, occurred_on desc);

create index transactions_category_idx
  on public.transactions (category_id, occurred_on desc)
  where category_id is not null;

create index transactions_account_idx
  on public.transactions (account_id)
  where account_id is not null;

-- ---------------------------------------------------------------------------
-- Budgets. Monthly (or weekly/yearly) spend caps per category, or overall.
-- Spent / remaining / % are derived from transactions in the service layer.
-- ---------------------------------------------------------------------------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- NULL category => an overall spending budget across every expense category.
  category_id uuid references public.transaction_categories(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  amount numeric(14, 2) not null check (amount > 0),
  period text not null default 'monthly' check (period in ('weekly', 'monthly', 'yearly')),
  color text not null default 'blue' check (
    color in (
      'slate', 'blue', 'indigo', 'violet', 'purple', 'pink', 'rose', 'red',
      'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, period)
);

-- One overall (category-less) budget per period per user.
create unique index budgets_user_overall_idx
  on public.budgets (user_id, period)
  where category_id is null;

create index budgets_user_idx
  on public.budgets (user_id, period);

-- ---------------------------------------------------------------------------
-- Savings goals. current_amount is a running balance (add / withdraw funds);
-- completion %, remaining and projected date are derived.
-- ---------------------------------------------------------------------------
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  target_amount numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  icon text not null default 'piggy-bank' check (char_length(trim(icon)) between 1 and 40),
  color text not null default 'emerald' check (
    color in (
      'slate', 'blue', 'indigo', 'violet', 'purple', 'pink', 'rose', 'red',
      'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan'
    )
  ),
  target_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index savings_goals_user_idx
  on public.savings_goals (user_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at maintenance reuses the existing shared trigger function.
-- ---------------------------------------------------------------------------
create trigger finance_accounts_set_updated_at
before update on public.finance_accounts
for each row execute function public.set_updated_at();

create trigger transaction_categories_set_updated_at
before update on public.transaction_categories
for each row execute function public.set_updated_at();

create trigger recurring_transactions_set_updated_at
before update on public.recurring_transactions
for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create trigger budgets_set_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

create trigger savings_goals_set_updated_at
before update on public.savings_goals
for each row execute function public.set_updated_at();
