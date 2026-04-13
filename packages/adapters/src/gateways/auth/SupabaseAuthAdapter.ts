/**
 * SupabaseAuthAdapter - AuthPort implementation using Supabase Auth
 *
 * This adapter implements the AuthPort interface to validate tokens
 * using Supabase Auth. It wraps the Supabase client and maps
 * Supabase user data to the domain AuthContext value object.
 *
 * Key Design Decisions:
 * - Uses Effect type for composable error handling and structured concurrency
 * - Maps Supabase errors to domain AuthError types
 * - Thin wrapper with no business logic (just mapping)
 * - Compatible with awilix-modular dependency injection
 *
 * @module gateways
 */

import type {
  SupabaseClient,
  SupabaseUser,
} from "@mirai-app/frameworks/supabase";
import {
  type AuthPort,
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
} from "@mirai-app/use-cases/ports/AuthPort";
import {
  AuthContext,
  type UserId,
  UserRole,
  UserId as UserIdFactory,
} from "@mirai-app/domain";
import { Effect } from "effect";

// =============================================================================
// Error Mapping
// =============================================================================

/**
 * Supabase auth error codes that we handle explicitly
 */
const SUPABASE_AUTH_ERROR_CODES = {
  // Token/Session errors
  "auth-session-missing": "Session missing or invalid",
  "bad-jwt": "Invalid JWT token format",
  "jwt-expired": "JWT token has expired",
  "jwt-invalid-claims": "JWT token has invalid claims",
  "jwt-invalid-signature": "JWT signature is invalid",
  "jwt-invalid-audience": "JWT audience is invalid",
  "jwt-invalid-issuer": "JWT issuer is invalid",
  // User errors
  "user-not-found": "User not found",
  "user-banned": "User is banned",
  // Network/Service errors
  "unexpected-failure": "Unexpected authentication failure",
  "server-error": "Authentication server error",
} as const;

/**
 * Maps Supabase auth errors to domain AuthError types
 *
 * @param error - The error from Supabase
 * @param operation - The operation being performed
 * @returns Mapped domain error
 */
function mapSupabaseErrorToAuthError(
  error: unknown,
  operation: string,
): AuthError | InvalidTokenError | SessionExpiredError {
  if (error instanceof Error) {
    // Check for Supabase-specific error status or code
    const errorCode =
      (error as { status?: number; code?: string }).status?.toString() ??
      (error as { code?: string }).code;

    // Check if this is a JWT/token-related error
    if (errorCode && errorCode in SUPABASE_AUTH_ERROR_CODES) {
      const code = errorCode as keyof typeof SUPABASE_AUTH_ERROR_CODES;

      // Map to specific domain error types
      if (code === "jwt-expired" || code === "auth-session-missing") {
        return new SessionExpiredError({
          sessionId: "unknown",
          expiredAt: new Date(),
          message: SUPABASE_AUTH_ERROR_CODES[code],
        });
      }

      if (
        code.startsWith("jwt-") ||
        code === "bad-jwt" ||
        code === "user-not-found"
      ) {
        return new InvalidTokenError({
          message: SUPABASE_AUTH_ERROR_CODES[code],
          token: undefined,
        });
      }
    }

    // Handle HTTP status codes from Supabase
    const status = (error as { status?: number }).status;
    if (status === 401) {
      return new InvalidTokenError({
        message: "Unauthorized: Invalid or expired token",
        token: undefined,
      });
    }
    if (status === 403) {
      return new AuthError({
        message: "Forbidden: User is banned or access denied",
      });
    }

    // Generic error with message
    return new AuthError({
      message: `Authentication failed: ${error.message}`,
    });
  }

  // Unknown error type
  return new AuthError({
    message: `Unknown ${operation} error occurred`,
  });
}

// =============================================================================
// User Role Mapping
// =============================================================================

/**
 * Extract role from Supabase user metadata
 *
 * @param supabaseUser - The Supabase user object
 * @returns UserRole based on metadata or USER as default
 */
