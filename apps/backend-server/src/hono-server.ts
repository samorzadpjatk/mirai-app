/**
 * Hono Server
 *
 * HTTP server foundation for the GraphQL API.
 * Provides a lightweight, high-performance foundation using Hono
 * with middleware for CORS, logging, and error handling.
 *
 * ## Architecture
 *
 * The server is designed to coexist with the existing tRPC server:
 * - tRPC: Port 3000 (Fastify-based, existing)
 * - GraphQL: Port 4000 (Hono-based, new)
 *
 * Both servers share the same DI container for consistent
 * dependency injection across the application.
 *
 * ## Features
 *
 * - Request-scoped DI container context
 * - Health check endpoint at /health
 * - CORS support
 * - Structured logging
 * - Graceful shutdown
 * - Error handling middleware
 *
 * ## Usage
 *
 * ```typescript
 * import { createHonoServer } from "./hono-server";
 * import { honoConfig } from "./config/hono-config";
 *
 * const server = createHonoServer(honoConfig);
 * await server.start();
 * ```
 *
 * @module hono-server
 */

import { Hono, type Context, type Next } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve, type ServerType } from "@hono/node-server";
import type { Layer } from "effect";
import { serverLogger } from "@mirai-app/shared";
import { honoConfig, type HonoConfig } from "./config/hono-config";
import {
  createDefaultYogaHandler,
  type YogaHandler,
} from "./graphql/yoga-handler";

// =============================================================================
// Types
// =============================================================================

/**
 * Hono server instance with control methods
 */
export interface HonoServer {
  /** Hono application instance */
  app: Hono;

  /** Node.js HTTP server instance */
  server: ServerType;

  /** GraphQL Yoga handler instance */
  yoga: YogaHandler;

  /** Start the server */
  start: () => Promise<void>;

  /** Stop the server gracefully */
  stop: () => Promise<void>;

  /** Check if server is running */
  isRunning: () => boolean;

  /** Get the actual port the server is listening on (useful for dynamic port allocation) */
  getPort: () => number;
}

/**
 * Hono context variables
 *
 * Extended with AppLayer for Effect-based dependency injection.
 */
export interface HonoContext {
  /** Effect AppLayer with all repositories and services */
  appLayer: Layer.Layer<unknown>;
}

// =============================================================================
// Layer Integration
// =============================================================================

/** Global AppLayer instance passed from bootstrap */
let _appLayer: Layer.Layer<unknown> | null = null;

/**
 * Set the global AppLayer for the Hono server
 * Called once during bootstrap.
 *
 * @param layer - The AppLayer with all dependencies
 */
export function setHonoAppLayer(layer: Layer.Layer<unknown>): void {
  _appLayer = layer;
}

/**
 * Get the global AppLayer for the Hono server
 * @returns The AppLayer or null if not set
 */
export function getHonoAppLayer(): Layer.Layer<unknown> | null {
  return _appLayer;
}

// =============================================================================
// Middleware
// =============================================================================

/**
 * AppLayer middleware
 *
 * Provides the AppLayer to each request for Effect-based DI.
 */
function createAppLayerMiddleware(layer: Layer.Layer<unknown>) {
  return async (c: Context, next: Next) => {
    c.set("appLayer", layer);
    await next();
  };
}

/**
 * Error handling middleware
 *
 * Catches errors and converts them to JSON responses.
 * Preserves error details in development, sanitizes in production.
 */
function createErrorHandler(config: HonoConfig) {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      // Log the error
      serverLogger.error("[Hono] Error:", { error });

      // Prepare error response
      const status = 500;
      const message =
        config.isProduction && error instanceof Error
          ? "Internal Server Error"
          : error instanceof Error
            ? error.message
            : "Unknown error";

      return c.json(
        {
          error: {
            message,
            ...(config.isDevelopment && error instanceof Error
              ? { stack: error.stack }
              : {}),
          },
        },
        status,
      );
    }
  };
}

// =============================================================================
// Server Creation
// =============================================================================

/**
 * Create Hono server with full configuration
 *
 * @param config - Server configuration
 * @param appLayer - Effect AppLayer with all dependencies (optional if set globally)
 * @returns Configured Hono server instance
 */
