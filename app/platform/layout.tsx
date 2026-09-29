"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PlatformProvider, usePlatform } from "@/lib/platform-context";
import { LogoMark } from "@/components/site/Logo";

function Shell({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const { resources } = usePlatform();
    const pathname = usePathname();
    const router = useRouter();

    const groups: { name: string; items: { key: string; label: string }[] }[] = [];
    (resources ?? []).forEach((r) => {
        let g = groups.find((x) => x.name === r.group);
        if (!g) { g = { name: r.group, items: [] }; groups.push(g); }
        g.items.push({ key: r.key, label: r.label });
    });

    const linkCls = (active: boolean) =>
        `flex items-center gap-2.5 px-3 h-10 rounded-lg text-sm font-medium ${active ? "bg-side text-white" : "text-ink2 hover:bg-gray-100"}`;

    return (
        <div className="min-h-screen bg-bg flex flex-col">
            <header className="h-16 bg-side text-white flex items-center gap-3 px-4 md:px-6 flex-none">
                <div className="w-9 h-9 rounded-[9px] bg-white flex items-center justify-center">
                    <LogoMark size={22} />
                </div>
                <div className="leading-tight"><b className="block text-sm">Servio Platform</b><span className="text-xs text-[#8FA9B2]">Super Admin panel</span></div>
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
                    {groups.map((g) => (
                        <div key={g.name} className="flex flex-col gap-0.5">
                            <span className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{g.name}</span>
                            {g.items.map((it) => (
                                <Link key={it.key} href={`/platform/${it.key}`} className={linkCls(pathname === `/platform/${it.key}`)}>
                                    <span className="truncate">{it.label}</span>
                                </Link>
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
                            {(resources ?? []).map((r) => (
                                <option key={r.key} value={`/platform/${r.key}`}>{r.group} — {r.label}</option>
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
    const allowed = !!user?.is_superadmin;

    useEffect(() => {
        if (loading) return;
        if (!user) router.replace("/login");
        else if (!user.is_superadmin) router.replace("/dashboard");
    }, [loading, user, router]);

    if (loading || !allowed) {
        return <div className="min-h-screen flex items-center justify-center bg-bg text-muted text-sm">Yüklənir…</div>;
    }
    return (
        <PlatformProvider>
            <Shell>{children}</Shell>
        </PlatformProvider>
    );
}