"use client";
import { LogoMark } from "@/components/site/Logo";

/**
 * Markaya uyğun yüklənmə indikatoru — brauzerin standart "spinner"i və ya çılpaq
 * "Yüklənir…" mətni əvəzinə hər yerdə eyni görünüşlü: loqo (açar-açar "S") ortada,
 * ətrafında fırlanan nazik həlqə. `fullScreen` tam səhifə girişlərində (auth gate),
 * əks halda siyahı/kart daxilində kiçik yüklənmə yeri üçün istifadə olunur.
 */
export function Loader({
                           size = 36, label = "Yüklənir…", fullScreen = false, className = "",
                       }: {
    size?: number;
    label?: string | null;
    fullScreen?: boolean;
    className?: string;
}) {
    const ring = Math.round(size * 1.9);
    const content = (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <div className="relative flex items-center justify-center" style={{ width: ring, height: ring }}>
                <div
                    className="absolute inset-0 rounded-full border-[3px] border-line border-t-brand animate-spin"
                    style={{ animationDuration: "0.9s" }}
                />
                <LogoMark size={size} />
            </div>
            {label && <span className="text-sm text-muted">{label}</span>}
        </div>
    );

    if (fullScreen) {
        return <div className="min-h-screen flex items-center justify-center bg-bg">{content}</div>;
    }
    return <div className="flex items-center justify-center py-10">{content}</div>;
}