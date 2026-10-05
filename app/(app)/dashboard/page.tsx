"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, Wrench, Banknote, ShieldCheck, TrendingUp, Eye, EyeOff,
  Calendar, BarChart3, Clock3, CreditCard, Truck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { getBlurProfitDefault, getHideAmountsDefault, setHideAmountsDefault } from "@/lib/prefs";

type DashboardData = {
  date: string;
  customers_total: number;
  customers_new_this_week: number;
  active_repairs_count: number;
  today_income: number | null;
  today_payments_count: number | null;
  month_income: number | null;
  active_warranty_count: number;
  warranty_ending_soon_count: number;
  customer_debt_total: number;
  supplier_debt_total: number;
  overdue_repairs_count: number;
  cash_balance: number | null;
  recent_repairs: {
    id: number; number: string; customer_name: string; customer_initials: string;
    device: string; work: string; status: string; status_label: string; sale_price: number;
  }[];
};

type ReportsData = { net_profit: number };

const STATUS_BADGE: Record<string, string> = {
  received: "b-blue",
  diagnosing: "b-purple",
  waiting_repair: "b-amber",
  in_progress: "b-cyan",
  ready: "b-green",
  delivered: "b-gray",
  cancelled: "b-red",
};

const AVATAR_COLORS = ["a1", "a2", "a3", "a4", "a5"];

function fmt(n: number) {
  return new Intl.NumberFormat("az-AZ").format(Math.round(n));
}

