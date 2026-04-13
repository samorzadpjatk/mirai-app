/**
 * Effect Layer Integration with awilix-modular DI Container
 *
 * Provides utilities to bridge awilix-modular DI container with Effect's
 * Context/Layer system for type-safe dependency injection.
 *
 * ## Architecture
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    FRAMEWORKS LAYER                         │
 * │  ┌─────────────────┐         ┌─────────────────────────────┐ │
 * │  │ Awilix Container│        │  Effect Layer System       │ │
 * │  │  - Modules      │───────>│  - Context.Tags            │ │
 * │  │  - Providers    │        │  - Layer composition       │ │
 * │  │  - Scoping      │        │  - Runtime creation        │ │
 * │  └─────────────────┘         └─────────────────────────────┘ │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Usage
 *
 * ### Creating a Layer from Container
 *
 * ```typescript
 * import { createContainerLayer, fromAwilix } from "@mirai-app/frameworks/di";
 *
 * // Create a Layer that wraps the entire container
 * const ContainerLayer = createContainerLayer(container);
 *
 * // Or create individual service Layers
 * const UserRepoLayer = fromAwilix<UserRepository>("userRepository");
 * ```
 *
 * ### Building Application Layer
 *
 * ```typescript
 * import { buildAppLayer } from "@mirai-app/frameworks/di";
 *
 * const AppLayer = buildAppLayer(container, [
 *   "userRepository",
 *   "authPort",
 *   "logger",
 * ]);
 *
 * // Use with Effect
 * const program = Effect.gen(function* () {
 *   const userRepo = yield* UserRepositoryTag;
 *   return yield* userRepo.findById("123");
 * });
 *
 * const result = await Effect.runPromise(
 *   Effect.provide(program, AppLayer)
 * );
 * ```
 *
 * @module effect-layer
 */

import { Context, Effect, Layer } from "effect";
import type { AwilixContainer } from "awilix";

// =============================================================================
// Container Access
// =============================================================================

let _awilixContainer: AwilixContainer<any> | null = null;

/**
 * Set the global awilix container for Effect integration
 *
 * @param container - The awilix container to use
 *
 * @example
 * ```typescript
 * const container = initializeContainer([AppModule]);
 * setAwilixContainer(container);
 * ```
 */
export function setAwilixContainer(container: AwilixContainer<any>): void {
  _awilixContainer = container;
}

/**
 * Get the global awilix container
 *
 * @throws Error if container hasn't been set
 *
 * @example
 * ```typescript
 * const container = getAwilixContainer();
 * const repo = container.resolve("userRepository");
 * ```
 */
export function getAwilixContainer(): AwilixContainer<any> {
  if (!_awilixContainer) {
    throw new Error(
      "Awilix container not set. Call setAwilixContainer() during initialization.",
    );
  }
  return _awilixContainer;
}

/**
 * Check if awilix container has been set
 *
 * @example
 * ```typescript
 * if (hasAwilixContainer()) {
 *   const container = getAwilixContainer();
 * }
 * ```
 */
export function hasAwilixContainer(): boolean {
  return _awilixContainer !== null;
}

/**
 * Reset the global awilix container (useful for testing)
 */
export function resetAwilixContainer(): void {
  _awilixContainer = null;
}

// =============================================================================
// Container Tag for Effect Context
// =============================================================================

/**
 * Context Tag for the Awilix Container itself
 *
 * Use this when you need access to the full container within Effects.
 */
export class AwilixContainerTag extends Context.Tag("AwilixContainer")<
  AwilixContainerTag,
  AwilixContainer<any>
>() {}

// =============================================================================
// Context Tags for Common Services (Examples)
// =============================================================================

/**
 * Database service Tag - example implementation
 *
 * Replace with your actual database interface
 */
export class DatabaseTag extends Context.Tag("Database")<
  DatabaseTag,
  { query: () => string }
>() {}

/**
 * User repository Tag - example implementation
 *
 * Replace with your actual UserRepository interface
 */
export class UserRepositoryTag extends Context.Tag("UserRepository")<
  UserRepositoryTag,
  { findById: (id: string) => Promise<{ id: string; name: string }> }
>() {}

// =============================================================================
// Layer Builders - Static Layers
// =============================================================================

