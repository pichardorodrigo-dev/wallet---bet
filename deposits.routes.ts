import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { getAccountForUser, moveFunds } from "../services/walletService";
import { getActivePaymentProvider } from "../services/paymentProviders";
import { getUserById } from "../repositories/userRepo";
import {
  createDepositIntent,
  getDepositIntentById,
  setDepositProviderRef,
  setDepositStatus,
} from "../repositories/depositRepo";
import { toCents, fromCents } from "../utils/money";
import { Errors } from "../utils/errors";
import { config } from "../config";

export const depositsRouter = Router();
depositsRouter.use(requireAuth);

const depositSchema = z.object({
  amount: z.number().positive(),
});

// Inicia una carga de saldo. Segun PAYMENT_PROVIDER:
// - MOCK: devuelve el intent listo para confirmar con /simulate-confirm.
// - MERCADOPAGO: devuelve una redirectUrl al checkout real de MercadoPago.
depositsRouter.post("/", async (req, res, next) => {
  try {
    const data = depositSchema.parse(req.body);
    const account = getAccountForUser(req.auth!.userId);
    const user = getUserById(req.auth!.userId)!;
    const amountCents = toCents(data.amount);

    const intent = createDepositIntent({
      amountCents,
      accountId: account.id,
      provider: config.paymentProvider,
    });

    const provider = getActivePaymentProvider();
    const result = await provider.createDeposit({
      depositIntentId: intent.id,
      amountCents,
      currency: account.currency,
      description: `Carga de saldo - ${user.email}`,
      payerEmail: user.email,
    });

    setDepositProviderRef(intent.id, result.providerRef);

    res.status(201).json({
      id: intent.id,
      amount: fromCents(intent.amount_cents),
      status: intent.status,
      provider: intent.provider,
      redirectUrl: result.redirectUrl,
    });
  } catch (err) {
    next(err);
  }
});

// Solo disponible cuando el proveedor activo es MOCK: simula la
// confirmacion del pago por parte del procesador externo y acredita saldo.
depositsRouter.post("/:id/simulate-confirm", async (req, res, next) => {
  try {
    if (config.paymentProvider !== "MOCK") {
      throw Errors.badRequest(
        "La confirmacion simulada solo esta disponible con PAYMENT_PROVIDER=MOCK"
      );
    }
    const account = getAccountForUser(req.auth!.userId);
    const intent = getDepositIntentById(req.params.id);
    if (!intent || intent.account_id !== account.id) {
      throw Errors.notFound("Deposito no encontrado");
    }
    if (intent.status !== "PENDING") {
      throw Errors.conflict("El deposito ya fue procesado");
    }

    const tx = moveFunds({
      type: "DEPOSIT",
      amountCents: intent.amount_cents,
      toAccountId: account.id,
      description: "Carga de saldo (simulada)",
    });

    setDepositStatus(intent.id, "COMPLETED");

    res.json({
      status: "COMPLETED",
      transactionId: tx.id,
      newBalance: fromCents(account.balance_cents + intent.amount_cents),
    });
  } catch (err) {
    next(err);
  }
});

depositsRouter.get("/:id", async (req, res, next) => {
  try {
    const account = getAccountForUser(req.auth!.userId);
    const intent = getDepositIntentById(req.params.id);
    if (!intent || intent.account_id !== account.id) throw Errors.notFound("Deposito no encontrado");
    res.json({
      id: intent.id,
      amount: fromCents(intent.amount_cents),
      status: intent.status,
      provider: intent.provider,
    });
  } catch (err) {
    next(err);
  }
});
