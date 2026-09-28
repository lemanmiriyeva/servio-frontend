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
    const pending: Promise<unknown> = access
        ? api.me().then(setUser).catch(() => clearTokens())
        : Promise.resolve();
    pending.finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string) {
    const data = (await api.login(username, password)) as { access: string; refresh: string; user: Me };
    setTokens(data.access, data.refresh);
    setUser(data.user);
    // Yalnız platforma admini (mağazasız) birbaşa /platform-a düşür; mağazası olan hesab servis panelində qalır, Platforma sol menyudadır
    router.push(data.user.is_platform_admin && !data.user.shop ? "/platform" : "/dashboard");
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