// ServisCRM API client — bütün backend sorğuları buradan keçir.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export type Shop = {
  id: string; name: string; code: string; city: string;
  currency: string; default_warranty_days: number; status: string;
  address?: string; phone?: string; work_hours?: string; tax_id?: string; receipt_terms?: string;
  owner_full_name?: string; owner_phone?: string; owner_email?: string;
};
export type Branch = { id: number; name: string; address: string; is_main: boolean };
export type Role = { id: number; name: string; is_owner_role: boolean; permissions: { module: string; is_allowed: boolean }[] };
export type Me = {
  id: number; username: string; first_name: string; last_name: string; email: string; phone: string;
  shop: Shop | null; branch: Branch | null; role: Role | null; initials: string;
  is_platform_admin: boolean; is_superadmin: boolean; status: string; allowed_modules: string[];
};

export type PlatformField = {
  name: string; label: string;
  type: "text" | "textarea" | "email" | "integer" | "decimal" | "boolean" | "date" | "datetime" | "choice" | "related";
  required: boolean; read_only: boolean; computed: boolean; allow_null: boolean; write_only: boolean; help: string;
  choices?: { value: string; label: string }[];
  related?: string | null;
  default?: string | number | boolean | null;
};
export type PlatformResource = {
  key: string; label: string; group: string; columns: string[]; filters: string[];
  searchable: boolean; fields: PlatformField[];
};

function getTokens() {
  if (typeof window === "undefined") return { access: null, refresh: null };
  return {
    access: localStorage.getItem("scrm_access"),
    refresh: localStorage.getItem("scrm_refresh"),
  };
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("scrm_access", access);
  localStorage.setItem("scrm_refresh", refresh);
}

