/**
 * GraphQL Context Factory
 *
 * Creates GraphQL context from Hono requests.
 * Extracts authentication tokens, resolves auth context,
 * and provides DI container access to resolvers with Effect runtime.
 *
 * ## Architecture
 *
 * Context is created per-request and includes:
 * - `container`: Request-scoped DI container
 * - `request`: Hono request object for header access
 * - `runtime`: Effect runtime for executing effects
 *
 * The auth context is resolved lazily within resolvers using
 * the `requireAuth()` and `getOptionalAuth()` helpers from auth-helpers.ts.
 *
 * ## Usage
 *
 * ```typescript
 * import { createContextFactory } from "./context";
 *
 * const yoga = createYoga({
 *   schema,
 *   context: createContextFactory(container),
 * });
 * ```
 *
 * @module context
 */

import type { Context as HonoContext } from "hono";
import type { AwilixContainer } from "awilix";
import type { AuthContext } from "@mirai-app/domain";
import { Effect, Runtime } from "effect";
import type { Runtime as EffectRuntime } from "effect";
import {
  authenticateUserUseCase,
  AuthPortTag,
  type AuthPort,
} from "@mirai-app/use-cases";
import { TokenExtractor } from "@mirai-app/adapters";

// =============================================================================
// Types
// =============================================================================

/**
 * Effect runtime type for GraphQL context
 * Uses never for requirements since we build from the container
 */
export type GraphQLRuntime = EffectRuntime<never>;

/**
 * GraphQL context type
 *
 * Passed to all GraphQL resolvers. Contains the DI container,
 * Hono request for accessing headers, and Effect runtime for
 * executing effects.
 */
export interface GraphQLContext {
  /** Request-scoped DI container */
  container: AwilixContainer;

  /** Hono request object */
  request: Request;

  /** Optional pre-resolved auth context (populated by auth helpers) */
  authContext?: AuthContext;

  /** Effect runtime for executing effects */
  runtime: GraphQLRuntime;
}

// =============================================================================
// Runtime Factory
// =============================================================================

/**
 * Create a new Effect runtime from the container
 *
 * This creates a fresh runtime per request using the default runtime.
 * For more advanced use cases, you can build a custom runtime from layers.
 *
 * @returns Effect runtime for GraphQL context
 */
function createGraphQLRuntime(): GraphQLRuntime {
  // Use the default Effect runtime
  // The runtime provides the execution environment for effects
  return Runtime.defaultRuntime;
}

// =============================================================================
// Context Factory
// =============================================================================

/**
 * Create GraphQL context factory for Hono requests
 *
 * Returns a function that creates context from Hono context.
 * The factory extracts the request-scoped DI container from Hono
 * and creates a standard GraphQL context with Effect runtime.
 *
 * @param _rootContainer - The root DI container (for type inference)
 * @returns Context factory function for Yoga
 *
 * @example
 * ```typescript
 * import { createContextFactory } from "./context";
 * import { createYoga } from "graphql-yoga";
 *
 * const yoga = createYoga({
 *   schema,
 *   context: createContextFactory(),
 * });
 *
 * // In Hono route:
 * app.use("/graphql", async (c) => {
 *   const context = await contextFactory(c);
 *   return yoga.handle(c.req.raw, { context });
 * });
 * ```
 */
export function createContextFactory(
  _rootContainer?: AwilixContainer,
): (honoContext: HonoContext) => Promise<GraphQLContext> {
  return async (honoContext: HonoContext): Promise<GraphQLContext> => {
    // Get request-scoped container from Hono context
    const container = honoContext.get("container") as AwilixContainer;

    if (!container) {
      throw new Error(
        "DI container not found in Hono context. " +
          "Ensure createDIMiddleware is registered before GraphQL routes.",
      );
    }

    // Create Effect runtime for this request
    const runtime = createGraphQLRuntime();

    // Extract auth token and resolve auth context if present
    const authHeader =
      honoContext.req.header("authorization") ??
      honoContext.req.header("Authorization");
    const token = TokenExtractor.extract(authHeader);

    let authContext: AuthContext | undefined;

    if (token) {
      try {
        // Resolve auth context from token using Effect-based use case
        const authPort = container.resolve<AuthPort>("authPort");
        const authEffect = authenticateUserUseCase({ token }).pipe(
          Effect.provideService(AuthPortTag, authPort),
        );
        const authEither = await Effect.runPromise(Effect.either(authEffect));

        if (authEither._tag === "Right") {
          authContext = {
            userId: authEither.right.userId,
            role: authEither.right.role as AuthContext["role"],
            authenticatedAt: authEither.right.authenticatedAt,
            sessionId: authEither.right.sessionId,
          };
        }
      } catch {
        // Auth failed - resolver will handle authentication requirements
        authContext = undefined;
      }
    }

    return {
      container,
      request: honoContext.req.raw,
      runtime,
      ...(authContext ? { authContext } : {}),
    };
  };
}

/**
 * Create a simple context factory without auth pre-resolution
 *
 * Use this when auth resolution should happen in resolvers (recommended).
 * This keeps context creation fast and defers auth checks to where they're needed.
 *
 * @returns Simple context factory function
 */
export function createSimpleContextFactory(): (
  honoContext: HonoContext,
) => Promise<GraphQLContext> {
  return async (honoContext: HonoContext): Promise<GraphQLContext> => {
    // Get request-scoped container from Hono context
    const container = honoContext.get("container") as AwilixContainer;

    if (!container) {
      throw new Error(
        "DI container not found in Hono context. " +
          "Ensure createDIMiddleware is registered before GraphQL routes.",
      );
    }

    // Create Effect runtime for this request
    const runtime = createGraphQLRuntime();

    return {
      container,
      request: honoContext.req.raw,
      runtime,
    };
  };
}

// =============================================================================
// Export
// =============================================================================

export default createContextFactory;
