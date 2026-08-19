import { db } from "../db";
import { createId } from "../utils/id";
import { PayoutRow } from "./types";

export function createPayout(input: {
  amountCents: number;
  destination: string;
  accountId: string;
}): PayoutRow {
  const id = createId("pay");
  db.prepare(
    `INSERT INTO payouts (id, amount_cents, destination, status, account_id, completed_at)
     VALUES (?, ?, ?, 'COMPLETED', ?, datetime('now'))`
  ).run(id, input.amountCents, input.destination, input.accountId);
  return db.prepare(`SELECT * FROM payouts WHERE id = ?`).get(id) as PayoutRow;
}
