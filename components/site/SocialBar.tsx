import { InstagramIcon, WhatsAppIcon, whatsAppUrl } from "./SocialIcons";
import type { SiteSettingsContent } from "@/lib/site-content";

// Hər ictimai səhifədə (footer vasitəsilə) və Əlaqə səhifəsində görünən sosial media
// ikonları — linklər bazadan (Baş Admin panelindən) gəlir, kodda sabit yazılmır.
export function SocialBar({ settings, variant = "dark" }: { settings: SiteSettingsContent; variant?: "dark" | "light" }) {
  const links = [
    settings.instagram_url ? { icon: InstagramIcon, label: "Instagram", href: settings.instagram_url } : null,
    settings.whatsapp ? { icon: WhatsAppIcon, label: "WhatsApp", href: whatsAppUrl(settings.whatsapp, "Salam! Servio haqqında məlumat almaq istəyirəm.") } : null,
  ].filter(Boolean) as { icon: typeof InstagramIcon; label: string; href: string }[];

  if (!links.length) return null;

  // Brendlərin öz rəngləri ilə — əvvəlki ağ konturlu versiya solğun görünürdü. Instagram üçün
  // rəsmi gradient fon, WhatsApp üçün rəsmi yaşıl fon, ikisi də ağ konturlu işarə ilə.
  const base = "w-10 h-10 rounded-full flex items-center justify-center flex-none text-white transition-transform hover:scale-105";
  const bg: Record<string, string> = {
    Instagram: "bg-[radial-gradient(circle_at_30%_110%,#FFDD55_0%,#FF543E_28%,#C837AB_62%,#5B51D8_100%)]",
    WhatsApp: "bg-[#25D366]",
  };

  return (
      <div className="flex items-center gap-2.5">
        {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} title={l.label} className={`${base} ${bg[l.label]}`}>
              <l.icon size={18} />
            </a>
        ))}
      </div>
  );
}
