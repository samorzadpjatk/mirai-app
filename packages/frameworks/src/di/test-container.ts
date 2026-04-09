/**
 * Test Container Utility
 *
 * Provides isolated container instances for unit testing.
 * Pre-configured with buildProviderModule() for auto-registration
 * of @provide decorated classes.
 *
 * ## Usage
 *
 * ```typescript
 * import { createTestContainer } from "@repo/frameworks/di";
 * import { TYPES } from "@repo/frameworks/di";
 *
 * const container = createTestContainer();
 *
 * // Override with mock implementation
 * container.rebind(TYPES.UserRepository).to(InMemoryUserRepository);
 *
 * // Resolve service with injected dependencies
 * const useCase = container.get(TYPES.GetUserUseCase);
 * ```
 *
 * @module test-container
 */

import "reflect-metadata";
import { Container } from "inversify";
import { buildProviderModule } from "@inversifyjs/binding-decorators";

/**
 * Create a test container with isolated scope
 *
 * Creates a new Container with Transient scope (new instance per resolution)
 * and pre-loads all @provide decorated classes via buildProviderModule().
 *
 * @returns New isolated container with provider module loaded
 *
 * @example
 * ```typescript
 * describe("MyUseCase", () => {
 *   let container: Container;
 *
 *   beforeEach(() => {
 *     container = createTestContainer();
 *   });
 *
 *   it("should work with real dependencies", () => {
 *     const useCase = container.get(TYPES.MyUseCase);
 *     // ... test with auto-wired dependencies
 *   });
 *
 *   it("should work with mocked dependencies", () => {
 *     container.rebind(TYPES.MyRepository).to(MockRepository);
 *     const useCase = container.get(TYPES.MyUseCase);
 *     // ... test with mock
 *   });
 * });
 * ```
 */
export function createTestContainer(): Container {
  const container = new Container({
    defaultScope: "Transient",
  });

  // Load all @provide decorated providers
  container.load(buildProviderModule());

  return container;
}

/**
 * Create a test container with specific bindings
 *
 * Allows pre-binding services before provider module loads,
 * useful for overriding specific dependencies.
 *
 * @param configure - Function to configure container before loading provider module
 * @returns Configured container with provider module loaded
 *
 * @example
 * ```typescript
 * const container = createConfiguredTestContainer((container) => {
 *   container.bind(TYPES.PrismaClient).toConstantValue(mockPrisma);
 * });
 *
 * // All @provide decorated classes will use the bound PrismaClient
 * const repo = container.get(TYPES.UserRepository);
 * ```
 */
export function createConfiguredTestContainer(
  configure: (container: Container) => void,
): Container {
  const container = new Container({
    defaultScope: "Transient",
  });

  // Apply custom configuration first
  configure(container);

  // Then load provider module (custom bindings take precedence)
  container.load(buildProviderModule());

  return container;
}
