import { SiteChrome } from "@/components/site/SiteChrome";
import { ContactForm } from "@/components/site/ContactForm";
import { getSiteContent } from "@/lib/site-content";

export const metadata = { title: "Əlaqə — Servio" };

export default async function ContactPage() {
  const { settings } = await getSiteContent();
  return (
    <SiteChrome>
      <ContactForm settings={settings} />
    </SiteChrome>
  );
}
