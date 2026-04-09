/**
 * AuthorizeModeratorUseCase - Authorization use case for moderator role checks
 *
 * This use case validates that the authenticated user has either the
 * MODERATOR or ADMIN role. It follows the DDD pattern of keeping authorization
 * logic in the use case layer and using Result types for explicit error handling.
 *
 * @module interactors
 */

import { AuthContext, UserRole, type Result, ok, err } from "@mirai-app/domain";
import { UnauthorizedError } from "@mirai-app/domain/errors";

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
 * Use case for authorizing moderator access
 *
 * This is a pure synchronous function that checks if the authenticated user
 * has either the MODERATOR or ADMIN role. It returns a Result type for explicit
 * error handling.
 *
 * Role hierarchy: ADMIN > MODERATOR > USER
 * - ADMIN: Can perform all moderator actions
 * - MODERATOR: Can perform moderator-specific actions
 * - USER: Cannot perform moderator actions
 *
 * @example
 * ```typescript
 * const result = authorizeModeratorUseCase.execute({
 *   authContext,
 *   resource: "Submission",
 *   action: "moderate"
 * });
 *
 * if (isOk(result)) {
 *   // User is authorized, proceed with operation
 * } else {
 *   // Handle authorization error
 *   console.error(result.error.message);
 * }
 * ```
 */
export class AuthorizeModeratorUseCase {
  /**
   * Execute the authorization check
   *
   * @param input - Contains authContext and optional resource/action for error context
   * @returns Result<void, UnauthorizedError> - Success if user is moderator or admin, error otherwise
   */
  execute(
    input: AuthorizeModeratorInput,
  ): Result<AuthorizeModeratorOutput, UnauthorizedError> {
    if (
      input.authContext.role !== UserRole.MODERATOR &&
      input.authContext.role !== UserRole.ADMIN
    ) {
      return err(
        new UnauthorizedError({
          resource: input.resource ?? "moderator operation",
          action: input.action ?? "execute",
          userId: input.authContext.userId as string,
        }),
      );
    }

    return ok(undefined);
  }
}

/**
 * Singleton instance for convenient usage
 */
export const authorizeModeratorUseCase = new AuthorizeModeratorUseCase();
