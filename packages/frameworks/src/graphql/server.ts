import {
  createYoga,
  type YogaServerOptions,
  type YogaInitialContext,
  type YogaLogger,
} from "graphql-yoga";
import type { GraphQLSchema } from "graphql";
import { formatError } from "./errors";
import type { GraphQLContext, GraphQLContextFactory } from "./context";

/**
 * GraphQL Server configuration
 */
export interface GraphQLServerConfig {
  /**
   * The GraphQL schema
   */
  schema: GraphQLSchema;

  /**
   * Context factory function
   */
  context: GraphQLContextFactory;

  /**
   * Whether to enable GraphiQL IDE
   * @default process.env.NODE_ENV === "development"
   */
  graphiql?: boolean;

  /**
   * Whether to enable introspection
   * @default process.env.NODE_ENV === "development"
   */
  introspection?: boolean;

  /**
   * Request logging
   */
  logging?: boolean | YogaLogger;

  /**
   * Maximum request body size in bytes
   * @default 10485760 (10MB)
   */
  maxRequestSize?: number;

  /**
   * CORS configuration
   */
  cors?: {
    origin?: string | string[];
    credentials?: boolean;
    allowedHeaders?: string[];
    exposedHeaders?: string[];
  };

  /**
   * Health check endpoint
   * @default "/health"
   */
  healthCheckPath?: string;

  /**
   * Is development mode (for error formatting)
   * @default process.env.NODE_ENV === "development"
   */
  isDevelopment?: boolean;
}

/**
 * GraphQL Server type (Yoga instance)
 */
export type GraphQLServer = ReturnType<typeof createGraphQLServer>;

/**
 * Yoga context (initial context before GraphQL context is built)
 */
export type YogaContext = YogaInitialContext;

/**
 * Create a GraphQL Yoga server
 *
 * This factory creates a fully configured Yoga server with:
 * - Schema execution
 * - Context creation
 * - Error formatting
 * - CORS support
 * - Health checks
 * - Request logging
 *
 * ## Usage
 *
 * ```typescript
 * import { createGraphQLServer } from "@mirai-app/frameworks/graphql";
 * import { schema } from "./schema";
 * import { context } from "./context";
 *
 * const yoga = createGraphQLServer({
 *   schema,
 *   context,
 *   graphiql: true,
 * });
 *
 * // With Hono
 * import { Hono } from "hono";
 *
 * const app = new Hono();
 * app.use("/graphql", yoga);
 * ```
 *
 * @param config - Server configuration
 * @returns Configured Yoga server
 */
export function createGraphQLServer(config: GraphQLServerConfig) {
  const isDevelopment =
    config.isDevelopment ?? process.env.NODE_ENV === "development";
  const graphiql = config.graphiql ?? isDevelopment;
  const introspection = config.introspection ?? isDevelopment;

  const yogaConfig: YogaServerOptions<GraphQLContext, GraphQLContext> = {
    schema: config.schema,
    context: config.context,

    // GraphiQL IDE (enables introspection in dev mode automatically)
    graphiql,

    // Logging
    logging: config.logging ?? isDevelopment,

    // Error formatting
    maskedErrors: {
      maskError(error) {
        return formatError(
          error as Error & { extensions?: Record<string, unknown> },
          isDevelopment,
        );
      },
    },

    // CORS
    cors: config.cors ?? {
      origin: "*",
      credentials: true,
      allowedHeaders: ["content-type", "authorization", "x-request-id"],
    },

    // Enable multipart for file uploads
    multipart: true,

    // Health check
    healthCheckEndpoint: config.healthCheckPath ?? "/health",

    // Parser cache for performance
    parserAndValidationCache: true,
  };

  return createYoga(yogaConfig);
}

/**
 * Create a simple GraphQL server with defaults
 *
 * Quick-start function for simple use cases.
 *
 * @param schema - GraphQL schema
 * @param context - Context factory
 * @returns Yoga server
 */
export function createSimpleGraphQLServer(
  schema: GraphQLSchema,
  context: GraphQLContextFactory,
): GraphQLServer {
  return createGraphQLServer({
    schema,
    context,
    graphiql: true,
    introspection: true,
  });
}
