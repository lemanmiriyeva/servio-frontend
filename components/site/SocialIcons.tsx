// lucide-react brend loqoları saxlamır (Instagram/WhatsApp) — ona görə `react-icons`-un Font
// Awesome 6 dəstindən rəsmi, dəqiq çəkilmiş brend işarələrini istifadə edirik (əl ilə çəkilmiş
// SVG-lər bir az "əyri/natamam" görünürdü — müştəri bunu "pis görünür" kimi qeyd etdi).
import { FaInstagram, FaWhatsapp } from "react-icons/fa6";

export function InstagramIcon({ size = 20 }: { size?: number }) {
  return <FaInstagram size={size} />;
}

export function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return <FaWhatsapp size={size} />;
}

export function whatsAppUrl(whatsapp: string, text?: string) {
  const digits = (whatsapp || "").replace(/[^\d]/g, "");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}
