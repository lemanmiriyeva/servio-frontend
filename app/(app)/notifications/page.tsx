"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Clock3, Boxes, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

type Warranty = { id: number; customer_name: string; device: string; warranty_days_left: number | null };
type Debt = { id: number; customer_name: string; number: string; due_date: string | null; amount: number };
type Product = { id: number; name: string; quantity_in_stock: number; min_stock_alert: number; is_low_stock: boolean };

type Item = { key: string; icon: React.ReactNode; tone: string; title: string; sub: string; href: string };

export default function NotificationsPage() {
    const [items, setItems] = useState<Item[] | null>(null);

    useEffect(() => {
        Promise.all([
            api.repairWarranties().catch(() => []),
            api.repairDebts().catch(() => []),
            api.products("?page_size=200").catch(() => ({ results: [] })),
        ]).then(([warranties, debts, productsRes]) => {
            const list: Item[] = [];
            const today = new Date();

            (warranties as Warranty[])
                .filter((w) => w.warranty_days_left !== null && w.warranty_days_left >= 0 && w.warranty_days_left <= 3)
                .forEach((w) => list.push({
                    key: `w-${w.id}`, icon: <ShieldAlert size={18} />, tone: "t-amber",
                    title: `Zəmanət bitir — ${w.customer_name}`,
                    sub: `${w.device} · ${w.warranty_days_left} gün qalıb`,
                    href: `/repairs/${w.id}`,
                }));

            (debts as Debt[])
                .filter((d) => d.due_date && new Date(d.due_date) < today)
                .forEach((d) => list.push({
                    key: `d-${d.id}`, icon: <Clock3 size={18} />, tone: "t-red",
                    title: `Gecikmiş borc — ${d.customer_name}`,
                    sub: `${d.number} · ${Math.round(d.amount)} AZN`,
                    href: `/repairs/${d.id}`,
                }));

            const products = Array.isArray(productsRes) ? productsRes : (productsRes as { results?: Product[] }).results ?? [];
            products.filter((p) => p.is_low_stock).forEach((p) => list.push({
                key: `p-${p.id}`, icon: <Boxes size={18} />, tone: "t-purple",
                title: `Anbarda azalır — ${p.name}`,
                sub: `Qalıq: ${p.quantity_in_stock} (minimum: ${p.min_stock_alert})`,
                href: "/inventory",
            }));

            setItems(list);
        });
    }, []);

    return (
        <>
            <div>
                <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Bildirişlər</h1>
                <p className="text-ink2 mt-1">Diqqət tələb edən zəmanət, borc və anbar vəziyyəti.</p>
            </div>

            <div className="card !p-2">
                {(items ?? []).map((it) => (
                    <Link key={it.key} href={it.href} className="tr hover:bg-gray-50/60 cursor-pointer">
                        <div className={`${it.tone} w-10 h-10 rounded-[10px] flex items-center justify-center flex-none`}>{it.icon}</div>
                        <div className="flex-1 min-w-0">
                            <b className="block text-sm truncate">{it.title}</b>
                            <span className="text-xs text-muted truncate block">{it.sub}</span>
                        </div>
                    </Link>
                ))}
                {items && items.length === 0 && (
                    <div className="text-center text-muted text-sm py-12 flex flex-col items-center gap-2">
                        <CheckCircle2 size={28} className="text-green" />
                        Hər şey qaydasındadır — açıq bildiriş yoxdur.
                    </div>
                )}
                {!items && <div className="text-center text-muted text-sm py-12">Yüklənir…</div>}
            </div>
        </>
    );
}