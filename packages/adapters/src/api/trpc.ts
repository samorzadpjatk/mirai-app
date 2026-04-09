/**
 * tRPC Server Configuration
 *
 * This file contains the minimal tRPC setup with ZERO auth awareness.
 * All authentication and authorization is handled at the controller level.
 *
 * TL;DR - This file now only handles transport concerns. No business logic,
 * no auth middleware, no role checking. Just tRPC infrastructure.
 */

import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import type { PrismaClient } from "@mirai-app/frameworks/prisma";
import type { AwilixContainer, RequestScope } from "@mirai-app/frameworks/di";
import {
  createRequestScope,
  getContainer,
  isContainerInitialized,
} from "@mirai-app/frameworks/di";

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
 *   getById: publicProcedure
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

/**
 * tRPC Context - Transport Layer Only
 *
 * Contains ONLY transport-related data:
 * - Database connection (framework infrastructure)
 * - Supabase client (framework infrastructure)
 * - HTTP headers (raw transport data)
 * - DI container (dependency resolution infrastructure)
 *
 * NO AUTH DATA HERE. No user, no token, no roles.
 * Auth is handled at the controller level via use cases.
 */
export interface TRPCContext {
  /** Prisma database client */
  db: PrismaClient;

  /** Supabase client for auth/storage */
  supabase: SupabaseClient;

  /** Raw HTTP headers from the request */
  headers: Headers;

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

/**
 * Create tRPC Context
 *
 * This helper generates the "internals" for a tRPC context. The API handler
 * and RSC clients each wrap this and provide the required context.
 *
 * The database client and Supabase client are received via context parameters,
 * maintaining Clean Architecture by avoiding runtime imports from frameworks.
 *
 * Dependency injection is integrated via DIContext, which provides a request-scoped
 * container that inherits from the root container.
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

  // =============================================================================
  // Dependency Injection Context Creation
  // =============================================================================

  let diContext: DIContext;

  // Check if container is initialized
  if (isContainerInitialized()) {
    // Create request-scoped container with PrismaClient registration
    const scope = createRequestScope({
      prisma: opts.db,
      requestId: generateRequestId(),
      values: {
        // Additional request-scoped values can be added here
        supabase: opts.supabase,
      },
    });

    diContext = {
      container: scope.container,
      resolve: <T>(token: string): T => scope.container.resolve<T>(token),
      scope,
    };
  } else {
    // Fallback for tests or when container is not initialized
    const fallbackContainer = {
      resolve: <T>(): T => {
        throw new Error(
          "DI container not initialized. Call initializeContainer([AppModule]) before resolving dependencies.",
        );
      },
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
    di: diContext,
  };
};

/**
 * Initialize tRPC
 *
 * This is where the tRPC API is initialized, connecting the context and transformer.
 * We parse ZodErrors to get typesafety on the frontend if validation fails.
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
 * Create a tRPC router.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public procedure - the ONLY procedure type
 *
 * ALL routes use this. Auth is handled at the controller level, not in tRPC middleware.
 *
 * @see https://trpc.io/docs/procedures
 */
export const publicProcedure = t.procedure;
