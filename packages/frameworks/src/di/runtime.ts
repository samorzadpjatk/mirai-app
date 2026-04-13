/**
 * Effect Runtime Configuration
 *
 * Provides unified Effect runtime setup with layer composition.
 * The runtime is built once at startup and used throughout the application.
 *
 * ## Architecture
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    RUNTIME SETUP                            │
 * │                                                              │
 * │  Layer.mergeAll(                                           │
 * │    RepositoryLayer,                                        │
 * │    ServiceLayer,                                           │
 * │    ConfigLayer                                             │
 * │  ) ────> Layer.toRuntime ────> Runtime<AppRequirements>   │
 * │                                                              │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Usage
 *
 * ### Creating a Runtime from Layers
 *
 * ```typescript
 * import { initializeRuntime, createRuntimeFromLayer } from "@mirai-app/frameworks/di";
 * import { AppLayer } from "./layers";
 *
 * // Option 1: Simple initialization
 * initializeRuntime(AppLayer);
 *
 * // Option 2: Create custom runtime
 * const runtime = await createRuntimeFromLayer(AppLayer);
 * ```
 *
 * ### Running Effects
 *
 * ```typescript
 * import { runEffect, runEffectWithRuntime } from "@mirai-app/frameworks/di";
 *
 * // Run with default runtime
 * const result = await runEffect(program);
 *
 * // Run with custom runtime
 * const result = await runEffectWithRuntime(program, runtime);
 * ```
 *
 * @module runtime
 */

import { Context, Effect, Layer, Runtime } from "effect";

// =============================================================================
// Runtime State
// =============================================================================

let _runtime: Runtime.Runtime<never> | null = null;
let _appLayer: Layer.Layer<never, never, never> | null = null;

// =============================================================================
// Runtime Initialization
// =============================================================================

/**
 * Initialize the Effect runtime with a layer
 *
 * This sets up the global runtime that will be used by default
 * when running Effects throughout the application. The layer
 * is stored for later use in `runEffectWith` and similar functions.
 *
 * Note: This uses Effect's default runtime. For a custom runtime
 * built from layers, use `createRuntimeFromLayer()` instead.
 *
 * @param layer - The base layer to store for later use
 * @returns The default Runtime
 *
 * @example
 * ```typescript
 * import { initializeRuntime } from "@mirai-app/frameworks/di";
 * import { AppLayer } from "./layers";
 *
 * const runtime = initializeRuntime(AppLayer);
 * ```
 */
export function initializeRuntime(
  layer: Layer.Layer<never, never, never>,
): Runtime.Runtime<never> {
  _appLayer = layer;
  _runtime = Runtime.defaultRuntime;
  return _runtime;
}

/**
 * Create a Runtime from a Layer
 *
 * This builds a custom Runtime from the provided Layer using
 * `Layer.toRuntime`. The resulting Runtime includes all services
 * from the Layer in its context.
 *
 * Note: This function is for advanced use cases. Most applications
 * should use `initializeRuntime()` and `runEffectWith()` instead.
 *
 * @param layer - The Layer to build the runtime from
 * @returns Effect that produces the Runtime when run
 *
 * @example
 * ```typescript
 * import { createRuntimeFromLayer } from "@mirai-app/frameworks/di";
 * import { AppLayer } from "./layers";
 *
 * const runtimeEffect = createRuntimeFromLayer(AppLayer);
 * const runtime = await Effect.runPromise(runtimeEffect);
 *
 * // Now you can use this runtime to run Effects
 * const result = await Runtime.runPromise(runtime)(program);
 * ```
 */
export function createRuntimeFromLayer<R>(
  layer: Layer.Layer<R, never, never>,
): Effect.Effect<Runtime.Runtime<R>, never, never> {
  // Use Effect.scoped to handle the Scope requirement
  return Effect.scoped(Layer.toRuntime(layer));
}

/**
 * Get the initialized runtime
 *
 * @throws Error if runtime hasn't been initialized via `initializeRuntime()`
 *
 * @example
 * ```typescript
 * const runtime = getRuntime();
 * ```
 */
export function getRuntime(): Runtime.Runtime<never> {
  if (!_runtime) {
    throw new Error(
      "Runtime not initialized. Call initializeRuntime() during app startup.",
    );
  }
  return _runtime;
}

