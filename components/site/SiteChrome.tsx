import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { getSiteContent } from "@/lib/site-content";

// Adi (mötərizəsiz) qovluq strukturu ilə işləmək üçün paylaşılan header/footer bükücüsü.
// Header/footer-dəki loqo və əlaqə məlumatları bazadan (Baş Admin panelindən) gəlir.
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const { settings } = await getSiteContent();
  return (
    <div className="relative min-h-screen bg-white text-[#041326] flex flex-col">
      <SiteHeader settings={settings} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
