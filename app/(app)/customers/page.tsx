"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, Pencil, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Modal } from "@/components/Modal";
import { Loader } from "@/components/Loader";
import { Pagination, paginate } from "@/components/Pagination";

type Customer = {
    id: number; full_name: string; phone: string; email: string; note: string;
    initials: string; repair_count: number; total_spent: number; total_debt: number;
};

const AVATAR_COLORS = ["a1", "a2", "a3", "a4", "a5"];

export default function CustomersPage() {
    const [all, setAll] = useState<Customer[] | null>(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [error, setError] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [saving, setSaving] = useState(false);

    // Siyahıdan birbaşa (detal səhifəsinə getmədən) müştəri redaktəsi.
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);

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
    // Axtarış dəyişəndə səhifə 1-ə qayıtsın — effekt əvəzinə render zamanı uyğunlaşdırılır.
    const [prevSearch, setPrevSearch] = useState(search);
    if (search !== prevSearch) { setPrevSearch(search); if (page !== 1) setPage(1); }
    const pageItems = useMemo(() => paginate(filtered, page), [filtered, page]);

    async function handleCreate() {
        if (!newName.trim() || !newPhone.trim()) return;
        setSaving(true);
        try {
            await api.createCustomer({ full_name: newName, phone: newPhone, email: newEmail });
            setShowNew(false); setNewName(""); setNewPhone(""); setNewEmail("");
            load();
        } catch {
            setError("Müştəri yaradıla bilmədi.");
        } finally {
            setSaving(false);
        }
    }

    function openEdit(e: React.MouseEvent, c: Customer) {
        e.preventDefault(); e.stopPropagation();
        setEditingCustomer(c); setEditName(c.full_name); setEditPhone(c.phone); setEditEmail(c.email ?? "");
    }

    async function saveEdit() {
        if (!editingCustomer || !editName.trim() || !editPhone.trim()) return;
        setSavingEdit(true);
        try {
            await api.updateCustomer(editingCustomer.id, { full_name: editName, phone: editPhone, email: editEmail });
            setEditingCustomer(null);
            load();
        } catch {
            setError("Müştəri yenilənmədi.");
        } finally {
            setSavingEdit(false);
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
                <Modal title="Yeni müştəri" onClose={() => setShowNew(false)} maxWidth="max-w-2xl">
                    <div className="flex gap-3 flex-wrap">
                        <div className="fld flex-1 min-w-[180px]">
                            <label>Ad Soyad</label>
                            <div className="inp"><input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Rəşad Məmmədov" /></div>
                        </div>
                        <div className="fld flex-1 min-w-[180px]">
                            <label>Telefon</label>
                            <div className="inp"><input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+994 50 123 45 67" /></div>
                        </div>
                        <div className="fld flex-1 min-w-[180px]">
                            <label>E-poçt (istəyə bağlı)</label>
                            <div className="inp"><input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="musteri@example.com" /></div>
                        </div>
                    </div>
                    <button className="btn pri self-start" disabled={saving} onClick={handleCreate}>
                        {saving ? "Yadda saxlanılır…" : "Əlavə et"}
                    </button>
                </Modal>
            )}

            {editingCustomer && (
                <Modal title="Müştərini redaktə et" onClose={() => setEditingCustomer(null)} maxWidth="max-w-2xl">
                    <div className="flex gap-3 flex-wrap">
                        <div className="fld flex-1 min-w-[180px]">
                            <label>Ad Soyad</label>
                            <div className="inp"><input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
                        </div>
                        <div className="fld flex-1 min-w-[180px]">
                            <label>Telefon</label>
                            <div className="inp"><input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
                        </div>
                        <div className="fld flex-1 min-w-[180px]">
                            <label>E-poçt (istəyə bağlı)</label>
                            <div className="inp"><input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} /></div>
                        </div>
                    </div>
                    <button className="btn pri self-start" disabled={savingEdit} onClick={saveEdit}>
                        <Check size={16} /><span>{savingEdit ? "Yadda saxlanılır…" : "Yadda saxla"}</span>
                    </button>
                </Modal>
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
                            <div className="flex-none w-[44px]" />
                        </div>

                        {pageItems.map((c, i) => (
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
                                <div className="flex-none w-[44px] flex justify-end">
                                    <button onClick={(e) => openEdit(e, c)} className="text-muted hover:text-ink flex-none" title="Redaktə et">
                                        <Pencil size={15} />
                                    </button>
                                </div>
                            </Link>
                        ))}

                        {all && filtered.length === 0 && (
                            <div className="text-center text-muted text-sm py-10">Uyğun nəticə tapılmadı.</div>
                        )}
                        {!all && !error && (
                            <Loader />
                        )}
                    </div>
                </div>
                <Pagination page={page} totalItems={filtered.length} onChange={setPage} />
            </div>
        </>
    );
}