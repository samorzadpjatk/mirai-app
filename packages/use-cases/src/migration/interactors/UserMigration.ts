import { Effect, Data } from "effect";
import {
  UserMigrationPortTag,
  type IUserMigrationPort,
} from "../ports/UserMigrationPort";
import type {
  MigrationResult,
  MigrationStatus,
  IPortError,
} from "@mirai-app/domain";

/**
 * Input for sending migration OTP
 */
export interface SendMigrationOtpInput {
  email: string;
}

/**
 * Input for verifying migration OTP and completing migration
 */
export interface VerifyMigrationOtpInput {
  email: string;
  otp: string;
  password: string;
}

/**
 * DTO for migration status response
 */
export interface MigrationStatusDTO {
  authProvider: "supabase" | "better-auth" | "migrating";
  migrationStartedAt?: string;
  migrationCompletedAt?: string;
  betterAuthUserId?: string;
  canRollback: boolean;
}

/**
 * DTO for migration result
 */
export interface MigrationResultDTO {
  userId: string;
  betterAuthUserId: string;
  email: string;
  completedAt: string;
}

/**
 * Error when migration fails
 */
export class MigrationFailedError extends Data.TaggedError("MigrationFailedError")<{
  email: string;
  cause: IPortError;
}>() {}

/**
 * Send Migration OTP Use Case
 *
 * Orchestrates the first step of user migration: sending an OTP to the user's email.
 * This verifies ownership of the email before allowing migration to proceed.
 */
export class SendMigrationOtpUseCase {
  execute(input: SendMigrationOtpInput) {
    return Effect.gen(function* () {
      const migrationPort: IUserMigrationPort = yield* UserMigrationPortTag;

      // Check if user exists in source system
      const exists = yield* migrationPort.userExistsInSource(input.email);
      if (!exists) {
        return yield* Effect.fail(
          new MigrationFailedError({
            email: input.email,
            cause: {
              _tag: "UserNotFoundInSourceError",
              message: "User not found in source authentication system",
            } as IPortError,
          }),
        );
      }

      // Send OTP
      yield* migrationPort.sendMigrationOtp({ email: input.email });

      return { success: true, email: input.email };
    });
  }
}

/**
 * Verify Migration OTP Use Case
 *
 * Orchestrates the migration completion: verifying OTP, creating Better Auth account,
 * and updating migration status.
 */
export class VerifyMigrationOtpUseCase {
  execute(input: VerifyMigrationOtpInput) {
    return Effect.gen(function* () {
      const migrationPort: IUserMigrationPort = yield* UserMigrationPortTag;

      // Verify OTP and complete migration
      const result: MigrationResult = yield* migrationPort.verifyMigrationOtp({
        email: input.email,
        otp: input.otp,
        password: input.password,
      });

      return {
        success: true,
        userId: result.userId,
        betterAuthUserId: result.betterAuthUserId,
        email: result.email,
        completedAt: result.completedAt.toISOString(),
      };
    });
  }
}

/**
 * Get Migration Status Use Case
 *
 * Retrieves the current migration status for a user.
 */
export class GetMigrationStatusUseCase {
  execute(userId: string) {
    return Effect.gen(function* () {
      const migrationPort: IUserMigrationPort = yield* UserMigrationPortTag;

      const status: MigrationStatus | null =
        yield* migrationPort.getMigrationStatus(userId);

      if (!status) {
        return null;
      }

      return {
        authProvider: status.authProvider,
        migrationStartedAt: status.migrationStartedAt?.toISOString(),
        migrationCompletedAt: status.migrationCompletedAt?.toISOString(),
        betterAuthUserId: status.betterAuthUserId,
        canRollback: status.canRollback,
      };
    });
  }
}

/**
 * Rollback Migration Use Case
 *
 * Rolls back a migration, allowing the user to continue using Supabase Auth.
 */
export class RollbackMigrationUseCase {
  execute(userId: string) {
    return Effect.gen(function* () {
      const migrationPort: IUserMigrationPort = yield* UserMigrationPortTag;

      yield* migrationPort.rollbackMigration(userId);

      return { success: true, userId };
    });
  }
}
