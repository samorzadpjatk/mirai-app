import { Effect } from "effect";
import type { BetterAuthInstance } from "@mirai-app/frameworks/better-auth";
import type {
  IAuthPort,
  AccessCheckRequest,
  IPortError,
} from "@mirai-app/domain";
import {
  AuthenticationError,
  AuthSessionExpiredError,
  PermissionDeniedError,
  RateLimitError,
  UserAlreadyExistsError,
  AuthServiceError,
} from "@mirai-app/domain";

/**
 * Better Auth user type from API responses
 */
interface BetterAuthUser {
  id: string;
  email: string;
}

/**
 * Better Auth session response type
 */
interface BetterAuthSessionResult {
  user: BetterAuthUser | null;
  session: { id: string; expiresAt: Date } | null;
  token: string | null;
}

/**
 * Better Auth authentication result type
 */
interface BetterAuthAuthResult {
  user: BetterAuthUser;
  token?: string;
}

/**
 * Better Auth sign-up result type
 */
interface BetterAuthSignUpResult {
  user: BetterAuthUser | null;
}

/**
 * Better Auth Gateway
 *
 * Implements IAuthPort interface using Better Auth SDK for authentication operations.
 * This gateway wraps Better Auth API calls in Effect.tryPromise for consistent
 * error handling and integrates with the Clean Architecture dependency injection system.
 *
 * Features:
 * - Email/password authentication
 * - Email OTP (One-Time Password) sign-in
 * - Session management with cookie-based sessions
 * - Resource-level authorization via verifyAccess
 *
 * Error Handling:
 * - Maps Better Auth errors to domain error types
 * - Uses Effect.tryPromise for all async operations
 * - Provides detailed error context for debugging
 *
 * Session Model:
 * - Better Auth uses cookie-based sessions (httpOnly, secure, sameSite)
 * - Access tokens are managed via cookies, not explicit tokens
 * - For API compatibility, session tokens are extracted from cookies when available
 *
 * @implements {IAuthPort}
 */
export class BetterAuthGateway implements IAuthPort {
  constructor(private readonly auth: BetterAuthInstance) {}

