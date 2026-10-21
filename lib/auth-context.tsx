"use client";
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
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

// Fəaliyyətsizlik (inactivity) session timeout — 5 dəqiqə heç bir hərəkət olmasa, avtomatik
// çıxış edilib login səhifəsinə yönləndirilir. Son fəaliyyət vaxtı `localStorage`-da saxlanılır ki,
// bir neçə tab açıq olanda BİRİNDƏ fəaliyyət olsa, digərləri də "aktiv" sayılsın.
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 dəqiqə
const LAST_ACTIVITY_KEY = "scrm_last_activity";
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "wheel"] as const;

// Tablar arası əlaqə (BroadcastChannel): yeni açılan tab "başqa açıq tab var?" deyə soruşur.
// Cavab verən varsa — eyni sessiyadır (Ctrl+klik / "Yeni tabda aç" / "Duplicate"), çıxış edilmir.
// Heç kim cavab vermirsə — bütün tablar bağlanıb, brauzer yenidən açılıb: çıxış edilir.
// (BroadcastChannel mesajları taymer deyil, hadisə ilə çatır — arxa fondakı tab da dərhal cavab verir.)
const CHANNEL = "servio-auth";
const TAB_ID = Math.random().toString(36).slice(2);

function askOtherTabs(): Promise<boolean> {
  // Çox köhnə brauzer (BroadcastChannel yoxdur) — təhlükəsiz tərəf: istifadəçini atmırıq.
  if (typeof BroadcastChannel === "undefined") return Promise.resolve(true);
  return new Promise((resolve) => {
    const ch = new BroadcastChannel(CHANNEL);
    const done = (v: boolean) => { clearTimeout(timer); ch.close(); resolve(v); };
    ch.onmessage = (e) => {
      if (e.data?.t === "alive" && e.data.from !== TAB_ID) done(true);
    };
    const timer = setTimeout(() => done(false), 700);
    ch.postMessage({ t: "hello", from: TAB_ID });
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const userRef = useRef<Me | null>(null);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }
    (async () => {
      const access = localStorage.getItem("scrm_access");
      // sessionStorage: səhifə YENİLƏNƏNDƏ və "Duplicate" edəndə brauzer onu saxlayır/kopyalayır,
      // yeni boş tabda (Ctrl+klik, "Yeni tabda aç") isə BOŞ olur — ona görə tək başına kifayət deyil.
      const sessionAlive = sessionStorage.getItem("scrm_tab_alive");
      sessionStorage.setItem("scrm_tab_alive", "1");
      if (access && !sessionAlive) {
        // Yeni tab: başqa açıq tab varsa sessiya davam edir, yoxdursa (hamısı bağlanıb) çıxış.
        const otherTab = await askOtherTabs();
        if (!otherTab) {
          clearTokens();
          setLoading(false);
          return;
        }
      }
      if (access) {
        try { setUser(await api.me()); } catch { clearTokens(); }
      }
      setLoading(false);
    })();
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

  // Bu tab açıqdır: başqa yeni tab "kimsə var?" soruşanda cavab verir.
  useEffect(() => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = (e) => {
      if (e.data?.t === "hello" && e.data.from !== TAB_ID && localStorage.getItem("scrm_access")) {
        ch.postMessage({ t: "alive", from: TAB_ID });
      }
    };
    return () => ch.close();
  }, []);

  // Çıxış HƏR tabda eyni vaxtda: hansısa tabda çıxış ediləndə (düymə, hərəkətsizlik, token
  // bitməsi) token `localStorage`-dan silinir — digər tablar `storage` hadisəsi ilə bunu görüb
  // dərhal login səhifəsinə keçir. (Bu hadisə yalnız BAŞQA tablarda atəşlənir.)
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onStorage(e: StorageEvent) {
      const loggedOut = e.key === "scrm_access" ? e.newValue === null : e.key === null;
      if (loggedOut && userRef.current) {
        setUser(null);
        window.location.href = "/login";
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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

  // Giriş olunduqdan sonra fəaliyyətsizliyi izləyir — 5 dəq ərzində heç bir klik/klaviatura/skrol
  // olmasa, istifadəçi təhlükəsizlik üçün avtomatik çıxış edilib login səhifəsinə atılır.
  // Tab arxa fonda ola bilər (brauzer taymeri yavaşladır) — ona görə tab yenidən görünəndə də
  // DƏRHAL yoxlanılır.
  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    let lastWrite = 0;
    function touch() {
      const now = Date.now();
      if (now - lastWrite < 1000) return; // localStorage-a saniyədə 1-dən çox yazma
      lastWrite = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    }
    touch();
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, touch, { passive: true }));

    function checkIdle() {
      const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || Date.now());
      if (Date.now() - last >= INACTIVITY_TIMEOUT_MS) {
        clearInterval(timer);
        logout();
      }
    }
    const timer = setInterval(checkIdle, 15_000);
    const onVis = () => { if (document.visibilityState === "visible") checkIdle(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, touch));
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(timer);
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