/**
 * Test Layer Utilities for Effect-based Dependency Injection
 *
 * Provides Effect Layer-based testing utilities to replace awilix container.
 * All new tests should use Layer.succeed pattern for dependency injection.
 *
 * ## Migration from createTestContainer()
 *
 * OLD (awilix-based):
 * ```typescript
 * const container = createTestContainer();
 * container.register({
 *   userRepository: asClass(InMemoryUserRepository).singleton(),
 * });
 * const repo = container.resolve<UserRepository>("userRepository");
 * ```
 *
 * NEW (Effect Layer-based):
 * ```typescript
 * const testLayer = Layer.succeed(UserRepositoryTag, new InMemoryUserRepository());
 * const program = Effect.gen(function* () {
 *   const repo = yield* UserRepositoryTag;
 *   return yield* repo.findById("123");
 * }).pipe(Effect.provide(testLayer));
 * ```
 *
 * ## Quick Reference
 *
 * | Old Pattern | New Pattern |
 * |-------------|-------------|
 * | `createTestContainer()` | `createTestLayer()` or inline `Layer.succeed` |
 * | `container.register({key: asClass(Class)})` | `Layer.succeed(Tag, new Class())` |
 * | `container.resolve("key")` | `yield* Tag` in Effect.gen |
 * | `getInMemoryAuthAdapter(container)` | Direct adapter instantiation |
 *
 * @module test-layer
 */

import { Layer, Context } from "effect";

// =============================================================================
// InMemory Adapter Imports
// =============================================================================

import { InMemoryAuthAdapter } from "@mirai-app/adapters/gateways/auth/InMemoryAuthAdapter";
import { InMemoryRealtimeAdapter } from "@mirai-app/adapters/gateways/realtime/InMemoryRealtimeAdapter";
import { InMemoryStorageAdapter } from "@mirai-app/adapters/gateways/storage/InMemoryStorageAdapter";
import { InMemoryUserRepository } from "@mirai-app/adapters/gateways/in-memory";

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
  /** Override the user repository (default: new InMemoryUserRepository()) */
  userRepository?: InMemoryUserRepository;
}

/**
 * Create a standard test layer with all InMemory adapters
 *
 * This is the recommended way to create a test layer for most tests.
 * All InMemory adapters are automatically instantiated and bound to their Tags.
 *
 * @param config - Optional overrides for specific adapters
 * @returns Layer with all InMemory adapters bound
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
 */
export function createTestLayer(
  config: TestLayerConfig = {},
): Layer.Layer<
  | typeof AuthPortTag
  | typeof RealtimePortTag
  | typeof StoragePortTag
  | typeof UserRepositoryTag,
  never,
  never
> {
  return Layer.mergeAll(
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
      config.userRepository ?? new InMemoryUserRepository(),
    ),
  );
}

/**
 * Create a minimal test layer with just the specified services
 *
 * Use this when you only need a subset of services for your test.
 *
 * @example
 * ```typescript
 * const minimalLayer = createMinimalTestLayer({
 *   userRepository: new InMemoryUserRepository(),
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
 * @param repository - InMemoryUserRepository instance (default: new)
 * @returns Layer with UserRepositoryTag bound
 */