  /**
   * Sign in with email and password
   *
   * Authenticates a user with their email and password credentials.
   * On success, Better Auth sets session cookies automatically.
   *
   * @param email - User email address
   * @param password - User password
   * @returns Effect with user and session data on success
   */
  signInWithPassword(email: string, password: string) {
    return Effect.tryPromise({
      try: async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const result = (await this.auth.api.signInEmail({
          body: {
            email,
            password,
          },
        })) as BetterAuthAuthResult | null;

        if (!result?.user) {
          throw new Error("Sign in failed: no user returned");
        }

        return {
          user: {
            id: result.user.id,
            email: result.user.email,
          },
          session: {
            accessToken: result.token ?? "",
          },
        };
      },
      catch: (error) => mapBetterAuthError(error, "signInWithPassword"),
    });
  }

  /**
   * Send sign-in OTP to email
   *
   * Initiates the OTP-based authentication flow by sending a verification
   * code to the specified email address. The user can then use signInWithOtp
   * to complete authentication.
   *
   * @param email - The email address to send the OTP to
   * @returns Effect that succeeds when OTP is sent
   */
  sendSignInOtp(email: string) {
    return Effect.tryPromise({
      try: async () => {
        // Call Better Auth email-otp endpoint directly via HTTP
        const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:4000";
        const response = await fetch(`${baseUrl}/api/auth/email-otp/send-verification-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            type: "sign-in",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
      },
      catch: (error) => mapBetterAuthError(error, "sendSignInOtp"),
    });
  }

  /**
   * Sign in with email OTP
   *
   * Verifies an OTP code sent to the user's email and authenticates them.
   * On success, Better Auth sets session cookies automatically.
   *
   * @param email - User email address
   * @param otp - One-time password code
   * @returns Effect with user and session data on success
   */
  signInWithOtp(email: string, otp: string) {
    return Effect.tryPromise({
      try: async () => {
        // Call Better Auth email-otp endpoint directly via HTTP
        const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:4000";
        const response = await fetch(`${baseUrl}/api/auth/email-otp/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            otp,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = (await response.json()) as BetterAuthAuthResult | null;

        if (!result?.user) {
          throw new Error("OTP verification failed: no user returned");
        }

        return {
          user: {
            id: result.user.id,
            email: result.user.email,
          },
          session: {
            accessToken: result.token ?? "",
          },
        };
      },
      catch: (error) => mapBetterAuthError(error, "signInWithOtp"),
    });
  }

  /**
   * Sign up with email and password
   *
   * Creates a new user account with the provided email and password.
   * May require email verification depending on Better Auth configuration.
   *
   * @param email - User email address
   * @param password - User password
   * @returns Effect with created user data (null if email confirmation required)
   */
  signUp(email: string, password: string) {
    return Effect.tryPromise({
      try: async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const result = (await this.auth.api.signUpEmail({
          body: {
            email,
            password,
            name: "",
          },
        })) as BetterAuthSignUpResult | null;

        if (!result) {
          return { user: null };
        }

        return {
          user: result.user
            ? {
                id: result.user.id,
                email: result.user.email,
              }
            : null,
        };
      },
      catch: (error) => mapBetterAuthError(error, "signUp"),
    });
  }

  /**
   * Sign out current user
   *
   * Terminates the current session and clears session cookies.
   *
   * @returns Effect that succeeds when sign out completes
   */
  signOut() {
    return Effect.tryPromise({
      try: async () => {
        // Call Better Auth sign-out endpoint directly via HTTP
        const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:4000";
        const response = await fetch(`${baseUrl}/api/auth/sign-out`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
      },
      catch: (error) => mapBetterAuthError(error, "signOut"),
    });
  }

  /**
   * Get current session
   *
   * Retrieves the current authenticated session and user information.
   * Returns null user and token if no valid session exists.
   *
   * @returns Effect with current session info (user and token, or nulls)
   */
  getSession() {
    return Effect.tryPromise({
      try: async () => {
        // Call Better Auth session endpoint directly via HTTP
        const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:4000";
        const response = await fetch(`${baseUrl}/api/auth/session`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 401) {
            // No active session - return nulls
            return {
              user: null,
              accessToken: null,
            };
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = (await response.json()) as BetterAuthSessionResult | null;

        if (!result?.session) {
          return {
            user: null,
            accessToken: null,
          };
        }

        return {
          user: result.user
            ? {
                id: result.user.id,
                email: result.user.email,
              }
            : null,
          accessToken: result.token ?? null,
        };
      },
      catch: (error) => mapBetterAuthError(error, "getSession"),
    });
  }

  /**
   * Refresh current session
   *
   * Refreshes the session token to extend the session lifetime.
   * Better Auth handles session refresh automatically via cookie-based
   * sessions, but this method provides explicit refresh capability
   * for API compatibility.
   *
   * @returns Effect with refreshed session (or null if session expired)
   */
  refreshSession() {
    return Effect.tryPromise({
      try: async () => {
        // Call Better Auth session endpoint to get current session
        // Better Auth automatically refreshes cookie-based sessions
        const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:4000";
        const response = await fetch(`${baseUrl}/api/auth/session`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Session expired
            return { session: null };
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = (await response.json()) as BetterAuthSessionResult | null;

        if (!result?.session) {
          return { session: null };
        }

        return {
          session: {
            accessToken: result.token ?? "",
          },
        };
      },
      catch: (error) => mapBetterAuthError(error, "refreshSession"),
    });
  }

  /**
   * Verify access to a resource
   *
   * Validates that the user has the required permissions for the specified
   * resource. Uses role-based access control (RBAC) and supports ownership checks.
   *
   * Role hierarchy:
   * - ADMIN: Full access to all resources
   * - MODERATOR: Write access to most resources, limited admin access
   * - USER: Standard access, resource ownership required for some operations
   *
   * @param request - Access check request with user context and resource info
   * @returns Effect that succeeds if access granted, fails with PermissionDeniedError otherwise
   */
  verifyAccess(request: AccessCheckRequest) {
    return Effect.gen(function* () {
      const {
        userId,
        role,
        resourceType,
        resourceId,
        requiredPermission,
        requireOwnership,
      } = request;

      // ADMIN role has full access to everything
      if (role === "ADMIN") {
        return yield* Effect.succeed(void 0);
      }

      // MODERATOR has read/write access but not admin
      if (role === "MODERATOR" && requiredPermission !== "admin") {
        return yield* Effect.succeed(void 0);
      }

      // For USER role, check ownership or specific resource permissions
      if (role === "USER") {
        // If ownership is required, we would need to check the resource owner
        // This is a simplified implementation - full implementation would query
        // the resource from its respective gateway
        if (requireOwnership) {
          // Ownership check would require resource lookup
          // For now, deny if ownership is required without verification
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          return yield* Effect.fail(
            new PermissionDeniedError({
              resourceType,
              resourceId,
              requiredPermission,
              userId,
            }),
          );
        }

        // Standard permissions for USER role
        if (requiredPermission === "read") {
          return yield* Effect.succeed(void 0);
        }

        // Write/admin permissions denied for regular users on resources they don't own
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return yield* Effect.fail(
          new PermissionDeniedError({
            resourceType,
            resourceId,
            requiredPermission,
            userId,
          }),
        );
      }

      // SERVICE role only for system operations
      if (role === "SERVICE") {
        return yield* Effect.succeed(void 0);
      }

      // Unknown role - deny access
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return yield* Effect.fail(
        new PermissionDeniedError({
          resourceType,
          resourceId,
          requiredPermission,
          userId,
        }),
      );
    });
  }
}

/**
 * Map Better Auth errors to domain error types
 *
 * Better Auth errors have specific patterns that we map to our domain errors:
 * - Authentication failures → AuthenticationError
 * - Session/invalid token → AuthSessionExpiredError
 * - Rate limiting → RateLimitError
 * - Duplicate user → UserAlreadyExistsError
 * - Permission denied → PermissionDeniedError
 * - General errors → AuthServiceError
 *
 * @param error - The error from Better Auth
 * @param operation - The operation that caused the error
 * @returns Domain error instance
 */
function mapBetterAuthError(error: unknown, operation: string): IPortError {
  // Handle Error instances with message analysis
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Rate limit errors
    if (
      message.includes("rate limit") ||
      message.includes("too many requests") ||
      message.includes("429")
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return new RateLimitError({
        operation,
        retryAfter: 60,
        limit: 5,
        windowSeconds: 300,
      });
    }

    // Session/token errors
    if (
      message.includes("session") ||
      message.includes("token") ||
      message.includes("expired") ||
      message.includes("invalid token") ||
      message.includes("unauthorized")
    ) {
      return new AuthSessionExpiredError({
        cause: error,
      });
    }

    // User already exists
    if (
      message.includes("user already exists") ||
      message.includes("email already registered") ||
      message.includes("duplicate") ||
      message.includes("already exists")
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return new UserAlreadyExistsError({
        identifier: "unknown",
        identifierType: "email",
      });
    }

    // Permission denied
    if (
      message.includes("permission") ||
      message.includes("forbidden") ||
      message.includes("access denied") ||
      message.includes("403")
    ) {
      return new PermissionDeniedError({
        resourceType: "unknown",
        requiredPermission: "unknown",
      });
    }

    // Invalid credentials (authentication failure)
    if (
      message.includes("invalid") ||
      message.includes("credentials") ||
      message.includes("password") ||
      message.includes("incorrect") ||
      message.includes("wrong")
    ) {
      return new AuthenticationError({
        operation,
        cause: error,
        details: { message: error.message },
      });
    }
  }

  // Handle Better Auth API error responses (if available)
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;

    // Check for Better Auth specific error codes
    const code = err.code ?? err.errorCode;
    if (code) {
      const codeStr = String(code).toLowerCase();

      if (codeStr.includes("rate_limit") || codeStr === "429") {
        return new RateLimitError({
          operation,
          retryAfter: Number(err.retryAfter) || 60,
          limit: Number(err.limit) || 5,
          windowSeconds: Number(err.window) || 300,
        });
      }

      if (
        codeStr.includes("session_expired") ||
        codeStr.includes("invalid_token") ||
        codeStr.includes("unauthorized")
      ) {
        return new AuthSessionExpiredError({
          cause: error,
        });
      }

      if (codeStr.includes("user_exists") || codeStr.includes("duplicate")) {
        const identifier =
          typeof err.email === "string"
            ? err.email
            : typeof err.identifier === "string"
              ? err.identifier
              : "unknown";
        return new UserAlreadyExistsError({
          identifier,
          identifierType: "email",
        });
      }

      if (codeStr.includes("permission") || codeStr === "403") {
        const resourceType =
          typeof err.resourceType === "string" ? err.resourceType : "unknown";
        const resourceId =
          typeof err.resourceId === "string" ? err.resourceId : "";
        const permission =
          typeof err.permission === "string" ? err.permission : "unknown";
        return new PermissionDeniedError({
          resourceType,
          resourceId,
          requiredPermission: permission,
        });
      }
    }

    // Check for specific Better Auth error fields
    if (err.status === 429 || err.statusCode === 429) {
      return new RateLimitError({
        operation,
        retryAfter: Number(err.retryAfter) || 60,
        limit: Number(err.limit) || 5,
        windowSeconds: 300,
      });
    }

    if (err.status === 401 || err.statusCode === 401) {
      return new AuthSessionExpiredError({
        cause: error,
      });
    }

    if (err.status === 403 || err.statusCode === 403) {
      return new PermissionDeniedError({
        resourceType: "unknown",
        requiredPermission: "unknown",
      });
    }
  }

  // Default to generic authentication error
  return new AuthServiceError({
    operation,
    cause: error,
  });
}
