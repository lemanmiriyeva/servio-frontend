"use client";

/**
 * Son sığorta: əgər xəta kök layout-un özündə (və ya hər hansı digər error.tsx-in TUTMADIĞI
 * bir yerdə) baş verərsə, bura düşür. `app/(app)/error.tsx` adi panel səhifələrini artıq
 * tutur — bu fayl yalnız o səviyyədən də yuxarıda qalan, həqiqətən gözlənilməz hallar üçündür.
 * `global-error` Next.js-də öz <html>/<body>-ni yazmalıdır, kök layout-u əhatə edə bilməz.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html lang="az">
        <body style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>Xəta baş verdi</h1>
            <p style={{ color: "#667", marginBottom: 18, fontSize: 14 }}>
                Səhifə yüklənərkən gözlənilməz xəta oldu. Zəhmət olmasa yenidən cəhd edin.
            </p>
            <button
                onClick={() => reset()}
                style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, cursor: "pointer" }}
            >
                Yenidən cəhd et
            </button>
        </div>
        </body>
        </html>
    );
}
