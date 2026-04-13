/**
 * Result Type Utilities
 *
 * Either/Result pattern implementation for non-Effect code.
 */

export type Result<T, E> = Ok<T> | Err<E>;

export interface Ok<T> {
  readonly kind: "ok";
  readonly value: T;
}

export interface Err<E> {
  readonly kind: "err";
  readonly error: E;
}

export function ok<T>(value: T): Ok<T> {
  return { kind: "ok", value };
}

export function err<E>(error: E): Err<E> {
  return { kind: "err", error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.kind === "ok";
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.kind === "err";
}

export function mapResult<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value));
  }
  return result;
}

export function flatMapResult<T, E, U>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  if (isOk(result)) {
    return fn(result.value);
  }
  return result;
}

export function getOrElse<T, E>(result: Result<T, E>, defaultValue: () => T): T {
  if (isOk(result)) {
    return result.value;
  }
  return defaultValue();
}

export function fold<T, E, U>(result: Result<T, E>, onError: (error: E) => U, onSuccess: (value: T) => U): U {
  if (isOk(result)) {
    return onSuccess(result.value);
  }
  return onError(result.error);
}

export function fromNullable<T, E>(value: T | null | undefined, error: E): Result<T, E> {
  if (value === null || value === undefined) {
    return err(error);
  }
  return ok(value);
}

export function tryCatch<T, E>(fn: () => T, onError: (error: unknown) => E): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    return err(onError(error));
  }
}

export function fromPredicateResult<T, E>(value: T, predicate: (value: T) => boolean, onError: () => E): Result<T, E> {
  if (predicate(value)) {
    return ok(value);
  }
  return err(onError());
}
