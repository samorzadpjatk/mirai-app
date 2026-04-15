/**
 * GraphQL Yoga Handler
 *
 * Creates and configures GraphQL Yoga for Hono integration.
 * Provides the GraphQL endpoint with schema, context, and GraphiQL support.
 *
 * ## Architecture
 *
 * Yoga is the GraphQL server that handles:
 * - Query/mutation execution
 * - GraphiQL playground (dev only)
 * - Request parsing and response formatting
 * - Context injection
 *
 * Integration with Hono via `yoga.handle()` which accepts a standard
 * Request object and returns a Response.
 *
 * ## Usage
 *
 * ```typescript
 * import { createYogaHandler } from "./yoga-handler";
 * import { createSimpleContextFactory } from "./context";
 *
 * const yoga = createYogaHandler({
 *   enableGraphiQL: true,
 *   contextFactory: createSimpleContextFactory(),
 * });
 *
 * app.use("/graphql", async (c) => {
 *   return yoga.handle(c.req.raw, { context: c });
 * });
 * ```
 *
 * @module yoga-handler
 */

import { createYoga, type YogaInitialContext } from "graphql-yoga";
import type { Context as HonoContext } from "hono";
import { schema } from "./schema";
import { createSimpleContextFactory, type GraphQLContext } from "./context";

// =============================================================================
// Types
// =============================================================================

/**
 * Yoga handler configuration options
 */
export interface YogaHandlerOptions {
  /** Enable GraphiQL playground (default: false) */
  enableGraphiQL?: boolean;

  /** Custom context factory function */
  contextFactory?: (
    honoContext: HonoContext,
  ) => Promise<GraphQLContext> | GraphQLContext;

  /** GraphQL endpoint path (default: /graphql) */
  graphqlEndpoint?: string;
}

/**
 * Yoga handler instance with handle method
 */
export interface YogaHandler {
  /** Handle incoming request */
  handle: (
    request: Request,
    options?: { context?: HonoContext },
  ) => Promise<Response>;

  /** Yoga instance for advanced use */
  yoga: ReturnType<typeof createYoga>;
}

// =============================================================================
// Yoga Handler Creation
// =============================================================================

/**
 * Create GraphQL Yoga handler for Hono
 *
 * Configures Yoga with the Pothos schema and integrates with
 * Hono's request/response cycle.
 *
 * @param options - Yoga configuration options
 * @returns Yoga handler instance
 *
 * @example
 * ```typescript
 * import { createYogaHandler } from "./graphql/yoga-handler";
 * import { createSimpleContextFactory } from "./graphql/context";
 *
 * const yoga = createYogaHandler({
 *   enableGraphiQL: process.env.NODE_ENV === "development",
 *   contextFactory: createSimpleContextFactory(),
 * });
 *
 * // Mount in Hono
 * app.all("/graphql", async (c) => {
 *   return yoga.handle(c.req.raw, { context: c });
 * });
 * ```
 */
export function createYogaHandler(
  options: YogaHandlerOptions = {},
): YogaHandler {
  const {
    enableGraphiQL = false,
    contextFactory = createSimpleContextFactory(),
    graphqlEndpoint = "/graphql",
  } = options;

  // Create Yoga instance with Pothos schema
  const yoga = createYoga({
    schema,
    graphqlEndpoint,
    landingPage: false, // We implement our own root endpoint
    graphiql: enableGraphiQL
      ? {
          title: "Mirai App GraphQL API",
          defaultQuery: `# Welcome to Mirai App GraphQL API
#
# Try these queries:

# Get current user
query GetMe {
  me {
    id
    firstName
    lastName
    fullName
    role
  }
}

# Get user by ID (replace with actual ID)
query GetUser($id: ID!) {
  user(id: $id) {
    id
    firstName
    lastName
    role
    hasAvatar
  }
}`,
        }
      : false,
    // Context factory - receives Hono context, returns GraphQL context
    context: async (initialContext: YogaInitialContext) => {
      // Get Hono context from the extra options passed to handle()
      const honoContext = (initialContext as { honoContext?: HonoContext })
        .honoContext;

      if (!honoContext) {
        throw new Error(
          "Hono context not provided. Ensure you're passing { context: honoContext } to yoga.handle().",
        );
      }

      // Create GraphQL context from Hono context
      return contextFactory(honoContext);
    },
    // Error handling
    maskedErrors: {
      maskError(error: unknown) {
        // Preserve GraphQL errors with extensions
        const graphqlError = error as { extensions?: { code?: string } };
        if (graphqlError.extensions && graphqlError.extensions.code) {
          return error as Error;
        }
        // Mask unexpected errors in production
        return new Error("Internal Server Error");
      },
    },
    // Health check endpoint
    healthCheckEndpoint: "/health",
    // CORS handled by Hono middleware
    cors: false,
  });

  return {
    yoga,
    /**
     * Handle incoming Hono request
     *
     * Wraps Yoga's fetch handler to work with Hono's context.
     *
     * @param request - Standard Request object
     * @param options - Optional context override
     * @returns Response from Yoga
     */
    async handle(
      request: Request,
      options?: { context?: HonoContext },
    ): Promise<Response> {
      // Pass Hono context through to Yoga's context factory
      const serverContext = options?.context
        ? { honoContext: options.context }
        : {};

      // Use Yoga's fetch handler
      return yoga.fetch(request, serverContext);
    },
  };
}

/**
 * Create Yoga handler with default configuration
 *
 * Convenience factory that creates a Yoga handler with sensible defaults
 * based on environment.
 *
 * @param isDevelopment - Whether to enable dev features (GraphiQL)
 * @returns Configured Yoga handler
 */
export function createDefaultYogaHandler(
  isDevelopment = process.env.NODE_ENV === "development",
): YogaHandler {
  return createYogaHandler({
    enableGraphiQL: isDevelopment,
    contextFactory: createSimpleContextFactory(),
  });
}

// =============================================================================
// Export
// =============================================================================

export default createYogaHandler;
