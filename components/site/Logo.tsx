import Image from "next/image";
import logoMark from "@/public/logo-mark.png";
import logoFull from "@/public/logo-full.png";
import logoFullWhite from "@/public/logo-full-white.png";

// Kiçik ikon (favicon, kompakt yerlər) — mötərizəsiz, kvadrat "S" işarəsi.
export function LogoMark({ size = 36 }: { size?: number }) {
  return <Image src={logoMark} alt="Servio.az" width={size} height={size} style={{ width: size, height: "auto" }} priority />;
}

// Tam lockup (işarə + "Servio.az" yazısı). `dark` = açıq fonda görünəcəksə true.
// `src` verilibsə (Baş Admin panelindən yüklənmiş loqo), o istifadə olunur; əks halda statik loqo.
export function Logo({ dark = false, height = 54, src, alt = "Servio.az" }: { dark?: boolean; height?: number; src?: string | null; alt?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- xarici (backend media) mənbə, next/image üçün domain konfiqurasiyası lazımdır
    return <img src={src} alt={alt} style={{ height, width: "auto" }} />;
  }
  const fallback = dark ? logoFull : logoFullWhite;
  return <Image src={fallback} alt={alt} height={height} style={{ height, width: "auto" }} priority />;
}
