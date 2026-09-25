"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Truck } from "lucide-react";
import { api } from "@/lib/api";

type CustomerDebt = {
    id: number; number: string; customer_name: string; customer_initials: string;
    reason: string; debt_date: string; due_date: string | null; amount: number;
};
type Supplier = { id: number; name: string; total_debt: number };

function fmt(n: number) {
    return new Intl.NumberFormat("az-AZ").format(Math.round(n));
}

export default function DebtsPage() {
    const [customerDebts, setCustomerDebts] = useState<CustomerDebt[] | null>(null);
    const [supplierDebts, setSupplierDebts] = useState<Supplier[] | null>(null);
    const [tab, setTab] = useState<"customer" | "supplier">("customer");
    const [error, setError] = useState("");

    useEffect(() => {
        api.repairDebts().then((d) => setCustomerDebts(d as CustomerDebt[])).catch(() => setError("Borclar yüklənmədi."));
        api.suppliers().then((d) => {
            const data = d as { results?: Supplier[] } | Supplier[];
            const list = Array.isArray(data) ? data : data.results ?? [];
            setSupplierDebts(list.filter((s) => s.total_debt > 0));
        }).catch(() => {});
    }, []);

    const customerTotal = (customerDebts ?? []).reduce((s, d) => s + Number(d.amount), 0);
    const supplierTotal = (supplierDebts ?? []).reduce((s, d) => s + Number(d.total_debt), 0);

    const isOverdue = (due: string | null) => due && new Date(due) < new Date();

    return (
        <>
            <div>
                <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Borclar</h1>
                <p className="text-ink2 mt-1">Müştərilərdən alınacaq və təchizatçılara ödəniləcək məbləğlər.</p>
            </div>

            {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

            <div className="grid grid-cols-2 gap-4 max-w-xl">
                <div className="card">
                    <span className="text-ink2 text-[13px] font-medium">Müştərilərdən alınacaq</span>
                    <div className="text-[28px] font-semibold tracking-tight mt-1.5 amb">{fmt(customerTotal)} <small className="text-sm text-muted">AZN</small></div>
                </div>
                <div className="card">
                    <span className="text-ink2 text-[13px] font-medium">Təchizatçılara ödəniləcək</span>
                    <div className="text-[28px] font-semibold tracking-tight mt-1.5" style={{ color: "var(--purple)" }}>{fmt(supplierTotal)} <small className="text-sm text-muted">AZN</small></div>
                </div>
            </div>

            <div className="flex gap-2">
                <button onClick={() => setTab("customer")} className={`h-[38px] px-3.5 rounded-full border font-semibold text-sm inline-flex items-center gap-2 ${tab === "customer" ? "bg-side border-side text-white" : "bg-white border-line text-ink2"}`}>
                    <CreditCard size={16} />Müştəri borcları ({customerDebts?.length ?? 0})
                </button>
                <button onClick={() => setTab("supplier")} className={`h-[38px] px-3.5 rounded-full border font-semibold text-sm inline-flex items-center gap-2 ${tab === "supplier" ? "bg-side border-side text-white" : "bg-white border-line text-ink2"}`}>
                    <Truck size={16} />Təchizatçı borcları ({supplierDebts?.length ?? 0})
                </button>
            </div>

            {tab === "customer" ? (
                <div className="card !p-2">
                    <div className="overflow-x-auto">
                        <div className="min-w-[600px]">
                            <div className="tr h">
                                <div className="flex-1">Müştəri</div>
                                <div className="flex-[1.2]">Səbəb</div>
                                <div className="flex-none w-[110px]">Son tarix</div>
                                <div className="flex-none w-[90px] text-right">Məbləğ</div>
                            </div>
                            {(customerDebts ?? []).map((d) => (
                                <Link key={d.id} href={`/repairs/${d.id}`} className="tr hover:bg-gray-50/60 cursor-pointer">
                                    <div className="flex-1 flex items-center gap-2.5 font-semibold min-w-0">
                                        <div className="av a2">{d.customer_initials}</div>
                                        <span className="truncate">{d.customer_name}</span>
                                    </div>
                                    <div className="flex-[1.2] min-w-0">
                                        <span className="truncate block">{d.reason}</span>
                                        <span className="mono text-xs text-muted">{d.number}</span>
                                    </div>
                                    <div className="flex-none w-[110px]">
                                        {d.due_date ? (
                                            <span className={isOverdue(d.due_date) ? "neg font-semibold" : "text-ink2"}>{d.due_date}</span>
                                        ) : <span className="mut">—</span>}
                                    </div>
                                    <div className="flex-none w-[90px] text-right font-semibold amb">{fmt(d.amount)}</div>
                                </Link>
                            ))}
                            {customerDebts && customerDebts.length === 0 && (
                                <div className="text-center text-muted text-sm py-10">Açıq müştəri borcu yoxdur. 🎉</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card !p-2">
                    <div className="overflow-x-auto">
                        <div className="min-w-[400px]">
                            <div className="tr h"><div className="flex-1">Təchizatçı</div><div className="flex-none w-[110px] text-right">Borc</div></div>
                            {(supplierDebts ?? []).map((s) => (
                                <Link key={s.id} href="/suppliers" className="tr hover:bg-gray-50/60 cursor-pointer">
                                    <div className="flex-1 flex items-center gap-2.5 font-semibold">
                                        <div className="t-purple w-9 h-9 rounded-[9px] flex items-center justify-center"><Truck size={16} /></div>
                                        {s.name}
                                    </div>
                                    <div className="flex-none w-[110px] text-right font-semibold" style={{ color: "var(--purple)" }}>{fmt(s.total_debt)}</div>
                                </Link>
                            ))}
                            {supplierDebts && supplierDebts.length === 0 && (
                                <div className="text-center text-muted text-sm py-10">Açıq təchizatçı borcu yoxdur. 🎉</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}