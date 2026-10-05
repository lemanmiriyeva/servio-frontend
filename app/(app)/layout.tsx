"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PlatformProvider } from "@/lib/platform-context";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Loader } from "@/components/Loader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    // Mağazaya bağlı OLMAYAN Baş Admin (saf Platform Super Admin, heç bir mağazanın işçisi deyil)
    // üçün "İdarəetmə paneli" (adi mağaza dashboard-u) mənasızdır — onun göstəriləcək mağaza
    // məlumatı yoxdur. Ona görə bu istifadəçi YALNIZ "Müştəri bazası" (/platform) bölməsini aça bilir;
    // başqa hər hansı adi səhifəyə getməyə çalışsa, avtomatik /platform-a yönləndirilir.
    const pureSuperadmin = !!user && user.is_superadmin && !user.shop;

    useEffect(() => {
        if (loading) return;
        if (!user) { router.replace("/login"); return; }
        if (pureSuperadmin && !pathname.startsWith("/platform")) router.replace("/platform");
    }, [loading, user, pureSuperadmin, pathname, router]);

    if (loading || !user || (pureSuperadmin && !pathname.startsWith("/platform"))) {
        return <Loader fullScreen size={44} />;
    }

    return (
        <PlatformProvider>
            <div className="min-h-screen flex bg-bg">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <Topbar />
                    <main className="flex-1 px-6 md:px-8 py-7 flex flex-col gap-5">{children}</main>
                </div>
            </div>
        </PlatformProvider>
    );
}