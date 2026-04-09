/**
 * Result<T, E> type for explicit error handling
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
 * if (result.isSuccess()) {
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
 * Check if a Result is successful
 */
export function isSuccess<T, E>(
  result: Result<T, E>,
): result is { kind: "ok"; value: T } {
  return result.kind === "ok";
}

/**
 * Check if a Result is an error
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
  if (isError(result)) {
    throw new Error(`Called unwrap on an error: ${String(result.error)}`);
  }
  return result.value;
}

/**
 * Get the value from a successful Result, or return a default
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isSuccess(result) ? result.value : defaultValue;
}

/**
 * Get the value from a successful Result, or compute a default
 */
export function unwrapOrElse<T, E>(
  result: Result<T, E>,
  fn: (error: E) => T,
): T {
  return isSuccess(result) ? result.value : fn(result.error);
}

/**
 * Transform the value in a successful Result using a function
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  return isSuccess(result) ? ok(fn(result.value)) : result;
}

/**
 * Transform the error in an error Result using a function
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  return isError(result) ? err(fn(result.error)) : result;
}

/**
 * Chain operations that return Results
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return isSuccess(result) ? fn(result.value) : result;
}

/**
 * Match on both cases of a Result
 */
export function match<T, E, U>(
  result: Result<T, E>,
  onSuccess: (value: T) => U,
  onError: (error: E) => U,
): U {
  return isSuccess(result) ? onSuccess(result.value) : onError(result.error);
}

/**
 * Combine multiple Results - returns ok if all are ok, otherwise first error
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (isError(result)) {
      return result;
    }
    values.push(result.value);
  }
  return ok(values);
}

/**
 * Combine multiple Results with different types
 * Returns ok with tuple if all are ok, otherwise first error
 */
export function zip2<T1, T2, E>(
  r1: Result<T1, E>,
  r2: Result<T2, E>,
): Result<[T1, T2], E> {
  if (isError(r1)) return r1;
  if (isError(r2)) return r2;
  return ok([r1.value, r2.value]);
}

export function zip3<T1, T2, T3, E>(
  r1: Result<T1, E>,
  r2: Result<T2, E>,
  r3: Result<T3, E>,
): Result<[T1, T2, T3], E> {
  if (isError(r1)) return r1;
  if (isError(r2)) return r2;
  if (isError(r3)) return r3;
  return ok([r1.value, r2.value, r3.value]);
}
