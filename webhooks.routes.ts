import { Router } from "express";
import { moveFunds } from "../services/walletService";
import { fetchMercadoPagoPayment } from "../services/paymentProviders/mercadoPagoProvider";
import { getDepositIntentById, setDepositStatus } from "../repositories/depositRepo";

export const webhooksRouter = Router();

// Endpoint publico que MercadoPago llama para notificar el resultado de un
// pago (debe configurarse MERCADOPAGO_WEBHOOK_URL apuntando aca, ej. con
// ngrok en desarrollo: https://xxxx.ngrok.app/api/webhooks/mercadopago).
webhooksRouter.post("/mercadopago", async (req, res) => {
  try {
    const paymentId = req.body?.data?.id || req.query["data.id"];
    const type = req.body?.type || req.query.type;
    if (type !== "payment" || !paymentId) {
      return res.status(200).send("ignored");
    }

    const payment = await fetchMercadoPagoPayment(String(paymentId));
    const depositIntent = getDepositIntentById(payment.external_reference);

    if (!depositIntent) return res.status(200).send("no matching deposit intent");
    if (depositIntent.status !== "PENDING") return res.status(200).send("already processed");

    if (payment.status === "approved") {
      moveFunds({
        type: "DEPOSIT",
        amountCents: depositIntent.amount_cents,
        toAccountId: depositIntent.account_id,
        description: "Carga de saldo via MercadoPago",
        metadata: { mercadoPagoPaymentId: payment.id },
      });
      setDepositStatus(depositIntent.id, "COMPLETED");
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      setDepositStatus(depositIntent.id, "FAILED");
    }

    res.status(200).send("ok");
  } catch (err) {
    console.error("Error procesando webhook de MercadoPago", err);
    // Devolvemos 200 igual para que MercadoPago no reintente indefinidamente
    // errores que ya quedaron logueados; en produccion conviene revisar
    // caso por caso (ver README).
    res.status(200).send("error-logged");
  }
});