export function createUserRepositoryTestLayer(
  repository: InMemoryUserRepository = new InMemoryUserRepository(),
): Layer.Layer<typeof UserRepositoryTag, never, never> {
  return Layer.succeed(UserRepositoryTag, repository);
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

// =============================================================================
// Backward Compatibility (Deprecated)
// =============================================================================

/**
 * @deprecated Use jest.spyOn or explicit mock functions instead. Kept for type compatibility.
 */
export type MockFn<T = any> = {
  (...args: unknown[]): T | undefined;
  calls: unknown[][];
  getCallCount: () => number;
  getLastCall: () => unknown[] | undefined;
  wasCalledWith: (...expectedArgs: unknown[]) => boolean;
  reset: () => void;
};

// Ensure MockFn is available as both type and runtime export
export { MockFn as MockFnType };

/**
 * @deprecated Use createTestLayer() instead. Maintained for backward compatibility.
 */
export function createTestContainer(): any {
  console.warn(
    "createTestContainer is deprecated. Use createTestLayer() instead. See test-layer.ts for migration guide.",
  );
  // InMemory adapters cache for consistency within a test
  const adapters = {
    auth: new InMemoryAuthAdapter(),
    realtime: new InMemoryRealtimeAdapter(),
    storage: new InMemoryStorageAdapter(),
    userRepo: new InMemoryUserRepository(),
  };

  // Return a minimal mock that provides the services via Effect
  return {
    register: () => {},
    resolve: (name: string) => {
      // Map old container names to InMemory adapters
      switch (name) {
        case "authPort":
        case PORT_TOKENS.AuthPort:
          return adapters.auth;
        case "realtimePort":
        case PORT_TOKENS.RealtimePort:
          return adapters.realtime;
        case "storagePort":
        case PORT_TOKENS.StoragePort:
          return adapters.storage;
        case "userRepository":
        case PORT_TOKENS.UserRepository:
          return adapters.userRepo;
        // Controllers - lazy loaded with repository injection
        case "userController":
          // Dynamic import to avoid circular dependency
          return { userRepository: adapters.userRepo };
        default:
          throw new Error(
            `Unknown service: ${name}. Use createTestLayer() with Layer.succeed instead.`,
          );
      }
    },
  };
}

/**
 * @deprecated Use createTestLayer() with config instead.
 */
export function createConfiguredTestContainer(
  configure: (container: any) => void,
): any {
  console.warn(
    "createConfiguredTestContainer is deprecated. Use createTestLayer() with overrides instead.",
  );
  const container = createTestContainer();
  configure(container);
  return container;
}

/**
 * @deprecated Use createTestLayer() instead.
 */
export function createTestContainerFromModule(_module: {
  providers: Record<string, any>;
  exports: string[];
}): any {
  console.warn(
    "createTestContainerFromModule is deprecated. Use createTestLayer() instead.",
  );
  return createTestContainer();
}

/**
 * @deprecated Use Layer.succeed pattern instead. See test-layer.ts for migration guide.
 */
export const PORT_TOKENS = {
  AuthPort: "authPort",
  RealtimePort: "realtimePort",
  StoragePort: "storagePort",
  TelemetryPort: "telemetryPort",
} as const;

/**
 * @deprecated Use createTestLayer() or Layer.succeed pattern instead
 */
export function createMockPortFactory<T>(mockImplementation: T): any {
  console.warn(
    "createMockPortFactory is deprecated. Use Layer.succeed(Tag, mockImplementation) instead.",
  );
  return { useValue: mockImplementation };
}

/**
 * @deprecated Use Layer.succeed pattern instead
 */
export function createMockFn<T>(returnValue?: T): any {
  console.warn(
    "createMockFn is deprecated. Use jest.spyOn or explicit mock functions instead.",
  );
  const calls: unknown[][] = [];

  const fn = (...args: unknown[]): T | undefined => {
    calls.push(args);
    return returnValue;
  };

  return Object.assign(fn, {
    calls,
    getCallCount: () => calls.length,
    getLastCall: () => calls[calls.length - 1],
    wasCalledWith: (...expectedArgs: unknown[]) =>
      calls.some((call) => expectedArgs.every((arg, i) => call[i] === arg)),
    reset: () => {
      calls.length = 0;
    },
  });
}

/**
 * @deprecated Import InMemoryAuthAdapter directly and instantiate it
 */
export function getInMemoryAuthAdapter(): InMemoryAuthAdapter {
  console.warn(
    "getInMemoryAuthAdapter is deprecated. Use new InMemoryAuthAdapter() instead.",
  );
  return new InMemoryAuthAdapter();
}

/**
 * @deprecated Import InMemoryRealtimeAdapter directly and instantiate it
 */
export function getInMemoryRealtimeAdapter(): InMemoryRealtimeAdapter {
  console.warn(
    "getInMemoryRealtimeAdapter is deprecated. Use new InMemoryRealtimeAdapter() instead.",
  );
  return new InMemoryRealtimeAdapter();
}

/**
 * @deprecated Import InMemoryStorageAdapter directly and instantiate it
 */
export function getInMemoryStorageAdapter(): InMemoryStorageAdapter {
  console.warn(
    "getInMemoryStorageAdapter is deprecated. Use new InMemoryStorageAdapter() instead.",
  );
  return new InMemoryStorageAdapter();
}

/**
 * @deprecated No longer needed with Effect Layer pattern
 */
export function clearInMemoryAdapters(): void {
  console.warn(
    "clearInMemoryAdapters is deprecated. Create fresh adapters for each test instead.",
  );
}
