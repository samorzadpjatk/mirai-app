/**
 * Base interface for all port-related errors.
 *
 * This interface defines the minimal contract that all port errors must satisfy.
 * Concrete error classes extend Data.TaggedError (from Effect) and implement
 * this interface to ensure compatibility across the codebase.
 *
 * IMPORTANT: This interface intentionally only specifies _tag and message
 * because TypeScript's structural typing will match any class that has these
 * properties, including Data.TaggedError classes which have additional
 * internal Effect-specific properties.
 *
 * Pattern:
 * - Port interfaces declare IPortError for the error type
 * - Concrete implementations use specific Data.TaggedError subclasses
 * - Type inference handles the natural union of concrete errors
 *
 * @example
 * ```typescript
 * // Concrete error class
 * class DatabaseError
 *   extends Data.TaggedError("DatabaseError")<{ cause: unknown }>
 *   implements IPortError
 * {
 *   readonly message = "Database operation failed";
 * }
 *
 * // Port interface - uses IPortError
 * interface IUserPort {
 *   findById(id: string): Effect.Effect<User | null, IPortError, never>;
 * }
 *
 * // Implementation - infers DatabaseError | NotFoundError
 * class UserGateway implements IUserPort {
 *   findById(id: string) {
 *     // Returns Effect<User | null, DatabaseError | NotFoundError, never>
 *   }
 * }
 * ```
 */
export interface IPortError {
  /** Unique identifier tag for error type discrimination */
  readonly _tag: string;

  /** Human-readable error message describing what went wrong */
  readonly message: string;
}
