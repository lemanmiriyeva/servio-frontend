import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FEATURES } from "@/lib/site-config";

export const DARK_BG = "bg-[#060D24] bg-[radial-gradient(900px_500px_at_75%_10%,rgba(31,107,255,0.28),transparent_60%),radial-gradient(600px_400px_at_0%_100%,rgba(31,107,255,0.12),transparent_60%)]";

export function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className={`${DARK_BG} text-white pt-[140px] pb-16 md:pb-20`}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="text-[13px] font-semibold tracking-[0.12em] text-[#4C8DFF] uppercase">{eyebrow}</div>
        <h1 className="mt-3 text-[34px] md:text-[48px] font-bold leading-tight tracking-tight max-w-[720px]">{title}</h1>
        <p className="mt-4 text-white/70 text-[17px] leading-relaxed max-w-[620px]">{text}</p>
      </div>
    </section>
  );
}

export function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div>
      <div className="text-[13px] font-semibold tracking-[0.12em] text-[#1F6BFF] uppercase">{eyebrow}</div>
      <h2 className="mt-2 text-[30px] md:text-[38px] font-bold tracking-tight">{title}</h2>
      {text && <p className="mt-3 text-[#4B5B7C] text-base md:text-lg max-w-[560px] leading-relaxed">{text}</p>}
    </div>
  );
}

export function FeatureGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((f) => (
        <div key={f.title} className="rounded-2xl bg-white border border-[#E6EBF5] p-6 shadow-[0_8px_30px_rgba(16,40,100,0.06)] hover:shadow-[0_12px_40px_rgba(31,107,255,0.14)] hover:-translate-y-0.5 transition">
          <span className={`w-12 h-12 rounded-xl ${f.tone} text-white flex items-center justify-center`}><f.icon size={24} /></span>
          <h3 className="mt-5 text-[17px] font-semibold">{f.title}</h3>
          <p className="mt-2 text-sm text-[#5B6B8C] leading-relaxed">{f.short}</p>
        </div>
      ))}
    </div>
  );
}

export function CtaBand() {
  return (
    <section className={`${DARK_BG} text-white`}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-16 md:py-20 flex flex-col md:flex-row md:items-center gap-8">
        <div className="flex-1">
          <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight">Servisinizi bu gün daha rahat idarə edin</h2>
          <p className="mt-3 text-white/70 max-w-[520px]">Pulsuz başlayın, komandanızı əlavə edin və bütün işləri bir yerdən izləyin.</p>
        </div>
        <Link href="/elaqe" className="h-[52px] px-8 rounded-full bg-[#1F6BFF] hover:bg-[#3A7DFF] font-semibold inline-flex items-center gap-2 self-start md:self-auto transition-colors">
          Pulsuz başla <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
