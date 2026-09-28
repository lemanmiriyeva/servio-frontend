"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Store, CircleCheck, Clock, Banknote, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Shop = {
    id: string; name: string; code: string; owner_full_name: string; city: string;
    logo_initials: string; plan: { name: string; price_monthly: number } | null;
    status: "trial" | "active" | "overdue" | "blocked";
    trial_ends_at: string | null; next_payment_at: string | null;
    branch_count: number; user_count: number;
};
type Stats = {
    total_shops: number; active_count: number; trial_count: number;
    overdue_count: number; blocked_count: number; mrr: number; open_tickets: number;
};

const STATUS: Record<Shop["status"], { label: string; badge: string }> = {
    active: { label: "Aktiv", badge: "b-green" },
    trial: { label: "Sınaq", badge: "b-amber" },
    overdue: { label: "Ödəniş gecikib", badge: "b-red" },
    blocked: { label: "Bloklanıb", badge: "b-gray" },
};
const AV = ["a1", "a2", "a3", "a4", "a5"];
const fmt = (n: number) => new Intl.NumberFormat("az-AZ").format(Math.round(Number(n)));

function trialDaysLeft(d: string | null) {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export default function PlatformPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [shops, setShops] = useState<Shop[] | null>(null);
    const [filter, setFilter] = useState<"all" | Shop["status"]>("all");
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (loading) return;
        if (!user) { router.replace("/login"); return; }
        if (!user.is_platform_admin) { router.replace("/dashboard"); return; }
        api.platformDashboard().then((d) => setStats(d as Stats)).catch(() => setError("Statistika yüklənmədi."));
        api.shops("?page_size=200").then((d) => {
            const data = d as { results?: Shop[] } | Shop[];
            setShops(Array.isArray(data) ? data : data.results ?? []);
        }).catch(() => setError("Mağaza siyahısı yüklənmədi."));
    }, [loading, user, router]);

    const filtered = useMemo(() => {
        let list = shops ?? [];
        if (filter !== "all") list = list.filter((s) => s.status === filter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.owner_full_name.toLowerCase().includes(q));
        }
        return list;
    }, [shops, filter, search]);

    const tabs: { k: "all" | Shop["status"]; l: string }[] = [
        { k: "all", l: "Hamısı" }, { k: "active", l: "Aktiv" }, { k: "trial", l: "Sınaq" },
        { k: "overdue", l: "Ödəniş gecikib" }, { k: "blocked", l: "Bloklanıb" },
    ];

    return (
        <div className="min-h-screen bg-bg">
            <header className="h-16 bg-side text-white flex items-center gap-3 px-6">
                <div className="w-9 h-9 rounded-[9px] bg-brand text-side font-bold flex items-center justify-center">SC</div>
                <div className="leading-tight"><b className="block text-sm">ServisCRM Platform</b><span className="text-xs text-[#8FA9B2]">Super Admin panel</span></div>
                <div className="flex-1" />
                {user?.shop && (
                    <Link href="/dashboard" className="h-10 px-3.5 rounded-[10px] bg-white/10 flex items-center text-sm font-semibold">Servis paneli</Link>
                )}
                <span className="text-sm text-[#8FA9B2] hidden sm:block">{user?.first_name} {user?.last_name}</span>
                <button onClick={logout} className="w-10 h-10 rounded-[10px] bg-white/10 flex items-center justify-center" title="Çıxış"><LogOut size={18} /></button>
            </header>

            <main className="p-5 md:p-8 flex flex-col gap-5 max-w-[1280px] mx-auto">
                <div>
                    <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Mağazalar</h1>
                    <p className="text-ink2 mt-1">ServisCRM-dən istifadə edən bütün servislər, planları və hesab vəziyyəti.</p>
                </div>

                {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { l: "Ümumi mağaza", v: stats?.total_shops, c: "t-blue", I: Store, f: stats ? `${stats.blocked_count} bloklanıb` : "" },
                        { l: "Aktiv abunə", v: stats?.active_count, c: "t-green", I: CircleCheck, f: stats ? `${stats.overdue_count} ödəniş gecikib` : "" },
                        { l: "Sınaq müddətində", v: stats?.trial_count, c: "t-amber", I: Clock, f: stats ? `${stats.open_tickets} açıq dəstək sorğusu` : "" },
                        { l: "Aylıq gəlir (MRR)", v: stats ? fmt(stats.mrr) : undefined, c: "t-purple", I: Banknote, f: "AZN / ay" },
                    ].map((k) => (
                        <div key={k.l} className="card flex flex-col gap-2.5">
                            <div className="flex items-center justify-between text-[13px] text-ink2 font-medium">
                                <span>{k.l}</span>
                                <span className={`${k.c} w-9 h-9 rounded-[9px] flex items-center justify-center`}><k.I size={18} /></span>
                            </div>
                            <div className="text-[28px] font-semibold tracking-tight leading-none">{k.v ?? "—"}</div>
                            <div className="text-xs text-muted">{k.f}</div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex gap-2 flex-wrap">
                        {tabs.map((t) => (
                            <button key={t.k} onClick={() => setFilter(t.k)}
                                    className={`h-[38px] px-3.5 rounded-full border font-semibold text-sm ${filter === t.k ? "bg-side border-side text-white" : "bg-white border-line text-ink2"}`}>
                                {t.l}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1" />
                    <div className="h-11 px-3.5 rounded-[10px] bg-white border border-line flex items-center gap-2.5 min-w-[240px]">
                        <Search size={18} className="text-muted flex-none" />
                        <input className="w-full outline-none bg-transparent text-sm" placeholder="Mağaza, kod və ya sahib" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="card !p-2">
                    <div className="overflow-x-auto">
                        <div className="min-w-[820px]">
                            <div className="tr h">
                                <div className="flex-[1.7]">Mağaza</div>
                                <div className="flex-none w-[100px]">Plan</div>
                                <div className="flex-none w-[70px] text-center">Filial</div>
                                <div className="flex-none w-[90px] text-center">İstifadəçi</div>
                                <div className="flex-none w-[170px]">Status</div>
                                <div className="flex-none w-[120px]">Növbəti ödəniş</div>
                                <div className="flex-none w-[90px] text-right">Aylıq</div>
                            </div>
                            {filtered.map((s, i) => {
                                const st = STATUS[s.status];
                                const left = s.status === "trial" ? trialDaysLeft(s.trial_ends_at) : null;
                                return (
                                    <div key={s.id} className="tr">
                                        <div className="flex-[1.7] flex items-center gap-2.5 min-w-0">
                                            <div className={`av ${AV[i % AV.length]}`}>{s.logo_initials || s.name.slice(0, 2).toUpperCase()}</div>
                                            <div className="min-w-0"><b className="block truncate">{s.name}</b><span className="text-xs text-muted truncate block">{s.owner_full_name}{s.city ? ` · ${s.city}` : ""}</span></div>
                                        </div>
                                        <div className="flex-none w-[100px]">{s.plan ? <span className={`badge ${s.plan.name.toLowerCase() === "pro" ? "b-purple" : "b-blue"}`}><i />{s.plan.name}</span> : <span className="mut">—</span>}</div>
                                        <div className="flex-none w-[70px] text-center">{s.branch_count}</div>
                                        <div className="flex-none w-[90px] text-center">{s.user_count}</div>
                                        <div className="flex-none w-[170px]"><span className={`badge ${st.badge}`}><i />{st.label}{left !== null && left >= 0 ? ` — ${left} gün qalıb` : ""}</span></div>
                                        <div className="flex-none w-[120px] text-ink2 text-sm">{s.next_payment_at ?? "—"}</div>
                                        <div className="flex-none w-[90px] text-right font-semibold">{s.plan && s.status !== "trial" ? `${fmt(s.plan.price_monthly)} AZN` : "—"}</div>
                                    </div>
                                );
                            })}
                            {shops && filtered.length === 0 && <div className="text-center text-muted text-sm py-10">Mağaza tapılmadı.</div>}
                            {!shops && !error && <div className="text-center text-muted text-sm py-10">Yüklənir…</div>}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}