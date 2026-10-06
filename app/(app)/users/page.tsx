"use client";
import { useEffect, useState } from "react";
import { Plus, UserPlus, ShieldCheck, Check, CheckCheck, Square, Save } from "lucide-react";
import { api } from "@/lib/api";
import { Modal } from "@/components/Modal";
import { Pagination, paginate } from "@/components/Pagination";

type RolePerm = { module: string; is_allowed: boolean };
type Role = { id: number; name: string; is_owner_role: boolean; permissions: RolePerm[]; user_count: number };
type User = {
    id: number; username: string; first_name: string; last_name: string; email: string; phone: string;
    status: string; initials: string; role: Role | null;
};

const MODULES: { key: string; label: string }[] = [
    { key: "repairs", label: "Təmir / Xidmətlər" },
    { key: "customers", label: "Müştərilər" },
    { key: "inventory", label: "Anbar" },
    { key: "marketplace", label: "Marketplace" },
    { key: "suppliers", label: "Təchizatçılar" },
    { key: "cashbox", label: "Kassa — bütün əməliyyatlar" },
    { key: "expenses", label: "Xərclər" },
    { key: "debts", label: "Borclar — ümumi məbləğ" },
    { key: "reports", label: "Hesabatlar / Analitika" },
    { key: "users", label: "İstifadəçilər və icazələr" },
    { key: "settings", label: "Parametrlər" },
    { key: "revenue_numbers", label: "Gəlir / net mənfəət rəqəmləri" },
];

const STATUS_LABEL: Record<string, string> = { active: "Aktiv", invited: "Dəvət gözləyir", disabled: "Deaktiv" };
const STATUS_BADGE: Record<string, string> = { active: "b-green", invited: "b-amber", disabled: "b-gray" };

