import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PrismaClient } from "../prisma/lib/client";

/**
 * tRPC Server Configuration
 *
 * This module configures the tRPC server instance with:
 * - SuperJSON transformer for serialization
 * - Zod error formatting
 * - Context types for database and authentication
 * - Middleware factories for common patterns
 */

/**
 * Context shape for tRPC procedures
 *
 * This context is available in all tRPC procedures and provides
 * access to database, Supabase client, and request metadata.
 */
export interface TRPCContext {
  /** Prisma database client */
  db: PrismaClient;
  /** Supabase client for auth and realtime */
  supabase: SupabaseClient;
  /** Request headers */
  headers: Headers;
  /** Access token extracted from Authorization header */
  accessToken: string | null;
}

/**
 * Context creation options
 */
export interface CreateContextOptions {
  /** Request headers */
  headers: Headers;
  /** Database connection URL */
  databaseUrl: string;
  /** Supabase project URL */
  supabaseUrl: string;
  /** Supabase service role key */
  supabaseKey: string;
  /** WebSocket connection params (for subscription auth) */
  connectionParams?: Record<string, string>;
}

/**
 * tRPC initialization with context and transformer
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
 * Exported tRPC router factory
 *
 * Use this to create new routers in the adapters layer.
 *
 * @example
 * ```typescript
 * import { createTRPCRouter, protectedProcedure } from "@mirai-app/frameworks/trpc/server";
 *
 * export const userRouter = createTRPCRouter({
 *   get: protectedProcedure
 *     .input(z.object({ id: z.string() }))
 *     .query(async ({ ctx, input }) => {
 *       return ctx.db.user.findUnique({ where: { id: input.id } });
 *     }),
 * });
 * ```
 */
export const createTRPCRouter = t.router;

/**
 * Factory for creating server-side callers
 *
 * Useful for server-side rendering or background jobs that need
 * to call tRPC procedures directly.
 *
 * @example
 * ```typescript
 * import { createCallerFactory } from "@mirai-app/frameworks/trpc/server";
 * import { appRouter } from "@mirai-app/adapters";
 *
 * const createCaller = createCallerFactory(appRouter);
 * const caller = createCaller({
 *   db: prisma,
 *   supabase,
 *   headers: new Headers(),
 *   accessToken: null,
 * });
 *
 * const user = await caller.user.get({ id: "123" });
 * ```
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * Base procedure with common middleware
 *
 * All other procedures extend this base. Currently includes:
 * - Request logging (in development)
 */
export const baseProcedure = t.procedure;

/**
 * Public procedure - no authentication required
 *
 * Use this for endpoints that don't require authentication,
 * such as health checks or public data.
 */
export const publicProcedure = baseProcedure;

/**
 * Protected procedure - requires authentication
 *
 * Use this for endpoints that require a valid user session.
 * The authentication middleware validates the access token and
 * adds user information to the context.
 */
export const protectedProcedure = baseProcedure.use(
  async ({ ctx, next, path }) => {
    if (!ctx.accessToken) {
      throw new Error("UNAUTHORIZED: No access token provided");
    }

    // Get user from Supabase
    const { data, error } = await ctx.supabase.auth.getUser(ctx.accessToken);

    if (error || !data.user) {
      throw new Error("UNAUTHORIZED: Invalid or expired token");
    }

    return next({
      ctx: {
        ...ctx,
        user: data.user,
      },
    });
  },
);

/**
 * Admin procedure - requires admin role
 *
 * Use this for administrative endpoints. In addition to authentication,
 * this checks if the user has admin privileges.
 */
export const adminProcedure = protectedProcedure.use(
  async ({ ctx, next, path }) => {
    // Check admin role in database
    const dbUser = await ctx.db.user.findUnique({
      where: { id: (ctx as TRPCContext & { user: { id: string } }).user.id },
      select: { role: true },
    });

    if (dbUser?.role !== "ADMIN") {
      throw new Error("FORBIDDEN: Admin access required");
    }

    return next({
      ctx,
    });
  },
);

/**
 * Platform detection helper for telemetry
 *
 * Detects the platform (iOS/Android) from User-Agent header
 */
export const getPlatformFromUserAgent = (
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

/**
 * Extracts access token from request headers
 *
 * Supports:
 * - Authorization header (Bearer token)
 * - WebSocket connection params
 * - URL query parameters (for WebSocket connections)
 *
 * @param headers - Request headers
 * @param connectionParams - Optional WebSocket connection params
 * @returns The access token or null if not found
 */
export const getAccessTokenFromHeaders = (
  headers: Headers,
  connectionParams?: Record<string, string>,
): string | null => {
  // Try Authorization header first
  const authorization =
    headers.get("authorization") ?? headers.get("Authorization");
  if (authorization) {
    const [scheme, token] = authorization.split(" ");
    if (scheme?.toLowerCase() === "bearer" && token) {
      return token.trim();
    }
  }

  // Try connectionParams (WebSocket)
  if (connectionParams?.authorization) {
    const token = connectionParams.authorization;
    if (token.trim().length > 0) {
      return token.trim();
    }
  }

  // Try URL query params (for WebSocket upgrade workaround)
  const urlString = headers.get("x-original-url");
  if (urlString) {
    try {
      const url = new URL(
        urlString,
        urlString.startsWith("http") ? undefined : "http://localhost",
      );
      const authParam = url.searchParams.get("authorization");
      if (authParam) {
        const [scheme, token] = authParam.split(" ");
        if (scheme?.toLowerCase() === "bearer" && token?.trim()) {
          return token.trim();
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  return null;
};
