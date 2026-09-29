import { SiteChrome } from "@/components/site/SiteChrome";
import Link from "next/link";
import { Check } from "lucide-react";
import { CtaBand, PageHero } from "@/components/site/Sections";
import { PLANS } from "@/lib/site-config";

export const metadata = { title: "Qiymətlər — Servio" };

export default function PricingPage() {
  return (
    <SiteChrome>
      <PageHero eyebrow="Qiymətlər" title="Servisinizin ölçüsünə uyğun plan" text="Sadə aylıq qiymət. Filial və istifadəçi sayına görə uyğun planı seçin." />
      <section className="py-14 md:py-20 bg-[#F2F7FF]">
        <div className="max-w-[900px] mx-auto px-5 md:px-8 grid gap-6 md:grid-cols-2">
          {PLANS.map((p) => (
            <div key={p.name} className={`relative rounded-2xl p-8 bg-white ${p.featured ? "border-2 border-[#116CFB] shadow-[0_16px_50px_rgba(31,107,255,0.18)]" : "border border-[#DCE8FF]"}`}>
              {p.featured && <span className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-[#116CFB] text-white text-xs font-semibold">Ən populyar</span>}
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <p className="text-sm text-[#3E4C6B] mt-1">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1.5"><span className="text-[44px] font-bold tracking-tight">{p.price}</span><span className="text-[#3E4C6B]">AZN / ay</span></div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-[#E3EFFF] text-[#116CFB] text-xs font-semibold">{p.branches}</span>
                <span className="px-3 py-1 rounded-full bg-[#E3EFFF] text-[#116CFB] text-xs font-semibold">{p.users}</span>
              </div>
              <ul className="mt-6 flex flex-col gap-3">
                {p.items.map((i) => <li key={i} className="flex gap-3 text-[15px]"><Check size={18} className="text-[#041326] flex-none mt-0.5" />{i}</li>)}
              </ul>
              <Link href="/elaqe" className={`mt-8 h-12 rounded-xl font-semibold flex items-center justify-center transition-colors ${p.featured ? "bg-[#116CFB] hover:bg-[#3A85FF] text-white" : "border border-[#116CFB] text-[#116CFB] hover:bg-[#E3EFFF]"}`}>Pulsuz başla</Link>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-[#3E4C6B] mt-8 px-5">Sualınız var? <Link href="/faq" className="text-[#116CFB] font-semibold">Tez-tez verilən suallara</Link> baxın və ya <Link href="/elaqe" className="text-[#116CFB] font-semibold">bizimlə əlaqə saxlayın</Link>.</p>
      </section>
      <CtaBand />
    </SiteChrome>
  );
}
