import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import { nanoid } from "nanoid";
import { requireAuth } from "../middleware/auth";
import { requireMerchantApiKey } from "../middleware/merchantAuth";
import { createMerchant, getMerchantByUserId } from "../repositories/merchantRepo";
import { createAccount, getAccountByMerchantId } from "../repositories/accountRepo";
import { createCheckoutSession, getCheckoutSessionById } from "../repositories/checkoutRepo";
import { db } from "../db";
import { toCents, fromCents } from "../utils/money";
import { Errors } from "../utils/errors";
import { config } from "../config";

export const merchantsRouter = Router();

const registerMerchantSchema = z.object({
  name: z.string().min(2),
  webhookUrl: z.string().url().optional(),
});

// Convierte a cualquier usuario logueado en comercio ("cuenta de negocio"
// dentro de la misma billetera), analogo a activar Stripe/MercadoPago sobre
// una cuenta existente. Genera credenciales de API propias.
merchantsRouter.post("/register", requireAuth, async (req, res, next) => {
  try {
    const data = registerMerchantSchema.parse(req.body);
    const existing = getMerchantByUserId(req.auth!.userId);
    if (existing) throw Errors.conflict("Este usuario ya tiene una cuenta de comercio");

    const apiKey = `pk_${nanoid(24)}`;
    const apiSecret = `sk_${nanoid(32)}`;
    const apiSecretHash = crypto.createHash("sha256").update(apiSecret).digest("hex");

    const run = db.transaction(() => {
      const merchant = createMerchant({
        name: data.name,
        apiKey,
        apiSecretHash,
        webhookUrl: data.webhookUrl,
        userId: req.auth!.userId,
      });
      createAccount({ type: "MERCHANT", merchantId: merchant.id });
      return merchant;
    });
    const merchant = run();

    // El apiSecret solo se muestra una vez, igual que en Stripe/MercadoPago.
    res.status(201).json({
      id: merchant.id,
      name: merchant.name,
      apiKey,
      apiSecret,
      warning: "Guarda el apiSecret ahora: no se puede volver a mostrar.",
    });
  } catch (err) {
    next(err);
  }
});

merchantsRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const merchant = getMerchantByUserId(req.auth!.userId);
    if (!merchant) throw Errors.notFound("Este usuario no tiene cuenta de comercio");
    const account = getAccountByMerchantId(merchant.id)!;
    res.json({
      id: merchant.id,
      name: merchant.name,
      apiKey: merchant.api_key,
      webhookUrl: merchant.webhook_url,
      balance: fromCents(account.balance_cents),
    });
  } catch (err) {
    next(err);
  }
});

const createSessionSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// Crea una sesion de checkout (equivalente a un "Payment Intent" / preference
// de pago). Se autentica con la API key del comercio (header x-api-key), no
// con el JWT de un usuario: esta pensado para ser llamado server-to-server
// desde el backend del comercio.
merchantsRouter.post("/checkout-sessions", requireMerchantApiKey, async (req, res, next) => {
  try {
    const data = createSessionSchema.parse(req.body);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    const session = createCheckoutSession({
      amountCents: toCents(data.amount),
      description: data.description,
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl,
      merchantId: req.merchant!.id,
      expiresAt,
    });

    const checkoutUrl = `${config.frontendUrl}/checkout/${session.id}`;

    res.status(201).json({
      id: session.id,
      status: session.status,
      amount: fromCents(session.amount_cents),
      checkoutUrl,
      expiresAt: session.expires_at,
    });
  } catch (err) {
    next(err);
  }
});

merchantsRouter.get("/checkout-sessions/:id", requireMerchantApiKey, async (req, res, next) => {
  try {
    const session = getCheckoutSessionById(req.params.id);
    if (!session || session.merchant_id !== req.merchant!.id) {
      throw Errors.notFound("Sesion de checkout no encontrada");
    }
    res.json({
      id: session.id,
      status: session.status,
      amount: fromCents(session.amount_cents),
      paidAt: session.paid_at,
    });
  } catch (err) {
    next(err);
  }
});
