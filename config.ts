import dotenv from "dotenv";
dotenv.config();

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return v;
}

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  paymentProvider: (process.env.PAYMENT_PROVIDER || "MOCK") as "MOCK" | "MERCADOPAGO",
  mercadoPago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || "",
    webhookUrl: process.env.MERCADOPAGO_WEBHOOK_URL || "",
  },
  // En Render, RENDER_EXTERNAL_URL trae automaticamente la URL publica del
  // servicio, asi no hace falta configurarla a mano tras el deploy.
  frontendUrl: process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:5173",
};
