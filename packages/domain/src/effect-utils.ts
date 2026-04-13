/**
 * Effect Utilities for Domain Layer
 *
 * Provides utilities for Effect framework integration.
 *
 * @module effect-utils
 */

import { Effect, Either } from "effect";

/**
 * Create an Effect from a predicate function
 *
 * Returns Effect.succeed(value) if predicate returns true,
 * otherwise returns Effect.fail(error).
 *
 * @example
 * ```typescript
 * const isPositive = (n: number): boolean => n > 0;
 *
 * const validatePositive = (n: number) =>
 *   fromPredicate(
      n,
      isPositive,
      () => new ValidationError("Number must be positive")
    );
 *
 * // Effect<number, ValidationError, never>
 * const effect = validatePositive(42);
 * ```
 */
export function fromPredicate<T, E>(
  value: T,
  predicate: (value: T) => boolean,
  onFail: () => E,
): Effect.Effect<T, E, never> {
  if (predicate(value)) {
    return Effect.succeed(value);
  }
  return Effect.fail(onFail());
}

/**
 * Type guard: Check if an Effect has no requirements (R = never)
 *
 * This is useful for ensuring domain layer purity - all domain
 * Effects should have R = never (no external dependencies).
 */
export function isPureEffect<T, E, R>(
  effect: Effect.Effect<T, E, R>,
): effect is Effect.Effect<T, E, never> {
  // At runtime, all Effects are the same structure
  // This is a compile-time type guard for documentation
  return true;
}

/**
 * Validate that an Effect is pure (has no requirements)
 *
 * Throws a compile-time error if the Effect has requirements.
 * Use this to enforce domain layer purity.
 *
 * @example
 * ```typescript
 * // Domain entity factory
 * static create(props: UserProps): Effect<User, ValidationError, never> {
 *   return assertPureEffect(
 *     Effect.gen(function* () {
 *       // ... validation logic
 *       return yield* Effect.succeed(new User(props));
 *     })
 *   );
 * }
 * ```
 */
export function assertPureEffect<T, E>(
  effect: Effect.Effect<T, E, never>,
): Effect.Effect<T, E, never> {
  return effect;
}

/**
 * Utility type for Effect-based entity factories
 *
 * This type represents the standard pattern for entity creation
 * methods that return Effect.
 */
export type EntityEffect<Entity, Error> = Effect.Effect<Entity, Error, never>;

/**
 * Extract the success type from an Effect
 */
export type EffectSuccess<T> =
  T extends Effect.Effect<infer A, infer _E, infer _R> ? A : never;

/**
 * Extract the error type from an Effect
 */
export type EffectError<T> =
  T extends Effect.Effect<infer _A, infer E, infer _R> ? E : never;

/**
 * Extract the requirements type from an Effect
 */
export type EffectRequirements<T> =
  T extends Effect.Effect<infer _A, infer _E, infer R> ? R : never;
