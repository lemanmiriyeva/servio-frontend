"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Search, ChevronLeft, ChevronRight, Eye, Check } from "lucide-react";
import { api, ApiError, type PlatformField, type PlatformResource } from "@/lib/api";
import { usePlatform } from "@/lib/platform-context";
import { useDialog } from "@/lib/dialog-context";
import { Loader } from "@/components/Loader";

type Row = Record<string, unknown> & { id: string | number };
export type Option = { value: string; label: string; shop?: string };
const PAGE_SIZE = 20;
const TEXT_LIKE = ["text", "textarea", "email"];

function errText(e: unknown, fields: PlatformField[] = []): string {
    if (e instanceof ApiError) {
        const d = e.data;
        if (typeof d === "string") return d;
        if (d && typeof d === "object") {
            const parts: string[] = [];
            for (const [k, v] of Object.entries(d as Record<string, unknown>)) {
                const msg = Array.isArray(v) ? v.join(" ") : typeof v === "string" ? v : JSON.stringify(v);
                if (k === "detail" || k === "non_field_errors") parts.push(msg);
                else parts.push(`${fields.find((f) => f.name === k)?.label ?? k}: ${msg}`);
            }
            if (parts.length) return parts.join(" · ");
        }
        return `Xəta (${e.status})`;
    }
    return "Gözlənilməz xəta.";
}

