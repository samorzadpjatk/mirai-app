import type { YogaInitialContext } from "graphql-yoga";
import type { Layer, Runtime } from "effect";

/**
 * Auth context from successful authentication
 */
export interface AuthContext {
  user: {
    id: string;
    email: string;
    role: string;
  };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}

/**
 * GraphQL Context
 *
 * This is the context passed to all GraphQL resolvers.
 * It provides access to:
 * - Dependency injection layers (Effect)
 * - Authentication context
 * - Request information
 * - Controllers (via DI)
 */
export interface GraphQLContext {
  /**
   * The Effect Layer providing all dependencies
   */
  appLayer: Layer.Layer<unknown>;

  /**
   * Pre-built Effect runtime for executing Effect programs
   */
  runtime: Runtime.Runtime<unknown>;

  /**
   * The current HTTP request
   */
  request: Request;

  /**
   * Authentication context if user is authenticated
   */
  authContext?: AuthContext;

  /**
   * Unique request ID for tracing
   */
  requestId: string;

  /**
   * Request timestamp
   */
  requestTime: Date;
}

/**
 * Factory function type for creating GraphQL context
 */
export type GraphQLContextFactory = (
  ctx: YogaInitialContext,
) => Promise<GraphQLContext> | GraphQLContext;

/**
 * Configuration for creating GraphQL context
 */
export interface GraphQLContextConfig {
  /**
   * The Effect Layer providing all dependencies
   */
  appLayer: Layer.Layer<unknown>;

  /**
   * Pre-built Effect runtime
   */
  runtime: Runtime.Runtime<unknown>;

  /**
   * Function to extract auth context from request
   */
  getAuthContext?: (request: Request) => Promise<AuthContext | undefined>;
}

/**
 * Create a GraphQL context factory
 *
 * This factory creates context objects for each GraphQL request.
 * The context includes the Effect Layer for dependency injection
 * and any authentication information.
 *
 * ## Usage
 *
 * ```typescript
 * import { createGraphQLContext } from "@mirai-app/frameworks/graphql";
 * import { makeAppLayer } from "@mirai-app/frameworks";
 * import { getAuthContext } from "./auth";
 *
 * const appLayer = makeAppLayer({ supabase, db });
 * const runtime = await Effect.runPromise(Layer.toRuntime(appLayer));
 *
 * const context = createGraphQLContext({
 *   appLayer,
 *   runtime,
 *   getAuthContext,
 * });
 *
 * // Use with Yoga
 * const yoga = createYoga({
 *   schema,
 *   context,
 * });
 * ```
 *
 * @param config - Context configuration
 * @returns Context factory function
 */
export function createGraphQLContext(
  config: GraphQLContextConfig,
): GraphQLContextFactory {
  return async (ctx: YogaInitialContext): Promise<GraphQLContext> => {
    const requestId = generateRequestId();
    const requestTime = new Date();

    let authContext: AuthContext | undefined;
    if (config.getAuthContext) {
      authContext = await config.getAuthContext(ctx.request);
    }

    return {
      appLayer: config.appLayer,
      runtime: config.runtime,
      request: ctx.request,
      authContext,
      requestId,
      requestTime,
    };
  };
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Extract the user ID from context if authenticated
 */
export function getUserId(context: GraphQLContext): string | undefined {
  return context.authContext?.user?.id;
}

/**
 * Check if the context has an authenticated user
 */
export function isAuthenticated(context: GraphQLContext): boolean {
  return context.authContext?.user !== undefined;
}
