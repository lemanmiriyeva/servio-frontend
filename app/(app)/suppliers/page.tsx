"use client";
import { useEffect, useState } from "react";
import { Plus, X, ChevronDown, ChevronUp, Truck, RotateCcw, Search, Wrench, User, Pencil, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Modal } from "@/components/Modal";
import { useDialog } from "@/lib/dialog-context";

type PurchasePayment = { id: number | null; amount: number; paid_at: string; method: string };
type Purchase = {
    id: number; description: string; amount: number; paid_amount: number; remaining: number;
    purchased_at: string; repair: number | null; repair_number?: string | null;
    customer_name?: string | null; payments: PurchasePayment[];
};
type PendingReturn = {
    id: number; repair_number: string; customer_name: string; reason: string;
    part_description: string | null; return_amount: number | null; created_at: string;
};
type Supplier = {
    id: number; name: string; phone: string; note: string;
    purchases: Purchase[]; total_purchased: number; total_paid: number; total_debt: number;
    pending_returns?: PendingReturn[];
};
type RepairOption = { id: number; number: string; customer_name: string };

function fmt(n: number) {
    return new Intl.NumberFormat("az-AZ").format(Math.round(n));
}
function fmtDateTime(s: string) {
    // "2026-09-25" (tarix) ya da ISO datetime ola bilər — hər ikisini oxunaqlı göstər
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return s.length <= 10
        ? d.toLocaleDateString("az-AZ")
        : d.toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SuppliersPage() {
    const { prompt } = useDialog();
    const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState<number | null>(null);
    const [showNewSupplier, setShowNewSupplier] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [search, setSearch] = useState("");

    const [purchaseForm, setPurchaseForm] = useState<number | null>(null);
    const [pDesc, setPDesc] = useState("");
    const [pAmount, setPAmount] = useState("");
    const [pRepairId, setPRepairId] = useState("");
    const [repairOptions, setRepairOptions] = useState<RepairOption[] | null>(null);

    const [payForm, setPayForm] = useState<number | null>(null);
    const [payAmount, setPayAmount] = useState("");

    // Təchizatçının özünün (ad/telefon/qeyd) redaktəsi.
    const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editNote, setEditNote] = useState("");

    // Bir alışın təsvir VƏ məbləğinin redaktəsi (artıq ödənilmiş hissədən az ola bilməz — bax backend).
    const [editPurchaseId, setEditPurchaseId] = useState<number | null>(null);
    const [editPurchaseDesc, setEditPurchaseDesc] = useState("");
    const [editPurchaseAmount, setEditPurchaseAmount] = useState("");

    const [busy, setBusy] = useState(false);

    function load(q = search) {
        const params = q.trim() ? `?search=${encodeURIComponent(q.trim())}` : "";
        api.suppliers(params).then((d) => {
            const data = d as { results?: Supplier[] } | Supplier[];
            setSuppliers(Array.isArray(data) ? data : data.results ?? []);
        }).catch(() => setError("Siyahı yüklənmədi."));
    }
    useEffect(() => {
        const t = setTimeout(() => load(search), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function toggleExpand(supplierId: number) {
        setExpanded((cur) => (cur === supplierId ? null : supplierId));
    }

    function openPurchaseForm(supplierId: number) {
        setPurchaseForm(purchaseForm === supplierId ? null : supplierId);
        if (!repairOptions) {
            api.repairs("?page_size=100&ordering=-created_at").then((d) => {
                const data = d as { results?: { id: number; number: string; customer_name: string }[] } | { id: number; number: string; customer_name: string }[];
                const list = Array.isArray(data) ? data : data.results ?? [];
                setRepairOptions(list.map((r) => ({ id: r.id, number: r.number, customer_name: r.customer_name })));
            }).catch(() => setRepairOptions([]));
        }
    }

    function closeNewSupplier() {
        setShowNewSupplier(false); setNewName(""); setNewPhone("");
    }

    async function createSupplier() {
        if (!newName.trim()) return;
        setBusy(true);
        try {
            await api.createSupplier({ name: newName, phone: newPhone });
            closeNewSupplier();
            load();
        } finally { setBusy(false); }
    }

    async function submitPurchase(supplierId: number) {
        const amt = parseFloat(pAmount);
        if (!amt || amt <= 0 || !pDesc.trim()) return;
        setBusy(true);
        try {
            await api.addSupplierPurchase(supplierId, {
                description: pDesc, amount: amt,
                ...(pRepairId ? { repair: parseInt(pRepairId, 10) } : {}),
            });
            setPurchaseForm(null); setPDesc(""); setPAmount(""); setPRepairId("");
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

    function openEditSupplier(s: Supplier) {
        setEditSupplier(s); setEditName(s.name); setEditPhone(s.phone); setEditNote(s.note ?? "");
    }

    async function saveEditSupplier() {
        if (!editSupplier || !editName.trim()) return;
        setBusy(true);
        try {
            await api.updateSupplier(editSupplier.id, { name: editName, phone: editPhone, note: editNote });
            setEditSupplier(null);
            load();
        } finally { setBusy(false); }
    }

    function openEditPurchase(p: Purchase) {
        setEditPurchaseId(p.id); setEditPurchaseDesc(p.description); setEditPurchaseAmount(String(p.amount));
    }

    async function saveEditPurchase(supplierId: number) {
        if (editPurchaseId === null || !editPurchaseDesc.trim()) return;
        const amt = parseFloat(editPurchaseAmount);
        if (!amt || amt <= 0) return;
        setBusy(true);
        try {
            await api.updateSupplierPurchase(supplierId, editPurchaseId, { description: editPurchaseDesc, amount: amt });
            setEditPurchaseId(null);
            load();
        } catch {
            setError("Alış yenilənmədi — ola bilsin məbləğ artıq ödənilmiş hissədən azdır.");
        } finally { setBusy(false); }
    }

    async function resolveReturn(returnId: number, decision: "accepted" | "rejected") {
        const note = decision === "rejected"
            ? ((await prompt("Rədd səbəbi (məs. fiziki zədə, ləkə):", { title: "Rədd səbəbi" })) ?? "")
            : "";
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
                    <p className="text-ink2 mt-1">Alışlar, hər alışın öz ödəniş tarixçəsi və qalıq borclar.</p>
                </div>
                <button className="btn pri" onClick={() => setShowNewSupplier(true)}>
                    <Plus size={18} /><span>Yeni təchizatçı</span>
                </button>
            </div>

            {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

            {editSupplier && (
                <Modal title={`${editSupplier.name} — redaktə et`} onClose={() => setEditSupplier(null)}>
                    <div className="flex gap-3 flex-wrap">
                        <div className="fld flex-1 min-w-[160px]">
                            <label>Ad</label>
                            <div className="inp"><input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
                        </div>
                        <div className="fld flex-1 min-w-[160px]">
                            <label>Telefon</label>
                            <div className="inp"><input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
                        </div>
                    </div>
                    <div className="fld">
                        <label>Qeyd (istəyə bağlı)</label>
                        <div className="inp"><input value={editNote} onChange={(e) => setEditNote(e.target.value)} /></div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                        <button className="btn" onClick={() => setEditSupplier(null)}>Ləğv et</button>
                        <button className="btn pri" disabled={busy || !editName.trim()} onClick={saveEditSupplier}>Yadda saxla</button>
                    </div>
                </Modal>
            )}

            <div className="flex items-center gap-3 flex-wrap">
                <div className="h-11 px-3.5 rounded-[10px] bg-white border border-line flex items-center gap-2.5 text-ink2 w-full max-w-md">
                    <Search size={18} className="text-muted flex-none" />
                    <input
                        className="w-full outline-none bg-transparent text-sm"
                        placeholder="Ad və ya telefon üzrə axtar…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="text-muted flex-none"><X size={16} /></button>
                    )}
                </div>
                {suppliers && (
                    <span className="text-sm text-muted">{suppliers.length} təchizatçı</span>
                )}
            </div>

            {showNewSupplier && (
                <Modal title="Yeni təchizatçı" onClose={closeNewSupplier}>
                    <div className="flex gap-3 flex-wrap">
                        <div className="fld flex-1 min-w-[160px]">
                            <label>Ad</label>
                            <div className="inp"><input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="ABC Parts" /></div>
                        </div>
                        <div className="fld flex-1 min-w-[160px]">
                            <label>Telefon</label>
                            <div className="inp"><input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+994 50 000 00 00" /></div>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                        <button className="btn" onClick={closeNewSupplier}>Ləğv et</button>
                        <button className="btn pri" disabled={busy || !newName.trim()} onClick={createSupplier}>Əlavə et</button>
                    </div>
                </Modal>
            )}

            <div className="flex flex-col gap-3">
                {(suppliers ?? []).map((s) => (
                    <div key={s.id} className="card !p-0 overflow-hidden">
                        <button
                            onClick={() => toggleExpand(s.id)}
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
                            <span
                                onClick={(e) => { e.stopPropagation(); openEditSupplier(s); }}
                                className="w-8 h-8 rounded-lg border border-line bg-white flex items-center justify-center text-ink2 flex-none"
                                title="Təchizatçını redaktə et"
                            >
                                <Pencil size={14} />
                            </span>
                            {expanded === s.id ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
                        </button>

                        {expanded === s.id && (
                            <div className="border-t border-line p-4 flex flex-col gap-3">
                                <div className="flex gap-2 flex-wrap">
                                    <button className="btn" onClick={() => openPurchaseForm(s.id)}>
                                        <Plus size={16} /><span>Alış əlavə et</span>
                                    </button>
                                    {s.total_debt > 0 && (
                                        <button className="btn pri" onClick={() => setPayForm(payForm === s.id ? null : s.id)}>
                                            <span>Borc ödə</span>
                                        </button>
                                    )}
                                </div>

                                {purchaseForm === s.id && (
                                    <Modal title={`${s.name} — yeni alış`} onClose={() => setPurchaseForm(null)}>
                                        <div className="flex flex-col gap-3">
                                            <div className="fld">
                                                <label>Təsvir</label>
                                                <div className="inp"><input autoFocus value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Ehtiyat hissələri" /></div>
                                            </div>
                                            <div className="fld">
                                                <label>Məbləğ (AZN)</label>
                                                <div className="inp"><input type="number" value={pAmount} onChange={(e) => setPAmount(e.target.value)} /></div>
                                            </div>
                                            <div className="fld">
                                                <label>Hansı təmir üçün (istəyə bağlı)</label>
                                                <select className="inp" value={pRepairId} onChange={(e) => setPRepairId(e.target.value)}>
                                                    <option value="">Seçilməyib</option>
                                                    {(repairOptions ?? []).map((r) => (
                                                        <option key={r.id} value={r.id}>{r.number} — {r.customer_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end pt-1">
                                            <button className="btn" onClick={() => setPurchaseForm(null)}>Ləğv et</button>
                                            <button className="btn pri" disabled={busy} onClick={() => submitPurchase(s.id)}>Əlavə et</button>
                                        </div>
                                    </Modal>
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
                                    <Modal title={`${s.name} — borc ödə`} onClose={() => setPayForm(null)}>
                                        <div className="fld">
                                            <label>Ödəniləcək məbləğ (AZN)</label>
                                            <div className="inp"><input autoFocus type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={String(s.total_debt)} /></div>
                                        </div>
                                        <p className="text-xs text-muted">
                                            Ödəniş avtomatik ən köhnə açıq alış(lar)a tətbiq olunur (FIFO).
                                        </p>
                                        <div className="flex gap-2 justify-end pt-1">
                                            <button className="btn" onClick={() => setPayForm(null)}>Ləğv et</button>
                                            <button className="btn pri" disabled={busy} onClick={() => submitPayment(s.id)}>Ödə</button>
                                        </div>
                                    </Modal>
                                )}

                                {/* Hər alış öz kartında: nə qədər, nə qədəri qalıb, hansı təmir/müştəri üçün
                                    (olduğu halda) və HANSI TARİXLƏRDƏ nə qədər ödənildiyi — hamısı bir yerdə. */}
                                <div className="flex flex-col gap-2">
                                    <b className="text-sm px-0.5">Alışlar</b>
                                    {s.purchases.map((p) => (
                                        <div key={p.id} className="rounded-[10px] border border-line p-3 flex flex-col gap-2">
                                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                                <div className="min-w-0 flex-1">
                                                    {editPurchaseId === p.id ? (
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <div className="inp !h-9 flex-1 min-w-[160px]">
                                                                <input autoFocus value={editPurchaseDesc} onChange={(e) => setEditPurchaseDesc(e.target.value)} placeholder="Təsvir" />
                                                            </div>
                                                            <div className="inp !h-9 w-[110px]">
                                                                <input type="number" value={editPurchaseAmount} onChange={(e) => setEditPurchaseAmount(e.target.value)} placeholder="Məbləğ" />
                                                            </div>
                                                            <button className="btn sm pri" disabled={busy || !editPurchaseDesc.trim()} onClick={() => saveEditPurchase(s.id)}><Check size={14} /></button>
                                                            <button className="btn sm" onClick={() => setEditPurchaseId(null)}><X size={14} /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold block truncate">{p.description}</span>
                                                            <button onClick={() => openEditPurchase(p)} className="text-muted flex-none" title="Təsviri redaktə et"><Pencil size={13} /></button>
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-muted">{fmtDateTime(p.purchased_at)} tarixində alınıb</span>
                                                </div>
                                                <div className="flex gap-4 text-sm flex-none">
                                                    <div className="text-right"><span className="text-xs text-muted block">Məbləğ</span><b>{fmt(p.amount)} AZN</b></div>
                                                    <div className="text-right"><span className="text-xs text-muted block">Ödənilib</span><b className="pos">{fmt(p.paid_amount)} AZN</b></div>
                                                    <div className="text-right"><span className="text-xs text-muted block">Qalıq</span><b className={p.remaining > 0 ? "neg" : ""}>{fmt(p.remaining)} AZN</b></div>
                                                </div>
                                            </div>

                                            {p.repair_number && (
                                                <div className="flex items-center gap-1.5 text-xs text-ink2">
                                                    <Wrench size={13} className="text-muted flex-none" />
                                                    <span>{p.repair_number}</span>
                                                    {p.customer_name && (
                                                        <>
                                                            <span className="text-muted">·</span>
                                                            <User size={13} className="text-muted flex-none" />
                                                            <span>{p.customer_name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {p.payments.length > 0 && (
                                                <div className="pt-2 border-t border-line flex flex-col gap-1">
                                                    <span className="text-xs text-muted">Ödəniş tarixçəsi</span>
                                                    {p.payments.map((pay, idx) => (
                                                        <div key={pay.id ?? idx} className="flex items-center justify-between text-sm">
                                                            <span className="text-ink2">{fmtDateTime(pay.paid_at)}</span>
                                                            <b className="neg">-{fmt(pay.amount)} AZN</b>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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