export function clearTokens() {
  localStorage.removeItem("scrm_access");
  localStorage.removeItem("scrm_refresh");
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown) {
    super(typeof data === "string" ? data : JSON.stringify(data));
    this.status = status;
    this.data = data;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;
  const res = await fetch(`${API_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  localStorage.setItem("scrm_access", data.access);
  return data.access;
}

export async function apiFetch(path: string, options: RequestInit = {}, retry = true): Promise<unknown> {
  const { access } = getTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (access) headers["Authorization"] = `Bearer ${access}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return apiFetch(path, options, false);
    }
    clearTokens();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    let data: unknown = null;
    try { data = await res.json(); } catch { /* ignore */ }
    throw new ApiError(res.status, data);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
      apiFetch("/auth/token/", { method: "POST", body: JSON.stringify({ username, password }) }, false),
  me: () => apiFetch("/auth/me/") as Promise<Me>,
  dashboard: () => apiFetch("/dashboard/"),
  repairs: (params = "") => apiFetch(`/repairs/${params}`),
  repair: (id: number | string) => apiFetch(`/repairs/${id}/`),
  createRepair: (payload: Record<string, unknown>) =>
      apiFetch("/repairs/", { method: "POST", body: JSON.stringify(payload) }),
  setRepairStatus: (id: number | string, status: string) =>
      apiFetch(`/repairs/${id}/status/`, { method: "POST", body: JSON.stringify({ status }) }),
  addRepairPayment: (id: number | string, amount: number, method: string) =>
      apiFetch(`/repairs/${id}/payments/`, { method: "POST", body: JSON.stringify({ amount, method }) }),
  repairWarranties: () => apiFetch("/repairs/warranties/"),
  repairDebts: () => apiFetch("/repairs/debts/"),
  customers: (params = "") => apiFetch(`/customers/${params}`),
  customer: (id: number | string) => apiFetch(`/customers/${id}/`),
  updateCustomer: (id: number | string, payload: Record<string, unknown>) =>
      apiFetch(`/customers/${id}/`, { method: "PATCH", body: JSON.stringify(payload) }),
  createCustomer: (payload: Record<string, unknown>) =>
      apiFetch("/customers/", { method: "POST", body: JSON.stringify(payload) }),
  products: (params = "") => apiFetch(`/inventory/products/${params}`),
  createProduct: (payload: Record<string, unknown>) =>
      apiFetch("/inventory/products/", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id: number | string, payload: Record<string, unknown>) =>
      apiFetch(`/inventory/products/${id}/`, { method: "PATCH", body: JSON.stringify(payload) }),
  stockMovements: (params = "") => apiFetch(`/inventory/movements/${params}`),
  createStockMovement: (payload: Record<string, unknown>) =>
      apiFetch("/inventory/movements/", { method: "POST", body: JSON.stringify(payload) }),
  marketplaceSearch: (q: string) => apiFetch(`/marketplace/search/?search=${encodeURIComponent(q)}`),
  marketplaceOrders: (params = "") => apiFetch(`/marketplace/orders/${params}`),
  createMarketplaceOrder: (payload: Record<string, unknown>) =>
      apiFetch("/marketplace/orders/", { method: "POST", body: JSON.stringify(payload) }),
  marketplaceOrderAction: (id: number | string, action: string) =>
      apiFetch(`/marketplace/orders/${id}/${action}/`, { method: "POST", body: JSON.stringify({}) }),
  cashboxSummary: () => apiFetch("/cashbox/summary/"),
  cashTransactions: (params = "") => apiFetch(`/cashbox/transactions/${params}`),
  createCashTransaction: (payload: Record<string, unknown>) =>
      apiFetch("/cashbox/transactions/", { method: "POST", body: JSON.stringify(payload) }),
  suppliers: () => apiFetch(`/suppliers/`),
  createSupplier: (payload: Record<string, unknown>) =>
      apiFetch("/suppliers/", { method: "POST", body: JSON.stringify(payload) }),
  addSupplierPurchase: (id: number | string, payload: Record<string, unknown>) =>
      apiFetch(`/suppliers/${id}/purchases/`, { method: "POST", body: JSON.stringify(payload) }),
  paySupplier: (id: number | string, amount: number, method = "cash") =>
      apiFetch(`/suppliers/${id}/pay/`, { method: "POST", body: JSON.stringify({ amount, method }) }),
  reportsSummary: (params = "") => apiFetch(`/reports/summary/${params}`),
  myShop: () => apiFetch("/my-shop/"),
  updateMyShop: (payload: Record<string, unknown>) =>
      apiFetch("/my-shop/", { method: "PATCH", body: JSON.stringify(payload) }),
  branches: () => apiFetch("/branches/"),
  createBranch: (payload: Record<string, unknown>) =>
      apiFetch("/branches/", { method: "POST", body: JSON.stringify(payload) }),
  users: (params = "") => apiFetch(`/users/${params}`),
  createUser: (payload: Record<string, unknown>) =>
      apiFetch("/users/", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id: number | string, payload: Record<string, unknown>) =>
      apiFetch(`/users/${id}/`, { method: "PATCH", body: JSON.stringify(payload) }),
  roles: () => apiFetch(`/roles/`),
  createRole: (payload: Record<string, unknown>) =>
      apiFetch("/roles/", { method: "POST", body: JSON.stringify(payload) }),
  updateRolePermissions: (id: number | string, permissions: { module: string; is_allowed: boolean }[]) =>
      apiFetch(`/roles/${id}/permissions/`, { method: "PATCH", body: JSON.stringify({ permissions }) }),
  // Platform Super Admin
  platformDashboard: () => apiFetch("/platform/dashboard/"),
  shops: (params = "") => apiFetch(`/shops/${params}`),
  updateShop: (id: string, payload: Record<string, unknown>) =>
      apiFetch(`/shops/${id}/`, { method: "PATCH", body: JSON.stringify(payload) }),
  plans: () => apiFetch("/plans/"),
  platformTickets: (params = "") => apiFetch(`/platform/tickets/${params}`),
  // Platforma — generik CRUD (mağazalar, istifadəçilər, rollar, ... hamısı)
  platformResources: () => apiFetch("/platform/resources/") as Promise<PlatformResource[]>,
  platformList: (key: string, params = "") => apiFetch(`/platform/r/${key}/${params}`),
  platformCreate: (key: string, payload: Record<string, unknown>) =>
      apiFetch(`/platform/r/${key}/`, { method: "POST", body: JSON.stringify(payload) }),
  platformUpdate: (key: string, id: string | number, payload: Record<string, unknown>) =>
      apiFetch(`/platform/r/${key}/${id}/`, { method: "PATCH", body: JSON.stringify(payload) }),
  platformDelete: (key: string, id: string | number) =>
      apiFetch(`/platform/r/${key}/${id}/`, { method: "DELETE" }),
};

export const STATUS_LABELS: Record<string, string> = {
  received: "Qəbul edildi",
  diagnosing: "Diaqnostikada",
  waiting_repair: "Təmir gözləyir",
  in_progress: "Təmir prosesində",
  ready: "Hazırdır",
  delivered: "Təhvil verildi",
  cancelled: "Ləğv edildi",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Ödənilməyib",
  partial: "Qismən ödənilib",
  paid: "Ödənilib",
  debt: "Borc qalıb",
};