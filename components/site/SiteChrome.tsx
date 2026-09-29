import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

// Adi (mötərizəsiz) qovluq strukturu ilə işləmək üçün paylaşılan header/footer bükücüsü.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white text-[#041326] flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
