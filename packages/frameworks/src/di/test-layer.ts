/**
 * Test Layer Utilities for Effect-based Dependency Injection
 *
 * Provides Effect Layer-based testing utilities for the Mirai App monorepo.
 * All tests should use Layer.succeed pattern for dependency injection.
 *
 * ## Quick Reference
 *
 * ```typescript
 * // Basic test layer with all InMemory adapters
 * const testLayer = createTestLayer();
 *
 * // Custom test layer with overrides
 * const testLayer = createTestLayer({
 *   userRepository: new InMemoryUserRepository(),
 *   authAdapter: new InMemoryAuthAdapter(),
 * });
 *
 * // Run Effect with the layer
 * const program = Effect.gen(function* () {
 *   const repo = yield* UserRepositoryTag;
 *   return yield* repo.findById("123");
 * }).pipe(Effect.provide(testLayer));
 * ```
 *
 * ## Pattern Reference
 *
 * | Pattern | Example |
 * |---------|---------|
 * | Create test layer | `createTestLayer()` or `createTestLayer({ overrides })` |
 * | Mock single service | `Layer.succeed(Tag, implementation)` |
 * | Mock multiple services | `mockLayers({ tag, implementation })` |
 * | Run with layer | `Effect.runPromise(effect.pipe(Effect.provide(layer)))` |
 *
 * @module test-layer
 */

import { Layer, Context } from "effect";

// =============================================================================
// InMemory Adapter Imports
// =============================================================================

