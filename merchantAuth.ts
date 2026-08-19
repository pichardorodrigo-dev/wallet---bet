import { NextFunction, Request, Response } from "express";
import { getMerchantByApiKey } from "../repositories/merchantRepo";
import { getAccountByMerchantId } from "../repositories/accountRepo";
import { Errors } from "../utils/errors";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      merchant?: { id: string; name: string; accountId: string };
    }
  }
}

// Autenticacion de comercios via API key (header: x-api-key), analogo a
// como Stripe/MercadoPago autentican llamadas server-to-server.
export function requireMerchantApiKey(req: Request, _res: Response, next: NextFunction) {
  const apiKey = req.header("x-api-key");
  if (!apiKey) {
    return next(Errors.unauthorized("Falta el header x-api-key"));
  }
  const merchant = getMerchantByApiKey(apiKey);
  if (!merchant) {
    return next(Errors.unauthorized("API key invalida"));
  }
  const account = getAccountByMerchantId(merchant.id);
  if (!account) {
    return next(Errors.unauthorized("API key invalida"));
  }
  req.merchant = { id: merchant.id, name: merchant.name, accountId: account.id };
  next();
}
