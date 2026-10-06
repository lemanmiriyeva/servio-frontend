"use client";
import { useEffect, useState } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { Modal } from "@/components/Modal";
import { Pagination, paginate } from "@/components/Pagination";

type Summary = {
    opening_balance: number; income: number; expense: number;
    supplier_payment: number; current_balance: number;
};
type Transaction = {
    id: number; type: string; amount: number; method: string;
    description: string; expense_category: string; created_at: string;
    supplier_name?: string | null; repair?: number | null; supplier?: number | null;
};

const TYPE_LABEL: Record<string, string> = { income: "Kassa", expense: "Xərc", supplier_payment: "Təchizatçı ödənişi" };
const METHOD_LABEL: Record<string, string> = { cash: "Nağd", card: "Kart", bank_transfer: "Bank köçürməsi" };

function fmt(n: number) {
    return new Intl.NumberFormat("az-AZ").format(Math.round(n));
}

export default function CashboxPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[] | null>(null);
    const [typeFilter, setTypeFilter] = useState("");
    const [page, setPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<"income" | "expense">("expense");
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("cash");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);
    const [supplierId, setSupplierId] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Mövcud əməliyyatın redaktəsi — YALNIZ təsvir/üsul/kateqoriya (məbləğ/növ dəyişmir, çünki
    // bəzi qeydlər başqa yerlərin (təmir ödənişi, təchizatçı borcu) əks nüsxəsidir).
    const [editing, setEditing] = useState<Transaction | null>(null);
    const [editDescription, setEditDescription] = useState("");
    const [editMethod, setEditMethod] = useState("cash");
    const [editCategory, setEditCategory] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);

    // Məbləğ yalnız bu əməliyyat heç bir təmirə/təchizatçıya BAĞLI DEYİLSƏ redaktə edilə bilər —
    // bağlı olanlar (məs. təmir ödənişi, təchizatçı borc ödənişi) başqa qeydin əks nüsxəsidir.
    function amountEditable(t: Transaction) {
        return !t.repair && !t.supplier && t.type !== "supplier_payment";
    }

    function openEdit(t: Transaction) {
        setEditing(t);
        setEditDescription(t.description);
        setEditMethod(t.method);
        setEditCategory(t.expense_category);
        setEditAmount(String(t.amount));
    }

    async function saveEdit() {
        if (!editing) return;
        setSavingEdit(true);
        try {
            const payload: Record<string, unknown> = {
                description: editDescription, method: editMethod, expense_category: editCategory,
            };
            if (amountEditable(editing)) {
                const amt = parseFloat(editAmount);
                if (!amt || amt <= 0) { setError("Məbləğ düzgün deyil."); setSavingEdit(false); return; }
                payload.amount = amt;
            }
            await api.updateCashTransaction(editing.id, payload);
            setEditing(null);
            load();
        } catch {
            setError("Əməliyyat yenilənmədi.");
        } finally {
            setSavingEdit(false);
        }
    }

    function load() {
        api.cashboxSummary().then((d) => setSummary(d as Summary)).catch(() => setError("Xülasə yüklənmədi."));
        api.cashTransactions(typeFilter ? `?type=${typeFilter}&ordering=-created_at&page_size=100` : "?ordering=-created_at&page_size=100")
            .then((d) => {
                const data = d as { results?: Transaction[] } | Transaction[];
                setTransactions(Array.isArray(data) ? data : data.results ?? []);
            }).catch(() => {});
    }
    useEffect(() => { load(); }, [typeFilter]);
    // Növ filtri dəyişəndə səhifə 1-ə qayıtsın — effekt əvəzinə render zamanı uyğunlaşdırılır.
    const [prevTypeFilter, setPrevTypeFilter] = useState(typeFilter);
    if (typeFilter !== prevTypeFilter) { setPrevTypeFilter(typeFilter); if (page !== 1) setPage(1); }
    const pageItems = transactions ? paginate(transactions, page) : [];
    // "Xərc" seçilməyəndə təchizatçı seçimini sıfırlayır — render zamanı uyğunlaşdırılır
    // ki, effekt daxilində birbaşa setState çağırışı olmasın.
    const [prevFormType, setPrevFormType] = useState(formType);
    if (formType !== prevFormType) {
        setPrevFormType(formType);
        if (formType !== "expense") setSupplierId("");
    }
    useEffect(() => {
        if (formType !== "expense") return;
        api.suppliers().then((d) => {
            const data = d as { results?: { id: number; name: string }[] } | { id: number; name: string }[];
            setSuppliers(Array.isArray(data) ? data : data.results ?? []);
        }).catch(() => {});
    }, [formType]);

    async function handleSubmit() {
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return;
        setSaving(true);
        try {
            if (formType === "expense" && supplierId) {
                // Təchizatçıya bağlanmış xərc — mövcud "borc ödə" məntiqinə (FIFO +
                // Kassa/Təchizatçı tarixçəsi) yönləndirilir ki, iki fərqli yol
                // bir-birindən ayrı düşməsin (əks halda bu əməliyyat kassada görünər,
                // amma təchizatçının borcuna təsir etməzdi).
                await api.paySupplier(parseInt(supplierId, 10), amt, method);
            } else {
                if (!description.trim()) return;
                await api.createCashTransaction({
                    type: formType, amount: amt, method, description,
                    expense_category: formType === "expense" ? category : "",
                });
            }
            setShowForm(false); setAmount(""); setDescription(""); setCategory(""); setSupplierId("");
            load();
        } catch {
            setError("Əməliyyat yadda saxlanılmadı.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Kassa</h1>
                    <p className="text-ink2 mt-1">Bütün nağd və köçürmə əməliyyatları.</p>
                </div>
                <button className="btn pri" onClick={() => setShowForm((s) => !s)}>
                    <Plus size={18} /><span>Əməliyyat əlavə et</span>
                </button>
            </div>

            {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="card">
                    <span className="text-ink2 text-[13px] font-medium">Başlanğıc balans</span>
                    <div className="text-2xl font-semibold tracking-tight mt-1.5">{summary ? fmt(summary.opening_balance) : "—"}</div>
                </div>
                <div className="card">
                    <span className="text-ink2 text-[13px] font-medium">Mədaxil</span>
                    <div className="text-2xl font-semibold tracking-tight mt-1.5 pos">{summary ? `+${fmt(summary.income)}` : "—"}</div>
                </div>
                <div className="card">
                    <span className="text-ink2 text-[13px] font-medium">Xərc</span>
                    <div className="text-2xl font-semibold tracking-tight mt-1.5 neg">{summary ? `-${fmt(summary.expense)}` : "—"}</div>
                </div>
                <div className="card">
                    <span className="text-ink2 text-[13px] font-medium">Təchizatçı ödənişi</span>
                    <div className="text-2xl font-semibold tracking-tight mt-1.5" style={{ color: "var(--purple)" }}>
                        {summary ? `-${fmt(summary.supplier_payment)}` : "—"}
                    </div>
                </div>
                <div className="card" style={{ background: "var(--side)" }}>
                    <span className="text-[13px] font-medium text-[#8FA9B2]">Kassa balansı</span>
                    <div className="text-2xl font-semibold tracking-tight mt-1.5 text-white">{summary ? fmt(summary.current_balance) : "—"}</div>
                </div>
            </div>

            {showForm && (
                <Modal title="Yeni əməliyyat" onClose={() => setShowForm(false)} maxWidth="max-w-xl">
                    <div className="flex gap-2">
                        <button onClick={() => setFormType("income")} className={`chip ${formType === "income" ? "on" : ""}`}>
                            <ArrowUpCircle size={16} />Kassa
                        </button>
                        <button onClick={() => setFormType("expense")} className={`chip ${formType === "expense" ? "on" : ""}`}>
                            <ArrowDownCircle size={16} />Xərc
                        </button>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <div className="fld flex-1 min-w-[140px]">
                            <label>Məbləğ (AZN)</label>
                            <div className="inp"><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                        </div>
                        <div className="fld flex-1 min-w-[140px]">
                            <label>Üsul</label>
                            <select className="inp" value={method} onChange={(e) => setMethod(e.target.value)}>
                                <option value="cash">Nağd</option>
                                <option value="card">Kart</option>
                                <option value="bank_transfer">Bank köçürməsi</option>
                            </select>
                        </div>
                    </div>
                    {formType === "expense" && (
                        <div className="fld">
                            <label>Təchizatçıya borc ödənişidir? (istəyə bağlı)</label>
                            <select className="inp" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                                <option value="">Xeyr — adi xərc</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {formType === "expense" && !supplierId && (
                        <div className="fld">
                            <label>Kateqoriya</label>
                            <div className="inp"><input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="İcarə, Elektrik, Maaş və s." /></div>
                        </div>
                    )}
                    {!supplierId && (
                        <div className="fld">
                            <label>Təsvir</label>
                            <div className="inp"><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Qısa izah" /></div>
                        </div>
                    )}
                    {supplierId && (
                        <p className="text-xs text-muted">
                            Bu əməliyyat seçilmiş təchizatçının borcundan (ən köhnə alışdan başlayaraq) avtomatik çıxılacaq
                            və onun &quot;Ödəniş tarixçəsi&quot;ndə görünəcək.
                        </p>
                    )}
                    <button className="btn pri self-start" disabled={saving} onClick={handleSubmit}>
                        {saving ? "Yadda saxlanılır…" : "Yadda saxla"}
                    </button>
                </Modal>
            )}

            {editing && (
                <Modal title="Əməliyyatı redaktə et" onClose={() => setEditing(null)} maxWidth="max-w-lg">
                    <div className="flex flex-col gap-3">
                        {amountEditable(editing) && (
                            <div className="fld">
                                <label>Məbləğ (AZN)</label>
                                <div className="inp"><input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} /></div>
                            </div>
                        )}
                        <div className="fld">
                            <label>Təsvir</label>
                            <div className="inp"><input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Qısa izah" /></div>
                        </div>
                        <div className="fld">
                            <label>Üsul</label>
                            <select className="inp" value={editMethod} onChange={(e) => setEditMethod(e.target.value)}>
                                <option value="cash">Nağd</option>
                                <option value="card">Kart</option>
                                <option value="bank_transfer">Bank köçürməsi</option>
                            </select>
                        </div>
                        {editing.type === "expense" && (
                            <div className="fld">
                                <label>Kateqoriya</label>
                                <div className="inp"><input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="İcarə, Elektrik, Maaş və s." /></div>
                            </div>
                        )}
                        {!amountEditable(editing) && (
                            <p className="text-xs text-muted">Bu əməliyyatın məbləği redaktə edilmir — başqa bir qeydlə (təmir ödənişi, təchizatçı borcu) bağlıdır. Səhv məbləğ üçün yeni düzəliş əməliyyatı əlavə edin.</p>
                        )}
                        <button className="btn pri self-start" disabled={savingEdit} onClick={saveEdit}>
                            {savingEdit ? "Saxlanılır…" : "Yadda saxla"}
                        </button>
                    </div>
                </Modal>
            )}

            <div className="flex gap-2 flex-wrap">
                {[{ k: "", l: "Hamısı" }, { k: "income", l: "Kassa" }, { k: "expense", l: "Xərc" }, { k: "supplier_payment", l: "Təchizatçı" }].map((t) => (
                    <button
                        key={t.k}
                        onClick={() => setTypeFilter(t.k)}
                        className={`h-[38px] px-3.5 rounded-full border font-semibold text-sm ${typeFilter === t.k ? "bg-side border-side text-white" : "bg-white border-line text-ink2"}`}
                    >
                        {t.l}
                    </button>
                ))}
            </div>

            <div className="card !p-2">
                <div className="overflow-x-auto">
                    <div className="min-w-[720px]">
                        <div className="tr h">
                            <div className="flex-none w-[150px]">Tarix</div>
                            <div className="flex-1">Təsvir</div>
                            <div className="flex-none w-[150px]">Növ</div>
                            <div className="flex-none w-[120px]">Üsul</div>
                            <div className="flex-none w-[90px] text-right">Məbləğ</div>
                            <div className="flex-none w-[44px]" />
                        </div>
                        {pageItems.map((t) => (
                            <div key={t.id} className="tr">
                                <div className="flex-none w-[150px] text-ink2 text-sm">{new Date(t.created_at).toLocaleString("az-AZ")}</div>
                                <div className="flex-1 min-w-0 truncate">
                                    {t.description || (t.supplier_name ? `${t.supplier_name} — borc ödənişi` : "")}
                                    {t.expense_category && <span className="text-muted text-xs ml-2">· {t.expense_category}</span>}
                                </div>
                                <div className="flex-none w-[150px]">
                                    <span className={`badge ${t.type === "income" ? "b-green" : t.type === "expense" ? "b-red" : "b-purple"} !whitespace-normal`}><i />{TYPE_LABEL[t.type]}</span>
                                </div>
                                <div className="flex-none w-[120px] text-ink2 text-sm truncate">{METHOD_LABEL[t.method]}</div>
                                <div className={`flex-none w-[90px] text-right font-semibold ${t.type === "income" ? "pos" : "neg"}`}>
                                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                                </div>
                                <div className="flex-none w-[44px] flex justify-end">
                                    <button onClick={() => openEdit(t)} className="w-8 h-8 rounded-lg border border-line bg-white flex items-center justify-center text-ink2" title="Redaktə et">
                                        <Pencil size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {transactions && transactions.length === 0 && (
                            <div className="text-center text-muted text-sm py-10">Əməliyyat tapılmadı.</div>
                        )}
                    </div>
                </div>
                <Pagination page={page} totalItems={transactions?.length ?? 0} onChange={setPage} />
            </div>
        </>
    );
}