/**
 * Legacy tRPC Server - DEPRECATED
 *
 * This file is kept for reference but is no longer used.
 * The application now uses the Hono GraphQL server (index-hono.ts).
 *
 * All API functionality has been migrated to GraphQL at /graphql endpoint.
 * See hono-server.ts for the active server implementation.
 *
 * @deprecated Use hono-server.ts instead
 */

export interface ServerOptions {
  dev?: boolean;
  port?: number;
  prefix?: string;
  host?: string;
}

/**
 * @deprecated The tRPC server has been removed. Use createHonoServer from hono-server.ts instead.
 */
export function createServer(_opts: ServerOptions) {
  throw new Error(
    "tRPC server has been removed. Use Hono GraphQL server instead (npm run dev:hono or npm run start:hono)",
  );
}
