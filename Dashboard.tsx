import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatMoney } from "../utils/format";

interface HistoryItem {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "PAYMENT";
  status: string;
  amount: number;
  direction: "IN" | "OUT";
  description: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<HistoryItem["type"], string> = {
  DEPOSIT: "Carga de saldo",
  WITHDRAWAL: "Retiro",
  TRANSFER: "Transferencia",
  PAYMENT: "Pago",
};

export function Dashboard() {
  const { account, refreshAccount } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshAccount();
    apiFetch<HistoryItem[]>("/wallet/history")
      .then(setHistory)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Inicio</h1>
      </div>

      <div className="stat-card">
        <span className="muted">Saldo disponible</span>
        <span className="stat-amount">
          {account ? formatMoney(account.balance, account.currency) : "-"}
        </span>
      </div>

      <h2 className="section-title">Movimientos recientes</h2>
      {loading && <p className="muted">Cargando...</p>}
      {!loading && history.length === 0 && (
        <p className="muted">Todavia no tenes movimientos. Carga saldo para empezar.</p>
      )}
      <ul className="history-list">
        {history.map((h) => (
          <li key={h.id} className="history-item">
            <div className={`history-icon ${h.direction === "IN" ? "in" : "out"}`}>
              {h.direction === "IN" ? "+" : "-"}
            </div>
            <div className="history-details">
              <div className="history-title">{h.description || TYPE_LABELS[h.type]}</div>
              <div className="history-meta">
                {TYPE_LABELS[h.type]} - {formatDate(h.createdAt)}
              </div>
            </div>
            <div className={`history-amount ${h.direction === "IN" ? "in" : "out"}`}>
              {h.direction === "IN" ? "+" : "-"}
              {formatMoney(h.amount)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
