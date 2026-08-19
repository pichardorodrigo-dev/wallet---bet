import { db } from "../db";
import { createId } from "../utils/id";
import { MerchantRow } from "./types";

export function createMerchant(input: {
  name: string;
  apiKey: string;
  apiSecretHash: string;
  webhookUrl?: string;
  userId: string;
}): MerchantRow {
  const id = createId("mch");
  db.prepare(
    `INSERT INTO merchants (id, name, api_key, api_secret, webhook_url, user_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, input.name, input.apiKey, input.apiSecretHash, input.webhookUrl ?? null, input.userId);
  return getMerchantById(id)!;
}

export function getMerchantById(id: string): MerchantRow | undefined {
  return db.prepare(`SELECT * FROM merchants WHERE id = ?`).get(id) as MerchantRow | undefined;
}

export function getMerchantByUserId(userId: string): MerchantRow | undefined {
  return db.prepare(`SELECT * FROM merchants WHERE user_id = ?`).get(userId) as
    | MerchantRow
    | undefined;
}

export function getMerchantByApiKey(apiKey: string): MerchantRow | undefined {
  return db.prepare(`SELECT * FROM merchants WHERE api_key = ?`).get(apiKey) as
    | MerchantRow
    | undefined;
}
