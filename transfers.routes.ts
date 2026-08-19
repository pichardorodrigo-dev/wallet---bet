import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { moveFunds, getAccountForUser } from "../services/walletService";
import { getUserByEmail } from "../repositories/userRepo";
import { toCents, fromCents } from "../utils/money";
import { Errors } from "../utils/errors";

export const transfersRouter = Router();
transfersRouter.use(requireAuth);

const transferSchema = z.object({
  toEmail: z.string().email(),
  amount: z.number().positive(),
  description: z.string().optional(),
});

transfersRouter.post("/", async (req, res, next) => {
  try {
    const data = transferSchema.parse(req.body);
    const fromAccount = getAccountForUser(req.auth!.userId);

    const recipient = getUserByEmail(data.toEmail);
    if (!recipient) throw Errors.notFound("El destinatario no existe");
    if (recipient.id === req.auth!.userId) {
      throw Errors.badRequest("No podes transferirte a vos mismo");
    }
    const toAccount = getAccountForUser(recipient.id);

    const tx = moveFunds({
      type: "TRANSFER",
      amountCents: toCents(data.amount),
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      description: data.description || `Transferencia a ${recipient.email}`,
    });

    res.status(201).json({
      id: tx.id,
      amount: fromCents(tx.amount_cents),
      status: tx.status,
      createdAt: tx.created_at,
    });
  } catch (err) {
    next(err);
  }
});
