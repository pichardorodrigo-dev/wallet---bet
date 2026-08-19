export type AccountType = "USER" | "MERCHANT" | "SYSTEM";
export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "PAYMENT";
export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
export type CheckoutStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
export type PaymentProviderName = "MOCK" | "MERCADOPAGO";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  created_at: string;
}

export interface AccountRow {
  id: string;
  type: AccountType;
  balance_cents: number;
  currency: string;
  created_at: string;
  user_id: string | null;
  merchant_id: string | null;
}

export interface MerchantRow {
  id: string;
  name: string;
  api_key: string;
  api_secret: string;
  webhook_url: string | null;
  created_at: string;
  user_id: string;
}

export interface TransactionRow {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount_cents: number;
  currency: string;
  description: string | null;
  metadata: string | null;
  created_at: string;
  completed_at: string | null;
  from_account_id: string | null;
  to_account_id: string | null;
}

export interface DepositIntentRow {
  id: string;
  amount_cents: number;
  currency: string;
  provider: PaymentProviderName;
  provider_ref: string | null;
  status: TransactionStatus;
  created_at: string;
  completed_at: string | null;
  account_id: string;
}

export interface PayoutRow {
  id: string;
  amount_cents: number;
  currency: string;
  destination: string;
  status: TransactionStatus;
  created_at: string;
  completed_at: string | null;
  account_id: string;
}

export interface CheckoutSessionRow {
  id: string;
  amount_cents: number;
  currency: string;
  description: string | null;
  status: CheckoutStatus;
  success_url: string | null;
  cancel_url: string | null;
  created_at: string;
  expires_at: string;
  paid_at: string | null;
  merchant_id: string;
  transaction_id: string | null;
}
