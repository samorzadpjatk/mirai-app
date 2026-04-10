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
 * ## Automatic InMemory Adapters
 *
 * When you use `createTestContainer()`, the following InMemory adapters are
 * automatically registered:
 *
 * | Port | InMemory Adapter | Purpose |
 * |------|------------------|---------|
 * | `authPort` | InMemoryAuthAdapter | Authentication without Supabase |
 * | `realtimePort` | InMemoryRealtimeAdapter | Real-time without WebSocket |
 * | `storagePort` | InMemoryStorageAdapter | File storage without S3/Supabase |
 *
 * This means your tests run without any external dependencies by default.
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

// =============================================================================
// InMemory Adapter Imports
// =============================================================================

import { InMemoryAuthAdapter } from "@mirai-app/adapters/gateways/auth/InMemoryAuthAdapter";
import { InMemoryRealtimeAdapter } from "@mirai-app/adapters/gateways/realtime/InMemoryRealtimeAdapter";
import { InMemoryStorageAdapter } from "@mirai-app/adapters/gateways/storage/InMemoryStorageAdapter";

// =============================================================================
// Token Constants
// =============================================================================

/**
 * Port injection tokens matching UseCaseModule
 */
export const PORT_TOKENS = {
  AuthPort: "authPort",
  RealtimePort: "realtimePort",
  StoragePort: "storagePort",
  TelemetryPort: "telemetryPort",
} as const;

// =============================================================================
// Test Container Creation
// =============================================================================

/**
 * Create a test container with isolated scope and InMemory adapters
 *
 * Creates a new Awilix container with transient scope (new instance per resolution)
 * for isolated testing. Automatically registers InMemory adapters for auth,
 * realtime, and storage ports.
 *
 * The container is pre-configured with:
 * - `authPort` → InMemoryAuthAdapter (singleton)
 * - `realtimePort` → InMemoryRealtimeAdapter (singleton)
 * - `storagePort` → InMemoryStorageAdapter (singleton)
 *
 * @returns New isolated container with InMemory adapters pre-registered
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
 *   it("should work with InMemory adapters", async () => {
 *     const authPort = container.resolve<InMemoryAuthAdapter>("authPort");
 *
 *     // Create a test user and session
 *     const userId = UserId.create("test-user-id");
 *     authPort.createUser({ id: userId, role: UserRole.USER });
 *     const session = authPort.createSession(userId);
 *
 *     // Test your use case
 *     const useCase = container.resolve("authenticateUserUseCase");
 *     const result = await useCase.execute(session.token);
 *
 *     expect(result.kind).toBe("ok");
 *   });
 * });
 * ```
 */
export function createTestContainer(): AwilixContainer {
  const container = createContainer({
    injectionMode: "PROXY",
  });

  // Register InMemory adapters by default
  container.register({
    [PORT_TOKENS.AuthPort]: asClass(InMemoryAuthAdapter).singleton(),
    [PORT_TOKENS.RealtimePort]: asClass(InMemoryRealtimeAdapter).singleton(),
    [PORT_TOKENS.StoragePort]: asClass(InMemoryStorageAdapter).singleton(),
  });

  return container;
}

/**
 * Create a test container with specific bindings
 *
 * Allows pre-binding services before module registration,
 * useful for overriding specific dependencies.
 *
 * @param configure - Function to configure container
 * @returns Configured container with InMemory adapters pre-registered
 *
 * @example
 * ```typescript
 * const container = createConfiguredTestContainer((c) => {
 *   c.register({
 *     drizzle: asValue(mockDb),
 *   });
 * });
 *
 * // All module-registered classes will use the bound Drizzle client
 * const repo = container.resolve("userRepository");
 * ```
 */
export function createConfiguredTestContainer(
  configure: (container: AwilixContainer) => void,
): AwilixContainer {
  const container = createTestContainer();

  // Apply custom configuration
  configure(container);

  return container;
}

