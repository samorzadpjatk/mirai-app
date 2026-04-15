/**
 * GraphQL Context Factory
 *
 * Creates GraphQL context from Hono requests.
 * Extracts authentication tokens, resolves auth context,
 * and provides controllers via Effect-based dependency injection.
 *
 * ## Architecture
 *
 * Context is created per-request and includes:
 * - `controllers`: All 17 controllers instantiated with Effect Layer DI
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
 *   context: createContextFactory(),
 * });
 *
 * // In resolvers:
 * const user = await context.controllers.userController.getById({ id });
 * ```
 *
 * @module context
 */

import type { Context as HonoContext } from "hono";
import type { Layer } from "effect";
import type { AuthContext, UserId } from "@mirai-app/domain";
import { AuthContext as AuthContextClass } from "@mirai-app/domain";
import { Effect, Runtime } from "effect";
import type { Runtime as EffectRuntimeType } from "effect/Runtime";
import {
  authenticateUserUseCase,
  AuthPortTag,
  type AuthPort,
} from "@mirai-app/use-cases";
import {
  TokenExtractor,
  createControllers,
  type Controllers,
} from "@mirai-app/adapters";
import {
  makeAppLayer,
  type AppLayerConfig,
} from "@mirai-app/frameworks/layers";
import {
  createSupabaseClient,
  type SupabaseClient,
} from "@mirai-app/frameworks/supabase";

// =============================================================================
// Types
// =============================================================================

/**
 * Effect runtime type for GraphQL context
 * Uses never for requirements since we build from layers
 */
export type GraphQLRuntime = EffectRuntimeType<never>;

/**
 * GraphQL context type
 *
 * Passed to all GraphQL resolvers. Contains the controllers for Effect DI,
 * Hono request for accessing headers, and Effect runtime for
 * executing effects.
 *
 * ## Usage
 *
 * ```typescript
 * const controller = context.controllers.userController;
 * ```
 */
export interface GraphQLContext {
  /**
   * All 17 controllers instantiated with Effect Layer DI.
   * Use this for type-safe controller access.
   *
   * @example
   * ```typescript
   * const user = await context.controllers.userController.getById({ id });
   * ```
   */
  controllers: Controllers;

