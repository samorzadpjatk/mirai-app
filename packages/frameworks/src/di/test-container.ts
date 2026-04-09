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
 * ## Mock Factory Pattern for Ports
 *
 * Use `createMockPortFactory()` to create mock implementations of ports:
 *
 * ```typescript
 * import { createMockPortFactory } from "@mirai-app/frameworks/di";
 *
 * // Define mock behavior
 * const mockAuthPort = {
 *   validateToken: (token: string) =>
 *     token === "valid-token"
 *       ? Promise.resolve(ok(createTestAuthContext()))
 *       : Promise.resolve(err(new AuthError("Invalid token")))
 * };
 *
 * // Register in container
 * container.register({
 *   authPort: createMockPortFactory(mockAuthPort),
 * });
 * ```
 *
 * @module test-container
 */

import {
  createContainer,
  asClass,
  asValue,
  type AwilixContainer,
  type Resolver,
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

// =============================================================================
// Mock Port Factory Utilities
// =============================================================================

/**
 * Create a mock port factory for awilix registration
 *
 * Creates a singleton resolver that returns the mock implementation.
 * Use this to register mock ports in test containers without creating
 * actual class implementations.
 *
 * @param mockImplementation - Object containing mock methods
 * @returns Awilix resolver for the mock
 *
 * @example
 * ```typescript
 * const mockAuthPort = {
 *   validateToken: () => Promise.resolve(ok(testAuthContext)),
 *   refreshSession: () => Promise.resolve(ok(testAuthContext)),
 * };
 *
 * container.register({
 *   authPort: createMockPortFactory(mockAuthPort),
 * });
 *
 * // Use in tests
 * const useCase = container.resolve("authenticateUserUseCase");
 * const result = await useCase.execute("test-token");
 * ```
 */
export function createMockPortFactory<T>(mockImplementation: T): Resolver<T> {
  return asValue(mockImplementation);
}

/**
 * Create a mock function that tracks calls and returns configured values
 *
 * Useful for creating spy-like mocks for port methods.
 *
 * @param returnValue - Value to return when mock is called
 * @returns Mock function with call tracking
 *
 * @example
 * ```typescript
 * const mockValidateToken = createMockFn(
 *   Promise.resolve(ok(testAuthContext))
 * );
 *
 * const mockAuthPort = {
 *   validateToken: mockValidateToken,
 * };
 *
 * // After calling use case
 * expect(mockValidateToken).toHaveBeenCalledWith("test-token");
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockFn<T>(returnValue?: T): MockFn<T> {
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
 * Mock function type with call tracking
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MockFn<T = any> = {
  (...args: unknown[]): T | undefined;
  calls: unknown[][];
  getCallCount: () => number;
  getLastCall: () => unknown[] | undefined;
  wasCalledWith: (...expectedArgs: unknown[]) => boolean;
  reset: () => void;
};
