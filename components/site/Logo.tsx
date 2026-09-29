import Image from "next/image";
import logoMark from "@/public/logo-mark.png";
import logoFull from "@/public/logo-full.png";
import logoFullWhite from "@/public/logo-full-white.png";

// Kiçik ikon (favicon, kompakt yerlər) — mötərizəsiz, kvadrat "S" işarəsi.
export function LogoMark({ size = 36 }: { size?: number }) {
  return <Image src={logoMark} alt="Servio.az" width={size} height={size} style={{ width: size, height: "auto" }} priority />;
}

// Tam lockup (işarə + "Servio.az" yazısı). `dark` = açıq fonda görünəcəksə true.
export function Logo({ dark = false, height = 54 }: { dark?: boolean; height?: number }) {
  const src = dark ? logoFull : logoFullWhite;
  return <Image src={src} alt="Servio.az" height={height} style={{ height, width: "auto" }} priority />;
}
