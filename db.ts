import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const dbPath = dbUrl.startsWith("file:") ? dbUrl.slice("file:".length) : dbUrl;
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

export const db = new Database(resolvedPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Esquema de la base de datos. Los montos se guardan en centavos (INTEGER)
// para evitar errores de redondeo con punto flotante. Ver README/ARCHITECTURE
// para el diagrama de entidades.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS merchants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    api_secret TEXT NOT NULL,
    webhook_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('USER','MERCHANT','SYSTEM')),
    balance_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'ARS',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    user_id TEXT UNIQUE REFERENCES users(id),
    merchant_id TEXT UNIQUE REFERENCES merchants(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT','WITHDRAWAL','TRANSFER','PAYMENT')),
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ARS',
    description TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    from_account_id TEXT REFERENCES accounts(id),
    to_account_id TEXT REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS deposit_intents (
    id TEXT PRIMARY KEY,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ARS',
    provider TEXT NOT NULL DEFAULT 'MOCK',
    provider_ref TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    account_id TEXT NOT NULL REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS payouts (
    id TEXT PRIMARY KEY,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ARS',
    destination TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    account_id TEXT NOT NULL REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS checkout_sessions (
    id TEXT PRIMARY KEY,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ARS',
    description TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    success_url TEXT,
    cancel_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    paid_at TEXT,
    merchant_id TEXT NOT NULL REFERENCES merchants(id),
    transaction_id TEXT UNIQUE REFERENCES transactions(id)
  );

  CREATE INDEX IF NOT EXISTS idx_tx_from ON transactions(from_account_id);
  CREATE INDEX IF NOT EXISTS idx_tx_to ON transactions(to_account_id);
  CREATE INDEX IF NOT EXISTS idx_checkout_merchant ON checkout_sessions(merchant_id);
`);
