import { Effect } from "effect";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Base Drizzle Gateway
 *
 * Provides shared utilities for database operations with Effect.tryPromise.
 * All gateways extend this base class for consistent error handling.
 */
export abstract class BaseDrizzleGateway {
  constructor(protected readonly db: DrizzleDb) {}

  /**
   * Wrap a database operation with Effect.tryPromise
   */
  protected tryPromise<T>(
    operation: string,
    fn: () => Promise<T>,
    entityId?: string,
  ): Effect.Effect<T, DatabaseError, never> {
    return Effect.tryPromise({
      try: fn,
      catch: (error) =>
        new DatabaseError({
          operation,
          cause: error,
          id: entityId,
        }),
    });
  }
}
