import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { authRouter } from "./routes/auth.routes";
import { walletRouter } from "./routes/wallet.routes";
import { transfersRouter } from "./routes/transfers.routes";
import { depositsRouter } from "./routes/deposits.routes";
import { withdrawalsRouter } from "./routes/withdrawals.routes";
import { merchantsRouter } from "./routes/merchants.routes";
import { checkoutRouter } from "./routes/checkout.routes";
import { webhooksRouter } from "./routes/webhooks.routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true, service: "wallet-backend" }));

  app.use("/api/auth", authRouter);
  app.use("/api/wallet", walletRouter);
  app.use("/api/transfers", transfersRouter);
  app.use("/api/deposits", depositsRouter);
  app.use("/api/withdrawals", withdrawalsRouter);
  app.use("/api/merchants", merchantsRouter);
  app.use("/api/checkout-sessions", checkoutRouter);
  app.use("/api/webhooks", webhooksRouter);

  // Sirve el build del frontend (frontend/dist) desde el mismo servidor, asi
  // en produccion (ej. Render) todo el proyecto es un unico servicio web con
  // una sola URL, sin problemas de CORS. En desarrollo el frontend corre
  // aparte con Vite (npm run dev) y esta carpeta no existe, asi que se
  // omite sin romper nada.
  const frontendDist = path.join(__dirname, "..", "..", "frontend", "dist");
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }

  app.use(errorHandler);
  return app;
}
