import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../utils/format";

export function Layout() {
  const { user, account, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Billetera</div>
        {account && (
          <div className="balance-card">
            <span className="balance-label">Saldo disponible</span>
            <span className="balance-amount">{formatMoney(account.balance, account.currency)}</span>
          </div>
        )}
        <nav className="nav">
          <NavLink to="/" end>
            Inicio
          </NavLink>
          <NavLink to="/transfer">Transferir</NavLink>
          <NavLink to="/deposit">Cargar saldo</NavLink>
          <NavLink to="/withdraw">Retirar</NavLink>
          <NavLink to="/merchant">Cuenta de comercio</NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{user?.fullName?.[0]?.toUpperCase() ?? "?"}</div>
            <div>
              <div className="user-name">{user?.fullName}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Cerrar sesion
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
