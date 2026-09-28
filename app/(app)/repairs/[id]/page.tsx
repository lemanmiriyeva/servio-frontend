"use client";
import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

type RepairDetail = {
  id: number; number: string;
  customer: { id: number; full_name: string; phone: string; initials: string };
  device_brand: string; device_model: string; device_imei: string; device_serial: string;
  issue_description: string; work_done_note: string;
  cost_price: number | null; sale_price: number; profit: number | null;
  status: string; payment_status: string; debt_due_date: string | null;
  warranty_days: number; warranty_started_at: string | null; warranty_end_date: string | null; warranty_days_left: number | null;
  received_at: string; delivered_at: string | null;
  payments: { id: number; amount: number; method: string; paid_at: string }[];
  paid_amount: number; remaining_debt: number;
  supplier_purchases?: { id: number; supplier: string; description: string; amount: number; paid_amount: number; remaining: number }[];
};

const STATUS_LABEL: Record<string, string> = {
  received: "Qəbul edildi", diagnosing: "Diaqnostikada", waiting_repair: "Təmir gözləyir",
  in_progress: "Təmir prosesində", ready: "Hazırdır", delivered: "Təhvil verildi", cancelled: "Ləğv edildi",
};
const STATUS_BADGE: Record<string, string> = {
  received: "b-blue", diagnosing: "b-purple", waiting_repair: "b-amber",
  in_progress: "b-cyan", ready: "b-green", delivered: "b-gray", cancelled: "b-red",
};
const PAYMENT_METHOD_LABEL: Record<string, string> = { cash: "Nağd", card: "Kart", bank_transfer: "Bank köçürməsi" };

