import {
  getSession as getAuthSession,
  requireAuth as requireAuthBase,
  requireAdmin as requireAdminBase,
  requireModerator as requireModeratorBase,
} from "@integral-2025-app/auth";
import type { AuthUser, DatabaseUser } from "@integral-2025-app/auth";
import { db } from "~/server/db";
import { createServerSupabaseClient } from "~/lib/supabase/server";

async function getUserFromDb(authUserId: string): Promise<DatabaseUser | null> {
  return db.user.findUnique({
    where: { authUserId },
  }) as Promise<DatabaseUser | null>;
}

export async function getSession(): Promise<{
  user: AuthUser | null;
  authUserId: string | null;
} | null> {
  const supabase = await createServerSupabaseClient();
  return getAuthSession(supabase, getUserFromDb);
}

export async function requireAuth(): Promise<{
  user: AuthUser;
  dbUser: DatabaseUser;
}> {
  const supabase = await createServerSupabaseClient();
  return requireAuthBase(supabase, getUserFromDb);
}

export async function requireAdmin(): Promise<DatabaseUser> {
  const supabase = await createServerSupabaseClient();
  return requireAdminBase(supabase, getUserFromDb);
}

export async function requireModerator(): Promise<DatabaseUser> {
  const supabase = await createServerSupabaseClient();
  return requireModeratorBase(supabase, getUserFromDb);
}
