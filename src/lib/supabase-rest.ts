const SUPABASE_URL = "https://hvnvsawgugsfyphhhkpt.supabase.co";
const SUPABASE_KEY = "sb_publishable_-bf8mNYQrYdlBrSNdUDmAw_I5TWmuAZ";
const SESSION_KEY = "papo-radio-session";
const ORG_KEY = "papo-radio-org";

type AuthUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };
type Session = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  user: AuthUser;
};
export type AuthRedirectResult = false | "authenticated" | "recovery";

function isBrowser() {
  return typeof window !== "undefined";
}

function appOrigin() {
  return isBrowser()
    ? window.location.origin
    : "https://radio-hub-connect-live-bvarajao.vercel.app";
}

export function getSession(): Session | null {
  if (!isBrowser()) return null;
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as Session | null;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null) {
  if (!isBrowser()) return;
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ORG_KEY);
    return;
  }
  const next = {
    ...session,
    expires_at:
      session.expires_at ??
      (session.expires_in ? Math.floor(Date.now() / 1000) + session.expires_in : undefined),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
}

export function getCurrentUser() {
  return getSession()?.user ?? null;
}

export function getOrganizationId() {
  return isBrowser() ? localStorage.getItem(ORG_KEY) : null;
}

function friendlyDatabaseError(data: any) {
  const raw = String(data?.message || data?.details || data?.hint || "Erro ao acessar o banco");
  const context = `${raw} ${String(data?.details || "")} ${String(data?.hint || "")}`;

  if (data?.code === "23505" || /duplicate key/i.test(context)) {
    if (context.includes("radios_organization_id_code_key"))
      return "Este código patrimonial já está cadastrado.";
    if (context.includes("radios_org_serial_unique_idx"))
      return "Este número de série já está cadastrado.";
    if (context.includes("radio_models_organization_id_manufacturer_model_key"))
      return "Este modelo já existe. Selecione-o na lista de modelos existentes.";
    if (context.includes("accessories_organization_id_name_key"))
      return "Já existe um acessório com este nome.";
    if (context.includes("rentals_organization_id_code_key"))
      return "Houve conflito na numeração da locação. Tente salvar novamente.";
    if (context.includes("clients_org_document_unique"))
      return "Já existe um cliente com este CPF/CNPJ.";
    return "Já existe um cadastro com estes dados. Revise as informações e tente novamente.";
  }

  if (data?.code === "23503")
    return "Este registro está sendo usado em outra parte do sistema e não pode ser removido diretamente.";
  if (data?.code === "23514") return raw;
  if (/permission denied|row-level security/i.test(context))
    return "Seu acesso não permite esta operação. Saia e entre novamente; se persistir, revise as permissões do usuário.";
  return raw;
}

async function authRequest(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      data?.msg || data?.error_description || data?.message || "Falha de autenticação",
    );
  return data;
}

async function fetchUser(accessToken: string): Promise<AuthUser> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Não foi possível carregar o usuário");
  return data as AuthUser;
}

export async function signIn(email: string, password: string) {
  const data = await authRequest("token?grant_type=password", { email, password });
  saveSession(data as Session);
  await ensureOrganization();
  return data as Session;
}

export async function signUp(email: string, password: string, fullName?: string) {
  const redirectTo = encodeURIComponent(`${appOrigin()}/`);
  const data = await authRequest(`signup?redirect_to=${redirectTo}`, {
    email,
    password,
    data: { full_name: fullName || "" },
  });
  if (data.access_token) {
    saveSession(data as Session);
    await ensureOrganization();
  }
  return data;
}

export async function resendSignupConfirmation(email: string) {
  const redirectTo = encodeURIComponent(`${appOrigin()}/`);
  return authRequest(`resend?redirect_to=${redirectTo}`, { type: "signup", email });
}

export async function sendPasswordReset(email: string) {
  const redirectTo = encodeURIComponent(`${appOrigin()}/`);
  return authRequest(`recover?redirect_to=${redirectTo}`, { email });
}

export async function completeAuthRedirect(): Promise<AuthRedirectResult> {
  if (!isBrowser() || !window.location.hash) return false;
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return false;

  const expiresIn = Number(params.get("expires_in") || "3600");
  const user = await fetchUser(accessToken);
  saveSession({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    user,
  });
  const type = params.get("type") === "recovery" ? "recovery" : "authenticated";
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.search,
  );
  if (type === "authenticated") await ensureOrganization();
  return type;
}

export async function updatePassword(password: string) {
  if (password.length < 6) throw new Error("A nova senha precisa ter pelo menos 6 caracteres.");
  const token = await accessToken();
  if (!token) throw new Error("O link de recuperação expirou. Solicite um novo link.");
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data?.msg || data?.message || "Não foi possível alterar a senha.");
  const session = getSession();
  if (session) saveSession({ ...session, user: data as AuthUser });
  await ensureOrganization();
  return data as AuthUser;
}

export function signOut() {
  saveSession(null);
}

async function refreshSession() {
  const session = getSession();
  if (!session?.refresh_token) return null;
  try {
    const data = await authRequest("token?grant_type=refresh_token", {
      refresh_token: session.refresh_token,
    });
    saveSession(data as Session);
    return data as Session;
  } catch {
    saveSession(null);
    return null;
  }
}

async function accessToken() {
  let session = getSession();
  if (!session) return null;
  if (session.expires_at && session.expires_at <= Math.floor(Date.now() / 1000) + 30)
    session = await refreshSession();
  return session?.access_token ?? null;
}

export async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  const headers = new Headers(init.headers || {});
  headers.set("apikey", SUPABASE_KEY);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers });
  if (response.status === 401) {
    await refreshSession();
    throw new Error("Sessão expirada. Atualize a página.");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(friendlyDatabaseError(data));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function ensureOrganization() {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuário não autenticado");
  const memberships = await rest<Array<{ organization_id: string; role: string }>>(
    `organization_members?user_id=eq.${user.id}&select=organization_id,role&limit=1`,
  );
  if (memberships[0]) {
    if (isBrowser()) localStorage.setItem(ORG_KEY, memberships[0].organization_id);
    return memberships[0].organization_id;
  }
  const orgs = await rest<Array<{ id: string }>>("organizations?select=id", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ name: "Papo de Produtor", created_by: user.id }),
  });
  const orgId = orgs[0]?.id;
  if (!orgId) throw new Error("Não foi possível criar a organização");
  await rest("organization_members", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ organization_id: orgId, user_id: user.id, role: "owner" }),
  });
  await rest("profiles", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: user.id,
      full_name: String(user.user_metadata?.["full_name"] || "") || null,
    }),
  }).catch(() => undefined);
  if (isBrowser()) localStorage.setItem(ORG_KEY, orgId);
  return orgId;
}

export async function requireOrganization() {
  return getOrganizationId() || ensureOrganization();
}
