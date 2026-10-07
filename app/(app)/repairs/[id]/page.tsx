"use client";
import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, ShieldCheck, ShieldX, RotateCcw, X, FileDown, Mail, Pencil } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useDialog } from "@/lib/dialog-context";
import { Loader } from "@/components/Loader";
import { Modal } from "@/components/Modal";

type WarrantyReturn = {
  id: number; reason: string; refund_amount: number | null;
  supplier_purchase: number | null; supplier_id: number | null; supplier_name: string | null;
  part_description: string | null; return_amount: number | null;
  supplier_status: "not_sent" | "pending" | "accepted" | "rejected";
  supplier_note: string; supplier_resolved_at: string | null; created_at: string;
};

type RepairDetail = {
  id: number; number: string;
  customer: { id: number; full_name: string; phone: string; email: string; initials: string };
  device_brand: string; device_model: string; device_imei: string; device_serial: string;
  technician_name: string;
  issue_description: string; work_done_note: string;
  cost_price: number | null; sale_price: number; profit: number | null;
  status: string; payment_status: string; debt_due_date: string | null;
  warranty_days: number; warranty_started_at: string | null; warranty_end_date: string | null; warranty_days_left: number | null;
  received_at: string; delivered_at: string | null;
  payments: { id: number; amount: number; method: string; paid_at: string }[];
  paid_amount: number; remaining_debt: number;
  supplier_purchases?: { id: number; supplier: string; description: string; amount: number; paid_amount: number; remaining: number }[];
  warranty_returns?: WarrantyReturn[];
  status_history?: { status: string; status_display: string; changed_at: string }[];
};

