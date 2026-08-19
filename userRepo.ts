import { db } from "../db";
import { createId } from "../utils/id";
import { UserRow } from "./types";

export function createUser(input: { email: string; passwordHash: string; fullName: string }): UserRow {
  const id = createId("usr");
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)`
  ).run(id, input.email.toLowerCase(), input.passwordHash, input.fullName);
  return getUserById(id)!;
}

export function getUserByEmail(email: string): UserRow | undefined {
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase()) as
    | UserRow
    | undefined;
}

export function getUserById(id: string): UserRow | undefined {
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as UserRow | undefined;
}
