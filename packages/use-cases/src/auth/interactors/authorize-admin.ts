/**
 * AuthorizeAdminUseCase - Authorization use case for admin role checks
 *
 * This use case validates that the authenticated user has the ADMIN role.
 * It follows the DDD pattern of keeping authorization logic in the use case layer
 * and using Effect for explicit error handling.
 *
 * @module interactors
 */

import { Effect, Data } from "effect";
import { AuthContext, UserRole } from "@mirai-app/domain";

/**
 * Error when user is not authorized as admin
 */
export class NotAdminError extends Data.TaggedError("NotAdminError")<{
  readonly resource: string;
  readonly action: string;
  readonly userId: string;
}> {}

/**
 * Input for authorizing admin access
 */
export interface AuthorizeAdminInput {
  /** The authentication context of the current user */
  authContext: AuthContext;
  /** Optional resource name for error messages */
  resource?: string;
  /** Optional action name for error messages */
  action?: string;
}

/**
 * Output type for successful admin authorization (void - no data needed)
 */
export type AuthorizeAdminOutput = void;

/**
 * AuthorizeAdmin Use Case (Effect-based)
 *
 * This is a pure synchronous function that checks if the authenticated user
 * has the ADMIN role. It returns Effect for explicit error handling.
 *
 * @example
 * ```typescript
 * const program = authorizeAdminUseCase({
 *   authContext,
 *   resource: "Challenge",
 *   action: "delete"
 * });
 *
 * try {
 *   await Effect.runPromise(program);
 *   // User is authorized, proceed with operation
 * } catch (error) {
 *   // Handle authorization error
 *   if (error instanceof NotAdminError) {
 *     authLogger.error("Admin authorization failed", error);
 *   }
 * }
 * ```
 */
export function authorizeAdminUseCase(
  input: AuthorizeAdminInput,
): Effect.Effect<AuthorizeAdminOutput, NotAdminError> {
  return Effect.gen(function* () {
    if (input.authContext.role !== UserRole.ADMIN) {
      return yield* Effect.fail(
        new NotAdminError({
          resource: input.resource ?? "admin operation",
          action: input.action ?? "execute",
          userId: input.authContext.userId as string,
        }),
      );
    }

    return undefined;
  });
}
