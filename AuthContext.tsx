import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch, getToken, setToken } from "../api/client";

interface User {
  id: string;
  email: string;
  fullName: string;
}
interface Account {
  id: string;
  balance: number;
  currency: string;
}

interface AuthContextValue {
  user: User | null;
  account: Account | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  refreshAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAccount = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setAccount(null);
      return;
    }
    try {
      const data = await apiFetch<{ user: User; account: Account }>("/wallet/me");
      setUser(data.user);
      setAccount(data.account);
    } catch {
      setToken(null);
      setUser(null);
      setAccount(null);
    }
  }, []);

  useEffect(() => {
    refreshAccount().finally(() => setLoading(false));
  }, [refreshAccount]);

  async function login(email: string, password: string) {
    const data = await apiFetch<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false,
    });
    setToken(data.token);
    await refreshAccount();
  }

  async function register(email: string, password: string, fullName: string) {
    const data = await apiFetch<{ token: string; user: User; account: Account }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ email, password, fullName }),
        auth: false,
      }
    );
    setToken(data.token);
    setUser(data.user);
    setAccount(data.account);
  }

  function logout() {
    setToken(null);
    setUser(null);
    setAccount(null);
  }

  return (
    <AuthContext.Provider value={{ user, account, loading, login, register, logout, refreshAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
