import { FormEvent, useState } from "react";
import { apiFetch, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface DepositResponse {
  id: string;
  amount: number;
  status: string;
  provider: "MOCK" | "MERCADOPAGO";
  redirectUrl: string | null;
}

export function Deposit() {
  const { refreshAccount } = useAuth();
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState<DepositResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const data = await apiFetch<DepositResponse>("/deposits", {
        method: "POST",
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setPending(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar la carga de saldo");
    } finally {
      setLoading(false);
    }
  }

  async function confirmMock() {
    if (!pending) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/deposits/${pending.id}/simulate-confirm`, { method: "POST" });
      setSuccess(`Se acreditaron $${pending.amount} a tu billetera`);
      setPending(null);
      setAmount("");
      await refreshAccount();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo confirmar el deposito");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Cargar saldo</h1>
      </div>

      {!pending && (
        <form className="form-card" onSubmit={onSubmit}>
          <label htmlFor="amount">Monto a cargar</label>
          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Procesando..." : "Cargar saldo"}
          </button>
        </form>
      )}

      {pending && (
        <div className="form-card">
          <p>
            Deposito de <strong>${pending.amount}</strong> creado (proveedor {pending.provider}).
          </p>
          <p className="muted small">
            En este entorno de demo (proveedor MOCK) confirma el pago manualmente para simular la
            respuesta del procesador real.
          </p>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary" onClick={confirmMock} disabled={loading}>
            {loading ? "Confirmando..." : "Simular confirmacion de pago"}
          </button>
        </div>
      )}
    </div>
  );
}
