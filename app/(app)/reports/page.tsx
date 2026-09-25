"use client";
import { useEffect, useState } from "react";
import { Calendar, TrendingUp, TrendingDown, Wrench, Users2 } from "lucide-react";
import { api } from "@/lib/api";

type ServiceRow = { service: string; count: number; sales: number; cost: number; profit: number };
type SupplierRow = { name: string; purchased: number; paid: number; debt: number };
type Summary = {
    period: { start: string; end: string };
    total_sales: number; total_cost: number; total_profit: number; total_expense: number; net_profit: number;
    customer_debt_total: number; supplier_debt_total: number;
    repair_count: number; customer_count: number;
    by_service: ServiceRow[]; by_supplier: SupplierRow[];
};

function fmt(n: number) {
    return new Intl.NumberFormat("az-AZ").format(Math.round(n));
}
function todayISO() { return new Date().toISOString().slice(0, 10); }
function monthStartISO() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }

const PRESETS = [
    { key: "month", label: "Bu ay", start: monthStartISO, end: todayISO },
    { key: "week", label: "Son 7 gün", start: () => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); }, end: todayISO },
    { key: "today", label: "Bu gün", start: todayISO, end: todayISO },
] as const;

export default function ReportsPage() {
    const [preset, setPreset] = useState<(typeof PRESETS)[number]["key"]>("month");
    const [start, setStart] = useState(monthStartISO());
    const [end, setEnd] = useState(todayISO());
    const [data, setData] = useState<Summary | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api.reportsSummary(`?start=${start}&end=${end}`)
            .then((d) => setData(d as Summary))
            .catch(() => setError("Hesabat yüklənmədi."));
    }, [start, end]);

    function applyPreset(p: (typeof PRESETS)[number]) {
        setPreset(p.key);
        setStart(p.start());
        setEnd(p.end());
    }

    const maxServiceSales = Math.max(1, ...(data?.by_service.map((s) => s.sales) ?? [1]));

    return (
        <>
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Hesabatlar</h1>
                    <p className="text-ink2 mt-1">{start} — {end} tarixləri üzrə.</p>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                    {PRESETS.map((p) => (
                        <button
                            key={p.key}
                            onClick={() => applyPreset(p)}
                            className={`h-[38px] px-3.5 rounded-full border font-semibold text-sm inline-flex items-center gap-1.5 ${preset === p.key ? "bg-side border-side text-white" : "bg-white border-line text-ink2"}`}
                        >
                            <Calendar size={14} />{p.label}
                        </button>
                    ))}
                    <input type="date" value={start} onChange={(e) => { setPreset("month"); setStart(e.target.value); }} className="inp !h-[38px] !w-[140px] text-sm" />
                    <span className="text-muted">—</span>
                    <input type="date" value={end} onChange={(e) => { setPreset("month"); setEnd(e.target.value); }} className="inp !h-[38px] !w-[140px] text-sm" />
                </div>
            </div>

            {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card">
                    <span className="text-ink2 text-[13px] font-medium">Satış</span>
                    <div className="text-2xl font-semibold tracking-tight mt-1.5">{data ? fmt(data.total_sales) : "—"} <small className="text-sm text-muted">AZN</small></div>
                </div>
                <div className="card">
                    <span className="text-ink2 text-[13px] font-medium">Maya dəyəri</span>
                    <div className="text-2xl font-semibold tracking-tight mt-1.5">{data ? fmt(data.total_cost) : "—"} <small className="text-sm text-muted">AZN</small></div>
                </div>
                <div className="card">
                    <span className="text-ink2 text-[13px] font-medium">Ümumi mənfəət</span>
                    <div className="text-2xl font-semibold tracking-tight mt-1.5 pos">{data ? fmt(data.total_profit) : "—"} <small className="text-sm text-muted">AZN</small></div>
                </div>
                <div className="card" style={{ background: "var(--side)" }}>
                    <span className="text-[13px] font-medium text-[#8FA9B2]">Xalis mənfəət</span>
                    <div className="text-2xl font-semibold tracking-tight mt-1.5 text-white">{data ? fmt(data.net_profit) : "—"} <small className="text-sm text-[#8FA9B2]">AZN</small></div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card flex items-center gap-3">
                    <span className="t-red w-10 h-10 rounded-[10px] flex items-center justify-center flex-none"><TrendingDown size={18} /></span>
                    <div><div className="text-xl font-semibold leading-none">{data ? fmt(data.total_expense) : "—"}</div><span className="text-xs text-muted">Xərc (AZN)</span></div>
                </div>
                <div className="card flex items-center gap-3">
                    <span className="t-amber w-10 h-10 rounded-[10px] flex items-center justify-center flex-none"><TrendingUp size={18} /></span>
                    <div><div className="text-xl font-semibold leading-none">{data ? fmt(data.customer_debt_total) : "—"}</div><span className="text-xs text-muted">Müştəri borcu</span></div>
                </div>
                <div className="card flex items-center gap-3">
                    <span className="t-purple w-10 h-10 rounded-[10px] flex items-center justify-center flex-none"><Wrench size={18} /></span>
                    <div><div className="text-xl font-semibold leading-none">{data?.repair_count ?? "—"}</div><span className="text-xs text-muted">Təmir sayı</span></div>
                </div>
                <div className="card flex items-center gap-3">
                    <span className="t-blue w-10 h-10 rounded-[10px] flex items-center justify-center flex-none"><Users2 size={18} /></span>
                    <div><div className="text-xl font-semibold leading-none">{data?.customer_count ?? "—"}</div><span className="text-xs text-muted">Ümumi müştəri</span></div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-5 items-start">
                <div className="flex-1 min-w-0 w-full">
                    <div className="card">
                        <h3 className="text-base font-semibold mb-4">Xidmət növünə görə satış</h3>
                        <div className="flex flex-col gap-3">
                            {(data?.by_service ?? []).map((s) => (
                                <div key={s.service} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-semibold truncate pr-2">{s.service}</span>
                                        <span className="text-ink2">{s.count} ədəd · <b>{fmt(s.sales)} AZN</b></span>
                                    </div>
                                    <div className="h-2 rounded-full bg-bg overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${(s.sales / maxServiceSales) * 100}%`, background: "var(--brand)" }} />
                                    </div>
                                </div>
                            ))}
                            {data && data.by_service.length === 0 && (
                                <div className="text-center text-muted text-sm py-6">Bu dövrdə məlumat yoxdur.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-[360px] flex-none">
                    <div className="card !p-2">
                        <h3 className="text-base font-semibold px-3 pt-2 pb-3">Təchizatçılar üzrə borc</h3>
                        {(data?.by_supplier ?? []).map((s) => (
                            <div key={s.name} className="tr">
                                <div className="flex-1 min-w-0 truncate font-semibold">{s.name}</div>
                                <div className={`flex-none text-right font-semibold ${s.debt > 0 ? "neg" : "pos"}`}>{fmt(s.debt)} AZN</div>
                            </div>
                        ))}
                        {data && data.by_supplier.length === 0 && (
                            <div className="text-center text-muted text-sm py-6">Təchizatçı yoxdur.</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}