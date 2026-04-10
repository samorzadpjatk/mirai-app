/**
 * Hono Server Configuration
 *
 * Environment-based configuration for the Hono server.
 * Supports both development and production settings with
 * sensible defaults for GraphQL API infrastructure.
 *
 * ## Environment Variables
 *
 * - `HONO_SERVER_PORT` - Server port (default: 4000)
 * - `HONO_SERVER_HOST` - Server host (default: 127.0.0.1)
 * - `HONO_ENABLE_GRAPHIQL` - Enable GraphiQL playground (default: true in dev)
 * - `HONO_GRAPHQL_PATH` - GraphQL endpoint path (default: /graphql)
 * - `NODE_ENV` - Environment mode (development, production, test)
 *
 * ## Usage
 *
 * ```typescript
 * import { honoConfig } from "./config/hono-config";
 *
 * const app = new Hono();
 * app.listen(honoConfig.port);
 * ```
 *
 * @module hono-config
 */

import { env } from "node:process";

// =============================================================================
// Environment Detection
// =============================================================================

const nodeEnv = env.NODE_ENV ?? "development";
const isDevelopment = nodeEnv === "development";
const isProduction = nodeEnv === "production";
const isTest = nodeEnv === "test";

// =============================================================================
// Configuration Extraction
// =============================================================================

const getPort = (): number => {
  const port = env.HONO_SERVER_PORT ?? "4000";
  const parsed = Number(port);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(
      `Invalid HONO_SERVER_PORT: "${port}". Must be a valid port number (1-65535).`,
    );
  }
  return parsed;
};

const getHost = (): string => {
  return env.HONO_SERVER_HOST ?? "127.0.0.1";
};

const getGraphQLPath = (): string => {
  return env.HONO_GRAPHQL_PATH ?? "/graphql";
};

const getEnableGraphiQL = (): boolean => {
  const envValue = env.HONO_ENABLE_GRAPHIQL;
  if (envValue !== undefined) {
    return envValue === "true" || envValue === "1";
  }
  // Default: enabled in development, disabled in production
  return isDevelopment;
};

// =============================================================================
// Configuration Object
// =============================================================================

/**
 * Hono server configuration
 *
 * Provides environment-based settings for server startup,
 * GraphQL endpoint, and development tools.
 */
export const honoConfig = {
  /**
   * Server port
   *
   * Default: 4000 (to avoid conflict with tRPC server on 3000)
   */
  port: getPort(),

  /**
   * Server host
   *
   * Default: 127.0.0.1 (localhost only, for security)
   */
  host: getHost(),

  /**
   * GraphQL endpoint path
   *
   * Default: /graphql
   */
  graphqlPath: getGraphQLPath(),

  /**
   * Enable GraphiQL playground
   *
   * Default: true in development, false in production
   */
  enableGraphiQL: getEnableGraphiQL(),

  /**
   * Environment mode
   */
  env: nodeEnv,

  /**
   * Development mode flag
   */
  isDevelopment,

  /**
   * Production mode flag
   */
  isProduction,

  /**
   * Test mode flag
   */
  isTest,

  /**
   * Graceful shutdown timeout in milliseconds
   *
   * Default: 10000ms (10 seconds)
   */
  shutdownTimeout: Number(env.HONO_SHUTDOWN_TIMEOUT ?? "10000"),

  /**
   * Request timeout in milliseconds
   *
   * Default: 30000ms (30 seconds)
   */
  requestTimeout: Number(env.HONO_REQUEST_TIMEOUT ?? "30000"),

  /**
   * CORS origin configuration
   *
   * Default: * in development, undefined in production
   */
  corsOrigin: env.HONO_CORS_ORIGIN ?? (isDevelopment ? "*" : undefined),

  /**
   * Enable request logging
   *
   * Default: true in development, false in production
   */
  enableLogging: env.HONO_ENABLE_LOGGING
    ? env.HONO_ENABLE_LOGGING === "true"
    : isDevelopment,
} as const;

// =============================================================================
// Type Exports
// =============================================================================

/**
 * Hono configuration type
 */
export type HonoConfig = typeof honoConfig;

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate that the configuration is safe to use
 *
 * @throws Error if configuration is invalid
 */
export function validateHonoConfig(): void {
  const issues: string[] = [];

  // Port conflicts with tRPC
  if (honoConfig.port === 3000) {
    issues.push(
      "Port 3000 conflicts with tRPC server. Use a different port (default: 4000).",
    );
  }

  // GraphiQL in production
  if (honoConfig.isProduction && honoConfig.enableGraphiQL) {
    issues.push(
      "GraphiQL should not be enabled in production. Set HONO_ENABLE_GRAPHIQL=false",
    );
  }

  if (issues.length > 0) {
    throw new Error(
      `Hono configuration validation failed:\n${issues.map((i) => `  - ${i}`).join("\n")}`,
    );
  }
}

/**
 * Print configuration summary (safe to log - no secrets)
 */
export function printHonoConfig(): void {
  console.log("[Hono] Configuration:");
  console.log(`  Port: ${honoConfig.port}`);
  console.log(`  Host: ${honoConfig.host}`);
  console.log(`  GraphQL Path: ${honoConfig.graphqlPath}`);
  console.log(
    `  GraphiQL: ${honoConfig.enableGraphiQL ? "enabled" : "disabled"}`,
  );
  console.log(`  Environment: ${honoConfig.env}`);
  console.log(
    `  Logging: ${honoConfig.enableLogging ? "enabled" : "disabled"}`,
  );
}
