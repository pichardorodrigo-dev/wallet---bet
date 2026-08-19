import { db } from "../db";
import { createId } from "../utils/id";
import { DepositIntentRow, PaymentProviderName, TransactionStatus } from "./types";

export function createDepositIntent(input: {
  amountCents: number;
  provider: PaymentProviderName;
  accountId: string;
}): DepositIntentRow {
  const id = createId("dep");
  db.prepare(
    `INSERT INTO deposit_intents (id, amount_cents, provider, status, account_id)
     VALUES (?, ?, ?, 'PENDING', ?)`
  ).run(id, input.amountCents, input.provider, input.accountId);
  return getDepositIntentById(id)!;
}

export function getDepositIntentById(id: string): DepositIntentRow | undefined {
  return db.prepare(`SELECT * FROM deposit_intents WHERE id = ?`).get(id) as
    | DepositIntentRow
    | undefined;
}

export function setDepositProviderRef(id: string, providerRef: string) {
  db.prepare(`UPDATE deposit_intents SET provider_ref = ? WHERE id = ?`).run(providerRef, id);
}

export function setDepositStatus(id: string, status: TransactionStatus) {
  db.prepare(
    `UPDATE deposit_intents SET status = ?, completed_at = CASE WHEN ? IN ('COMPLETED','FAILED') THEN datetime('now') ELSE completed_at END WHERE id = ?`
  ).run(status, status, id);
}
