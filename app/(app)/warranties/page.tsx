"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, ShieldX, FileDown, Mail } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useDialog } from "@/lib/dialog-context";
import { Loader } from "@/components/Loader";
import { Pagination, paginate } from "@/components/Pagination";

type Warranty = {
    id: number; number: string; customer_id: number; customer_name: string; customer_initials: string;
    customer_email: string;
    device: string; work: string;
    warranty_started_at: string; warranty_end_date: string | null;
    warranty_days: number; warranty_days_left: number | null;
};

const AVATAR_COLORS = ["a1", "a2", "a3", "a4", "a5"];

function statusFor(daysLeft: number | null) {
    if (daysLeft === null) return { label: "Zəmanətsiz", badge: "b-gray" };
    if (daysLeft < 0) return { label: "Müddəti bitib", badge: "b-gray" };
    if (daysLeft <= 3) return { label: `${daysLeft} gün qalıb`, badge: "b-amber" };
    return { label: `${daysLeft} gün qalıb`, badge: "b-green" };
}

export default function WarrantiesPage() {
    const [all, setAll] = useState<Warranty[] | null>(null);
    const [error, setError] = useState("");
    const [tab, setTab] = useState<"active" | "ending" | "expired">("active");
    const [page, setPage] = useState(1);
    const [busyId, setBusyId] = useState<number | null>(null);
    const { alert, prompt } = useDialog();

    function load() {
        api.repairWarranties()
            .then((d) => setAll(d as Warranty[]))
            .catch(() => setError("Zəmanət siyahısı yüklənmədi."));
    }
    useEffect(load, []);

    async function downloadPdf(w: Warranty) {
        setBusyId(w.id);
        try {
            await api.downloadWarrantyPdf(w.id, `zemanet-${w.number}.pdf`);
        } catch {
            await alert("PDF yüklənmədi.", { title: "Xəta" });
        } finally {
            setBusyId(null);
        }
    }

    async function sendEmail(w: Warranty) {
        setBusyId(w.id);
        try {
            await api.sendWarrantyEmail(w.id);
            await alert(`Zəmanət sənədi ${w.customer_email} ünvanına göndərildi.`, { title: "Göndərildi" });
        } catch (err) {
            // Backend "müştərinin e-poçtu qeyd olunmayıb" deyirsə, elə burada soruşub
            // qeyd edək və göndərişi dərhal təkrarlayaq — müştəri kartına ayrıca getmədən.
            const missingEmail =
                err instanceof ApiError && err.status === 400 &&
                err.data && typeof err.data === "object" && "detail" in (err.data as Record<string, unknown>) &&
                String((err.data as { detail: string }).detail).includes("e-poçt");
            if (!missingEmail) {
                await alert("Göndərilmədi — server xətası.", { title: "Xəta" });
                setBusyId(null);
                return;
            }
            const email = await prompt(
                `${w.customer_name} üçün e-poçt ünvanı qeyd olunmayıb.\nGöndərmək üçün ünvanı yazın:`,
                { title: "E-poçt ünvanı yazın", label: "E-poçt", placeholder: "musteri@example.com", inputType: "email", confirmLabel: "Göndər" }
            );
            if (!email || !email.trim()) { setBusyId(null); return; }
            try {
                await api.updateCustomer(w.customer_id, { email: email.trim() });
                await api.sendWarrantyEmail(w.id);
                await alert(`E-poçt qeyd olundu və zəmanət sənədi ${email.trim()} ünvanına göndərildi.`, { title: "Göndərildi" });
                load();
            } catch {
                await alert("E-poçt qeyd olundu, amma göndərmə uğursuz oldu — yenidən cəhd edin.", { title: "Xəta" });
            }
        } finally {
            setBusyId(null);
        }
    }

    const counts = useMemo(() => {
        const list = all ?? [];
        return {
            active: list.filter((w) => (w.warranty_days_left ?? -1) >= 0).length,
            ending: list.filter((w) => w.warranty_days_left !== null && w.warranty_days_left >= 0 && w.warranty_days_left <= 3).length,
            expired: list.filter((w) => (w.warranty_days_left ?? 0) < 0).length,
        };
    }, [all]);

    const filtered = useMemo(() => {
        const list = all ?? [];
        if (tab === "ending") return list.filter((w) => w.warranty_days_left !== null && w.warranty_days_left >= 0 && w.warranty_days_left <= 3);
        if (tab === "expired") return list.filter((w) => (w.warranty_days_left ?? 0) < 0);
        return list.filter((w) => (w.warranty_days_left ?? -1) >= 0);
    }, [all, tab]);
    // Tab dəyişəndə səhifə 1-ə qayıtsın — render zamanı uyğunlaşdırılır.
    const [prevTab, setPrevTab] = useState(tab);
    if (tab !== prevTab) { setPrevTab(tab); if (page !== 1) setPage(1); }
    const pageItems = useMemo(() => paginate(filtered, page), [filtered, page]);

    return (
        <>
            <div>
                <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Zəmanətlər</h1>
                <p className="text-ink2 mt-1">Təhvil verilmiş cihazların zəmanət müddətləri geriyə sayılır.</p>
            </div>

            {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                <div className="card flex items-center gap-3">
                    <span className="t-green w-10 h-10 rounded-[10px] flex items-center justify-center flex-none"><ShieldCheck size={20} /></span>
                    <div><div className="text-2xl font-semibold leading-none">{counts.active}</div><span className="text-xs text-muted">Aktiv zəmanət</span></div>
                </div>
                <div className="card flex items-center gap-3">
                    <span className="t-amber w-10 h-10 rounded-[10px] flex items-center justify-center flex-none"><ShieldAlert size={20} /></span>
                    <div><div className="text-2xl font-semibold leading-none">{counts.ending}</div><span className="text-xs text-muted">3 günə bitir</span></div>
                </div>
                <div className="card flex items-center gap-3">
                    <span className="t-gray w-10 h-10 rounded-[10px] flex items-center justify-center flex-none"><ShieldX size={20} /></span>
                    <div><div className="text-2xl font-semibold leading-none">{counts.expired}</div><span className="text-xs text-muted">Müddəti bitib</span></div>
                </div>
            </div>

            <div className="flex gap-2">
                {[{ k: "active", l: `Aktiv (${counts.active})` }, { k: "ending", l: `Tezliklə bitir (${counts.ending})` }, { k: "expired", l: `Bitib (${counts.expired})` }].map((t) => (
                    <button
                        key={t.k}
                        onClick={() => setTab(t.k as typeof tab)}
                        className={`h-[38px] px-3.5 rounded-full border font-semibold text-sm ${tab === t.k ? "bg-side border-side text-white" : "bg-white border-line text-ink2"}`}
                    >
                        {t.l}
                    </button>
                ))}
            </div>

            <div className="card !p-2">
                <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                        <div className="tr h">
                            <div className="flex-1">Müştəri</div>
                            <div className="flex-[1.2]">Cihaz / iş</div>
                            <div className="flex-none w-[110px]">Başlanğıc</div>
                            <div className="flex-none w-[110px]">Bitmə tarixi</div>
                            <div className="flex-none w-[150px]">Vəziyyət</div>
                            <div className="flex-none w-[96px] text-center">Sənəd</div>
                        </div>
                        {pageItems.map((w, i) => {
                            const st = statusFor(w.warranty_days_left);
                            return (
                                <div key={w.id} className="tr">
                                    <Link href={`/repairs/${w.id}`} className="flex-1 flex items-center gap-2.5 font-semibold min-w-0">
                                        <div className={`av ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>{w.customer_initials}</div>
                                        <span className="truncate">{w.customer_name}</span>
                                    </Link>
                                    <Link href={`/repairs/${w.id}`} className="flex-[1.2] min-w-0">
                                        <b className="block truncate">{w.device || "—"}</b>
                                        <span className="text-xs text-muted truncate block">{w.work}</span>
                                    </Link>
                                    <Link href={`/repairs/${w.id}`} className="flex-none w-[110px] text-ink2 text-sm">{w.warranty_started_at}</Link>
                                    <Link href={`/repairs/${w.id}`} className="flex-none w-[110px] text-ink2 text-sm">{w.warranty_end_date ?? "—"}</Link>
                                    <Link href={`/repairs/${w.id}`} className="flex-none w-[150px]"><span className={`badge ${st.badge}`}><i />{st.label}</span></Link>
                                    <div className="flex-none w-[96px] flex items-center justify-center gap-1.5">
                                        <button
                                            title="PDF yüklə"
                                            disabled={busyId === w.id}
                                            onClick={() => downloadPdf(w)}
                                            className="w-8 h-8 rounded-[8px] border border-line flex items-center justify-center text-ink2 disabled:opacity-50"
                                        >
                                            <FileDown size={15} />
                                        </button>
                                        <button
                                            title={w.customer_email ? `${w.customer_email} ünvanına göndər` : "E-poçt qeyd olunmayıb — klikləyib yaza bilərsiniz"}
                                            disabled={busyId === w.id}
                                            onClick={() => sendEmail(w)}
                                            className={`w-8 h-8 rounded-[8px] border border-line flex items-center justify-center disabled:opacity-50 ${w.customer_email ? "text-ink2" : "text-muted"}`}
                                        >
                                            <Mail size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {all && filtered.length === 0 && (
                            <div className="text-center text-muted text-sm py-10">Bu kateqoriyada zəmanət yoxdur.</div>
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