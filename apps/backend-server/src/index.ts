/**
 * Backend Server Entry Point
 *
 * Entry point for the Mirai App backend server.
 *
 * ## Architecture Change
 *
 * The legacy tRPC server (port 3000) has been **removed** in favor of the
 * Hono GraphQL server (port 4000). All API functionality is now available
 * via GraphQL at the `/graphql` endpoint.
 *
 * ## Migration Guide
 *
 * **Old (tRPC - removed):**
 * ```bash
 * npm run dev        # Port 3000
 * ```
 *
 * **New (GraphQL - active):**
 * ```bash
 * npm run dev:hono   # Port 4000
 * npm run start:hono # Port 4000 (production)
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
 *
 * @module index
 */

// Re-export the Hono server as the primary entry point
export { start as startServer } from "./index-hono";

// Import and start the Hono server
import { start } from "./index-hono";

// Start the server
void start();
