import { db } from "../db";
import { createId } from "../utils/id";
import { TransactionRow, TransactionType } from "./types";

export function createTransaction(input: {
  type: TransactionType;
  amountCents: number;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  description?: string;
  metadata?: Record<string, unknown>;
}): TransactionRow {
  const id = createId("txn");
  db.prepare(
    `INSERT INTO transactions
      (id, type, status, amount_cents, description, metadata, completed_at, from_account_id, to_account_id)
     VALUES (?, ?, 'COMPLETED', ?, ?, ?, datetime('now'), ?, ?)`
  ).run(
    id,
    input.type,
    input.amountCents,
    input.description ?? null,
    input.metadata ? JSON.stringify(input.metadata) : null,
    input.fromAccountId ?? null,
    input.toAccountId ?? null
  );
  return getTransactionById(id)!;
}

export function getTransactionById(id: string): TransactionRow | undefined {
  return db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(id) as
    | TransactionRow
    | undefined;
}

export function getHistoryForAccount(accountId: string, limit = 50): TransactionRow[] {
  return db
    .prepare(
      `SELECT * FROM transactions
       WHERE from_account_id = ? OR to_account_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(accountId, accountId, limit) as TransactionRow[];
}
