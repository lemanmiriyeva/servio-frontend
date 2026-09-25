"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, X, Receipt } from "lucide-react";
import { api } from "@/lib/api";

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

    function load() {
        api.cashTransactions("?type=expense&ordering=-created_at&page_size=200").then((d) => {
            const data = d as { results?: Transaction[] } | Transaction[];
            setExpenses(Array.isArray(data) ? data : data.results ?? []);
        }).catch(() => setError("Xərclər yüklənmədi."));
    }
    useEffect(() => { load(); }, []);

    const total = useMemo(() => (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0), [expenses]);

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
                <div className="card max-w-xl flex flex-col gap-3.5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">Yeni xərc</h3>
                        <button onClick={() => setShowForm(false)} className="text-muted"><X size={18} /></button>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <div className="fld flex-1 min-w-[140px]">
                            <label>Məbləğ (AZN)</label>
                            <div className="inp"><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                        </div>
                        <div className="fld flex-1 min-w-[140px]">
                            <label>Kateqoriya</label>
                            <div className="inp"><input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="İcarə, Elektrik, Maaş" /></div>
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
                </div>
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
                    <div className="min-w-[560px]">
                        <div className="tr h">
                            <div className="flex-none w-[150px]">Tarix</div>
                            <div className="flex-1">Təsvir</div>
                            <div className="flex-none w-[130px]">Kateqoriya</div>
                            <div className="flex-none w-[100px]">Üsul</div>
                            <div className="flex-none w-[90px] text-right">Məbləğ</div>
                        </div>
                        {(expenses ?? []).map((e) => (
                            <div key={e.id} className="tr">
                                <div className="flex-none w-[150px] text-ink2 text-sm">{new Date(e.created_at).toLocaleString("az-AZ")}</div>
                                <div className="flex-1 min-w-0 truncate">{e.description}</div>
                                <div className="flex-none w-[130px] text-sm text-ink2">{e.expense_category || "—"}</div>
                                <div className="flex-none w-[100px] text-sm text-ink2">{METHOD_LABEL[e.method]}</div>
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
            </div>
        </>
    );
}