/**
 * Base interfaces for gateway errors
 *
 * These interfaces define the contract for errors that can be
 * returned from gateways across all layers (domain, use-cases, adapters).
 *
 * @example
 * ```typescript
 * // Domain error implements the contract
 * export class DatabaseError extends Data.TaggedError("DatabaseError")<{
 *   operation: string;
 *   message: string;
 *   cause?: unknown;
 * }>() {}
 *
 * // Type checking ensures consistency
 * const error: DatabaseGatewayError = new DatabaseError({...});
 * ```
 */

/**
 * Base interface for all gateway errors
 *
 * All gateway errors must conform to this interface to ensure
 * type consistency across domain, use-cases, and adapter layers.
 */
export interface GatewayError {
  /** Tag identifier for the error type */
  readonly _tag: string;
  /** Human-readable error message */
  readonly message: string;
}

/**
 * Base interface for database-specific gateway errors
 *
 * Extends GatewayError with database operation context.
 * Used by all database gateway implementations.
 *
 * @example
 * ```typescript
 * const error = new DatabaseError({
 *   operation: "findById",
 *   message: "Entity not found",
 *   cause: originalError
 * });
 * ```
 */
export interface DatabaseGatewayError extends GatewayError {
  readonly _tag: "DatabaseError";
  /** The database operation that failed */
  readonly operation: string;
  /** Optional underlying error cause */
  readonly cause?: unknown;
}
