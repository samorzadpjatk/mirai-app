import {
  getServerUser,
  mapDatabaseUserToAuthUser,
} from "@integral-2025-app/auth";
import type { AuthUser } from "@integral-2025-app/auth";
import type { DatabaseUser } from "@integral-2025-app/common-types";
import { db } from "~/server/db";
import { createServerSupabaseClient } from "~/lib/supabase/server";

export async function getSession(): Promise<{
  user: AuthUser | null;
  authUserId: string | null;
} | null> {
  const supabase = await createServerSupabaseClient();
  const supabaseUser = await getServerUser(supabase);

  if (!supabaseUser) {
    return null;
  }

  const dbUser = await db.user.findUnique({
    where: { authUserId: supabaseUser.id },
  });

  if (!dbUser) {
    return {
      user: null,
      authUserId: supabaseUser.id,
    };
  }

  const authUser = mapDatabaseUserToAuthUser(dbUser as DatabaseUser);

  return {
    user: authUser,
    authUserId: supabaseUser.id,
  };
}

export async function requireAuth(): Promise<{
  user: AuthUser;
  dbUser: DatabaseUser;
}> {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const dbUser = await db.user.findUnique({
    where: { authUserId: session.authUserId! },
  });

  if (!dbUser) {
    throw new Error("User not found in database");
  }

  const { user } = session;

  return {
    user,
    dbUser,
  };
}

export async function requireAdmin(): Promise<DatabaseUser> {
  const { dbUser } = await requireAuth();

  if (!dbUser.isAdmin) {
    throw new Error("Admin access required");
  }

  return dbUser;
}

export async function requireModerator(): Promise<DatabaseUser> {
  const { dbUser } = await requireAuth();

  if (!dbUser.isModerator && !dbUser.isAdmin) {
    throw new Error("Moderator access required");
  }

  return dbUser;
}