/**
 * Create a Layer that provides the awilix container itself
 *
 * This is useful when you want to resolve services dynamically
 * within your Effects while still maintaining testability.
 *
 * @param container - The awilix container to provide
 * @returns Layer providing the container
 *
 * @example
 * ```typescript
 * const ContainerLayer = createContainerLayer(container);
 *
 * const program = Effect.gen(function* () {
 *   const container = yield* AwilixContainerTag;
 *   const repo = container.resolve("userRepository");
 *   return repo;
 * });
 *
 * const result = await Effect.runPromise(
 *   Effect.provide(program, ContainerLayer)
 * );
 * ```
 */
export function createContainerLayer(
  container: AwilixContainer<any>,
): Layer.Layer<AwilixContainerTag, never, never> {
  return Layer.succeed(AwilixContainerTag, container);
}

/**
 * Create a Layer that provides a database service
 *
 * Example implementation - replace with your actual database
 */
export function provideDatabase(): Layer.Layer<DatabaseTag, never, never> {
  return Layer.succeed(DatabaseTag, { query: () => "database-query" });
}

/**
 * Create a Layer that provides a user repository
 *
 * Example implementation - replace with your actual repository
 */
export function provideUserRepository(): Layer.Layer<
  UserRepositoryTag,
  never,
  never
> {
  return Layer.succeed(UserRepositoryTag, {
    findById: () => Promise.resolve({ id: "1", name: "Test" }),
  });
}

/**
 * Combine all static layers into one
 *
 * @returns Merged Layer with all static services
 */
export function provideAllLayers(): Layer.Layer<
  DatabaseTag | UserRepositoryTag,
  never,
  never
> {
  return Layer.mergeAll(provideDatabase(), provideUserRepository());
}

// =============================================================================
// Layer Builders - From Awilix Container
// =============================================================================

/**
 * Create a Layer from an awilix container registration
 *
 * Creates a Context.Tag and Layer that resolves the service from
 * the global awilix container when the Effect runs.
 *
 * @param token - The registration key in the awilix container
 * @returns Layer providing the service
 *
 * @example
 * ```typescript
 * // Create Layer from container registration
 * const UserRepoLayer = fromAwilix<UserRepository>("userRepository");
 *
 * // Use in Effect
 * const program = Effect.gen(function* () {
 *   const repo = yield* Context.Tag<UserRepository>("UserRepository");
 *   return yield* repo.findById("123");
 * });
 * ```
 */
export function fromAwilix<T>(token: string): Layer.Layer<T, never, never> {
  const Tag = Context.GenericTag<T>(token);
  return Layer.effect(
    Tag,
    Effect.sync(() => getAwilixContainer().resolve<T>(token)),
  );
}

/**
 * Create a Layer from an awilix container registration with custom Tag
 *
 * Allows you to specify your own Tag for better type safety.
 *
 * @param token - The registration key in the awilix container
 * @param tag - The Context.Tag to use for this service
 * @returns Layer providing the service
 *
 * @example
 * ```typescript
 * const UserRepositoryTag = Context.Tag("UserRepository")<
 *   UserRepositoryTag,
 *   UserRepository
 * >();
 *
 * const UserRepoLayer = fromAwilixWithTag(
 *   "userRepository",
 *   UserRepositoryTag
 * );
 * ```
 */
export function fromAwilixWithTag<T, I extends T>(
  token: string,
  tag: Context.Tag<T, I>,
): Layer.Layer<T, never, never> {
  return Layer.effect(
    tag,
    Effect.sync(() => getAwilixContainer().resolve<I>(token)),
  );
}

/**
 * Create a Layer that resolves a service directly from a container
 *
 * Unlike `fromAwilix`, this doesn't require the global container to be set.
 * It captures the container reference at Layer creation time.
 *
 * @param container - The awilix container
 * @param token - The registration key
 * @returns Layer providing the service
 */
export function fromContainer<T>(
  container: AwilixContainer<any>,
  token: string,
): Layer.Layer<T, never, never> {
  const Tag = Context.GenericTag<T>(token);
  return Layer.succeed(Tag, container.resolve<T>(token));
}

// =============================================================================
// App Layer Composition
// =============================================================================

/**
 * Build a complete App Layer from container and token list
 *
 * Creates a merged Layer that provides all services from the given tokens.
 * Each service is resolved from the container when the Effect runs.
 *
 * @param container - The awilix container
 * @param tokens - Array of registration keys to include in the Layer
 * @returns Merged Layer providing all services
 *
 * @example
 * ```typescript
 * const AppLayer = buildAppLayer(container, [
 *   "userRepository",
 *   "authPort",
 *   "logger",
 *   "config",
 * ]);
 *
 * // Use with any Effect that requires these services
 * const result = await Effect.runPromise(
 *   Effect.provide(program, AppLayer)
 * );
 * ```
 */
