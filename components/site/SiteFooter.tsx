import Link from "next/link";
import { Logo } from "./Logo";
import { NAV, SITE } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="bg-[#041326] text-white/70">
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 text-sm leading-relaxed max-w-[340px]">Telefon və kompüter servis bizneslərini müştəridən hesabata qədər bir platformada idarə edin.</p>
        </div>
        <div>
          <b className="text-white text-sm">Səhifələr</b>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            {NAV.map((n) => <li key={n.href}><Link href={n.href} className="hover:text-white">{n.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <b className="text-white text-sm">Əlaqə</b>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            <li><a href={`mailto:${SITE.email}`} className="hover:text-white">{SITE.email}</a></li>
            <li><a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="hover:text-white">{SITE.phone}</a></li>
            <li>{SITE.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/45">© {new Date().getFullYear()} {SITE.name}. Bütün hüquqlar qorunur.</div>
    </footer>
  );
}
