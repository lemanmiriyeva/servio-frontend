"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, X, Pencil, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Loader } from "@/components/Loader";
import { Modal } from "@/components/Modal";
import { Pagination, paginate } from "@/components/Pagination";

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
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  // Siyahıdan birbaşa (detal səhifəsinə getmədən) sürətli redaktə. Siyahının öz sətri
  // IMEI/seriya/görülən iş qeydini daşımır (yüngül list serializer) — modal açılanda
  // tam qeydi ayrıca yükləyirik.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editBrand, setEditBrand] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editImei, setEditImei] = useState("");
  const [editSerial, setEditSerial] = useState("");
  const [editIssue, setEditIssue] = useState("");
  const [editWorkDone, setEditWorkDone] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  function load() {
    api.repairs("?page_size=200").then((d) => {
      const data = d as { results?: RepairListItem[] } | RepairListItem[];
      setAll(Array.isArray(data) ? data : data.results ?? []);
    }).catch(() => setError("Siyahı yüklənmədi."));
  }

  async function openEdit(e: React.MouseEvent, id: number) {
    e.preventDefault(); e.stopPropagation();
    setEditingId(id);
    setEditLoading(true);
    try {
      const d = (await api.repair(id)) as {
        device_brand: string; device_model: string; device_imei: string; device_serial: string;
        issue_description: string; work_done_note: string; sale_price: number; status: string;
      };
      setEditBrand(d.device_brand); setEditModel(d.device_model);
      setEditImei(d.device_imei ?? ""); setEditSerial(d.device_serial ?? "");
      setEditIssue(d.issue_description); setEditWorkDone(d.work_done_note ?? "");
      setEditPrice(String(d.sale_price)); setEditStatus(d.status);
    } catch {
      setError("Təmir məlumatı yüklənmədi.");
      setEditingId(null);
    } finally {
      setEditLoading(false);
    }
  }

  async function saveEdit() {
    if (editingId === null || !editBrand.trim() || !editModel.trim() || !editIssue.trim()) return;
    const price = parseFloat(editPrice);
    if (!price || price <= 0) return;
    setSavingEdit(true);
    try {
      await api.updateRepair(editingId, {
        device_brand: editBrand, device_model: editModel,
        device_imei: editImei, device_serial: editSerial,
        issue_description: editIssue, work_done_note: editWorkDone,
        sale_price: price,
      });
      // Status AYRICA, xüsusi "/status" endpoint-i ilə dəyişdirilir (sadə PATCH yox) —
      // çünki status dəyişəndə backend-də əlavə məntiq işləyir (status tarixçəsi qeydə
      // alınır, "Təhvil verildi"də zəmanət başlanğıcı təyin olunur, ödəniş statusu
      // yenidən hesablanır). Bunu burda təkrarlamaq əvəzinə eyni endpoint-dən istifadə edirik.
      const current = all?.find((r) => r.id === editingId);
      if (editStatus && current && editStatus !== current.status) {
        await api.setRepairStatus(editingId, editStatus);
      }
      setEditingId(null);
      load();
    } catch {
      setError("Yenilənmədi — sahələri yoxlayın.");
    } finally {
      setSavingEdit(false);
    }
  }

  useEffect(() => { load(); }, []);

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
  // Filtr/axtarış dəyişəndə səhifə 1-ə qayıtsın — effekt əvəzinə render zamanı uyğunlaşdırılır.
  const [prevFilterKey, setPrevFilterKey] = useState(`${activeTab}|${search}`);
  const filterKey = `${activeTab}|${search}`;
  if (filterKey !== prevFilterKey) { setPrevFilterKey(filterKey); if (page !== 1) setPage(1); }
  const pageItems = useMemo(() => paginate(filtered, page), [filtered, page]);

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

              {pageItems.map((r, i) => {
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
                      <div className="flex-none w-6 flex justify-end">
                        <button onClick={(e) => openEdit(e, r.id)} className="text-muted hover:text-ink flex-none" title="Redaktə et">
                          <Pencil size={15} />
                        </button>
                      </div>
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
              <div className="px-3 pt-4 pb-2">
                <Pagination page={page} totalItems={filtered.length} onChange={setPage} />
              </div>
          )}
        </div>

        {editingId !== null && (
            <Modal title="Cihaz və işi redaktə et" onClose={() => setEditingId(null)} maxWidth="max-w-lg">
              {editLoading ? (
                  <Loader />
              ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="fld"><label>Marka</label><div className="inp"><input value={editBrand} onChange={(e) => setEditBrand(e.target.value)} /></div></div>
                      <div className="fld"><label>Model</label><div className="inp"><input value={editModel} onChange={(e) => setEditModel(e.target.value)} /></div></div>
                      <div className="fld"><label>IMEI</label><div className="inp"><input value={editImei} onChange={(e) => setEditImei(e.target.value)} /></div></div>
                      <div className="fld"><label>Seriya</label><div className="inp"><input value={editSerial} onChange={(e) => setEditSerial(e.target.value)} /></div></div>
                    </div>
                    <div className="fld">
                      <label>Problem / iş</label>
                      <textarea className="inp !h-auto py-2.5" rows={2} value={editIssue} onChange={(e) => setEditIssue(e.target.value)} />
                    </div>
                    <div className="fld">
                      <label>Görülən iş qeydi</label>
                      <textarea className="inp !h-auto py-2.5" rows={2} value={editWorkDone} onChange={(e) => setEditWorkDone(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="fld" style={{ maxWidth: 180 }}>
                        <label>Xidmət qiyməti (AZN)</label>
                        <div className="inp"><input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} /></div>
                      </div>
                      <div className="fld">
                        <label>Vəziyyət</label>
                        <select className="inp" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                          {STATUS_TABS.filter((t) => t.key).map((t) => (
                              <option key={t.key} value={t.key}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-1">
                      <button className="btn" onClick={() => setEditingId(null)}>Ləğv et</button>
                      <button className="btn pri" disabled={savingEdit} onClick={saveEdit}><Check size={16} /><span>Yadda saxla</span></button>
                    </div>
                  </>
              )}
            </Modal>
        )}
      </>
  );
}