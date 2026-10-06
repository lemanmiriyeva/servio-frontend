"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { api } from "@/lib/api";
import { Modal } from "@/components/Modal";
import { Pagination, paginate } from "@/components/Pagination";

type Transaction = {
    id: number; amount: number; method: string; description: string;
    expense_category: string; created_at: string;
};

const METHOD_LABEL: Record<string, string> = { cash: "Nağd", card: "Kart", bank_transfer: "Bank köçürməsi" };
const CATEGORY_TONES = ["t-blue", "t-amber", "t-purple", "t-cyan", "t-green", "t-red"];

function fmt(n: number) {
    return new Intl.NumberFormat("az-AZ").format(Math.round(n));
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Transaction[] | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [method, setMethod] = useState("cash");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);

    function load() {
        api.cashTransactions("?type=expense&ordering=-created_at&page_size=200").then((d) => {
            const data = d as { results?: Transaction[] } | Transaction[];
            setExpenses(Array.isArray(data) ? data : data.results ?? []);
        }).catch(() => setError("Xərclər yüklənmədi."));
    }
    useEffect(() => { load(); }, []);

    const total = useMemo(() => (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0), [expenses]);
    const pageItems = useMemo(() => paginate(expenses ?? [], page), [expenses, page]);

    const byCategory = useMemo(() => {
        const map: Record<string, number> = {};
        (expenses ?? []).forEach((e) => {
            const cat = e.expense_category || "Digər";
            map[cat] = (map[cat] || 0) + Number(e.amount);
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [expenses]);

    async function handleSubmit() {
        const amt = parseFloat(amount);
        if (!amt || amt <= 0 || !description.trim()) return;
        setSaving(true);
        try {
            await api.createCashTransaction({ type: "expense", amount: amt, method, description, expense_category: category });
            setShowForm(false); setAmount(""); setDescription(""); setCategory("");
            load();
        } catch {
            setError("Xərc yadda saxlanılmadı.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Xərclər</h1>
                    <p className="text-ink2 mt-1">Cəmi: <b>{fmt(total)} AZN</b></p>
                </div>
                <button className="btn pri" onClick={() => setShowForm((s) => !s)}>
                    <Plus size={18} /><span>Xərc əlavə et</span>
                </button>
            </div>

            {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

            {showForm && (
                <Modal title="Yeni xərc" onClose={() => setShowForm(false)} maxWidth="max-w-xl">
                    <div className="flex gap-3 flex-wrap">
                        <div className="fld flex-1 min-w-[140px]">
                            <label>Məbləğ (AZN)</label>
                            <div className="inp"><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                        </div>
                        <div className="fld flex-1 min-w-[140px]">
                            <label>Kateqoriya</label>
                            <div className="inp">
                                <input
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="İcarə, Elektrik, Maaş"
                                    list="expense-category-list"
                                    autoComplete="off"
                                />
                            </div>
                            <datalist id="expense-category-list">
                                {byCategory.map(([cat]) => <option key={cat} value={cat} />)}
                            </datalist>
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
                    <div className="fld">
                        <label>Təsvir</label>
                        <div className="inp"><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Qısa izah" /></div>
                    </div>
                    <button className="btn pri self-start" disabled={saving} onClick={handleSubmit}>
                        {saving ? "Yadda saxlanılır…" : "Yadda saxla"}
                    </button>
                </Modal>
            )}

            {byCategory.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                    {byCategory.map(([cat, amt], i) => (
                        <div key={cat} className={`badge ${CATEGORY_TONES[i % CATEGORY_TONES.length]} !h-9 !px-3`}>
                            <i />{cat}: <b>{fmt(amt)} AZN</b>
                        </div>
                    ))}
                </div>
            )}

            <div className="card !p-2">
                <div className="overflow-x-auto">
                    <div className="min-w-[620px]">
                        <div className="tr h">
                            <div className="flex-none w-[150px]">Tarix</div>
                            <div className="flex-1">Təsvir</div>
                            <div className="flex-none w-[150px]">Kateqoriya</div>
                            <div className="flex-none w-[120px]">Üsul</div>
                            <div className="flex-none w-[90px] text-right">Məbləğ</div>
                        </div>
                        {pageItems.map((e) => (
                            <div key={e.id} className="tr">
                                <div className="flex-none w-[150px] text-ink2 text-sm">{new Date(e.created_at).toLocaleString("az-AZ")}</div>
                                <div className="flex-1 min-w-0 truncate">{e.description}</div>
                                <div className="flex-none w-[150px] text-sm text-ink2 truncate" title={e.expense_category || ""}>{e.expense_category || "—"}</div>
                                <div className="flex-none w-[120px] text-sm text-ink2 truncate">{METHOD_LABEL[e.method]}</div>
                                <div className="flex-none w-[90px] text-right font-semibold neg">-{fmt(e.amount)}</div>
                            </div>
                        ))}
                        {expenses && expenses.length === 0 && (
                            <div className="text-center text-muted text-sm py-10 flex flex-col items-center gap-2">
                                <Receipt size={28} className="text-muted" />
                                Hələ xərc qeydə alınmayıb.
                            </div>
                        )}
                    </div>
                </div>
                <Pagination page={page} totalItems={expenses?.length ?? 0} onChange={setPage} />
            </div>
        </>
    );
}