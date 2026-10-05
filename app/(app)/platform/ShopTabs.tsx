"use client";
import { useMemo, useState } from "react";
import { usePlatform } from "@/lib/platform-context";
import { ResourceView } from "./[resource]/page";
import { Loader } from "@/components/Loader";

// Bir mağazanın "Ətraflı" səhifəsində tab kimi açılan bölmələr — backend `SHOP_DETAIL_TABS`
// (platform_admin/resources.py) ilə eyni açarlarla. Platform Super Admin bunu istənilən mağaza
// üçün görür (`/platform/shops/[id]`); mağaza SAHİBİ (owner rolu) öz mağazası üçün birbaşa
// `/platform` səhifəsində görür (`?shop=<öz mağazası>` serverdə məcburi tətbiq olunur).
export const SHOP_TABS: { key: string; label: string }[] = [
    { key: "customers", label: "Müştərilər" },
    { key: "repairs", label: "Təmir sifarişləri" },
    { key: "products", label: "Anbar" },
    { key: "stock-movements", label: "Anbar hərəkətləri" },
    { key: "suppliers", label: "Təchizatçılar" },
    { key: "supplier-purchases", label: "Təchizatçı alışları" },
    { key: "cash-transactions", label: "Kassa" },
    { key: "cash-opening-balances", label: "Kassa açılış qalığı" },
    { key: "branches", label: "Filiallar" },
    { key: "users", label: "İstifadəçilər" },
    { key: "roles", label: "Rollar" },
];

export function ShopTabs({ shopId }: { shopId: string | number }) {
    const { resources, error } = usePlatform();
    const [tab, setTab] = useState(SHOP_TABS[0].key);
    const activeRes = useMemo(() => resources?.find((r) => r.key === tab) ?? null, [resources, tab]);
    // Yalnız backend-in bu hesaba icazə verdiyi bölmələri göstər (mağaza sahibi üçün "users"/"roles"
    // də daxildir, platforma admini üçün hamısı gəlir).
    const availableTabs = useMemo(() => SHOP_TABS.filter((t) => resources?.some((r) => r.key === t.key)), [resources]);

    if (error) return <div className="card" style={{ color: "var(--red)" }}>{error}</div>;
    if (!resources) return <Loader />;

    return (
        <>
            <div className="flex gap-2 flex-wrap">
                {availableTabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`h-[38px] px-3.5 rounded-full border font-semibold text-sm ${tab === t.key ? "bg-side border-side text-white" : "bg-white border-line text-ink2"}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {activeRes ? (
                <ResourceView
                    key={`${shopId}-${tab}`}
                    res={activeRes}
                    fixedFilters={{ shop: shopId }}
                    hiddenColumns={["shop"]}
                />
            ) : (
                <div className="card text-center text-muted text-sm py-10">Bu bölmə tapılmadı.</div>
            )}
        </>
    );
}