/**
 * Get the application layer set during initialization
 *
 * @returns The Layer passed to `initializeRuntime()`, or null if not initialized
 *
 * @example
 * ```typescript
 * const appLayer = getAppLayer();
 * if (appLayer) {
 *   // Use the layer for additional Effect provisioning
 * }
 * ```
 */
export function getAppLayer(): Layer.Layer<never, never, never> | null {
  return _appLayer;
}

/**
 * Check if runtime has been initialized
 *
 * @example
 * ```typescript
 * if (isRuntimeInitialized()) {
 *   const runtime = getRuntime();
 * }
 * ```
 */
export function isRuntimeInitialized(): boolean {
  return _runtime !== null;
}

/**
 * Reset the runtime (useful for testing)
 *
 * Clears both the stored runtime and application layer.
 * Requires re-initialization before next use.
 */
export function resetRuntime(): void {
  _runtime = null;
  _appLayer = null;
}

// =============================================================================
// Effect Execution
// =============================================================================

/**
 * Run an Effect with the default runtime
 *
 * This is the simplest way to execute Effects that don't require
 * any special context or dependencies.
 *
 * @param effect - The Effect to run
 * @returns Promise resolving to the Effect's success value
 *
 * @example
 * ```typescript
 * import { runEffect } from "@mirai-app/frameworks/di";
 *
 * const result = await runEffect(
 *   Effect.sync(() => computeSomething())
 * );
 * ```
 */
export function runEffect<A>(
  effect: Effect.Effect<A, never, never>,
): Promise<A> {
  return Effect.runPromise(effect);
}

/**
 * Run an Effect that may fail
 *
 * Similar to `runEffect` but allows Effects that can fail.
 * Returns a Promise that may reject if the Effect fails.
 *
 * @param effect - The Effect to run
 * @returns Promise resolving to the Effect's success value or rejecting with error
 *
 * @example
 * ```typescript
 * const result = await runEffectExit(
 *   Effect.gen(function* () {
 *     const user = yield* getUser(id);
 *     if (!user) {
 *       return yield* Effect.fail(new Error("User not found"));
 *     }
 *     return user;
 *   })
 * );
 * ```
 */
export function runEffectExit<A, E>(
  effect: Effect.Effect<A, E, never>,
): Promise<A> {
  return Effect.runPromise(effect);
}

/**
 * Run an Effect synchronously
 *
 * Only use this for pure, side-effect-free Effects.
 * Will throw if the Effect contains async operations.
 *
 * @param effect - The synchronous Effect to run
 * @returns The Effect's success value
 *
 * @example
 * ```typescript
 * const result = runEffectSync(
 *   Effect.sync(() => 42)
 * );
 * // result === 42
 * ```
 */
export function runEffectSync<A>(effect: Effect.Effect<A, never, never>): A {
  return Effect.runSync(effect);
}

/**
 * Run an Effect with the initialized application layer
 *
 * This is the primary way to execute Effects that depend on
 * services from the awilix container. Requires `initializeRuntime()`
 * to have been called first.
 *
 * @param effect - The Effect to run
 * @returns Promise resolving to the Effect's success value
 *
 * @example
 * ```typescript
 * import { initializeRuntime, runEffectWith } from "@mirai-app/frameworks/di";
 * import { AppLayer } from "./layers";
 *
 * initializeRuntime(AppLayer);
 *
 * const result = await runEffectWith(
 *   Effect.gen(function* () {
 *     const userRepo = yield* UserRepositoryTag;
 *     return yield* userRepo.findById("123");
 *   })
 * );
 * ```
 */
export function runEffectWith<A>(
  effect: Effect.Effect<A, never, never>,
): Promise<A> {
  if (!_appLayer) {
    throw new Error(
      "Runtime not initialized. Call initializeRuntime() during app startup.",
    );
  }
  const runnable = Effect.provide(effect, _appLayer);
  return Effect.runPromise(runnable);
}