/**
 * Create a test container from a module
 *
 * Useful for testing with actual module configurations. Note that
 * InMemory adapters are registered first, so the module must
 * explicitly override them if it wants different behavior.
 *
 * @param module - Static module to load
 * @returns Container with InMemory adapters + module providers
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

  // Register exported providers from module
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

// =============================================================================
// InMemory Adapter Access Helpers
// =============================================================================

/**
 * Get the InMemoryAuthAdapter from a test container
 *
 * Helper function to retrieve and type-cast the authPort from a test container.
 * Useful for setting up test users and sessions.
 *
 * @param container - The test container
 * @returns InMemoryAuthAdapter instance
 *
 * @example
 * ```typescript
 * const container = createTestContainer();
 * const authAdapter = getInMemoryAuthAdapter(container);
 *
 * // Create test user
 * const userId = UserId.create("test-user-1");
 * authAdapter.createUser({ id: userId, role: UserRole.USER });
 *
 * // Create session
 * const { token } = authAdapter.createSession(userId);
 * ```
 */
export function getInMemoryAuthAdapter(
  container: AwilixContainer,
): InMemoryAuthAdapter {
  return container.resolve<InMemoryAuthAdapter>(PORT_TOKENS.AuthPort);
}

/**
 * Get the InMemoryRealtimeAdapter from a test container
 *
 * Helper function to retrieve and type-cast the realtimePort from a test container.
 * Useful for testing real-time subscriptions and broadcasts.
 *
 * @param container - The test container
 * @returns InMemoryRealtimeAdapter instance
 *
 * @example
 * ```typescript
 * const container = createTestContainer();
 * const realtimeAdapter = getInMemoryRealtimeAdapter(container);
 *
 * // Subscribe to channel
 * const messages: unknown[] = [];
 * realtimeAdapter.subscribe("test-channel", {
 *   onMessage: (event, payload) => messages.push(payload)
 * });
 *
 * // Broadcast message
 * await realtimeAdapter.broadcast("test-channel", "test-event", { data: "value" });
 * ```
 */
export function getInMemoryRealtimeAdapter(
  container: AwilixContainer,
): InMemoryRealtimeAdapter {
  return container.resolve<InMemoryRealtimeAdapter>(PORT_TOKENS.RealtimePort);
}

/**
 * Get the InMemoryStorageAdapter from a test container
 *
 * Helper function to retrieve and type-cast the storagePort from a test container.
 * Useful for testing file upload/download without external storage.
 *
 * @param container - The test container
 * @returns InMemoryStorageAdapter instance
 *
 * @example
 * ```typescript
 * const container = createTestContainer();
 * const storageAdapter = getInMemoryStorageAdapter(container);
 *
 * // Upload file
 * const buffer = Buffer.from("Hello World");
 * await storageAdapter.upload("files", "test.txt", buffer, {
 *   contentType: "text/plain"
 * });
 *
 * // Verify file exists
 * expect(storageAdapter.fileExists("files", "test.txt")).toBe(true);
 * ```
 */
export function getInMemoryStorageAdapter(
  container: AwilixContainer,
): InMemoryStorageAdapter {
  return container.resolve<InMemoryStorageAdapter>(PORT_TOKENS.StoragePort);
}

/**
 * Clear all InMemory adapters in a test container
 *
 * Convenience function to reset all InMemory adapters between tests.
 * Clears auth users/sessions, realtime subscriptions, and storage files.
 *
 * @param container - The test container
 *
 * @example
 * ```typescript
 * describe("MyTestSuite", () => {
 *   let container: AwilixContainer;
 *
 *   beforeEach(() => {
 *     container = createTestContainer();
 *   });
 *
 *   afterEach(() => {
 *     clearInMemoryAdapters(container);
 *   });
 *
 *   it("test 1", async () => { ... });
 *   it("test 2", async () => { ... }); // Starts with clean state
 * });
 * ```
 */
export function clearInMemoryAdapters(container: AwilixContainer): void {
  try {
    const authAdapter = container.resolve<InMemoryAuthAdapter>(
      PORT_TOKENS.AuthPort,
    );
    authAdapter.clear();
  } catch {
    // Adapter not registered, ignore
  }

  try {
    const realtimeAdapter = container.resolve<InMemoryRealtimeAdapter>(
      PORT_TOKENS.RealtimePort,
    );
    realtimeAdapter.clear();
  } catch {
    // Adapter not registered, ignore
  }

  try {
    const storageAdapter = container.resolve<InMemoryStorageAdapter>(
      PORT_TOKENS.StoragePort,
    );
    storageAdapter.clear();
  } catch {
    // Adapter not registered, ignore
  }
}
