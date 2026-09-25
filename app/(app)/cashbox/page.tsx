"use client";
import { useEffect, useState } from "react";
import { Plus, X, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { api } from "@/lib/api";

type Summary = {
    opening_balance: number; income: number; expense: number;
    supplier_payment: number; current_balance: number;
};
type Transaction = {
    id: number; type: string; amount: number; method: string;
    description: string; expense_category: string; created_at: string;
};

const TYPE_LABEL: Record<string, string> = { income: "Gəlir", expense: "Xərc", supplier_payment: "Təchizatçı ödənişi" };
const METHOD_LABEL: Record<string, string> = { cash: "Nağd", card: "Kart", bank_transfer: "Bank köçürməsi" };

function fmt(n: number) {
    return new Intl.NumberFormat("az-AZ").format(Math.round(n));
}

export default function CashboxPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[] | null>(null);
    const [typeFilter, setTypeFilter] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<"income" | "expense">("expense");
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("cash");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    function load() {
        api.cashboxSummary().then((d) => setSummary(d as Summary)).catch(() => setError("Xülasə yüklənmədi."));
        api.cashTransactions(typeFilter ? `?type=${typeFilter}&ordering=-created_at&page_size=100` : "?ordering=-created_at&page_size=100")
            .then((d) => {
                const data = d as { results?: Transaction[] } | Transaction[];
                setTransactions(Array.isArray(data) ? data : data.results ?? []);
            }).catch(() => {});
    }
    useEffect(() => { load(); }, [typeFilter]);

    async function handleSubmit() {
        const amt = parseFloat(amount);
        if (!amt || amt <= 0 || !description.trim()) return;
        setSaving(true);
        try {
            await api.createCashTransaction({
                type: formType, amount: amt, method, description,
                expense_category: formType === "expense" ? category : "",
            });
            setShowForm(false); setAmount(""); setDescription(""); setCategory("");
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
                    <span className="text-ink2 text-[13px] font-medium">Gəlir</span>
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
                    <span className="text-[13px] font-medium text-[#8FA9B2]">Cari balans</span>
                    <div className="text-2xl font-semibold tracking-tight mt-1.5 text-white">{summary ? fmt(summary.current_balance) : "—"}</div>
                </div>
            </div>

            {showForm && (
                <div className="card max-w-xl flex flex-col gap-3.5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">Yeni əməliyyat</h3>
                        <button onClick={() => setShowForm(false)} className="text-muted"><X size={18} /></button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setFormType("income")} className={`chip ${formType === "income" ? "on" : ""}`}>
                            <ArrowUpCircle size={16} />Gəlir
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
                            <label>Kateqoriya</label>
                            <div className="inp"><input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="İcarə, Elektrik, Maaş və s." /></div>
                        </div>
                    )}
                    <div className="fld">
                        <label>Təsvir</label>
                        <div className="inp"><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Qısa izah" /></div>
                    </div>
                    <button className="btn pri self-start" disabled={saving} onClick={handleSubmit}>
                        {saving ? "Yadda saxlanılır…" : "Yadda saxla"}
                    </button>
                </div>
            )}

            <div className="flex gap-2 flex-wrap">
                {[{ k: "", l: "Hamısı" }, { k: "income", l: "Gəlir" }, { k: "expense", l: "Xərc" }, { k: "supplier_payment", l: "Təchizatçı" }].map((t) => (
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
                    <div className="min-w-[600px]">
                        <div className="tr h">
                            <div className="flex-none w-[150px]">Tarix</div>
                            <div className="flex-1">Təsvir</div>
                            <div className="flex-none w-[110px]">Növ</div>
                            <div className="flex-none w-[100px]">Üsul</div>
                            <div className="flex-none w-[90px] text-right">Məbləğ</div>
                        </div>
                        {(transactions ?? []).map((t) => (
                            <div key={t.id} className="tr">
                                <div className="flex-none w-[150px] text-ink2 text-sm">{new Date(t.created_at).toLocaleString("az-AZ")}</div>
                                <div className="flex-1 min-w-0 truncate">{t.description}{t.expense_category && <span className="text-muted text-xs ml-2">· {t.expense_category}</span>}</div>
                                <div className="flex-none w-[110px]">
                                    <span className={`badge ${t.type === "income" ? "b-green" : t.type === "expense" ? "b-red" : "b-purple"}`}><i />{TYPE_LABEL[t.type]}</span>
                                </div>
                                <div className="flex-none w-[100px] text-ink2 text-sm">{METHOD_LABEL[t.method]}</div>
                                <div className={`flex-none w-[90px] text-right font-semibold ${t.type === "income" ? "pos" : "neg"}`}>
                                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                                </div>
                            </div>
                        ))}
                        {transactions && transactions.length === 0 && (
                            <div className="text-center text-muted text-sm py-10">Əməliyyat tapılmadı.</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}