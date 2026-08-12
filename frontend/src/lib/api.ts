const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface AuthResponse {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: number;
    state: boolean;
    created_at: string;
    updated_at: string;
  };
  access_token: string;
  refresh_token: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Base {
  id: string;
  workspace_id: string;
  workspace_name: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  error: string;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

async function tryRefreshToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data: AuthResponse = await res.json();
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return true;
  } catch {
    return false;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAndRetry(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = tryRefreshToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && retry && getRefreshToken()) {
    const refreshed = await refreshAndRetry();
    if (refreshed) {
      return request<T>(endpoint, options, false);
    }
    clearAuth();
    throw new Error("Sesión expirada");
  }

  const data = await res.json();

  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err.error || "Error de conexión");
  }

  return data as T;
}

export function isAuthenticated(): boolean {
  return !!getToken() && !!getRefreshToken();
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function refreshToken(
  refreshTokenValue: string,
): Promise<AuthResponse> {
  return request<AuthResponse>("/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshTokenValue }),
  });
}

export function getWorkspaces(): Promise<Workspace[]> {
  return request<Workspace[]>("/api/v1/workspaces");
}

export function createWorkspace(name: string): Promise<Workspace> {
  return request<Workspace>("/api/v1/workspaces", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function getBases(): Promise<Base[]> {
  return request<Base[]>("/api/v1/bases");
}

export function createBase(
  workspaceId: string,
  data: { name: string; icon?: string; color?: string },
): Promise<Base> {
  return request<Base>(`/api/v1/workspaces/${workspaceId}/bases`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface Table {
  id: string;
  base_id: string;
  name: string;
  description: string | null;
  order_position: number;
  created_at: string;
  updated_at: string;
}

export interface Field {
  id: string;
  table_id: string;
  name: string;
  field_type: string;
  options_json: unknown;
  order_position: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface TableRecord {
  id: string;
  table_id: string;
  data_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TableWithFields {
  id: string;
  base_id: string;
  name: string;
  description: string | null;
  order_position: number;
  fields: Field[];
  created_at: string;
  updated_at: string;
}

export function getTables(baseId: string): Promise<Table[]> {
  return request<Table[]>(`/api/v1/bases/${baseId}/tables`);
}

export function createTable(baseId: string, name: string): Promise<Table> {
  return request<Table>(`/api/v1/bases/${baseId}/tables`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function getTable(tableId: string): Promise<TableWithFields> {
  return request<TableWithFields>(`/api/v1/tables/${tableId}`);
}

export function createField(
  tableId: string,
  data: { name: string; field_type: string; options_json?: unknown },
): Promise<Field> {
  return request<Field>(`/api/v1/tables/${tableId}/fields`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getRecords(tableId: string): Promise<TableRecord[]> {
  return request<TableRecord[]>(`/api/v1/tables/${tableId}/records`);
}

export interface PickerField {
  id: string;
  name: string;
  field_type: string;
  options_json: unknown;
  is_primary: boolean;
}

export interface PickerRecord {
  id: string;
  fields: Record<string, unknown>;
}

export interface RecordPickerResponse {
  fields: PickerField[];
  records: PickerRecord[];
  next_cursor: string | null;
}

export function getPickerRecords(
  tableId: string,
  params: { searchQuery?: string; cursor?: string; limit?: number },
  signal?: AbortSignal,
): Promise<RecordPickerResponse> {
  const qs = new URLSearchParams();
  if (params.searchQuery) qs.set("searchQuery", params.searchQuery);
  if (params.cursor) qs.set("cursor", params.cursor);
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request<RecordPickerResponse>(`/api/v1/tables/${tableId}/records/picker${suffix}`, { signal });
}

export function createRecord(
  tableId: string,
  data: { data_json: Record<string, unknown> },
): Promise<TableRecord> {
  return request<TableRecord>(`/api/v1/tables/${tableId}/records`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateRecord(
  tableId: string,
  recordId: string,
  data: { data_json: Record<string, unknown> },
  signal?: AbortSignal,
): Promise<TableRecord> {
  return request<TableRecord>(`/api/v1/records/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    signal,
  });
}

export function deleteRecord(recordId: string): Promise<void> {
  return request<void>(`/api/v1/records/${recordId}`, {
    method: "DELETE",
  });
}

export interface Form {
  id: string;
  table_id: string;
  name: string;
  description: string | null;
  config_json: Record<string, unknown>;
  public_hash: string | null;
  created_at: string;
  updated_at: string;
}

export function createForm(data: { table_id: string; name: string; description?: string }): Promise<Form> {
  return request<Form>("/api/v1/forms", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getForm(id: string): Promise<Form> {
  return request<Form>(`/api/v1/forms/${id}`);
}

export function updateForm(id: string, data: { name?: string; description?: string; config_json?: unknown }): Promise<Form> {
  return request<Form>(`/api/v1/forms/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function publishForm(id: string): Promise<Form> {
  return request<Form>(`/api/v1/forms/${id}/publish`, {
    method: "POST",
  });
}

export function submitForm(hash: string, data: { data_json: Record<string, unknown> }): Promise<TableRecord> {
  return request<TableRecord>(`/api/v1/f/${hash}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listBaseForms(baseId: string): Promise<Form[]> {
  return request<Form[]>(`/api/v1/bases/${baseId}/forms`);
}

export function deleteForm(formId: string): Promise<void> {
  return request<void>(`/api/v1/forms/${formId}`, {
    method: "DELETE",
  });
}
