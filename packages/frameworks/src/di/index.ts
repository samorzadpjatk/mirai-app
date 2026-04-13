/**
 * Dependency Injection (DI) Module
 *
 * Centralized dependency injection infrastructure using awilix-modular.
 * Provides container configuration, service identifiers, and utilities
 * for Clean Architecture dependency management.
 *
 * ## Features
 *
 * - **Root Container**: Singleton-scoped container for shared services
 * - **Scoped Containers**: Request-scoped containers for isolation
 * - **Module System**: Organize dependencies with createStaticModule/createDynamicModule
 * - **Test Support**: Isolated test containers for unit testing
 * - **No Decorators Needed**: Works without experimentalDecorators or reflect-metadata
 *
 * ## Quick Start
 *
 * ### Creating a Module
 *
 * ```typescript
 * import { createStaticModule } from "@mirai-app/frameworks/di";
 *
 * export const MyModule = createStaticModule({
 *   name: "MyModule",
 *   providers: {
 *     myService: MyService,
 *   },
 *   exports: ["myService"],
 * });
 * ```
 *
 * ### Initializing the Container
 *
 * ```typescript
 * import { initializeContainer } from "@mirai-app/frameworks/di";
 * import { MyModule } from "./MyModule";
 *
 * const container = initializeContainer([MyModule]);
 * ```
 *
 * ### Resolving Services
 *
 * ```typescript
 * import { container } from "@mirai-app/frameworks/di";
 *
 * const myService = container.resolve("myService");
 * ```
 *
 * ### Creating Request-Scoped Container
 *
 * ```typescript
 * import { createRequestScope } from "@mirai-app/frameworks/di";
 *
 * const scope = createRequestScope({
 *   prisma: db,
 *   requestId: "req-123",
 * });
 *
 * const controller = scope.container.resolve("userController");
 * ```
 *
 * @module @mirai-app/frameworks/di
 */

// =============================================================================
// Core Container Exports
// =============================================================================

export {
  /** Root container - throws if not initialized */
  container,
  /** Initialize container with modules */
  initializeContainer,
  /** Get the root container - throws if not initialized */
  getContainer,
  /** Create child container for request scoping */
  createChildContainer,
  /** Check if container is initialized */
  isContainerInitialized,
  /** Reset container state */
  resetContainer,
  /** Create a static module */
  createStaticModule,
  /** Create a dynamic module factory */
  createDynamicModule,
  /** Register class-based providers */
  asClass,
  /** Register value-based providers */
  asValue,
  /** Lifetime configuration helper */
  Lifetime,
} from "./container";

// =============================================================================
// Request Scoping Exports
// =============================================================================

export {
  /** Create a request-scoped container */
  createRequestScope,
  /** Execute function within a request scope */
  withRequestScope,
  /** Check if container is scoped */
  isScopedContainer,
  /** Get parent container */
  getParentContainer,
  /** Request scope configuration type */
  type RequestScopeConfig,
  /** Request scope type */
  type RequestScope,
} from "./scope";

// =============================================================================
// Test Container Utilities
// =============================================================================

export {
  /** Create isolated test container */
  createTestContainer,
  /** Create configured test container (for backward compatibility) */
  createConfiguredTestContainer,
  /** Create test container from a module */
  createTestContainerFromModule,
  /** Create mock port factory for DI registration */
  createMockPortFactory,
  /** Create mock function with call tracking */
  createMockFn,
  /** Mock function type */
  type MockFn,
  /** Port injection tokens for test containers */
  PORT_TOKENS,
} from "./test-container";

// =============================================================================
// Test Fixtures
// =============================================================================

export {
  /** Create test UserId (branded type) */
  createTestUserId,
  /** Create multiple test UserIds */
  createTestUserIds,
  /** Create test UserRole */
  createTestUserRole,
  /** Pre-defined test roles */
  TestRoles,
  /** Test auth context type */
  type TestAuthContext,
  /** Create test auth context */
  createTestAuthContext,
  /** Pre-defined auth contexts (user, moderator, admin, service) */
  TestAuthContexts,
  /** Create mock AuthPort for testing */
  createMockAuthPort,
  /** Create mock TelemetryPort for testing */
  createMockTelemetryPort,
} from "./test-fixtures";

// =============================================================================
// Service Identifiers (TYPES)
// =============================================================================

/**
 * Service identifiers for dependency injection
 *
 * Use these symbols to identify services when binding and injecting.
 * All identifiers use Symbol.for() for cross-realm compatibility.
 *
 * Note: With awilix-modular, you typically resolve by class or string key
 * rather than symbols, but TYPES is provided for backward compatibility
 * and explicit service identification.
 *
 * @example
 * ```typescript
 * import { TYPES } from "@mirai-app/frameworks/di";
 *
 * // With awilix-modular, prefer class-based resolution:
 * const userRepo = container.resolve("userRepository");
 *
 * // Or use TYPES for explicit identification:
 * const userRepo = container.resolve(TYPES.UserRepository.description);
 * ```
 */
