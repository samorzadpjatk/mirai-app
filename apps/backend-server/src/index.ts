/**
 * Backend Server Entry Point
 *
 * Entry point for the Mirai App backend server with Effect integration.
 *
 * ## Architecture
 *
 * The server now uses Effect framework for:
 * - Server lifecycle management (start/stop)
 * - Dependency injection through Effect Layers
 * - Graceful shutdown with composable error handling
 * - Async operation composition
 *
 * ## Migration Guide
 *
 * **Effect Integration (current):**
 * ```bash
 * npm run dev        # Port 4000 with Effect runtime
 * npm run start      # Port 4000 production with Effect
 * ```
 *
 * ## Environment Variables
 *
 * - `HONO_SERVER_PORT` - Server port (default: 4000)
 * - `HONO_SERVER_HOST` - Server host (default: 127.0.0.1)
 * - `SUPABASE_URL` - Supabase project URL
 * - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
 * - `DATABASE_URL` - PostgreSQL connection string
 *
 * ## API Endpoints
 *
 * - Health: `GET /health`
 * - GraphQL: `POST /graphql`
 * - GraphiQL Playground: `GET /graphql` (development only)
 * - GraphQL WebSocket: `ws://host:port/graphql/ws`
 *
 * ## Effect Integration
 *
 * The server lifecycle is now managed through Effect's Layer system:
 * - `HttpServerTag` - Provides server lifecycle methods
 * - `HttpServerConfigTag` - Provides server configuration
 * - DI container is wired to Effect Layers via `setAwilixContainer`
 *
 * @module index
 */

// Re-export the Effect-based server functions
export {
  /** Start the server with Effect runtime */
  start as startServer,
  /** Stop the server gracefully */
  stop as stopServer,
  /** Get the current server instance */
  getServer,
  /** Check if server is running */
  isServerRunning,
} from "./index-hono";

// Re-export Effect server types and utilities
export {
  /** Server service tag for Effect */
  HttpServerTag,
  /** Config service tag for Effect */
  HttpServerConfigTag,
  /** Server start error type */
  ServerStartError,
  /** Server stop error type */
  ServerStopError,
  /** Create Bun server layer */
  createBunServerLayer,
  /** Create Hono server layer */
  createHonoServerLayer,
  /** Create server config layer */
  createServerConfigLayer,
  /** Create complete server layer */
  createServerLayer,
  /** Start server program */
  startServerProgram,
  /** Stop server program */
  stopServerProgram,
  /** Graceful shutdown program */
  gracefulShutdownProgram,
  /** Setup signal handlers */
  setupSignalHandlers,
  /** Type for HTTP server union */
  type HttpServer,
  /** Layer creation options */
  type CreateServerLayerOptions,
} from "./effect-server";

// Import and start the server with Effect
import { start } from "./index-hono";

// Start the server (Effect runtime will handle the rest)
void start();
