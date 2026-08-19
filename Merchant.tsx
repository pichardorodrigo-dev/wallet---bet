import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "../api/client";

interface MerchantInfo {
  id: string;
  name: string;
  apiKey: string;
  webhookUrl: string | null;
  balance: number;
}

interface CheckoutSessionResponse {
  id: string;
  amount: number;
  checkoutUrl: string;
  status: string;
}

export function Merchant() {
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [newApiSecret, setNewApiSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [testAmount, setTestAmount] = useState("100");
  const [session, setSession] = useState<CheckoutSessionResponse | null>(null);

  useEffect(() => {
    apiFetch<MerchantInfo>("/merchants/me")
      .then(setMerchant)
      .catch(() => setMerchant(null))
      .finally(() => setLoading(false));
  }, []);

  async function onRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await apiFetch<MerchantInfo & { apiSecret: string }>("/merchants/register", {
        method: "POST",
        body: JSON.stringify({ name, webhookUrl: webhookUrl || undefined }),
      });
      setNewApiSecret(data.apiSecret);
      setMerchant(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la cuenta de comercio");
    }
  }

  async function createTestSession(e: FormEvent) {
    e.preventDefault();
    if (!merchant) return;
    setError(null);
    try {
      // Esto simula lo que haria el backend de un comercio: llama a la API
      // con su x-api-key (no con el JWT del usuario logueado).
      const data = await apiFetch<CheckoutSessionResponse>("/merchants/checkout-sessions", {
        method: "POST",
        auth: false,
        headers: { "x-api-key": merchant.apiKey },
        body: JSON.stringify({ amount: parseFloat(testAmount), description: "Pago de prueba" }),
      });
      setSession(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la sesion de checkout");
    }
  }

  if (loading) return <p className="muted">Cargando...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Cuenta de comercio</h1>
      </div>

      {!merchant && (
        <form className="form-card" onSubmit={onRegister}>
          <p className="muted">
            Activa una cuenta de comercio para poder cobrar pagos de otros usuarios a traves de la
            pasarela (API + checkout hosteado).
          </p>
          <label htmlFor="merchantName">Nombre del comercio</label>
          <input id="merchantName" required value={name} onChange={(e) => setName(e.target.value)} />

          <label htmlFor="webhookUrl">Webhook URL (opcional)</label>
          <input
            id="webhookUrl"
            type="url"
            placeholder="https://tu-servidor.com/webhooks/wallet"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />

          {error && <div className="form-error">{error}</div>}

          <button className="btn btn-primary" type="submit">
            Activar cuenta de comercio
          </button>
        </form>
      )}

      {newApiSecret && (
        <div className="form-card warning-card">
          <strong>Guarda tu API secret ahora, no se volvera a mostrar:</strong>
          <code className="code-block">{newApiSecret}</code>
        </div>
      )}

      {merchant && (
        <>
          <div className="stat-card">
            <span className="muted">Saldo del comercio</span>
            <span className="stat-amount">${merchant.balance}</span>
          </div>

          <div className="form-card">
            <h2 className="section-title">Credenciales de API</h2>
            <p className="muted small">
              Usa esta API key en el header <code>x-api-key</code> desde el backend de tu comercio
              para crear sesiones de checkout (endpoint <code>POST /api/merchants/checkout-sessions</code>).
            </p>
            <code className="code-block">{merchant.apiKey}</code>
          </div>

          <form className="form-card" onSubmit={createTestSession}>
            <h2 className="section-title">Probar un cobro</h2>
            <label htmlFor="testAmount">Monto</label>
            <input
              id="testAmount"
              type="number"
              min="0.01"
              step="0.01"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
            />
            {error && <div className="form-error">{error}</div>}
            <button className="btn btn-primary" type="submit">
              Crear sesion de checkout de prueba
            </button>

            {session && (
              <div className="form-success">
                Sesion creada. Abrila para pagar como si fueras un cliente:{" "}
                <a href={session.checkoutUrl} target="_blank" rel="noreferrer">
                  {session.checkoutUrl}
                </a>
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );
}