export default function UsersPage() {
    const [tab, setTab] = useState<"users" | "roles">("users");
    const [users, setUsers] = useState<User[] | null>(null);
    const [usersPage, setUsersPage] = useState(1);
    const [roles, setRoles] = useState<Role[] | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    // Rol icazələri: dəyişikliklər birbaşa saxlanmır — bir neçə modulu birdən seçib,
    // sonra TƏK düymə ilə yadda saxlamaq üçün "draft" (hələ saxlanmamış) vəziyyət.
    const [permDraft, setPermDraft] = useState<Record<string, boolean> | null>(null);
    const [savingPerms, setSavingPerms] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const [showNewUser, setShowNewUser] = useState(false);
    const [uFirst, setUFirst] = useState(""); const [uLast, setULast] = useState("");
    const [uUsername, setUUsername] = useState(""); const [uPassword, setUPassword] = useState("");
    const [uRoleId, setURoleId] = useState<number | "">("");

    const [showNewRole, setShowNewRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    // Rol yaradılan ANDA icazələri də seçmək üçün — əvvəllər rolu yaratmaq və icazələrini seçmək
    // İKİ ayrı addım idi (yarat → siyahıdan tap → aç → toggle et → saxla); indi eyni modalda.
    const [newRolePerms, setNewRolePerms] = useState<Record<string, boolean>>(
        Object.fromEntries(MODULES.map((m) => [m.key, ["repairs", "customers", "inventory", "marketplace", "suppliers"].includes(m.key)])),
    );

    function loadUsers() {
        api.users("?page_size=100").then((d) => {
            const data = d as { results?: User[] } | User[];
            setUsers(Array.isArray(data) ? data : data.results ?? []);
        }).catch(() => setError("İstifadəçilər yüklənmədi."));
    }
    function loadRoles() {
        api.roles().then((d) => {
            const data = d as { results?: Role[] } | Role[];
            const list = Array.isArray(data) ? data : data.results ?? [];
            setRoles(list);
            setSelectedRoleId((cur) => cur ?? list[0]?.id ?? null);
        }).catch(() => {});
    }
    useEffect(() => { loadUsers(); loadRoles(); }, []);

    async function createUser() {
        if (!uFirst.trim() || !uUsername.trim() || !uPassword.trim()) return;
        setBusy(true);
        try {
            await api.createUser({
                first_name: uFirst, last_name: uLast, username: uUsername,
                password: uPassword, role_id: uRoleId || null,
            });
            setShowNewUser(false);
            setUFirst(""); setULast(""); setUUsername(""); setUPassword(""); setURoleId("");
            loadUsers();
        } catch {
            setError("İstifadəçi yaradıla bilmədi.");
        } finally { setBusy(false); }
    }

    async function changeUserRole(user: User, roleId: number) {
        setBusy(true);
        try {
            await api.updateUser(user.id, { role_id: roleId });
            loadUsers();
        } finally { setBusy(false); }
    }

    async function changeUserStatus(user: User, status: string) {
        setBusy(true);
        try {
            await api.updateUser(user.id, { status });
            loadUsers();
        } finally { setBusy(false); }
    }

    async function createRole() {
        if (!newRoleName.trim()) return;
        setBusy(true);
        try {
            const role = (await api.createRole({ name: newRoleName })) as Role;
            const permissions = MODULES.map((m) => ({ module: m.key, is_allowed: newRolePerms[m.key] ?? false }));
            await api.updateRolePermissions(role.id, permissions);
            setNewRoleName("");
            setNewRolePerms(Object.fromEntries(MODULES.map((m) => [m.key, ["repairs", "customers", "inventory", "marketplace", "suppliers"].includes(m.key)])));
            setShowNewRole(false);
            loadRoles();
            setSelectedRoleId(role.id);
        } catch {
            setError("Rol yaradıla bilmədi.");
        } finally { setBusy(false); }
    }

    const selectedRole = roles?.find((r) => r.id === selectedRoleId) ?? null;

    // Seçili rol üçün hazırkı (draft varsa draft, yoxsa serverdəki) icazə xəritəsi.
    function effectivePerms(role: Role): Record<string, boolean> {
        if (permDraft) return permDraft;
        const map: Record<string, boolean> = {};
        for (const m of MODULES) map[m.key] = role.permissions.find((p) => p.module === m.key)?.is_allowed ?? false;
        return map;
    }

    // Bir modulu işarələ/işarəni götür — YALNIZ yaddaşda (draft), serverə hələ getmir.
    // Bu sayədə istifadəçi bir neçə modulu bir dəfəyə seçib sonra TƏK dəfə "Yadda saxla"ya basa bilir.
    function toggleDraft(role: Role, moduleKey: string) {
        if (role.is_owner_role) return;
        const base = effectivePerms(role);
        setPermDraft({ ...base, [moduleKey]: !base[moduleKey] });
    }

    function selectAllDraft(role: Role, value: boolean) {
        if (role.is_owner_role) return;
        const map: Record<string, boolean> = {};
        for (const m of MODULES) map[m.key] = value;
        setPermDraft(map);
    }

    function discardDraft() {
        setPermDraft(null);
    }

    async function savePermDraft(role: Role) {
        if (!permDraft) return;
        setSavingPerms(true);
        try {
            const nextPerms = MODULES.map((m) => ({ module: m.key, is_allowed: permDraft[m.key] ?? false }));
            await api.updateRolePermissions(role.id, nextPerms);
            setPermDraft(null);
            loadRoles();
        } catch {
            setError("İcazələr saxlanıla bilmədi.");
        } finally { setSavingPerms(false); }
    }

    return (
        <>
            <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight">İstifadəçilər</h1>
                    <p className="text-ink2 mt-1">Komanda üzvləri və hər rolun icazələri.</p>
                </div>
                {tab === "users" ? (
                    <button className="btn pri" onClick={() => setShowNewUser((s) => !s)}><UserPlus size={18} /><span>Yeni istifadəçi</span></button>
                ) : (
                    <button className="btn pri" onClick={() => setShowNewRole((s) => !s)}><Plus size={18} /><span>Yeni rol</span></button>
                )}
            </div>

            {error && <div className="card" style={{ color: "var(--red)" }}>{error}</div>}

            <div className="flex gap-2">
                <button onClick={() => setTab("users")} className={`h-[38px] px-3.5 rounded-full border font-semibold text-sm ${tab === "users" ? "bg-side border-side text-white" : "bg-white border-line text-ink2"}`}>İstifadəçilər ({users?.length ?? 0})</button>
                <button onClick={() => setTab("roles")} className={`h-[38px] px-3.5 rounded-full border font-semibold text-sm ${tab === "roles" ? "bg-side border-side text-white" : "bg-white border-line text-ink2"}`}>Rollar və icazələr</button>
            </div>

            {tab === "users" && (
                <>
                    {showNewUser && (
                        <Modal title="Yeni istifadəçi" onClose={() => setShowNewUser(false)} maxWidth="max-w-2xl">
                            <div className="flex gap-3 flex-wrap">
                                <div className="fld flex-1 min-w-[140px]"><label>Ad</label><div className="inp"><input value={uFirst} onChange={(e) => setUFirst(e.target.value)} /></div></div>
                                <div className="fld flex-1 min-w-[140px]"><label>Soyad</label><div className="inp"><input value={uLast} onChange={(e) => setULast(e.target.value)} /></div></div>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                <div className="fld flex-1 min-w-[160px]"><label>Login</label><div className="inp"><input value={uUsername} onChange={(e) => setUUsername(e.target.value)} placeholder="rustem.techfix" /></div></div>
                                <div className="fld flex-1 min-w-[160px]"><label>Şifrə</label><div className="inp"><input type="text" value={uPassword} onChange={(e) => setUPassword(e.target.value)} /></div></div>
                            </div>
                            <div className="fld max-w-[240px]">
                                <label>Rol</label>
                                <select className="inp" value={uRoleId} onChange={(e) => setURoleId(e.target.value ? Number(e.target.value) : "")}>
                                    <option value="">Seçin…</option>
                                    {(roles ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <button className="btn pri self-start" disabled={busy} onClick={createUser}>Əlavə et</button>
                        </Modal>
                    )}

                    <div className="card !p-2">
                        <div className="overflow-x-auto">
                            <div className="min-w-[640px]">
                                <div className="tr h">
                                    <div className="flex-1">İstifadəçi</div>
                                    <div className="flex-none w-[180px]">Rol</div>
                                    <div className="flex-none w-[130px]">Vəziyyət</div>
                                </div>
                                {paginate(users ?? [], usersPage).map((u) => (
                                    <div key={u.id} className="tr">
                                        <div className="flex-1 flex items-center gap-2.5 font-semibold min-w-0">
                                            <div className="av a4">{u.initials}</div>
                                            <div className="min-w-0">
                                                <span className="truncate block">{u.first_name} {u.last_name}</span>
                                                <span className="mono text-xs text-muted">{u.username}</span>
                                            </div>
                                        </div>
                                        <div className="flex-none w-[180px]">
                                            <select
                                                className="inp !h-9 text-sm"
                                                value={u.role?.id ?? ""}
                                                onChange={(e) => e.target.value && changeUserRole(u, Number(e.target.value))}
                                            >
                                                <option value="">Rol yoxdur</option>
                                                {(roles ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex-none w-[130px]">
                                            <select
                                                className={`badge ${STATUS_BADGE[u.status]} !border-none cursor-pointer`}
                                                value={u.status}
                                                onChange={(e) => changeUserStatus(u, e.target.value)}
                                                style={{ appearance: "none", paddingRight: 8 }}
                                            >
                                                {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                                {users && users.length === 0 && (
                                    <div className="text-center text-muted text-sm py-10">Hələ istifadəçi əlavə edilməyib.</div>
                                )}
                            </div>
                        </div>
                        <Pagination page={usersPage} totalItems={users?.length ?? 0} onChange={setUsersPage} />
                    </div>
                </>
            )}

            {tab === "roles" && (
                <div className="flex flex-col lg:flex-row gap-5 items-start">
                    <div className="w-full lg:w-[260px] flex-none flex flex-col gap-2">
                        {showNewRole && (
                            <Modal title="Yeni rol" onClose={() => setShowNewRole(false)} maxWidth="max-w-md">
                                <div className="fld"><label>Rol adı</label><div className="inp"><input autoFocus value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Kassir" /></div></div>
                                <div className="fld">
                                    <label>Hansı bölmələrə icazəli olsun?</label>
                                    <div className="grid grid-cols-1 gap-1.5 mt-1">
                                        {MODULES.map((m) => {
                                            const allowed = newRolePerms[m.key] ?? false;
                                            return (
                                                <label key={m.key} className="flex items-center gap-2 py-1 text-sm cursor-pointer select-none">
                                                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center flex-none ${allowed ? "bg-side border-side" : "border-line bg-white"}`}>
                                                        {allowed && <Check size={13} strokeWidth={3} className="text-side" style={{ color: "white" }} />}
                                                    </span>
                                                    <input
                                                        type="checkbox" className="hidden" checked={allowed}
                                                        onChange={(e) => setNewRolePerms((cur) => ({ ...cur, [m.key]: e.target.checked }))}
                                                    />
                                                    {m.label}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                                <button className="btn pri self-start" disabled={busy || !newRoleName.trim()} onClick={createRole}>Əlavə et</button>
                            </Modal>
                        )}
                        {(roles ?? []).map((r) => (
                            <button
                                key={r.id}
                                onClick={() => { setSelectedRoleId(r.id); setPermDraft(null); }}
                                className={`text-left p-3.5 rounded-[10px] border flex items-center gap-2.5 ${selectedRoleId === r.id ? "bg-side border-side text-white" : "bg-white border-line text-ink"}`}
                            >
                                <ShieldCheck size={18} className={selectedRoleId === r.id ? "text-brand" : "text-muted"} />
                                <div className="min-w-0">
                                    <b className="block truncate">{r.name}</b>
                                    <span className={`text-xs ${selectedRoleId === r.id ? "text-[#8FA9B2]" : "text-muted"}`}>{r.user_count} istifadəçi</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 w-full min-w-0">
                        {selectedRole ? (
                            <div className="card">
                                <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                                    <h3 className="text-base font-semibold">{selectedRole.name} — icazələr</h3>
                                    {selectedRole.is_owner_role && <span className="badge b-gray"><i />Sahib rolu — dəyişdirilə bilməz</span>}
                                </div>
                                <p className="text-muted text-sm mb-1">Bir neçə bölməni birdən seçib, sonra &quot;Yadda saxla&quot;ya basın.</p>
                                {!selectedRole.is_owner_role && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <button type="button" className="btn !h-8 !px-2.5 text-xs" onClick={() => selectAllDraft(selectedRole, true)}>
                                            <CheckCheck size={14} /><span>Hamısını seç</span>
                                        </button>
                                        <button type="button" className="btn !h-8 !px-2.5 text-xs" onClick={() => selectAllDraft(selectedRole, false)}>
                                            <Square size={14} /><span>Heç birini seçmə</span>
                                        </button>
                                        {permDraft && <span className="text-xs text-amber-600 font-medium ml-auto">Saxlanılmamış dəyişikliklər var</span>}
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    {MODULES.map((m) => {
                                        const allowed = selectedRole.is_owner_role || effectivePerms(selectedRole)[m.key];
                                        return (
                                            <div key={m.key} className="flex items-center justify-between py-3 border-b border-line last:border-b-0">
                                                <span className="text-sm font-medium">{m.label}</span>
                                                <button
                                                    type="button"
                                                    disabled={selectedRole.is_owner_role || savingPerms}
                                                    onClick={() => toggleDraft(selectedRole, m.key)}
                                                    className={`w-11 h-6 rounded-full relative transition-colors flex-none ${allowed ? "bg-side" : "bg-line"} ${selectedRole.is_owner_role ? "opacity-60" : ""}`}
                                                >
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center transition-all ${allowed ? "left-[22px]" : "left-0.5"}`}>
                            {allowed && <Check size={12} strokeWidth={3} className="text-side" />}
                          </span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                {!selectedRole.is_owner_role && permDraft && (
                                    <div className="flex gap-2.5 justify-end mt-4 pt-3 border-t border-line">
                                        <button type="button" className="btn" disabled={savingPerms} onClick={discardDraft}>Ləğv et</button>
                                        <button type="button" className="btn pri" disabled={savingPerms} onClick={() => savePermDraft(selectedRole)}>
                                            <Save size={16} /><span>{savingPerms ? "Saxlanılır…" : "Yadda saxla"}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="card text-center text-muted text-sm py-10">Rol seçin.</div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}