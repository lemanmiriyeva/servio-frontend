"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Store, CircleCheck, Clock, Banknote, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useDialog } from "@/lib/dialog-context";
import { ShopTabs } from "./ShopTabs";
import { Loader } from "@/components/Loader";

type Shop = {
    id: string; name: string; code: string; owner_full_name: string; city: string;
    logo_initials: string; plan: { name: string; price_monthly: number } | null;
    status: "trial" | "active" | "overdue" | "blocked";
    trial_ends_at: string | null; next_payment_at: string | null;
    branch_count: number; user_count: number;
    is_active: boolean; disabled_reason: string;
    days_to_payment: number | null; payment_urgency: "ok" | "warning" | "soon" | "critical";
};

// Növbəti ödənişə qalan günə görə rəng: sarı (≤7g) → narıncı (≤3g) → qırmızı (≤1g/keçib)
const URGENCY_STYLE: Record<Shop["payment_urgency"], { dot: string; text: string }> = {
    ok: { dot: "#22C55E", text: "var(--ink2)" },
    warning: { dot: "#EAB308", text: "#A16207" },
    soon: { dot: "#F97316", text: "#C2410C" },
    critical: { dot: "#EF4444", text: "#B91C1C" },
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
    const { user } = useAuth();
    const isSuperadmin = !!user?.is_superadmin;
    const [stats, setStats] = useState<Stats | null>(null);
    const [shops, setShops] = useState<Shop[] | null>(null);
    const [filter, setFilter] = useState<"all" | Shop["status"]>("all");
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const { prompt } = useDialog();

    async function toggleShopActive(s: Shop) {
        const next = !s.is_active;
        let reason = "";
        if (!next) {
            reason = (await prompt(
                `${s.name} mağazasını bağlamaq üzrəsiniz — bütün istifadəçiləri giriş edə bilməyəcək.\n` +
                "Səbəbi yazın (istifadəçiyə giriş zamanı göstəriləcək):",
                { title: "Mağazanı bağla", label: "Səbəb", defaultValue: "Baş Admin tərəfindən söndürülüb.", confirmLabel: "Bağla" }
            )) ?? "";
            if (!reason.trim()) return; // ləğv edildi
        }
        setTogglingId(s.id);
        try {
            const updated = (await api.updateShop(s.id, {
                is_active: next,
                disabled_reason: next ? "" : reason,
                ...(next ? { status: "active" } : { status: "blocked" }),
            })) as Shop;
            setShops((prev) => (prev ?? []).map((x) => (x.id === s.id ? { ...x, ...updated } : x)));
        } catch {
            alert("Dəyişiklik saxlanılmadı, yenidən cəhd edin.");
        } finally {
            setTogglingId(null);
        }
    }

    useEffect(() => {
        if (!isSuperadmin) return; // mağaza sahibi üçün aşağıdakı sorğular 403 verər — lazım deyil
        api.platformDashboard().then((d) => setStats(d as Stats)).catch(() => setError("Statistika yüklənmədi."));
        api.shops("?page_size=200").then((d) => {
            const data = d as { results?: Shop[] } | Shop[];
            setShops(Array.isArray(data) ? data : data.results ?? []);
        }).catch(() => setError("Mağaza siyahısı yüklənmədi."));
    }, [isSuperadmin]);

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

    // Mağaza sahibi (owner rolu) "platformaya" bu yoldan girir, amma yalnız ÖZ mağazasını görür —
    // digər mağazaların siyahısı, platforma-admin bölmələri (Planlar, Sayt məzmunu və s.) yoxdur.
    if (!isSuperadmin) {
        if (!user?.shop) return <Loader />;
        return (
            <>
                <div>
                    <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">{user.shop.name}</h1>
                    <p className="text-ink2 mt-1">Mağazanızın bütün məlumatları — müştərilər, təmirlər, anbar, kassa, istifadəçilər.
                        {user.shop.next_payment_at && (
                            <>
                                {` · Növbəti ödəniş: ${user.shop.next_payment_at}`}
                                {typeof user.shop.days_to_payment === "number" && (
                                    <b className={user.shop.days_to_payment < 0 ? "neg ml-1" : "ml-1"}>
                                        ({user.shop.days_to_payment >= 0 ? `${user.shop.days_to_payment} gün qalıb` : `${Math.abs(user.shop.days_to_payment)} gün gecikib`})
                                    </b>
                                )}
                            </>
                        )}
                    </p>
                </div>
                <ShopTabs shopId={user.shop.id} />
            </>
        );
    }

    return (
        <>
            <div>
                <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Ümumi baxış</h1>
                <p className="text-ink2 mt-1">Servio-dan istifadə edən bütün servislər, planları və hesab vəziyyəti.</p>
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
                            <div className="flex-none w-[170px]">Vəziyyət</div>
                            <div className="flex-none w-[140px]">Növbəti ödəniş</div>
                            <div className="flex-none w-[90px] text-right">Aylıq</div>
                            <div className="flex-none w-[70px] text-center">Aktiv</div>
                        </div>
                        {filtered.map((s, i) => {
                            const st = STATUS[s.status];
                            const left = s.status === "trial" ? trialDaysLeft(s.trial_ends_at) : null;
                            const urgency = URGENCY_STYLE[s.payment_urgency] ?? URGENCY_STYLE.ok;
                            return (
                                <div key={s.id} className="tr" style={{ alignItems: "flex-start" }}>
                                    <Link href={`/kapitan/shops/${s.id}`} className="flex-[1.7] flex items-center gap-2.5 min-w-0">
                                        <div className={`av ${AV[i % AV.length]}`}>{s.logo_initials || s.name.slice(0, 2).toUpperCase()}</div>
                                        <div className="min-w-0"><b className="block truncate">{s.name}</b><span className="text-xs text-muted truncate block">{s.owner_full_name}{s.city ? ` · ${s.city}` : ""}</span></div>
                                    </Link>
                                    <Link href={`/kapitan/shops/${s.id}`} className="flex-none w-[100px]">{s.plan ? <span className={`badge ${s.plan.name.toLowerCase() === "pro" ? "b-purple" : "b-blue"}`}><i />{s.plan.name}</span> : <span className="mut">—</span>}</Link>
                                    <Link href={`/kapitan/shops/${s.id}`} className="flex-none w-[70px] text-center">{s.branch_count}</Link>
                                    <Link href={`/kapitan/shops/${s.id}`} className="flex-none w-[90px] text-center">{s.user_count}</Link>
                                    <Link href={`/kapitan/shops/${s.id}`} className="flex-none w-[170px]">
                                        <span className={`badge ${st.badge}`}><i />{st.label}</span>
                                        {left !== null && left >= 0 && (
                                            <span className="block text-[11px] mt-1 text-muted truncate">{left} gün qalıb</span>
                                        )}
                                        {!s.is_active && s.disabled_reason && (
                                            <span className="block text-[11px] mt-1 text-muted truncate" title={s.disabled_reason}>{s.disabled_reason}</span>
                                        )}
                                    </Link>
                                    <Link href={`/kapitan/shops/${s.id}`} className="flex-none w-[140px] text-sm font-medium" style={{ color: urgency.text }}>
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full flex-none" style={{ background: urgency.dot }} />
                                            {s.next_payment_at ?? "—"}
                                        </span>
                                        {s.days_to_payment !== null && (
                                            <span className="block text-[11px] text-muted">
                                                {s.days_to_payment >= 0 ? `${s.days_to_payment} gün qalıb` : `${Math.abs(s.days_to_payment)} gün gecikib`}
                                            </span>
                                        )}
                                    </Link>
                                    <Link href={`/kapitan/shops/${s.id}`} className="flex-none w-[90px] text-right font-semibold">{s.plan && s.status !== "trial" ? `${fmt(s.plan.price_monthly)} AZN` : "—"}</Link>
                                    <div className="flex-none w-[70px] flex justify-center">
                                        <button
                                            type="button"
                                            disabled={togglingId === s.id}
                                            onClick={(e) => { e.preventDefault(); toggleShopActive(s); }}
                                            title={s.is_active ? "Mağazanı söndür" : "Mağazanı aktivləşdir"}
                                            className="w-10 h-6 rounded-full relative transition-colors flex-none disabled:opacity-50"
                                            style={{ background: s.is_active ? "#22C55E" : "#D1D5DB" }}
                                        >
                                            <span
                                                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                                                style={{ left: 2, transform: s.is_active ? "translateX(16px)" : "translateX(0)" }}
                                            />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {shops && filtered.length === 0 && <div className="text-center text-muted text-sm py-10">Mağaza tapılmadı.</div>}
                        {!shops && !error && <Loader />}
                    </div>
                </div>
            </div>
        </>
    );
}