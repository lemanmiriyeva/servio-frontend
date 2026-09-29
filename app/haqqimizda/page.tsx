import { SiteChrome } from "@/components/site/SiteChrome";
import { Gauge, Lock, Puzzle } from "lucide-react";
import { CtaBand, PageHero, SectionTitle } from "@/components/site/Sections";

export const metadata = { title: "Haqqımızda — Servio" };

const VALUES = [
  { icon: Gauge, title: "Sadəlik", text: "Məqsəd mühasibat proqramı kimi mürəkkəb sistem yox, ustanın gündəlik işini sürətləndirən rahat alətdir. Müştəridən çapa qədər proses bir neçə klikdir." },
  { icon: Lock, title: "Məlumat təhlükəsizliyi", text: "Hər servis yalnız öz məlumatını görür. Müştəri, gəlir, xərc, təchizatçı və təmir məlumatları başqa servisə heç vaxt görünmür." },
  { icon: Puzzle, title: "Böyüməyə açıq", text: "Sistem modul əsaslıdır: filial, işçi rolları, anbar və yeni imkanlar biznesiniz böyüdükcə əlavə olunur." },
];

export default function AboutPage() {
  return (
    <SiteChrome>
      <PageHero eyebrow="Haqqımızda" title="Servis ustaları üçün hazırlanıb" text="Servio telefon və kompüter təmiri ilə məşğul olan ustaların və servis mərkəzlərinin bütün iş proseslərini bir yerdə idarə etməsi üçün yaradılıb." />
      <section className="py-14 md:py-20">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <SectionTitle eyebrow="Yanaşmamız" title="Real işə yönəlmiş sistem" text="Ustalar malları topdan alır, ay sonunda hesablaşır, bəzən heç detal işlətmədən plata təmiri edir. Servio bu real iş axınına uyğunlaşdırılıb." />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-[#DCE8FF] p-7">
                <span className="w-12 h-12 rounded-xl bg-[#116CFB] text-white flex items-center justify-center"><v.icon size={24} /></span>
                <h3 className="mt-5 text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-[#3E4C6B] leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </SiteChrome>
  );
}
