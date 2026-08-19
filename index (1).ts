import { config } from "../../config";
import { MockPaymentProvider } from "./mockProvider";
import { MercadoPagoProvider } from "./mercadoPagoProvider";
import { PaymentProviderAdapter } from "./types";

const providers: Record<string, PaymentProviderAdapter> = {
  MOCK: new MockPaymentProvider(),
  MERCADOPAGO: new MercadoPagoProvider(),
};

export function getActivePaymentProvider(): PaymentProviderAdapter {
  return providers[config.paymentProvider] ?? providers.MOCK;
}

export * from "./types";
