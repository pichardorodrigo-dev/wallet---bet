import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../utils/format";

interface CheckoutSessionInfo {
  id: string;
  merchantName: string;
  amount: number;
  currency: string;
  description: string | null;
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  successUrl: string | null;
  cancelUrl: string | null;
}

// Pagina publica de checkout: es la que un comercio le comparte a su cliente
// (checkoutUrl) para que pague desde su billetera. No requiere estar
// logueado para verla, pero si para confirmar el pago.
export function Checkout() {
  const { id } = useParams<{ id: string }>();
  const { user, account, refreshAccount } = useAuth();
  const [session, setSession] = useState<CheckoutSessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiFetch<CheckoutSessionInfo>(`/checkout-sessions/${id}`, { auth: false })
      .then(setSession)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar el pago"))
      .finally(() => setLoading(false));
  }, [id]);

  async function pay() {
    if (!id) return;
    setPaying(true);
    setError(null);
    try {
      const result = await apiFetch<{ status: string; successUrl: string | null }>(
        `/checkout-sessions/${id}/pay`,
        { method: "POST" }
      );
      setSession((s) => (s ? { ...s, status: "PAID" } : s));
      await refreshAccount();
      if (result.successUrl) {
        window.location.href = result.successUrl;
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo procesar el pago");
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <div className="checkout-page">Cargando...</div>;
  if (error && !session) return <div className="checkout-page">{error}</div>;
  if (!session) return null;

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <div className="checkout-merchant">{session.merchantName}</div>
        <div className="checkout-amount">{formatMoney(session.amount, session.currency)}</div>
        {session.description && <div className="muted">{session.description}</div>}

        {session.status === "PAID" && <div className="form-success">Pago confirmado. Gracias!</div>}
        {session.status === "EXPIRED" && <div className="form-error">Esta sesion de pago expiro.</div>}
        {session.status === "CANCELLED" && <div className="form-error">Este pago fue cancelado.</div>}

        {session.status === "PENDING" && (
          <>
            {!user && (
              <div className="form-card" style={{ marginTop: 16 }}>
                <p className="muted">Inicia sesion en tu billetera para pagar.</p>
                <Link
                  className="btn btn-primary"
                  to={`/login?redirect=${encodeURIComponent(`/checkout/${id}`)}`}
                >
                  Iniciar sesion
                </Link>
              </div>
            )}

            {user && (
              <div style={{ marginTop: 16 }}>
                <p className="muted small">
                  Pagando como {user.email} - saldo disponible: {account ? formatMoney(account.balance) : "-"}
                </p>
                {error && <div className="form-error">{error}</div>}
                <button className="btn btn-primary" onClick={pay} disabled={paying}>
                  {paying ? "Procesando pago..." : `Pagar ${formatMoney(session.amount)}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
