import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";

/**
 * Auth provider values for tracking migration status
 */
export type AuthProvider = "better-auth";

/**
 * Migration status for a user
 */
export interface MigrationStatus {
  /** Current auth provider for the user - all users are now on Better Auth */
  authProvider: AuthProvider;

  /** When the migration started (if in progress) */
  migrationStartedAt?: Date;

  /** When the migration completed (if completed) */
  migrationCompletedAt?: Date;

  /** Better Auth user ID (if migrated) */
  betterAuthUserId?: string;

  /** Whether the user can rollback - always false as migration is complete */
  canRollback: boolean;
}

/**
 * Result of a successful migration
 */
export interface MigrationResult {
  /** The migrated user ID */
  userId: string;

  /** Better Auth user ID */
  betterAuthUserId: string;

  /** User email */
  email: string;

  /** When the migration completed */
  completedAt: Date;
}

/**
 * Input for requesting a migration OTP
 */
export interface SendMigrationOtpInput {
  /** User email address */
  email: string;
}

/**
 * Input for verifying a migration OTP
 */
export interface VerifyMigrationOtpInput {
  /** User email address */
  email: string;

  /** OTP code from email */
  otp: string;

  /** New password for Better Auth account */
  password: string;
}

/**
 * Port for user migration operations
 *
 * Legacy port for migration operations. Migration from legacy auth to Better Auth
 * is now complete. This port is retained for reference and status tracking.
 */
export interface IUserMigrationPort {
  /**
   * Send a migration OTP to the user's email
   *
   * @param input - Email address to send OTP to
   * @returns Effect that succeeds when OTP is sent
   */
  sendMigrationOtp(
    input: SendMigrationOtpInput,
  ): Effect.Effect<void, IPortError, never>;

  /**
   * Verify OTP and complete migration
   *
   * Creates a Better Auth account for the user and updates migration status.
   *
   * @param input - Email, OTP, and new password
   * @returns Effect with migration result on success
   */
  verifyMigrationOtp(
    input: VerifyMigrationOtpInput,
  ): Effect.Effect<MigrationResult, IPortError, never>;

  /**
   * Get migration status for a user
   *
   * @param userId - User ID to check
   * @returns Effect with migration status
   */
  getMigrationStatus(
    userId: string,
  ): Effect.Effect<MigrationStatus | null, IPortError, never>;

  /**
   * Check if a user exists in the source auth system
   *
   * @param email - User email to check
   * @returns Effect with boolean indicating existence
   */
  userExistsInSource(
    email: string,
  ): Effect.Effect<boolean, IPortError, never>;

  /**
   * Rollback a migration (no longer supported)
   *
   * Migration rollback is no longer supported as all users have been
   * permanently migrated to Better Auth.
   *
   * @param userId - User ID to rollback
   * @returns Effect that fails with not supported error
   */
  rollbackMigration(userId: string): Effect.Effect<void, IPortError, never>;
}

/**
 * Port for batch migration operations (admin use)
 */
export interface IBatchMigrationPort {
  /**
   * Get list of users eligible for migration
   *
   * @returns Effect with list of user emails (always empty as migration is complete)
   */
  getEligibleUsers(): Effect.Effect<string[], IPortError, never>;

  /**
   * Get migration statistics
   *
   * @returns Effect with migration counts
   */
  getMigrationStats(): Effect.Effect<{
    totalUsers: number;
    migratedUsers: number;
    pendingUsers: number;
    inProgressUsers: number;
    failedMigrations: number;
  }, IPortError, never>;

  /**
   * Queue multiple users for migration (admin triggered)
   *
   * @param emails - List of user emails to migrate
   * @returns Effect with results for each user
   */
  queueBatchMigration(
    emails: string[],
  ): Effect.Effect<
    Array<{
      email: string;
      success: boolean;
      error?: string;
    }>,
    IPortError,
    never
  >;
}
