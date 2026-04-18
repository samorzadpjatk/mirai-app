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
export class BatchMigrationError extends Data.TaggedError("BatchMigrationError")<{
  operation: string;
  cause: IPortError;
}>() {}

/**
 * Get Migration Statistics Use Case
 *
 * Retrieves statistics about the migration progress across all users.
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
 * Retrieves a list of users who are eligible for migration (still on Supabase).
 */
export class GetEligibleUsersUseCase {
  execute() {
    return Effect.gen(function* () {
      const batchPort: IBatchMigrationPort = yield* BatchMigrationPortTag;

      const emails = yield* batchPort.getEligibleUsers();

      return { emails, count: emails.length };
    });
  }
}

/**
 * Queue Batch Migration Use Case
 *
 * Queues multiple users for migration. This initiates the OTP flow for each user.
 */
export class QueueBatchMigrationUseCase {
  execute(emails: string[]) {
    return Effect.gen(function* () {
      const batchPort: IBatchMigrationPort = yield* BatchMigrationPortTag;
      const migrationPort: IUserMigrationPort = yield* UserMigrationPortTag;

      // Filter out users that don't exist in source
      const validEmails: string[] = [];
      for (const email of emails) {
        const exists = yield* migrationPort.userExistsInSource(email);
        if (exists) {
          validEmails.push(email);
        }
      }

      // Queue the batch migration
      const results = yield* batchPort.queueBatchMigration(validEmails);

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      return {
        results,
        totalQueued: validEmails.length,
        successful,
        failed,
      };
    });
  }
}

/**
 * Send Batch OTP Use Case
 *
 * Sends migration OTPs to multiple users at once.
 */
export class SendBatchMigrationOtpUseCase {
  execute(emails: string[]) {
    return Effect.gen(function* () {
      const migrationPort: IUserMigrationPort = yield* UserMigrationPortTag;

      const results: Array<{ email: string; success: boolean; error?: string }> =
        [];

      for (const email of emails) {
        const result = yield* Effect.either(
          migrationPort.sendMigrationOtp({ email }),
        );

        results.push({
          email,
          success: result._tag === "Right",
          error:
            result._tag === "Left"
              ? String(result.left.message)
              : undefined,
        });
      }

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      return {
        results,
        totalSent: emails.length,
        successful,
        failed,
      };
    });
  }
}
