"use client";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

/**
 * Bu qovluğun (daxil olunmuş panelin) HƏR SƏHİFƏSİNDƏ gözlənilməz bir JS xətası (məs. gözlənilən
 * sahə backend-dən gəlməyib, şəbəkə kəsilib, s.) baş versə, Next.js əvvəllər bunu HEÇ YERDƏ
 * tutmurdu — nəticədə bütün React ağacı "crash" edirdi və istifadəçi ağ/boş bir ekranla
 * ("səhifə açılmır") qalırdı, Sidebar/Topbar da yoxa çıxırdı. İndi bu sərhəd (error boundary)
 * xətanı tutur, panel (Sidebar/Topbar) görünməyə davam edir, və istifadəçiyə "Yenidən cəhd et"
 * düyməsi göstərilir — bir dəfə kliklə həmin səhifə təzədən render olunmaya cəhd edir.
 */
export default function AppSegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error("Səhifə xətası:", error);
    }, [error]);

    return (
        <div className="card flex flex-col items-center justify-center gap-4 py-14 text-center">
            <div className="text-lg font-semibold">Bu səhifə yüklənərkən xəta baş verdi</div>
            <p className="text-ink2 text-sm max-w-md">
                Bəzən bu, müvəqqəti şəbəkə kəsilməsi və ya serverdən gecikmiş cavab səbəbindən olur.
                Aşağıdaki düymə ilə yenidən cəhd edin — davam etsə, səhifəni tam yeniləyin.
            </p>
            <button className="btn pri" onClick={() => reset()}>
                <RotateCcw size={16} /><span>Yenidən cəhd et</span>
            </button>
        </div>
    );
}
