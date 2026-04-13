/**
 * RefreshToken Use Case
 *
 * Refreshes an existing authentication session and returns updated auth context.
 * Part of the authentication flow migration to Effect framework.
 *
 * @module interactors
 */

import { Effect, Data } from "effect";
import type { AuthContext } from "@mirai-app/domain";
import { AuthPortTag, AuthError, SessionExpiredError } from "../ports/AuthPort";

/**
 * Error thrown when token refresh fails
 */
export class TokenRefreshError extends Data.TaggedError("TokenRefreshError")<{
  readonly message: string;
  readonly sessionId?: string;
  readonly cause?: unknown;
}> {}

/**
 * Input for RefreshToken use case
 */
export interface RefreshTokenInput {
  /** The session identifier to refresh */
  sessionId: string;
}

/**
 * Output DTO for RefreshToken use case
 *
 * Contains the refreshed authentication context on success.
 */
export interface RefreshTokenOutput {
  /** Unique identifier of the authenticated user */
  userId: string;
  /** Role of the authenticated user */
  role: string;
  /** Timestamp when the authentication was established */
  authenticatedAt: Date;
  /** Session identifier */
  sessionId: string;
  /** Optional new token if issued during refresh */
  newToken?: string;
}

/**
 * RefreshToken Use Case
 *
 * Refreshes an existing session and returns updated authentication context.
 * Uses Effect.gen for dependency injection and composable error handling.
 *
 * @example
 * ```typescript
 * const program = refreshTokenUseCase({ sessionId: "session-123" });
 * const runnable = program.pipe(
 *   Effect.provideService(AuthPortTag, authPort)
 * );
 *
 * try {
 *   const result = await Effect.runPromise(runnable);
 *   console.log(`Session refreshed for user ${result.userId}`);
 * } catch (error) {
 *   if (error instanceof SessionExpiredError) {
 *     console.error("Session has expired, please login again");
 *   }
 * }
 * ```
 */
export function refreshTokenUseCase(
  input: RefreshTokenInput,
): Effect.Effect<
  RefreshTokenOutput,
  AuthError | SessionExpiredError | TokenRefreshError,
  AuthPortTag
> {
  return Effect.gen(function* () {
    const authPort = yield* AuthPortTag;

    // Validate sessionId is provided
    if (!input.sessionId || input.sessionId.trim().length === 0) {
      return yield* Effect.fail(
        new TokenRefreshError({
          message: "Session ID is required for token refresh",
          sessionId: input.sessionId,
        }),
      );
    }

    // Delegate to auth port for session refresh
    const authContext = yield* authPort.refreshSession(input.sessionId);

    // Return refreshed auth context
    return {
      userId: authContext.userId as string,
      role: authContext.role,
      authenticatedAt: authContext.authenticatedAt,
      sessionId: authContext.sessionId ?? input.sessionId,
    };
  });
}
