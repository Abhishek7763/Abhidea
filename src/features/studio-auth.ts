import { cookies } from "next/headers";

export type StudioRole = "admin" | "creator";

export type ActiveStudioSession = Readonly<{
  status: "active";
  userId: string;
  email: string | null;
  role: StudioRole;
}>;

export type StudioSessionState =
  | ActiveStudioSession
  | Readonly<{ status: "signed-out" }>
  | Readonly<{ status: "refresh-required" }>
  | Readonly<{ status: "forbidden" }>;

export type StudioSignInResult =
  | Readonly<{ ok: true; session: ActiveStudioSession }>
  | Readonly<{ ok: false; reason: "invalid-credentials" | "not-authorized" | "configuration" }>;

const ACCESS_COOKIE = "abhidea-studio-access";
const REFRESH_COOKIE = "abhidea-studio-refresh";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

type AuthUser = Readonly<{
  id: string;
  email?: string | null;
}>;

type TokenPayload = Readonly<{
  access_token?: string;
  refresh_token?: string;
  user?: AuthUser;
}>;

type StudioMembershipRow = Readonly<{
  role?: unknown;
  status?: unknown;
}>;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase public configuration is missing.");
  }

  return { url, publishableKey };
}

function isStudioRole(value: unknown): value is StudioRole {
  return value === "admin" || value === "creator";
}

async function fetchAuthUser(accessToken: string): Promise<AuthUser | null> {
  const { url, publishableKey } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const body = (await response.json()) as Partial<AuthUser>;
  return typeof body.id === "string" ? { id: body.id, email: body.email ?? null } : null;
}

async function fetchMembership(accessToken: string, userId: string): Promise<StudioRole | null> {
  const { url, publishableKey } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/studio_members`);
  endpoint.searchParams.set("select", "role,status");
  endpoint.searchParams.set("user_id", `eq.${userId}`);
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const rows = (await response.json()) as StudioMembershipRow[];
  const membership = rows[0];
  if (!membership || membership.status !== "active" || !isStudioRole(membership.role)) return null;

  return membership.role;
}

async function remoteSignOut(accessToken: string) {
  try {
    const { url, publishableKey } = getSupabaseConfig();
    await fetch(`${url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
  } catch {
    // Local cookies are still cleared below. Remote logout failure must not trap the user.
  }
}

async function setSessionCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, accessToken, cookieOptions);
  cookieStore.set(REFRESH_COOKIE, refreshToken, cookieOptions);
}

async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  cookieStore.set(REFRESH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

export async function signInStudioMember(email: string, password: string): Promise<StudioSignInResult> {
  let config: ReturnType<typeof getSupabaseConfig>;
  try {
    config = getSupabaseConfig();
  } catch {
    return { ok: false, reason: "configuration" };
  }

  const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: config.publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!response.ok) return { ok: false, reason: "invalid-credentials" };

  const payload = (await response.json()) as TokenPayload;
  const accessToken = payload.access_token;
  const refreshToken = payload.refresh_token;
  const user = payload.user;

  if (!accessToken || !refreshToken || !user?.id) {
    return { ok: false, reason: "invalid-credentials" };
  }

  const role = await fetchMembership(accessToken, user.id);
  if (!role) {
    await remoteSignOut(accessToken);
    await clearSessionCookies();
    return { ok: false, reason: "not-authorized" };
  }

  await setSessionCookies(accessToken, refreshToken);
  return {
    ok: true,
    session: {
      status: "active",
      userId: user.id,
      email: user.email ?? null,
      role,
    },
  };
}

export async function inspectStudioSession(): Promise<StudioSessionState> {
  let configured = true;
  try {
    getSupabaseConfig();
  } catch {
    configured = false;
  }
  if (!configured) return { status: "signed-out" };

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!accessToken) {
    return refreshToken ? { status: "refresh-required" } : { status: "signed-out" };
  }

  const user = await fetchAuthUser(accessToken);
  if (!user) {
    return refreshToken ? { status: "refresh-required" } : { status: "signed-out" };
  }

  const role = await fetchMembership(accessToken, user.id);
  if (!role) return { status: "forbidden" };

  return {
    status: "active",
    userId: user.id,
    email: user.email ?? null,
    role,
  };
}

export async function refreshStudioSession(): Promise<ActiveStudioSession | null> {
  let config: ReturnType<typeof getSupabaseConfig>;
  try {
    config = getSupabaseConfig();
  } catch {
    await clearSessionCookies();
    return null;
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    await clearSessionCookies();
    return null;
  }

  const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: config.publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) {
    await clearSessionCookies();
    return null;
  }

  const payload = (await response.json()) as TokenPayload;
  const accessToken = payload.access_token;
  const nextRefreshToken = payload.refresh_token;
  const user = payload.user;

  if (!accessToken || !nextRefreshToken || !user?.id) {
    await clearSessionCookies();
    return null;
  }

  const role = await fetchMembership(accessToken, user.id);
  if (!role) {
    await remoteSignOut(accessToken);
    await clearSessionCookies();
    return null;
  }

  await setSessionCookies(accessToken, nextRefreshToken);
  return {
    status: "active",
    userId: user.id,
    email: user.email ?? null,
    role,
  };
}

export async function signOutStudioMember() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (accessToken) await remoteSignOut(accessToken);
  await clearSessionCookies();
}
