/**
 * Effect Utilities for Domain Layer
 *
 * Provides bridge functions between the legacy Result<T,E> type and Effect<T,E,never>.
 * These utilities enable incremental migration from Result to Effect patterns.
 *
 * @module effect-utils
 */

import { Effect, Either } from "effect";
import type { Result } from "./utils/result";
import { ok, err, isSuccess, isError } from "./utils/result";

/**
 * Convert a Result<T,E> to Effect<T,E,never>
 *
 * This function bridges the legacy Result type with Effect, allowing
 * incremental migration. Domain entities can return Effect while
 * maintaining backward compatibility with existing Result-based code.
 *
 * @example
 * ```typescript
 * // Legacy Result-based entity
 * const result = User.create(props); // Result<User, ValidationError>
 *
 * // Convert to Effect
 * const effect = resultToEffect(result); // Effect<User, ValidationError, never>
 *
 * // Use with Effect combinators
 * const nameEffect = effect.pipe(Effect.map(user => user.name));
 * ```
 */
export function resultToEffect<T, E>(
  result: Result<T, E>,
): Effect.Effect<T, E, never> {
  if (isSuccess(result)) {
    return Effect.succeed(result.value);
  }
  return Effect.fail(result.error);
}

/**
 * Convert an Effect<T,E,never> to Result<T,E>
 *
 * This function allows Effect-based code to interface with legacy
 * Result-based consumers during the migration period.
 *
 * @example
 * ```typescript
 * // Effect-based computation
 * const effect = Effect.succeed(42);
 *
 * // Convert to Result for legacy consumer
 * const result = await effectToResult(effect); // Result<number, never>
 *
 * // Use with Result utilities
 * if (isSuccess(result)) {
 *   console.log(result.value); // 42
 * }
 * ```
 */
export async function effectToResult<T, E>(
  effect: Effect.Effect<T, E, never>,
): Promise<Result<T, E>> {
  const either = await Effect.runPromise(Effect.either(effect));
  if (Either.isRight(either)) {
    return ok(either.right);
  }
  return err(either.left);
}

/**
 * Synchronously convert an Effect<T,E,never> to Result<T,E>
 *
 * This is a synchronous version that runs the effect immediately.
 * Only use this when you know the effect has no async operations
 * (which is true for all domain-layer Effects).
 *
 * @example
 * ```typescript
 * // Pure domain computation
 * const effect = User.createEffect(props);
 *
 * // Synchronous conversion (safe for pure Effects)
 * const result = effectToResultSync(effect);
 *
 * // Use with existing Result patterns
 * const user = unwrapOr(result, defaultUser);
 * ```
 */
export function effectToResultSync<T, E>(
  effect: Effect.Effect<T, E, never>,
): Result<T, E> {
  const either = Effect.runSync(Effect.either(effect));
  if (Either.isRight(either)) {
    return ok(either.right);
  }
  return err(either.left);
}

/**
 * Lift a synchronous function that returns Result into an Effect
 *
 * @example
 * ```typescript
 * const validateEmail = (email: string): Result<Email, ValidationError> => {...};
 *
 * // Lift to Effect
 * const validateEmailEffect = (email: string) =>
 *   resultFnToEffect(() => validateEmail(email));
 *
 * // Use in Effect pipelines
 * const program = Effect.gen(function* () {
 *   const email = yield* validateEmailEffect("user@example.com");
 *   // ...
 * });
 * ```
 */
export function resultFnToEffect<T, E>(
  fn: () => Result<T, E>,
): Effect.Effect<T, E, never> {
  return Effect.sync(fn).pipe(Effect.flatMap(resultToEffect));
}

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
export function fromPredicate<T>(
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

type E = unknown;

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
