import { Data } from "effect";
import type { IPortError } from "../../shared/errors/ports";

/**
 * Migration Domain Errors
 *
 * Errors specific to the user migration process from legacy auth to Better Auth.
 * These errors handle edge cases in the migration flow including:
 * - Invalid or expired OTP codes
 * - Users not found in source system
 * - Migration state violations
 * - Concurrent migration conflicts
 */

/**
 * Error thrown when an OTP code is invalid, expired, or has been consumed.
 */
export class InvalidOtpError
  extends Data.TaggedError("InvalidOtpError")<{
    email: string;
    reason: "invalid" | "expired" | "consumed";
  }>
  implements IPortError
{
  override get message(): string {
    return `Invalid or expired OTP code for ${this.email}`;
  }
}

/**
 * Error thrown when a user cannot be found in the source auth system.
 */
export class UserNotFoundInSourceError
  extends Data.TaggedError("UserNotFoundInSourceError")<{
    email: string;
  }>
  implements IPortError
{
  override readonly message = "User not found in source authentication system";
}

/**
 * Error thrown when a user is already registered in Better Auth.
 * This prevents duplicate accounts during migration.
 */
export class UserAlreadyMigratedError
  extends Data.TaggedError("UserAlreadyMigratedError")<{
    email: string;
    betterAuthUserId?: string;
  }>
  implements IPortError
{
  override readonly message = "User has already been migrated to Better Auth";
}

/**
 * Error thrown when a migration is attempted for a user in an invalid state.
 * For example, trying to migrate a user that's already in the "migrating" state.
 */
export class InvalidMigrationStateError
  extends Data.TaggedError("InvalidMigrationStateError")<{
    userId: string;
    currentState: string;
    expectedState: string;
  }>
  implements IPortError
{
  override get message(): string {
    return `Invalid migration state: expected ${this.expectedState}, got ${this.currentState}`;
  }
}

/**
 * Error thrown when a migration operation times out.
 */
export class MigrationTimeoutError
  extends Data.TaggedError("MigrationTimeoutError")<{
    operation: string;
    timeoutMs: number;
  }>
  implements IPortError
{
  override readonly message = "Migration operation timed out";
}

/**
 * Error thrown when the migration service encounters an unexpected error.
 */
export class MigrationServiceError
  extends Data.TaggedError("MigrationServiceError")<{
    operation: string;
    cause?: unknown;
  }>
  implements IPortError
{
  override readonly message = "Migration service error";
}
