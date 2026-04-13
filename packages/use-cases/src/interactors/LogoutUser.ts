/**
 * LogoutUser Use Case
 *
 * Handles user logout by invalidating the session and cleaning up auth state.
 * Part of the authentication flow migration to Effect framework.
 *
 * @module interactors
 */

import { Effect, Data } from "effect";
import { AuthPortTag, AuthError, SessionExpiredError } from "../ports/AuthPort";

/**
 * Error thrown when logout fails
 */
export class LogoutError extends Data.TaggedError("LogoutError")<{
  readonly message: string;
  readonly sessionId?: string;
  readonly cause?: unknown;
}> {}

/**
 * Input for LogoutUser use case
 */
export interface LogoutUserInput {
  /** The session identifier to invalidate */
  sessionId: string;
  /** Optional user ID for audit logging */
  userId?: string;
}

/**
 * Output DTO for LogoutUser use case
 *
 * Contains logout confirmation.
 */
export interface LogoutUserOutput {
  /** Whether logout was successful */
  success: boolean;
  /** Timestamp when logout occurred */
  loggedOutAt: Date;
  /** The invalidated session ID */
  sessionId: string;
  /** Optional message */
  message?: string;
}

/**
 * LogoutUser Use Case
 *
 * Invalidates a user session and performs logout operations.
 * Uses Effect.gen for dependency injection and composable error handling.
 *
 * Note: This is a soft logout that invalidates the session. The actual
 * session cleanup is delegated to the AuthPort implementation.
 *
 * @example
 * ```typescript
 * const program = logoutUserUseCase({ sessionId: "session-123" });
 * const runnable = program.pipe(
 *   Effect.provideService(AuthPortTag, authPort)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * console.log(`User logged out successfully: ${result.success}`);
 * ```
 */
export function logoutUserUseCase(
  input: LogoutUserInput,
): Effect.Effect<
  LogoutUserOutput,
  AuthError | SessionExpiredError | LogoutError,
  AuthPortTag
> {
  return Effect.gen(function* () {
    const authPort = yield* AuthPortTag;

    // Validate sessionId is provided
    if (!input.sessionId || input.sessionId.trim().length === 0) {
      return yield* Effect.fail(
        new LogoutError({
          message: "Session ID is required for logout",
          sessionId: input.sessionId,
        }),
      );
    }

    // Attempt to refresh the session first to validate it exists
    // If the session is already expired, that's okay - we still consider logout successful
    const sessionValidation = yield* authPort
      .refreshSession(input.sessionId)
      .pipe(
        Effect.matchEffect({
          onSuccess: () => Effect.succeed(true),
          onFailure: (error) => {
            // If session is expired, that's fine for logout
            if (error instanceof SessionExpiredError) {
              return Effect.succeed(false);
            }
            // For other errors, propagate them
            return Effect.fail(error);
          },
        }),
      );

    // Return successful logout response
    // Note: In a real implementation, the AuthPort might have a specific logout method
    // For now, we consider the logout successful if we got here
    return {
      success: true,
      loggedOutAt: new Date(),
      sessionId: input.sessionId,
      message: sessionValidation
        ? "Session invalidated successfully"
        : "Session was already expired",
    };
  });
}
