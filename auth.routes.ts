import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config";
import { Errors } from "../utils/errors";
import { createUser, getUserByEmail } from "../repositories/userRepo";
import { createAccount } from "../repositories/accountRepo";
import { db } from "../db";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
  fullName: z.string().min(2),
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = getUserByEmail(data.email);
    if (existing) throw Errors.conflict("Ya existe una cuenta con ese email");

    const passwordHash = await bcrypt.hash(data.password, 10);

    const run = db.transaction(() => {
      const user = createUser({ email: data.email, passwordHash, fullName: data.fullName });
      const account = createAccount({ type: "USER", userId: user.id });
      return { user, account };
    });
    const { user, account } = run();

    const token = signToken(user.id, user.email);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name },
      account: { id: account.id, balance: 0, currency: account.currency },
    });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = getUserByEmail(data.email);
    if (!user) throw Errors.unauthorized("Email o contrasena incorrectos");

    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) throw Errors.unauthorized("Email o contrasena incorrectos");

    const token = signToken(user.id, user.email);
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.full_name } });
  } catch (err) {
    next(err);
  }
});

function signToken(userId: string, email: string) {
  return jwt.sign({ userId, email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}
