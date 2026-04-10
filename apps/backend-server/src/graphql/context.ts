/**
 * GraphQL Context Factory
 *
 * Creates GraphQL context from Hono requests.
 * Extracts authentication tokens, resolves auth context,
 * and provides DI container access to resolvers.
 *
 * ## Architecture
 *
 * Context is created per-request and includes:
 * - `container`: Request-scoped DI container
 * - `request`: Hono request object for header access
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
import type { Result } from "@mirai-app/domain";
import type { AuthenticateUserUseCase } from "@mirai-app/use-cases";
import { TokenExtractor } from "@mirai-app/adapters";

// =============================================================================
// Types
// =============================================================================

/**
 * GraphQL context type
 *
 * Passed to all GraphQL resolvers. Contains the DI container
 * and Hono request for accessing headers and other request data.
 */
export interface GraphQLContext {
  /** Request-scoped DI container */
  container: AwilixContainer;

  /** Hono request object */
  request: Request;

  /** Optional pre-resolved auth context (populated by auth helpers) */
  authContext?: AuthContext;
}

// =============================================================================
// Context Factory
// =============================================================================

/**
 * Create GraphQL context factory for Hono requests
 *
 * Returns a function that creates context from Hono context.
 * The factory extracts the request-scoped DI container from Hono
 * and creates a standard GraphQL context.
 *
 * @param rootContainer - The root DI container (for type inference)
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // Extract auth token and resolve auth context if present
    const authHeader =
      honoContext.req.header("authorization") ??
      honoContext.req.header("Authorization");
    const token = TokenExtractor.extract(authHeader);

    let authContext: AuthContext | undefined;

    if (token) {
      try {
        // Resolve auth context from token
        const authUseCase = container.resolve<AuthenticateUserUseCase>(
          "authenticateUserUseCase",
        );
        const authResult: Result<AuthContext, Error> =
          await authUseCase.execute({ token });

        if (authResult.kind === "ok") {
          authContext = authResult.value;
        }
      } catch {
        // Auth failed - resolver will handle authentication requirements
        authContext = undefined;
      }
    }

    return {
      container,
      request: honoContext.req.raw,
      ...(authContext && { authContext }),
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

    return {
      container,
      request: honoContext.req.raw,
    };
  };
}

// =============================================================================
// Export
// =============================================================================

export default createContextFactory;
