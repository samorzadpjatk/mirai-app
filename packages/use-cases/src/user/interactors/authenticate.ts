/**
 * AuthenticateUser Use Case
 *
 * Validates authentication tokens and returns the authentication context.
 * This use case acts as an orchestrator between the framework layer (GraphQL context)
 * and the authentication port (Supabase Auth, JWT, etc.).
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * // With dependency injection
 * const program = authenticateUserUseCase(input);
 *
 * // Provide auth port implementation
 * const runnable = program.pipe(
 *   Effect.provideService(AuthPortTag, authPort)
 * );
 *
 * // Run the effect
 * const result = await Effect.runPromise(runnable);
 * ```
 */

import { Effect } from "effect";
import type { AuthContext } from "@mirai-app/domain";
import {
  AuthPortTag,
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
} from "../../auth/ports/port";

/**
 * Input for AuthenticateUser use case
 */
export interface AuthenticateUserInput {
  /** The authentication token to validate */
  token: string;
}

/**
 * Output DTO for AuthenticateUser use case
 *
 * Contains the authentication context on success.
 * Errors are returned as Effect.fail(), not thrown.
 */
export interface AuthenticateUserOutput {
  /** Unique identifier of the authenticated user */
  userId: string;
  /** Role of the authenticated user */
  role: string;
  /** Timestamp when the authentication was established */
  authenticatedAt: Date;
  /** Optional session identifier */
  sessionId?: string;
}

/**
 * AuthenticateUser Use Case
 *
 * Validates an authentication token and returns the authentication context.
 *
 * @example
 * ```typescript
 * const program = authenticateUserUseCase({ token: "jwt-token-string" });
 * const runnable = program.pipe(Effect.provideService(AuthPortTag, authPort));
 *
 * try {
 *   const result = await Effect.runPromise(runnable);
 *   authLogger.info("User authenticated", { userId: result.userId, role: result.role });
 * } catch (error) {
 *   // Handle error
 *   if (error instanceof InvalidTokenError) {
 *     authLogger.error("Invalid token", error);
 *   }
 * }
 * ```
 */
export function authenticateUserUseCase(
  input: AuthenticateUserInput,
): Effect.Effect<
  AuthenticateUserOutput,
  AuthError | InvalidTokenError | SessionExpiredError,
  AuthPortTag
> {
  return Effect.gen(function* () {
    const authPort = yield* AuthPortTag;

    // Delegate validation to the auth port
    // The port handles the actual authentication mechanism (Supabase, JWT, etc.)
    const authContext = yield* authPort.validateToken(input.token);

    return {
      userId: authContext.userId,
      role: authContext.role,
      authenticatedAt: authContext.authenticatedAt,
      sessionId: authContext.sessionId,
    };
  });
}
