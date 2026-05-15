import type { SupabaseClient, SupabaseUser } from "@mirai-app/supabase";
import type { User, Role, DB } from "@mirai-app/db";
import { users } from "@mirai-app/db";
import { eq } from "drizzle-orm";
import type { AuthUser } from "@mirai-app/shared";

interface MinimalBuffer {
  from(input: string, encoding: "base64"): { toString(encoding: "utf-8"): string };
}

type AdminUserWithBan = SupabaseUser & { banned_until?: string | null };

const getGlobalBuffer = () => (globalThis as typeof globalThis & { Buffer?: MinimalBuffer }).Buffer;

const getGlobalAtob = () =>
  (globalThis as typeof globalThis & { atob?: (data: string) => string }).atob;

function decodeJwtPayload<T extends Record<string, unknown> = Record<string, unknown>>(
  token: string,
): T | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
  const atobFn = getGlobalAtob();
  const buffer = getGlobalBuffer();

  try {
    if (buffer) {
      const decoded = buffer.from(normalizedPayload, "base64").toString("utf-8");
      return JSON.parse(decoded) as T;
    }

    if (atobFn) {
      const binary = atobFn(normalizedPayload);
      const percentEncoded = Array.from(binary)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("");
      const decoded = decodeURIComponent(percentEncoded);
      return JSON.parse(decoded) as T;
    }

    console.error("Unable to decode JWT payload: missing base64 decoder");
    return null;
  } catch (error) {
    console.error("Error decoding JWT payload:", error);
    return null;
  }
}

function getTokenExpiry(accessToken: string) {
  const payload = decodeJwtPayload<{ exp?: number }>(accessToken);
  if (!payload?.exp) {
    return {
      expiresAt: null as number | null,
      expiresIn: null as number | null,
    };
  }

  const expiresAt = payload.exp;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const expiresIn = Math.max(expiresAt - nowInSeconds, 0);

  return { expiresAt, expiresIn };
}

export class AuthenticationError extends Error {
  constructor(message = "Not Authenticated") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message = "Missing Required Permissions") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getAuthServerUser(
  supabase: SupabaseClient,
  accessToken?: string,
): Promise<SupabaseUser | null> {
  // On the server (Node, WebSockets, API routes) we generally authenticate
  // using an explicit access token (e.g. Authorization header or WS
  // connection params). If there is no token, treat the request as
  // unauthenticated instead of querying Supabase Auth with an empty session,
  // which would cause an AuthSessionMissingError noise in logs.
  if (!accessToken) {
    return null;
  }

  const response = await supabase.auth.getUser(accessToken);
  const {
    data: { user },
    error,
  } = response;

  if (error) {
    console.error("Error occurred while fetching user:", error);
    return null;
  }

  return user;
}

export async function getAuthServerSession(supabase: SupabaseClient, accessToken?: string) {
  if (!accessToken) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    if (error) {
      console.error("Error occurred while fetching user from token:", error);
    }
    return null;
  }

  const { expiresAt, expiresIn } = getTokenExpiry(accessToken);

  return {
    user,
    authUserId: user.id,
    access_token: accessToken,
    refresh_token: null,
    token_type: "bearer",
    expires_in: expiresIn,
    expires_at: expiresAt ?? null,
  } as const;
}

const toDisplayName = (
  firstName: string | null,
  lastName: string | null,
  fallback?: string | null,
): string | null => {
  const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return fallback?.trim() ?? null;
};

export function mapDatabaseUserToAuthUser(
  dbUser: User | null,
  supabaseUser?: SupabaseUser | null,
): AuthUser | null {
  if (!dbUser?.authUserId) {
    return null;
  }

  const email = supabaseUser?.email ?? null;
  const emailVerified = supabaseUser?.email_confirmed_at
    ? new Date(supabaseUser.email_confirmed_at)
    : null;

  const displayName = toDisplayName(
    dbUser.firstName,
    dbUser.lastName,
    email?.split("@")[0] ?? null,
  );

  return {
    id: dbUser.id,
    authUserId: dbUser.authUserId,
    email,
    firstName: dbUser.firstName ?? null,
    lastName: dbUser.lastName ?? null,
    name: displayName,
    emailVerified,
    role: dbUser.role,
  };
}

export function parseRolesFromToken(token: string | undefined): string[] {
  if (!token) return [];

  const payload = decodeJwtPayload<{ groups?: string[] }>(token);

  if (!payload?.groups) {
    return [];
  }

  return payload.groups;
}

