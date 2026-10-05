"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, X, MoreHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { Loader } from "@/components/Loader";

type RepairListItem = {
  id: number; number: string; customer: number;
  customer_name: string; customer_initials: string;
  device_brand: string; device_model: string; issue_description: string;
  status: string; payment_status: string; sale_price: number;
  warranty_days_left: number | null;
  received_at: string; delivered_at: string | null; last_status_at: string | null;
};

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const STATUS_TABS = [
  { key: "", label: "Hamısı" },
  { key: "received", label: "Qəbul edildi" },
  { key: "diagnosing", label: "Diaqnostikada" },
  { key: "waiting_repair", label: "Təmir gözləyir" },
  { key: "in_progress", label: "Təmir prosesində" },
  { key: "ready", label: "Hazırdır" },
  { key: "delivered", label: "Təhvil verildi" },
  { key: "cancelled", label: "Ləğv edildi" },
] as const;

const STATUS_BADGE: Record<string, string> = {
  received: "b-blue", diagnosing: "b-purple", waiting_repair: "b-amber",
  in_progress: "b-cyan", ready: "b-green", delivered: "b-gray", cancelled: "b-red",
};
const STATUS_LABEL: Record<string, string> = {
  received: "Qəbul edildi", diagnosing: "Diaqnostikada", waiting_repair: "Təmir gözləyir",
  in_progress: "Təmir prosesində", ready: "Hazırdır", delivered: "Təhvil verildi", cancelled: "Ləğv edildi",
};
const PAYMENT_BADGE: Record<string, { cls: string; label: string }> = {
  unpaid: { cls: "b-gray", label: "Ödənilməyib" },
  partial: { cls: "b-amber", label: "Qismən ödənilib" },
  paid: { cls: "b-green", label: "Ödənilib" },
  debt: { cls: "b-red", label: "Borc qalıb" },
};
const AVATAR_COLORS = ["a1", "a2", "a3", "a4", "a5"];

export default function RepairsPage() {
  const [all, setAll] = useState<RepairListItem[] | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.repairs("?page_size=200").then((d) => {
      const data = d as { results?: RepairListItem[] } | RepairListItem[];
      setAll(Array.isArray(data) ? data : data.results ?? []);
    }).catch(() => setError("Siyahı yüklənmədi."));
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (all ?? []).forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [all]);

  const filtered = useMemo(() => {
    let list = all ?? [];
    if (activeTab) list = list.filter((r) => r.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
          r.number.toLowerCase().includes(q) ||
          r.customer_name.toLowerCase().includes(q) ||
          `${r.device_brand} ${r.device_model}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [all, activeTab, search]);

  return (
      <>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Təmir / Xidmətlər</h1>
            <p className="text-ink2 mt-1">Bütün qəbul edilmiş cihazlar, statuslar və ödənişlər.</p>
          </div>
          <div className="flex gap-2.5">
            {(activeTab || search) && (
                <button className="btn" onClick={() => { setActiveTab(""); setSearch(""); }}>
                  <X size={18} /><span>Filtrləri sıfırla</span>
                </button>
            )}
          </div>
        </div>

        {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((t) => (
              <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`h-[38px] px-3.5 rounded-full border inline-flex items-center gap-2 font-semibold whitespace-nowrap text-sm ${
                      activeTab === t.key ? "bg-side border-side text-white" : "bg-white border-line text-ink2"
                  }`}
              >
                {t.label}
                <span className={activeTab === t.key ? "text-[#8FA9B2] font-medium text-[13px]" : "text-muted font-medium text-[13px]"}>
              {t.key ? (counts[t.key] ?? 0) : (all?.length ?? 0)}
            </span>
              </button>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px] h-11 px-3.5 rounded-[10px] bg-white border border-line flex items-center gap-2.5 text-ink2">
            <Search size={18} className="text-muted flex-none" />
            <input
                className="w-full outline-none bg-transparent text-sm"
                placeholder="Müştəri, telefon, IMEI, serial, cihaz və ya təmir №"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card !p-2">
          <div className="overflow-x-auto">
            <div className="min-w-[964px]">
              <div className="tr h">
                <div className="flex-none w-[132px]">Təmir №</div>
                <div className="flex-1">Müştəri</div>
                <div className="flex-[1.4]">Cihaz və görülən iş</div>
                <div className="flex-none w-[156px]">Vəziyyət</div>
                <div className="flex-none w-[104px]">Tarix</div>
                <div className="flex-none w-[76px] text-right">Məbləğ</div>
                <div className="flex-none w-[150px]">Ödəniş</div>
                <div className="flex-none w-[92px]">Zəmanət</div>
                <div className="flex-none w-6" />
              </div>

              {filtered.map((r, i) => {
                const pay = PAYMENT_BADGE[r.payment_status] ?? PAYMENT_BADGE.unpaid;
                return (
                    <Link key={r.id} href={`/repairs/${r.id}`} className="tr hover:bg-gray-50/60 cursor-pointer">
                      <div className="flex-none w-[132px]"><span className="mono text-[13px]">{r.number}</span></div>
                      <div className="flex-1 flex items-center gap-2.5 font-semibold min-w-0">
                        <div className={`av ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>{r.customer_initials}</div>
                        <span className="truncate">{r.customer_name}</span>
                      </div>
                      <div className="flex-[1.4] leading-tight min-w-0">
                        <b className="block font-semibold truncate">{`${r.device_brand} ${r.device_model}`.trim() || "—"}</b>
                        <span className="text-xs text-muted truncate block">{r.issue_description}</span>
                      </div>
                      <div className="flex-none w-[156px]">
                        <span className={`badge ${STATUS_BADGE[r.status] || "b-gray"}`}><i />{STATUS_LABEL[r.status] || r.status}</span>
                      </div>
                      <div className="flex-none w-[104px] text-xs text-ink2">{fmtDate(r.last_status_at)}</div>
                      <div className="flex-none w-[76px] text-right font-semibold">
                        {r.status === "cancelled" ? <span className="mut">—</span> : Math.round(r.sale_price)}
                      </div>
                      <div className="flex-none w-[150px]">
                        {r.status === "cancelled" ? <span className="mut">—</span> : <span className={`badge ${pay.cls} !whitespace-normal`}><i />{pay.label}</span>}
                      </div>
                      <div className="flex-none w-[92px]">
                        {r.status === "cancelled" ? (
                            <span className="mut">—</span>
                        ) : r.warranty_days_left === null ? (
                            <span className="mut">—</span>
                        ) : r.warranty_days_left <= 3 ? (
                            <span className="amb font-semibold">{r.warranty_days_left} gün qalıb</span>
                        ) : (
                            <span className="mut">{r.warranty_days_left} gün</span>
                        )}
                      </div>
                      <div className="flex-none w-6 text-muted"><MoreHorizontal size={18} /></div>
                    </Link>
                );
              })}

              {all && filtered.length === 0 && (
                  <div className="text-center text-muted text-sm py-10">Uyğun nəticə tapılmadı.</div>
              )}
              {!all && !error && (
                  <Loader />
              )}
            </div>
          </div>

          {all && filtered.length > 0 && (
              <div className="flex justify-between items-center px-3 pt-4 pb-2 text-ink2 text-[13px]">
                <span>{filtered.length} xidmətdən {filtered.length} göstərilir</span>
              </div>
          )}
        </div>
      </>
  );
}