function extractRoleFromSupabaseUser(supabaseUser: SupabaseUser): UserRole {
  // Check app_metadata first (set by Supabase hooks/triggers)
  const appRole = supabaseUser.app_metadata?.role as string | undefined;
  if (appRole) {
    const normalizedRole = appRole.toUpperCase();
    if (normalizedRole === "ADMIN") return UserRole.ADMIN;
    if (normalizedRole === "MODERATOR") return UserRole.MODERATOR;
    if (normalizedRole === "USER") return UserRole.USER;
  }

  // Check user_metadata (set during signup)
  const userRole = supabaseUser.user_metadata?.role as string | undefined;
  if (userRole) {
    const normalizedRole = userRole.toUpperCase();
    if (normalizedRole === "ADMIN") return UserRole.ADMIN;
    if (normalizedRole === "MODERATOR") return UserRole.MODERATOR;
    if (normalizedRole === "USER") return UserRole.USER;
  }

  // Default to USER role
  return UserRole.USER;
}

/**
 * Map Supabase user to domain AuthContext
 *
 * @param supabaseUser - The Supabase user object
 * @returns Effect<AuthContext, AuthError>
 */
function mapSupabaseUserToAuthContext(
  supabaseUser: SupabaseUser,
): Effect.Effect<AuthContext, AuthError, never> {
  return Effect.sync(() => {
    // Extract user ID from Supabase user (using authUserId from Supabase)
    const userIdString = supabaseUser.id;
    if (!userIdString) {
      throw new AuthError({
        message: "Supabase user missing required ID field",
      });
    }

    // Create branded UserId (safe since Supabase UUIDs are valid)
    const userId: UserId = UserIdFactory.unsafeCreate(userIdString);

    // Extract role from metadata
    const role = extractRoleFromSupabaseUser(supabaseUser);

    // Use email_confirmed_at as authentication timestamp, or now as fallback
    const authenticatedAt = supabaseUser.email_confirmed_at
      ? new Date(supabaseUser.email_confirmed_at)
      : new Date();

    // Create AuthContext using factory method - this returns a Result
    const result = AuthContext.create({
      userId,
      role,
      authenticatedAt,
      sessionId: undefined, // Supabase doesn't expose session ID in getUser response
    });

    // Unwrap the Result - if it's an error, throw it to be caught by Effect
    if (result.kind === "err") {
      throw result.error;
    }

    return result.value;
  }).pipe(
    Effect.catchAll((error: unknown) => {
      if (error instanceof AuthError) {
        return Effect.fail(error);
      }
      return Effect.fail(
        new AuthError({
          message: `Failed to map Supabase user: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
      );
    }),
  );
}

// =============================================================================
// SupabaseAuthAdapter
// =============================================================================

/**
 * SupabaseAuthAdapter
 *
 * Implements AuthPort using Supabase Auth to validate tokens and
 * manage authentication sessions.
 *
 * Compatible with awilix-modular dependency injection.
 * Registered in the DI module with scoped lifetime.
 *
 * @example
 * ```typescript
 * // With DI container (awilix-modular)
 * const authPort = container.resolve("authPort");
 * const result = await Effect.runPromise(authPort.validateToken("jwt-token-string"));
 *
 * // Manual instantiation (backward-compatible)
 * const authPort = new SupabaseAuthAdapter(supabaseClient);
 * const result = await Effect.runPromise(authPort.validateToken("jwt-token-string"));
 *
 * // Handle with Effect.runPromise for direct value or error
 * try {
 *   const authContext = await Effect.runPromise(authPort.validateToken("token"));
 *   console.log("Authenticated user:", authContext.userId);
 * } catch (error) {
 *   console.error("Auth failed:", error.message);
 * }
 * ```
 */
export class SupabaseAuthAdapter implements AuthPort {
  /**
   * Creates a new SupabaseAuthAdapter
   *
   * @param supabase - SupabaseClient instance (injected by awilix or passed manually)
   */
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Validate an authentication token using Supabase Auth
   *
   * Calls supabase.auth.getUser(token) to verify the token and retrieve
   * user information. Maps the Supabase user to the domain AuthContext.
   *
   * @param token - The JWT token to validate
   * @returns Effect<AuthContext, AuthError | InvalidTokenError, never>
   *
   * @example
   * ```typescript
   * const effect = adapter.validateToken("eyJhbGciOiJIUzI1NiIs...");
   *
   * // Run the effect
   * const result = await Effect.runPromise(effect);
   * console.log(`User ${result.userId} authenticated with role ${result.role}`);
   * ```
   */
  validateToken(
    token: string,
  ): Effect.Effect<
    AuthContext,
    AuthError | InvalidTokenError | SessionExpiredError,
    never
  > {
    // Handle empty token case synchronously
    if (!token || token.trim().length === 0) {
      return Effect.fail(
        new InvalidTokenError({
          message: "Token cannot be empty",
          token: token,
        }),
      );
    }

    return Effect.tryPromise({
      try: async () => {
        // Call Supabase auth API to validate token
        const { data, error } = await this.supabase.auth.getUser(token);

        // Handle Supabase errors by throwing to trigger catch handler
        if (error) {
          throw mapSupabaseErrorToAuthError(error, "validateToken");
        }

        // Handle missing user data
        if (!data.user) {
          throw new InvalidTokenError({
            message: "Token valid but user not found",
            token,
          });
        }

        // Return the user for mapping
        return data.user;
      },
      catch: (error) =>
        error instanceof InvalidTokenError ||
        error instanceof AuthError ||
        error instanceof SessionExpiredError
          ? error
          : mapSupabaseErrorToAuthError(error, "validateToken"),
    }).pipe(Effect.flatMap(mapSupabaseUserToAuthContext));
  }

  /**
   * Refresh an existing session using Supabase Auth
   *
   * Note: This implementation uses Supabase's built-in session management.
   * The sessionId parameter is used for logging purposes but Supabase
   * manages sessions internally via cookies/localStorage.
   *
   * @param sessionId - The session identifier (used for logging)
   * @returns Effect<AuthContext, AuthError | SessionExpiredError, never>
   *
   * @example
   * ```typescript
   * const effect = adapter.refreshSession("session-123");
   *
   * // Run the effect
   * try {
   *   const authContext = await Effect.runPromise(effect);
   *   console.log("Session refreshed for user:", authContext.userId);
   * } catch (error) {
   *   console.error("Failed to refresh session:", error.message);
   * }
   * ```
   */
  refreshSession(
    sessionId: string,
  ): Effect.Effect<AuthContext, AuthError | SessionExpiredError, never> {
    return Effect.tryPromise({
      try: async () => {
        // Get current session from Supabase
        const { data, error } = await this.supabase.auth.getSession();

        // Handle Supabase errors
        if (error) {
          const mappedError = mapSupabaseErrorToAuthError(
            error,
            "refreshSession",
          );
          if (mappedError instanceof SessionExpiredError) {
            throw mappedError;
          }
          throw new SessionExpiredError({
            sessionId,
            expiredAt: new Date(),
            message: mappedError.message,
          });
        }

        // Handle missing session
        if (!data.session) {
          throw new SessionExpiredError({
            sessionId,
            expiredAt: new Date(),
            message: "No active session found",
          });
        }

        // Check if session has expired
        if (data.session.expires_at) {
          const expiresAt = new Date(data.session.expires_at * 1000);
          if (expiresAt.getTime() < Date.now()) {
            throw new SessionExpiredError({
              sessionId,
              expiredAt: expiresAt,
              message: "Session has expired",
            });
          }
        }

        // Validate the access token from the session to get user info
        if (!data.session.access_token) {
          throw new SessionExpiredError({
            sessionId,
            expiredAt: new Date(),
            message: "Session missing access token",
          });
        }

        // Return the access token for validation
        return data.session.access_token;
      },
      catch: (error) =>
        error instanceof SessionExpiredError || error instanceof AuthError
          ? error
          : new SessionExpiredError({
              sessionId,
              expiredAt: new Date(),
              message:
                error instanceof Error
                  ? error.message
                  : "Session refresh failed",
            }),
    }).pipe(
      Effect.flatMap((accessToken) =>
        // Re-use validateToken to get AuthContext from session token
        this.validateToken(accessToken).pipe(
          Effect.mapError((error) =>
            error instanceof SessionExpiredError
              ? error
              : new SessionExpiredError({
                  sessionId,
                  expiredAt: new Date(),
                  message: error.message,
                }),
          ),
        ),
      ),
      Effect.map((authContext) => authContext.withSessionId(sessionId)),
    );
  }
}
