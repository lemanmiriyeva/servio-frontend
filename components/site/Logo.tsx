export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#1F6BFF" />
      <path d="M26 12.5c-1.6-1.2-3.6-1.8-6-1.8-3.8 0-6.4 1.7-6.4 4.6 0 6.2 11.6 3.2 11.6 7.6 0 1.4-1.3 2.2-3.4 2.2-2 0-3.9-.7-5.5-2.1" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M14 28c1.6 1.2 3.6 1.8 6 1.8" stroke="#8DB7FF" strokeWidth="3.2" strokeLinecap="round" opacity=".0" />
    </svg>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className={`text-[22px] font-bold tracking-[0.06em] ${dark ? "text-[#0B1B3F]" : "text-white"}`}>SERVIO</span>
    </span>
  );
}