export default function DashboardPage() {
  const { user, hasModule } = useAuth();
  const canSeeProfit = hasModule("revenue_numbers");
  const [data, setData] = useState<DashboardData | null>(null);
  const [profit, setProfit] = useState<number | null>(null);

  // FIX: Use lazy initialization to avoid setting state inside an effect on mount
  const [showProfit, setShowProfit] = useState(() => !getBlurProfitDefault());

  // Ümumi baxışdakı BÜTÜN məbləğləri (gəlir, borc və s.) birdən gizlədən master-düymə — kimsə
  // ekrana baxa bilən yerdə işləyəndə rəqəmləri tez gizlətmək üçün. Seçim brauzerdə yadda qalır.
  const [showAmounts, setShowAmounts] = useState(() => !getHideAmountsDefault());
  function toggleShowAmounts() {
    setShowAmounts((s) => { setHideAmountsDefault(s); return !s; });
  }
  function mask(text: string) {
    return showAmounts ? text : "•••••";
  }

  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard().then((d) => setData(d as DashboardData)).catch(() => setError("Məlumatlar yüklənmədi."));
    if (canSeeProfit) api.reportsSummary().then((d) => setProfit((d as ReportsData).net_profit)).catch(() => {});
  }, []);

  // Node/brauzerin ICU verilənlər bazasında "az-AZ" üçün ay adları tam olmaya bilər —
  // bu halda Intl "2026 M09 29" kimi pozuq format qaytarır. Ona görə ay adlarını özümüz yazırıq.
  const AZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
  const now = new Date();
  const today = `${now.getDate()} ${AZ_MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
      <>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Ana səhifə</h1>
            <p className="text-ink2 mt-1">
              Salam, {user?.first_name}. Bu gün {today}
              {data ? `, servisdə ${data.active_repairs_count} aktiv təmir var.` : "."}
            </p>
          </div>
          <div className="flex gap-2.5">
            <button className="btn" onClick={toggleShowAmounts} title={showAmounts ? "Məbləğləri gizlət" : "Məbləğləri göstər"}>
              {showAmounts ? <EyeOff size={18} /> : <Eye size={18} />}<span>{showAmounts ? "Məbləğləri gizlət" : "Məbləğləri göstər"}</span>
            </button>
            <button className="btn"><Calendar size={18} /><span>Bu gün</span></button>
            <Link href="/reports" className="btn"><BarChart3 size={18} /><span>Hesabata keç</span></Link>
          </div>
        </div>

        {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

        {/* Hero bench */}
        <div className="rounded-[14px] p-7 flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-side text-white">
          <div>
            <div className="text-[13px] text-[#8FA9B2]">Bu ayın gəliri</div>
            <div className="text-[40px] md:text-[48px] font-semibold tracking-tight leading-[1.05] mt-1.5">
              {data ? (data.month_income === null ? "•••••" : mask(fmt(data.month_income))) : "—"}
              <small className="text-lg font-semibold text-[#8FA9B2] ml-2">AZN</small>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-[250px] bg-white/[0.07] rounded-xl p-4.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#8FA9B2]">Bu ayın qazancı</span>
                {canSeeProfit && (
                    <button onClick={() => setShowProfit((s) => !s)} className="w-8 h-8 rounded-lg bg-brand text-brand-ink flex items-center justify-center flex-none">
                      {showProfit ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
              </div>
              <div className="text-2xl font-semibold tracking-tight">
                {canSeeProfit && showProfit && profit !== null ? mask(`${fmt(profit)} AZN`) : "••••• AZN"}
              </div>
              <div className="text-xs text-[#8FA9B2]">{canSeeProfit ? "Göstərmək üçün göz işarəsinə klik edin" : "Bu rol üçün gizlədilib"}</div>
            </div>
            <div className="w-full sm:w-[250px] bg-white/[0.07] rounded-xl p-4.5 flex flex-col gap-2">
              <span className="text-[13px] text-[#8FA9B2]">Kassa balansı</span>
              <div className="text-2xl font-semibold tracking-tight">
                {data ? (data.cash_balance === null ? "•••••" : mask(`${fmt(data.cash_balance)} AZN`)) : "—"}
              </div>
              <div className="text-xs text-[#8FA9B2]">{data?.cash_balance === null ? "Bu rol üçün gizlədilib" : "Xərc və təchizatçı ödənişi düşülüb"}</div>
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-ink2 font-medium text-[13px]">Ümumi müştəri sayı</span>
              <span className="t-blue w-[38px] h-[38px] rounded-[10px] flex items-center justify-center"><Users size={20} /></span>
            </div>
            <div className="text-[32px] font-semibold tracking-tight leading-none">{data?.customers_total ?? "—"}</div>
            <div className="text-xs text-muted flex items-center gap-1.5">
            <span className="text-green font-semibold inline-flex items-center gap-1">
              <TrendingUp size={14} /> +{data?.customers_new_this_week ?? 0}
            </span> bu həftə
            </div>
          </div>

          <div className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-ink2 font-medium text-[13px]">Aktiv təmir sayı</span>
              <span className="t-cyan w-[38px] h-[38px] rounded-[10px] flex items-center justify-center"><Wrench size={20} /></span>
            </div>
            <div className="text-[32px] font-semibold tracking-tight leading-none">{data?.active_repairs_count ?? "—"}</div>
            <div className="text-xs text-muted">{data?.overdue_repairs_count ?? 0} təmir gecikir</div>
          </div>

          <div className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-ink2 font-medium text-[13px]">Bu günün gəliri</span>
              <span className="t-green w-[38px] h-[38px] rounded-[10px] flex items-center justify-center"><Banknote size={20} /></span>
            </div>
            <div className="text-[32px] font-semibold tracking-tight leading-none">
              {data ? (data.today_income === null ? "•••••" : mask(fmt(data.today_income))) : "—"}<small className="text-sm font-semibold text-muted ml-1.5">AZN</small>
            </div>
            <div className="text-xs text-muted">{data?.today_payments_count === null ? "Bu rol üçün gizlədilib" : `${data?.today_payments_count ?? 0} ödəniş qəbul edildi`}</div>
          </div>

          <div className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-ink2 font-medium text-[13px]">Zəmanətdə olan təmir</span>
              <span className="t-brand w-[38px] h-[38px] rounded-[10px] flex items-center justify-center"><ShieldCheck size={20} /></span>
            </div>
            <div className="text-[32px] font-semibold tracking-tight leading-none">{data?.active_warranty_count ?? "—"}</div>
            <div className="text-xs text-muted">{data?.warranty_ending_soon_count ?? 0} zəmanət tezliklə bitir</div>
          </div>
        </div>

        {/* Columns */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <div className="flex-1 min-w-0 w-full">
            <div className="card !p-2">
              <div className="flex items-center justify-between px-3 pt-2 pb-3.5">
                <h3 className="text-base font-semibold">Son xidmətlər</h3>
                <Link href="/repairs" className="link text-[13px] font-semibold" style={{ color: "var(--blue)" }}>Hamısına bax</Link>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[640px]">
                  <div className="tr h">
                    <div className="flex-none w-32">Təmir №</div>
                    <div className="flex-1">Müştəri</div>
                    <div className="flex-[1.2]">Cihaz</div>
                    <div className="flex-none w-[140px]">Vəziyyət</div>
                    <div className="flex-none w-20 text-right">Məbləğ</div>
                  </div>
                  {(data?.recent_repairs ?? []).map((r, i) => (
                      <div key={r.id} className="tr">
                        <div className="flex-none w-32"><span className="mono text-[13px]">{r.number}</span></div>
                        <div className="flex-1 flex items-center gap-2.5 font-semibold">
                          <div className={`av ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>{r.customer_initials}</div>
                          {r.customer_name}
                        </div>
                        <div className="flex-[1.2] leading-tight min-w-0">
                          <b className="block font-semibold truncate">{r.device || "—"}</b>
                          <span className="text-xs text-muted truncate block">{r.work}</span>
                        </div>
                        <div className="flex-none w-[140px]">
                          <span className={`badge ${STATUS_BADGE[r.status] || "b-gray"}`}><i /> {r.status_label}</span>
                        </div>
                        <div className="flex-none w-20 text-right font-semibold">{mask(fmt(r.sale_price))} AZN</div>
                      </div>
                  ))}
                  {data && data.recent_repairs.length === 0 && (
                      <div className="text-center text-muted text-sm py-8">Hələ heç bir xidmət yoxdur.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[340px] flex-none flex flex-col gap-4">
            <div className="card">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-base font-semibold">Borclar</h3>
                <Link href="/debts" className="text-[13px] font-semibold" style={{ color: "var(--blue)" }}>Bax</Link>
              </div>
              <div className="flex items-center justify-between py-3.5 border-b border-line">
                <span className="text-[13px] text-ink2 font-medium">Müştərilərdən alınacaq</span>
                <b className="amb text-xl">{data ? mask(fmt(data.customer_debt_total)) : "—"} AZN</b>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-[13px] text-ink2 font-medium">Təchizatçılara ödəniləcək</span>
                <b className="text-xl" style={{ color: "var(--purple)" }}>{data ? mask(fmt(data.supplier_debt_total)) : "—"} AZN</b>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-base font-semibold">Xəbərdarlıqlar</h3>
                <span className="badge b-red">yeni</span>
              </div>
              <div className="flex flex-col">
                <AlertRow icon={<ShieldCheck size={18} />} tone="t-amber" title="Zəmanəti tezliklə bitən" sub={`${data?.warranty_ending_soon_count ?? 0} təmir`} />
                <AlertRow icon={<Clock3 size={18} />} tone="t-red" title="Gecikmiş təmirlər" sub={`${data?.overdue_repairs_count ?? 0} təmir, gözlənilən tarix keçib`} />
                <AlertRow icon={<CreditCard size={18} />} tone="t-red" title="Ödənilməmiş müştəri borcları" sub={mask(`${fmt(data?.customer_debt_total ?? 0)} AZN`)} />
                <AlertRow icon={<Truck size={18} />} tone="t-purple" title="Təchizatçı borcu" sub={mask(`${fmt(data?.supplier_debt_total ?? 0)} AZN`)} last />
              </div>
            </div>
          </div>
        </div>
      </>
  );
}

function AlertRow({ icon, tone, title, sub, last }: { icon: React.ReactNode; tone: string; title: string; sub: string; last?: boolean }) {
  return (
      <div className={`flex gap-3 py-3 items-center ${last ? "" : "border-b border-line"}`}>
        <div className={`${tone} w-9 h-9 rounded-[9px] flex items-center justify-center flex-none`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <b className="block text-sm font-semibold">{title}</b>
          <span className="text-xs text-muted">{sub}</span>
        </div>
      </div>
  );
}