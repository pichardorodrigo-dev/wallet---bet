import { nanoid } from "nanoid";
import { CreateDepositParams, CreateDepositResult, PaymentProviderAdapter } from "./types";

// Proveedor simulado: no requiere credenciales ni red externa. Sirve para
// probar todo el flujo de la billetera de punta a punta sin depender de un
// procesador de pagos real. La confirmacion se hace llamando al endpoint
// POST /api/deposits/:id/simulate-confirm (solo disponible en este modo).
export class MockPaymentProvider implements PaymentProviderAdapter {
  name = "MOCK";

  async createDeposit(params: CreateDepositParams): Promise<CreateDepositResult> {
    return {
      redirectUrl: null,
      providerRef: `mock_${nanoid(10)}`,
    };
  }
}
