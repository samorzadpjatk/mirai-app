/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the oRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { os, ORPCError } from "@orpc/server";
import { env } from "bun";

import { timingSafeEqual } from "crypto";
import {
  AuthenticationError,
  AuthorizationError,
  requireAdmin,
  requireAuth,
  requireModerator,
} from "@mirai-app/auth";
import { type DB, createDb } from "@mirai-app/db";
import { type SupabaseClient, createSupabaseClient } from "@mirai-app/supabase";
import { logger } from "../utils/logger";
import { createTimingInterceptor } from "./timing";

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

export interface RequestContext extends ORPCContext, Record<string, unknown> {}

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
}): RequestContext => {
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

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your oRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * Base procedure
 */
// Every procedure is timed. Nothing else on the request path records how long a
// call took -- Kong only sees Supabase traffic and the reverse proxy runs on a
// host we cannot read -- so without this a slow screen cannot be attributed to
// any particular call. Attached to the base builder so a new router cannot
// forget it, and placed before the auth middleware so the reported time includes
// authentication.
// The cast is confined to this line: the middleware only measures elapsed time
// and returns oRPC's own result untouched, but its pass-through signature does
// not line up with the exact `MiddlewareResult` context generic oRPC infers here.
const baseProcedure = base.use(
  createTimingInterceptor({ logger }) as unknown as Parameters<typeof base.use>[0],
);

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

export const mobileAppProcedure = base;

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

/**
 * Service Account procedure
 *
 * For service-to-service communication (e.g., notification-sender microservice).
 * Validates x-service-token header against SERVICE_ACCOUNT_TOKEN env var using
 * timing-safe comparison to prevent timing attacks.
 */
export const serviceAccountProcedure = baseProcedure.use(async ({ context, next }) => {
  const serviceToken = context.headers.get("x-service-token");
  const expectedToken = env.SERVICE_ACCOUNT_TOKEN;

  if (!expectedToken) {
    logger.error("SERVICE_ACCOUNT_TOKEN not configured");
    throw new ORPCError("FORBIDDEN", { message: "Service authentication not configured" });
  }

  if (!serviceToken) {
    throw new ORPCError("FORBIDDEN", { message: "Missing service token" });
  }

  try {
    const expectedBuffer = Buffer.from(expectedToken);
    const actualBuffer = Buffer.from(serviceToken);

    if (expectedBuffer.length !== actualBuffer.length) {
      throw new ORPCError("FORBIDDEN", { message: "Invalid service token" });
    }

    if (!timingSafeEqual(expectedBuffer, actualBuffer)) {
      throw new ORPCError("FORBIDDEN", { message: "Invalid service token" });
    }
  } catch (err) {
    if (err instanceof ORPCError) {
      throw err;
    }
    logger.error(err, "Service token validation error");
    throw new ORPCError("FORBIDDEN", { message: "Invalid service token" });
  }

  return next({
    context: {
      serviceAuthenticated: true,
    },
  });
});

export const createORPCRouter = <T extends Record<string, unknown>>(routes: T): T => routes;

// Shim for oRPC's tracked() subscription helper (oRPC subscriptions yield directly)
export const tracked = <T>(_connectionId: string, data: T): T => data;
