/**
 * Test Infrastructure Helpers for Adapters Package
 *
 * Provides Layer-based test utilities for the adapters layer.
 * These helpers enable type-safe, composable testing of Effect-based
 * adapters with in-memory implementations.
 *
 * @module test-helpers
 *
 * @example
 * ```typescript
 * import { runWithTestLayer, createDrizzleDbMock } from '@mirai-app/adapters/test';
 * import { Effect, Layer } from 'effect';
 *
 * const testLayer = Layer.succeed(DrizzleDbTag, mockDb);
 *
 * const result = await runWithTestLayer(
 *   Effect.gen(function* () {
 *     const db = yield* DrizzleDbTag;
 *     return yield* Effect.succeed(db.query());
 *   }),
 *   testLayer
 * );
 * ```
 */

import { Effect, Layer, Context, Exit, Either } from "effect";

// =============================================================================
// Test Execution Helpers
// =============================================================================

/**
 * Runs an Effect program with a provided test layer and returns a Promise.
 *
 * This helper simplifies testing by handling the Effect.runPromise conversion
 * and layer provisioning in one call.
 *
 * @template A - The success type of the Effect
 * @template E - The error type of the Effect
 * @template R - The requirements/context type of the Effect
 *
 * @param program - The Effect program to run
 * @param layer - The Layer providing the required dependencies
 * @returns Promise that resolves with the success value or rejects with the error
 *
 * @example
 * ```typescript
 * const result = await runWithTestLayer(
 *   Effect.gen(function* () {
 *     const service = yield* MyServiceTag;
 *     return yield* service.calculate();
 *   }),
 *   mockLayer
 * );
 * expect(result).toBeDefined();
 * ```
 */
export function runWithTestLayer<A, E, R>(
  program: Effect.Effect<A, E, R>,
  layer: Layer.Layer<R, never, never>,
): Promise<A> {
  return Effect.runPromise(program.pipe(Effect.provide(layer)));
}

/**
 * Runs an Effect program with a provided test layer and returns the Exit result.
 *
 * This is useful for tests that need to inspect both success and failure cases
 * without throwing exceptions.
 *
 * @template A - The success type of the Effect
 * @template E - The error type of the Effect
 * @template R - The requirements/context type of the Effect
 *
 * @param program - The Effect program to run
 * @param layer - The Layer providing the required dependencies
 * @returns Promise that resolves with Exit.Success or Exit.Failure
 *
 * @example
 * ```typescript
 * const exit = await runWithTestLayerExit(
 *   service.calculate(),
 *   mockLayer
 * );
 * expect(Exit.isSuccess(exit)).toBe(true);
 * ```
 */
export function runWithTestLayerExit<A, E, R>(
  program: Effect.Effect<A, E, R>,
  layer: Layer.Layer<R, never, never>,
): Promise<Exit.Exit<A, E>> {
  return Effect.runPromise(Effect.exit(program.pipe(Effect.provide(layer))));
}

/**
 * Runs an Effect program with a provided test layer and returns Either.
 *
 * Useful for assertions that check both Left and Right cases.
 *
 * @template A - The success type of the Effect
 * @template E - The error type of the Effect
 * @template R - The requirements/context type of the Effect
 *
 * @param program - The Effect program to run
 * @param layer - The Layer providing the required dependencies
 * @returns Promise that resolves with Either.Left or Either.Right
 *
 * @example
 * ```typescript
 * const either = await runWithTestLayerEither(
 *   service.findById('nonexistent'),
 *   mockLayer
 * );
 * expect(either._tag).toBe('Left');
 * ```
 */
export function runWithTestLayerEither<A, E, R>(
  program: Effect.Effect<A, E, R>,
  layer: Layer.Layer<R, never, never>,
): Promise<Either.Either<A, E>> {
  return Effect.runPromise(Effect.either(program.pipe(Effect.provide(layer))));
}

// =============================================================================
// Layer Creation Helpers
// =============================================================================

/**
 * Creates a test layer from a single service implementation.
 *
 * This is a convenience wrapper around Layer.succeed for creating
 * test doubles with proper type inference.
 *
 * @template Tag - The Context.Tag type
 * @template Service - The service interface type
 *
 * @param tag - The Context.Tag identifier for the service
 * @param implementation - The service implementation
 * @returns A Layer that provides the service
 *
 * @example
 * ```typescript
 * const mockLayer = createServiceLayer(
 *   DrizzleDbTag,
 *   mockDb
 * );
 * ```
 */
