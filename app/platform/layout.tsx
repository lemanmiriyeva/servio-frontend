"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PlatformProvider, usePlatform } from "@/lib/platform-context";
import { LogoMark } from "@/components/site/Logo";
import { Loader } from "@/components/Loader";

function Shell({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const { resources } = usePlatform();
    const pathname = usePathname();
    const router = useRouter();
    const isSuperadmin = !!user?.is_superadmin;

    // İki səviyyəli naviqasiya: Bölmə (section, məs. "Müştəri bazası", "Sayt məzmunu") → onun daxilində
    // qruplar (group) → hər qrupun elementləri. `hidden` olan resurslar (bir mağazaya aid, "Ətraflı"
    // səhifəsində tab kimi açılanlar) burada göstərilmir — yalnız öz API-ları ilə işləyir.
    // Mağaza sahibi (owner rolu) üçün heç bir qrup göstərilmir — onun üçün "platforma" elə öz
    // mağazasının tək səhifəsidir (bütün tab-lar "Ümumi baxış"ın özündədir), başqa mağaza görmür.
    const sections: { name: string; groups: { name: string; items: { key: string; label: string }[] }[] }[] = [];
    if (isSuperadmin) {
        (resources ?? []).forEach((r) => {
            if (r.hidden) return;
            let s = sections.find((x) => x.name === r.section);
            if (!s) { s = { name: r.section, groups: [] }; sections.push(s); }
            let g = s.groups.find((x) => x.name === r.group);
            if (!g) { g = { name: r.group, items: [] }; s.groups.push(g); }
            g.items.push({ key: r.key, label: r.label });
        });
    }

    const linkCls = (active: boolean) =>
        `flex items-center gap-2.5 px-3 h-10 rounded-lg text-sm font-medium ${active ? "bg-side text-white" : "text-ink2 hover:bg-gray-100"}`;

    return (
        <div className="min-h-screen bg-bg flex flex-col">
            <header className="h-16 bg-side text-white flex items-center gap-3 px-4 md:px-6 flex-none">
                <Link
                    href="/platform"
                    title="Ana səhifə"
                    className="w-9 h-9 rounded-[9px] bg-white flex items-center justify-center flex-none"
                >
                    <LogoMark size={22} />
                </Link>
                <div className="leading-tight">
                    <b className="block text-sm">{isSuperadmin ? "Servio Platform" : user?.shop?.name ?? "Servio Platform"}</b>
                    <span className="text-xs text-[#8FA9B2]">{isSuperadmin ? "Super Admin panel" : "Mağaza admin paneli"}</span>
                </div>
                <div className="flex-1" />
                {user?.shop && (
                    <Link href="/dashboard" className="h-10 px-3.5 rounded-[10px] bg-white/10 flex items-center text-sm font-semibold">Servis paneli</Link>
                )}
                <span className="text-sm text-[#8FA9B2] hidden sm:block">{user?.first_name} {user?.last_name}</span>
                <button onClick={logout} className="w-10 h-10 rounded-[10px] bg-white/10 flex items-center justify-center" title="Çıxış"><LogOut size={18} /></button>
            </header>

            <div className="flex flex-1 min-h-0">
                <aside className="hidden md:flex w-[248px] flex-none flex-col gap-4 p-3 border-r border-line bg-white overflow-y-auto">
                    <Link href="/platform" className={linkCls(pathname === "/platform")}>
                        <LayoutDashboard size={18} /><span>Ümumi baxış</span>
                    </Link>
                    {sections.map((s) => (
                        <div key={s.name} className="flex flex-col gap-2 pt-2 border-t border-line first:border-t-0 first:pt-0">
                            {/* "Platforma" sözü sidebarda görünmür — müştəri üçün qarışıq, texniki termindir;
                                digər bölmə adları (Müştəri bazası, Sayt məzmunu, Planlar) faydalı olduğu üçün qalır. */}
                            {s.name !== "Platforma" && (
                                <span className="px-3 text-[12px] font-bold uppercase tracking-wide text-ink">{s.name}</span>
                            )}
                            {s.groups.map((g) => (
                                <div key={g.name} className="flex flex-col gap-0.5">
                                    {s.groups.length > 1 && (
                                        <span className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{g.name}</span>
                                    )}
                                    {g.items.map((it) => (
                                        <Link key={it.key} href={`/platform/${it.key}`} className={linkCls(pathname === `/platform/${it.key}`)}>
                                            <span className="truncate">{it.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </aside>

                <div className="flex-1 min-w-0 flex flex-col">
                    <div className="md:hidden p-3 border-b border-line bg-white">
                        <select
                            className="inp"
                            value={pathname}
                            onChange={(e) => router.push(e.target.value)}
                        >
                            <option value="/platform">Ümumi baxış</option>
                            {isSuperadmin && (resources ?? []).filter((r) => !r.hidden).map((r) => (
                                <option key={r.key} value={`/platform/${r.key}`}>{r.section} — {r.group} — {r.label}</option>
                            ))}
                        </select>
                    </div>
                    <main className="p-4 md:p-8 flex flex-col gap-5 w-full max-w-[1280px] mx-auto">{children}</main>
                </div>
            </div>
        </div>
    );
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    // Platform Super Admin — hər yerə. Mağaza admini (`is_shop_admin=True`, Rol sistemindən
    // tamam ayrı bir bayraq) — "platforma"ya daxil ola bilər, amma yalnız öz mağazasını görür
    // (bax: `/platform/page.tsx`-dəki mağaza admini budağı).
    const isShopOwner = !!(user?.shop && user?.is_shop_admin);
    const allowed = !!user?.is_superadmin || isShopOwner;

    useEffect(() => {
        if (loading) return;
        if (!user) router.replace("/login");
        else if (!user.is_superadmin && !isShopOwner) router.replace("/dashboard");
    }, [loading, user, isShopOwner, router]);

    if (loading || !allowed) {
        return <Loader fullScreen size={44} />;
    }
    return (
        <PlatformProvider>
            <Shell>{children}</Shell>
        </PlatformProvider>
    );
}