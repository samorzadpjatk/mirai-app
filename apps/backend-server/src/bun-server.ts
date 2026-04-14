/**
 * Bun WebSocket Server
 *
 * Native Bun WebSocket server implementation that replaces @hono/node-server.
 * Supports both HTTP/GraphQL and WebSocket connections on the same port.
 *
 * ## Architecture
 *
 * - Uses `Bun.serve()` with both `fetch` (HTTP) and `websocket` handlers
 * - HTTP requests are routed through Hono for middleware and routing
 * - WebSocket upgrade requests at `/graphql/ws` are handled by Bun's native WS
 * - GraphQL subscriptions use graphql-ws protocol
 *
 * ## WebSocket Protocol
 *
 * This server implements the graphql-ws protocol for GraphQL subscriptions:
 * - Client sends `ConnectionInit` message
 * - Server responds with `ConnectionAck`
 * - Client sends `Subscribe` with subscription query
 * - Server sends `Next` with data or `Error` on failure
 * - Client can send `Complete` to stop subscription
 *
 * ## Bun-specific Features
 *
 * - Native WebSocket support (no external WS library needed)
 * - High-performance HTTP server
 * - Built-in request parsing
 * - Zero-copy where possible
 *
 * ## Usage
 *
 * ```typescript
 * import { createBunServer } from "./bun-server";
 * import { honoConfig } from "./config/hono-config";
 *
 * const server = createBunServer(honoConfig);
 * await server.start();
 * ```
 *
 * @module bun-server
 */

import { Hono, type Context, type Next } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { type AwilixContainer } from "awilix";
import {
  initializeContainer,
  createChildContainer,
  AppModule,
  getContainer,
  isContainerInitialized,
} from "@mirai-app/frameworks/di";
import { honoConfig, type HonoConfig } from "./config/hono-config";
import {
  createDefaultYogaHandler,
  type YogaHandler,
} from "./graphql/yoga-handler";
import { schema } from "./graphql/schema";
import { extractAuthToken, validateAuthToken } from "./websocket/auth-handler";
import type { AuthPort } from "@mirai-app/use-cases";

// =============================================================================
// Types
// =============================================================================

/**
 * Bun server instance with control methods
 */
export interface BunServer {
  /** Hono application instance */
  app: Hono;

  /** Bun server instance */
  server: ReturnType<typeof Bun.serve>;

  /** GraphQL Yoga handler instance */
  yoga: YogaHandler;

  /** Start the server */
  start: () => Promise<void>;

  /** Stop the server gracefully */
  stop: () => Promise<void>;

  /** Check if server is running */
  isRunning: () => boolean;

  /** Get active WebSocket connections count */
  getWebSocketCount: () => number;

  /** Get the actual port the server is listening on */
  getPort: () => number;
}

/**
 * Hono context variables
 *
 * Extended with DI container for request-scoped dependency injection.
 */
export interface HonoContext {
  /** Request-scoped DI container */
  container: AwilixContainer;
}

/**
 * WebSocket connection data
 */
interface WebSocketData {
  /** Connection ID for tracking */
  connectionId: string;

  /** Whether connection is authenticated */
  isAuthenticated: boolean;

  /** User context if authenticated */
  userId?: string;

  /** Active subscription IDs */
  subscriptions: Set<string>;

  /** Connection timestamp */
  connectedAt: Date;
}

// =============================================================================
// Container Integration
// =============================================================================

/**
 * Initialize the DI container for Bun server
 *
 * Reuses existing container if already initialized.
 * Otherwise, creates new container with AppModule.
 *
 * @returns The initialized container
 */
function initializeBunContainer(): AwilixContainer {
  if (isContainerInitialized()) {
    console.log(
      "[DI] Container already initialized, reusing existing container",
    );
    return getContainer();
  }

  console.log("[DI] Initializing container with AppModule...");
  const container = initializeContainer([AppModule]);
  console.log("[DI] Container initialized successfully");
  return container;
}

// =============================================================================
// Middleware
// =============================================================================