export function createServiceLayer<Tag extends Context.Tag<any, any>>(
  tag: Tag,
  implementation: Context.Tag.Service<Tag>,
): Layer.Layer<Context.Tag.Identifier<Tag>, never, never> {
  return Layer.succeed(tag, implementation);
}

/**
 * Merges multiple test layers into a single layer.
 *
 * This is a convenience wrapper around Layer.mergeAll.
 *
 * @template Layers - Array of Layer types to merge
 *
 * @param layers - Array of layers to merge
 * @returns A single layer providing all services
 *
 * @example
 * ```typescript
 * const testLayer = mergeTestLayers(
 *   createDbMockLayer(),
 *   createServiceMockLayer()
 * );
 * ```
 */
export function mergeTestLayers<
  Layers extends [
    Layer.Layer<any, never, never>,
    ...Layer.Layer<any, never, never>[],
  ],
>(
  ...layers: Layers
): Layer.Layer<Layer.Layer.Success<Layers[number]>, never, never> {
  return Layer.mergeAll(...layers) as Layer.Layer<
    Layer.Layer.Success<Layers[number]>,
    never,
    never
  >;
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Asserts that an Exit is a success and returns the value.
 * Useful for type narrowing in test assertions.
 *
 * @template A - The success type
 * @template E - The error type
 *
 * @param exit - The Exit to check
 * @returns The success value
 * @throws If the Exit is a failure
 *
 * @example
 * ```typescript
 * const exit = await runWithTestLayerExit(program, layer);
 * const value = assertSuccess(exit);
 * expect(value.id).toBe('123');
 * ```
 */
export function assertSuccess<A, E>(exit: Exit.Exit<A, E>): A {
  if (Exit.isSuccess(exit)) {
    return exit.value;
  }
  throw new Error(
    `Expected success but got failure: ${JSON.stringify(exit.cause)}`,
  );
}

/**
 * Asserts that an Exit is a failure and returns the error.
 * Useful for type narrowing in test assertions.
 *
 * @template A - The success type
 * @template E - The error type
 *
 * @param exit - The Exit to check
 * @returns The error
 * @throws If the Exit is a success
 *
 * @example
 * ```typescript
 * const exit = await runWithTestLayerExit(program, layer);
 * const error = assertFailure(exit);
 * expect(error._tag).toBe('NotFoundError');
 * ```
 */
export function assertFailure<A, E>(exit: Exit.Exit<A, E>): E {
  if (Exit.isFailure(exit)) {
    const error = Exit.match(exit, {
      onSuccess: () => undefined as unknown as E,
      onFailure: (cause) => {
        if (cause._tag === "Fail") {
          return cause.error as E;
        }
        return cause as unknown as E;
      },
    });
    return error;
  }
  throw new Error(
    `Expected failure but got success: ${JSON.stringify(exit.value)}`,
  );
}

/**
 * Checks if an Exit represents a specific error type.
 *
 * @template ErrorType - The expected error type
 *
 * @param exit - The Exit to check
 * @param errorTag - The error tag to match (e.g., "NotFoundError")
 * @returns true if the Exit is a failure with the specified error tag
 *
 * @example
 * ```typescript
 * const exit = await runWithTestLayerExit(program, layer);
 * expect(isFailureWithTag(exit, 'NotFoundError')).toBe(true);
 * ```
 */
export function isFailureWithTag<ErrorType extends { _tag: string }>(
  exit: Exit.Exit<unknown, unknown>,
  errorTag: ErrorType["_tag"],
): boolean {
  if (Exit.isSuccess(exit)) {
    return false;
  }

  return Exit.match(exit, {
    onSuccess: () => false,
    onFailure: (cause) => {
      if (cause._tag === "Fail") {
        const error = cause.error as { _tag?: string };
        return error._tag === errorTag;
      }
      return false;
    },
  });
}

// =============================================================================
// Type Helpers
// =============================================================================

/**
 * Helper type for extracting the service interface from a Context.Tag.
 * Useful for typing mock implementations.
 *
 * @example
 * ```typescript
 * type MockService = ServiceFromTag<typeof MyServiceTag>;
 * ```
 */
export type ServiceFromTag<T extends Context.Tag<any, any>> =
  Context.Tag.Service<T>;

/**
 * Helper type for extracting the identifier from a Context.Tag.
 *
 * @example
 * ```typescript
 * type ServiceId = IdentifierFromTag<typeof MyServiceTag>;
 * ```
 */
export type IdentifierFromTag<T extends Context.Tag<any, any>> =
  Context.Tag.Identifier<T>;

/**
 * Type alias for test requirements that never need live services.
 * Used to enforce test isolation and purity.
 */
export type TestRequirements = never;
