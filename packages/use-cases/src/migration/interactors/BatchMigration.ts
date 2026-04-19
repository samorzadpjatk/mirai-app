import { Effect, Data } from "effect";
import {
  BatchMigrationPortTag,
  UserMigrationPortTag,
  type IBatchMigrationPort,
  type IUserMigrationPort,
} from "../ports/UserMigrationPort";
import type { IPortError } from "@mirai-app/domain";

/**
 * DTO for migration statistics
 */
export interface MigrationStatsDTO {
  totalUsers: number;
  migratedUsers: number;
  pendingUsers: number;
  inProgressUsers: number;
  failedMigrations: number;
  migrationRate: number;
}

/**
 * Result for batch migration queue operation
 */
export interface BatchMigrationQueueResult {
  results: Array<{
    email: string;
    success: boolean;
    error?: string;
  }>;
  totalQueued: number;
  successful: number;
  failed: number;
}

/**
 * Error for batch migration failures
 */
export class BatchMigrationError extends Data.TaggedError("BatchMigrationError")<
  {
    operation: string;
    cause: IPortError;
  }
> {}

/**
 * Get Migration Statistics Use Case
 *
 * Retrieves statistics about the migration progress across all users.
 * All users have been migrated to Better Auth.
 */
export class GetMigrationStatsUseCase {
  execute() {
    return Effect.gen(function* () {
      const batchPort: IBatchMigrationPort = yield* BatchMigrationPortTag;

      const stats = yield* batchPort.getMigrationStats();

      const migrationRate =
        stats.totalUsers > 0
          ? Math.round((stats.migratedUsers / stats.totalUsers) * 100)
          : 0;

      return {
        totalUsers: stats.totalUsers,
        migratedUsers: stats.migratedUsers,
        pendingUsers: stats.pendingUsers,
        inProgressUsers: stats.inProgressUsers,
        failedMigrations: stats.failedMigrations,
        migrationRate,
      };
    });
  }
}

/**
 * Get Eligible Users Use Case
 *
 * Legacy use case - no users are eligible for migration as all users
 * have been migrated to Better Auth.
 */
export class GetEligibleUsersUseCase {
  execute() {
    return Effect.gen(function* () {
      // All users have been migrated - no eligible users remain
      return { emails: [], count: 0 };
    });
  }
}

/**
 * Queue Batch Migration Use Case
 *
 * Legacy use case - batch migration is no longer supported.
 * All users have been migrated to Better Auth.
 */
export class QueueBatchMigrationUseCase {
  execute(_emails: string[]) {
    return Effect.gen(function* () {
      return {
        results: [],
        totalQueued: 0,
        successful: 0,
        failed: 0,
      };
    });
  }
}

/**
 * Send Batch OTP Use Case
 *
 * Legacy use case - batch OTP sending is no longer supported.
 * All users have been migrated to Better Auth.
 */
export class SendBatchMigrationOtpUseCase {
  execute(_emails: string[]) {
    return Effect.gen(function* () {
      return {
        results: [],
        totalSent: 0,
        successful: 0,
        failed: 0,
      };
    });
  }
}
