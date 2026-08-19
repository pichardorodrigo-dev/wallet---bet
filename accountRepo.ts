import { db } from "../db";
import { createId } from "../utils/id";
import { AccountRow, AccountType } from "./types";

export function createAccount(input: {
  type: AccountType;
  userId?: string;
  merchantId?: string;
  currency?: string;
}): AccountRow {
  const id = createId("acc");
  db.prepare(
    `INSERT INTO accounts (id, type, balance_cents, currency, user_id, merchant_id)
     VALUES (?, ?, 0, ?, ?, ?)`
  ).run(id, input.type, input.currency || "ARS", input.userId ?? null, input.merchantId ?? null);
  return getAccountById(id)!;
}

export function getAccountById(id: string): AccountRow | undefined {
  return db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(id) as AccountRow | undefined;
}

export function getAccountByUserId(userId: string): AccountRow | undefined {
  return db.prepare(`SELECT * FROM accounts WHERE user_id = ?`).get(userId) as
    | AccountRow
    | undefined;
}

export function getAccountByMerchantId(merchantId: string): AccountRow | undefined {
  return db.prepare(`SELECT * FROM accounts WHERE merchant_id = ?`).get(merchantId) as
    | AccountRow
    | undefined;
}

export function incrementBalance(accountId: string, amountCents: number) {
  db.prepare(`UPDATE accounts SET balance_cents = balance_cents + ? WHERE id = ?`).run(
    amountCents,
    accountId
  );
}

export function decrementBalance(accountId: string, amountCents: number) {
  db.prepare(`UPDATE accounts SET balance_cents = balance_cents - ? WHERE id = ?`).run(
    amountCents,
    accountId
  );
}
