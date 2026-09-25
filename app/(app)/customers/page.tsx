"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, X } from "lucide-react";
import { api } from "@/lib/api";

type Customer = {
    id: number; full_name: string; phone: string; email: string; note: string;
    initials: string; repair_count: number; total_spent: number; total_debt: number;
};

const AVATAR_COLORS = ["a1", "a2", "a3", "a4", "a5"];

export default function CustomersPage() {
    const [all, setAll] = useState<Customer[] | null>(null);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [saving, setSaving] = useState(false);

    function load() {
        api.customers("?page_size=200").then((d) => {
            const data = d as { results?: Customer[] } | Customer[];
            setAll(Array.isArray(data) ? data : data.results ?? []);
        }).catch(() => setError("Siyahı yüklənmədi."));
    }
    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        if (!all) return [];
        if (!search.trim()) return all;
        const q = search.toLowerCase();
        return all.filter((c) => c.full_name.toLowerCase().includes(q) || c.phone.includes(q));
    }, [all, search]);

    async function handleCreate() {
        if (!newName.trim() || !newPhone.trim()) return;
        setSaving(true);
        try {
            await api.createCustomer({ full_name: newName, phone: newPhone });
            setShowNew(false); setNewName(""); setNewPhone("");
            load();
        } catch {
            setError("Müştəri yaradıla bilmədi.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Müştərilər</h1>
                    <p className="text-ink2 mt-1">{all ? `${all.length} müştəri qeydə alınıb.` : "Yüklənir…"}</p>
                </div>
                <button className="btn pri" onClick={() => setShowNew((s) => !s)}>
                    <Plus size={18} /><span>Yeni müştəri</span>
                </button>
            </div>

            {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

            {showNew && (
                <div className="card max-w-lg flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">Yeni müştəri</h3>
                        <button onClick={() => setShowNew(false)} className="text-muted"><X size={18} /></button>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <div className="fld flex-1 min-w-[180px]">
                            <label>Ad Soyad</label>
                            <div className="inp"><input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Rəşad Məmmədov" /></div>
                        </div>
                        <div className="fld flex-1 min-w-[180px]">
                            <label>Telefon</label>
                            <div className="inp"><input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+994 50 123 45 67" /></div>
                        </div>
                    </div>
                    <button className="btn pri self-start" disabled={saving} onClick={handleCreate}>
                        {saving ? "Yadda saxlanılır…" : "Əlavə et"}
                    </button>
                </div>
            )}

            <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[240px] h-11 px-3.5 rounded-[10px] bg-white border border-line flex items-center gap-2.5 text-ink2 max-w-md">
                    <Search size={18} className="text-muted flex-none" />
                    <input
                        className="w-full outline-none bg-transparent text-sm"
                        placeholder="Ad və ya telefon üzrə axtar"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="card !p-2">
                <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                        <div className="tr h">
                            <div className="flex-1">Müştəri</div>
                            <div className="flex-none w-[140px]">Telefon</div>
                            <div className="flex-none w-[100px] text-right">Təmir sayı</div>
                            <div className="flex-none w-[110px] text-right">Ümumi xərc</div>
                            <div className="flex-none w-[100px] text-right">Borc</div>
                        </div>

                        {filtered.map((c, i) => (
                            <Link key={c.id} href={`/customers/${c.id}`} className="tr hover:bg-gray-50/60 cursor-pointer">
                                <div className="flex-1 flex items-center gap-2.5 font-semibold min-w-0">
                                    <div className={`av ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>{c.initials}</div>
                                    <span className="truncate">{c.full_name}</span>
                                </div>
                                <div className="flex-none w-[140px] text-ink2">{c.phone}</div>
                                <div className="flex-none w-[100px] text-right font-semibold">{c.repair_count}</div>
                                <div className="flex-none w-[110px] text-right font-semibold">{Math.round(c.total_spent)} AZN</div>
                                <div className="flex-none w-[100px] text-right font-semibold">
                                    {c.total_debt > 0 ? <span className="neg">{Math.round(c.total_debt)} AZN</span> : <span className="mut">—</span>}
                                </div>
                            </Link>
                        ))}

                        {all && filtered.length === 0 && (
                            <div className="text-center text-muted text-sm py-10">Uyğun nəticə tapılmadı.</div>
                        )}
                        {!all && !error && (
                            <div className="text-center text-muted text-sm py-10">Yüklənir…</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}