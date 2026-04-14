/**
 * AuthorizeModeratorUseCase - Authorization use case for moderator role checks
 *
 * This use case validates that the authenticated user has either the
 * MODERATOR or ADMIN role. It follows the DDD pattern of keeping authorization
 * logic in the use case layer and using Effect for explicit error handling.
 *
 * @module interactors
 */

import { Effect, Data } from "effect";
import { AuthContext, UserRole } from "@mirai-app/domain";

/**
 * Error when user is not authorized as moderator
 */
export class NotModeratorError extends Data.TaggedError("NotModeratorError")<{
  readonly resource: string;
  readonly action: string;
  readonly userId: string;
}> {}

/**
 * Input for authorizing moderator access
 */
export interface AuthorizeModeratorInput {
  /** The authentication context of the current user */
  authContext: AuthContext;
  /** Optional resource name for error messages */
  resource?: string;
  /** Optional action name for error messages */
  action?: string;
}

/**
 * Output type for successful moderator authorization (void - no data needed)
 */
export type AuthorizeModeratorOutput = void;

/**
 * AuthorizeModerator Use Case (Effect-based)
 *
 * This is a pure synchronous function that checks if the authenticated user
 * has either the MODERATOR or ADMIN role. It returns Effect for explicit
 * error handling.
 *
 * Role hierarchy: ADMIN > MODERATOR > USER
 * - ADMIN: Can perform all moderator actions
 * - MODERATOR: Can perform moderator-specific actions
 * - USER: Cannot perform moderator actions
 *
 * @example
 * ```typescript
 * const program = authorizeModeratorUseCase({
 *   authContext,
 *   resource: "Submission",
 *   action: "moderate"
 * });
 *
 * try {
 *   await Effect.runPromise(program);
 *   // User is authorized, proceed with operation
 * } catch (error) {
 *   // Handle authorization error
 *   if (error instanceof NotModeratorError) {
 *     authLogger.error("Moderator authorization failed", error);
 *   }
 * }
 * ```
 */
export function authorizeModeratorUseCase(
  input: AuthorizeModeratorInput,
): Effect.Effect<AuthorizeModeratorOutput, NotModeratorError> {
  return Effect.gen(function* () {
    if (
      input.authContext.role !== UserRole.MODERATOR &&
      input.authContext.role !== UserRole.ADMIN
    ) {
      return yield* Effect.fail(
        new NotModeratorError({
          resource: input.resource ?? "moderator operation",
          action: input.action ?? "execute",
          userId: input.authContext.userId as string,
        }),
      );
    }

    return undefined;
  });
}
