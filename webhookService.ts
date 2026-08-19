import crypto from "crypto";

// Envia una notificacion webhook al comercio cuando se confirma un pago,
// firmando el payload con HMAC-SHA256 usando el apiSecret del comercio para
// que este pueda verificar que la notificacion es autentica (mismo patron
// que usan Stripe/MercadoPago).
export async function notifyMerchantWebhook(
  webhookUrl: string | null | undefined,
  apiSecret: string,
  payload: Record<string, unknown>
) {
  if (!webhookUrl) return;
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", apiSecret).update(body).digest("hex");

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
      },
      body,
    });
  } catch (err) {
    console.error(`No se pudo notificar el webhook del comercio (${webhookUrl})`, err);
  }
}
