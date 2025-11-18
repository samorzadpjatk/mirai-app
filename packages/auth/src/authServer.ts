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
  if (!dbUser?.supabaseUserId) {
    return null;
  }

  return {
    id: dbUser.id,
    supabaseUserId: dbUser.supabaseUserId,
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
