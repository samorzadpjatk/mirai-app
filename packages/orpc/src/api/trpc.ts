/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the oRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { os, ORPCError } from "@orpc/server";

import {
  requireAdmin,
  requireAuth,
  requireModerator,
  AuthenticationError,
  AuthorizationError,
} from "@mirai-app/auth";
import { createSupabaseClient, type SupabaseClient } from "@mirai-app/supabase";
import { createDb, type DB, userAgents } from "@mirai-app/db";
import { logger } from "../utils/logger";

const getAccessTokenFromHeaders = (headers: Headers): string | null => {
  const authorization = headers.get("authorization") ?? headers.get("Authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
};

const getAccessToken = (
  headers: Headers,
  connectionParams?: Record<string, string>,
): string | null => {
  // First try to get token from Authorization header
  const headerToken = getAccessTokenFromHeaders(headers);
  if (headerToken) {
    return headerToken;
  }

  if (connectionParams && "authorization" in connectionParams) {
    const token = connectionParams.authorization;
    if (token && token.trim().length > 0) {
      return token.trim();
    }
  }

  return null;
};

const getPlatformFromUserAgent = (userAgent: string | null): "ios" | "android" | null => {
  if (!userAgent) return null;

  // iOS User Agent pattern: MIRAI/21 CFNetwork/3860.300.31 Darwin/25.2.0
  const iosPattern = /^MIRAI\/\d+ CFNetwork\/[\d.]+ Darwin\/[\d.]+$/;

  // Android User Agent pattern: okhttp/4.12.0
  const androidPattern = /^okhttp\/[\d.]+$/;

  if (iosPattern.test(userAgent)) return "ios";
  if (androidPattern.test(userAgent)) return "android";
  return null;
};

/**
 * @public
 * Base context type used by all oRPC procedures. Must remain exported for TypeScript
 * inference in router types (TS4023).
 */
export interface ORPCContext {
  db: DB;
  supabase: SupabaseClient;
  headers: Headers;
  accessToken: string | null;
}

export interface TRPCContext extends ORPCContext, Record<string, unknown> {}

// On the backend we use a single SERVICE_ROLE Supabase client (singleton).
// Follow the Drizzle pattern: a module-level lazy-initialized singleton so we avoid adding globals.
let supabase: SupabaseClient | undefined;

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for an oRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 */
export const createORPCContext = (opts: {
  headers: Headers;
  databaseUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
  connectionParams?: Record<string, string>;
}): TRPCContext => {
  supabase ??= createSupabaseClient(opts.supabaseUrl, opts.supabaseKey, undefined, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Extract User-Agent from connection params for WebSocket connections
  const headers = new Headers(opts.headers);
  for (const [key, value] of Object.entries(opts.connectionParams ?? {})) {
    headers.set(key, value);
  }

  const accessToken = getAccessToken(headers, opts.connectionParams);

  const db = createDb(opts.databaseUrl);

  return {
    db,
    supabase,
    headers,
    accessToken,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the oRPC API is initialized. We use the `os` builder with typed context.
 */
const base = os.$context<ORPCContext>();

let _telemetryEnabled = false;

export function enableUserAgentTelemetry(): void {
  _telemetryEnabled = true;
}

// Global middleware for request telemetry
const mobileAppMiddleware = base.middleware(async ({ context, next, path }) => {
  if (!_telemetryEnabled) {
    return next();
  }

  const userAgent = context.headers.get("user-agent") ?? context.headers.get("User-Agent");

  const platform = getPlatformFromUserAgent(userAgent);

  // Log user agent for update rollout analysis
  try {
    if (userAgent && platform) {
      // Log to database asynchronously (fire and forget)
      void context.db
        .insert(userAgents)
        .values({
          userAgent,
          platform,
          userId: null,
          endpoint: path.join("/"),
        })
        .catch((error: unknown) => {
          logger.error(error, "[UserAgent Logging] Failed to log user agent");
        });
    }
  } catch (error) {
    logger.error(error, "[UserAgent Logging] Unexpected error");
  }

  return next();
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your oRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * Base procedure
 * All procedures pass through shared telemetry middleware.
 */
const baseProcedure = base.use(mobileAppMiddleware);

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your oRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = baseProcedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `context.user` and `context.dbUser` are available.
 */
export const protectedProcedure = baseProcedure.use(async ({ context, next }) => {
  try {
    const { user, dbUser } = await requireAuth(
      context.db,
      context.supabase,
      context.accessToken ?? undefined,
    );

    return next({
      context: {
        user,
        dbUser,
      },
    });
  } catch (err) {
    if (err instanceof AuthenticationError) {
      throw new ORPCError("UNAUTHORIZED", { message: err.message });
    }
    throw err;
  }
});

/**
 * Moderator (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to moderators or admins, use this.
 */
export const moderatorProcedure = baseProcedure.use(async ({ context, next }) => {
  try {
    const dbUser = await requireModerator(
      context.db,
      context.supabase,
      context.accessToken ?? undefined,
    );
    return next({
      context: {
        dbUser,
      },
    });
  } catch (err) {
    if (err instanceof AuthenticationError) {
      throw new ORPCError("UNAUTHORIZED", { message: err.message });
    }
    if (err instanceof AuthorizationError) {
      throw new ORPCError("FORBIDDEN", { message: err.message });
    }
    throw err;
  }
});

export const mobileAppProcedure = base.use(mobileAppMiddleware);

export const adminProcedure = baseProcedure.use(async ({ context, next }) => {
  try {
    const dbUser = await requireAdmin(
      context.db,
      context.supabase,
      context.accessToken ?? undefined,
    );
    return next({
      context: {
        dbUser,
      },
    });
  } catch (err) {
    if (err instanceof AuthenticationError) {
      throw new ORPCError("UNAUTHORIZED", { message: err.message });
    }
    if (err instanceof AuthorizationError) {
      throw new ORPCError("FORBIDDEN", { message: err.message });
    }
    throw err;
  }
});

export const createORPCRouter = <T extends Record<string, unknown>>(routes: T): T => routes;

// Shim for tRPC's tracked() subscription helper (oRPC subscriptions yield directly)
export const tracked = <T>(_connectionId: string, data: T): T => data;
