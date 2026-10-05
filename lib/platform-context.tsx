"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, type PlatformResource } from "./api";
import { useAuth } from "./auth-context";

type Ctx = { resources: PlatformResource[] | null; error: string };
const PlatformContext = createContext<Ctx>({ resources: null, error: "" });

/**
 * Platforma bölmələrinin (mağaza, istifadəçi, rol, ...) təsvirini backend-dən bir dəfə yükləyir.
 * İndi `(app)` layoutunun ƏN ÜSTÜNDƏ, bütün istifadəçilər üçün render olunur (Sidebar-ın da "Müştəri
 * bazası" alt-menyusunu çəkə bilməsi üçün) — amma sorğunu YALNIZ Super Admin/mağaza admini üçün
 * göndəririk, əks halda adi işçi üçün bu endpoint 403 qaytarardı (lazımsız sorğu/konsol xətası).
 */
export function PlatformProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [resources, setResources] = useState<PlatformResource[] | null>(null);
    const [error, setError] = useState("");
    const canAccess = !!(user?.is_superadmin || (user?.shop && user?.is_shop_admin));

    useEffect(() => {
        if (!canAccess) return;
        api.platformResources().then(setResources).catch(() => setError("Platforma bölmələri yüklənmədi."));
    }, [canAccess]);

    return <PlatformContext.Provider value={{ resources, error }}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
    return useContext(PlatformContext);
}