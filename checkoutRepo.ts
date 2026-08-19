import { db } from "../db";
import { createId } from "../utils/id";
import { CheckoutSessionRow, CheckoutStatus } from "./types";

export function createCheckoutSession(input: {
  amountCents: number;
  description?: string;
  successUrl?: string;
  cancelUrl?: string;
  merchantId: string;
  expiresAt: Date;
}): CheckoutSessionRow {
  const id = createId("chk");
  db.prepare(
    `INSERT INTO checkout_sessions
      (id, amount_cents, description, success_url, cancel_url, merchant_id, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.amountCents,
    input.description ?? null,
    input.successUrl ?? null,
    input.cancelUrl ?? null,
    input.merchantId,
    input.expiresAt.toISOString()
  );
  return getCheckoutSessionById(id)!;
}

export function getCheckoutSessionById(id: string): CheckoutSessionRow | undefined {
  return db.prepare(`SELECT * FROM checkout_sessions WHERE id = ?`).get(id) as
    | CheckoutSessionRow
    | undefined;
}

export function setCheckoutSessionStatus(id: string, status: CheckoutStatus) {
  db.prepare(`UPDATE checkout_sessions SET status = ? WHERE id = ?`).run(status, id);
}

export function markCheckoutSessionPaid(id: string, transactionId: string) {
  db.prepare(
    `UPDATE checkout_sessions SET status = 'PAID', paid_at = datetime('now'), transaction_id = ? WHERE id = ?`
  ).run(transactionId, id);
}
