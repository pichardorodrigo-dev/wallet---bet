import { FormEvent, useState } from "react";
import { apiFetch, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function Transfer() {
  const { refreshAccount } = useAuth();
  const [toEmail, setToEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await apiFetch("/transfers", {
        method: "POST",
        body: JSON.stringify({ toEmail, amount: parseFloat(amount), description: description || undefined }),
      });
      setSuccess(`Transferencia enviada a ${toEmail}`);
      setToEmail("");
      setAmount("");
      setDescription("");
      await refreshAccount();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo realizar la transferencia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Transferir</h1>
      </div>
      <form className="form-card" onSubmit={onSubmit}>
        <label htmlFor="toEmail">Email del destinatario</label>
        <input id="toEmail" type="email" required value={toEmail} onChange={(e) => setToEmail(e.target.value)} />

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

        <label htmlFor="description">Descripcion (opcional)</label>
        <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Transferir"}
        </button>
      </form>
    </div>
  );
}
