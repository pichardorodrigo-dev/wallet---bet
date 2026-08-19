import { FormEvent, useState } from "react";
import { apiFetch, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function Withdraw() {
  const { refreshAccount } = useAuth();
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await apiFetch("/withdrawals", {
        method: "POST",
        body: JSON.stringify({ amount: parseFloat(amount), destination }),
      });
      setSuccess(`Retiro de $${amount} procesado a ${destination}`);
      setAmount("");
      setDestination("");
      await refreshAccount();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo procesar el retiro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Retirar</h1>
      </div>
      <form className="form-card" onSubmit={onSubmit}>
        <label htmlFor="amount">Monto</label>
        <input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <label htmlFor="destination">Alias / CBU / cuenta destino</label>
        <input id="destination" required value={destination} onChange={(e) => setDestination(e.target.value)} />

        <p className="muted small">
          En este prototipo el retiro se marca como completado al instante; una integracion real
          requeriria conectar con transferencias bancarias (ver README).
        </p>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Procesando..." : "Retirar"}
        </button>
      </form>
    </div>
  );
}
