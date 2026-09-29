"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Users, Wrench, Truck, Boxes, Wallet, Receipt,
  CreditCard, BarChart3, ShieldCheck, UsersRound, Bell, Settings2, LogOut, Crown,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { LogoMark } from "@/components/site/Logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, module: null },
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

export function Sidebar() {
  const pathname = usePathname();
  const { user, hasModule, logout } = useAuth();

  return (
      <aside className="w-[264px] flex-none bg-side text-white py-6 pb-5 flex flex-col gap-6 h-screen sticky top-0">
        <div className="flex items-center gap-3 px-2">
          <div className="w-11 h-11 rounded-[10px] bg-white/[0.06] flex items-center justify-center flex-none">
            <LogoMark size={26} />
          </div>
          <div className="min-w-0">
            <b className="block text-[15px] font-semibold truncate">{user?.shop?.name || "Servio"}</b>
            <span className="text-xs text-[#8FA9B2] truncate block">{user?.branch?.name || ""}</span>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto">
          {user?.is_superadmin && (
              <Link href="/platform" className={`ni ${pathname.startsWith("/platform") ? "on" : ""}`}>
                <Crown size={20} />
                <span>Platforma (Super Admin)</span>
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
  );
}