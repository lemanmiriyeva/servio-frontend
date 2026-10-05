"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { usePlatform } from "@/lib/platform-context";
import { RecordForm, useRelatedOptions } from "../../[resource]/page";
import { ShopTabs } from "../../ShopTabs";
import type { PlatformResource } from "@/lib/api";
import { Loader } from "@/components/Loader";

type ShopRow = Record<string, unknown> & {
    id: string | number; name: string; code: string; owner_full_name?: string;
    city?: string; status?: string; next_payment_at?: string | null;
    plan_display?: string; days_to_payment?: number | null;
};

const STATUS_LABEL: Record<string, string> = {
    active: "Aktiv", trial: "Sınaq", overdue: "Ödəniş gecikib", blocked: "Bloklanıb",
};
const STATUS_BADGE: Record<string, string> = {
    active: "b-green", trial: "b-amber", overdue: "b-red", blocked: "b-gray",
};

export default function ShopDetailPage() {
    const params = useParams<{ id: string }>();
    const shopId = params.id;
    const { resources } = usePlatform();
    const [shop, setShop] = useState<ShopRow | null>(null);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);

    const shopsRes = useMemo(() => resources?.find((r) => r.key === "shops") ?? null, [resources]);

    function load() {
        api.platformGet("shops", shopId)
            .then((d) => setShop(d as ShopRow))
            .catch(() => setError("Mağaza tapılmadı."));
    }
    useEffect(load, [shopId]);

    if (error) return <div className="card" style={{ color: "var(--red)" }}>{error}</div>;
    if (!shop || !resources) return <Loader />;

    return (
        <>
            <div className="flex items-center gap-2 text-sm">
                <Link href="/platform" className="flex items-center gap-1.5 text-ink2 hover:text-ink"><ArrowLeft size={16} />Müştəri bazası</Link>
            </div>

            <div className="card flex items-center justify-between flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-[24px] md:text-[26px] font-semibold tracking-tight">{shop.name}</h1>
                        {shop.status && (
                            <span className={`badge ${STATUS_BADGE[String(shop.status)] ?? "b-gray"}`}>
                                <i />{STATUS_LABEL[String(shop.status)] ?? String(shop.status)}
                            </span>
                        )}
                    </div>
                    <p className="text-ink2 mt-1 text-sm">
                        {shop.code ? `Kod: ${shop.code}` : ""}{shop.owner_full_name ? ` · Sahib: ${shop.owner_full_name}` : ""}
                        {shop.city ? ` · ${shop.city}` : ""}{shop.plan_display ? ` · Plan: ${shop.plan_display}` : ""}
                        {shop.next_payment_at && (
                            <>
                                {` · Növbəti ödəniş: ${shop.next_payment_at}`}
                                {typeof shop.days_to_payment === "number" && (
                                    <b className={shop.days_to_payment < 0 ? "neg ml-1" : "ml-1"}>
                                        ({shop.days_to_payment >= 0 ? `${shop.days_to_payment} gün qalıb` : `${Math.abs(shop.days_to_payment)} gün gecikib`})
                                    </b>
                                )}
                            </>
                        )}
                    </p>
                </div>
                <button className="btn" onClick={() => setEditing(true)}><Pencil size={16} /><span>Mağazanı redaktə et</span></button>
            </div>

            <ShopTabs shopId={shopId} />

            {editing && shopsRes && (
                <ShopEditForm res={shopsRes} row={shop} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />
            )}
        </>
    );
}

function ShopEditForm({ res, row, onClose, onSaved }: {
    res: PlatformResource; row: ShopRow; onClose: () => void; onSaved: () => void;
}) {
    const options = useRelatedOptions(res);
    return <RecordForm res={res} row={row} options={options} onClose={onClose} onSaved={onSaved} />;
}