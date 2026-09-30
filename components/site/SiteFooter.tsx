import Link from "next/link";
import { Logo } from "./Logo";
import { NAV } from "@/lib/site-config";
import type { SiteSettingsContent } from "@/lib/site-content";

export function SiteFooter({ settings }: { settings: SiteSettingsContent }) {
  return (
    <footer className="bg-[#041326] text-white/70">
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo src={settings.logo} alt={settings.brand_name} />
          <p className="mt-4 text-sm leading-relaxed max-w-[340px]">
            {settings.tagline || "Telefon və kompüter servis bizneslərini müştəridən hesabata qədər bir platformada idarə edin."}
          </p>
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
            <li><a href={`mailto:${settings.email}`} className="hover:text-white">{settings.email}</a></li>
            <li><a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-white">{settings.phone}</a></li>
            <li>{settings.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/45">
        © {new Date().getFullYear()} {settings.brand_name}. {settings.footer_note || "Bütün hüquqlar qorunur."}
      </div>
    </footer>
  );
}
