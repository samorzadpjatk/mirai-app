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
} from "@integral-2025-app/auth";
import { TRPCError } from "@trpc/server";
import { createSupabaseClient, type SupabaseClient } from "@integral-2025-app/supabase";
import { createDb, type PrismaClient } from "@integral-2025-app/db";

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
  connectionParams?: unknown,
): string | null => {
  // First try to get token from Authorization header
  const headerToken = getAccessTokenFromHeaders(headers);
  if (headerToken) {
    console.log("[Auth] Token found in headers");
    return headerToken;
  }

  console.log("[Auth] Checking connectionParams:", JSON.stringify(connectionParams));

  // Try connectionParams (sent as first WebSocket message)
  if (
    connectionParams &&
    typeof connectionParams === "object" &&
    "authToken" in connectionParams
  ) {
    const token = (connectionParams as { authToken?: unknown }).authToken;
    console.log("[Auth] authToken in connectionParams:", token ? "EXISTS" : "MISSING");

    if (typeof token === "string" && token.trim().length > 0) {
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
      if (urlString.startsWith('http://') || urlString.startsWith('https://') || urlString.startsWith('ws://') || urlString.startsWith('wss://')) {
        // Absolute URL
        url = new URL(urlString);
      } else {
        // Relative URL - construct absolute URL for parsing
        // Use a dummy base URL since we only care about parsing query params
        url = new URL(urlString, 'http://localhost');
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

export interface TRPCContext {
  db: PrismaClient;
  supabase: SupabaseClient;
  headers: Headers;
  accessToken: string | null;
}

// On the backend we use a single SERVICE_ROLE Supabase client (singleton).
// Follow the Prisma pattern: a module-level lazy-initialized singleton so we avoid adding globals.
let supabase: SupabaseClient | undefined;

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
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = (opts: {
  headers: Headers;
  databaseUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
  connectionParams?: unknown;
}): TRPCContext => {
  if (!supabase) {
    supabase = createSupabaseClient(
      opts.supabaseUrl,
      opts.supabaseKey,
      undefined,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    console.log("[Supabase] Created server singleton client using SERVICE_ROLE key");
  } else {
    console.log("[Supabase] Reusing server singleton Supabase client");
  }

  const accessToken = getAccessToken(opts.headers, opts.connectionParams);
  console.log(
    "Creating tRPC context with access token:",
    accessToken ? "YES" : "NO",
  );

  const db = createDb(opts.databaseUrl);

  return {
    db,
    supabase,
    headers: opts.headers,
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
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
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
export const moderatorProcedure = t.procedure.use(async ({ ctx, next }) => {
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

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
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
