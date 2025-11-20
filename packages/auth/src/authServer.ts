import type {
  SupabaseClient,
  User as SupabaseUser,
} from "@supabase/supabase-js";
import type { User } from "@integral-2025-app/common-types";
import type { AuthUser } from "./types";

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
): Promise<SupabaseUser | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error occurred while fetching user:", error);
    return null;
  }

  return user;
}

export async function getAuthServerSession(supabase: SupabaseClient) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error occurred while fetching session:", error);
    return null;
  }

  return session;
}

export function mapDatabaseUserToAuthUser(
  dbUser: User | null,
): AuthUser | null {
  if (!dbUser?.authUserId) {
    return null;
  }

  return {
    id: dbUser.id,
    authUserId: dbUser.authUserId,
    email: dbUser.email,
    name: dbUser.name,
    emailVerified: dbUser.emailVerified,
  };
}

export function parseRolesFromToken(token: string | undefined): string[] {
  if (!token) return [];

  try {
    const [, payload] = token.split(".");
    if (!payload) return [];

    const decoded = JSON.parse(atob(payload)) as { groups?: string[] };
    return decoded.groups ?? [];
  } catch (error) {
    console.error("Error parsing roles from token:", error);
    return [];
  }
}

export function hasRequiredRole(
  groups: string[],
  requiredRole: string,
): boolean {
  return groups.includes(requiredRole);
}

/**
 * Get the current session with user information
 * @param supabase - Supabase client instance
 * @param getUserFromDb - Function to fetch user from database by authUserId
 * @returns Session object with user and authUserId, or null if not authenticated
 */
export async function getSession(
  supabase: SupabaseClient,
  getUserFromDb: (authUserId: string) => Promise<User | null>,
): Promise<{
  user: AuthUser | null;
  authUserId: string | null;
} | null> {
  const supabaseUser = await getAuthServerUser(supabase);

  if (!supabaseUser) {
    return null;
  }

  const dbUser = await getUserFromDb(supabaseUser.id);

  if (!dbUser) {
    return {
      user: null,
      authUserId: supabaseUser.id,
    };
  }

  const authUser = mapDatabaseUserToAuthUser(dbUser);

  return {
    user: authUser,
    authUserId: supabaseUser.id,
  };
}

export async function requireAuth(
  supabase: SupabaseClient,
  getUserFromDb: (authUserId: string) => Promise<User | null>,
): Promise<{
  user: AuthUser;
  dbUser: User;
}> {
  const session = await getSession(supabase, getUserFromDb);

  if (!session?.user) {
    throw new AuthenticationError("Unauthorized");
  }

  const dbUser = await getUserFromDb(session.authUserId!);

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
  supabase: SupabaseClient,
  getUserFromDb: (authUserId: string) => Promise<User | null>,
): Promise<User> {
  const { dbUser } = await requireAuth(supabase, getUserFromDb);

  if (!dbUser.isAdmin) {
    throw new AuthorizationError("Admin access required");
  }

  return dbUser;
}

export async function requireModerator(
  supabase: SupabaseClient,
  getUserFromDb: (authUserId: string) => Promise<User | null>,
): Promise<User> {
  const { dbUser } = await requireAuth(supabase, getUserFromDb);

  if (!dbUser.isModerator && !dbUser.isAdmin) {
    throw new AuthorizationError("Moderator access required");
  }

  return dbUser;
}

export async function syncUserToDatabase(
  supabaseUser: SupabaseUser,
  upsertUser: (data: {
    authUserId: string;
    email: string;
    name: string | null;
    emailVerified: Date | null;
    isAdmin: boolean;
    isModerator: boolean;
    isServiceAccount: boolean;
  }) => Promise<User>,
): Promise<User> {
  const role =
    (supabaseUser.app_metadata?.role as string | undefined) ??
    (supabaseUser.user_metadata?.role as string | undefined) ??
    "user";
  const isAdmin = role === "admin" || role === "tech";
  const isModerator = role === "moderator";
  const isServiceAccount = role === "service";

  return await upsertUser({
    authUserId: supabaseUser.id,
    email: supabaseUser.email!,
    name:
      (supabaseUser.user_metadata?.name as string | undefined) ??
      supabaseUser.email?.split("@")[0] ??
      null,
    emailVerified: supabaseUser.email_confirmed_at
      ? new Date(supabaseUser.email_confirmed_at)
      : null,
    isAdmin,
    isModerator,
    isServiceAccount,
  });
}