  /**
   * Effect Layer with all repositories and services.
   * Exposed for advanced use cases and direct Effect composition.
   */
  appLayer: Layer.Layer<unknown>;

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
 * Create a new Effect runtime for GraphQL context
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
// Supabase Client Factory
// =============================================================================

/**
 * Create Supabase client from environment variables.
 * Uses env from Hono context or falls back to process.env.
 */
function createSupabaseClientFromEnv(
  env?: Record<string, string>,
): SupabaseClient {
  const supabaseUrl = env?.SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey =
    env?.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase configuration missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}

// =============================================================================
// Challenge Completion Handler
// =============================================================================

/**
 * Handle challenge completion events from ChallengeVoteController.
 * Called when a challenge is completed via voting.
 *
 * TODO: Implement challenge completion notifications or side effects.
 */
async function handleChallengeCompleted(event: {
  challengeId: string;
  tripId: string;
  adminId: string;
}): Promise<void> {
  // TODO: Implement challenge completion side effects
  // - Send notifications to group members
  // - Update activity feed
  // - Trigger reward distribution
  // This is a placeholder for future implementation
  // Event received but not logged (logging disabled)
}

// =============================================================================
// Context Factory
// =============================================================================

/**
 * Create GraphQL context factory for Hono requests
 *
 * Returns a function that creates context from Hono context.
 * The factory composes Effect Layers, instantiates controllers,
 * and creates a standard GraphQL context with Effect runtime.
 *
 * ## Layer Composition
 *
 * The factory composes the following layers:
 * 1. RepositoryLayer (19 repositories) - via makeRepositoryLayer
 * 2. ServiceLayer (5 services) - via makeServiceLayer
 *
 * These are merged with Layer.mergeAll into a single appLayer.
 *
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
export function createContextFactory(): (
  honoContext: HonoContext,
) => Promise<GraphQLContext> {
  return async (honoContext: HonoContext): Promise<GraphQLContext> => {
    // Get AppLayer from Hono context (if provided by middleware)
    const existingAppLayer = honoContext.get("appLayer") as
      | Layer.Layer<unknown>
      | undefined;

    // Get database client from Hono context or env
    const db = honoContext.get("db") as
      | import("@mirai-app/frameworks/drizzle").DrizzleDb
      | undefined;

    // Compose appLayer if not provided
    let appLayer: Layer.Layer<unknown>;

    if (existingAppLayer) {
      appLayer = existingAppLayer;
    } else {
      // Create Supabase client from environment
      const supabase = createSupabaseClientFromEnv(
        honoContext.env as Record<string, string>,
      );

      if (!db) {
        throw new Error(
          "Database client (db) not found in Hono context and AppLayer not provided. " +
            "Ensure either database middleware is registered or appLayer is provided.",
        );
      }

      // Create AppLayer using Layer.mergeAll with Repository and Service layers
      const config: AppLayerConfig = {
        supabase,
        db,
      };
      appLayer = makeAppLayer(config);
    }

    // Create all 17 controllers using the factory
    const supabase = createSupabaseClientFromEnv(
      honoContext.env as Record<string, string>,
    );

    const controllers = createControllers({
      appLayer,
      supabase,
      onChallengeCompleted: handleChallengeCompleted,
    });

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
        // We use the AppLayer to get the AuthPort service
        const authEffect = authenticateUserUseCase({ token }).pipe(
          Effect.provide(appLayer),
        );
        const authEither = await Effect.runPromise(Effect.either(authEffect));

        if (authEither._tag === "Right") {
          const authEffect = AuthContextClass.create({
            userId: authEither.right.userId as unknown as UserId,
            role: authEither.right.role as AuthContext["role"],
            authenticatedAt: authEither.right.authenticatedAt,
            sessionId: authEither.right.sessionId,
          });
          const authResult = await Effect.runPromise(Effect.either(authEffect));
          if (authResult._tag === "Right") {
            authContext = authResult.right;
          }
        }
      } catch {
        // Auth failed - resolver will handle authentication requirements
        authContext = undefined;
      }
    }

    return {
      controllers,
      appLayer,
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
    // Get AppLayer from Hono context (if provided by middleware)
    const existingAppLayer = honoContext.get("appLayer") as
      | Layer.Layer<unknown>
      | undefined;

    // Get authContext from Hono context (if pre-resolved by middleware - for test compatibility)
    const authContext = honoContext.get("authContext") as
      | AuthContext
      | undefined;

    // Get database client from Hono context
    const db = honoContext.get("db") as
      | import("@mirai-app/frameworks/drizzle").DrizzleDb
      | undefined;

    // Compose appLayer if not provided
    let appLayer: Layer.Layer<unknown>;

    if (existingAppLayer) {
      appLayer = existingAppLayer;
    } else {
      // Create Supabase client from environment
      const supabase = createSupabaseClientFromEnv(
        honoContext.env as Record<string, string>,
      );

      if (!db) {
        throw new Error(
          "Database client (db) not found in Hono context and AppLayer not provided. " +
            "Ensure either database middleware is registered or appLayer is provided.",
        );
      }

      // Create AppLayer using Layer.mergeAll with Repository and Service layers
      const config: AppLayerConfig = {
        supabase,
        db,
      };
      appLayer = makeAppLayer(config);
    }

    // Create all 17 controllers using the factory
    const supabase = createSupabaseClientFromEnv(
      honoContext.env as Record<string, string>,
    );

    const controllers = createControllers({
      appLayer,
      supabase,
      onChallengeCompleted: handleChallengeCompleted,
    });

    // Create Effect runtime for this request
    const runtime = createGraphQLRuntime();

    return {
      controllers,
      appLayer,
      request: honoContext.req.raw,
      runtime,
      ...(authContext ? { authContext } : {}),
    };
  };
}

// =============================================================================
// Export
// =============================================================================

export default createContextFactory;
