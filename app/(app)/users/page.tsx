"use client";
import { useEffect, useState } from "react";
import { Plus, X, UserPlus, ShieldCheck, Check } from "lucide-react";
import { api } from "@/lib/api";

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
    const [roles, setRoles] = useState<Role[] | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const [showNewUser, setShowNewUser] = useState(false);
    const [uFirst, setUFirst] = useState(""); const [uLast, setULast] = useState("");
    const [uUsername, setUUsername] = useState(""); const [uPassword, setUPassword] = useState("");
    const [uRoleId, setURoleId] = useState<number | "">("");

    const [showNewRole, setShowNewRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");

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
            setNewRoleName(""); setShowNewRole(false);
            loadRoles();
            setSelectedRoleId(role.id);
        } catch {
            setError("Rol yaradıla bilmədi.");
        } finally { setBusy(false); }
    }

    async function togglePermission(role: Role, moduleKey: string) {
        if (role.is_owner_role) return;
        const current = role.permissions.find((p) => p.module === moduleKey)?.is_allowed ?? false;
        const nextPerms = MODULES.map((m) => ({
            module: m.key,
            is_allowed: m.key === moduleKey ? !current : (role.permissions.find((p) => p.module === m.key)?.is_allowed ?? false),
        }));
        setBusy(true);
        try {
            await api.updateRolePermissions(role.id, nextPerms);
            loadRoles();
        } finally { setBusy(false); }
    }

    const selectedRole = roles?.find((r) => r.id === selectedRoleId) ?? null;

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
                        <div className="card max-w-2xl flex flex-col gap-3.5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold">Yeni istifadəçi</h3>
                                <button onClick={() => setShowNewUser(false)} className="text-muted"><X size={18} /></button>
                            </div>
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
                        </div>
                    )}

                    <div className="card !p-2">
                        <div className="overflow-x-auto">
                            <div className="min-w-[640px]">
                                <div className="tr h">
                                    <div className="flex-1">İstifadəçi</div>
                                    <div className="flex-none w-[180px]">Rol</div>
                                    <div className="flex-none w-[130px]">Status</div>
                                </div>
                                {(users ?? []).map((u) => (
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
                    </div>
                </>
            )}

            {tab === "roles" && (
                <div className="flex flex-col lg:flex-row gap-5 items-start">
                    <div className="w-full lg:w-[260px] flex-none flex flex-col gap-2">
                        {showNewRole && (
                            <div className="card flex gap-2 items-end !p-3">
                                <div className="fld flex-1"><label>Rol adı</label><div className="inp !h-9"><input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Kassir" /></div></div>
                                <button className="btn pri !h-9" disabled={busy} onClick={createRole}>Əlavə et</button>
                            </div>
                        )}
                        {(roles ?? []).map((r) => (
                            <button
                                key={r.id}
                                onClick={() => setSelectedRoleId(r.id)}
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
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-base font-semibold">{selectedRole.name} — icazələr</h3>
                                    {selectedRole.is_owner_role && <span className="badge b-gray"><i />Sahib rolu — dəyişdirilə bilməz</span>}
                                </div>
                                <p className="text-muted text-sm mb-4">Bu rola sahib istifadəçilər aşağıdakı bölmələrə giriş əldə edir.</p>
                                <div className="flex flex-col">
                                    {MODULES.map((m) => {
                                        const allowed = selectedRole.is_owner_role || (selectedRole.permissions.find((p) => p.module === m.key)?.is_allowed ?? false);
                                        return (
                                            <div key={m.key} className="flex items-center justify-between py-3 border-b border-line last:border-b-0">
                                                <span className="text-sm font-medium">{m.label}</span>
                                                <button
                                                    disabled={selectedRole.is_owner_role || busy}
                                                    onClick={() => togglePermission(selectedRole, m.key)}
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