export function buildAppLayer(
  container: AwilixContainer<any>,
  tokens: string[],
): Layer.Layer<any, never, never> {
  if (tokens.length === 0) {
    return Layer.succeed(Context.GenericTag<unknown>("Empty"), {});
  }
  const layers = tokens.map((token) => fromContainer<any>(container, token));
  // Use type assertion to handle the dynamic array spread
  return (Layer as any).mergeAll(...layers);
}

/**
 * Build a Layer from the global awilix container
 *
 * Convenience function that uses the global container set via
 * `setAwilixContainer()`. Throws if container hasn't been set.
 *
 * @param tokens - Array of registration keys to include
 * @returns Merged Layer providing all services
 *
 * @example
 * ```typescript
 * setAwilixContainer(container);
 *
 * const AppLayer = buildAppLayerFromGlobal([
 *   "userRepository",
 *   "authPort",
 * ]);
 * ```
 */
export function buildAppLayerFromGlobal(
  tokens: string[],
): Layer.Layer<any, never, never> {
  return buildAppLayer(getAwilixContainer(), tokens);
}

// =============================================================================
// Service Tag Utilities
// =============================================================================

/**
 * Create a Context Tag and Layer pair for a service
 *
 * This is a convenience function that creates both the Tag and Layer
 * in one call for better ergonomics.
 *
 * @param token - The service identifier/name
 * @returns Object with tag and layer properties
 *
 * @example
 * ```typescript
 * const UserRepo = createServiceTag<UserRepository>("UserRepository");
 *
 * // Access the tag
 * const program = Effect.gen(function* () {
 *   const repo = yield* UserRepo.tag;
 *   return yield* repo.findById("123");
 * });
 *
 * // Create the layer from container
 * const UserRepoLayer = fromAwilixWithTag("userRepository", UserRepo.tag);
 * ```
 */
export function createServiceTag<T>(token: string) {
  const tag = Context.GenericTag<T>(token);
  return {
    tag,
    layer: (container: AwilixContainer<any>): Layer.Layer<T, never, never> =>
      Layer.succeed(tag, container.resolve<T>(token)),
  };
}

// =============================================================================
// Execution Utilities
// =============================================================================

/**
 * Run an Effect with the awilix container
 *
 * Sets up the container, builds an App Layer from the tokens,
 * and runs the Effect with that Layer.
 *
 * @param container - The awilix container
 * @param tokens - Service registration keys to include
 * @param program - The Effect to run
 * @returns Promise resolving to the Effect result
 *
 * @example
 * ```typescript
 * const result = await runWithAwilixContainer(
 *   container,
 *   ["userRepository", "authPort"],
 *   Effect.gen(function* () {
 *     const repo = getAwilixContainer().resolve<UserRepository>("userRepository");
 *     return yield* repo.findById("123");
 *   })
 * );
 * ```
 */
export async function runWithAwilixContainer<R, E, A>(
  container: AwilixContainer<any>,
  tokens: string[],
  program: Effect.Effect<A, E, R>,
): Promise<A> {
  setAwilixContainer(container);
  const appLayer = buildAppLayer(container, tokens);
  const runnable = Effect.provide(program, appLayer);
  return Effect.runPromise(runnable);
}

/**
 * Run an Effect with the global awilix container
 *
 * Convenience function that uses the global container.
 * Requires `setAwilixContainer()` to have been called first.
 *
 * @param tokens - Service registration keys
 * @param program - The Effect to run
 * @returns Promise resolving to the Effect result
 *
 * @example
 * ```typescript
 * setAwilixContainer(container);
 *
 * const result = await runWithGlobalContainer(
 *   ["userRepository"],
 *   Effect.sync(() => {
 *     const repo = getAwilixContainer().resolve<UserRepository>("userRepository");
 *     return repo.findById("123");
 *   })
 * );
 * ```
 */
export async function runWithGlobalContainer<R, E, A>(
  tokens: string[],
  program: Effect.Effect<A, E, R>,
): Promise<A> {
  const appLayer = buildAppLayerFromGlobal(tokens);
  const runnable = Effect.provide(program, appLayer);
  return Effect.runPromise(runnable);
}

// =============================================================================
// Layer Composition Utilities
// =============================================================================

