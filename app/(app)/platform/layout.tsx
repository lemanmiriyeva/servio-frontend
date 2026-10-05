"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader } from "@/components/Loader";

// DİQQƏT: naviqasiya (bölmə/qrup ağacı) artıq burada DEYİL — `components/Sidebar.tsx`-in özü
// "/platform" altındayıqsa bu ağacı birbaşa sol sidebar-da göstərir (əvvəllər bura öz ayrı
// header/sidebar-ını, sonra isə səhifənin yuxarısında üfüqi bir tab zolağını çəkirdi — istifadəçi
// dizaynın "sındığını" düşünürdü). Bu layout YALNIZ giriş icazəsini yoxlayır.
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
    return <>{children}</>;
}