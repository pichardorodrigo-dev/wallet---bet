import { config } from "../../config";
import { CreateDepositParams, CreateDepositResult, PaymentProviderAdapter } from "./types";

// Integracion real (modo sandbox) con MercadoPago Checkout Pro.
// Requiere MERCADOPAGO_ACCESS_TOKEN de prueba (Test User) obtenido en
// https://www.mercadopago.com.ar/developers/panel/app
//
// Flujo:
// 1. createDeposit crea una "preference" de pago en MercadoPago y devuelve
//    la URL de checkout (init_point) a la que se redirige al usuario.
// 2. El usuario paga en MercadoPago (con tarjetas de prueba en sandbox).
// 3. MercadoPago llama a MERCADOPAGO_WEBHOOK_URL (debe ser publica, ej. via
//    ngrok en desarrollo) -> ver routes/webhooks.routes.ts, que confirma el
//    pago y acredita el saldo en la billetera.
export class MercadoPagoProvider implements PaymentProviderAdapter {
  name = "MERCADOPAGO";

  async createDeposit(params: CreateDepositParams): Promise<CreateDepositResult> {
    const accessToken = config.mercadoPago.accessToken;
    if (!accessToken) {
      throw new Error(
        "MERCADOPAGO_ACCESS_TOKEN no configurado. Agrega tus credenciales de sandbox en .env"
      );
    }

    const body = {
      items: [
        {
          title: params.description || "Carga de saldo en billetera",
          quantity: 1,
          currency_id: params.currency,
          unit_price: params.amountCents / 100,
        },
      ],
      payer: { email: params.payerEmail },
      external_reference: params.depositIntentId,
      notification_url: config.mercadoPago.webhookUrl || undefined,
      back_urls: {
        success: `${config.frontendUrl}/deposit/result?status=success`,
        failure: `${config.frontendUrl}/deposit/result?status=failure`,
        pending: `${config.frontendUrl}/deposit/result?status=pending`,
      },
      auto_return: "approved",
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error creando preferencia en MercadoPago: ${response.status} ${errText}`);
    }

    const data = (await response.json()) as { id: string; init_point: string; sandbox_init_point: string };

    return {
      redirectUrl: data.sandbox_init_point || data.init_point,
      providerRef: data.id,
    };
  }
}

// Consulta el estado real de un pago en MercadoPago a partir de su id
// (usado por el webhook para confirmar antes de acreditar saldo).
export async function fetchMercadoPagoPayment(paymentId: string) {
  const accessToken = config.mercadoPago.accessToken;
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`No se pudo consultar el pago ${paymentId} en MercadoPago`);
  }
  return response.json() as Promise<{
    id: number;
    status: string;
    external_reference: string;
    transaction_amount: number;
  }>;
}
