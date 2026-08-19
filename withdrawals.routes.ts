import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { getAccountForUser, moveFunds } from "../services/walletService";
import { createPayout } from "../repositories/payoutRepo";
import { toCents, fromCents } from "../utils/money";

export const withdrawalsRouter = Router();
withdrawalsRouter.use(requireAuth);

const withdrawSchema = z.object({
  amount: z.number().positive(),
  destination: z.string().min(3, "Indica un alias/CBU/cuenta destino"),
});

// Retiro de fondos. Debita la billetera de inmediato y crea un registro de
// Payout. En este demo el payout se marca COMPLETED al instante (no hay
// integracion real con transferencias bancarias/CBU: eso requeriria un
// proveedor adicional, ej. la API de transferencias de MercadoPago o un
// agregador bancario, fuera del alcance de este prototipo).
withdrawalsRouter.post("/", async (req, res, next) => {
  try {
    const data = withdrawSchema.parse(req.body);
    const account = getAccountForUser(req.auth!.userId);
    const amountCents = toCents(data.amount);

    const tx = moveFunds({
      type: "WITHDRAWAL",
      amountCents,
      fromAccountId: account.id,
      description: `Retiro a ${data.destination}`,
    });

    const payout = createPayout({
      amountCents,
      destination: data.destination,
      accountId: account.id,
    });

    res.status(201).json({
      id: payout.id,
      amount: fromCents(payout.amount_cents),
      status: payout.status,
      transactionId: tx.id,
    });
  } catch (err) {
    next(err);
  }
});
