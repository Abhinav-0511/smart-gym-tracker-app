-- RLS for the Personal Finance workspace. Every row is isolated by auth.uid().
-- Child records (transactions, recurring templates, budgets) additionally verify
-- that any referenced account/category is owned by the same user, mirroring how
-- the Productivity habit_logs validate their parent's ownership.

alter table public.finance_accounts enable row level security;
alter table public.transaction_categories enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;

create policy "Users can manage their own finance accounts"
on public.finance_accounts
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage their own transaction categories"
on public.transaction_categories
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage their own recurring transactions"
on public.recurring_transactions
for all
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    account_id is null
    or exists (
      select 1 from public.finance_accounts a
      where a.id = recurring_transactions.account_id and a.user_id = (select auth.uid())
    )
  )
  and (
    category_id is null
    or exists (
      select 1 from public.transaction_categories c
      where c.id = recurring_transactions.category_id and c.user_id = (select auth.uid())
    )
  )
);

create policy "Users can manage their own transactions"
on public.transactions
for all
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    account_id is null
    or exists (
      select 1 from public.finance_accounts a
      where a.id = transactions.account_id and a.user_id = (select auth.uid())
    )
  )
  and (
    category_id is null
    or exists (
      select 1 from public.transaction_categories c
      where c.id = transactions.category_id and c.user_id = (select auth.uid())
    )
  )
);

create policy "Users can manage their own budgets"
on public.budgets
for all
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    category_id is null
    or exists (
      select 1 from public.transaction_categories c
      where c.id = budgets.category_id and c.user_id = (select auth.uid())
    )
  )
);

create policy "Users can manage their own savings goals"
on public.savings_goals
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.finance_accounts to authenticated;
grant select, insert, update, delete on public.transaction_categories to authenticated;
grant select, insert, update, delete on public.recurring_transactions to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.budgets to authenticated;
grant select, insert, update, delete on public.savings_goals to authenticated;
