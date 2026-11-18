// Persists the in-progress "New Transaction" form so it survives the OS
// discarding the installed PWA while the user is in another app. Cleared on
// submit or an explicit close, so it only ever represents an interrupted entry.

const KEY = "lifetrack.finance.transaction-draft";

export interface TransactionDraft {
  /** Route the form was open on; the draft is only restored there. */
  path: string;
  type: string;
  amount: string;
  title: string;
  categoryText: string;
  accountId: string;
  transferAccountId: string;
  paymentMethod: string;
  occurredOn: string;
  occurredAt: string;
  notes: string;
  tags: string;
}

export function saveTransactionDraft(draft: TransactionDraft): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage unavailable — the form still works, it just isn't recoverable.
  }
}

export function readTransactionDraft(path: string): TransactionDraft | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as TransactionDraft;
    return draft && draft.path === path ? draft : null;
  } catch {
    return null;
  }
}

export function clearTransactionDraft(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
