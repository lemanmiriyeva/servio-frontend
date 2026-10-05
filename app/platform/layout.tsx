"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PlatformProvider, usePlatform } from "@/lib/platform-context";
import { Loader } from "@/components/Loader";

// DİQQƏT: bu layout əvvəllər ÖZ header/sidebar-ını çəkirdi (ayrı bir "admin shell") — nəticədə
// "Müştəri bazası"na keçəndə bütün sayt dizaynı (sol menyu) dəyişirdi, istifadəçi "başqa proqrama
// düşdüm" kimi qarışıqlıq yaşayırdı. İndi bu səhifələr `(app)` route qrupunun daxilindədir —
// adi `Sidebar`/`Topbar` z.aten yuxarıdan gəlir, bu layout YALNIZ bölmələr arasında keçid üçün
// kiçik, üfüqi bir alt-naviqasiya göstərir (digər səhifələrdəki tab-lara bənzər).
function Shell({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { resources } = usePlatform();
    const pathname = usePathname();
    const isSuperadmin = !!user?.is_superadmin;

    // İki səviyyəli naviqasiya: Bölmə (section, məs. "Müştəri bazası", "Sayt məzmunu") → onun daxilində
    // qruplar (group) → hər qrupun elementləri. `hidden` olan resurslar (bir mağazaya aid, "Ətraflı"
    // səhifəsində tab kimi açılanlar) burada göstərilmir. Mağaza sahibi (owner rolu) üçün heç bir
    // bölmə göstərilmir — onun üçün "Müştəri bazası" elə öz mağazasının tək səhifəsidir.
    const sections: { name: string; groups: { name: string; items: { key: string; label: string }[] }[] }[] = [];
    if (isSuperadmin) {
        (resources ?? []).forEach((r) => {
            if (r.hidden) return;
            let s = sections.find((x) => x.name === r.section);
            if (!s) { s = { name: r.section, groups: [] }; sections.push(s); }
            let g = s.groups.find((x) => x.name === r.group);
            if (!g) { g = { name: r.group, items: [] }; s.groups.push(g); }
            g.items.push({ key: r.key, label: r.label });
        });
    }

    const pillCls = (active: boolean) =>
        `h-[34px] px-3 rounded-full border text-sm font-medium whitespace-nowrap ${active ? "bg-side border-side text-white" : "bg-white border-line text-ink2 hover:bg-gray-50"}`;

    return (
        <>
            {isSuperadmin && sections.length > 0 && (
                <div className="flex flex-col gap-2 -mb-1">
                    <Link href="/platform" className={pillCls(pathname === "/platform") + " self-start"}>Ümumi baxış</Link>
                    {sections.map((s) => (
                        <div key={s.name} className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted w-[110px] flex-none">{s.name}</span>
                            {s.groups.flatMap((g) => g.items).map((it) => (
                                <Link key={it.key} href={`/platform/${it.key}`} className={pillCls(pathname === `/platform/${it.key}`)}>
                                    {it.label}
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>
            )}
            {children}
        </>
    );
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    // Platform Super Admin — hər yerə. Mağaza admini (`is_shop_admin=True`, Rol sistemindən
    // tamam ayrı bir bayraq) — "Müştəri bazası"na daxil ola bilər, amma yalnız öz mağazasını
    // görür (bax: `/platform/page.tsx`-dəki mağaza admini budağı).
    const isShopOwner = !!(user?.shop && user?.is_shop_admin);
    const allowed = !!user?.is_superadmin || isShopOwner;

    useEffect(() => {
        if (loading) return;
        if (!user) router.replace("/login");
        else if (!user.is_superadmin && !isShopOwner) router.replace("/dashboard");
    }, [loading, user, isShopOwner, router]);

    if (loading || !allowed) {
        return <Loader fullScreen size={44} />;
    }
    return (
        <PlatformProvider>
            <Shell>{children}</Shell>
        </PlatformProvider>
    );
}