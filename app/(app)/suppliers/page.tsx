"use client";
import { useEffect, useState } from "react";
import { Plus, X, ChevronDown, ChevronUp, Truck, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";

type Purchase = { id: number; description: string; amount: number; paid_amount: number; remaining: number; purchased_at: string };
type PendingReturn = {
    id: number; repair_number: string; customer_name: string; reason: string;
    part_description: string | null; return_amount: number | null; created_at: string;
};
type Supplier = {
    id: number; name: string; phone: string; note: string;
    purchases: Purchase[]; total_purchased: number; total_paid: number; total_debt: number;
    pending_returns?: PendingReturn[];
};

function fmt(n: number) {
    return new Intl.NumberFormat("az-AZ").format(Math.round(n));
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState<number | null>(null);
    const [showNewSupplier, setShowNewSupplier] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");

    const [purchaseForm, setPurchaseForm] = useState<number | null>(null);
    const [pDesc, setPDesc] = useState("");
    const [pAmount, setPAmount] = useState("");

    const [payForm, setPayForm] = useState<number | null>(null);
    const [payAmount, setPayAmount] = useState("");

    const [busy, setBusy] = useState(false);

    function load() {
        api.suppliers().then((d) => {
            const data = d as { results?: Supplier[] } | Supplier[];
            setSuppliers(Array.isArray(data) ? data : data.results ?? []);
        }).catch(() => setError("Siyahı yüklənmədi."));
    }
    useEffect(() => { load(); }, []);

    async function createSupplier() {
        if (!newName.trim()) return;
        setBusy(true);
        try {
            await api.createSupplier({ name: newName, phone: newPhone });
            setShowNewSupplier(false); setNewName(""); setNewPhone("");
            load();
        } finally { setBusy(false); }
    }

    async function submitPurchase(supplierId: number) {
        const amt = parseFloat(pAmount);
        if (!amt || amt <= 0 || !pDesc.trim()) return;
        setBusy(true);
        try {
            await api.addSupplierPurchase(supplierId, { description: pDesc, amount: amt });
            setPurchaseForm(null); setPDesc(""); setPAmount("");
            load();
        } finally { setBusy(false); }
    }

    async function submitPayment(supplierId: number) {
        const amt = parseFloat(payAmount);
        if (!amt || amt <= 0) return;
        setBusy(true);
        try {
            await api.paySupplier(supplierId, amt);
            setPayForm(null); setPayAmount("");
            load();
        } finally { setBusy(false); }
    }

    async function resolveReturn(returnId: number, decision: "accepted" | "rejected") {
        const note = decision === "rejected" ? (window.prompt("Rədd səbəbi (məs. fiziki zədə, ləkə):") ?? "") : "";
        setBusy(true);
        try {
            await api.resolveWarrantyReturn(returnId, decision, note);
            load();
        } finally { setBusy(false); }
    }

    return (
        <>
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Təchizatçılar</h1>
                    <p className="text-ink2 mt-1">Alışlar və qalıq borclar.</p>
                </div>
                <button className="btn pri" onClick={() => setShowNewSupplier((s) => !s)}>
                    <Plus size={18} /><span>Yeni təchizatçı</span>
                </button>
            </div>

            {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

            {showNewSupplier && (
                <div className="card max-w-lg flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">Yeni təchizatçı</h3>
                        <button onClick={() => setShowNewSupplier(false)} className="text-muted"><X size={18} /></button>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <div className="fld flex-1 min-w-[160px]">
                            <label>Ad</label>
                            <div className="inp"><input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="ABC Parts" /></div>
                        </div>
                        <div className="fld flex-1 min-w-[160px]">
                            <label>Telefon</label>
                            <div className="inp"><input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+994 50 000 00 00" /></div>
                        </div>
                    </div>
                    <button className="btn pri self-start" disabled={busy} onClick={createSupplier}>Əlavə et</button>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {(suppliers ?? []).map((s) => (
                    <div key={s.id} className="card !p-0 overflow-hidden">
                        <button
                            onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                            className="w-full flex items-center gap-3 p-4 text-left"
                        >
                            <div className="t-purple w-10 h-10 rounded-[10px] flex items-center justify-center flex-none"><Truck size={18} /></div>
                            <div className="flex-1 min-w-0">
                                <b className="block truncate">{s.name}</b>
                                <span className="text-xs text-muted">{s.phone || "—"}</span>
                            </div>
                            <div className="text-right hidden sm:block">
                                <span className="text-xs text-muted block">Ümumi alış</span>
                                <b>{fmt(s.total_purchased)} AZN</b>
                            </div>
                            <div className="text-right w-28">
                                <span className="text-xs text-muted block">Qalıq borc</span>
                                <b className={s.total_debt > 0 ? "neg" : "pos"}>{fmt(s.total_debt)} AZN</b>
                            </div>
                            {expanded === s.id ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
                        </button>

                        {expanded === s.id && (
                            <div className="border-t border-line p-4 flex flex-col gap-3">
                                <div className="flex gap-2 flex-wrap">
                                    <button className="btn" onClick={() => setPurchaseForm(purchaseForm === s.id ? null : s.id)}>
                                        <Plus size={16} /><span>Alış əlavə et</span>
                                    </button>
                                    {s.total_debt > 0 && (
                                        <button className="btn pri" onClick={() => setPayForm(payForm === s.id ? null : s.id)}>
                                            <span>Borc ödə</span>
                                        </button>
                                    )}
                                </div>

                                {purchaseForm === s.id && (
                                    <div className="flex gap-3 items-end flex-wrap p-3 rounded-[10px] border border-line">
                                        <div className="fld flex-1 min-w-[160px]">
                                            <label>Təsvir</label>
                                            <div className="inp"><input value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Ehtiyat hissələri" /></div>
                                        </div>
                                        <div className="fld" style={{ maxWidth: 150 }}>
                                            <label>Məbləğ (AZN)</label>
                                            <div className="inp"><input type="number" value={pAmount} onChange={(e) => setPAmount(e.target.value)} /></div>
                                        </div>
                                        <button className="btn pri" disabled={busy} onClick={() => submitPurchase(s.id)}>Əlavə et</button>
                                    </div>
                                )}

                                {s.pending_returns && s.pending_returns.length > 0 && (
                                    <div className="flex flex-col gap-2 p-3 rounded-[10px] border border-line bg-brand-soft">
                                        <div className="flex items-center gap-2">
                                            <RotateCcw size={16} className="text-muted flex-none" />
                                            <b className="text-sm">Gözləyən zəmanət qaytarmaları</b>
                                        </div>
                                        {s.pending_returns.map((r) => (
                                            <div key={r.id} className="flex items-center justify-between gap-3 py-2 border-t border-line first:border-t-0">
                                                <div className="min-w-0">
                                                    <span className="text-sm block truncate">{r.repair_number} · {r.customer_name}</span>
                                                    <span className="text-xs text-muted block truncate">{r.part_description || r.reason}{r.return_amount !== null ? ` · ${r.return_amount} AZN` : ""}</span>
                                                </div>
                                                <div className="flex gap-2 flex-none">
                                                    <button className="btn sm pri" disabled={busy} onClick={() => resolveReturn(r.id, "accepted")}>Qəbul et</button>
                                                    <button className="btn sm" disabled={busy} onClick={() => resolveReturn(r.id, "rejected")}>Rədd et</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {payForm === s.id && (
                                    <div className="flex gap-3 items-end flex-wrap p-3 rounded-[10px] border border-line">
                                        <div className="fld" style={{ maxWidth: 160 }}>
                                            <label>Ödəniləcək məbləğ (AZN)</label>
                                            <div className="inp"><input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={String(s.total_debt)} /></div>
                                        </div>
                                        <button className="btn pri" disabled={busy} onClick={() => submitPayment(s.id)}>Ödə</button>
                                    </div>
                                )}

                                <div className="flex flex-col">
                                    <div className="tr h"><div className="flex-1">Alış</div><div className="flex-none w-24 text-right">Məbləğ</div><div className="flex-none w-24 text-right">Ödənilib</div><div className="flex-none w-24 text-right">Qalıq</div></div>
                                    {s.purchases.map((p) => (
                                        <div key={p.id} className="tr">
                                            <div className="flex-1 min-w-0">
                                                <span className="truncate block">{p.description}</span>
                                                <span className="text-xs text-muted">{p.purchased_at}</span>
                                            </div>
                                            <div className="flex-none w-24 text-right">{fmt(p.amount)}</div>
                                            <div className="flex-none w-24 text-right pos">{fmt(p.paid_amount)}</div>
                                            <div className={`flex-none w-24 text-right font-semibold ${p.remaining > 0 ? "neg" : ""}`}>{fmt(p.remaining)}</div>
                                        </div>
                                    ))}
                                    {s.purchases.length === 0 && <div className="text-center text-muted text-sm py-6">Hələ alış yoxdur.</div>}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {suppliers && suppliers.length === 0 && (
                    <div className="card text-center text-muted text-sm py-10">Hələ təchizatçı əlavə edilməyib.</div>
                )}
            </div>
        </>
    );
}