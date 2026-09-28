"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Pencil, Trash2, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { api, ApiError, type PlatformField, type PlatformResource } from "@/lib/api";
import { usePlatform } from "@/lib/platform-context";

type Row = Record<string, unknown> & { id: string | number };
type Option = { value: string; label: string };
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

/* ------------------------------------------------------------------ */
/*  Yaratma / redaktə formu                                             */
/* ------------------------------------------------------------------ */
function RecordForm({ res, row, options, onClose, onSaved }: {
    res: PlatformResource; row: Row | null; options: Record<string, Option[]>;
    onClose: () => void; onSaved: () => void;
}) {
    const isEdit = row !== null;
    const formFields = useMemo(() => res.fields.filter((f) => !f.read_only && !f.computed), [res]);

    const [values, setValues] = useState<Record<string, string | boolean>>(() => {
        const init: Record<string, string | boolean> = {};
        for (const f of formFields) {
            if (row) {
                const v = row[f.name];
                if (f.write_only) init[f.name] = "";
                else if (f.type === "boolean") init[f.name] = Boolean(v);
                else if (f.type === "datetime") init[f.name] = toLocalInput(v);
                else init[f.name] = v === null || v === undefined ? "" : String(v);
            } else if (f.type === "boolean") {
                init[f.name] = f.default === undefined || f.default === null ? false : Boolean(f.default);
            } else {
                init[f.name] = f.default === undefined || f.default === null ? "" : String(f.default);
            }
        }
        return init;
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    function set(name: string, v: string | boolean) {
        setValues((cur) => ({ ...cur, [name]: v }));
    }

    function buildPayload(): Record<string, unknown> {
        const out: Record<string, unknown> = {};
        for (const f of formFields) {
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

    async function submit() {
        setSaving(true); setErr("");
        try {
            if (row) await api.platformUpdate(res.key, row.id, buildPayload());
            else await api.platformCreate(res.key, buildPayload());
            onSaved();
        } catch (e) {
            setErr(errText(e, res.fields));
        } finally { setSaving(false); }
    }

    function input(f: PlatformField) {
        const v = values[f.name];
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
            const cur = String(v ?? "");
            if (f.type === "related" && cur && !opts.some((o) => o.value === cur)) {
                opts = [{ value: cur, label: String(row?.[`${f.name}_display`] ?? cur) }, ...opts];
            }
            return (
                <select className="inp" value={cur} onChange={(e) => set(f.name, e.target.value)}>
                    <option value="">{f.required ? "Seçin…" : "—"}</option>
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
function ResourceView({ res }: { res: PlatformResource }) {
    const [rows, setRows] = useState<Row[]>([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState<Row | "new" | null>(null);
    const [options, setOptions] = useState<Record<string, Option[]>>({});

    const columns = useMemo(
        () => res.columns.map((c) => res.fields.find((f) => f.name === c)).filter((f): f is PlatformField => !!f),
        [res],
    );
    const filterFields = useMemo(
        () => res.filters.map((n) => res.fields.find((f) => f.name === n)).filter((f): f is PlatformField => !!f),
        [res],
    );

    // Əlaqəli resursların (mağaza, rol, müştəri, ...) seçim siyahıları
    const relatedKeys = useMemo(
        () => Array.from(new Set(res.fields.filter((f) => f.type === "related" && f.related).map((f) => f.related as string))),
        [res],
    );
    useEffect(() => {
        relatedKeys.forEach((k) => {
            api.platformList(k, "?page_size=1000").then((d) => {
                const list = listOf(d).map((r) => ({ value: String(r.id), label: String(r.display ?? r.id) }));
                setOptions((o) => ({ ...o, [k]: list }));
            }).catch(() => { /* seçim siyahısı yüklənməsə də səhifə işləməlidir */ });
        });
    }, [relatedKeys]);

    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const load = useCallback(() => {
        const q = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
        if (search.trim()) q.set("search", search.trim());
        Object.entries(filters).forEach(([k, v]) => { if (v) q.set(k, v); });
        setLoading(true);
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
    }, [res, page, search, filters]);

    useEffect(() => { load(); }, [load]);

    async function remove(row: Row) {
        if (!window.confirm(`“${String(row.display ?? row.id)}” silinsin?`)) return;
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
                            <div className="flex-none w-[84px]" />
                        </div>
                        {rows.map((row) => (
                            <div key={String(row.id)} className="tr">
                                {columns.map((f) => (
                                    <div key={f.name} className="flex-1 min-w-0 truncate text-sm">{renderCell(row, f)}</div>
                                ))}
                                <div className="flex-none w-[84px] flex gap-1.5 justify-end">
                                    <button className="w-8 h-8 rounded-lg border border-line bg-white flex items-center justify-center text-ink2" title="Redaktə" onClick={() => setEditing(row)}><Pencil size={15} /></button>
                                    <button className="w-8 h-8 rounded-lg border border-line bg-white flex items-center justify-center" style={{ color: "var(--red)" }} title="Sil" onClick={() => remove(row)}><Trash2 size={15} /></button>
                                </div>
                            </div>
                        ))}
                        {loading && <div className="text-center text-muted text-sm py-10">Yüklənir…</div>}
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
    if (!resources) return <div className="text-center text-muted text-sm py-10">Yüklənir…</div>;
    const res = resources.find((r) => r.key === params.resource);
    if (!res) return <div className="card text-center text-muted text-sm py-10">Belə bölmə yoxdur.</div>;
    return <ResourceView key={res.key} res={res} />;
}
