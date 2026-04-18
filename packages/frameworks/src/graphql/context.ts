// =============================================================================
// Minimal GraphQL Context Interface
// =============================================================================

import { Runtime, Effect, Exit } from "effect";
import type { AuthContext } from "../effect/AuthContext.js";

export type { AuthContext };

/**
 * Minimal GraphQL Context Interface
 *
 * This interface is implemented by the app (e.g., backend-server).
 * The GraphQL package does NOT create this context - it only consumes it.
 *
 * ## App Responsibility
 *
 * The app must:
 * 1. Extract auth token from request
 * 2. Validate token (AuthN) using AuthNPort/AuthZPort
 * 3. Build AuthContext with userId and role
 * 4. Create Effect Runtime from the app layer
 * 5. Provide both in the context to resolvers
 *
 * ## Example App Setup
 *
 * ```typescript
 * // In backend-server app
 * import { schema } from "@mirai-app/frameworks/graphql";
 * import { createYoga } from "graphql-yoga";
 * import { Layer, Effect } from "effect";
 * 
 * // Build the app layer with all dependencies
 * const appLayer = makeAppLayer({ db, supabase });
 * 
 * // Create runtime once at server startup
 * const runtime = await Effect.runPromise(Layer.toRuntime(appLayer));
 * 
 * const yoga = createYoga({
 *   schema,
 *   context: async ({ request }) => {
 *     // App handles auth
 *     const token = extractToken(request);
 *     const authContext = await validateToken(token); // Uses AuthNPort
 *     
 *     return {
 *       request,
 *       authContext,
 *       runtime,  // Pre-built with all deps
 *     };
 *   },
 * });
 * ```
 */
export interface GraphQLContext {
  /** Original HTTP request (for headers, IP, etc.) */
  request: Request;
  
  /** Auth context if authenticated, undefined if not */
  authContext?: AuthContext;
  
  /**
   * Pre-built Effect Runtime with all dependencies.
   * Created by the app via Layer.toRuntime(appLayer).
   */
  runtime: Runtime.Runtime<unknown>;
}

// =============================================================================
// Auth Helpers for Resolvers
// =============================================================================

/**
 * Require authentication
 * @throws Error with UNAUTHENTICATED if no auth context
 */
export function requireAuth(context: GraphQLContext): AuthContext {
  if (!context.authContext) {
    throw new Error("UNAUTHENTICATED: Authentication required");
  }
  return context.authContext;
}

/**
 * Require admin role
 * @throws Error with FORBIDDEN if not admin
 */
export function requireAdmin(context: GraphQLContext): AuthContext {
  const auth = requireAuth(context);
  if (auth.role !== "ADMIN") {
    throw new Error("FORBIDDEN: Admin access required");
  }
  return auth;
}

/**
 * Require moderator or admin role
 * @throws Error with FORBIDDEN if neither
 */
export function requireModerator(context: GraphQLContext): AuthContext {
  const auth = requireAuth(context);
  if (auth.role !== "ADMIN" && auth.role !== "MODERATOR") {
    throw new Error("FORBIDDEN: Moderator access required");
  }
  return auth;
}

/**
 * Get optional auth context (returns null instead of throwing)
 */
export function getOptionalAuth(context: GraphQLContext): AuthContext | null {
  return context.authContext ?? null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(context: GraphQLContext): boolean {
  return context.authContext !== undefined;
}

/**
 * Execute an Effect with the context's runtime
 *
 * Used by resolvers to run Effect-based use cases.
 * The runtime (with all dependencies) is provided by the app.
 *
 * @example
 * ```typescript
 * builder.queryFields((t) => ({
 *   me: t.field({
 *     type: UserProfileType,
 *     resolve: async (_parent, _args, context) => {
 *       const auth = requireAuth(context);
 *       const useCase = new GetMyProfileUseCase();
 *       const effect = useCase.execute({ userId: auth.userId });
 *       return runEffect(context, effect);
 *     },
 *   }),
 * }));
 * ```
 */
export async function runEffect<T, E>(
  context: GraphQLContext,
  effect: Effect.Effect<T, E, unknown>
): Promise<T> {
  const exit = await Runtime.runPromiseExit(context.runtime)(effect);

  if (Exit.isSuccess(exit)) {
    return exit.value;
  } else {
    const error = exit.cause._tag === "Fail"
      ? (exit.cause as { error: E }).error
      : new Error("Effect execution failed");
    throw error;
  }
}