/**
 * Create a Layer that provides multiple services from an awilix container
 *
 * This is a convenience function that creates a merged Layer from a map
 * of token names to Context Tags. Each service is resolved from the container
 * at Layer creation time.
 *
 * @param container - The awilix container
 * @param serviceMap - Object mapping token names to Context Tags
 * @returns Merged Layer providing all services
 *
 * @example
 * ```typescript
 * const UserRepoTag = Context.Tag("UserRepository")<UserRepositoryTag, UserRepository>();
 * const AuthTag = Context.Tag("AuthPort")<AuthPortTag, AuthPort>();
 *
 * const AppLayer = createServicesLayer(container, {
 *   userRepository: UserRepoTag,
 *   authPort: AuthTag,
 * });
 *
 * // Use in Effect
 * const program = Effect.gen(function* () {
 *   const userRepo = yield* UserRepoTag;
 *   const auth = yield* AuthTag;
 *   // ...
 * });
 * ```
 */
export function createServicesLayer<
  T extends Record<string, Context.Tag<any, any>>,
>(
  container: AwilixContainer<any>,
  serviceMap: T,
): Layer.Layer<
  {
    [K in keyof T]: T[K] extends Context.Tag<infer _, infer V> ? V : never;
  }[keyof T],
  never,
  never
> {
  const layers = Object.entries(serviceMap).map(([token, tag]) => {
    return Layer.succeed(tag, container.resolve(token));
  });

  if (layers.length === 0) {
    return Layer.succeed(Context.GenericTag<unknown>("Empty"), {} as any);
  }

  return (Layer as any).mergeAll(...layers);
}

/**
 * Create a Layer that provides services from the awilix cradle
 *
 * This function creates a Layer that captures the entire cradle and
 * provides individual services on demand. This is useful when you need
 * lazy resolution of services.
 *
 * @param container - The awilix container
 * @returns Layer providing access to the cradle
 *
 * @example
 * ```typescript
 * const CradleLayer = createCradleLayer(container);
 *
 * const program = Effect.gen(function* () {
 *   const cradle = yield* AwilixCradleTag;
 *   const userRepo = cradle.userRepository as UserRepository;
 *   return yield* userRepo.findById("123");
 * });
 * ```
 */
export function createCradleLayer(
  container: AwilixContainer<any>,
): Layer.Layer<AwilixContainerTag, never, never> {
  return Layer.succeed(AwilixContainerTag, container);
}

/**
 * Context Tag for accessing the awilix cradle
 *
 * Use this when you need to access multiple services from the cradle
 * without creating individual Layers for each service.
 */
export class AwilixCradleTag extends Context.Tag("AwilixCradle")<
  AwilixCradleTag,
  Record<string, unknown>
>() {}

/**
 * Build a Layer that resolves services lazily from the container
 *
 * Unlike `fromContainer` which resolves immediately, this creates a Layer
 * that resolves services when they are first accessed in the Effect.
 *
 * @param container - The awilix container
 * @param token - The registration key
 * @returns Layer providing lazy resolution
 *
 * @example
 * ```typescript
 * const LazyRepoLayer = createLazyLayer<UserRepository>(container, "userRepository");
 *
 * // Service is resolved only when yielded in Effect
 * const program = Effect.gen(function* () {
 *   const Tag = Context.Tag("UserRepository")<UserRepositoryTag, UserRepository>();
 *   const repo = yield* Tag;
 *   return yield* repo.findById("123");
 * });
 * ```
 */
export function createLazyLayer<T>(
  container: AwilixContainer<any>,
  token: string,
): Layer.Layer<T, never, never> {
  const Tag = Context.GenericTag<T>(token);
  return Layer.effect(
    Tag,
    Effect.sync(() => container.resolve<T>(token)),
  );
}

// =============================================================================
// Layer Composition Helpers
// =============================================================================

/**
 * Compose multiple layers with the container as the base
 *
 * This function creates a composed Layer where the container Layer
 * is provided first, and then additional layers are composed on top.
 *
 * @param container - The awilix container
 * @param additionalLayers - Additional layers to compose
 * @returns Composed Layer
 *
 * @example
 * ```typescript
 * const ConfigLayer = Layer.succeed(ConfigTag, { apiUrl: "..." });
 * const LoggerLayer = Layer.succeed(LoggerTag, { log: console.log });
 *
 * const ComposedLayer = composeWithContainer(container, [
 *   ConfigLayer,
 *   LoggerLayer,
 * ]);
 * ```
 */
