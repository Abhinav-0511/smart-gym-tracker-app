import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/types/database";
import { throwIfError } from "@/features/finance/services/errors";
import type {
  AccountType,
  CreateAccountInput,
  FinanceAccount,
  UpdateAccountInput,
} from "@/features/finance/types/account";
import type { FinanceColor } from "@/features/finance/types/common";

function mapAccount(row: Tables<"finance_accounts">): FinanceAccount {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type as AccountType,
    currency: row.currency,
    initialBalance: row.initial_balance,
    icon: row.icon,
    color: row.color as FinanceColor,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchAccounts(userId: string): Promise<FinanceAccount[]> {
  const { data, error } = await supabase
    .from("finance_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  throwIfError(error);
  return (data ?? []).map(mapAccount);
}

export async function createAccount(
  userId: string,
  input: CreateAccountInput,
): Promise<FinanceAccount> {
  const { data, error } = await supabase
    .from("finance_accounts")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      type: input.type,
      currency: input.currency.toUpperCase(),
      initial_balance: input.initialBalance,
      icon: input.icon,
      color: input.color,
    })
    .select("*")
    .single();

  throwIfError(error);
  return mapAccount(data as Tables<"finance_accounts">);
}

export async function updateAccount(
  accountId: string,
  input: UpdateAccountInput,
): Promise<FinanceAccount> {
  const patch: TablesUpdate<"finance_accounts"> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.type !== undefined) patch.type = input.type;
  if (input.currency !== undefined) patch.currency = input.currency.toUpperCase();
  if (input.initialBalance !== undefined) patch.initial_balance = input.initialBalance;
  if (input.icon !== undefined) patch.icon = input.icon;
  if (input.color !== undefined) patch.color = input.color;
  if (input.isArchived !== undefined) patch.is_archived = input.isArchived;

  const { data, error } = await supabase
    .from("finance_accounts")
    .update(patch)
    .eq("id", accountId)
    .select("*")
    .single();

  throwIfError(error);
  return mapAccount(data as Tables<"finance_accounts">);
}

export async function deleteAccount(accountId: string): Promise<void> {
  const { error } = await supabase.from("finance_accounts").delete().eq("id", accountId);
  throwIfError(error);
}
