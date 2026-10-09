import { SiteChrome } from "@/components/site/SiteChrome";
import { CtaBand, PageHero, SectionTitle } from "@/components/site/Sections";
import { getIcon } from "@/lib/icon-map";
import { getSiteContent } from "@/lib/site-content";

export const metadata = { title: "Haqqımızda — Servio" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
    const { about_values } = await getSiteContent();

    return (
        <SiteChrome>
            <PageHero eyebrow="Haqqımızda" title="Servis ustaları üçün hazırlanıb" text="Servio telefon və kompüter təmiri ilə məşğul olan ustaların və servis mərkəzlərinin bütün iş proseslərini bir yerdə idarə etməsi üçün yaradılıb." />
            <section className="py-14 md:py-20">
                <div className="max-w-[1200px] mx-auto px-5 md:px-8">
                    <SectionTitle eyebrow="Yanaşmamız" title="Real işə yönəlmiş sistem" text="Ustalar malları topdan alır, ay sonunda hesablaşır, bəzən heç detal işlətmədən plata təmiri edir. Servio bu real iş axınına uyğunlaşdırılıb." />
                    <div className="mt-10 grid gap-5 md:grid-cols-3">
                        {about_values.map((v) => {
                            const Icon = getIcon(v.icon);
                            return (
                                <div key={v.id} className="rounded-2xl border border-[#DCE8FF] p-7">
                                    <span className="w-12 h-12 rounded-xl bg-[#116CFB] text-white flex items-center justify-center"><Icon size={24} /></span>
                                    <h3 className="mt-5 text-lg font-semibold">{v.title}</h3>
                                    <p className="mt-2 text-sm text-[#3E4C6B] leading-relaxed">{v.text}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
            <CtaBand />
        </SiteChrome>
    );
}