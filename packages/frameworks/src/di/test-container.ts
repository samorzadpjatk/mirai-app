/**
 * Test Container Utility
 *
 * Provides isolated container instances for unit testing.
 * Uses awilix for lightweight, reflect-metadata-free dependency injection.
 *
 * ## Benefits over Inversify
 *
 * - No reflect-metadata import needed
 * - Faster container creation
 * - Simpler configuration
 *
 * ## Usage
 *
 * ```typescript
 * import { createTestContainer } from "@mirai-app/frameworks/di";
 * import { asClass } from "awilix";
 *
 * const container = createTestContainer();
 *
 * // Override with mock implementation
 * container.register({
 *   userRepository: asClass(InMemoryUserRepository).singleton(),
 * });
 *
 * // Resolve service with injected dependencies
 * const useCase = container.resolve("getUserUseCase");
 * ```
 *
 * @module test-container
 */

import {
  createContainer,
  asClass,
  asValue,
  type AwilixContainer,
} from "awilix";

/**
 * Create a test container with isolated scope
 *
 * Creates a new Awilix container with transient scope (new instance per resolution)
 * for isolated testing.
 *
 * @returns New isolated container
 *
 * @example
 * ```typescript
 * describe("MyUseCase", () => {
 *   let container: AwilixContainer;
 *
 *   beforeEach(() => {
 *     container = createTestContainer();
 *   });
 *
 *   it("should work with real dependencies", () => {
 *     const useCase = container.resolve("myUseCase");
 *     // ... test with auto-wired dependencies
 *   });
 *
 *   it("should work with mocked dependencies", () => {
 *     container.register({
 *       myRepository: asClass(MockRepository).singleton(),
 *     });
 *     const useCase = container.resolve("myUseCase");
 *     // ... test with mock
 *   });
 * });
 * ```
 */
export function createTestContainer(): AwilixContainer {
  return createContainer({
    injectionMode: "PROXY",
  });
}

/**
 * Create a test container with specific bindings
 *
 * Allows pre-binding services before module registration,
 * useful for overriding specific dependencies.
 *
 * @param configure - Function to configure container
 * @returns Configured container
 *
 * @example
 * ```typescript
 * const container = createConfiguredTestContainer((c) => {
 *   c.register({
 *     prisma: asValue(mockPrisma),
 *   });
 * });
 *
 * // All module-registered classes will use the bound PrismaClient
 * const repo = container.resolve("userRepository");
 * ```
 */
export function createConfiguredTestContainer(
  configure: (container: AwilixContainer) => void,
): AwilixContainer {
  const container = createContainer({
    injectionMode: "PROXY",
  });

  // Apply custom configuration first
  configure(container);

  return container;
}

/**
 * Create a test container from a module
 *
 * Useful for testing with actual module configurations.
 *
 * @param module - Static module to load
 * @returns Container with module providers registered
 *
 * @example
 * ```typescript
 * import { RepositoryModule } from "@mirai-app/adapters/modules/RepositoryModule";
 *
 * const container = createTestContainerFromModule(RepositoryModule);
 * const repo = container.resolve("userRepository");
 * ```
 */
export function createTestContainerFromModule(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  module: { providers: Record<string, any>; exports: string[] },
): AwilixContainer {
  const container = createTestContainer();

  // Register exported providers
  for (const exportKey of module.exports) {
    const provider = module.providers[exportKey];
    if (typeof provider === "function") {
      container.register(exportKey, asClass(provider).singleton());
    } else if (provider && typeof provider === "object") {
      if ("useValue" in provider) {
        container.register(exportKey, asValue(provider.useValue));
      } else if ("useClass" in provider) {
        container.register(exportKey, asClass(provider.useClass).singleton());
      }
    }
  }

  return container;
}
