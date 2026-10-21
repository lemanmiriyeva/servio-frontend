"use client";
import { useEffect, useState } from "react";
import { History, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "@/lib/api";
import { Loader } from "@/components/Loader";
import { useAuth } from "@/lib/auth-context";

type Log = {
    id: number; kind: "repair" | "cash"; title: string; amount: number | null;
    details: Record<string, unknown>; deleted_by: string; deleted_at: string; shop: string;
};

const METHOD: Record<string, string> = { cash: "Nağd", card: "Kart", bank_transfer: "Bank köçürməsi" };
const money = (n: unknown) => `${Math.round(Number(n) || 0)} AZN`;
const when = (d: unknown) => (d ? new Date(String(d)).toLocaleString("az-AZ") : "—");

function Details({ log }: { log: Log }) {
    const d = log.details as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (log.kind === "cash") {
        return (
            <div className="text-sm text-ink2 grid gap-1">
                <div>Növ: <b>{d.type_label}</b> · Üsul: <b>{METHOD[d.method] ?? d.method}</b> · Məbləğ: <b>{money(d.amount)}</b></div>
                {d.description && <div>Təsvir: {d.description}</div>}
                {d.expense_category && <div>Kateqoriya: {d.expense_category}</div>}
                <div>Yaradılıb: {when(d.created_at)}</div>
            </div>
        );
    }
    return (
        <div className="text-sm text-ink2 grid gap-1">
            <div>Müştəri: <b>{d.customer}</b> · {d.phone}</div>
            <div>Cihaz: <b>{d.device}</b> · İş: {d.issue}</div>
            <div>Satış: <b>{money(d.sale_price)}</b> · Maya: <b>{money(d.cost_price)}</b> · Ödənilmiş: <b>{money(d.paid_amount)}</b></div>
            {(d.payments ?? []).length > 0 && (
                <div>Ödənişlər: {(d.payments as any[]).map((p) => `${money(p.amount)} (${METHOD[p.method] ?? p.method})`).join(", ")}</div> // eslint-disable-line @typescript-eslint/no-explicit-any
            )}
            {(d.cash_entries ?? []).length > 0 && (
                <div>Silinən kassa sətirləri: {(d.cash_entries as any[]).map((t) => `${t.type} ${money(t.amount)}`).join(", ")}</div> // eslint-disable-line @typescript-eslint/no-explicit-any
            )}
        </div>
    );
}

export default function OperationsPage() {
    const { user } = useAuth();
    const [rows, setRows] = useState<Log[] | null>(null);
    const [kind, setKind] = useState("");
    const [open, setOpen] = useState<number | null>(null);
    const [error, setError] = useState("");
    const allowed = !!(user?.is_shop_admin || user?.is_superadmin);

    useEffect(() => {
        if (!allowed) return;
        let alive = true;
        api.operationLog(kind ? `?kind=${kind}` : "")
            .then((d) => { if (alive) { setRows(d as Log[]); setError(""); } })
            .catch(() => { if (alive) setError("Jurnal yüklənmədi."); });
        return () => { alive = false; };
    }, [kind, allowed]);

    if (!allowed) return <div className="card">Bu səhifə yalnız admin üçündür.</div>;

    return (
        <>
            <div>
                <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight flex items-center gap-2"><History size={24} />Əməliyyatlar</h1>
                <p className="text-ink2 mt-1">Silinmiş təmir və kassa əməliyyatlarının jurnalı — kim, nə vaxt, nəyi sildi.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
                {[{ k: "", l: "Hamısı" }, { k: "repair", l: "Təmir / xidmət" }, { k: "cash", l: "Kassa" }].map((t) => (
                    <button key={t.k} onClick={() => { setRows(null); setKind(t.k); }}
                        className={`h-[38px] px-3.5 rounded-full border font-semibold text-sm ${kind === t.k ? "bg-side border-side text-white" : "bg-white border-line text-ink2"}`}>
                        {t.l}
                    </button>
                ))}
            </div>
            {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}
            {!rows && !error ? <Loader /> : (
                <div className="card !p-2">
                    {(rows ?? []).map((l) => (
                        <div key={l.id} className="border-b border-line last:border-0">
                            <button className="w-full flex items-center gap-3 px-3 py-3 text-left" onClick={() => setOpen(open === l.id ? null : l.id)}>
                                <span className={`badge ${l.kind === "repair" ? "b-purple" : "b-gray"} flex-none`}><i />{l.kind === "repair" ? "Təmir" : "Kassa"}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="truncate font-semibold">{l.title}</div>
                                    <div className="text-xs text-muted">{user?.is_superadmin ? `${l.shop} · ` : ""}{when(l.deleted_at)} · silən: {l.deleted_by}</div>
                                </div>
                                <b className="flex-none">{l.amount != null ? money(l.amount) : ""}</b>
                                {open === l.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {open === l.id && <div className="px-3 pb-3"><Details log={l} /></div>}
                        </div>
                    ))}
                    {rows && rows.length === 0 && <div className="text-center text-muted text-sm py-10">Silinmiş əməliyyat yoxdur.</div>}
                </div>
            )}
        </>
    );
}