export function composeWithContainer(
  container: AwilixContainer<any>,
  additionalLayers: Array<Layer.Layer<any, never, never>>,
): Layer.Layer<any, never, never> {
  const containerLayer = createContainerLayer(container);

  if (additionalLayers.length === 0) {
    return containerLayer;
  }

  const mergedAdditional = (Layer as any).mergeAll(...additionalLayers);
  return Layer.merge(containerLayer, mergedAdditional);
}

/**
 * Create a Layer that provides a service with transformation
 *
 * This allows you to transform a service from the container before
 * providing it to the Effect context.
 *
 * @param container - The awilix container
 * @param token - The registration key
 * @param transform - Function to transform the service
 * @returns Layer providing the transformed service
 *
 * @example
 * ```typescript
 * const TransformedRepoLayer = createTransformedLayer(
 *   container,
 *   "userRepository",
 *   (repo) => ({
 *     ...repo,
 *     findByIdOrFail: async (id: string) => {
 *       const user = await repo.findById(id);
 *       if (!user) throw new Error("User not found");
 *       return user;
 *     },
 *   })
 * );
 * ```
 */
export function createTransformedLayer<T, U>(
  container: AwilixContainer<any>,
  token: string,
  transform: (service: T) => U,
): Layer.Layer<U, never, never> {
  const Tag = Context.GenericTag<U>(token);
  return Layer.sync(Tag, () => {
    const service = container.resolve<T>(token);
    return transform(service);
  });
}

// =============================================================================
// Complete Application Layer Builder
// =============================================================================

/**
 * Options for building the application Layer
 */
export interface BuildAppLayerOptions {
  /** Additional static layers to merge */
  additionalLayers?: Array<Layer.Layer<any, never, never>>;

  /** Service transformations to apply */
  transformations?: Record<string, (service: unknown) => unknown>;

  /** Whether to include the container itself in the Layer */
  includeContainer?: boolean;
}

/**
 * Build a complete application Layer with all services
 *
 * This is the comprehensive Layer builder that:
 * 1. Creates Layers for all specified tokens
 * 2. Applies any transformations
 * 3. Merges additional static layers
 * 4. Optionally includes the container itself
 *
 * @param container - The awilix container
 * @param tokens - Service registration keys
 * @param options - Additional options for Layer building
 * @returns Complete application Layer
 *
 * @example
 * ```typescript
 * const AppLayer = buildCompleteAppLayer(
 *   container,
 *   ["userRepository", "authPort", "logger"],
 *   {
 *     additionalLayers: [ConfigLayer, MetricsLayer],
 *     includeContainer: true,
 *   }
 * );
 * ```
 */
export function buildCompleteAppLayer(
  container: AwilixContainer<any>,
  tokens: string[],
  options: BuildAppLayerOptions = {},
): Layer.Layer<any, never, never> {
  const {
    additionalLayers = [],
    transformations = {},
    includeContainer = false,
  } = options;

  // Create service Layers
  const serviceLayers = tokens.map((token) => {
    if (transformations[token]) {
      return createTransformedLayer(container, token, transformations[token]);
    }
    return fromContainer(container, token);
  });

  // Add container Layer if requested
  if (includeContainer) {
    serviceLayers.push(createContainerLayer(container));
  }

  // Merge all Layers
  const allLayers = [...serviceLayers, ...additionalLayers];

  if (allLayers.length === 0) {
    return Layer.succeed(Context.GenericTag<unknown>("Empty"), {});
  }

  return (Layer as any).mergeAll(...allLayers);
}

// =============================================================================
// Runtime Integration
// =============================================================================

/**
 * Initialize the global awilix container and build an application Layer
 *
 * This is a convenience function that sets up both the container and
 * creates a complete application Layer in one call.
 *
 * @param container - The awilix container
 * @param tokens - Service registration keys
 * @param options - Additional options for Layer building
 * @returns The built application Layer
 *
 * @example
 * ```typescript
 * const AppLayer = initializeAppLayer(container, [
 *   "userRepository",
 *   "authPort",
 * ]);
 *
 * // Use with Effect
 * const result = await Effect.runPromise(
 *   Effect.provide(program, AppLayer)
 * );
 * ```
 */
export function initializeAppLayer(
  container: AwilixContainer<any>,
  tokens: string[],
  options: BuildAppLayerOptions = {},
): Layer.Layer<any, never, never> {
  setAwilixContainer(container);
  return buildCompleteAppLayer(container, tokens, options);
}
