import { Data } from "effect";

/**
 * DatabaseError - Tagged error for repository operations
 *
 * Used across all repository ports for consistent error handling.
 * Enables type-safe error matching with Effect.catchTag.
 *
 * Unexpected errors are treated as defects (use Effect.die to crash fast).
 */
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string;
  message: string;
  cause?: unknown;
}> {}
