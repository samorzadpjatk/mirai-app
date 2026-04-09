/**
 * DI Container Configuration
 *
 * Central awilix-modular container for dependency injection across the application.
 * Uses modular organization with createStaticModule and createDynamicModule for
 * clean separation of concerns.
 *
 * ## Architecture
 *
 * The container hierarchy supports:
 * - Root container: Shared singletons (database, external clients)
 * - Scoped containers: Request-scoped dependencies
 *
 * ## Benefits over Inversify
 *
 * - No experimentalDecorators or emitDecoratorMetadata needed
 * - No reflect-metadata dependency required
 * - Automatic type inference - no manual service identifiers needed
 * - Module-based organization similar to NestJS
 *
 * ## Usage
 *
 * ```typescript
 * import { container, createChildContainer } from "@mirai-app/frameworks/di";
 *
 * // Get service from root container
 * const service = container.resolve("myService");
 *
 * // Create request-scoped child container
 * const requestContainer = createChildContainer();
 * requestContainer.register({ requestId: asValue(requestId) });
 * ```
 */

import {
  createContainer,
  type AwilixContainer,
  asClass,
  asValue,
  asFunction,
  Lifetime,
} from "awilix";
import {
  createStaticModule,
  createDynamicModule,
  type StaticModule,
} from "awilix-modular";

// =============================================================================
// Container Creation
// =============================================================================

/**
 * Root Awilix container
 *
 * Configured as the base container for the application.
 * Modules are registered here to provide shared singletons.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let rootContainer: AwilixContainer<any> | null = null;

// =============================================================================
// Container Initialization
// =============================================================================

/**
 * Initialize the container with modules
 *
 * This creates the root container and loads all registered modules.
 * Must be called before resolving any dependencies.
 *
 * @param modules - Array of static modules to load
 * @returns The initialized container
 *
 * @example
 * ```typescript
 * import { initializeContainer } from "@mirai-app/frameworks/di";
 * import { RepositoryModule } from "@mirai-app/adapters/modules/RepositoryModule";
 * import { ControllerModule } from "@mirai-app/adapters/modules/ControllerModule";
 *
 * const container = initializeContainer([RepositoryModule, ControllerModule]);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeContainer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modules: Array<StaticModule<any>> = [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): AwilixContainer<any> {
  rootContainer = createContainer({
    injectionMode: "PROXY",
  });

  // Register all module providers with the container
  for (const mod of modules) {
    registerModule(rootContainer, mod);
  }

  return rootContainer;
}

/**
 * Register a module's providers with the container
 *
 * @param container - Target container
 * @param module - Module to register
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function registerModule(
  container: AwilixContainer,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mod: StaticModule<any>,
): void {
  const providers = mod.providers;

  // Guard against undefined providers (empty module placeholders)
  if (!providers) {
    return;
  }

  // Register all providers
  for (const [key, provider] of Object.entries(providers)) {
    if (typeof provider === "function") {
      // Class provider - register as singleton by default
      container.register(
        key,
        asClass(provider as new (...args: unknown[]) => unknown).singleton(),
      );
    } else if (provider && typeof provider === "object") {
      // Object provider configuration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = provider as any;

      if ("useValue" in config) {
        container.register(key, asValue(config.useValue));
      } else if (
        "useClass" in config &&
        typeof config.useClass === "function"
      ) {
        container.register(key, asClass(config.useClass).singleton());
      } else if (
        "useFactory" in config &&
        typeof config.useFactory === "function"
      ) {
        // Factory with dependency injection
        // Use asFunction for lazy evaluation with access to container cradle
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        container.register(key, (cradle: any) => config.useFactory(cradle));
      }
    }
  }
}

// =============================================================================
// Container Access
// =============================================================================

/**
 * Get the root container
 *
 * Throws if container hasn't been initialized.
 *
 * @returns The root AwilixContainer
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getContainer(): AwilixContainer<any> {
  if (!rootContainer) {
    throw new Error(
      "Container not initialized. Call initializeContainer() first.",
    );
  }
  return rootContainer;
}

/**
 * Exported container reference
 *
 * Note: Accessing this before initialization will throw.
 * Use getContainer() or initializeContainer() for safe access.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const container: AwilixContainer<any> = new Proxy(
  {} as AwilixContainer,
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(_: unknown, prop: keyof AwilixContainer) {
      if (!rootContainer) {
        throw new Error(
          "Container not initialized. Call initializeContainer() first.",
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (rootContainer as any)[prop];
      return typeof value === "function" ? value.bind(rootContainer) : value;
    },
  },
);

// =============================================================================
// Child Container Creation
// =============================================================================

/**
 * Create a child container for request scoping
 *
 * Child containers inherit registrations from parent but can override
 * with request-specific values (e.g., request IDs, user context, PrismaClient).
 *
 * @param parent - Parent container (defaults to root container)
 * @returns New scoped container
 *
 * @example
 * ```typescript
 * const requestContainer = createChildContainer();
 * requestContainer.register({
 *   prisma: asValue(prisma),
 *   requestId: asValue(requestId),
 * });
 * const controller = requestContainer.resolve("userController");
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createChildContainer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parent: AwilixContainer<any> = getContainer(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): AwilixContainer<any> {
  return parent.createScope();
}

/**
 * Create a test container with isolated scope
 *
 * Useful for unit tests to avoid polluting the root container.
 *
 * @returns New isolated container
 *
 * @example
 * ```typescript
 * const testContainer = createTestContainer();
 * testContainer.register({
 *   userRepository: asClass(InMemoryUserRepository).singleton(),
 * });
 * const useCase = testContainer.resolve("getUserUseCase");
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createTestContainer(): AwilixContainer<any> {
  const testContainer = createContainer({
    injectionMode: "PROXY",
  });
  return testContainer;
}

// =============================================================================
// Container State Management
// =============================================================================

/**
 * Check if container has been initialized
 *
 * @returns True if initializeContainer has been called
 */
export function isContainerInitialized(): boolean {
  return rootContainer !== null;
}

/**
 * Reset the container (useful for testing)
 *
 * Clears the root container and DI context.
 * Requires re-initialization before next use.
 */
export function resetContainer(): void {
  rootContainer = null;
}

// =============================================================================
// Module Helpers
// =============================================================================

/**
 * Re-export createStaticModule for module creation
 *
 * @example
 * ```typescript
 * export const RepositoryModule = createStaticModule({
 *   name: "RepositoryModule",
 *   providers: {
 *     userRepository: PrismaUserRepository,
 *   },
 *   exports: ["userRepository"],
 * });
 * ```
 */
export { createStaticModule, createDynamicModule };

/**
 * Export awilix lifetime helpers
 */
export { asClass, asValue, Lifetime };

// =============================================================================
// Type Exports
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type { AwilixContainer, StaticModule };
