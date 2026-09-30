import { SiteChrome } from "@/components/site/SiteChrome";
import Link from "next/link";
import { Play, Smile, ShieldCheck, MonitorSmartphone } from "lucide-react";
import { HeroMock } from "@/components/site/HeroMock";
import { CtaBand, DARK_BG, FeatureGrid, SectionTitle } from "@/components/site/Sections";
import { getSiteContent } from "@/lib/site-content";

export default async function HomePage() {
  const { settings, home_steps, features } = await getSiteContent();

  return (
    <SiteChrome>
      <section className={`${DARK_BG} text-white pt-[120px] md:pt-[140px] pb-16 md:pb-24 overflow-hidden`}>
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 grid lg:grid-cols-[1fr_1.05fr] gap-12 items-center">
          <div>
            <h1 className="text-[40px] md:text-[56px] font-bold leading-[1.1] tracking-tight">
              {settings.hero_title}
            </h1>
            <p className="mt-6 text-white/75 text-[17px] leading-relaxed max-w-[500px]">
              {settings.hero_subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/elaqe" className="h-[54px] px-9 rounded-full bg-[#116CFB] hover:bg-[#3A85FF] font-semibold inline-flex items-center transition-colors">Pulsuz başla</Link>
              <Link href="/funksiyalar" className="h-[54px] px-7 rounded-full border border-[#116CFB]/60 hover:bg-white/10 font-semibold inline-flex items-center gap-2.5 transition-colors">
                <span className="w-7 h-7 rounded-full border border-white/50 flex items-center justify-center"><Play size={12} fill="white" /></span>Sistemi izlə
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-[13px] text-white/70">
              <span className="inline-flex items-center gap-2"><Smile size={16} />Asan istifadə</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck size={16} />Təhlükəsiz</span>
              <span className="inline-flex items-center gap-2"><MonitorSmartphone size={16} />Hər yerdən giriş</span>
            </div>
          </div>
          <HeroMock />
        </div>
      </section>

      <section className="bg-[#F2F7FF] py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <SectionTitle eyebrow="Funksiyalar" title="Bütün proseslər bir yerdə" text="Servio ilə servis biznesinizi tam idarə edin. Vaxtınıza qənaət edin, qazancınızı artırın." />
          <div className="mt-10"><FeatureGrid features={features} /></div>
          <div className="mt-8"><Link href="/funksiyalar" className="text-[#116CFB] font-semibold hover:underline">Bütün funksiyalara bax →</Link></div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <SectionTitle eyebrow="Necə işləyir" title="Bir neçə kliklə tam proses" />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {home_steps.map((s) => (
              <div key={s.id} className="rounded-2xl border border-[#DCE8FF] p-7">
                <span className="w-10 h-10 rounded-full bg-[#116CFB] text-white font-bold flex items-center justify-center">{s.number}</span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-[#3E4C6B] text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </SiteChrome>
  );
}
