// Interfaz comun que debe cumplir cualquier proveedor de pago externo usado
// para cargar fondos a la billetera (deposito). Esto permite enchufar
// MercadoPago, Stripe, etc. sin tocar el resto del sistema.
export interface CreateDepositParams {
  depositIntentId: string;
  amountCents: number;
  currency: string;
  description: string;
  payerEmail: string;
}

export interface CreateDepositResult {
  // URL a la que se debe redirigir al usuario para completar el pago
  // (checkout hosteado por el proveedor). En el proveedor MOCK no hace
  // falta redireccion externa.
  redirectUrl: string | null;
  providerRef: string;
}

export interface PaymentProviderAdapter {
  name: string;
  createDeposit(params: CreateDepositParams): Promise<CreateDepositResult>;
}
