"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Logo } from "./Logo";
import { NAV } from "@/lib/site-config";
import type { SiteSettingsContent } from "@/lib/site-content";
import { useAuth } from "@/lib/auth-context";

export function SiteHeader({ settings }: { settings: SiteSettingsContent }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const panelHref = user?.is_superadmin && !user.shop ? "/platform" : "/dashboard";

  const actions = loading ? null : user ? (
    <Link href={panelHref} className="h-11 px-5 rounded-[10px] bg-[#116CFB] hover:bg-[#3A85FF] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors">
      <LayoutDashboard size={17} />İdarəetmə paneli
    </Link>
  ) : (
    <>
      <Link href="/login" className="h-11 px-5 rounded-[10px] border border-white/25 hover:bg-white/10 text-white text-sm font-semibold inline-flex items-center transition-colors">Daxil ol</Link>
      <Link href="/elaqe" className="h-11 px-5 rounded-[10px] bg-[#116CFB] hover:bg-[#3A85FF] text-white text-sm font-semibold inline-flex items-center transition-colors">Başla</Link>
    </>
  );

  return (
    <header className="absolute top-0 inset-x-0 z-30">
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 h-[84px] flex items-center gap-8">
        <Link href="/" aria-label={settings.brand_name}><Logo src={settings.logo} alt={settings.brand_name} /></Link>
        <nav className="hidden lg:flex items-center gap-8 mx-auto">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`text-sm font-medium transition-colors ${active ? "text-white" : "text-white/70 hover:text-white"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden lg:flex items-center gap-3 ml-auto lg:ml-0">{actions}</div>
        <button className="lg:hidden ml-auto w-11 h-11 rounded-[10px] bg-white/10 text-white flex items-center justify-center" onClick={() => setOpen((o) => !o)} aria-label="Menyu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden mx-4 rounded-2xl bg-[#0B2A4D] border border-white/10 p-4 flex flex-col gap-1 shadow-2xl">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="px-3 py-3 rounded-lg text-white/85 hover:bg-white/10 text-[15px] font-medium">{n.label}</Link>
          ))}
          <div className="flex gap-3 pt-3 mt-2 border-t border-white/10" onClick={() => setOpen(false)}>{actions}</div>
        </div>
      )}
    </header>
  );
}
