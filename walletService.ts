import { db } from "../db";
import { getAccountById, getAccountByUserId, incrementBalance, decrementBalance } from "../repositories/accountRepo";
import { createTransaction, getHistoryForAccount as repoGetHistory } from "../repositories/transactionRepo";
import { TransactionRow, TransactionType } from "../repositories/types";
import { Errors } from "../utils/errors";

export interface MoveFundsInput {
  type: TransactionType;
  amountCents: number;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Mueve fondos entre cuentas de forma atomica (movimiento de doble entrada):
 * debita fromAccount, acredita toAccount y deja un registro de Transaction
 * como comprobante/auditoria. Si fromAccountId es null se trata de una
 * emision de fondos (deposito externo); si toAccountId es null se trata de
 * una salida de fondos (retiro externo).
 *
 * better-sqlite3 es sincrono, asi que la "transaccion" de base de datos es
 * una funcion sincrona envuelta con db.transaction(...), que hace commit al
 * finalizar sin error o rollback automatico si algo lanza una excepcion.
 */
export function moveFunds(input: MoveFundsInput): TransactionRow {
  const { type, amountCents, fromAccountId, toAccountId, description, metadata } = input;

  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw Errors.badRequest("El monto debe ser mayor a cero");
  }
  if (!fromAccountId && !toAccountId) {
    throw Errors.badRequest("Se requiere al menos una cuenta de origen o destino");
  }

  const run = db.transaction(() => {
    if (fromAccountId) {
      const fromAccount = getAccountById(fromAccountId);
      if (!fromAccount) throw Errors.notFound("Cuenta de origen no encontrada");
      if (fromAccount.balance_cents < amountCents) {
        throw Errors.badRequest("Saldo insuficiente");
      }
      decrementBalance(fromAccountId, amountCents);
    }

    if (toAccountId) {
      const toAccount = getAccountById(toAccountId);
      if (!toAccount) throw Errors.notFound("Cuenta de destino no encontrada");
      incrementBalance(toAccountId, amountCents);
    }

    return createTransaction({
      type,
      amountCents,
      fromAccountId,
      toAccountId,
      description,
      metadata,
    });
  });

  return run();
}

export function getAccountForUser(userId: string) {
  const account = getAccountByUserId(userId);
  if (!account) throw Errors.notFound("Cuenta no encontrada");
  return account;
}

export function getAccountHistory(accountId: string, limit = 50) {
  return repoGetHistory(accountId, limit);
}
