import type { SupabaseClient, SupabaseUser } from "@mirai-app/supabase";
import { logger } from "./logger";

interface SupabaseAdminMetadata {
  ban_reason?: string | null;
  [key: string]: unknown;
}

interface SupabaseAdminUser extends SupabaseUser {
  banned_until?: string;
  app_metadata: SupabaseUser["app_metadata"] & SupabaseAdminMetadata;
}

export const buildAuthEmailLookup = async (
  supabase: SupabaseClient,
  authUserIds: (string | null | undefined)[],
): Promise<Map<string, string | null>> => {
  const uniqueIds = Array.from(new Set(authUserIds.filter((id): id is string => Boolean(id))));

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const entries = await Promise.all(
    uniqueIds.map(async (authUserId) => {
      const { data, error } = await supabase.auth.admin.getUserById(authUserId);
      if (error) {
        const warnMsg = `[Auth] Failed to fetch auth user ${authUserId}: ${error.message}`;
        logger.warn({ authUserId, error: error.message }, warnMsg);
        return [authUserId, null] as const;
      }

      return [authUserId, data.user?.email ?? null] as const;
    }),
  );

  return new Map(entries);
};

export interface AuthUserSummary {
  email: string;
  bannedUntil: string;
  banReason: string;
  isBanned: boolean;
}

export const buildAuthUserSummaryLookup = async (
  supabase: SupabaseClient,
  authUserIds: (string | null | undefined)[],
): Promise<Map<string, AuthUserSummary>> => {
  const uniqueIds = Array.from(new Set(authUserIds.filter((id): id is string => Boolean(id))));

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const now = Date.now();

  const entries = await Promise.all(
    uniqueIds.map(async (authUserId) => {
      const { data, error } = await supabase.auth.admin.getUserById(authUserId);
      if (error) {
        const warnMsg = `[Auth] Failed to fetch auth user ${authUserId}: ${error.message}`;
        logger.warn({ authUserId, error: error.message }, warnMsg);
        return [
          authUserId,
          {
            email: "",
            bannedUntil: "",
            banReason: "",
            isBanned: false,
          },
        ] as const;
      }

      const user = data.user as SupabaseAdminUser | null;
      const bannedUntilRaw = user?.banned_until ?? "";
      const bannedUntil = bannedUntilRaw && bannedUntilRaw.length > 0 ? bannedUntilRaw : "";
      const bannedUntilDate = bannedUntil ? new Date(bannedUntil) : null;
      const isBanned =
        !!bannedUntilDate &&
        !Number.isNaN(bannedUntilDate.getTime()) &&
        bannedUntilDate.getTime() > now;
      const banReason = user?.app_metadata?.ban_reason ?? "";

      return [
        authUserId,
        {
          email: user?.email ?? "",
          bannedUntil,
          banReason,
          isBanned,
        },
      ] as const;
    }),
  );

  return new Map(entries);
};

export const resolveAuthEmail = (
  emailByAuthUserId: Map<string, string | null>,
  authUserId?: string | null,
): string => {
  if (!authUserId) return "";
  return emailByAuthUserId.get(authUserId) ?? "";
};
