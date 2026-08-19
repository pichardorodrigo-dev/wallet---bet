import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getAccountForUser, moveFunds } from "../services/walletService";
import { notifyMerchantWebhook } from "../services/webhookService";
import {
  getCheckoutSessionById,
  setCheckoutSessionStatus,
  markCheckoutSessionPaid,
} from "../repositories/checkoutRepo";
import { getMerchantById } from "../repositories/merchantRepo";
import { getAccountByMerchantId } from "../repositories/accountRepo";
import { fromCents } from "../utils/money";
import { Errors } from "../utils/errors";

export const checkoutRouter = Router();

// Publico (sin auth): la pagina de checkout que abre el pagador necesita
// poder mostrar el monto y el comercio antes de que el usuario inicie sesion.
checkoutRouter.get("/:id", async (req, res, next) => {
  try {
    const session = getCheckoutSessionById(req.params.id);
    if (!session) throw Errors.notFound("Sesion de checkout no encontrada");
    const merchant = getMerchantById(session.merchant_id)!;

    const expired = session.status === "PENDING" && new Date(session.expires_at) < new Date();
    if (expired) {
      setCheckoutSessionStatus(session.id, "EXPIRED");
    }

    res.json({
      id: session.id,
      merchantName: merchant.name,
      amount: fromCents(session.amount_cents),
      currency: session.currency,
      description: session.description,
      status: expired ? "EXPIRED" : session.status,
      successUrl: session.success_url,
      cancelUrl: session.cancel_url,
    });
  } catch (err) {
    next(err);
  }
});

// El usuario paga con su billetera (requiere estar logueado). Debita su
// cuenta y acredita la cuenta del comercio, en una unica operacion atomica.
checkoutRouter.post("/:id/pay", requireAuth, async (req, res, next) => {
  try {
    const session = getCheckoutSessionById(req.params.id);
    if (!session) throw Errors.notFound("Sesion de checkout no encontrada");
    if (session.status !== "PENDING") throw Errors.conflict(`La sesion ya esta en estado ${session.status}`);
    if (new Date(session.expires_at) < new Date()) {
      setCheckoutSessionStatus(session.id, "EXPIRED");
      throw Errors.conflict("La sesion de checkout expiro");
    }

    const merchant = getMerchantById(session.merchant_id)!;
    const merchantAccount = getAccountByMerchantId(merchant.id)!;
    const payerAccount = getAccountForUser(req.auth!.userId);

    const tx = moveFunds({
      type: "PAYMENT",
      amountCents: session.amount_cents,
      fromAccountId: payerAccount.id,
      toAccountId: merchantAccount.id,
      description: session.description || `Pago a ${merchant.name}`,
    });

    markCheckoutSessionPaid(session.id, tx.id);

    await notifyMerchantWebhook(merchant.webhook_url, merchant.api_secret, {
      event: "checkout_session.paid",
      checkoutSessionId: session.id,
      amount: fromCents(session.amount_cents),
      transactionId: tx.id,
      paidAt: new Date().toISOString(),
    });

    res.json({ status: "PAID", transactionId: tx.id, successUrl: session.success_url });
  } catch (err) {
    next(err);
  }
});
