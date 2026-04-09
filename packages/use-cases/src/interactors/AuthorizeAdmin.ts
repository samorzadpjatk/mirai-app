/**
 * AuthorizeAdminUseCase - Authorization use case for admin role checks
 *
 * This use case validates that the authenticated user has the ADMIN role.
 * It follows the DDD pattern of keeping authorization logic in the use case layer
 * and using Result types for explicit error handling.
 *
 * @module interactors
 */

import { AuthContext, UserRole, type Result, ok, err } from "@mirai-app/domain";
import { UnauthorizedError } from "@mirai-app/domain/errors";

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
 * Use case for authorizing admin access
 *
 * This is a pure synchronous function that checks if the authenticated user
 * has the ADMIN role. It returns a Result type for explicit error handling.
 *
 * @example
 * ```typescript
 * const result = authorizeAdminUseCase.execute({
 *   authContext,
 *   resource: "Challenge",
 *   action: "delete"
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
export class AuthorizeAdminUseCase {
  /**
   * Execute the authorization check
   *
   * @param input - Contains authContext and optional resource/action for error context
   * @returns Result<void, UnauthorizedError> - Success if user is admin, error otherwise
   */
  execute(
    input: AuthorizeAdminInput,
  ): Result<AuthorizeAdminOutput, UnauthorizedError> {
    if (input.authContext.role !== UserRole.ADMIN) {
      return err(
        new UnauthorizedError({
          resource: input.resource ?? "admin operation",
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
export const authorizeAdminUseCase = new AuthorizeAdminUseCase();