export { TYPES } from "./types";

/**
 * Type helpers for service identifiers
 */
export type { ServiceIdentifier, ServiceIdentifierValue } from "./types";

// =============================================================================
// Type Re-exports from awilix
// =============================================================================

export type {
  /** Awilix container type */
  AwilixContainer,
  /** Static module type from awilix-modular */
  StaticModule,
} from "./container";

// =============================================================================
// Root Module Exports
// =============================================================================

export {
  /** Root application module - composes all sub-modules */
  AppModule,
  /** Check if a module is registered in AppModule */
  hasModule,
  /** Get all registered module names */
  getRegisteredModules,
  /** Get detailed module registration status */
  getModuleStatus,
  /** AppModule definition type */
  type AppModuleDef,
  /** Module dependencies type for constructor injection */
  type ModuleDeps,
  /** Repository module definition type */
  type RepositoryModuleDef,
  /** Use case module definition type */
  type UseCaseModuleDef,
  /** Controller module definition type */
  type ControllerModuleDef,
  /** Initialize Effect Layer from AppModule */
  initializeAppLayer,
} from "./AppModule";

// =============================================================================
// Effect Runtime Exports
// =============================================================================

export {
  // Runtime Management
  /** Initialize the Effect runtime with a layer */
  initializeRuntime,
  /** Create a Runtime from a Layer */
  createRuntimeFromLayer,
  /** Get the initialized runtime */
  getRuntime,
  /** Get the application layer set during initialization */
  getAppLayer,
  /** Check if runtime is initialized */
  isRuntimeInitialized,
  /** Reset the runtime (for testing) */
  resetRuntime,
  // Effect Execution
  /** Run an Effect with the default runtime */
  runEffect,
  /** Run an Effect that may fail */
  runEffectExit,
  /** Run an Effect synchronously */
  runEffectSync,
  /** Run an Effect with the initialized application layer */
  runEffectWith,
  /** Run an Effect with a specific layer */
  runEffectWithLayer,
  /** Run an Effect with a custom runtime */
  runEffectWithRuntime,
  // Layer Composition
  /** Merge two layers into one */
  mergeLayers,
  /** Merge an array of layers into one */
  mergeLayerArray,
  /** Compose layers sequentially */
  composeLayers,
  /** Build a Runtime from a Layer (alias) */
  buildRuntimeFromLayer,
} from "./runtime";

// =============================================================================
// Effect Layer Integration Exports
// =============================================================================

export {
  // Container Management
  /** Set the global awilix container for Effect integration */
  setAwilixContainer,
  /** Get the global awilix container */
  getAwilixContainer,
  /** Check if awilix container has been set */
  hasAwilixContainer,
  /** Reset the global awilix container (for testing) */
  resetAwilixContainer,
  // Context Tags
  /** Context Tag for the Awilix Container itself */
  AwilixContainerTag,
  /** Context Tag for accessing the awilix cradle */
  AwilixCradleTag,
  /** Database service Tag (example) */
  DatabaseTag,
  /** User repository Tag (example) */
  UserRepositoryTag,
  // Layer Builders - Static
  /** Create a Layer that provides the awilix container */
  createContainerLayer,
  /** Create a Layer that provides a database service (example) */
  provideDatabase,
  /** Create a Layer that provides a user repository (example) */
  provideUserRepository,
  /** Combine all static layers into one */
  provideAllLayers,
  // Layer Builders - From Awilix
  /** Create a Layer from an awilix container registration */
  fromAwilix,
  /** Create a Layer from an awilix registration with custom Tag */
  fromAwilixWithTag,
  /** Create a Layer that resolves a service directly from a container */
  fromContainer,
  // Layer Composition
  /** Create a Layer providing multiple services from a map */
  createServicesLayer,
  /** Create a Layer that provides the awilix cradle */
  createCradleLayer,
  /** Create a Layer with lazy service resolution */
  createLazyLayer,
  /** Compose layers with container as base */
  composeWithContainer,
  /** Create a Layer with service transformation */
  createTransformedLayer,
  /** Build complete application Layer with options */
  buildCompleteAppLayer,
  /** Initialize app Layer with all services */
  initializeAppLayer as initializeEffectAppLayer,
  // App Layer Composition
  /** Build a complete App Layer from container and token list */
  buildAppLayer,
  /** Build a Layer from the global awilix container */
  buildAppLayerFromGlobal,
  // Service Tag Utilities
  /** Create a Context Tag and Layer pair for a service */
  createServiceTag,
  // Execution Utilities
  /** Run an Effect with the awilix container */
  runWithAwilixContainer,
  /** Run an Effect with the global awilix container */
  runWithGlobalContainer,
  // Types
  /** Options for building application Layer */
  type BuildAppLayerOptions,
} from "./effect-layer";
