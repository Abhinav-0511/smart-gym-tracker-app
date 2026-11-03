import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/types/database";
import { addDays, parseDateKey, toDateKey } from "@/features/finance/lib/dates";
import { throwIfError } from "@/features/finance/services/errors";
import { createTransaction } from "@/features/finance/services/transactions";
import type { LocalRow } from "@/offline/db";
import {
  localDelete,
  localInsert,
  localRowsByUser,
  localUpdate,
  pullMirror,
} from "@/offline/repository";
import type { PaymentMethod } from "@/features/finance/types/common";
import type {
  CreateRecurringInput,
  RecurringFrequency,
  RecurringTransaction,
  RecurringType,
  UpdateRecurringInput,
} from "@/features/finance/types/recurring";
import type { Transaction } from "@/features/finance/types/transaction";

function mapRecurring(row: Tables<"recurring_transactions">): RecurringTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    categoryId: row.category_id,
    type: row.type as RecurringType,
    amount: row.amount,
    title: row.title,
    paymentMethod: row.payment_method as PaymentMethod,
    frequency: row.frequency as RecurringFrequency,
    nextRunOn: row.next_run_on,
    startOn: row.start_on,
    endOn: row.end_on,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Advance a date key by one interval of the given frequency (UTC, day-clamped). */
export function advanceRecurrence(dateKey: string, frequency: RecurringFrequency): string {
  if (frequency === "weekly") return addDays(dateKey, 7);
  const monthsToAdd = frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12;
  const date = parseDateKey(dateKey);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + monthsToAdd);
  const daysInTarget = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, daysInTarget));
  return toDateKey(date);
}

async function fetchServerRecurringRows(userId: string): Promise<LocalRow[]> {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("user_id", userId);
  throwIfError(error);
  return (data ?? []) as unknown as LocalRow[];
}

export async function fetchRecurringTransactions(
  userId: string,
): Promise<RecurringTransaction[]> {
  await pullMirror("recurring_transactions", () => fetchServerRecurringRows(userId));

  const rows = await localRowsByUser("recurring_transactions", userId);
  rows.sort((a, b) =>
    ((a.next_run_on as string) ?? "").localeCompare((b.next_run_on as string) ?? ""),
  );
  return rows.map((row) => mapRecurring(row as unknown as Tables<"recurring_transactions">));
}

export async function createRecurring(
  userId: string,
  input: CreateRecurringInput,
): Promise<RecurringTransaction> {
  const row = await localInsert(
    "recurring_transactions",
    {
      user_id: userId,
      account_id: input.accountId,
      category_id: input.categoryId,
      type: input.type,
      amount: input.amount,
      title: input.title.trim(),
      payment_method: input.paymentMethod,
      frequency: input.frequency,
      next_run_on: input.nextRunOn,
      start_on: input.startOn ?? input.nextRunOn,
      end_on: input.endOn ?? null,
      notes: input.notes?.trim() || null,
      is_active: true,
    },
    userId,
  );
  return mapRecurring(row as unknown as Tables<"recurring_transactions">);
}

export async function updateRecurring(
  recurringId: string,
  input: UpdateRecurringInput,
): Promise<RecurringTransaction> {
  const patch: TablesUpdate<"recurring_transactions"> = {};
  if (input.accountId !== undefined) patch.account_id = input.accountId;
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.type !== undefined) patch.type = input.type;
  if (input.amount !== undefined) patch.amount = input.amount;
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.paymentMethod !== undefined) patch.payment_method = input.paymentMethod;
  if (input.frequency !== undefined) patch.frequency = input.frequency;
  if (input.nextRunOn !== undefined) patch.next_run_on = input.nextRunOn;
  if (input.startOn !== undefined) patch.start_on = input.startOn;
  if (input.endOn !== undefined) patch.end_on = input.endOn;
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
  if (input.isActive !== undefined) patch.is_active = input.isActive;

  const row = await localUpdate("recurring_transactions", recurringId, patch);
  return mapRecurring(row as unknown as Tables<"recurring_transactions">);
}

export async function deleteRecurring(recurringId: string): Promise<void> {
  await localDelete("recurring_transactions", recurringId);
}

/**
 * Post a recurring template as a real transaction dated on its next run, then
 * advance next_run_on. If the advanced date passes end_on, the template is
 * deactivated. Returns the created transaction.
 */
export async function postRecurringOccurrence(
  userId: string,
  recurring: RecurringTransaction,
): Promise<Transaction> {
  const transaction = await createTransaction(userId, {
    type: recurring.type,
    amount: recurring.amount,
    title: recurring.title,
    categoryId: recurring.categoryId,
    accountId: recurring.accountId,
    paymentMethod: recurring.paymentMethod,
    occurredOn: recurring.nextRunOn,
    recurringTransactionId: recurring.id,
    notes: recurring.notes,
  });

  const nextRun = advanceRecurrence(recurring.nextRunOn, recurring.frequency);
  const passedEnd = recurring.endOn !== null && nextRun > recurring.endOn;

  await updateRecurring(recurring.id, {
    nextRunOn: nextRun,
    isActive: !passedEnd,
  });

  return transaction;
}
