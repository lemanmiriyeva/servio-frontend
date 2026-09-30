import { SiteChrome } from "@/components/site/SiteChrome";
import { Check } from "lucide-react";
import { CtaBand, PageHero } from "@/components/site/Sections";
import { getIcon } from "@/lib/icon-map";
import { getSiteContent } from "@/lib/site-content";

export const metadata = { title: "Funksiyalar — Servio" };

export default async function FeaturesPage() {
  const { features } = await getSiteContent();

  return (
    <SiteChrome>
      <PageHero eyebrow="Funksiyalar" title="Servisin gündəlik işi üçün lazım olan hər şey" text="Müştəridən hesabata qədər bütün proseslər bir sistemdə, sadə və sürətli." />
      <section className="py-14 md:py-20">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 grid gap-6 md:grid-cols-2">
          {features.map((f) => {
            const Icon = getIcon(f.icon);
            const tone = f.tone === "dark" ? "bg-[#041326]" : "bg-[#116CFB]";
            return (
              <div key={f.id} className="rounded-2xl border border-[#DCE8FF] p-7 bg-white shadow-[0_8px_30px_rgba(16,40,100,0.05)]">
                <div className="flex items-center gap-4">
                  <span className={`w-12 h-12 rounded-xl ${tone} text-white flex items-center justify-center`}><Icon size={24} /></span>
                  <div><h2 className="text-xl font-semibold">{f.title}</h2><p className="text-sm text-[#3E4C6B] mt-0.5">{f.short_description}</p></div>
                </div>
                <ul className="mt-5 flex flex-col gap-3">
                  {f.points.map((p) => (
                    <li key={p} className="flex gap-3 text-[15px] text-[#041326]"><Check size={18} className="text-[#041326] flex-none mt-0.5" />{p}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
      <CtaBand />
    </SiteChrome>
  );
}
