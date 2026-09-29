import { SiteChrome } from "@/components/site/SiteChrome";
import { ChevronDown } from "lucide-react";
import { CtaBand, PageHero } from "@/components/site/Sections";
import { FAQ } from "@/lib/site-config";

export const metadata = { title: "FAQ — Servio" };

export default function FaqPage() {
  return (
    <SiteChrome>
      <PageHero eyebrow="FAQ" title="Tez-tez verilən suallar" text="Servio haqqında ən çox soruşulan suallar və cavabları." />
      <section className="py-14 md:py-20">
        <div className="max-w-[820px] mx-auto px-5 md:px-8 flex flex-col gap-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-[#DCE8FF] bg-white px-6 py-5 open:shadow-[0_8px_30px_rgba(16,40,100,0.07)]">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-[16px]">
                {f.q}
                <ChevronDown size={20} className="text-[#116CFB] flex-none transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-[15px] text-[#3E4C6B] leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <CtaBand />
    </SiteChrome>
  );
}