function toLocalInput(v: unknown): string {
    if (typeof v !== "string" || !v) return "";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function renderCell(row: Row, f: PlatformField): React.ReactNode {
    const v = row[f.name];
    if (f.type === "related") return String(row[`${f.name}_display`] ?? "—");
    if (f.type === "boolean") return <span className={`badge ${v ? "b-green" : "b-gray"}`}><i />{v ? "Bəli" : "Xeyr"}</span>;
    if (f.type === "choice") return f.choices?.find((c) => c.value === v)?.label ?? String(v ?? "—");
    if (v === null || v === undefined || v === "") return "—";
    if (f.type === "datetime") {
        const d = new Date(String(v));
        return isNaN(d.getTime()) ? String(v) : d.toLocaleString("az-AZ", { dateStyle: "short", timeStyle: "short" });
    }
    return String(v);
}

function listOf(d: unknown): Row[] {
    return (Array.isArray(d) ? d : (d as { results?: Row[] }).results ?? []) as Row[];
}

/** Bir resursun FK ("related") sahələri üçün seçim siyahılarını yükləyir (select açılan qutular üçün). */
export function useRelatedOptions(res: PlatformResource): Record<string, Option[]> {
    const [options, setOptions] = useState<Record<string, Option[]>>({});
    const relatedKeys = useMemo(
        () => Array.from(new Set(res.fields.filter((f) => f.type === "related" && f.related).map((f) => f.related as string))),
        [res],
    );
    useEffect(() => {
        relatedKeys.forEach((k) => {
            api.platformList(k, "?page_size=1000").then((d) => {
                // `shop` sahəsi varsa saxlanılır (məs. "roles") — bu sayədə məsələn İstifadəçi
                // formunda "Mağaza" seçiləndə "Rol" siyahısı YALNIZ o mağazanın rollarına filtrlənə bilir.
                const list = listOf(d).map((r) => ({
                    value: String(r.id), label: String(r.display ?? r.id),
                    shop: r.shop !== undefined && r.shop !== null ? String(r.shop) : undefined,
                }));
                setOptions((o) => ({ ...o, [k]: list }));
            }).catch(() => { /* seçim siyahısı yüklənməsə də səhifə işləməlidir */ });
        });
    }, [relatedKeys]);
    return options;
}

/* ------------------------------------------------------------------ */
/*  Yaratma / redaktə formu                                             */
/* ------------------------------------------------------------------ */
export function RecordForm({ res, row, options, presetValues, onClose, onSaved }: {
    res: PlatformResource; row: Row | null; options: Record<string, Option[]>;
    presetValues?: Record<string, string | number>;
    onClose: () => void; onSaved: () => void;
}) {
    const isEdit = row !== null;
    const formFields = useMemo(() => res.fields.filter((f) => !f.read_only && !f.computed), [res]);

    const [values, setValues] = useState<Record<string, string | boolean>>(() => {
        const init: Record<string, string | boolean> = {};
        for (const f of formFields) {
            if (f.type === "image") continue; // ayrıca `files` state-ində saxlanılır
            if (row) {
                const v = row[f.name];
                if (f.write_only) init[f.name] = "";
                else if (f.type === "boolean") init[f.name] = Boolean(v);
                else if (f.type === "datetime") init[f.name] = toLocalInput(v);
                else init[f.name] = v === null || v === undefined ? "" : String(v);
            } else if (!isEdit && presetValues && f.name in presetValues) {
                init[f.name] = String(presetValues[f.name]);
            } else if (f.type === "boolean") {
                init[f.name] = f.default === undefined || f.default === null ? false : Boolean(f.default);
            } else {
                init[f.name] = f.default === undefined || f.default === null ? "" : String(f.default);
            }
        }
        return init;
    });
    // Seçilmiş yeni şəkil faylları (sahə adı → fayl). Boş qalsa, mövcud şəkil toxunulmaz qalır.
    const [files, setFiles] = useState<Record<string, File>>({});
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    // "Rollar" resursu üçün XÜSUSİ HAL: əvvəllər rol yaradılandan sonra hər modulu ayrıca
    // "Rol icazələri" generic resursunda bir-bir əlavə etmək lazım gəlirdi — çox əlverişsiz idi.
    // İndi həmin modal İÇƏRİSİNDƏ, ad/mağaza ilə YANAŞI, bütün modulların aç/bağla düymələri
    // göstərilir; "Yadda saxla" basanda həm rol, həm də seçilmiş icazələr bir əməliyyatda saxlanır.
    const isRoleForm = res.key === "roles";
    const [roleModules, setRoleModules] = useState<{ key: string; label: string; is_default: boolean }[]>([]);
    const [rolePerms, setRolePerms] = useState<Record<string, boolean>>({});
    useEffect(() => {
        if (!isRoleForm) return;
        api.platformRoleModules().then((mods) => {
            setRoleModules(mods);
            if (row) {
                // Redaktə: mövcud rolun real icazələrini oxu.
                api.platformGetRolePermissions(row.id).then((perms) => {
                    setRolePerms(Object.fromEntries(perms.map((p) => [p.module, p.is_allowed])));
                }).catch(() => {});
            } else {
                // Yeni rol: defolt açıq olan bölmələri əvvəlcədən işarələnmiş göstər (yaradılanda
                // backend də elə bunları açır — bax accounts/signals.py create_default_permissions).
                setRolePerms(Object.fromEntries(mods.map((m) => [m.key, m.is_default])));
            }
        }).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRoleForm, row?.id]);

    const roleIsOwner = isRoleForm && Boolean(values["is_owner_role"]);

    function set(name: string, v: string | boolean) {
        setValues((cur) => {
            const next = { ...cur, [name]: v };
            // İstifadəçi formunda "Mağaza" dəyişəndə, əvvəl seçilmiş "Rol" artıq başqa mağazaya
            // aid ola bilər — qarışıqlığın qarşısını almaq üçün sıfırlanır (aşağıda, filtrlənmiş
            // siyahıda görünməyən rol seçili qalmasın deyə).
            if (res.key === "users" && name === "shop" && "role" in next) next.role = "";
            return next;
        });
    }

    function buildPayload(): Record<string, unknown> {
        const out: Record<string, unknown> = {};
        for (const f of formFields) {
            if (f.type === "image") continue; // ayrıca göndərilir
            const v = values[f.name];
            if (f.type === "boolean") { out[f.name] = Boolean(v); continue; }
            const s = String(v ?? "");
            if (s !== "") { out[f.name] = s; continue; }
            if (f.write_only) continue;                                   // boş şifrə = dəyişmə
            if (!isEdit && !f.required) continue;                         // yaratma: boş isteğe bağlı sahə → defolt
            if (TEXT_LIKE.includes(f.type)) out[f.name] = "";
            else if (f.allow_null) out[f.name] = null;
        }
        return out;
    }

    function buildFormData(): FormData {
        const fd = new FormData();
        const payload = buildPayload();
        for (const [k, v] of Object.entries(payload)) {
            if (v === null) continue; // FormData-da "null" göndərmək mənasız — sahə sadəcə əlavə edilmir
            fd.append(k, typeof v === "boolean" ? (v ? "true" : "false") : String(v));
        }
        for (const [name, file] of Object.entries(files)) fd.append(name, file);
        return fd;
    }

    async function submit() {
        setSaving(true); setErr("");
        try {
            const hasFiles = Object.keys(files).length > 0;
            let savedRow: Row | undefined;
            if (row) {
                savedRow = hasFiles
                    ? await api.platformUpdateMultipart(res.key, row.id, buildFormData()) as Row
                    : await api.platformUpdate(res.key, row.id, buildPayload()) as Row;
            } else {
                savedRow = hasFiles
                    ? await api.platformCreateMultipart(res.key, buildFormData()) as Row
                    : await api.platformCreate(res.key, buildPayload()) as Row;
            }
            // Rol formu: ad/mağaza qeyd olunandan dərhal sonra, seçilmiş modul icazələrini də
            // tək bir əlavə sorğu ilə yazırıq (Sahib rolu istisna — onun həmişə hər şeyə icazəsi var).
            if (isRoleForm && !roleIsOwner && savedRow) {
                const permissions = roleModules.map((m) => ({ module: m.key, is_allowed: Boolean(rolePerms[m.key]) }));
                await api.platformSetRolePermissions(savedRow.id, permissions);
            }
            onSaved();
        } catch (e) {
            setErr(errText(e, res.fields));
        } finally { setSaving(false); }
    }

    function input(f: PlatformField) {
        const v = values[f.name];
        if (f.type === "image") {
            const current = row?.[f.name];
            const chosen = files[f.name];
            return (
                <div className="flex items-center gap-3">
                    {chosen ? (
                        <img src={URL.createObjectURL(chosen)} alt="" className="w-14 h-14 rounded-lg object-cover border border-line" />
                    ) : typeof current === "string" && current ? (
                        <img src={current} alt="" className="w-14 h-14 rounded-lg object-cover border border-line" />
                    ) : (
                        <div className="w-14 h-14 rounded-lg border border-dashed border-line flex items-center justify-center text-[10px] text-muted text-center px-1">Şəkil yoxdur</div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        className="text-sm"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setFiles((cur) => ({ ...cur, [f.name]: file }));
                        }}
                    />
                </div>
            );
        }
        if (f.type === "boolean") {
            return (
                <label className="flex items-center gap-2.5 h-[46px] text-sm font-medium cursor-pointer">
                    <input type="checkbox" checked={Boolean(v)} onChange={(e) => set(f.name, e.target.checked)} />
                    {f.label}
                </label>
            );
        }
        if (f.type === "textarea") {
            return <textarea className="inp !h-24 py-2.5 resize-y" value={String(v)} onChange={(e) => set(f.name, e.target.value)} />;
        }
        if (f.type === "choice" || f.type === "related") {
            let opts: Option[] = f.type === "choice" ? (f.choices ?? []) : (f.related ? options[f.related] ?? [] : []);
            // "Rol" sahəsi seçilmiş "Mağaza"ya görə filtrlənir — başqa mağazanın rolu bura düşməsin
            // deyə (hər mağaza öz rollarını qurur). Mağaza hələ seçilməyibsə, siyahı boş qalır.
            if (f.type === "related" && f.related === "roles" && "shop" in values) {
                const shopVal = String(values["shop"] ?? "");
                opts = shopVal ? opts.filter((o) => o.shop === shopVal) : [];
            }
            const cur = String(v ?? "");
            const locked = !isEdit && !!presetValues && f.name in presetValues;
            if (f.type === "related" && cur && !opts.some((o) => o.value === cur)) {
                const lockedLabel = locked ? opts.find((o) => o.value === cur)?.label : undefined;
                opts = [{ value: cur, label: lockedLabel ?? String(row?.[`${f.name}_display`] ?? cur) }, ...opts];
            }
            const noShopYet = f.type === "related" && f.related === "roles" && "shop" in values && !values["shop"];
            return (
                <select className="inp" value={cur} disabled={locked || noShopYet} onChange={(e) => set(f.name, e.target.value)}>
                    <option value="">{noShopYet ? "Əvvəlcə mağaza seçin…" : f.required ? "Seçin…" : "—"}</option>
                    {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            );
        }
        const type =
            f.write_only ? "password" :
                f.type === "integer" || f.type === "decimal" ? "number" :
                    f.type === "date" ? "date" :
                        f.type === "datetime" ? "datetime-local" :
                            f.type === "email" ? "email" : "text";
        return (
            <div className="inp">
                <input
                    type={type}
                    step={f.type === "decimal" ? "any" : undefined}
                    autoComplete={f.write_only ? "new-password" : "off"}
                    placeholder={f.write_only && isEdit ? "Dəyişmək üçün yeni şifrə yazın" : undefined}
                    value={String(v ?? "")}
                    onChange={(e) => set(f.name, e.target.value)}
                />
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4 md:p-10"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <form
                className="card w-full max-w-3xl flex flex-col gap-4"
                onSubmit={(e) => { e.preventDefault(); submit(); }}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{isEdit ? `${res.label} — redaktə` : `${res.label} — yeni`}</h3>
                    <button type="button" onClick={onClose} className="text-muted"><X size={20} /></button>
                </div>

                {err && <div className="text-sm rounded-[10px] px-3 py-2" style={{ color: "var(--red)", background: "var(--red-s)" }}>{err}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {formFields.map((f) => (
                        <div key={f.name} className={`fld ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                            {f.type !== "boolean" && <label>{f.label}{f.required ? " *" : ""}</label>}
                            {input(f)}
                            {f.help && <span className="text-xs text-muted">{f.help}</span>}
                        </div>
                    ))}
                </div>

                {isRoleForm && (
                    <div className="border-t border-line pt-3.5">
                        <label className="mb-2 block">Bu rol hansı bölmələrə icazəlidir?</label>
                        {roleIsOwner ? (
                            <p className="text-sm text-muted">Sahib rolu həmişə bütün bölmələrə icazəlidir — ayrıca seçim lazım deyil.</p>
                        ) : roleModules.length === 0 ? (
                            <p className="text-sm text-muted">Yüklənir…</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {roleModules.map((m) => {
                                    const allowed = Boolean(rolePerms[m.key]);
                                    return (
                                        <label key={m.key} className="flex items-center gap-2 py-1 text-sm cursor-pointer select-none">
                                            <span className={`w-5 h-5 rounded-md border flex items-center justify-center flex-none ${allowed ? "bg-side border-side" : "border-line bg-white"}`}>
                                                {allowed && <Check size={13} strokeWidth={3} className="text-white" />}
                                            </span>
                                            <input
                                                type="checkbox" className="hidden"
                                                checked={allowed}
                                                onChange={(e) => setRolePerms((cur) => ({ ...cur, [m.key]: e.target.checked }))}
                                            />
                                            {m.label}
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-2.5 justify-end">
                    <button type="button" className="btn" onClick={onClose}>Ləğv et</button>
                    <button type="submit" className="btn pri" disabled={saving}>{saving ? "Saxlanılır…" : "Yadda saxla"}</button>
                </div>
            </form>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Siyahı                                                              */
/* ------------------------------------------------------------------ */
export function ResourceView({ res, fixedFilters, hiddenColumns }: {
    res: PlatformResource;
    /** Həmişə tətbiq olunan, istifadəçi tərəfindən dəyişilə/silinə bilməyən filtr (məs. bir mağazanın "Ətraflı" səhifəsində `{shop: id}`). */
    fixedFilters?: Record<string, string | number>;
    /** Bu sütunlar cədvəldə göstərilmir (məs. mağaza daxilində "shop" sütunu artıq lazımsızdır). */
    hiddenColumns?: string[];
}) {
    const [rows, setRows] = useState<Row[]>([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState<Row | "new" | null>(null);
    const options = useRelatedOptions(res);
    const router = useRouter();
    const { confirm } = useDialog();

    const columns = useMemo(
        () => res.columns
            .filter((c) => !hiddenColumns?.includes(c))
            .map((c) => res.fields.find((f) => f.name === c))
            .filter((f): f is PlatformField => !!f),
        [res, hiddenColumns],
    );
    const filterFields = useMemo(
        () => res.filters
            .filter((n) => !fixedFilters || !(n in fixedFilters))
            .map((n) => res.fields.find((f) => f.name === n))
            .filter((f): f is PlatformField => !!f),
        [res, fixedFilters],
    );

    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const load = useCallback(() => {
        const q = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
        if (search.trim()) q.set("search", search.trim());
        Object.entries(filters).forEach(([k, v]) => { if (v) q.set(k, v); });
        Object.entries(fixedFilters ?? {}).forEach(([k, v]) => q.set(k, String(v)));
        // setLoading mikrotapşırığa təxirə salınır ki, effekt daxilində birbaşa (sinxron)
        // setState çağırışı olmasın (react-hooks/set-state-in-effect) — davranış eyni qalır.
        Promise.resolve().then(() => setLoading(true));
        api.platformList(res.key, `?${q.toString()}`)
            .then((d) => {
                const data = d as { count?: number };
                const list = listOf(d);
                setRows(list);
                setCount(data.count ?? list.length);
                setError("");
            })
            .catch((e) => setError(errText(e, res.fields)))
            .finally(() => setLoading(false));
    }, [res, page, search, filters, fixedFilters]);

    useEffect(() => { load(); }, [load]);

    async function remove(row: Row) {
        const ok = await confirm(`“${String(row.display ?? row.id)}” silinsin?`, { title: "Silinsin?", confirmLabel: "Sil", danger: true });
        if (!ok) return;
        try {
            await api.platformDelete(res.key, row.id);
            if (rows.length === 1 && page > 1) setPage(page - 1);
            else load();
        } catch (e) {
            setError(errText(e, res.fields));
        }
    }

    const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

    return (
        <>
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">{res.label}</h1>
                    <p className="text-ink2 mt-1">{count} qeyd</p>
                </div>
                <button className="btn pri" onClick={() => setEditing("new")}><Plus size={18} /><span>Yeni</span></button>
            </div>

            {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

            <div className="flex items-center gap-3 flex-wrap">
                <div className="h-11 px-3.5 rounded-[10px] bg-white border border-line flex items-center gap-2.5 min-w-[240px] flex-1 max-w-[420px]">
                    <Search size={18} className="text-muted flex-none" />
                    <input className="w-full outline-none bg-transparent text-sm" placeholder="Axtar…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
                </div>
                {filterFields.map((f) => {
                    const opts: Option[] = f.type === "choice" ? (f.choices ?? []) : (f.related ? options[f.related] ?? [] : []);
                    return (
                        <select
                            key={f.name}
                            className="inp !w-auto min-w-[170px]"
                            value={filters[f.name] ?? ""}
                            onChange={(e) => { setFilters((cur) => ({ ...cur, [f.name]: e.target.value })); setPage(1); }}
                        >
                            <option value="">{f.label}: hamısı</option>
                            {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    );
                })}
            </div>

            <div className="card !p-2">
                <div className="overflow-x-auto">
                    <div style={{ minWidth: columns.length * 150 + 110 }}>
                        <div className="tr h">
                            {columns.map((f) => <div key={f.name} className="flex-1 min-w-0">{f.label}</div>)}
                            <div className={`flex-none ${res.key === "shops" ? "w-[118px]" : "w-[84px]"}`} />
                        </div>
                        {rows.map((row) => (
                            <div key={String(row.id)} className="tr">
                                {columns.map((f) => (
                                    <div key={f.name} className="flex-1 min-w-0 truncate text-sm">{renderCell(row, f)}</div>
                                ))}
                                <div className="flex-none w-[118px] flex gap-1.5 justify-end">
                                    {res.key === "shops" && (
                                        <button className="w-8 h-8 rounded-lg border border-line bg-white flex items-center justify-center text-ink2" title="Ətraflı (mağazanın məlumatları)" onClick={() => router.push(`/platform/shops/${row.id}`)}><Eye size={15} /></button>
                                    )}
                                    <button className="w-8 h-8 rounded-lg border border-line bg-white flex items-center justify-center text-ink2" title="Redaktə" onClick={() => setEditing(row)}><Pencil size={15} /></button>
                                    <button className="w-8 h-8 rounded-lg border border-line bg-white flex items-center justify-center" style={{ color: "var(--red)" }} title="Sil" onClick={() => remove(row)}><Trash2 size={15} /></button>
                                </div>
                            </div>
                        ))}
                        {loading && <Loader />}
                        {!loading && rows.length === 0 && !error && <div className="text-center text-muted text-sm py-10">Qeyd tapılmadı.</div>}
                    </div>
                </div>
            </div>

            {pages > 1 && (
                <div className="flex items-center justify-center gap-3 text-sm">
                    <button className="btn !h-9" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
                    <span className="text-ink2">{page} / {pages}</span>
                    <button className="btn !h-9" disabled={page >= pages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
                </div>
            )}

            {editing !== null && (
                <RecordForm
                    res={res}
                    row={editing === "new" ? null : editing}
                    options={options}
                    presetValues={fixedFilters}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); load(); }}
                />
            )}
        </>
    );
}

export default function ResourcePage() {
    const params = useParams<{ resource: string }>();
    const { resources, error } = usePlatform();

    if (error) return <div className="card" style={{ color: "var(--red)" }}>{error}</div>;
    if (!resources) return <Loader />;
    const res = resources.find((r) => r.key === params.resource);
    if (!res) return <div className="card text-center text-muted text-sm py-10">Belə bölmə yoxdur.</div>;
    return <ResourceView key={res.key} res={res} />;
}