/**
 * Run an Effect with a specific layer
 *
 * Use this when you need to provide a custom layer context
 * for a specific Effect, bypassing the global application layer.
 *
 * @param effect - The Effect to run
 * @param layer - Layer to provide to the Effect
 * @returns Promise resolving to the Effect's success value
 *
 * @example
 * ```typescript
 * const result = await runEffectWithLayer(
 *   program,
 *   Layer.mergeAll(TestRepoLayer, MockLoggerLayer)
 * );
 * ```
 */
export function runEffectWithLayer<A>(
  effect: Effect.Effect<A, never, never>,
  layer: Layer.Layer<never, never, never>,
): Promise<A> {
  const runnable = Effect.provide(effect, layer);
  return Effect.runPromise(runnable);
}

/**
 * Run an Effect with a specific runtime
 *
 * Use this when you have a custom runtime created with
 * `createRuntimeFromLayer()`.
 *
 * @param effect - The Effect to run
 * @param runtime - The Runtime to use
 * @returns Promise resolving to the Effect's success value
 *
 * @example
 * ```typescript
 * const runtimeEffect = createRuntimeFromLayer(CustomLayer);
 * const customRuntime = await Effect.runPromise(runtimeEffect);
 * const result = await runEffectWithRuntime(program, customRuntime);
 * ```
 */
export function runEffectWithRuntime<A, R>(
  effect: Effect.Effect<A, never, never>,
  runtime: Runtime.Runtime<R>,
): Promise<A> {
  return Runtime.runPromise(runtime)(effect);
}

// =============================================================================
// Layer Composition Helpers
// =============================================================================

/**
 * Merge multiple layers into one
 *
 * Combines multiple Layers into a single Layer that provides
 * all services from each individual Layer.
 *
 * @param layers - Layers to merge
 * @returns Merged Layer providing all services
 *
 * @example
 * ```typescript
 * const AppLayer = mergeLayers(
 *   DatabaseLayer,
 *   RepositoryLayer,
 *   ServiceLayer,
 *   ConfigLayer
 * );
 * ```
 */
export function mergeLayers<R1, R2>(
  layer1: Layer.Layer<R1, never, never>,
  layer2: Layer.Layer<R2, never, never>,
): Layer.Layer<R1 | R2, never, never> {
  return Layer.mergeAll(layer1, layer2);
}

/**
 * Merge an array of layers into one
 *
 * Convenience function for merging a dynamic array of Layers.
 *
 * @param layers - Array of Layers to merge
 * @returns Merged Layer providing all services
 *
 * @example
 * ```typescript
 * const layerArray = [RepoLayer, ServiceLayer, LoggerLayer];
 * const AppLayer = mergeLayerArray(layerArray);
 * ```
 */
export function mergeLayerArray<R>(
  layers: Array<Layer.Layer<R, never, never>>,
): Layer.Layer<R, never, never> {
  if (layers.length === 0) {
    return Layer.succeed(Context.GenericTag<R>("Empty"), {} as R);
  }
  // Use type assertion to handle the dynamic array spread
  return (Layer as any).mergeAll(...layers);
}

/**
 * Compose layers sequentially
 *
 * Creates a Layer where the output of one Layer becomes the
 * context for the next. Useful when layers have dependencies.
 *
 * @param layers - Layers to compose (in order)
 * @returns Composed Layer
 */
export function composeLayers<R>(
  ...layers: Array<Layer.Layer<R, never, R>>
): Layer.Layer<R, never, R> {
  return layers.reduce((acc, layer) => Layer.provide(layer, acc));
}

// =============================================================================
// Layer to Runtime Conversion
// =============================================================================

/**
 * Build a Runtime from a Layer
 *
 * Converts a Layer to a Runtime using `Layer.toRuntime`.
 * This is an alias for `createRuntimeFromLayer` for naming consistency.
 *
 * @param layer - The Layer to convert
 * @returns Effect that produces the Runtime when run
 *
 * @example
 * ```typescript
 * const runtimeEffect = buildRuntimeFromLayer(AppLayer);
 * const runtime = await Effect.runPromise(runtimeEffect);
 * ```
 */
export function buildRuntimeFromLayer<R>(
  layer: Layer.Layer<R, never, never>,
): Effect.Effect<Runtime.Runtime<R>, never, never> {
  return createRuntimeFromLayer(layer);
}
