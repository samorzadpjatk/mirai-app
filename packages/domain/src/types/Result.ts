/**
 * Result<T, E> type for explicit error handling
 *
 * A lightweight, pure TypeScript Result type implementation for the domain layer.
 * This is a duplicate of the utils/result.ts for specific domain type exports.
 *
 * Instead of throwing exceptions, functions return a Result that either:
 * - Contains a success value of type T
 * - Contains an error value of type E
 *
 * Usage:
 * ```typescript
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) return err("Cannot divide by zero");
 *   return ok(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (isOk(result)) {
 *   console.log(result.value); // 5
 * } else {
 *   console.error(result.error); // "Cannot divide by zero"
 * }
 * ```
 */

export type Result<T, E> = { kind: "ok"; value: T } | { kind: "err"; error: E };

/**
 * Create a successful Result containing a value
 */
export function ok<T>(value: T): Result<T, never> {
  return { kind: "ok", value };
}

/**
 * Create an error Result containing an error
 */
export function err<E>(error: E): Result<never, E> {
  return { kind: "err", error };
}

/**
 * Check if a Result is successful (ok)
 */
export function isOk<T, E>(
  result: Result<T, E>,
): result is { kind: "ok"; value: T } {
  return result.kind === "ok";
}

/**
 * Check if a Result is an error (err)
 */
export function isErr<T, E>(
  result: Result<T, E>,
): result is { kind: "err"; error: E } {
  return result.kind === "err";
}

/**
 * Alias for isOk - Check if a Result is successful
 */
export function isSuccess<T, E>(
  result: Result<T, E>,
): result is { kind: "ok"; value: T } {
  return result.kind === "ok";
}

/**
 * Alias for isErr - Check if a Result is an error
 */
export function isError<T, E>(
  result: Result<T, E>,
): result is { kind: "err"; error: E } {
  return result.kind === "err";
}

/**
 * Get the value from a successful Result, or throw if error
 * @throws if the result is an error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isErr(result)) {
    throw new Error(`Called unwrap on an error: ${String(result.error)}`);
  }
  return result.value;
}

/**
 * Get the value from a successful Result, or return a default
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.value : defaultValue;
}

/**
 * Get the value from a successful Result, or compute a default
 */
export function unwrapOrElse<T, E>(
  result: Result<T, E>,
  fn: (error: E) => T,
): T {
  return isOk(result) ? result.value : fn(result.error);
}

/**
 * Transform the value in a successful Result using a function
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  return isOk(result) ? ok(fn(result.value)) : result;
}

/**
 * Transform the error in an error Result using a function
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  return isErr(result) ? err(fn(result.error)) : result;
}

/**
 * Chain operations that return Results
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return isOk(result) ? fn(result.value) : result;
}

/**
 * Match on both cases of a Result
 */
export function match<T, E, U>(
  result: Result<T, E>,
  onSuccess: (value: T) => U,
  onError: (error: E) => U,
): U {
  return isOk(result) ? onSuccess(result.value) : onError(result.error);
}
