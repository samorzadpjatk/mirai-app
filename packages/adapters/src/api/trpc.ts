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
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import type { PrismaClient } from "@mirai-app/frameworks/prisma";
import type { AwilixContainer, RequestScope } from "@mirai-app/frameworks/di";
import {
  createRequestScope,
  getContainer,
  isContainerInitialized,
} from "@mirai-app/frameworks/di";

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
    return headerToken;
  }

  // Try connectionParams (sent as first WebSocket message)
  if (connectionParams && "authorization" in connectionParams) {
    const token = connectionParams.authorization;
    if (token && token.trim().length > 0) {
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
          return token.trim();
        }
      }
    } catch {
      // URL parsing failed, continue to return null
    }
  }

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

/**
 * Dependency Injection Context
 *
 * Provides request-scoped container access for dependency resolution in tRPC procedures.
 * The container is created fresh for each request and inherits from the root container,
 * ensuring all module registrations (repositories, use cases, controllers) are available.
 *
 * ## Usage
 *
 * ### Resolving Controllers
 *
 * ```typescript
 * export const userRouter = createTRPCRouter({
 *   getById: protectedProcedure
 *     .input(z.object({ id: z.string() }))
 *     .query(async ({ ctx, input }) => {
 *       const controller = ctx.di.container.resolve("userController");
 *       return controller.getById(input);
 *     }),
 * });
 * ```
 *
 * ### Resolving Repositories Directly
 *
 * ```typescript
 * const userRepo = ctx.di.container.resolve("userRepository");
 * const user = await userRepo.findById(id);
 * ```
 *
 * ## Container Lifecycle
 *
 * - **Request-scoped**: New container created per request
 * - **PrismaClient registration**: Each request's PrismaClient is registered
 * - **Inheritance**: Child container inherits all root container registrations
 * - **Cleanup**: Container disposal happens automatically after request completion
 *
 * @see https://github.com/jeffijoe/awilix#scopes
 */
export interface DIContext {
  /**
   * Request-scoped Awilix container
   *
   * Use this to resolve dependencies registered in modules:
   * - RepositoryModule: userRepository, tripRepository, etc.
   * - UseCaseModule: getUserUseCase, createUserUseCase, etc.
   * - ControllerModule: userController, tripController, etc.
   */
  container: AwilixContainer;

  /**
   * Resolve a dependency from the container
   *
   * Type-safe helper for resolving services by token name.
   *
   * @param token - Service identifier (e.g., "userRepository", "userController")
   * @returns The resolved service
   *
   * @example
   * ```typescript
   * const controller = ctx.di.resolve("userController");
   * const user = await controller.getById({ id: "123" });
   * ```
   */
  resolve: <T>(token: string) => T;

  /**
   * Request scope metadata
   *
   * Contains the request ID and disposal function for the scope.
   */
  scope: RequestScope;
}

export interface TRPCContext {
  db: PrismaClient;
  supabase: SupabaseClient;
  headers: Headers;
  accessToken: string | null;

  /**
   * Dependency injection context
   *
   * Provides request-scoped container for resolving controllers, repositories,
   * and use cases. Created fresh for each request with PrismaClient bound.
   *
   * @example
   * ```typescript
   * const controller = ctx.di.container.resolve("userController");
   * return controller.getById(input);
   * ```
   */
  di: DIContext;
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
 * Dependency injection is integrated via DIContext, which provides a request-scoped
 * container that inherits from the root container. This enables resolving controllers,
 * repositories, and use cases without manual instantiation.
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

  // =============================================================================
  // Dependency Injection Context Creation
  // =============================================================================

  let diContext: DIContext;

  // Check if container is initialized (will be true in production, false during tests without setup)
  if (isContainerInitialized()) {
    // Create request-scoped container with PrismaClient registration
    const scope = createRequestScope({
      prisma: opts.db,
      requestId: generateRequestId(),
      userContext: null, // Will be populated by protectedProcedure middleware
      values: {
        // Additional request-scoped values can be added here
        supabase: opts.supabase,
        accessToken: accessToken,
      },
    });

    diContext = {
      container: scope.container,
      resolve: <T>(token: string): T => scope.container.resolve<T>(token),
      scope,
    };
  } else {
    // Fallback for tests or when container is not initialized
    // Create a minimal DI context that throws on resolution attempts
    const fallbackContainer = {
      resolve: <T>(): T => {
        throw new Error(
          "DI container not initialized. Call initializeContainer([AppModule]) before resolving dependencies.",
        );
      },
      // Minimal container-like interface for fallback
      registrations: {},
    } as unknown as AwilixContainer;

    diContext = {
      container: fallbackContainer,
      resolve: <T>(): T => {
        throw new Error(
          "DI container not initialized. Call initializeContainer([AppModule]) before resolving dependencies.",
        );
      },
      scope: {
        container: fallbackContainer,
        requestId: "fallback",
        dispose: () => {
          // No-op for fallback
        },
      } as RequestScope,
    };
  }

  return {
    db: opts.db,
    supabase: opts.supabase,
    headers,
    accessToken,
    di: diContext,
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
      } catch {
        // Ignore auth errors for logging purposes
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
        .catch(() => {
          // Silently ignore logging errors to not block the request
        });
    }
  } catch {
    // Silently ignore telemetry errors to not block the request
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
    const { user, dbUser } = await requireAuth(
      ctx.db,
      ctx.supabase,
      ctx.accessToken ?? undefined,
    );

    return next({
      ctx: {
        user,
        dbUser,
      },
    });
  } catch (err) {
    if (err instanceof AuthenticationError) {
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

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate a unique request ID
 *
 * Creates a unique identifier for tracking requests across logs and metrics.
 * Format: req-{timestamp}-{random}
 *
 * @returns Unique request identifier
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
