/**
 * WebSocket Authentication Handler
 *
 * Handles authentication for WebSocket connections using http-only cookies.
 * Extracts and validates the auth token from WebSocket upgrade requests.
 *
 * ## Authentication Flow
 *
 * 1. Client logs in via HTTP → Server sets `auth-token` httpOnly cookie
 * 2. WebSocket connects → Cookie sent automatically with upgrade request
 * 3. Server extracts cookie → Validates with Supabase Auth
 * 4. Connection accepted or rejected based on validation
 * 5. Auth context available in subscription resolvers
 *
 * ## Security Considerations
 *
 * - Uses httpOnly cookies (not localStorage) - prevents XSS token theft
 * - Same-domain cookies only - prevents CSRF attacks
 * - Token validated on every connection - ensures freshness
 * - Connection rejected immediately if auth fails - no partial access
 *
 * @module websocket/auth-handler
 */

import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import type { AuthPort, AuthContext } from "@mirai-app/use-cases";
import { serverLogger } from "@mirai-app/shared";

// =============================================================================
// Types
// =============================================================================

/**
 * WebSocket authentication result
 */
export interface WebSocketAuthResult {
  /** Whether authentication succeeded */
  success: boolean;

  /** Auth context if successful */
  authContext?: AuthContext;

  /** Error message if failed */
  error?: string;

  /** HTTP status code for rejection */
  statusCode: number;
}

/**
 * WebSocket connection context with auth
 */
export interface WebSocketConnectionContext {
  /** Connection ID */
  connectionId: string;

  /** Auth context */
  authContext: AuthContext;

  /** Connection timestamp */
  connectedAt: Date;
}

// =============================================================================
// Cookie Names
// =============================================================================

/**
 * Cookie name for auth token
 */
export const AUTH_TOKEN_COOKIE = "auth-token";

/**
 * Alternative cookie names to check
 */
export const ALTERNATIVE_COOKIE_NAMES = [
  "sb-access-token", // Supabase default
  "auth-token",
  "token",
];

// =============================================================================
// Auth Handler
// =============================================================================

/**
 * Extract auth token from WebSocket upgrade request
 *
 * Checks for auth token in:
 * 1. Cookie header (httpOnly cookie)
 * 2. Query parameter (for development/testing)
 *
 * @param request - HTTP upgrade request
 * @returns Token string or null if not found
 */
export function extractAuthToken(request: Request): string | null {
  // Try to get from cookie header (case-insensitive search)
  let cookieHeader: string | null = null;

  // Try standard header name
  cookieHeader = request.headers.get("cookie");

  // If not found, try iterating headers (handles edge cases in different environments)
  if (!cookieHeader && request.headers.entries) {
    for (const [name, value] of request.headers.entries()) {
      if (name.toLowerCase() === "cookie") {
        cookieHeader = value;
        break;
      }
    }
  }

  if (cookieHeader) {
    // Parse cookies manually since we're not in Hono context
    const cookies = parseCookieHeader(cookieHeader);

    // Try primary cookie name
    if (cookies[AUTH_TOKEN_COOKIE]) {
      return cookies[AUTH_TOKEN_COOKIE];
    }

    // Try alternative names
    for (const name of ALTERNATIVE_COOKIE_NAMES) {
      if (cookies[name]) {
        return cookies[name];
      }
    }
  }

  // Try query parameter (for dev/testing only)
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get("token");
  if (tokenParam) {
    return tokenParam;
  }

  return null;
}

/**
 * Parse cookie header into key-value pairs
 */
export function parseCookieHeader(
  cookieHeader: string,
): Record<string, string> {
  const cookies: Record<string, string> = {};

  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name && valueParts.length > 0) {
      const value = valueParts.join("=").trim();
      cookies[name.trim()] = decodeURIComponent(value);
    }
  });

  return cookies;
}

/**
 * Validate auth token using AuthPort
 *
 * @param token - Auth token to validate
 * @param authPort - Auth port implementation
 * @returns Auth result with context or error
 */