const RETURN_STATUS_LABEL: Record<string, string> = {
  not_sent: "Təchizatçıya göndərilməyib", pending: "Təchizatçıda gözləyir",
  accepted: "Təchizatçı qəbul etdi", rejected: "Təchizatçı rədd etdi",
};
const RETURN_STATUS_BADGE: Record<string, string> = {
  not_sent: "b-gray", pending: "b-amber", accepted: "b-green", rejected: "b-red",
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
  const { alert, prompt } = useDialog();
  const [data, setData] = useState<RepairDetail | null>(null);
  const [error, setError] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [busy, setBusy] = useState(false);

  // Cihaz/xidmət sahələrinin (marka, model, IMEI, problem, görülən iş, qiymət) redaktəsi.
  const [editingDevice, setEditingDevice] = useState(false);
  const [editBrand, setEditBrand] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editImei, setEditImei] = useState("");
  const [editSerial, setEditSerial] = useState("");
  const [editIssue, setEditIssue] = useState("");
  const [editWorkDone, setEditWorkDone] = useState("");
  const [editSalePrice, setEditSalePrice] = useState("");
  const [savingDevice, setSavingDevice] = useState(false);

  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnRefund, setReturnRefund] = useState("");
  const [returnSupplierPurchaseId, setReturnSupplierPurchaseId] = useState<string>("");
  const [returnAmount, setReturnAmount] = useState("");

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
    if (data && data.remaining_debt > 0 && amount > data.remaining_debt) {
      setError(`Ödəniş qalıq borcdan (${data.remaining_debt} AZN) çox ola bilməz.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.addRepairPayment(id, amount, paymentMethod);
      setShowPaymentForm(false);
      setPaymentAmount("");
      load();
    } catch {
      setError("Ödəniş qeydə alınmadı — məbləği yoxlayın.");
    } finally {
      setBusy(false);
    }
  }

  function openEditDevice() {
    if (!data) return;
    setEditBrand(data.device_brand); setEditModel(data.device_model);
    setEditImei(data.device_imei ?? ""); setEditSerial(data.device_serial ?? "");
    setEditIssue(data.issue_description); setEditWorkDone(data.work_done_note ?? "");
    setEditSalePrice(String(data.sale_price));
    setEditingDevice(true);
  }

  async function saveDevice() {
    if (!editBrand.trim() || !editModel.trim() || !editIssue.trim()) return;
    const price = parseFloat(editSalePrice);
    if (!price || price <= 0) return;
    setSavingDevice(true);
    try {
      await api.updateRepair(id, {
        device_brand: editBrand, device_model: editModel,
        device_imei: editImei, device_serial: editSerial,
        issue_description: editIssue, work_done_note: editWorkDone,
        sale_price: price,
      });
      setEditingDevice(false);
      load();
    } catch {
      await alert("Yenilənmədi — sahələri yoxlayın.", { title: "Xəta" });
    } finally {
      setSavingDevice(false);
    }
  }

  async function sendWarrantyEmail() {
    setBusy(true);
    try {
      await api.sendWarrantyEmail(id);
      await alert("Zəmanət sənədi müştərinin e-poçtuna göndərildi.", { title: "Göndərildi" });
    } catch (err) {
      const missingEmail =
          err instanceof ApiError && err.status === 400 &&
          err.data && typeof err.data === "object" && "detail" in (err.data as Record<string, unknown>) &&
          String((err.data as { detail: string }).detail).includes("e-poçt");
      if (!missingEmail) {
        await alert("Göndərilmədi — server xətası.", { title: "Xəta" });
        setBusy(false);
        return;
      }
      const email = await prompt(
          `${data?.customer.full_name} üçün e-poçt ünvanı qeyd olunmayıb.\nGöndərmək üçün ünvanı yazın:`,
          { title: "E-poçt ünvanı yazın", label: "E-poçt", placeholder: "musteri@example.com", inputType: "email", confirmLabel: "Göndər" }
      );
      if (!email || !email.trim()) { setBusy(false); return; }
      try {
        await api.updateCustomer(data!.customer.id, { email: email.trim() });
        await api.sendWarrantyEmail(id);
        await alert(`E-poçt qeyd olundu və zəmanət sənədi ${email.trim()} ünvanına göndərildi.`, { title: "Göndərildi" });
        load();
      } catch {
        await alert("E-poçt qeyd olundu, amma göndərmə uğursuz oldu — yenidən cəhd edin.", { title: "Xəta" });
      }
    } finally {
      setBusy(false);
    }
  }

  async function downloadWarrantyPdf() {
    try {
      await api.downloadWarrantyPdf(id, `zemanet-${data?.number ?? id}.pdf`);
    } catch {
      await alert("PDF yüklənmədi.", { title: "Xəta" });
    }
  }

  async function submitWarrantyReturn() {
    if (!returnReason.trim()) return;
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { reason: returnReason };
      if (returnRefund) payload.refund_amount = parseFloat(returnRefund);
      if (returnSupplierPurchaseId) {
        payload.supplier_purchase_id = parseInt(returnSupplierPurchaseId, 10);
        if (returnAmount) payload.return_amount = parseFloat(returnAmount);
      }
      await api.createWarrantyReturn(id, payload);
      setShowReturnForm(false);
      setReturnReason(""); setReturnRefund(""); setReturnSupplierPurchaseId(""); setReturnAmount("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function resolveReturn(returnId: number, decision: "accepted" | "rejected") {
    const note = decision === "rejected"
        ? ((await prompt("Rədd səbəbi (məs. fiziki zədə, ləkə):", { title: "Rədd səbəbi" })) ?? "")
        : "";
    setBusy(true);
    try {
      await api.resolveWarrantyReturn(returnId, decision, note);
      load();
    } finally {
      setBusy(false);
    }
  }

  if (!data && error) return <div className="card" style={{ color: "var(--red)" }}>{error}</div>;
  if (!data) return <Loader />;

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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Cihaz və iş</h3>
                <button onClick={openEditDevice} className="text-muted flex-none" title="Redaktə et"><Pencil size={15} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="mut block text-xs mb-1">Marka / Model</span><b>{data.device_brand} {data.device_model}</b></div>
                <div><span className="mut block text-xs mb-1">IMEI / Seriya</span><b>{data.device_imei || data.device_serial || "—"}</b></div>
                {data.technician_name && (
                    <div className="col-span-2"><span className="mut block text-xs mb-1">Servisə göndərilib — usta</span><b>{data.technician_name}</b></div>
                )}
                <div className="col-span-2"><span className="mut block text-xs mb-1">Problem / iş</span><b>{data.issue_description}</b></div>
                {data.work_done_note && (
                    <div className="col-span-2"><span className="mut block text-xs mb-1">Görülən iş qeydi</span><span>{data.work_done_note}</span></div>
                )}
                <div><span className="mut block text-xs mb-1">Xidmət qiyməti</span><b>{data.sale_price} AZN</b></div>
              </div>
            </div>

            {editingDevice && (
                <Modal title="Cihaz və işi redaktə et" onClose={() => setEditingDevice(false)} maxWidth="max-w-lg">
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
                  <div className="fld" style={{ maxWidth: 180 }}>
                    <label>Xidmət qiyməti (AZN)</label>
                    <div className="inp"><input type="number" value={editSalePrice} onChange={(e) => setEditSalePrice(e.target.value)} /></div>
                  </div>
                  <div className="flex justify-end gap-2 mt-1">
                    <button className="btn" onClick={() => setEditingDevice(false)}>Ləğv et</button>
                    <button className="btn pri" disabled={savingDevice} onClick={saveDevice}>Yadda saxla</button>
                  </div>
                </Modal>
            )}

            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Ödənişlər</h3>
                <button className="btn pri" onClick={() => setShowPaymentForm((s) => !s)}>
                  <Plus size={16} /><span>Ödəniş əlavə et</span>
                </button>
              </div>
              {error && <div className="text-sm mb-3" style={{ color: "var(--red)" }}>{error}</div>}
              {showPaymentForm && (
                  <div className="flex gap-3 items-end mb-4 p-3 rounded-[10px] border border-line flex-wrap">
                    <div className="fld" style={{ maxWidth: 160 }}>
                      <label>Məbləğ (AZN)</label>
                      <div className="inp"><input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder={data.remaining_debt > 0 ? String(data.remaining_debt) : "0"} /></div>
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

            {data.status_history && data.status_history.length > 0 && (
                <div className="card">
                  <h3 className="text-base font-semibold mb-3">Status tarixçəsi</h3>
                  <div className="flex flex-col gap-2.5 text-sm">
                    {data.status_history.map((h, i) => (
                        <div key={i} className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`badge ${STATUS_BADGE[h.status] || "b-gray"} flex-none`}><i />{h.status_display}</span>
                          </div>
                          <span className="text-xs text-muted flex-none text-right">
                      {new Date(h.changed_at).toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
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
                    {data.status === "cancelled" ? (
                        <span className="badge b-gray"><ShieldX size={12} />Etibarsız (ləğv edilib)</span>
                    ) : (
                        <span className="badge b-green"><ShieldCheck size={12} />Aktiv</span>
                    )}
                  </div>
                  <div className="text-sm flex flex-col gap-1.5">
                    <div className="flex justify-between"><span className="mut">Başlama</span><b>{data.warranty_started_at}</b></div>
                    <div className="flex justify-between"><span className="mut">Bitmə</span><b>{data.warranty_end_date}</b></div>
                    <div className="flex justify-between"><span className="mut">Qalan gün</span><b>{data.warranty_days_left}</b></div>
                  </div>

                  {data.status === "cancelled" && (
                      <p className="text-xs text-muted mt-3">Xidmət ləğv edildiyi üçün zəmanət etibarsızdır — PDF/email göndərmə deaktivdir.</p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button className="btn flex-1 justify-center" disabled={busy || data.status === "cancelled"} onClick={downloadWarrantyPdf}>
                      <FileDown size={16} /><span>PDF yüklə</span>
                    </button>
                    <button className="btn flex-1 justify-center" disabled={busy || data.status === "cancelled"} onClick={sendWarrantyEmail}>
                      <Mail size={16} /><span>E-poçtla göndər</span>
                    </button>
                  </div>

                  <button
                      className="btn mt-2 w-full justify-center"
                      onClick={() => setShowReturnForm((s) => !s)}
                  >
                    <RotateCcw size={16} /><span>Zəmanət altında qaytarma</span>
                  </button>

                  {showReturnForm && (
                      <div className="flex flex-col gap-3 mt-3 p-3 rounded-[10px] border border-line">
                        <div className="flex items-center justify-between">
                          <b className="text-sm">Yeni qaytarma</b>
                          <button onClick={() => setShowReturnForm(false)} className="text-muted"><X size={16} /></button>
                        </div>
                        <div className="fld">
                          <label>Səbəb</label>
                          <div className="inp"><textarea rows={2} value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Məs. ekran sensoru yenidən işləmir" /></div>
                        </div>
                        <div className="fld">
                          <label>Müştəriyə qaytarılan (AZN, varsa)</label>
                          <div className="inp"><input type="number" value={returnRefund} onChange={(e) => setReturnRefund(e.target.value)} placeholder="0" /></div>
                        </div>
                        {data.supplier_purchases && data.supplier_purchases.length > 0 && (
                            <>
                              <div className="fld">
                                <label>Təchizatçıya göndərilsin (hissə)</label>
                                <select
                                    className="inp"
                                    value={returnSupplierPurchaseId}
                                    onChange={(e) => {
                                      setReturnSupplierPurchaseId(e.target.value);
                                      const sp = data.supplier_purchases?.find((p) => String(p.id) === e.target.value);
                                      setReturnAmount(sp ? String(sp.amount) : "");
                                    }}
                                >
                                  <option value="">Göndərilməsin</option>
                                  {data.supplier_purchases.map((sp) => (
                                      <option key={sp.id} value={sp.id}>{sp.supplier} — {sp.description}</option>
                                  ))}
                                </select>
                              </div>
                              {returnSupplierPurchaseId && (
                                  <div className="fld">
                                    <label>Təchizatçıdan tələb olunan məbləğ (AZN)</label>
                                    <div className="inp"><input type="number" value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} /></div>
                                  </div>
                              )}
                            </>
                        )}
                        <button className="btn pri" disabled={busy} onClick={submitWarrantyReturn}>Qaytarmanı qeydə al</button>
                      </div>
                  )}

                  {data.warranty_returns && data.warranty_returns.length > 0 && (
                      <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-line">
                        <b className="text-sm">Qaytarma tarixçəsi</b>
                        {data.warranty_returns.map((wr) => (
                            <div key={wr.id} className="text-sm p-2.5 rounded-[10px] border border-line flex flex-col gap-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <span className="min-w-0 truncate">{wr.reason}</span>
                                <span className={`badge flex-none ${RETURN_STATUS_BADGE[wr.supplier_status]}`}><i />{RETURN_STATUS_LABEL[wr.supplier_status]}</span>
                              </div>
                              {wr.supplier_name && (
                                  <span className="text-xs text-muted">{wr.supplier_name} · {wr.part_description}{wr.return_amount !== null ? ` · ${wr.return_amount} AZN` : ""}</span>
                              )}
                              {wr.supplier_note && <span className="text-xs text-muted">Qeyd: {wr.supplier_note}</span>}
                              {wr.supplier_status === "pending" && (
                                  <div className="flex gap-2 mt-1">
                                    <button className="btn sm pri flex-1 justify-center" disabled={busy} onClick={() => resolveReturn(wr.id, "accepted")}>Qəbul edildi</button>
                                    <button className="btn sm flex-1 justify-center" disabled={busy} onClick={() => resolveReturn(wr.id, "rejected")}>Rədd edildi</button>
                                  </div>
                              )}
                            </div>
                        ))}
                      </div>
                  )}
                </div>
            )}
          </div>
        </div>
      </>
  );
}