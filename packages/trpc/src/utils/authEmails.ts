import type { SupabaseClient } from "@integral-2025-app/supabase";

export const buildAuthEmailLookup = async (
  supabase: SupabaseClient,
  authUserIds: (string | null | undefined)[],
): Promise<Map<string, string | null>> => {
  const uniqueIds = Array.from(
    new Set(authUserIds.filter((id): id is string => Boolean(id))),
  );

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const entries = await Promise.all(
    uniqueIds.map(async (authUserId) => {
      const { data, error } = await supabase.auth.admin.getUserById(authUserId);
      if (error) {
        console.warn(
          `[Auth] Failed to fetch auth user ${authUserId}: ${error.message}`,
        );
        return [authUserId, null] as const;
      }

      return [authUserId, data.user?.email ?? null] as const;
    }),
  );

  return new Map(entries);
};

export const resolveAuthEmail = (
  emailByAuthUserId: Map<string, string | null>,
  authUserId?: string | null,
): string | null => {
  if (!authUserId) return null;
  return emailByAuthUserId.get(authUserId) ?? null;
};
