/**
 * DI module exports for @mirai-app/frameworks
 *
 * Re-exports all dependency injection utilities from test-layer
 * for convenient access via @mirai-app/frameworks/di
 *
 * @module di
 */

export * from "./test-layer";

// =============================================================================
// Backward Compatibility Stubs (awilix migration)
// =============================================================================

/**
 * @deprecated Effect-based DI doesn't use containers. Use createTestLayer() instead.
 */
export const AppModule = {
  name: "AppModule",
  providers: {},
  exports: [],
};

/**
 * @deprecated Effect-based DI doesn't use container initialization. Use Layer.provide instead.
 */
export function initializeContainer(_modules: unknown[]): void {
  console.warn(
    "initializeContainer is deprecated. Effect-based DI uses Layer.provide instead.",
  );
}

/**
 * @deprecated Effect-based DI doesn't use getContainer. Use Layer-based wiring instead.
 */
export function getContainer(): unknown {
  console.warn(
    "getContainer is deprecated. Effect-based DI doesn't use global containers.",
  );
  return null;
}

/**
 * @deprecated Effect-based DI doesn't use container initialization checks.
 */
export function isContainerInitialized(): boolean {
  return true; // Effect DI is always "ready"
}
