"use client";
import { useEffect, useState } from "react";
import { Save, Plus, MapPin, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getBlurProfitDefault, setBlurProfitDefault } from "@/lib/prefs";

type ShopSettings = {
    name: string; owner_full_name: string; owner_phone: string; owner_email: string;
    city: string; default_warranty_days: number; currency: string;
};
type Branch = { id: number; name: string; address: string; phone: string; is_main: boolean };

const WARRANTY_OPTIONS = [7, 14, 30, 90, 0];

export default function SettingsPage() {
    const { user } = useAuth();
    const [form, setForm] = useState<ShopSettings | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    const [branches, setBranches] = useState<Branch[] | null>(null);
    const [showBranchForm, setShowBranchForm] = useState(false);
    const [bName, setBName] = useState("");
    const [bAddress, setBAddress] = useState("");
    const [bPhone, setBPhone] = useState("");

    const [blurDefault, setBlurDefault] = useState(() => getBlurProfitDefault());

    useEffect(() => {
        api.myShop().then((d) => setForm(d as ShopSettings)).catch(() => setError("Mağaza məlumatı yüklənmədi."));
        api.branches().then((d) => {
            const data = d as { results?: Branch[] } | Branch[];
            setBranches(Array.isArray(data) ? data : data.results ?? []);
        }).catch(() => {});
    }, []);

    function update<K extends keyof ShopSettings>(key: K, value: ShopSettings[K]) {
        setForm((f) => (f ? { ...f, [key]: value } : f));
    }

    async function handleSave() {
        if (!form) return;
        setSaving(true); setSaved(false);
        try {
            await api.updateMyShop(form);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch {
            setError("Yadda saxlanılmadı.");
        } finally {
            setSaving(false);
        }
    }

    function toggleBlurDefault() {
        const next = !blurDefault;
        setBlurDefault(next);
        setBlurProfitDefault(next);
    }

    async function handleAddBranch() {
        if (!bName.trim()) return;
        try {
            await api.createBranch({ name: bName, address: bAddress, phone: bPhone });
            setBName(""); setBAddress(""); setBPhone(""); setShowBranchForm(false);
            const d = await api.branches();
            const data = d as { results?: Branch[] } | Branch[];
            setBranches(Array.isArray(data) ? data : data.results ?? []);
        } catch {
            setError("Filial əlavə edilmədi.");
        }
    }

    return (
        <>
            <div>
                <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Parametrlər</h1>
                <p className="text-ink2 mt-1">Mağaza profili, filiallar və görünüş tənzimləmələri.</p>
            </div>

            {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

            <div className="flex flex-col lg:flex-row gap-5 items-start">
                <div className="flex-1 w-full min-w-0 flex flex-col gap-5">
                    <div className="card flex flex-col gap-3.5">
                        <h3 className="text-base font-semibold">Mağaza profili</h3>
                        {!form ? (
                            <div className="text-center text-muted text-sm py-6">Yüklənir…</div>
                        ) : (
                            <>
                                <div className="flex gap-3 flex-wrap">
                                    <div className="fld flex-1 min-w-[200px]">
                                        <label>Mağazanın adı</label>
                                        <div className="inp"><input value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
                                    </div>
                                    <div className="fld flex-1 min-w-[160px]">
                                        <label>Şəhər</label>
                                        <div className="inp"><input value={form.city} onChange={(e) => update("city", e.target.value)} /></div>
                                    </div>
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    <div className="fld flex-1 min-w-[200px]">
                                        <label>Sahib / məsul şəxs</label>
                                        <div className="inp"><input value={form.owner_full_name} onChange={(e) => update("owner_full_name", e.target.value)} /></div>
                                    </div>
                                    <div className="fld flex-1 min-w-[160px]">
                                        <label>Telefon</label>
                                        <div className="inp"><input value={form.owner_phone} onChange={(e) => update("owner_phone", e.target.value)} /></div>
                                    </div>
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    <div className="fld flex-1 min-w-[200px]">
                                        <label>E-poçt</label>
                                        <div className="inp"><input value={form.owner_email} onChange={(e) => update("owner_email", e.target.value)} /></div>
                                    </div>
                                    <div className="fld min-w-[140px]" style={{ maxWidth: 160 }}>
                                        <label>Valyuta</label>
                                        <div className="inp"><input value={form.currency} onChange={(e) => update("currency", e.target.value)} /></div>
                                    </div>
                                </div>
                                <div className="fld">
                                    <label>Standart zəmanət müddəti</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {WARRANTY_OPTIONS.map((d) => (
                                            <button key={d} onClick={() => update("default_warranty_days", d)} className={`chip ${form.default_warranty_days === d ? "on" : ""}`}>
                                                {d === 0 ? "Zəmanətsiz" : `${d} gün`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button className="btn pri self-start" disabled={saving} onClick={handleSave}>
                                    <Save size={16} /><span>{saving ? "Yadda saxlanılır…" : saved ? "Saxlanıldı ✓" : "Yadda saxla"}</span>
                                </button>
                            </>
                        )}
                    </div>

                    <div className="card flex flex-col gap-3.5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold">Filiallar</h3>
                            <button className="btn" onClick={() => setShowBranchForm((s) => !s)}><Plus size={16} /><span>Filial əlavə et</span></button>
                        </div>
                        {showBranchForm && (
                            <div className="flex gap-3 flex-wrap p-3 rounded-[10px] border border-line">
                                <div className="fld flex-1 min-w-[140px]">
                                    <label>Ad</label>
                                    <div className="inp"><input value={bName} onChange={(e) => setBName(e.target.value)} placeholder="Nəsimi filialı" /></div>
                                </div>
                                <div className="fld flex-1 min-w-[160px]">
                                    <label>Ünvan</label>
                                    <div className="inp"><input value={bAddress} onChange={(e) => setBAddress(e.target.value)} /></div>
                                </div>
                                <div className="fld min-w-[140px]" style={{ maxWidth: 160 }}>
                                    <label>Telefon</label>
                                    <div className="inp"><input value={bPhone} onChange={(e) => setBPhone(e.target.value)} /></div>
                                </div>
                                <button className="btn pri self-end" onClick={handleAddBranch}>Əlavə et</button>
                            </div>
                        )}
                        <div className="flex flex-col">
                            {(branches ?? []).map((b) => (
                                <div key={b.id} className="tr">
                                    <div className="flex-1 flex items-center gap-2.5 font-semibold min-w-0">
                                        <span className="t-blue w-9 h-9 rounded-[9px] flex items-center justify-center flex-none"><MapPin size={16} /></span>
                                        <span className="truncate">{b.name}</span>
                                        {b.is_main && <span className="badge b-gray"><i />Əsas</span>}
                                    </div>
                                    <div className="flex-1 text-ink2 text-sm truncate">{b.address || "—"}</div>
                                    <div className="flex-none w-[130px] text-ink2 text-sm">{b.phone || "—"}</div>
                                </div>
                            ))}
                            {branches && branches.length === 0 && (
                                <div className="text-center text-muted text-sm py-6">Hələ filial əlavə edilməyib.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-[320px] flex-none flex flex-col gap-4">
                    <div className="card flex flex-col gap-3">
                        <h3 className="text-base font-semibold">Görünüş</h3>
                        <div className="flex items-center justify-between py-1">
                            <div className="min-w-0 pr-3">
                                <b className="block text-sm">Qazancı defolt olaraq gizlət</b>
                                <span className="text-xs text-muted">Dashboard-da açılış zamanı qazanc rəqəmi ••••• kimi görünsün</span>
                            </div>
                            <button onClick={toggleBlurDefault} className={`w-11 h-11 rounded-[10px] flex items-center justify-center flex-none border ${blurDefault ? "bg-side border-side text-white" : "bg-white border-line text-ink2"}`}>
                                {blurDefault ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="card flex flex-col gap-2">
                        <h3 className="text-base font-semibold mb-1">Hesab</h3>
                        <div className="flex items-center justify-between py-2 border-b border-line">
                            <span className="text-[13px] text-ink2">Giriş</span>
                            <span className="mono text-sm">{user?.username}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-line">
                            <span className="text-[13px] text-ink2">Rol</span>
                            <span className="text-sm font-semibold">{user?.role?.name || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-[13px] text-ink2">Mağaza kodu</span>
                            <span className="mono text-sm">{user?.shop?.code}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}