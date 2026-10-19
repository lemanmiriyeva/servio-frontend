import { WhatsAppIcon, whatsAppUrl } from "./SocialIcons";

// Bütün ictimai (marketinq) səhifələrində sağ-alt küncdə üzən WhatsApp düyməsi.
// Nömrə Baş Admin panelindəki "Əlaqə məlumatları" bölməsindən gəlir — orda dəyişəndə
// bu düymənin linki də avtomatik yenilənir (ayrıca kod dəyişikliyi lazım deyil).
export function WhatsAppButton({ whatsapp }: { whatsapp: string }) {
  if (!whatsapp) return null;
  return (
      <a
          href={whatsAppUrl(whatsapp, "Salam! Servio haqqında məlumat almaq istəyirəm.")}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp ilə yazın"
          title="WhatsApp ilə yazın"
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] text-white
                     flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.25)]
                     hover:scale-105 hover:bg-[#20BD5A] active:scale-95 transition-all"
      >
        <WhatsAppIcon size={28} />
      </a>
  );
}
