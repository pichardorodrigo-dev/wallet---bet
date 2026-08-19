import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getAccountForUser, getAccountHistory } from "../services/walletService";
import { getUserById, getUserByEmail } from "../repositories/userRepo";
import { fromCents } from "../utils/money";
import { Errors } from "../utils/errors";

export const walletRouter = Router();
walletRouter.use(requireAuth);

walletRouter.get("/me", async (req, res, next) => {
  try {
    const user = getUserById(req.auth!.userId);
    if (!user) throw Errors.notFound("Usuario no encontrado");
    const account = getAccountForUser(user.id);
    res.json({
      user: { id: user.id, email: user.email, fullName: user.full_name },
      account: {
        id: account.id,
        balance: fromCents(account.balance_cents),
        currency: account.currency,
      },
    });
  } catch (err) {
    next(err);
  }
});

walletRouter.get("/history", async (req, res, next) => {
  try {
    const account = getAccountForUser(req.auth!.userId);
    const history = getAccountHistory(account.id);
    res.json(
      history.map((h) => ({
        id: h.id,
        type: h.type,
        status: h.status,
        amount: fromCents(h.amount_cents),
        direction: h.to_account_id === account.id ? "IN" : "OUT",
        description: h.description,
        createdAt: h.created_at,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// Busca un usuario por email para iniciar una transferencia (no expone datos sensibles).
walletRouter.get("/lookup", async (req, res, next) => {
  try {
    const email = String(req.query.email || "").toLowerCase();
    if (!email) throw Errors.badRequest("Falta el parametro email");
    const user = getUserByEmail(email);
    if (!user) throw Errors.notFound("No existe un usuario con ese email");
    res.json({ id: user.id, email: user.email, fullName: user.full_name });
  } catch (err) {
    next(err);
  }
});