export function createHonoServer(
  config: HonoConfig = honoConfig,
  appLayer?: Layer.Layer<unknown>,
): HonoServer {
  // Use provided layer or global layer
  const layer = appLayer ?? _appLayer;
  if (!layer) {
    throw new Error(
      "AppLayer is required. Pass it to createHonoServer() or call setHonoAppLayer() first.",
    );
  }

  // Create Hono app
  const app = new Hono();

  // ==========================================================================
  // Global Middleware
  // ==========================================================================

  // CORS configuration
  if (config.corsOrigin) {
    app.use(
      "*",
      cors({
        origin: config.corsOrigin,
        credentials: true,
      }),
    );
  }

  // Request logging (only in development or if explicitly enabled)
  if (config.enableLogging) {
    app.use("*", logger());
  }

  // Error handling
  app.use("*", createErrorHandler(config));

  // AppLayer middleware - provides Effect Layer for DI
  app.use("*", createAppLayerMiddleware(layer));

  // ==========================================================================
  // Routes
  // ==========================================================================

  // Create Yoga handler
  const yoga = createDefaultYogaHandler(config.isDevelopment);

  // GraphQL health check endpoint
  app.get("/graphql/health", async (c) => {
    try {
      // Verify schema is accessible
      const { schema } = await import("./graphql/schema");
      const isHealthy = schema !== undefined && schema !== null;

      return c.json(
        {
          status: isHealthy ? "healthy" : "unhealthy",
          schema: isHealthy ? "loaded" : "not loaded",
          timestamp: new Date().toISOString(),
        },
        isHealthy ? 200 : 503,
      );
    } catch (error) {
      return c.json(
        {
          status: "unhealthy",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
        503,
      );
    }
  });

  // GraphQL endpoint - handles all GraphQL requests
  // Support both GET (for queries/subscriptions) and POST (for mutations)
  app.all("/graphql", async (c) => {
    return yoga.handle(c.req.raw, { context: c });
  });

  // Health check endpoint
  app.get("/health", (c) => {
    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      server: "hono",
      version: process.env.npm_package_version ?? "unknown",
    });
  });

  // Root endpoint - API info
  app.get("/", (c) => {
    return c.json({
      name: "Mirai App GraphQL API",
      version: process.env.npm_package_version ?? "1.0.0",
      endpoints: {
        health: "/health",
        graphqlHealth: "/graphql/health",
        graphql: config.graphqlPath,
        ...(config.enableGraphiQL
          ? { graphiql: `${config.graphqlPath}/graphiql` }
          : {}),
      },
    });
  });

  // ==========================================================================
  // Server Instance
  // ==========================================================================

  let serverInstance: ServerType | null = null;
  let isRunning = false;

  // Server creation is deferred to start() to avoid port conflicts during module import

  // ==========================================================================
  // Control Methods
  // ==========================================================================

  /**
   * Start the server
   */
  const start = async (): Promise<void> => {
    if (isRunning) {
      serverLogger.info("[Hono] Server already running");
      return;
    }

    // Create server instance on first start
    if (!serverInstance) {
      serverInstance = serve({
        fetch: app.fetch,
        port: config.port,
        hostname: config.host,
      });
    }

    return new Promise((resolve, reject) => {
      serverInstance?.on("listening", () => {
        isRunning = true;
        serverLogger.info(
          `[Hono] Server running at http://${config.host}:${config.port}`,
        );
        serverLogger.info(
          `[Hono] Health check: http://${config.host}:${config.port}/health`,
        );
        serverLogger.info(
          `[Hono] GraphQL health: http://${config.host}:${config.port}/graphql/health`,
        );
        serverLogger.info(
          `[Hono] GraphQL endpoint: http://${config.host}:${config.port}${config.graphqlPath}`,
        );
        if (config.enableGraphiQL) {
          serverLogger.info(
            `[Hono] GraphiQL playground: http://${config.host}:${config.port}${config.graphqlPath}/graphiql`,
          );
        }
        resolve();
      });

      serverInstance?.on("error", (error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        serverLogger.error("[Hono] Server error:", { error: err });
        reject(err);
      });
    });
  };

  /**
   * Stop the server gracefully
   */
  const stop = async (): Promise<void> => {
    if (!isRunning || !serverInstance) {
      serverLogger.info("[Hono] Server not running");
      return;
    }

    serverLogger.info("[Hono] Shutting down gracefully...");

    return new Promise((resolve) => {
      // Set shutdown timeout
      const shutdownTimeout = setTimeout(() => {
        serverLogger.error("[Hono] Forced shutdown after timeout");
        process.exit(1);
      }, config.shutdownTimeout);

      serverInstance?.close(() => {
        clearTimeout(shutdownTimeout);
        isRunning = false;
        serverLogger.info("[Hono] Server stopped");
        resolve();
      });
    });
  };

  /**
   * Check if server is running
   */
  const checkIsRunning = (): boolean => {
    return isRunning;
  };

  /**
   * Get the actual port the server is listening on
   * Returns the configured port if server hasn't started yet,
   * or the dynamically allocated port if using port 0
   */
  const getPort = (): number => {
    if (serverInstance && isRunning) {
      const address = serverInstance.address();
      if (typeof address === "object" && address !== null) {
        return address.port;
      }
    }
    return config.port;
  };

  // ==========================================================================
  // Graceful Shutdown
  // ==========================================================================

  // Handle graceful shutdown signals
  const shutdownHandler = async (signal: string) => {
    serverLogger.info(`[Hono] Received ${signal}, shutting down...`);
    await stop();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdownHandler("SIGTERM"));
  process.on("SIGINT", () => void shutdownHandler("SIGINT"));

  return {
    app,
    get server() {
      return serverInstance;
    },
    yoga,
    start,
    stop,
    isRunning: checkIsRunning,
    getPort,
  };
}

// =============================================================================
// Default Export
// =============================================================================

/**
 * Create and export default server instance
 *
 * This can be imported and started directly:
 *
 * ```typescript
 * import { honoServer } from "./hono-server";
 * await honoServer.start();
 * ```
 */
export const honoServer = createHonoServer(honoConfig);
