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

// Fəaliyyətsizlik (inactivity) session timeout — 10 dəqiqə heç bir hərəkət olmasa, avtomatik
// çıxış edilib yenidən login səhifəsinə yönləndirilir. `localStorage`-da saxlanılır ki, bir neçə
// tab açıq olanda BİRİNDƏ fəaliyyət olsa, digərləri də "aktiv" sayılsın (vaxtından əvvəl atılmasın).
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 dəqiqə
const LAST_ACTIVITY_KEY = "scrm_last_activity";
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "wheel"] as const;

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

  // Brauzerin "geri/irəli keşi" (bfcache) çıxışdan sonra köhnə (daxil olunmuş) səhifə
  // görüntüsünü yaddaşdan göstərə bilər — `event.persisted` bunu bildirir. Belə olarsa
  // tokenin/istifadəçinin hələ etibarlı olub-olmadığını YENİDƏN yoxlamaq üçün səhifəni
  // yeniləyirik ki, köhnə ekran "hələ də daxiləm" təəssüratı yaratmasın.
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) window.location.reload();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function login(username: string, password: string) {
    const data = (await api.login(username, password)) as { access: string; refresh: string; user: Me };
    setTokens(data.access, data.refresh);
    setUser(data.user);
    // Mağazaya bağlı olan HƏR KƏS (adi işçi, mağaza admini) birbaşa /dashboard-a aparılır —
    // "Müştəri bazası"na sidebar-dakı linklə bir kliklə keçmək mümkündür. Mağazaya bağlı OLMAYAN
    // saf Platform Super Admin üçün isə /dashboard-un göstərəcəyi heç nə yoxdur (heç bir mağazası
    // yoxdur) — o, birbaşa "Müştəri bazası"na (/platform) aparılır.
    router.push(data.user.shop ? "/dashboard" : "/platform");
  }

  function logout() {
    clearTokens();
    if (typeof window !== "undefined") localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);
    // DİQQƏT: əvvəllər burada `router.push("/login")` idi — bu, Next.js-in client-side
    // router keşini (və bəzi brauzerlərdə "geri" düyməsinin bfcache-ini) təmizləmirdi.
    // Nəticədə çıxış edib yenidən saytı açanda (xüsusilə "geri" düyməsi ilə, ya da eyni
    // tab-da) qorunan səhifə hələ yaddaşdan göstərilə bilirdi — istifadəçi sanki hələ də
    // daxil olmuş kimi görünürdü, baxmayaraq ki token artıq silinib. `window.location`
    // ilə TAM səhifə yenilənməsi məcburi edilir ki, bütün React/router vəziyyəti sıfırlansın
    // və login səhifəsi həmişə təzə yüklənsin.
    if (typeof window !== "undefined") window.location.href = "/login";
    else router.push("/login");
  }

  // Giriş olunduqdan sonra fəaliyyətsizliyi izləyir — 10 dəq ərzində heç bir klik/klaviatura/skrol
  // olmasa, istifadəçi təhlükəsizlik üçün avtomatik çıxış edilib login səhifəsinə atılır.
  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    function touch() {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }
    touch();
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, touch, { passive: true }));

    const check = setInterval(() => {
      const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || Date.now());
      if (Date.now() - last >= INACTIVITY_TIMEOUT_MS) {
        clearInterval(check);
        logout();
      }
    }, 15_000);

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, touch));
      clearInterval(check);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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