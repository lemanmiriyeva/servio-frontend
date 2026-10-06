"use client";
import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Users, Wrench, Truck, Boxes, Wallet, Receipt,
  CreditCard, BarChart3, ShieldCheck, UsersRound, Bell, Settings2, LogOut, Crown,
  ArrowLeft, LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usePlatform } from "@/lib/platform-context";
import { LogoMark } from "@/components/site/Logo";
import { X } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Ana səhifə", icon: LayoutGrid, module: null },
  { href: "/customers", label: "Müştərilər", icon: Users, module: "customers" },
  { href: "/repairs", label: "Təmir / Xidmətlər", icon: Wrench, module: "repairs" },
  { href: "/suppliers", label: "Təchizatçılar", icon: Truck, module: "suppliers" },
  { href: "/inventory", label: "Anbar", icon: Boxes, module: "inventory" },
  { href: "/cashbox", label: "Kassa", icon: Wallet, module: "cashbox" },
  { href: "/expenses", label: "Xərclər", icon: Receipt, module: "expenses" },
  { href: "/debts", label: "Borclar", icon: CreditCard, module: "debts" },
  { href: "/reports", label: "Hesabatlar", icon: BarChart3, module: "reports" },
  { href: "/warranties", label: "Zəmanətlər", icon: ShieldCheck, module: null },
  { href: "/users", label: "İstifadəçilər", icon: UsersRound, module: "users" },
  { href: "/notifications", label: "Bildirişlər", icon: Bell, module: null },
  { href: "/settings", label: "Parametrlər", icon: Settings2, module: "settings" },
] as const;

type SidebarProps = {
  // Mobil (md-dən aşağı) ekranlarda sidebar defolt gizlidir — bu, onu sağa sürüşərək açır
  // (Topbar-dakı "menyu" düyməsi ilə). md+ ekranlarda hər zaman görünür, bu props-ların təsiri yoxdur.
  open?: boolean;
  onClose?: () => void;
};

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, hasModule, logout } = useAuth();
  const { resources } = usePlatform();

  const inPlatform = pathname.startsWith("/platform");
  const isSuperadmin = !!user?.is_superadmin;
  const canUsePlatform = isSuperadmin || !!(user?.shop && user?.is_shop_admin);
  // Mağazaya bağlı olmayan saf Platform Super Admin üçün "İdarəetmə paneli"nə (adi mağaza
  // dashboard-u) qayıdışın mənası yoxdur — onun göstəriləcək mağazası yoxdur.
  const hasDashboard = !!user?.shop;

  // Platforma naviqasiyası YALNIZ Super Admin üçün bölmə/qrup ağacı ilə qurulur (mağaza admini
  // üçün alt-bölmə yoxdur — onun "Ümumi baxış"ı elə öz mağazasıdır, bax `/platform/page.tsx`).
  const sections = useMemo(() => {
    const secs: { name: string; items: { key: string; label: string }[] }[] = [];
    if (!isSuperadmin) return secs;
    (resources ?? []).forEach((r) => {
      if (r.hidden) return;
      let s = secs.find((x) => x.name === r.section);
      if (!s) { s = { name: r.section, items: [] }; secs.push(s); }
      s.items.push({ key: r.key, label: r.label });
    });
    return secs;
  }, [resources, isSuperadmin]);

  return (
      <>
        {/* Mobil qaranlıq fon — sidebar açıq olanda, kənara klik edəndə bağlanır. md+ ekranda görünmür. */}
        {open && (
            <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={onClose} />
        )}
        <aside
            className={`w-[264px] flex-none bg-side text-white py-6 pb-5 flex flex-col gap-6 h-screen
            fixed md:sticky top-0 left-0 z-50 md:z-auto transition-transform duration-200
            ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        >
          <div className="flex items-center gap-3 px-2">
            <Link
                href={hasDashboard ? "/dashboard" : "/platform"}
                title="Ana səhifə"
                className="w-11 h-11 rounded-[10px] bg-white flex items-center justify-center flex-none"
            >
              <LogoMark size={26} />
            </Link>
            <div className="min-w-0 flex-1">
              <b className="block text-[15px] font-semibold truncate">{user?.shop?.name || "Servio"}</b>
              <span className="text-xs text-[#8FA9B2] truncate block">{user?.branch?.name || ""}</span>
            </div>
            <button onClick={onClose} className="md:hidden text-[#8FA9B2] hover:text-white flex-none" title="Bağla">
              <X size={20} />
            </button>
          </div>

          <nav className="no-scrollbar flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto" onClick={onClose}>
            {inPlatform && canUsePlatform ? (
                <>
                  {hasDashboard && (
                      <Link href="/dashboard" className="ni mb-1">
                        <ArrowLeft size={20} />
                        <span>İdarəetmə panelinə qayıt</span>
                      </Link>
                  )}
                  <Link href="/platform" className={`ni ${pathname === "/platform" ? "on" : ""}`}>
                    <LayoutDashboard size={20} />
                    <span>Ümumi baxış</span>
                  </Link>
                  {sections.map((s) => (
                      <div key={s.name} className="flex flex-col gap-0.5 mt-3 pt-3 border-t border-white/10 first:mt-1 first:pt-1 first:border-t-0">
                        {/* "Platforma" sözü sidebarda görünmür — müştəri üçün qarışıq, texniki termindir. */}
                        {s.name !== "Platforma" && (
                            <span className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#8FA9B2]">{s.name}</span>
                        )}
                        {s.items.map((it) => (
                            <Link key={it.key} href={`/platform/${it.key}`} className={`ni-sm ${pathname === `/platform/${it.key}` ? "on" : ""}`}>
                              <span className="truncate">{it.label}</span>
                            </Link>
                        ))}
                      </div>
                  ))}
                </>
            ) : (
                <>
                  {canUsePlatform && (
                      <Link href="/platform" className={`ni ${inPlatform ? "on" : ""}`}>
                        <Crown size={20} />
                        <span>Müştəri bazası</span>
                      </Link>
                  )}
                  {NAV.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    if (item.module && !hasModule(item.module)) return null;
                    const Icon = item.icon;
                    return (
                        <Link key={item.href} href={item.href} className={`ni ${active ? "on" : ""}`}>
                          <Icon size={20} />
                          <span>{item.label}</span>
                        </Link>
                    );
                  })}
                </>
            )}
          </nav>

          <div className="mx-3 mt-auto flex gap-2.5 items-center p-3 rounded-[10px] bg-white/[0.07]">
            <div className="av dk">{user?.initials || "?"}</div>
            <div className="min-w-0">
              <b className="block text-[13px] font-semibold truncate">
                {user ? `${user.first_name} ${user.last_name}`.trim() || user.username : ""}
              </b>
              <span className="text-xs text-[#8FA9B2] truncate block">{user?.role?.name || ""}</span>
            </div>
            <button onClick={logout} className="ml-auto text-[#8FA9B2] hover:text-white flex-none" title="Çıxış">
              <LogOut size={18} />
            </button>
          </div>
        </aside>
      </>
  );
}