import { Context } from "effect";
import type {
  IUserMigrationPort,
  IBatchMigrationPort,
} from "@mirai-app/domain";

/**
 * User Migration Port Tag - Context.Tag for Effect DI
 *
 * Use this tag to access the IUserMigrationPort implementation in Effect workflows:
 *   const migrationPort = yield* UserMigrationPortTag;
 *   yield* migrationPort.sendMigrationOtp({ email: "user@example.com" });
 */
export class UserMigrationPortTag extends Context.Tag("UserMigrationPort")<
  UserMigrationPortTag,
  IUserMigrationPort
>() {}

/**
 * Batch Migration Port Tag - Context.Tag for Effect DI
 *
 * Use this tag to access the IBatchMigrationPort implementation in Effect workflows:
 *   const batchPort = yield* BatchMigrationPortTag;
 *   const stats = yield* batchPort.getMigrationStats();
 */
export class BatchMigrationPortTag extends Context.Tag("BatchMigrationPort")<
  BatchMigrationPortTag,
  IBatchMigrationPort
>() {}

/**
 * Re-export types from domain for convenience
 */
export type { IUserMigrationPort, IBatchMigrationPort };
