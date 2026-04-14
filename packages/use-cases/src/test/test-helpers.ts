/**
 * Test Infrastructure Helpers for Effect-based Testing
 *
 * Provides Layer-based test utilities for the use-cases layer.
 * These helpers enable type-safe, composable testing of Effect-based
 * use cases with in-memory repository implementations.
 *
 * @module test-helpers
 *
 * @example
 * ```typescript
 * import { runWithTestLayer, createUserRepositoryMock } from '@mirai-app/use-cases/test';
 * import { Effect, Layer } from 'effect';
 *
 * const testLayer = Layer.mergeAll(
 *   createUserRepositoryMock({ users: [mockUser] }),
 *   createGroupRepositoryMock(),
 * );
 *
 * const result = await runWithTestLayer(
 *   Effect.gen(function* () {
 *     const useCase = yield* GetUserUseCase;
 *     return yield* useCase.execute({ userId: '123' });
 *   }),
 *   testLayer
 * );
 * ```
 */

import { Effect, Layer, Context, Exit } from "effect";

/**
 * Type alias for test requirements that never need live services.
 * Used to enforce test isolation and purity.
 */
export type TestRequirements = never;

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
 *     const repo = yield* UserRepositoryTag;
 *     return yield* repo.findById('123');
 *   }),
 *   createUserRepositoryMock()
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
 *   Effect.fail(new NotFoundError()),
 *   Layer.empty
 * );
 * expect(Exit.isFailure(exit)).toBe(true);
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
 *   useCase.execute({ id: 'nonexistent' }),
 *   mockLayer
 * );
 * expect(either._tag).toBe('Left');
 * ```
 */
export function runWithTestLayerEither<A, E, R>(
  program: Effect.Effect<A, E, R>,
  layer: Layer.Layer<R, never, never>,
): Promise<Effect.Effect.Success<Effect.Effect<A, E, never>>> {
  return Effect.runPromise(
    Effect.either(program.pipe(Effect.provide(layer))),
  ) as Promise<Effect.Effect.Success<Effect.Effect<A, E, never>>>;
}

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
 * const mockLayer = createTestLayer(
 *   UserRepositoryTag,
 *   {
 *     findById: () => Effect.succeed(null),
 *     save: (user) => Effect.succeed(user),
 *   }
 * );
 * ```
 */
export function createTestLayer<Tag extends Context.Tag<any, any>>(
  tag: Tag,
  implementation: Context.Tag.Service<Tag>,
): Layer.Layer<Context.Tag.Identifier<Tag>, never, never> {
  return Layer.succeed(tag, implementation);
}

/**
 * Creates a Layer that fails with the specified error for all operations.
 * Useful for testing error handling paths.
 *
 * @template Tag - The Context.Tag type
 * @template E - The error type
 *
 * @param tag - The Context.Tag identifier
 * @param error - The error to fail with
 * @returns A Layer that provides a service where all methods fail
 *
 * @example
 * ```typescript
 * const failingLayer = createFailingLayer(
 *   UserRepositoryTag,
 *   new DatabaseError({ operation: 'findById', message: 'Connection failed' })
 * );
 *
 * await expect(
 *   runWithTestLayer(repo.findById('123'), failingLayer)
 * ).rejects.toThrow();
 * ```
 */
export function createFailingLayer<Tag extends Context.Tag<any, any>, E>(
  tag: Tag,
  error: E,
): Layer.Layer<Context.Tag.Identifier<Tag>, never, never> {
  // Get the shape of the service from the tag's Service type
  type ServiceShape = Context.Tag.Service<Tag>;

  // Create a proxy that returns failing Effects for all methods
  const proxy = new Proxy({} as ServiceShape, {
    get: (_target, prop) => {
      if (typeof prop === "string") {
        return (..._args: unknown[]) => Effect.fail(error);
      }
      return undefined;
    },
  });

  return Layer.succeed(tag, proxy);
}

/**
 * Merges multiple test layers into a single layer.
 *
 * This is a convenience wrapper around Layer.mergeAll that provides
 * better type inference for test scenarios.
 *
 * @template Layers - Array of Layer types to merge
 *
 * @param layers - Array of layers to merge
 * @returns A single layer providing all services
 *
 * @example
 * ```typescript
 * const testLayer = mergeTestLayers(
 *   createUserRepositoryMock(),
 *   createGroupRepositoryMock(),
 *   createChallengeRepositoryMock()
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

/**
 * Creates a Layer from an Effect that builds the service implementation.
 *
 * Useful when the service implementation itself requires some Effect-based
 * setup (e.g., initializing in-memory state).
 *
 * @template Tag - The Context.Tag type
 *
 * @param tag - The Context.Tag identifier
 * @param effect - Effect that produces the service implementation
 * @returns A Layer that provides the service
 *
 * @example
 * ```typescript
 * const mockLayer = createTestLayerFromEffect(
 *   UserRepositoryTag,
 *   Effect.gen(function* () {
 *     const state = yield* Ref.make(new Map());
 *     return {
 *       findById: (id) => Ref.get(state).pipe(Effect.map(s => s.get(id) ?? null)),
 *     };
 *   })
 * );
 * ```
 */
export function createTestLayerFromEffect<Tag extends Context.Tag<any, any>>(
  tag: Tag,
  effect: Effect.Effect<Context.Tag.Service<Tag>, never, never>,
): Layer.Layer<Context.Tag.Identifier<Tag>, never, never> {
  return Layer.effect(tag, effect);
}

/**
 * Helper type for extracting the service interface from a Context.Tag.
 * Useful for typing mock implementations.
 *
 * @example
 * ```typescript
 * type MockRepo = ServiceFromTag<typeof UserRepositoryTag>;
 * // MockRepo is the UserRepository interface
 * ```
 */
export type ServiceFromTag<T extends Context.Tag<any, any>> =
  Context.Tag.Service<T>;

/**
 * Helper type for extracting the identifier from a Context.Tag.
 *
 * @example
 * ```typescript
 * type RepoId = IdentifierFromTag<typeof UserRepositoryTag>;
 * // RepoId is the UserRepositoryTag identifier type
 * ```
 */
export type IdentifierFromTag<T extends Context.Tag<any, any>> =
  Context.Tag.Identifier<T>;

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
    // Extract the error from the Cause
    const error = Exit.match(exit, {
      onSuccess: () => undefined as unknown as E,
      onFailure: (cause) => {
        // Handle different cause types
        if (cause._tag === "Fail") {
          return cause.error as E;
        }
        // For other cause types (Die, Interrupt, Sequential, Parallel),
        // we need to handle them differently
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
