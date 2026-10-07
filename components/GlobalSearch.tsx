"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type RepairHit = {
    id: number; number: string; customer_name: string; customer_initials: string;
    device_brand: string; device_model: string; status: string;
};

const STATUS_LABEL: Record<string, string> = {
    received: "Qəbul edildi", diagnosing: "Diaqnostikada", waiting_repair: "Təmir gözləyir",
    in_progress: "Təmir prosesində", ready: "Hazırdır", delivered: "Təhvil verildi", cancelled: "Ləğv edildi",
};

/**
 * Sayt başlığındakı "Müştəri, telefon, IMEI, təmir № üzrə axtar" qutusu.
 * Klikləyəndə (və ya Ctrl/Cmd+K ilə) açılan axtarış pəncərəsi backend-in
 * RepairOrderViewSet-dəki search_fields-ə (number, customer ad/telefon, IMEI, seriya)
 * sorğu göndərir və nəticəyə klikləyəndə təmirin kartına aparır.
 */
export function GlobalSearch() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<RepairHit[] | null>(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Ctrl/Cmd+K istənilən səhifədə axtarışı açsın
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen(true);
            }
            if (e.key === "Escape") setOpen(false);
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    useEffect(() => {
        if (open) {
            setQuery("");
            setResults(null);
            setTimeout(() => inputRef.current?.focus(), 30);
        }
    }, [open]);

    // Axtarış mətni dəyişəndə 300ms gecikmə ilə sorğu at (hər hərfdə backend-i yormasın)
    useEffect(() => {
        if (!open) return;
        const q = query.trim();
        if (!q) { setResults(null); setLoading(false); return; }
        setLoading(true);
        const timer = setTimeout(() => {
            api.repairs(`?search=${encodeURIComponent(q)}&page_size=8`)
                .then((d) => {
                    const data = d as { results?: RepairHit[] } | RepairHit[];
                    setResults(Array.isArray(data) ? data : data.results ?? []);
                })
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, 300);
        return () => clearTimeout(timer);
    }, [query, open]);

    function goTo(id: number) {
        setOpen(false);
        router.push(`/repairs/${id}`);
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="hidden sm:flex items-center gap-2.5 h-11 w-full max-w-[460px] px-3.5 bg-white border border-line rounded-[10px] text-muted cursor-pointer text-left"
            >
                <Search size={18} />
                <span className="text-sm truncate">Müştəri, telefon, IMEI, təmir № üzrə axtar</span>
                <span className="ml-auto text-xs border border-line rounded-md px-1.5 py-px flex-none">Ctrl K</span>
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="card max-w-xl w-full flex flex-col gap-3 max-h-[70vh] overflow-hidden !p-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-line flex-none">
                            <Search size={18} className="text-muted flex-none" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Müştəri, telefon, IMEI, təmir № üzrə axtar..."
                                className="flex-1 outline-none bg-transparent text-sm"
                            />
                            {loading && <Loader2 size={16} className="animate-spin text-muted flex-none" />}
                        </div>
                        <div className="overflow-y-auto px-2 pb-2">
                            {!query.trim() && (
                                <div className="text-center text-muted text-sm py-8">Axtarmaq üçün yazmağa başlayın.</div>
                            )}
                            {query.trim() && results && results.length === 0 && !loading && (
                                <div className="text-center text-muted text-sm py-8">Nəticə tapılmadı.</div>
                            )}
                            {results && results.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => goTo(r.id)}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-[8px] hover:bg-gray-50 text-left"
                                >
                                    <div className="av a2 flex-none">{r.customer_initials}</div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <b className="truncate">{r.customer_name}</b>
                                            <span className="mono text-xs text-muted flex-none">{r.number}</span>
                                        </div>
                                        <span className="text-xs text-muted truncate block">
                                            {`${r.device_brand} ${r.device_model}`.trim() || "—"} · {STATUS_LABEL[r.status] || r.status}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}