export default function RepairDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [data, setData] = useState<RepairDetail | null>(null);
  const [error, setError] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [busy, setBusy] = useState(false);

  function load() {
    api.repair(id).then((d) => setData(d as RepairDetail)).catch(() => setError("Təmir tapılmadı."));
  }
  useEffect(() => { load(); }, [id]);

  async function changeStatus(newStatus: string) {
    setBusy(true);
    try {
      await api.setRepairStatus(id, newStatus);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function submitPayment() {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;
    setBusy(true);
    try {
      await api.addRepairPayment(id, amount, paymentMethod);
      setShowPaymentForm(false);
      setPaymentAmount("");
      load();
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="card" style={{ color: "var(--red)" }}>{error}</div>;
  if (!data) return <div className="text-muted text-sm">Yüklənir…</div>;

  return (
      <>
        <div className="flex items-center gap-3">
          <Link href="/repairs" className="w-10 h-10 rounded-[10px] bg-white border border-line flex items-center justify-center text-ink2 flex-none">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold">{data.number}</h1>
              <span className={`badge ${STATUS_BADGE[data.status]}`}><i />{STATUS_LABEL[data.status]}</span>
            </div>
            <p className="text-ink2 text-sm mt-0.5">{data.customer.full_name} · {data.customer.phone}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <button
                  key={key}
                  disabled={busy || data.status === key}
                  onClick={() => changeStatus(key)}
                  className={`chip sm ${data.status === key ? "on" : ""}`}
              >
                {label}
              </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
            <div className="card">
              <h3 className="text-base font-semibold mb-3">Cihaz və iş</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="mut block text-xs mb-1">Marka / Model</span><b>{data.device_brand} {data.device_model}</b></div>
                <div><span className="mut block text-xs mb-1">IMEI / Seriya</span><b>{data.device_imei || data.device_serial || "—"}</b></div>
                <div className="col-span-2"><span className="mut block text-xs mb-1">Problem / iş</span><b>{data.issue_description}</b></div>
                {data.work_done_note && (
                    <div className="col-span-2"><span className="mut block text-xs mb-1">Görülən iş qeydi</span><span>{data.work_done_note}</span></div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Ödənişlər</h3>
                <button className="btn pri" onClick={() => setShowPaymentForm((s) => !s)}>
                  <Plus size={16} /><span>Ödəniş əlavə et</span>
                </button>
              </div>
              {showPaymentForm && (
                  <div className="flex gap-3 items-end mb-4 p-3 rounded-[10px] border border-line flex-wrap">
                    <div className="fld" style={{ maxWidth: 160 }}>
                      <label>Məbləğ (AZN)</label>
                      <div className="inp"><input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} /></div>
                    </div>
                    <div className="fld" style={{ maxWidth: 180 }}>
                      <label>Üsul</label>
                      <select className="inp" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        <option value="cash">Nağd</option>
                        <option value="card">Kart</option>
                        <option value="bank_transfer">Bank köçürməsi</option>
                      </select>
                    </div>
                    <button className="btn pri" disabled={busy} onClick={submitPayment}>Təsdiqlə</button>
                  </div>
              )}
              {data.payments.length === 0 ? (
                  <div className="text-muted text-sm py-4 text-center">Hələ ödəniş yoxdur.</div>
              ) : (
                  data.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-line last:border-b-0">
                        <span className="text-sm">{new Date(p.paid_at).toLocaleString("az-AZ")}</span>
                        <span className="text-sm text-muted">{PAYMENT_METHOD_LABEL[p.method]}</span>
                        <b className="pos">+{p.amount} AZN</b>
                      </div>
                  ))
              )}
            </div>
          </div>

          <div className="w-full lg:w-[320px] flex-none flex flex-col gap-4">
            {data.supplier_purchases && data.supplier_purchases.length > 0 && (
                <div className="card">
                  <h3 className="text-base font-semibold mb-3">Təchizatçı borcu</h3>
                  <div className="flex flex-col gap-2 text-sm">
                    {data.supplier_purchases.map((sp) => (
                        <div key={sp.id} className="flex justify-between gap-3">
                          <div className="min-w-0"><b className="block truncate">{sp.supplier}</b><span className="text-xs text-muted truncate block">{sp.description}</span></div>
                          <span className={`badge flex-none ${sp.remaining > 0 ? "b-red" : "b-green"}`}><i />{sp.remaining > 0 ? `${sp.remaining} AZN borc` : "Ödənilib"}</span>
                        </div>
                    ))}
                  </div>
                </div>
            )}

            <div className="card">
              <h3 className="text-base font-semibold mb-3">Maliyyə</h3>
              <div className="flex flex-col gap-2 text-sm">
                {data.cost_price !== null && <div className="flex justify-between"><span className="mut">Maya dəyəri</span><b>{data.cost_price} AZN</b></div>}
                <div className="flex justify-between"><span className="mut">Satış qiyməti</span><b>{data.sale_price} AZN</b></div>
                {data.profit !== null && <div className="flex justify-between"><span className="mut">Qazanc</span><b className="pos">{data.profit} AZN</b></div>}
                <div className="flex justify-between pt-2 border-t border-line"><span className="mut">Ödənilib</span><b className="pos">{data.paid_amount} AZN</b></div>
                <div className="flex justify-between"><span className="mut">Qalıq</span><b className={data.remaining_debt > 0 ? "neg" : ""}>{data.remaining_debt} AZN</b></div>
              </div>
            </div>

            {data.warranty_started_at && (
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold">Zəmanət</h3>
                    <span className="badge b-green"><ShieldCheck size={12} />Aktiv</span>
                  </div>
                  <div className="text-sm flex flex-col gap-1.5">
                    <div className="flex justify-between"><span className="mut">Başlama</span><b>{data.warranty_started_at}</b></div>
                    <div className="flex justify-between"><span className="mut">Bitmə</span><b>{data.warranty_end_date}</b></div>
                    <div className="flex justify-between"><span className="mut">Qalan gün</span><b>{data.warranty_days_left}</b></div>
                  </div>
                </div>
            )}
          </div>
        </div>
      </>
  );
}