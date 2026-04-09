/**
 * Dependency Injection (DI) Module
 *
 * Centralized dependency injection infrastructure using InversifyJS.
 * Provides container configuration, service identifiers, and utilities
 * for Clean Architecture dependency management.
 *
 * ## Features
 *
 * - **Root Container**: Singleton-scoped container for shared services
 * - **Child Containers**: Request-scoped containers for isolation
 * - **Auto-Registration**: Automatic binding via @provide decorators
 * - **Test Support**: Isolated test containers for unit testing
 *
 * ## Quick Start
 *
 * ### Creating a Service with @provide
 *
 * ```typescript
 * import { provide } from "@inversifyjs/binding-decorators";
 * import { TYPES } from "@repo/frameworks/di";
 *
 * @provide(TYPES.MyService)
 * class MyService {
 *   doSomething() {
 *     return "done";
 *   }
 * }
 * ```
 *
 * ### Resolving Services
 *
 * ```typescript
 * import { container } from "@repo/frameworks/di";
 *
 * const myService = container.get<MyService>(TYPES.MyService);
 * ```
 *
 * ### Creating Request-Scoped Container
 *
 * ```typescript
 * import { createChildContainer } from "@repo/frameworks/di";
 *
 * const requestContainer = createChildContainer();
 * requestContainer.bind(TYPES.RequestId).toConstantValue(requestId);
 * ```
 *
 * @module @repo/frameworks/di
 */

// =============================================================================
// Core Container Exports
// =============================================================================

export {
  container,
  initializeContainer,
  createChildContainer,
  isContainerInitialized,
  resetContainer,
} from "./container";

// Test container utilities
export {
  createTestContainer,
  createConfiguredTestContainer,
} from "./test-container";

// =============================================================================
// Service Identifiers (TYPES)
// =============================================================================

/**
 * Service identifiers for dependency injection
 *
 * Use these symbols to identify services when binding and injecting.
 * All identifiers use Symbol.for() for cross-realm compatibility.
 *
 * @example
 * ```typescript
 * import { TYPES } from "@repo/frameworks/di";
 * import { provide } from "@inversifyjs/binding-decorators";
 *
 * @provide(TYPES.UserRepository)
 * class PrismaUserRepository implements UserRepository {
 *   // ...
 * }
 * ```
 */
export { TYPES } from "./types";
export type { ServiceIdentifier, ServiceIdentifierValue } from "./types";
