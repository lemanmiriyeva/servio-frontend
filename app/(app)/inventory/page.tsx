"use client";
import { useEffect, useState } from "react";
import {
    Plus, X, Search, Boxes, Store, ArrowRightLeft, AlertTriangle,
    Check, Ban, Truck, PackageCheck, CircleDollarSign, Info,
    ArrowDownToLine, ArrowUpFromLine,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Modal } from "@/components/Modal";
import { Pagination, paginate } from "@/components/Pagination";

type Product = {
    id: number; name: string; brand: string; category: string; sku: string;
    quantity_in_stock: number; min_stock_alert: number; is_low_stock: boolean;
    unit_cost: number; unit_sale_price: number; is_used: boolean;
    is_shared_to_marketplace: boolean; marketplace_price: number | null;
};
type MarketProduct = {
    id: number; name: string; brand: string; category: string; is_used: boolean;
    quantity_in_stock: number; price: number; shop_id: string; shop_name: string; shop_city: string;
};
type MarketOrder = {
    id: number; buyer_shop: string; buyer_shop_name: string; seller_shop: string; seller_shop_name: string;
    product: number; product_name: string; quantity: number; unit_price: number; total_price: number;
    status: string; created_at: string;
};

const TABS = [
    { key: "stock", label: "Mənim anbarım", icon: Boxes },
    { key: "market", label: "Marketplace axtar", icon: Store },
    { key: "orders", label: "Sifarişlər", icon: ArrowRightLeft },
] as const;

const ORDER_STATUS: Record<string, { label: string; badge: string }> = {
    pending: { label: "Gözləyir", badge: "b-amber" },
    accepted: { label: "Qəbul edildi", badge: "b-blue" },
    rejected: { label: "Rədd edildi", badge: "b-red" },
    paid: { label: "Ödənilib", badge: "b-cyan" },
    shipped: { label: "Göndərilib", badge: "b-purple" },
    completed: { label: "Tamamlandı", badge: "b-green" },
    cancelled: { label: "Ləğv edildi", badge: "b-gray" },
};

function fmt(n: number) {
    return new Intl.NumberFormat("az-AZ").format(Math.round(n));
}