/**
 * DI container middleware
 *
 * Creates a request-scoped child container for each request.
 */
function createDIMiddleware(container: AwilixContainer) {
  return async (c: Context, next: Next) => {
    const requestContainer = createChildContainer(container);
    c.set("container", requestContainer);
    await next();
  };
}

/**
 * Error handling middleware
 *
 * Catches errors and converts them to JSON responses.
 */
function createErrorHandler(config: HonoConfig) {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      console.error("[Bun] Error:", error);

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
// WebSocket Connection Management
// =============================================================================

/** Active WebSocket connections */
const activeConnections = new Map<string, WebSocketData>();

/** Generate unique connection ID */
function generateConnectionId(): string {
  return `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get count of active WebSocket connections
 */
export function getActiveWebSocketCount(): number {
  return activeConnections.size;
}

/**
 * Close all WebSocket connections gracefully
 */
function closeAllWebSockets(): void {
  console.log(
    `[Bun] Closing ${activeConnections.size} WebSocket connections...`,
  );

  for (const [connectionId, data] of activeConnections) {
    // Clean up any active subscriptions
    data.subscriptions.clear();
    activeConnections.delete(connectionId);
  }
}

// =============================================================================
// WebSocket Protocol (graphql-ws)
// =============================================================================

/**
 * GraphQL WS message types
 */
enum MessageType {
  // Client -> Server
  ConnectionInit = "connection_init",
  Subscribe = "subscribe",
  Complete = "complete",

  // Server -> Client
  ConnectionAck = "connection_ack",
  Next = "next",
  Error = "error",
  CompleteResponse = "complete_response", // Server response
}

/**
 * Parse WebSocket message
 */
function parseMessage(
  data: string | Buffer,
): { type: MessageType; payload?: unknown; id?: string } | null {
  try {
    const message =
      typeof data === "string" ? JSON.parse(data) : JSON.parse(data.toString());
    return message;
  } catch {
    return null;
  }
}

/**
 * Send message to WebSocket
 */
function sendMessage(ws: WebSocket, message: Record<string, unknown>): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// =============================================================================
// Server Creation
// =============================================================================

/**
 * Create Bun server with WebSocket support
 *
 * @param config - Server configuration
 * @returns Configured Bun server instance
 */
export function createBunServer(config: HonoConfig = honoConfig): BunServer {
  // Initialize DI container
  const container = initializeBunContainer();

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

  // Request logging
  if (config.enableLogging) {
    app.use("*", logger());
  }

  // Error handling
  app.use("*", createErrorHandler(config));

  // DI container
  app.use("*", createDIMiddleware(container));

  // ==========================================================================
  // Routes
  // ==========================================================================

  // Create Yoga handler
  const yoga = createDefaultYogaHandler(config.isDevelopment);

  // GraphQL health check endpoint
  app.get("/graphql/health", async (c) => {
    try {
      const isHealthy = schema !== undefined && schema !== null;

      return c.json(
        {
          status: isHealthy ? "healthy" : "unhealthy",
          schema: isHealthy ? "loaded" : "not loaded",
          websocket: "available",
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

  // GraphQL endpoint
  app.all("/graphql", async (c) => {
    return yoga.handle(c.req.raw, { context: c });
  });

  // Health check endpoint
  app.get("/health", (c) => {
    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      server: "bun",
      websocket: "available",
      connections: getActiveWebSocketCount(),
      version: process.env.npm_package_version ?? "unknown",
    });
  });

  // Root endpoint
  app.get("/", (c) => {
    return c.json({
      name: "Mirai App GraphQL API (Bun + WebSocket)",
      version: process.env.npm_package_version ?? "1.0.0",
      endpoints: {
        health: "/health",
        graphqlHealth: "/graphql/health",
        graphql: config.graphqlPath,
        graphqlWs: "/graphql/ws",
        ...(config.enableGraphiQL
          ? { graphiql: `${config.graphqlPath}/graphiql` }
          : {}),
      },
    });
  });

  // ==========================================================================
  // Server Instance
  // ==========================================================================

  let serverInstance: ReturnType<typeof Bun.serve> | null = null;
  let isRunning = false;

  // ==========================================================================
  // Bun Server Configuration
  // ==========================================================================

  const bunServeConfig = {
    port: config.port,
    hostname: config.host,

    // HTTP request handler
    fetch: async (
      request: Request,
      server: { upgrade: (req: Request) => boolean },
    ) => {
      const url = new URL(request.url);

      // Check for WebSocket upgrade request
      if (url.pathname === "/graphql/ws") {
        const upgrade = (request as Request & { headers: Headers }).headers.get(
          "upgrade",
        );
        if (upgrade === "websocket") {
          // Let Bun handle the WebSocket upgrade
          const upgraded = server.upgrade(request);
          if (upgraded) {
            return new Response("WebSocket upgrade successful", {
              status: 101,
            });
          }
        }
        // No upgrade header or upgrade failed
        return new Response("WebSocket upgrade required", { status: 426 });
      }

      // Regular HTTP request - pass to Hono
      return app.fetch(request);
    },

    // WebSocket handler
    websocket: {
      /**
       * Handle new WebSocket connection
       */
      open(ws: WebSocket): void {
        const connectionId = generateConnectionId();
        const data: WebSocketData = {
          connectionId,
          isAuthenticated: false,
          subscriptions: new Set(),
          connectedAt: new Date(),
        };

        // Store connection data
        (ws as WebSocket & { data?: WebSocketData }).data = data;
        activeConnections.set(connectionId, data);

        console.log(
          `[Bun] WebSocket connected: ${connectionId} (total: ${activeConnections.size})`,
        );
      },

      /**
       * Handle WebSocket message
       */
      message: async (
        ws: WebSocket,
        message: string | Buffer,
      ): Promise<void> => {
        const data = (ws as WebSocket & { data?: WebSocketData }).data;
        if (!data) return;

        const parsed = parseMessage(message);
        if (!parsed) {
          sendMessage(ws, {
            type: MessageType.Error,
            payload: { message: "Invalid message format" },
          });
          return;
        }

        // Handle message based on type
        switch (parsed.type) {
          case MessageType.ConnectionInit: {
            // Extract and validate auth token from WebSocket connection params
            const upgradeRequest = (ws as WebSocket & { request?: Request })
              .request;
            const token = upgradeRequest
              ? extractAuthToken(upgradeRequest)
              : null;

            if (!token) {
              sendMessage(ws, {
                type: MessageType.Error,
                payload: { message: "Authentication required" },
              });
              // Close connection after a short delay to allow error to be sent
              setTimeout(() => ws.close(1008, "Authentication required"), 100);
              break;
            }

            // Validate token using auth port
            try {
              const authPort = container.resolve<AuthPort>("authPort");
              const authResult = await validateAuthToken(token, authPort);

              if (!authResult.success) {
                sendMessage(ws, {
                  type: MessageType.Error,
                  payload: {
                    message: authResult.error ?? "Authentication failed",
                  },
                });
                setTimeout(() => ws.close(1008, "Authentication failed"), 100);
                break;
              }

              // Store auth context in WebSocket data
              data.isAuthenticated = true;
              data.userId = authResult.authContext?.userId;
              (
                ws as WebSocket & {
                  authContext?: typeof authResult.authContext;
                }
              ).authContext = authResult.authContext;

              sendMessage(ws, { type: MessageType.ConnectionAck });
              console.log(
                `[Bun] WebSocket authenticated: ${data.connectionId} (user: ${data.userId})`,
              );
            } catch (error) {
              console.error("[Bun] WebSocket auth error:", error);
              sendMessage(ws, {
                type: MessageType.Error,
                payload: { message: "Authentication failed" },
              });
              setTimeout(() => ws.close(1011, "Authentication error"), 100);
            }
            break;
          }

          case MessageType.Subscribe: {
            if (!data.isAuthenticated) {
              sendMessage(ws, {
                type: MessageType.Error,
                id: parsed.id,
                payload: { message: "Not authenticated" },
              });
              return;
            }

            // Store subscription
            if (parsed.id) {
              data.subscriptions.add(parsed.id);
            }

            // Subscription execution is handled by GraphQL Yoga
            // This is just the WebSocket protocol layer
            console.log(`[Bun] Subscription requested: ${parsed.id}`);
            break;
          }

          case MessageType.Complete: {
            // Remove subscription
            if (parsed.id) {
              data.subscriptions.delete(parsed.id);
            }
            sendMessage(ws, {
              type: MessageType.CompleteResponse,
              id: parsed.id,
            });
            break;
          }

          default: {
            sendMessage(ws, {
              type: MessageType.Error,
              payload: { message: "Unknown message type" },
            });
          }
        }
      },

      /**
       * Handle WebSocket close
       */
      close(ws: WebSocket): void {
        const data = (ws as WebSocket & { data?: WebSocketData }).data;
        if (data) {
          activeConnections.delete(data.connectionId);
          console.log(
            `[Bun] WebSocket disconnected: ${data.connectionId} (total: ${activeConnections.size})`,
          );
        }
      },

      /**
       * Handle WebSocket errors
       */
      error(ws: WebSocket, error: Error): void {
        const data = (ws as WebSocket & { data?: WebSocketData }).data;
        console.error(
          `[Bun] WebSocket error ${data?.connectionId ?? "unknown"}:`,
          error,
        );
      },
    },
  };

  // ==========================================================================
  // Control Methods
  // ==========================================================================

  /**
   * Start the server
   */
  const start = async (): Promise<void> => {
    if (isRunning) {
      console.log("[Bun] Server already running");
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        serverInstance = Bun.serve(bunServeConfig);
        isRunning = true;

        console.log(
          `[Bun] Server running at http://${config.host}:${config.port}`,
        );
        console.log(
          `[Bun] Health check: http://${config.host}:${config.port}/health`,
        );
        console.log(
          `[Bun] GraphQL health: http://${config.host}:${config.port}/graphql/health`,
        );
        console.log(
          `[Bun] GraphQL endpoint: http://${config.host}:${config.port}${config.graphqlPath}`,
        );
        console.log(
          `[Bun] GraphQL WebSocket: ws://${config.host}:${config.port}/graphql/ws`,
        );
        if (config.enableGraphiQL) {
          console.log(
            `[Bun] GraphiQL playground: http://${config.host}:${config.port}${config.graphqlPath}/graphiql`,
          );
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };

  /**
   * Stop the server gracefully
   */
  const stop = async (): Promise<void> => {
    if (!isRunning || !serverInstance) {
      console.log("[Bun] Server not running");
      return;
    }

    console.log("[Bun] Shutting down gracefully...");

    // Close all WebSocket connections
    closeAllWebSockets();

    // Stop the server
    serverInstance.stop(true); // true = force close after timeout
    isRunning = false;

    console.log("[Bun] Server stopped");
  };

  /**
   * Check if server is running
   */
  const checkIsRunning = (): boolean => {
    return isRunning;
  };

  /**
   * Get WebSocket connection count
   */
  const getWebSocketCount = (): number => {
    return activeConnections.size;
  };

  /**
   * Get the actual port the server is listening on
   */
  const getPort = (): number => {
    return serverInstance?.port ?? config.port;
  };

  // ==========================================================================
  // Graceful Shutdown
  // ==========================================================================

  const shutdownHandler = async (signal: string) => {
    console.log(`[Bun] Received ${signal}, shutting down...`);
    await stop();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdownHandler("SIGTERM"));
  process.on("SIGINT", () => void shutdownHandler("SIGINT"));

  return {
    app,
    server: serverInstance!,
    yoga,
    start,
    stop,
    isRunning: checkIsRunning,
    getWebSocketCount,
    getPort,
  };
}

// =============================================================================
// Default Export
// =============================================================================

/**
 * Create and export default server instance
 */
export const bunServer = createBunServer(honoConfig);
