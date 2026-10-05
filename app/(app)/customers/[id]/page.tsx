"use client";
import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, Pencil, Check, X, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Loader } from "@/components/Loader";
import { Modal } from "@/components/Modal";

type Customer = {
    id: number; full_name: string; phone: string; email: string; note: string;
    initials: string; repair_count: number; total_spent: number; total_debt: number;
    total_profit: number | null;
};
type RepairRow = {
    id: number; number: string; device_brand: string; device_model: string;
    issue_description: string; status: string; payment_status: string;
    sale_price: number; remaining_debt: number; warranty_days_left: number | null;
    received_at: string;
};

const STATUS_LABEL: Record<string, string> = {
    received: "Qəbul edildi", diagnosing: "Diaqnostikada", waiting_repair: "Təmir gözləyir",
    in_progress: "Təmir prosesində", ready: "Hazırdır", delivered: "Təhvil verildi", cancelled: "Ləğv edildi",
};
const STATUS_BADGE: Record<string, string> = {
    received: "b-blue", diagnosing: "b-purple", waiting_repair: "b-amber",
    in_progress: "b-cyan", ready: "b-green", delivered: "b-gray", cancelled: "b-red",
};

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = usePromise(params);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [repairs, setRepairs] = useState<RepairRow[] | null>(null);
    const [error, setError] = useState("");
    const [editingNote, setEditingNote] = useState(false);
    const [noteDraft, setNoteDraft] = useState("");
    const [saving, setSaving] = useState(false);

    // Müştərinin özünün (ad, telefon, e-poçt) redaktəsi üçün.
    const [editingInfo, setEditingInfo] = useState(false);
    const [nameDraft, setNameDraft] = useState("");
    const [phoneDraft, setPhoneDraft] = useState("");
    const [emailDraft, setEmailDraft] = useState("");
    const [savingInfo, setSavingInfo] = useState(false);

    function load() {
        api.customer(id).then((d) => { setCustomer(d as Customer); setNoteDraft((d as Customer).note); })
            .catch(() => setError("Müştəri tapılmadı."));
        api.repairs(`?customer=${id}&page_size=100`).then((d) => {
            const data = d as { results?: RepairRow[] } | RepairRow[];
            setRepairs(Array.isArray(data) ? data : data.results ?? []);
        }).catch(() => {});
    }
    useEffect(() => { load(); }, [id]);

    function openEditInfo() {
        if (!customer) return;
        setNameDraft(customer.full_name); setPhoneDraft(customer.phone); setEmailDraft(customer.email ?? "");
        setEditingInfo(true);
    }

    async function saveInfo() {
        if (!nameDraft.trim() || !phoneDraft.trim()) return;
        setSavingInfo(true);
        try {
            await api.updateCustomer(id, { full_name: nameDraft, phone: phoneDraft, email: emailDraft });
            setEditingInfo(false);
            load();
        } finally {
            setSavingInfo(false);
        }
    }

    async function saveNote() {
        setSaving(true);
        try {
            await api.updateCustomer(id, { note: noteDraft });
            setEditingNote(false);
            load();
        } finally {
            setSaving(false);
        }
    }

    const activeWarranties = (repairs ?? []).filter((r) => r.warranty_days_left !== null && r.warranty_days_left >= 0).length;

    if (error) return <div className="card" style={{ color: "var(--red)" }}>{error}</div>;
    if (!customer) return <Loader />;

    return (
        <>
            <div className="flex items-center gap-3">
                <Link href="/customers" className="w-10 h-10 rounded-[10px] bg-white border border-line flex items-center justify-center text-ink2 flex-none">
                    <ArrowLeft size={18} />
                </Link>
                <div className="av lg a1">{customer.initials}</div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold">{customer.full_name}</h1>
                        <button onClick={openEditInfo} className="text-muted" title="Müştərini redaktə et"><Pencil size={15} /></button>
                    </div>
                    <div className="flex items-center gap-4 text-ink2 text-sm mt-1">
                        <span className="flex items-center gap-1.5"><Phone size={14} />{customer.phone}</span>
                        {customer.email && <span className="flex items-center gap-1.5"><Mail size={14} />{customer.email}</span>}
                    </div>
                </div>
                <Link href={`/repairs/new?customer=${customer.id}`} className="btn pri">
                    <Plus size={18} /><span>Yeni xidmət</span>
                </Link>
            </div>

            {editingInfo && (
                <Modal title="Müştərini redaktə et" onClose={() => setEditingInfo(false)} maxWidth="max-w-lg">
                    <div className="flex flex-col gap-3">
                        <div className="fld">
                            <label>Ad Soyad</label>
                            <div className="inp"><input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} /></div>
                        </div>
                        <div className="fld">
                            <label>Telefon</label>
                            <div className="inp"><input value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value)} /></div>
                        </div>
                        <div className="fld">
                            <label>E-poçt (istəyə bağlı)</label>
                            <div className="inp"><input type="email" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} /></div>
                        </div>
                        <button className="btn pri self-start" disabled={savingInfo || !nameDraft.trim() || !phoneDraft.trim()} onClick={saveInfo}>
                            {savingInfo ? "Saxlanılır…" : "Yadda saxla"}
                        </button>
                    </div>
                </Modal>
            )}

            <div className={`grid grid-cols-2 gap-4 ${customer.total_profit !== null ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
                <div className="card">
                    <span className="text-ink2 text-[13px] font-medium">Ümumi təmir</span>
                    <div className="text-[28px] font-semibold tracking-tight mt-1.5">{customer.repair_count}</div>
                </div>
                <div className="card">
                    <span className="text-ink2 text-[13px] font-medium">Ümumi xərc</span>
                    <div className="text-[28px] font-semibold tracking-tight mt-1.5">{Math.round(customer.total_spent)} <small className="text-sm text-muted">AZN</small></div>
                </div>
                <div className="card">
                    <span className="text-ink2 text-[13px] font-medium">Açıq borc</span>
                    <div className={`text-[28px] font-semibold tracking-tight mt-1.5 ${customer.total_debt > 0 ? "neg" : ""}`}>
                        {Math.round(customer.total_debt)} <small className="text-sm text-muted">AZN</small>
                    </div>
                </div>
                <div className="card">
                    <span className="text-ink2 text-[13px] font-medium">Aktiv zəmanət</span>
                    <div className="text-[28px] font-semibold tracking-tight mt-1.5">{activeWarranties}</div>
                </div>
                {customer.total_profit !== null && (
                    <div className="card">
                        <span className="text-ink2 text-[13px] font-medium">Mənfəət</span>
                        <div className="text-[28px] font-semibold tracking-tight mt-1.5 pos">
                            {Math.round(customer.total_profit)} <small className="text-sm text-muted">AZN</small>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-5 items-start">
                <div className="flex-1 min-w-0 w-full">
                    <div className="card !p-2">
                        <h3 className="text-base font-semibold px-3 pt-2 pb-3.5">Təmir tarixçəsi</h3>
                        <div className="overflow-x-auto">
                            <div className="min-w-[700px]">
                                <div className="tr h">
                                    <div className="flex-none w-[120px]">Təmir №</div>
                                    <div className="flex-1">Cihaz / iş</div>
                                    <div className="flex-none w-[150px]">Vəziyyət</div>
                                    <div className="flex-none w-[80px] text-right">Məbləğ</div>
                                    <div className="flex-none w-[100px] text-right">Qalıq borc</div>
                                </div>
                                {(repairs ?? []).map((r) => (
                                    <Link key={r.id} href={`/repairs/${r.id}`} className="tr hover:bg-gray-50/60 cursor-pointer">
                                        <div className="flex-none w-[120px]"><span className="mono text-[13px]">{r.number}</span></div>
                                        <div className="flex-1 leading-tight min-w-0">
                                            <b className="block font-semibold truncate">{`${r.device_brand} ${r.device_model}`.trim()}</b>
                                            <span className="text-xs text-muted truncate block">{r.issue_description}</span>
                                        </div>
                                        <div className="flex-none w-[150px]">
                                            <span className={`badge ${STATUS_BADGE[r.status] || "b-gray"}`}><i />{STATUS_LABEL[r.status] || r.status}</span>
                                        </div>
                                        <div className="flex-none w-[80px] text-right font-semibold">{Math.round(r.sale_price)}</div>
                                        <div className="flex-none w-[100px] text-right font-semibold">
                                            {r.remaining_debt > 0 ? <span className="neg">{Math.round(r.remaining_debt)} AZN</span> : <span className="mut">—</span>}
                                        </div>
                                    </Link>
                                ))}
                                {repairs && repairs.length === 0 && (
                                    <div className="text-center text-muted text-sm py-8">Hələ heç bir təmir yoxdur.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-[320px] flex-none">
                    <div className="card">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold">Qeyd</h3>
                            {!editingNote && (
                                <button onClick={() => setEditingNote(true)} className="text-muted"><Pencil size={16} /></button>
                            )}
                        </div>
                        {editingNote ? (
                            <div className="flex flex-col gap-2.5">
                <textarea
                    className="w-full min-h-[90px] border border-line rounded-[10px] p-3 text-sm outline-none"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Müştəri haqqında qeyd…"
                />
                                <div className="flex gap-2">
                                    <button className="btn pri" disabled={saving} onClick={saveNote}><Check size={16} /><span>Saxla</span></button>
                                    <button className="btn ghost" onClick={() => { setEditingNote(false); setNoteDraft(customer.note); }}><X size={16} /><span>Ləğv et</span></button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-ink2">{customer.note || "Qeyd yoxdur."}</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}