"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Search, Plus, User, Smartphone, Wallet, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Customer = { id: number; full_name: string; phone: string; initials: string };

const STEPS = [
  { key: "customer", label: "Müştəri", icon: User },
  { key: "device", label: "Cihaz və iş", icon: Smartphone },
  { key: "money", label: "Maliyyə", icon: Wallet },
  { key: "warranty", label: "Zəmanət və ödəniş", icon: ShieldCheck },
] as const;

export default function NewRepairPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — customer
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  // Step 2 — device
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceImei, setDeviceImei] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  // Step 3 — money
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");

  // Step 4 — warranty & payment
  const [warrantyDays, setWarrantyDays] = useState(user?.shop?.default_warranty_days ?? 14);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer">("cash");

  useEffect(() => {
    if (user?.shop?.default_warranty_days) setWarrantyDays(user.shop.default_warranty_days);
  }, [user]);

  useEffect(() => {
    const presetId = searchParams.get("customer");
    if (presetId) {
      api.customer(presetId).then((c) => { setSelectedCustomer(c as Customer); setStep(1); }).catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => {
    if (customerQuery.trim().length < 2) { setCustomerResults([]); return; }
    const t = setTimeout(() => {
      api.customers(`?search=${encodeURIComponent(customerQuery)}`)
          .then((d) => {
            const data = d as { results?: Customer[] } | Customer[];
            setCustomerResults(Array.isArray(data) ? data : data.results ?? []);
          }).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [customerQuery]);

  async function handleCreateCustomer() {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) return;
    try {
      const c = (await api.createCustomer({ full_name: newCustomerName, phone: newCustomerPhone })) as Customer;
      setSelectedCustomer(c);
      setShowNewCustomer(false);
      setNewCustomerName(""); setNewCustomerPhone("");
    } catch {
      setError("Müştəri yaradıla bilmədi.");
    }
  }

  function canProceed() {
    if (step === 0) return !!selectedCustomer;
    if (step === 1) return deviceBrand.trim() && deviceModel.trim() && issueDescription.trim();
    if (step === 2) return salePrice.trim().length > 0;
    return true;
  }

  async function handleSubmit() {
    if (!selectedCustomer) return;
    setSaving(true);
    setError("");
    try {
      const repair = (await api.createRepair({
        customer_id: selectedCustomer.id,
        device_brand: deviceBrand,
        device_model: deviceModel,
        device_imei: deviceImei,
        issue_description: issueDescription,
        cost_price: costPrice || 0,
        sale_price: salePrice,
        warranty_days: warrantyDays,
      })) as { id: number };

      const amount = parseFloat(paymentAmount);
      if (amount > 0) {
        await api.addRepairPayment(repair.id, amount, paymentMethod);
      }
      router.push(`/repairs/${repair.id}`);
    } catch {
      setError("Yadda saxlanılmadı. Zəhmət olmasa məlumatları yoxlayın.");
      setSaving(false);
    }
  }

  return (
      <>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Yeni xidmət</h1>
            <p className="text-ink2 mt-1">Müştəri, cihaz, görülən iş, maya, satış, zəmanət və ödəniş.</p>
          </div>
          <button className="btn" onClick={() => router.push("/repairs")}><span>Ləğv et</span></button>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const cur = i === step;
            return (
                <div
                    key={s.key}
                    className={`flex items-center gap-2.5 pl-2 pr-4 h-[46px] rounded-full border font-semibold text-sm ${
                        cur ? "bg-side border-side text-white" : "bg-white border-line text-ink2"
                    }`}
                >
              <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] ${
                      done || cur ? "bg-brand text-brand-ink" : "bg-bg text-ink2"
                  }`}
              >
                {done ? <Check size={16} strokeWidth={3} /> : i + 1}
              </span>
                  <Icon size={16} className={cur ? "opacity-90" : "opacity-70"} />
                  {s.label}
                </div>
            );
          })}
        </div>

        {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

        <div className="card max-w-2xl">
          {step === 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-base font-semibold">Müştəri</h3>
                {selectedCustomer ? (
                    <div className="flex items-center gap-3 p-3 rounded-[10px] border border-line">
                      <div className="av a1">{selectedCustomer.initials}</div>
                      <div className="flex-1">
                        <b className="block">{selectedCustomer.full_name}</b>
                        <span className="text-xs text-muted">{selectedCustomer.phone}</span>
                      </div>
                      <button className="btn ghost" onClick={() => setSelectedCustomer(null)}>Dəyiş</button>
                    </div>
                ) : (
                    <>
                      <div className="inp">
                        <Search size={18} className="text-muted flex-none" />
                        <input
                            placeholder="Müştəri adı və ya telefon ilə axtar"
                            value={customerQuery}
                            onChange={(e) => setCustomerQuery(e.target.value)}
                        />
                      </div>
                      {customerResults.length > 0 && (
                          <div className="border border-line rounded-[10px] overflow-hidden">
                            {customerResults.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => { setSelectedCustomer(c); setCustomerResults([]); setCustomerQuery(""); }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left border-b border-line last:border-b-0"
                                >
                                  <div className="av a3">{c.initials}</div>
                                  <div>
                                    <b className="block text-sm">{c.full_name}</b>
                                    <span className="text-xs text-muted">{c.phone}</span>
                                  </div>
                                </button>
                            ))}
                          </div>
                      )}
                      {!showNewCustomer ? (
                          <button className="btn self-start" onClick={() => setShowNewCustomer(true)}>
                            <Plus size={18} /><span>Yeni müştəri əlavə et</span>
                          </button>
                      ) : (
                          <div className="flex flex-col gap-3 p-3 rounded-[10px] border border-line">
                            <div className="fld">
                              <label>Ad Soyad</label>
                              <div className="inp"><input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Rəşad Məmmədov" /></div>
                            </div>
                            <div className="fld">
                              <label>Telefon</label>
                              <div className="inp"><input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="+994 50 123 45 67" /></div>
                            </div>
                            <div className="flex gap-2">
                              <button className="btn pri" onClick={handleCreateCustomer}>Əlavə et</button>
                              <button className="btn ghost" onClick={() => setShowNewCustomer(false)}>Ləğv et</button>
                            </div>
                          </div>
                      )}
                    </>
                )}
              </div>
          )}

          {step === 1 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-base font-semibold">Cihaz və görülən iş</h3>
                <div className="frow flex gap-4">
                  <div className="fld flex-1">
                    <label>Marka</label>
                    <div className="inp"><input value={deviceBrand} onChange={(e) => setDeviceBrand(e.target.value)} placeholder="Apple" /></div>
                  </div>
                  <div className="fld flex-1">
                    <label>Model</label>
                    <div className="inp"><input value={deviceModel} onChange={(e) => setDeviceModel(e.target.value)} placeholder="iPhone 17 Pro" /></div>
                  </div>
                </div>
                <div className="fld">
                  <label>IMEI / Seriya (opsional)</label>
                  <div className="inp"><input value={deviceImei} onChange={(e) => setDeviceImei(e.target.value)} placeholder="356789..." /></div>
                </div>
                <div className="fld">
                  <label>Problem / görüləcək iş</label>
                  <div className="inp ta">
                <textarea
                    className="w-full outline-none bg-transparent resize-none h-full pt-0"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Ekran dəyişdirilməsi"
                />
                  </div>
                </div>
              </div>
          )}

          {step === 2 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-base font-semibold">Maya və satış qiyməti</h3>
                <div className="frow flex gap-4">
                  <div className="fld flex-1">
                    <label>Maya dəyəri (AZN)</label>
                    <div className="inp"><input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0" /></div>
                  </div>
                  <div className="fld flex-1">
                    <label>Satış qiyməti (AZN) *</label>
                    <div className="inp"><input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0" /></div>
                  </div>
                </div>
                {costPrice && salePrice && (
                    <div className="prof rounded-[10px] px-4 py-3.5 flex justify-between items-center" style={{ background: "var(--green-s)", color: "var(--green)" }}>
                      <span className="font-semibold">Gözlənilən qazanc</span>
                      <b className="text-2xl font-bold">{(parseFloat(salePrice) - parseFloat(costPrice || "0")).toFixed(0)} AZN</b>
                    </div>
                )}
              </div>
          )}

          {step === 3 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-base font-semibold">Zəmanət və ilkin ödəniş</h3>
                <div className="fld">
                  <label>Zəmanət müddəti (gün)</label>
                  <div className="inp"><input type="number" value={warrantyDays} onChange={(e) => setWarrantyDays(Number(e.target.value))} /></div>
                  <span className="mut text-xs">Cihaz təhvil veriləndə avtomatik başlayacaq</span>
                </div>
                <div className="frow flex gap-4">
                  <div className="fld flex-1">
                    <label>İlkin ödəniş (AZN, opsional)</label>
                    <div className="inp"><input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0" /></div>
                  </div>
                  <div className="fld flex-1">
                    <label>Ödəniş üsulu</label>
                    <select
                        className="inp"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as "cash" | "card" | "bank_transfer")}
                    >
                      <option value="cash">Nağd</option>
                      <option value="card">Kart</option>
                      <option value="bank_transfer">Bank köçürməsi</option>
                    </select>
                  </div>
                </div>
                <div className="sum flex flex-col border border-line rounded-[10px] p-4 gap-1 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-dashed border-line"><span className="mut">Müştəri</span><b>{selectedCustomer?.full_name}</b></div>
                  <div className="flex justify-between py-1.5 border-b border-dashed border-line"><span className="mut">Cihaz</span><b>{deviceBrand} {deviceModel}</b></div>
                  <div className="flex justify-between py-1.5"><span className="mut">Satış qiyməti</span><b className="text-lg">{salePrice || 0} AZN</b></div>
                </div>
              </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && <button className="btn" onClick={() => setStep((s) => s - 1)}>Geri</button>}
            <div className="flex-1" />
            {step < STEPS.length - 1 ? (
                <button className="btn pri" disabled={!canProceed()} onClick={() => setStep((s) => s + 1)}>Növbəti</button>
            ) : (
                <button className="btn pri" disabled={saving} onClick={handleSubmit}>
                  {saving ? "Yadda saxlanılır…" : "Yadda saxla"}
                </button>
            )}
          </div>
        </div>
      </>
  );
}