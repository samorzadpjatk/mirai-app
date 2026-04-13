/**
 * Result Type - Functional Error Handling
 *
 * Provides a Result<T, E> type for functional error handling without exceptions.
 * This is the foundational pattern for the domain layer.
 *
 * @module utils/result
 */

// =============================================================================
// Result Type Definition
// =============================================================================

/**
 * Result type representing either success (ok) or failure (err)
 *
 * Use Result<T, E> instead of throwing exceptions for expected errors.
 * This makes error handling explicit and composable.
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<number, Error> {
 *   if (b === 0) {
 *     return err(new Error("Cannot divide by zero"));
 *   }
 *   return ok(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (result.kind === "ok") {
 *   console.log(result.value); // 5
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export type Result<T, E> = { kind: "ok"; value: T } | { kind: "err"; error: E };

// =============================================================================
// Constructor Functions
// =============================================================================

/**
 * Create a successful Result
 *
 * @param value - The success value
 * @returns Result with kind "ok"
 *
 * @example
 * ```typescript
 * const result = ok(42);
 * // result = { kind: "ok", value: 42 }
 * ```
 */
export function ok<T>(value: T): Result<T, never> {
  return { kind: "ok", value };
}

/**
 * Create a failed Result
 *
 * @param error - The error value
 * @returns Result with kind "err"
 *
 * @example
 * ```typescript
 * const result = err(new Error("Something went wrong"));
 * // result = { kind: "err", error: Error }
 * ```
 */
export function err<E>(error: E): Result<never, E> {
  return { kind: "err", error };
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if Result is successful
 *
 * @param result - The Result to check
 * @returns true if Result is ok
 *
 * @example
 * ```typescript
 * const result = ok(42);
 * if (isSuccess(result)) {
 *   console.log(result.value); // TypeScript knows this is safe
 * }
 * ```
 */
export function isSuccess<T, E>(
  result: Result<T, E>,
): result is { kind: "ok"; value: T } {
  return result.kind === "ok";
}

/**
 * Check if Result is a failure
 *
 * @param result - The Result to check
 * @returns true if Result is err
 *
 * @example
 * ```typescript
 * const result = err(new Error("Failed"));
 * if (isError(result)) {
 *   console.error(result.error.message); // TypeScript knows this is safe
 * }
 * ```
 */
export function isError<T, E>(
  result: Result<T, E>,
): result is { kind: "err"; error: E } {
  return result.kind === "err";
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Map over a Result's success value
 *
 * @param result - The Result to map over
 * @param fn - Function to apply to the success value
 * @returns New Result with mapped value or original error
 *
 * @example
 * ```typescript
 * const result = ok(5);
 * const doubled = map(result, x => x * 2);
 * // doubled = { kind: "ok", value: 10 }
 * ```
 */
export function map<T, E, R>(
  result: Result<T, E>,
  fn: (value: T) => R,
): Result<R, E> {
  if (isSuccess(result)) {
    return ok(fn(result.value));
  }
  return result;
}

/**
 * Map over a Result's error value
 *
 * @param result - The Result to map over
 * @param fn - Function to apply to the error value
 * @returns New Result with original value or mapped error
 *
 * @example
 * ```typescript
 * const result = err(new Error("old"));
 * const mapped = mapError(result, e => new Error(`Wrapped: ${e.message}`));
 * ```
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  if (isError(result)) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * Flatten a nested Result
 *
 * @param result - Nested Result<Result<T, E>, E>
 * @returns Flattened Result<T, E>
 *
 * @example
 * ```typescript
 * const nested = ok(ok(42));
 * const flat = flatten(nested);
 * // flat = { kind: "ok", value: 42 }
 * ```
 */
export function flatten<T, E>(result: Result<Result<T, E>, E>): Result<T, E> {
  if (isSuccess(result)) {
    return result.value;
  }
  return result;
}

/**
 * Chain Result operations (flatMap)
 *
 * @param result - The starting Result
 * @param fn - Function that takes success value and returns new Result
 * @returns Chained Result
 *
 * @example
 * ```typescript
 * const result = ok(5);
 * const chained = flatMap(result, x => ok(x * 2));
 * // chained = { kind: "ok", value: 10 }
 * ```
 */
export function flatMap<T, E, R>(
  result: Result<T, E>,
  fn: (value: T) => Result<R, E>,
): Result<R, E> {
  if (isSuccess(result)) {
    return fn(result.value);
  }
  return result;
}

/**
 * Get the success value or a default
 *
 * @param result - The Result to get value from
 * @param defaultValue - Value to return if Result is error
 * @returns Success value or default
 *
 * @example
 * ```typescript
 * const result = err(new Error("Failed"));
 * const value = getOrElse(result, 0);
 * // value = 0
 * ```
 */
export function getOrElse<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isSuccess(result)) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Unwrap a Result (unsafe - throws if error)
 *
 * @param result - The Result to unwrap
 * @returns Success value
 * @throws Error if Result is error
 *
 * @example
 * ```typescript
 * const result = ok(42);
 * const value = unwrap(result);
 * // value = 42
 * ```
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isSuccess(result)) {
    return result.value;
  }
  throw new Error(`Cannot unwrap error: ${result.error}`);
}

// =============================================================================
// Export
// =============================================================================

export default {
  ok,
  err,
  isSuccess,
  isError,
  map,
  mapError,
  flatten,
  flatMap,
  getOrElse,
  unwrap,
};
