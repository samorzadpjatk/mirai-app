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
  authProvider: "better-auth";
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
export class MigrationFailedError extends Data.TaggedError("MigrationFailedError")<
  {
    email: string;
    cause: IPortError;
  }
> {}

/**
 * Send Migration OTP Use Case
 *
 * Legacy migration use case - migration from legacy auth to Better Auth is complete.
 * This use case is retained for reference but no longer functional.
 */
export class SendMigrationOtpUseCase {
  execute(_input: SendMigrationOtpInput) {
    return Effect.gen(function* () {
      return yield* Effect.fail(
        new MigrationFailedError({
          email: _input.email,
          cause: {
            _tag: "MigrationNotSupportedError",
            message: "Migration from legacy auth is no longer supported. All users are now on Better Auth.",
          } as IPortError,
        }),
      );
    });
  }
}

/**
 * Verify Migration OTP Use Case
 *
 * Legacy migration use case - migration from legacy auth to Better Auth is complete.
 * This use case is retained for reference but no longer functional.
 */
export class VerifyMigrationOtpUseCase {
  execute(_input: VerifyMigrationOtpInput) {
    return Effect.gen(function* () {
      return yield* Effect.fail(
        new MigrationFailedError({
          email: _input.email,
          cause: {
            _tag: "MigrationNotSupportedError",
            message: "Migration from legacy auth is no longer supported. All users are now on Better Auth.",
          } as IPortError,
        }),
      );
    });
  }
}

/**
 * Get Migration Status Use Case
 *
 * Retrieves the current migration status for a user.
 * All users are now on Better Auth.
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
 * Legacy rollback use case - rollback to legacy auth is no longer supported.
 * All users are now permanently on Better Auth.
 */
export class RollbackMigrationUseCase {
  execute(userId: string) {
    return Effect.gen(function* () {
      return yield* Effect.fail(
        new MigrationFailedError({
          email: userId,
          cause: {
            _tag: "RollbackNotSupportedError",
            message: "Rollback to legacy auth is no longer supported. All users are now permanently on Better Auth.",
          } as IPortError,
        }),
      );
    });
  }
}
