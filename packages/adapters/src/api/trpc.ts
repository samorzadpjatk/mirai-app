/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import {
  requireAdmin,
  requireAuth,
  requireModerator,
  AuthenticationError,
  AuthorizationError,
} from "../controllers/auth/authServer";
import { TRPCError } from "@trpc/server";
import type { SupabaseClient } from "@repo/frameworks/supabase";
import type { PrismaClient } from "@repo/frameworks/prisma";

const getAccessTokenFromHeaders = (headers: Headers): string | null => {
  const authorization =
    headers.get("authorization") ?? headers.get("Authorization");
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
    console.log("[Auth] Token found in headers");
    return headerToken;
  }

  console.log(
    "[Auth] Checking connectionParams:",
    JSON.stringify(connectionParams),
  );

  // Try connectionParams (sent as first WebSocket message)
  if (connectionParams && "authorization" in connectionParams) {
    const token = connectionParams.authorization;
    console.log(
      "[Auth] authorization in connectionParams:",
      token ? "EXISTS" : "MISSING",
    );

    if (token && token.trim().length > 0) {
      console.log("[Auth] Token found in connectionParams");
      return token.trim();
    }
  }

  // Fallback: check for authorization query parameter (WebSocket upgrade workaround)
  // This is used because WebSocket connections via browser/React Native don't support custom headers
  const urlString = headers.get("x-original-url");
  if (urlString) {
    try {
      // Handle both absolute URLs and relative URLs (WebSocket connections)
      let url: URL;
      if (
        urlString.startsWith("http://") ||
        urlString.startsWith("https://") ||
        urlString.startsWith("ws://") ||
        urlString.startsWith("wss://")
      ) {
        // Absolute URL
        url = new URL(urlString);
      } else {
        // Relative URL - construct absolute URL for parsing
        // Use a dummy base URL since we only care about parsing query params
        url = new URL(urlString, "http://localhost");
      }

      const authParam = url.searchParams.get("authorization");
      if (authParam) {
        const [scheme, token] = authParam.split(" ");
        if (scheme?.toLowerCase() === "bearer" && token?.trim()) {
          console.log("[Auth] Token found in URL query params");
          return token.trim();
        }
      }
    } catch (err) {
      console.error("[Auth] Failed to parse URL:", err);
    }
  }

  console.log("[Auth] No token found");
  return null;
};

const getPlatformFromUserAgent = (
  userAgent: string | null,
): "ios" | "android" | null => {
  if (!userAgent) return null;

  // iOS User Agent pattern: MIRAI/21 CFNetwork/3860.300.31 Darwin/25.2.0
  const iosPattern = /^MIRAI\/\d+ CFNetwork\/[\d.]+ Darwin\/[\d.]+$/;

  // Android User Agent pattern: okhttp/4.12.0
  const androidPattern = /^okhttp\/[\d.]+$/;

  if (iosPattern.test(userAgent)) return "ios";
  if (androidPattern.test(userAgent)) return "android";
  return null;
};

export interface TRPCContext {
  db: PrismaClient;
  supabase: SupabaseClient;
  headers: Headers;
  accessToken: string | null;
}

// Supabase client is now passed via context parameter to maintain Clean Architecture
// and avoid runtime imports from frameworks layer.

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * The database client is now received via context creation instead of importing and
 * creating it directly. This removes the cyclic dependency between adapters and frameworks.
 *
 * The Supabase client is also received via context parameter, maintaining Clean Architecture
 * by avoiding runtime imports from the frameworks layer.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = (opts: {
  headers: Headers;
  db: PrismaClient;
  supabase: SupabaseClient;
  connectionParams?: Record<string, string>;
}): TRPCContext => {
  // Extract headers and add connection params for WebSocket connections
  const headers = new Headers(opts.headers);
  for (const [key, value] of Object.entries(opts.connectionParams ?? {})) {
    headers.set(key, value);
  }

  const accessToken = getAccessToken(headers, opts.connectionParams);
  console.log(
    "Creating tRPC context with access token:",
    accessToken ? "YES" : "NO",
  );

  return {
    db: opts.db,
    supabase: opts.supabase,
    headers,
    accessToken,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Global middleware for request telemetry
const mobileAppMiddleware = t.middleware(async ({ ctx, next, path }) => {
  const userAgent =
    ctx.headers.get("user-agent") ?? ctx.headers.get("User-Agent");

  const platform = getPlatformFromUserAgent(userAgent);
  console.log("[Telemetry] User-Agent:", userAgent, "Platform:", platform);

  // Log user agent for update rollout analysis
  try {
    // Try to extract user ID from auth token for better tracking
    let userId = null;
    if (ctx.accessToken) {
      try {
        // This is a lightweight way to get user ID without full validation
        // since we're just logging, not authenticating here
        const { data } = await ctx.supabase.auth.getUser(ctx.accessToken);
        userId = data.user?.id ?? null;
      } catch (error) {
        // Ignore auth errors for logging purposes
        console.log("[UserAgent Logging] Could not extract user ID:", error);
      }
    }

    if (userAgent && platform) {
      // Log to database asynchronously (fire and forget)
      void ctx.db.userAgent
        .create({
          data: {
            userAgent,
            platform,
            userId,
            endpoint: path,
          },
        })
        .catch((error: unknown) => {
          // Log errors but don't block the request
          console.error("[UserAgent Logging] Failed to log user agent:", error);
        });
    }
  } catch (error) {
    console.error("[UserAgent Logging] Unexpected error:", error);
  }

  return next();
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Base procedure
 * All procedures pass through shared telemetry middleware.
 */
const baseProcedure = t.procedure.use(mobileAppMiddleware);

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = baseProcedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  try {
    console.log("[Auth] Protected procedure called, checking auth...");
    console.log("[Auth] Access token present:", ctx.accessToken ? "YES" : "NO");

    const { user, dbUser } = await requireAuth(
      ctx.db,
      ctx.supabase,
      ctx.accessToken ?? undefined,
    );

    console.log("[Auth] Auth successful for user:", user?.id || "unknown");
    return next({
      ctx: {
        user,
        dbUser,
      },
    });
  } catch (err) {
    console.error("[Auth] Auth failed:", err);
    if (err instanceof AuthenticationError) {
      console.log("[Auth] Throwing UNAUTHORIZED error");
      throw new TRPCError({ code: "UNAUTHORIZED", message: err.message });
    }
    throw err;
  }
});

/**
 * Admin (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees the caller has the required role.
 *
 * @see https://trpc.io/docs/procedures
 */
export const moderatorProcedure = baseProcedure.use(async ({ ctx, next }) => {
  try {
    const dbUser = await requireModerator(
      ctx.db,
      ctx.supabase,
      ctx.accessToken ?? undefined,
    );
    return next({
      ctx: {
        dbUser,
      },
    });
  } catch (err) {
    if (err instanceof AuthenticationError) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (err instanceof AuthorizationError) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    throw err;
  }
});

export const mobileAppProcedure = t.procedure.use(mobileAppMiddleware);

export const adminProcedure = baseProcedure.use(async ({ ctx, next }) => {
  try {
    const dbUser = await requireAdmin(
      ctx.db,
      ctx.supabase,
      ctx.accessToken ?? undefined,
    );
    return next({
      ctx: {
        dbUser,
      },
    });
  } catch (err) {
    if (err instanceof AuthenticationError) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (err instanceof AuthorizationError) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    throw err;
  }
});