export function hasRequiredRole(groups: string[], requiredRole: string): boolean {
  return groups.includes(requiredRole);
}

/**
 * Get the current session with user information
 * @param supabase - Supabase client instance
 * @returns Session object with user and authUserId, or null if not authenticated
 */
export async function getSession(
  db: DB,
  supabase: SupabaseClient,
  accessToken?: string,
): Promise<{
  user: AuthUser | null;
  authUserId: string | null;
} | null> {
  const supabaseUser = await getAuthServerUser(supabase, accessToken);

  if (!supabaseUser) {
    return null;
  }

  const dbUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.authUserId, supabaseUser.id),
  });

  if (!dbUser) {
    return {
      user: null,
      authUserId: supabaseUser.id,
    };
  }

  const authUser = mapDatabaseUserToAuthUser(dbUser, supabaseUser);

  return {
    user: authUser,
    authUserId: supabaseUser.id,
  };
}

export async function requireAuth(
  db: DB,
  supabase: SupabaseClient,
  accessToken?: string,
): Promise<{
  user: AuthUser;
  dbUser: User;
}> {
  const session = await getSession(db, supabase, accessToken);

  if (!session?.user) {
    throw new AuthenticationError("Unauthorized");
  }

  const adminLookup = await supabase.auth.admin.getUserById(session.authUserId!);

  if (adminLookup.error) {
    console.warn(
      `[Auth] Failed to check ban status for ${session.authUserId}: ${adminLookup.error.message}`,
    );
  } else {
    const adminUser = adminLookup.data.user as AdminUserWithBan | null;
    const bannedUntilRaw = adminUser?.banned_until ?? null;
    if (bannedUntilRaw) {
      const bannedUntil = new Date(bannedUntilRaw);
      if (!Number.isNaN(bannedUntil.getTime()) && bannedUntil.getTime() > Date.now()) {
        throw new AuthenticationError("User is banned");
      }
    }
  }

  const dbUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.authUserId, session.authUserId!),
  });

  if (!dbUser) {
    throw new AuthenticationError("User not found in database");
  }

  const { user } = session;

  return {
    user,
    dbUser,
  };
}

export async function requireAdmin(
  db: DB,
  supabase: SupabaseClient,
  accessToken?: string,
): Promise<User> {
  const { dbUser } = await requireAuth(db, supabase, accessToken);

  if (dbUser.role !== "ADMIN") {
    throw new AuthorizationError("Admin access required");
  }

  return dbUser;
}

export async function requireModerator(
  db: DB,
  supabase: SupabaseClient,
  accessToken?: string,
): Promise<User> {
  const { dbUser } = await requireAuth(db, supabase, accessToken);

  if (dbUser.role !== "MODERATOR" && dbUser.role !== "ADMIN") {
    throw new AuthorizationError("Moderator access required");
  }

  return dbUser;
}

export async function syncUserToDatabase(
  supabaseUser: SupabaseUser,
  upsertUser: (data: {
    authUserId: string;
    firstName: string | null;
    lastName: string | null;
    role: Role;
  }) => Promise<User>,
): Promise<User> {
  const rawRole =
    (supabaseUser.app_metadata?.role as string | undefined) ??
    (supabaseUser.user_metadata?.role as string | undefined) ??
    "user";

  const mapRole = (value: string | undefined): Role => {
    switch (value?.toLowerCase()) {
      case "admin":
        return "ADMIN";
      case "moderator":
        return "MODERATOR";
      case "service":
        return "SERVICE";
      default:
        return "USER";
    }
  };

  const role = mapRole(rawRole);

  const parseName = (
    fullName?: string | null,
  ): { firstName: string | null; lastName: string | null } => {
    if (!fullName?.trim()) return { firstName: null, lastName: null };
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0] ?? null, lastName: null };
    }
    return {
      firstName: parts[0] ?? null,
      lastName: parts.slice(1).join(" "),
    };
  };

  const { firstName, lastName } = parseName(
    (supabaseUser.user_metadata?.name as string | undefined) ??
      supabaseUser.email?.split("@")[0] ??
      null,
  );

  const safeFirstName = firstName ?? null;
  const safeLastName = lastName ?? null;

  return await upsertUser({
    authUserId: supabaseUser.id,
    firstName: safeFirstName,
    lastName: safeLastName,
    role,
  });
}
