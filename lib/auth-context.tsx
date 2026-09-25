"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, setTokens, clearTokens, type Me } from "./api";

type AuthContextType = {
  user: Me | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasModule: (module: string) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const access = typeof window !== "undefined" ? localStorage.getItem("scrm_access") : null;
    if (!access) {
      setLoading(false);
      return;
    }
    api.me().then(setUser).catch(() => clearTokens()).finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string) {
    const data = (await api.login(username, password)) as { access: string; refresh: string; user: Me };
    setTokens(data.access, data.refresh);
    setUser(data.user);
    router.push(data.user.is_platform_admin ? "/platform" : "/dashboard");
  }

  function logout() {
    clearTokens();
    setUser(null);
    router.push("/login");
  }

  function hasModule(module: string) {
    if (!user) return false;
    return user.is_platform_admin || user.allowed_modules.includes(module);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasModule }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
