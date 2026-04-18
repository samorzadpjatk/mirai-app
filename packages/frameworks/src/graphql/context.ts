import type { Effect, Layer } from "effect";

/**
 * GraphQL Context Types
 *
 * Defines the context type used throughout the GraphQL schema.
 * This context is passed to all resolvers and contains:
 * - Authentication context
 * - Database access
 * - Controllers for business logic
 */

/**
 * Authentication context for a request
 */
export interface AuthContext {
  /** The authenticated user's database ID */
  userId: string;
  /** The authenticated user's Supabase auth ID */
  authUserId: string;
  /** User's role in the system */
  role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
  /** Access token for Supabase requests */
  accessToken?: string;
}

/**
 * GraphQL request context
 *
 * Passed to all resolvers, containing auth state and
 * infrastructure access.
 */
export interface GraphQLContext {
  /** Authentication context if user is logged in */
  authContext?: AuthContext;
  /** Request object */
  request: Request;
  /**
   * Run an Effect with the application layer
   *
   * This allows resolvers and subscriptions to execute Effects
   * that require application dependencies (ports, services).
   */
  runWithAppLayer?: <T>(effect: Effect.Effect<T, unknown, unknown>) => Promise<T>;
}

/**
 * Check if context has authentication
 */
export function isAuthenticated(
  ctx: GraphQLContext,
): ctx is GraphQLContext & { authContext: AuthContext } {
  return ctx.authContext !== undefined;
}

/**
 * Check if user is admin
 */
export function isAdmin(ctx: GraphQLContext): boolean {
  return ctx.authContext?.role === "ADMIN";
}

/**
 * Check if user is moderator or admin
 */
export function isModerator(ctx: GraphQLContext): boolean {
  return (
    ctx.authContext?.role === "MODERATOR" || ctx.authContext?.role === "ADMIN"
  );
}