import { InMemoryAuthAdapter } from "@mirai-app/adapters/gateways/auth/in-memory/adapter";
import { InMemoryRealtimeAdapter } from "@mirai-app/adapters/gateways/realtime/in-memory/adapter";
import { InMemoryStorageAdapter } from "@mirai-app/adapters/gateways/storage/in-memory/adapter";
import { InMemoryUserGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";

// =============================================================================
// Port Tags
// =============================================================================

import {
  AuthPortTag,
  RealtimePortTag,
  StoragePortTag,
  UserRepositoryTag,
} from "@mirai-app/use-cases";

// =============================================================================
// Test Layer Builders
// =============================================================================

/**
 * Configuration for test layer creation
 */
export interface TestLayerConfig {
  /** Override the auth adapter (default: new InMemoryAuthAdapter()) */
  authAdapter?: InMemoryAuthAdapter;
  /** Override the realtime adapter (default: new InMemoryRealtimeAdapter()) */
  realtimeAdapter?: InMemoryRealtimeAdapter;
  /** Override the storage adapter (default: new InMemoryStorageAdapter()) */
  storageAdapter?: InMemoryStorageAdapter;
  /** Override the user gateway (default: new InMemoryUserGateway()) */
  userGateway?: InMemoryUserGateway;
  /** Additional Layer overrides to merge with the base test layer */
  overrides?: ReadonlyArray<Layer.Layer<any, never, never>>;
}

/**
 * Options for creating a test layer with custom mock implementations
 */
export interface TestLayerOptions<R> {
  /** Base layer to extend (optional) */
  baseLayer?: Layer.Layer<any, never, never>;
  /** Custom mock implementations as Layer.succeed bindings */
  mocks: Array<{
    tag: Context.Tag<any, any>;
    implementation: any;
  }>;
  /** Additional layers to merge */
  extraLayers?: ReadonlyArray<Layer.Layer<any, never, never>>;
}

/**
 * Result type for createTestLayer with options
 */
export interface TestLayerResult<R> {
  /** The composed test layer */
  layer: Layer.Layer<R, never, never>;
  /** Run an Effect with this layer */
  run: <E, A>(effect: import("effect").Effect.Effect<A, E, R>) => Promise<A>;
  /** Provide this layer to an Effect */
  provide: <E, A>(
    effect: import("effect").Effect.Effect<A, E, R>,
  ) => import("effect").Effect.Effect<A, E, never>;
}

/**
 * Create a standard test layer with all InMemory adapters
 *
 * This is the recommended way to create a test layer for most tests.
 * All InMemory adapters are automatically instantiated and bound to their Tags.
 *
 * @param config - Optional overrides for specific adapters or additional layers
 * @returns Layer with all InMemory adapters bound, merged with any provided overrides
 *
 * @example
 * ```typescript
 * import { createTestLayer } from "@mirai-app/frameworks/di";
 * import { Effect } from "effect";
 *
 * const testLayer = createTestLayer();
 *
 * const program = Effect.gen(function* () {
 *   const auth = yield* AuthPortTag;
 *   const users = yield* UserRepositoryTag;
 *   // Use adapters...
 * }).pipe(Effect.provide(testLayer));
 * ```
 *
 * @example
 * ```typescript
 * // Custom test layer with overrides
 * const testLayer = createTestLayer({
 *   userRepository: new InMemoryUserGateway(),
 *   authAdapter: new InMemoryAuthAdapter(),
 * });
 * ```
 */
export function createTestLayer(
  config: TestLayerConfig = {},
): Layer.Layer<unknown, never, never> {
  const baseLayer = Layer.mergeAll(
    Layer.succeed(AuthPortTag, config.authAdapter ?? new InMemoryAuthAdapter()),
    Layer.succeed(
      RealtimePortTag,
      config.realtimeAdapter ?? new InMemoryRealtimeAdapter(),
    ),
    Layer.succeed(
      StoragePortTag,
      config.storageAdapter ?? new InMemoryStorageAdapter(),
    ),
    Layer.succeed(
      UserRepositoryTag,
      config.userGateway ?? new InMemoryUserGateway(),
    ),
  );

  // Merge with any additional override layers
  if (config.overrides && config.overrides.length > 0) {
    return Layer.mergeAll(baseLayer, ...config.overrides) as Layer.Layer<
      unknown,
      never,
      never
    >;
  }

  return baseLayer as Layer.Layer<unknown, never, never>;
}

/**
 * Create a minimal test layer with just the specified services
 *
 * Use this when you only need a subset of services for your test.
 *
 * @example
 * ```typescript
 * const minimalLayer = createMinimalTestLayer({
 *   userGateway: new InMemoryUserGateway(),
 * });
 * ```
 */
export function createMinimalTestLayer<
  T extends Record<string, any>,
>(services: {
  [K in keyof T]: { tag: Context.Tag<T[K], any>; implementation: T[K] };
}): Layer.Layer<any, never, never> {
  const layers = Object.values(services).map(({ tag, implementation }) =>
    Layer.succeed(tag, implementation),
  );
  return Layer.mergeAll(...layers);
}

// =============================================================================
// Individual Service Layers
// =============================================================================

/**
 * Create a layer with just the AuthPort
 *
 * @param adapter - InMemoryAuthAdapter instance (default: new)
 * @returns Layer with AuthPortTag bound
 */
export function createAuthTestLayer(
  adapter: InMemoryAuthAdapter = new InMemoryAuthAdapter(),
): Layer.Layer<typeof AuthPortTag, never, never> {
  return Layer.succeed(AuthPortTag, adapter);
}

/**
 * Create a layer with just the RealtimePort
 *
 * @param adapter - InMemoryRealtimeAdapter instance (default: new)
 * @returns Layer with RealtimePortTag bound
 */
export function createRealtimeTestLayer(
  adapter: InMemoryRealtimeAdapter = new InMemoryRealtimeAdapter(),
): Layer.Layer<typeof RealtimePortTag, never, never> {
  return Layer.succeed(RealtimePortTag, adapter);
}

/**
 * Create a layer with just the StoragePort
 *
 * @param adapter - InMemoryStorageAdapter instance (default: new)
 * @returns Layer with StoragePortTag bound
 */
export function createStorageTestLayer(
  adapter: InMemoryStorageAdapter = new InMemoryStorageAdapter(),
): Layer.Layer<typeof StoragePortTag, never, never> {
  return Layer.succeed(StoragePortTag, adapter);
}

/**
 * Create a layer with just the UserRepository
 *
 * @param gateway - InMemoryUserGateway instance (default: new)
 * @returns Layer with UserRepositoryTag bound
 */
export function createUserRepositoryTestLayer(
  gateway: InMemoryUserGateway = new InMemoryUserGateway(),
): Layer.Layer<typeof UserRepositoryTag, never, never> {
  return Layer.succeed(UserRepositoryTag, gateway);
}

// =============================================================================
// Mock Helper Functions
// =============================================================================

/**
 * Create a mock layer using Layer.succeed pattern
 *
 * Helper function for the common pattern of `Layer.succeed(Tag, implementation)`.
 * Use this for mocking dependencies in tests.
 *
 * @param tag - The Context.Tag to bind the implementation to
 * @param implementation - The mock implementation
 * @returns A Layer with the tag bound to the implementation
 *
 * @example
 * ```typescript
 * const mockRepo = {
 *   findById: (id: string) => Effect.succeed({ id, name: "Test User" })
 * };
 * const mockLayer = mockLayerOf(UserRepositoryTag, mockRepo);
 * ```
 */
export function mockLayerOf<T, I extends T>(
  tag: Context.Tag<T, any>,
  implementation: I,
): Layer.Layer<typeof tag, never, never> {
  return Layer.succeed(tag, implementation);
}

/**
 * Create multiple mock layers from a record of tag/implementation pairs
 *
 * @param mocks - Record of tag names to { tag, implementation } pairs
 * @returns Merged Layer with all mocks bound
 *
 * @example
 * ```typescript
 * const mocks = mockLayers({
 *   userRepo: { tag: UserRepositoryTag, implementation: mockUserRepo },
 *   authPort: { tag: AuthPortTag, implementation: mockAuthPort }
 * });
 * ```
 */
export function mockLayers<
  T extends Record<string, { tag: Context.Tag<any, any>; implementation: any }>,
>(
  mocks: T,
): Layer.Layer<
  {
    [K in keyof T]: T[K] extends { tag: Context.Tag<infer R, any> } ? R : never;
  }[keyof T],
  never,
  never
> {
  const layers = Object.values(mocks).map(({ tag, implementation }) =>
    Layer.succeed(tag, implementation),
  );
  return Layer.mergeAll(...layers) as Layer.Layer<
    {
      [K in keyof T]: T[K] extends { tag: Context.Tag<infer R, any> }
        ? R
        : never;
    }[keyof T],
    never,
    never
  >;
}

/**
 * Create a mock layer for authentication testing
 *
 * @param overrides - Optional overrides for specific auth methods
 * @returns Layer with AuthPortTag bound to a mock implementation
 *
 * @example
 * ```typescript
 * const authLayer = createMockAuthLayer({
 *   verifyToken: () => Effect.succeed({ userId: "123", email: "test@example.com" })
 * });
 * ```
 */
export function createMockAuthLayer(
  overrides?: Partial<InMemoryAuthAdapter>,
): Layer.Layer<typeof AuthPortTag, never, never> {
  const baseAdapter = new InMemoryAuthAdapter();
  const mockAdapter = { ...baseAdapter, ...overrides };
  return Layer.succeed(AuthPortTag, mockAdapter);
}

/**
 * Create a mock layer for repository testing
 *
 * @param repositoryTag - The repository tag to mock
 * @param implementation - The repository implementation
 * @returns Layer with the repository tag bound
 *
 * @example
 * ```typescript
 * const mockRepoLayer = createMockRepositoryLayer(
 *   UserRepositoryTag,
 *   { findById: (id) => Effect.succeed(null) }
 * );
 * ```
 */
export function createMockRepositoryLayer<T>(
  repositoryTag: Context.Tag<T, any>,
  implementation: Partial<T>,
): Layer.Layer<typeof repositoryTag, never, never> {
  // Create a proxy that defaults to the implementation for provided methods
  const proxy = new Proxy(implementation as T, {
    get(target, prop) {
      if (prop in target) {
        return (target as any)[prop];
      }
      return () =>
        require("effect").Effect.fail(
          new Error(`Method ${String(prop)} not mocked`),
        );
    },
  });
  return Layer.succeed(repositoryTag, proxy);
}

/**
 * Create a mock layer for service/port testing
 *
 * @param portTag - The port tag to mock
 * @param implementation - The port implementation
 * @returns Layer with the port tag bound
 *
 * @example
 * ```typescript
 * const storageLayer = createMockPortLayer(
 *   StoragePortTag,
 *   { uploadFile: () => Effect.succeed("https://example.com/file.txt") }
 * );
 * ```
 */
export function createMockPortLayer<T>(
  portTag: Context.Tag<T, any>,
  implementation: Partial<T>,
): Layer.Layer<typeof portTag, never, never> {
  return Layer.succeed(portTag, implementation as T);
}

// =============================================================================
// Test Helper Functions
// =============================================================================

/**
 * Helper to run an Effect with a test layer
 *
 * Combines Effect.runPromise with Effect.provide for cleaner test code.
 *
 * @example
 * ```typescript
 * const result = await runWithTestLayer(testLayer,
 *   Effect.gen(function* () {
 *     const repo = yield* UserRepositoryTag;
 *     return yield* repo.findById("123");
 *   })
 * );
 * expect(result).toBeDefined();
 * ```
 */
export function runWithTestLayer<R, E, A>(
  layer: Layer.Layer<R, never, never>,
  effect: import("effect").Effect.Effect<A, E, R>,
): Promise<A> {
  const { Effect } = require("effect");
  return Effect.runPromise(effect.pipe(Effect.provide(layer)));
}

/**
 * Helper type for test layers
 */
export type TestLayer = Layer.Layer<any, never, never>;

/**
 * Create an enhanced test layer with fluent API for running Effects
 *
 * This advanced version returns an object with the layer and helper methods
 * for running Effects, making test code more concise.
 *
 * @param options - Configuration including mocks and extra layers
 * @returns TestLayerResult with layer and run/provide helpers
 *
 * @example
 * ```typescript
 * const { run, provide, layer } = createTestLayerWithHelpers({
 *   mocks: [
 *     { tag: UserRepositoryTag, implementation: mockUserRepo },
 *     { tag: AuthPortTag, implementation: mockAuthPort }
 *   ]
 * });
 *
 * // Run an Effect directly
 * const result = await run(
 *   Effect.gen(function* () {
 *     const repo = yield* UserRepositoryTag;
 *     return yield* repo.findById("123");
 *   })
 * );
 *
 * // Or provide the layer to an existing Effect
 * const provided = provide(myEffect);
 * const result = await Effect.runPromise(provided);
 * ```
 */
export function createTestLayerWithHelpers<R>(
  options: TestLayerOptions<R>,
): TestLayerResult<R> {
  const { Effect } = require("effect");

  // Create layers from mocks
  const mockLayers = options.mocks.map(({ tag, implementation }) =>
    Layer.succeed(tag, implementation),
  );

  // Compose the final layer
  const baseLayer =
    options.baseLayer ?? Layer.succeed(Context.Tag<any>("Empty"), {});
  const extraLayers = options.extraLayers ?? [];
  const finalLayer = Layer.mergeAll(
    baseLayer,
    ...mockLayers,
    ...extraLayers,
  ) as Layer.Layer<R, never, never>;

  return {
    layer: finalLayer,
    run: <E, A>(
      effect: import("effect").Effect.Effect<A, E, R>,
    ): Promise<A> => {
      return Effect.runPromise(effect.pipe(Effect.provide(finalLayer)));
    },
    provide: <E, A>(effect: import("effect").Effect.Effect<A, E, R>) => {
      return effect.pipe(Effect.provide(finalLayer));
    },
  };
}
