import { GraphQLError } from "graphql";
import { builder } from "../../builder.js";
import { BanStatusType, BanStatusWithExistenceType } from "./types.js";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";

/**
 * Admin user with ban metadata from Supabase
 */
type AdminUserWithBan = {
  id: string;
  banned_until?: string | null;
};

/**
 * Decode JWT payload without verification
 */
function decodeJwtPayload<T extends Record<string, unknown>>(
  token: string,
): T | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");

  try {
    const buffer = (
      globalThis as typeof globalThis & {
        Buffer?: {
          from: (
            input: string,
            encoding: string,
          ) => { toString: (encoding: string) => string };
        };
      }
    ).Buffer;

    if (buffer) {
      const decoded = buffer
        .from(normalizedPayload, "base64")
        .toString("utf-8");
      return JSON.parse(decoded) as T;
    }

    // Browser fallback
    const binary = atob(normalizedPayload);
    const percentEncoded = Array.from(binary)
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("");
    const decoded = decodeURIComponent(percentEncoded);
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

/**
 * Check ban status using Supabase admin API
 */
async function checkBanStatusWithSupabase(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<{
  banned: boolean;
  bannedUntil: string | null;
  reason: string | null;
}> {
  try {
    const adminLookup = await supabase.auth.admin.getUserById(authUserId);

    if (adminLookup.error || !adminLookup.data.user) {
      return {
        banned: false,
        bannedUntil: null,
        reason: null,
      };
    }

    const adminUser = adminLookup.data.user as AdminUserWithBan;
    const bannedUntilRaw = adminUser?.banned_until ?? null;

    if (bannedUntilRaw) {
      const bannedUntil = new Date(bannedUntilRaw);
      if (
        !Number.isNaN(bannedUntil.getTime()) &&
        bannedUntil.getTime() > Date.now()
      ) {
        return {
          banned: true,
          bannedUntil: bannedUntilRaw,
          reason: null,
        };
      }
    }

    return {
      banned: false,
      bannedUntil: null,
      reason: null,
    };
  } catch {
    return {
      banned: false,
      bannedUntil: null,
      reason: null,
    };
  }
}

/**
 * Ban Status Queries
 */
export const banStatusQueries = builder.queryFields((t) => ({
  /**
   * Check ban status for the currently authenticated user
   */
  checkBanStatus: t.field({
    type: BanStatusType,
    description: "Check ban status for the current authenticated user",
    resolve: async (
      _parent,
      _args,
      ctx: {
        supabase: SupabaseClient;
        authContext?: {
          session: {
            accessToken: string;
          };
        };
      },
    ): Promise<{
      banned: boolean;
      bannedUntil: string | null;
      reason: string | null;
    }> => {
      // If not authenticated, return non-banned status
      if (!ctx.authContext?.session?.accessToken) {
        return {
          banned: false,
          bannedUntil: null,
          reason: null,
        };
      }

      // Decode the token to get the auth user ID
      const payload = decodeJwtPayload<{ sub?: string }>(
        ctx.authContext.session.accessToken,
      );
      const authUserId = payload?.sub;

      if (!authUserId) {
        return {
          banned: false,
          bannedUntil: null,
          reason: null,
        };
      }

      // Check ban status using Supabase admin API
      return checkBanStatusWithSupabase(ctx.supabase, authUserId);
    },
  }),

  /**
   * Check ban status by email (for pre-login verification)
   */
  checkBanStatusByEmail: t.field({
    type: BanStatusWithExistenceType,
    description: "Check ban status by email address (pre-login check)",
    args: {
      email: t.arg.string({
        required: true,
        description: "Email address to check",
      }),
    },
    resolve: async (
      _parent,
      args: { email: string },
      ctx: {
        supabase: SupabaseClient;
      },
    ): Promise<{
      exists: boolean;
      banned: boolean;
      bannedUntil: string | null;
      reason: string | null;
    }> => {
      try {
        // Look up user by email in Supabase auth
        const userLookup = await ctx.supabase.auth.admin.listUsers();

        if (userLookup.error) {
          return {
            exists: false,
            banned: false,
            bannedUntil: null,
            reason: null,
          };
        }

        const user = userLookup.data.users.find(
          (u) => u.email?.toLowerCase() === args.email.toLowerCase(),
        );

        if (!user) {
          return {
            exists: false,
            banned: false,
            bannedUntil: null,
            reason: null,
          };
        }

        // Check ban status using Supabase admin API
        const banStatus = await checkBanStatusWithSupabase(
          ctx.supabase,
          user.id,
        );

        return {
          exists: true,
          ...banStatus,
        };
      } catch {
        return {
          exists: false,
          banned: false,
          bannedUntil: null,
          reason: null,
        };
      }
    },
  }),
}));