export async function validateAuthToken(
  token: string,
  authPort: AuthPort,
): Promise<WebSocketAuthResult> {
  try {
    const result = await authPort.validateToken(token);

    if (result.kind === "ok") {
      return {
        success: true,
        authContext: result.value,
        statusCode: 200,
      };
    } else {
      const errorMessage =
        (result.error as { message?: string })?.message ?? "";
      const isSystemError =
        errorMessage.toLowerCase().includes("connection") ||
        errorMessage.toLowerCase().includes("timeout") ||
        errorMessage.toLowerCase().includes("network") ||
        errorMessage.toLowerCase().includes("unavailable");

      return {
        success: false,
        error: isSystemError
          ? "Authentication failed"
          : "Invalid or expired token",
        statusCode: isSystemError ? 500 : 401,
      };
    }
  } catch (error) {
    serverLogger.error("[WebSocket Auth] Validation error:", { error });
    return {
      success: false,
      error: "Authentication failed",
      statusCode: 500,
    };
  }
}

/**
 * Handle WebSocket authentication
 *
 * Complete auth flow for WebSocket connections.
 *
 * @param request - WebSocket upgrade request
 * @param container - DI container with authPort
 * @returns Auth result with context or error
 *
 * @example
 * ```typescript
 * const result = await handleWebSocketAuth(request, container);
 * if (!result.success) {
 *   // Reject connection
 *   ws.close(1008, result.error);
 *   return;
 * }
 * // Use result.authContext for subscription filtering
 * ```
 */
export async function handleWebSocketAuth(
  request: Request,
  authPort: AuthPort,
): Promise<WebSocketAuthResult> {
  // Extract token from request
  const token = extractAuthToken(request);

  if (!token) {
    return {
      success: false,
      error: "No authentication token provided",
      statusCode: 401,
    };
  }

  // Validate token
  return validateAuthToken(token, authPort);
}

/**
 * Create authenticated WebSocket context
 *
 * Wraps the auth result with connection metadata.
 *
 * @param connectionId - Unique connection ID
 * @param authResult - Successful auth result
 * @returns WebSocket connection context
 */
export function createWebSocketContext(
  connectionId: string,
  authResult: WebSocketAuthResult,
): WebSocketConnectionContext {
  if (!authResult.success || !authResult.authContext) {
    throw new Error("Cannot create context from failed auth result");
  }

  return {
    connectionId,
    authContext: authResult.authContext,
    connectedAt: new Date(),
  };
}

// =============================================================================
// HTTP Context Helpers (for REST endpoints if needed)
// =============================================================================

/**
 * Extract auth token from Hono context
 *
 * For use in HTTP endpoints that need auth.
 *
 * @param c - Hono context
 * @returns Token string or null
 */
export function getAuthTokenFromContext(c: Context): string | null {
  // Try cookie first
  const cookieToken = getCookie(c, AUTH_TOKEN_COOKIE);
  if (cookieToken) {
    return cookieToken;
  }

  // Try alternative cookie names
  for (const name of ALTERNATIVE_COOKIE_NAMES) {
    const token = getCookie(c, name);
    if (token) {
      return token;
    }
  }

  // Try Authorization header
  const authHeader = c.req.header("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Require authentication for HTTP endpoint
 *
 * Throws TRPC-compatible error if not authenticated.
 *
 * @param c - Hono context
 * @param container - DI container
 * @returns Auth context
 * @throws Error if not authenticated
 */
export async function requireAuthContext(
  c: Context,
  authPort: AuthPort,
): Promise<AuthContext> {
  const token = getAuthTokenFromContext(c);

  if (!token) {
    const error = new Error("Unauthorized");
    (error as Error & { code: string }).code = "UNAUTHORIZED";
    throw error;
  }

  const result = await authPort.validateToken(token);

  if (result.kind === "err") {
    const error = new Error("Unauthorized: " + result.error.message);
    (error as Error & { code: string }).code = "UNAUTHORIZED";
    throw error;
  }

  return result.value;
}