export default function InventoryPage() {
    const { user } = useAuth();
    const myShopId = user?.shop?.id ?? null;
    const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("stock");

    // Stock
    const [products, setProducts] = useState<Product[] | null>(null);
    const [productsPage, setProductsPage] = useState(1);
    const [marketPage, setMarketPage] = useState(1);
    const [ordersPage, setOrdersPage] = useState(1);
    const [showNewProduct, setShowNewProduct] = useState(false);
    const [pName, setPName] = useState(""); const [pBrand, setPBrand] = useState("");
    const [pCategory, setPCategory] = useState(""); const [pQty, setPQty] = useState("");
    const [pCost, setPCost] = useState(""); const [pPrice, setPPrice] = useState("");
    const [pShared, setPShared] = useState(false); const [pMarketPrice, setPMarketPrice] = useState("");
    const [pUsed, setPUsed] = useState(false);

    // Stock search ("Mənim anbarım" tabında axtarış)
    const [stockQuery, setStockQuery] = useState("");

    // Market search
    const [query, setQuery] = useState("");
    const [marketResults, setMarketResults] = useState<MarketProduct[] | null>(null);

    // Orders
    const [orders, setOrders] = useState<MarketOrder[] | null>(null);

    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    function loadProducts(q = stockQuery) {
        const params = q.trim() ? `?page_size=200&search=${encodeURIComponent(q.trim())}` : "?page_size=200";
        api.products(params).then((d) => {
            const data = d as { results?: Product[] } | Product[];
            setProducts(Array.isArray(data) ? data : data.results ?? []);
        }).catch(() => setError("Anbar yüklənmədi."));
    }
    function loadOrders() {
        api.marketplaceOrders().then((d) => {
            const data = d as { results?: MarketOrder[] } | MarketOrder[];
            setOrders(Array.isArray(data) ? data : data.results ?? []);
        }).catch(() => {});
    }
    useEffect(() => { loadProducts(); loadOrders(); }, []);

    useEffect(() => {
        const t = setTimeout(() => loadProducts(stockQuery), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stockQuery]);

    useEffect(() => {
        if (tab !== "market" || query.trim().length < 2) return;
        const t = setTimeout(() => {
            api.marketplaceSearch(query).then((d) => {
                const data = d as { results?: MarketProduct[] } | MarketProduct[];
                setMarketResults(Array.isArray(data) ? data : data.results ?? []);
            }).catch(() => setMarketResults([]));
        }, 300);
        return () => clearTimeout(t);
    }, [query, tab]);

    async function createProduct() {
        if (!pName.trim() || !pQty) return;
        setBusy(true);
        try {
            const created = (await api.createProduct({
                name: pName, brand: pBrand, category: pCategory,
                unit_cost: pCost || 0, unit_sale_price: pPrice || 0,
                is_shared_to_marketplace: pShared,
                marketplace_price: pShared && pMarketPrice ? pMarketPrice : null,
                is_used: pUsed,
            })) as Product;
            const qty = parseInt(pQty, 10);
            if (qty > 0) {
                await api.createStockMovement({ product: created.id, movement_type: "purchase_in", quantity_delta: qty, note: "İlkin anbar" });
            }
            setShowNewProduct(false);
            setPName(""); setPBrand(""); setPCategory(""); setPQty(""); setPCost(""); setPPrice(""); setPShared(false); setPMarketPrice(""); setPUsed(false);
            loadProducts();
        } catch {
            setError("Məhsul yaradıla bilmədi.");
        } finally {
            setBusy(false);
        }
    }

    async function adjustStock(product: Product, delta: number) {
        if (product.quantity_in_stock + delta < 0) return;
        setBusy(true);
        try {
            await api.createStockMovement({ product: product.id, movement_type: "adjustment", quantity_delta: delta, note: "Əl ilə düzəliş" });
            loadProducts();
        } finally { setBusy(false); }
    }

    async function toggleShare(product: Product) {
        setBusy(true);
        try {
            await api.updateProduct(product.id, { is_shared_to_marketplace: !product.is_shared_to_marketplace });
            loadProducts();
        } finally { setBusy(false); }
    }

    async function orderFromMarket(mp: MarketProduct) {
        setBusy(true);
        try {
            await api.createMarketplaceOrder({ product: mp.id, quantity: 1 });
            loadOrders();
            setTab("orders");
        } catch {
            setError("Sifariş göndərilmədi.");
        } finally { setBusy(false); }
    }

    async function runOrderAction(order: MarketOrder, action: string) {
        setBusy(true);
        try {
            await api.marketplaceOrderAction(order.id, action);
            loadOrders(); loadProducts();
        } catch {
            setError("Əməliyyat uğursuz oldu.");
        } finally { setBusy(false); }
    }

    return (
        <>
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">Anbar</h1>
                    <p className="text-ink2 mt-1">Öz ehtiyat hissələriniz və mağazalararası bazar.</p>
                </div>
                {tab === "stock" && (
                    <button className="btn pri" onClick={() => setShowNewProduct((s) => !s)}>
                        <Plus size={18} /><span>Yeni məhsul</span>
                    </button>
                )}
            </div>

            {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

            <div className="flex gap-2 flex-wrap">
                {TABS.map((t) => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`h-[38px] px-3.5 rounded-full border font-semibold text-sm inline-flex items-center gap-2 ${tab === t.key ? "bg-side border-side text-white" : "bg-white border-line text-ink2"}`}
                        >
                            <Icon size={16} />{t.label}
                        </button>
                    );
                })}
            </div>

            {tab === "stock" && (
                <>
                    <div className="w-full max-w-md h-11 px-3.5 rounded-[10px] bg-white border border-line flex items-center gap-2.5 text-ink2">
                        <Search size={18} className="text-muted flex-none" />
                        <input
                            className="w-full outline-none bg-transparent text-sm min-w-0"
                            placeholder="Ad, marka, kateqoriya və ya SKU üzrə axtar…"
                            value={stockQuery}
                            onChange={(e) => setStockQuery(e.target.value)}
                        />
                        {stockQuery && (
                            <button onClick={() => setStockQuery("")} className="text-muted flex-none"><X size={16} /></button>
                        )}
                    </div>

                    {showNewProduct && (
                        <Modal title="Yeni məhsul" onClose={() => setShowNewProduct(false)} maxWidth="max-w-2xl">
                            <div className="flex gap-3 flex-wrap">
                                <div className="fld flex-1 min-w-[160px]"><label>Ad</label><div className="inp"><input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="iPhone 17 Pro ekranı" /></div></div>
                                <div className="fld flex-1 min-w-[140px]">
                                    <label>Marka</label>
                                    <div className="inp"><input value={pBrand} onChange={(e) => setPBrand(e.target.value)} placeholder="Apple" list="product-brand-list" autoComplete="off" /></div>
                                    <datalist id="product-brand-list">
                                        {Array.from(new Set((products ?? []).map((p) => p.brand).filter(Boolean))).map((b) => <option key={b} value={b} />)}
                                    </datalist>
                                </div>
                                <div className="fld flex-1 min-w-[140px]">
                                    <label>Kateqoriya</label>
                                    <div className="inp"><input value={pCategory} onChange={(e) => setPCategory(e.target.value)} placeholder="Ekran" list="product-category-list" autoComplete="off" /></div>
                                    <datalist id="product-category-list">
                                        {Array.from(new Set((products ?? []).map((p) => p.category).filter(Boolean))).map((c) => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                <div className="fld min-w-[110px]" style={{ maxWidth: 130 }}><label>Miqdar</label><div className="inp"><input type="number" value={pQty} onChange={(e) => setPQty(e.target.value)} /></div></div>
                                <div className="fld min-w-[110px]" style={{ maxWidth: 130 }}><label>Maya (AZN)</label><div className="inp"><input type="number" value={pCost} onChange={(e) => setPCost(e.target.value)} /></div></div>
                                <div className="fld min-w-[110px]" style={{ maxWidth: 130 }}><label>Satış (AZN)</label><div className="inp"><input type="number" value={pPrice} onChange={(e) => setPPrice(e.target.value)} /></div></div>
                            </div>
                            <label className="flex items-start gap-2.5 text-sm font-medium cursor-pointer">
                                <input type="checkbox" checked={pUsed} onChange={(e) => setPUsed(e.target.checked)} className="w-4 h-4 mt-0.5" />
                                <span>
                                    İkinci əl (istifadə olunmuş) məhsuldur
                                    <span className="block text-xs text-muted font-normal mt-0.5">
                                        Yeni deyil — əvvəl istifadə olunub. Cədvəldə və Marketplace-də bu qeyd görünəcək.
                                    </span>
                                </span>
                            </label>
                            <label className="flex items-start gap-2.5 text-sm font-medium cursor-pointer">
                                <input type="checkbox" checked={pShared} onChange={(e) => setPShared(e.target.checked)} className="w-4 h-4 mt-0.5" />
                                <span>
                                    Marketplace-də digər mağazalara göstər
                                    <span className="block text-xs text-muted font-normal mt-0.5">
                                        Açsanız, başqa servislər bu məhsulu axtaranda görüb sizdən sifariş verə bilər.
                                    </span>
                                </span>
                            </label>
                            {pShared && (
                                <div className="fld max-w-[200px]"><label>Marketplace qiyməti (AZN)</label><div className="inp"><input type="number" value={pMarketPrice} onChange={(e) => setPMarketPrice(e.target.value)} placeholder={pPrice || "0"} /></div></div>
                            )}
                            <button className="btn pri self-start" disabled={busy} onClick={createProduct}>Əlavə et</button>
                        </Modal>
                    )}

                    <div className="card !p-2">
                        <div className="overflow-x-auto">
                            <div className="min-w-[760px]">
                                <div className="tr h">
                                    <div className="flex-1">Məhsul</div>
                                    <div className="flex-none w-[130px] text-right">Miqdar</div>
                                    <div className="flex-none w-[90px] text-right">Maya</div>
                                    <div className="flex-none w-[90px] text-right">Satış</div>
                                    <div className="flex-none w-[130px] text-center" title="Açıq olsa, bu məhsulu digər mağazalar da Marketplace-də axtararkən görür və sizdən sifariş verə bilər.">
                                        Marketplace
                                    </div>
                                </div>
                                {paginate(products ?? [], productsPage).map((p) => (
                                    <div key={p.id} className="tr">
                                        <div className="flex-1 min-w-0">
                                            <span className="flex items-center gap-1.5 min-w-0">
                                                <b className="block truncate">{p.name}</b>
                                                {p.is_used && <span className="badge b-amber !text-[10px] flex-none"><i />İkinci əl</span>}
                                            </span>
                                            <span className="text-xs text-muted block truncate">{[p.brand, p.category].filter(Boolean).join(" · ") || "—"}</span>
                                        </div>
                                        <div className="flex-none w-[130px] flex items-center justify-end gap-1.5">
                                            {p.is_low_stock && <AlertTriangle size={14} className="amb" />}
                                            <button disabled={busy} onClick={() => adjustStock(p, -1)} className="w-6 h-6 rounded-md border border-line flex items-center justify-center text-ink2">−</button>
                                            <span className={`w-8 text-center font-semibold ${p.is_low_stock ? "amb" : ""}`}>{p.quantity_in_stock}</span>
                                            <button disabled={busy} onClick={() => adjustStock(p, 1)} className="w-6 h-6 rounded-md border border-line flex items-center justify-center text-ink2">+</button>
                                        </div>
                                        <div className="flex-none w-[90px] text-right text-ink2">{fmt(p.unit_cost)}</div>
                                        <div className="flex-none w-[90px] text-right font-semibold">{fmt(p.unit_sale_price)}</div>
                                        <div className="flex-none w-[130px] flex justify-center">
                                            <button onClick={() => toggleShare(p)} disabled={busy} className={`badge ${p.is_shared_to_marketplace ? "b-green" : "b-gray"}`}>
                                                <i />{p.is_shared_to_marketplace ? "Açıq" : "Bağlı"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {products && products.length === 0 && (
                                    <div className="text-center text-muted text-sm py-10">Hələ məhsul əlavə edilməyib.</div>
                                )}
                            </div>
                        </div>
                        <Pagination page={productsPage} totalItems={products?.length ?? 0} onChange={setProductsPage} />
                    </div>
                </>
            )}

            {tab === "market" && (
                <>
                    <div className="card !py-3 !px-4 flex items-start gap-2.5 bg-brand-soft">
                        <Info size={18} className="text-muted flex-none mt-0.5" />
                        <p className="text-sm text-ink2">
                            <b className="text-ink">Marketplace nədir?</b> Başqa servislərin anbarında olan, onların
                            &quot;Marketplace-də göstər&quot; ilə açıq qoyduğu ehtiyat hissələrini bura axtarıb sifariş verə
                            bilərsiniz — öz anbarınızda olmayan bir hissəni başqa mağazadan əldə etmək üçün. Eyni
                            şəkildə, sizin &quot;Mənim anbarım&quot; tabında açıq (yaşıl) etdiyiniz məhsulları da başqa
                            mağazalar burada görüb sizdən sifariş verə bilər.
                        </p>
                    </div>

                    <div className="w-full max-w-lg h-11 px-3.5 rounded-[10px] bg-white border border-line flex items-center gap-2.5 text-ink2">
                        <Search size={18} className="text-muted flex-none" />
                        <input
                            className="w-full outline-none bg-transparent text-sm min-w-0"
                            placeholder="Başqa mağazaların anbarında axtar (ekran, batareya…)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {query && (
                            <button onClick={() => setQuery("")} className="text-muted flex-none"><X size={16} /></button>
                        )}
                    </div>

                    <div className="flex flex-col gap-2.5">
                        {paginate(tab === "market" && query.trim().length >= 2 ? (marketResults ?? []) : [], marketPage).map((mp) => (
                            <div key={mp.id} className="card flex items-center gap-3">
                                <div className="t-cyan w-10 h-10 rounded-[10px] flex items-center justify-center flex-none"><Store size={18} /></div>
                                <div className="flex-1 min-w-0">
                                    <span className="flex items-center gap-1.5 min-w-0">
                                        <b className="block truncate">{mp.name}</b>
                                        {mp.is_used && <span className="badge b-amber !text-[10px] flex-none"><i />İkinci əl</span>}
                                    </span>
                                    <span className="text-xs text-muted truncate block">{[mp.brand, mp.category].filter(Boolean).join(" · ")} · {mp.shop_name} ({mp.shop_city})</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-muted block">Mövcud</span>
                                    <b>{mp.quantity_in_stock} ədəd</b>
                                </div>
                                <div className="text-right w-24">
                                    <span className="text-xs text-muted block">Qiymət</span>
                                    <b>{fmt(mp.price)} AZN</b>
                                </div>
                                <button className="btn pri" disabled={busy} onClick={() => orderFromMarket(mp)}>Sifariş ver</button>
                            </div>
                        ))}
                        {query.trim().length >= 2 && marketResults && marketResults.length === 0 && (
                            <div className="card text-center text-muted text-sm py-8">Bu axtarışa uyğun məhsul tapılmadı.</div>
                        )}
                        <Pagination
                            page={marketPage}
                            totalItems={query.trim().length >= 2 ? (marketResults?.length ?? 0) : 0}
                            onChange={setMarketPage}
                        />
                        {query.trim().length < 2 && (
                            <div className="card text-center text-muted text-sm py-8">Axtarış üçün ən azı 2 hərf yazın.</div>
                        )}
                    </div>
                </>
            )}

            {tab === "orders" && (
                <div className="flex flex-col gap-2.5">
                    {paginate(orders ?? [], ordersPage).map((o) => {
                        const st = ORDER_STATUS[o.status] ?? { label: o.status, badge: "b-gray" };
                        // Mən alıcıyam, yoxsa satıcı? — cəhətə görə fərqli ikon/rəng/mətn, çünki
                        // "kimdən kimə" sualı məhz bunun qarışdırılmasından yaranırdı.
                        const iBuy = myShopId !== null && String(o.buyer_shop) === String(myShopId);
                        return (
                            <div key={o.id} className="card flex flex-col gap-3">
                                <div className="flex items-start gap-3 flex-wrap">
                                    <div
                                        className={`w-11 h-11 rounded-[10px] flex items-center justify-center flex-none ${iBuy ? "t-blue" : "t-purple"}`}
                                        title={iBuy ? "Siz sifariş vermisiniz (gələcək)" : "Sizə sifariş gəlib (göndərəcəksiniz)"}
                                    >
                                        {iBuy ? <ArrowDownToLine size={20} /> : <ArrowUpFromLine size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0 basis-[260px]">
                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                            <b className="truncate text-[15px]">{o.product_name} × {o.quantity}</b>
                                            <span className={`badge !text-[11px] flex-none ${iBuy ? "b-blue" : "b-purple"}`}>
                                                <i />{iBuy ? "Siz alırsınız" : "Siz satırsınız"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5 text-sm min-w-0 flex-wrap">
                                            <span className="text-muted">Satıcı:</span>
                                            <span className={`truncate ${!iBuy ? "font-bold text-ink" : "font-medium"}`}>{o.seller_shop_name}</span>
                                            <ArrowRightLeft size={13} className="flex-none text-muted" />
                                            <span className="text-muted">Alıcı:</span>
                                            <span className={`truncate ${iBuy ? "font-bold text-ink" : "font-medium"}`}>{o.buyer_shop_name}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-muted block">Məbləğ</span>
                                        <b className="text-base">{fmt(o.total_price)} AZN</b>
                                    </div>
                                    <span className={`badge ${st.badge}`}><i />{st.label}</span>
                                </div>
                                <div className="flex gap-2 flex-wrap pl-0 sm:pl-[56px]">
                                    {/* Qəbul/rədd/ödəniş/göndərmə YALNIZ satıcının işidir, "təhvil aldım"
                                        isə YALNIZ alıcının — əvvəllər bu fərq qoyulmurdu və istənilən tərəf
                                        istənilən düyməni görüb basa bilirdi (backend də indi bunu yoxlayır). */}
                                    {o.status === "pending" && !iBuy && (
                                        <>
                                            <button disabled={busy} onClick={() => runOrderAction(o, "accept")} className="btn sm t-green !border-current"><Check size={16} /><span>Qəbul et</span></button>
                                            <button disabled={busy} onClick={() => runOrderAction(o, "reject")} className="btn sm t-red !border-current"><Ban size={16} /><span>Rədd et</span></button>
                                        </>
                                    )}
                                    {o.status === "pending" && iBuy && (
                                        <span className="text-xs text-muted py-1.5">Satıcının qəbul etməsi gözlənilir…</span>
                                    )}
                                    {o.status === "accepted" && !iBuy && (
                                        <button disabled={busy} onClick={() => runOrderAction(o, "mark-paid")} className="btn sm t-cyan !border-current"><CircleDollarSign size={16} /><span>Ödənildi</span></button>
                                    )}
                                    {o.status === "accepted" && iBuy && (
                                        <span className="text-xs text-muted py-1.5">Qəbul edilib — ödəniş gözlənilir…</span>
                                    )}
                                    {o.status === "paid" && !iBuy && (
                                        <button disabled={busy} onClick={() => runOrderAction(o, "mark-shipped")} className="btn sm t-purple !border-current"><Truck size={16} /><span>Göndərildi</span></button>
                                    )}
                                    {o.status === "paid" && iBuy && (
                                        <span className="text-xs text-muted py-1.5">Ödənildi — göndərilməsi gözlənilir…</span>
                                    )}
                                    {o.status === "shipped" && iBuy && (
                                        <button disabled={busy} onClick={() => runOrderAction(o, "mark-completed")} className="btn sm t-green !border-current"><PackageCheck size={16} /><span>Təhvil aldım</span></button>
                                    )}
                                    {o.status === "shipped" && !iBuy && (
                                        <span className="text-xs text-muted py-1.5">Göndərilib — alıcının təsdiqi gözlənilir…</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {orders && orders.length === 0 && (
                        <div className="card text-center text-muted text-sm py-10">Hələ marketplace sifarişi yoxdur.</div>
                    )}
                    <Pagination page={ordersPage} totalItems={orders?.length ?? 0} onChange={setOrdersPage} />
                </div>
            )}
        </>
    );
}