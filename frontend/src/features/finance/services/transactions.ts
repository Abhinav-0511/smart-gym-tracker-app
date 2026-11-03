import { supabase } from "@/lib/supabase";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { throwIfError } from "@/features/finance/services/errors";
import type { LocalRow } from "@/offline/db";
import {
  localDelete,
  localInsert,
  localRowsByUser,
  localUpdate,
  pullMirror,
} from "@/offline/repository";
import type {
  PaymentMethod,
  TransactionType,
} from "@/features/finance/types/common";
import type {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "@/features/finance/types/transaction";

/** Months of history loaded by default for dashboard + reports (trend needs ≥6). */
export const TRANSACTION_HISTORY_MONTHS = 13;

function mapTransaction(row: Tables<"transactions">): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    categoryId: row.category_id,
    type: row.type as TransactionType,
    amount: row.amount,
    title: row.title,
    notes: row.notes,
    paymentMethod: row.payment_method as PaymentMethod,
    occurredOn: row.occurred_on,
    occurredAt: row.occurred_at,
    tags: row.tags ?? [],
    receiptUrl: row.receipt_url,
    transferAccountId: row.transfer_account_id,
    recurringTransactionId: row.recurring_transaction_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface FetchTransactionsOptions {
  /** Inclusive lower bound (`YYYY-MM-DD`) on occurred_on. */
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

/** Raw server rows for the requested window (used to refresh the local mirror). */
async function fetchServerTransactionRows(
  userId: string,
  options: FetchTransactionsOptions,
): Promise<LocalRow[]> {
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (options.fromDate) query = query.gte("occurred_on", options.fromDate);
  if (options.toDate) query = query.lte("occurred_on", options.toDate);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []) as unknown as LocalRow[];
}

export async function fetchTransactions(
  userId: string,
  options: FetchTransactionsOptions = {},
): Promise<Transaction[]> {
  // Refresh the local cache from the server when online; read from Dexie always
  // so the result is identical online and offline.
  await pullMirror("transactions", () => fetchServerTransactionRows(userId, options));

  const rows = await localRowsByUser("transactions", userId);
  const windowed = rows.filter((row) => {
    const occurredOn = row.occurred_on as string;
    if (options.fromDate && occurredOn < options.fromDate) return false;
    if (options.toDate && occurredOn > options.toDate) return false;
    return true;
  });
  windowed.sort((a, b) => {
    const ao = a.occurred_on as string;
    const bo = b.occurred_on as string;
    if (ao !== bo) return ao < bo ? 1 : -1; // occurred_on desc
    const ac = (a.created_at as string) ?? "";
    const bc = (b.created_at as string) ?? "";
    return ac < bc ? 1 : -1; // created_at desc
  });
  const limited = options.limit ? windowed.slice(0, options.limit) : windowed;
  return limited.map((row) => mapTransaction(row as unknown as Tables<"transactions">));
}

function toInsertRow(
  userId: string,
  input: CreateTransactionInput,
): TablesInsert<"transactions"> {
  return {
    user_id: userId,
    account_id: input.accountId,
    category_id: input.type === "transfer" ? null : input.categoryId,
    type: input.type,
    amount: input.amount,
    title: input.title.trim(),
    notes: input.notes?.trim() || null,
    payment_method: input.paymentMethod,
    occurred_on: input.occurredOn,
    occurred_at: input.occurredAt || null,
    tags: input.tags ?? [],
    receipt_url: input.receiptUrl?.trim() || null,
    transfer_account_id: input.type === "transfer" ? input.transferAccountId ?? null : null,
    recurring_transaction_id: input.recurringTransactionId ?? null,
  };
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
): Promise<Transaction> {
  const row = await localInsert("transactions", toInsertRow(userId, input), userId);
  return mapTransaction(row as unknown as Tables<"transactions">);
}

export async function updateTransaction(
  transactionId: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const patch: TablesUpdate<"transactions"> = {};
  if (input.type !== undefined) patch.type = input.type;
  if (input.amount !== undefined) patch.amount = input.amount;
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.accountId !== undefined) patch.account_id = input.accountId;
  if (input.paymentMethod !== undefined) patch.payment_method = input.paymentMethod;
  if (input.occurredOn !== undefined) patch.occurred_on = input.occurredOn;
  if (input.occurredAt !== undefined) patch.occurred_at = input.occurredAt || null;
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.receiptUrl !== undefined) patch.receipt_url = input.receiptUrl?.trim() || null;
  if (input.transferAccountId !== undefined) patch.transfer_account_id = input.transferAccountId;

  const row = await localUpdate("transactions", transactionId, patch);
  return mapTransaction(row as unknown as Tables<"transactions">);
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  await localDelete("transactions", transactionId);
}
