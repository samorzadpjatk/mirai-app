/**
 * Shared Error Handler
 *
 * Common error handling middleware for HTTP servers.
 * Reduces duplication between server implementations.
 *
 * @module shared/error-handler
 */

import type { Context, Next } from "hono";
import { serverLogger } from "@mirai-app/shared";
import type { HonoConfig } from "../config/hono-config";

/**
 * Create error handling middleware
 *
 * Catches errors and converts them to JSON responses.
 * Preserves error details in development, sanitizes in production.
 *
 * @param config - Server configuration
 * @returns Error handling middleware function
 */
export function createErrorHandler(config: HonoConfig) {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      // Log the error
      serverLogger.error("[Server] Error:", { error });

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
