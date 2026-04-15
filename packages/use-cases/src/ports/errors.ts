/**
 * DatabaseError - Re-export from domain
 *
 * Used across all repository ports for consistent error handling.
 * Enables type-safe error matching with Effect.catchTag.
 *
 * Unexpected errors are treated as defects (use Effect.die to crash fast).
 */
export { DatabaseError } from "@mirai-app/domain/ports";
