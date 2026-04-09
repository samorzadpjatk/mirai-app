/**
 * Test Fixtures for Domain Types
 *
 * Provides factory functions for creating valid test data.
 * All fixtures use branded types and proper domain validation.
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   createTestUserId,
 *   createTestAuthContext,
 *   createTestUserRole,
 * } from "@mirai-app/frameworks/di/fixtures";
 *
 * // Create branded UserId
 * const userId = createTestUserId();
 *
 * // Create AuthContext with specific role
 * const adminContext = createTestAuthContext({ role: UserRole.ADMIN });
 * ```
 *
 * @module test-fixtures
 */

import { UserId, UserRole } from "@mirai-app/domain";

// =============================================================================
// UserId Fixtures (Branded Type)
// =============================================================================

/**
 * Create a valid branded UserId for testing
 *
 * Generates a valid UUID and casts it to the branded UserId type.
 *
 * @param id - Optional specific ID (must be valid UUID format)
 * @returns Branded UserId type
 *
 * @example
 * ```typescript
 * const userId = createTestUserId();
 * // userId has type: string & { readonly __brand: "UserId" }
 *
 * const specificId = createTestUserId("550e8400-e29b-41d4-a716-446655440000");
 * ```
 */
export function createTestUserId(id?: string): UserId {
  const uuid = id ?? crypto.randomUUID();
  return UserId.create(uuid);
}

/**
 * Create multiple test UserIds
 *
 * @param count - Number of UserIds to create
 * @returns Array of branded UserIds
 */
export function createTestUserIds(count: number): UserId[] {
  return Array.from({ length: count }, () => createTestUserId());
}

// =============================================================================
// UserRole Fixtures
// =============================================================================

/**
 * Create a UserRole value for testing
 *
 * @param role - Optional specific role (defaults to USER)
 * @returns UserRole enum value
 *
 * @example
 * ```typescript
 * const userRole = createTestUserRole(); // USER
 * const adminRole = createTestUserRole("ADMIN"); // ADMIN
 * ```
 */
export function createTestUserRole(
  role: "USER" | "MODERATOR" | "ADMIN" | "SERVICE" = "USER",
): UserRole {
  return UserRole[role];
}

/**
 * Test role fixtures for common scenarios
 */
export const TestRoles = {
  user: UserRole.USER,
  moderator: UserRole.MODERATOR,
  admin: UserRole.ADMIN,
  service: UserRole.SERVICE,
} as const;

// =============================================================================
// AuthContext Fixtures (Placeholder for upcoming AuthContext VO)
// =============================================================================

/**
 * Auth context data structure for testing
 *
 * This mirrors the expected shape of the upcoming AuthContext value object.
 * Update this when AuthContext is implemented in Step 1.1.
 */
export interface TestAuthContext {
  userId: UserId;
  role: UserRole;
  email: string;
  authUserId: string;
}

/**
 * Create a test auth context for testing
 *
 * Creates a valid auth context with configurable properties.
 * Use this in use case tests to simulate authenticated users.
 *
 * @param overrides - Optional properties to override
 * @returns TestAuthContext object
 *
 * @example
 * ```typescript
 * // Regular user context
 * const userContext = createTestAuthContext();
 *
 * // Admin context
 * const adminContext = createTestAuthContext({
 *   role: UserRole.ADMIN,
 *   email: "admin@example.com",
 * });
 *
 * // Specific user ID
 * const specificContext = createTestAuthContext({
 *   userId: createTestUserId("550e8400-e29b-41d4-a716-446655440000"),
 * });
 * ```
 */
export function createTestAuthContext(
  overrides?: Partial<TestAuthContext>,
): TestAuthContext {
  return {
    userId: overrides?.userId ?? createTestUserId(),
    role: overrides?.role ?? UserRole.USER,
    email: overrides?.email ?? "test@example.com",
    authUserId: overrides?.authUserId ?? crypto.randomUUID(),
  };
}

/**
 * Pre-defined auth contexts for common test scenarios
 */
export const TestAuthContexts = {
  /**
   * Regular user context
   */
  user: (): TestAuthContext => createTestAuthContext({ role: UserRole.USER }),

  /**
   * Moderator user context
   */
  moderator: (): TestAuthContext =>
    createTestAuthContext({ role: UserRole.MODERATOR }),

  /**
   * Admin user context
   */
  admin: (): TestAuthContext => createTestAuthContext({ role: UserRole.ADMIN }),

  /**
   * Service account context
   */
  service: (): TestAuthContext =>
    createTestAuthContext({ role: UserRole.SERVICE }),
} as const;

// =============================================================================
// Mock Port Factories
// =============================================================================

/**
 * Create a mock AuthPort for testing
 *
 * Provides mock implementations for auth port methods.
 * Use this to test use cases without Supabase dependencies.
 *
 * @param config - Configuration for mock behavior
 * @returns Mock AuthPort implementation
 *
 * @example
 * ```typescript
 * const mockAuthPort = createMockAuthPort({
 *   validToken: "test-token",
 *   authContext: createTestAuthContext({ role: UserRole.ADMIN }),
 * });
 *
 * container.register({
 *   authPort: createMockPortFactory(mockAuthPort),
 * });
 * ```
 */
export function createMockAuthPort(config?: {
  validToken?: string;
  authContext?: TestAuthContext;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Record<string, (...args: any[]) => unknown> {
  const validToken = config?.validToken ?? "valid-test-token";
  const authContext = config?.authContext ?? createTestAuthContext();

  return {
    validateToken: (token: string) =>
      token === validToken
        ? Promise.resolve({ kind: "ok", value: authContext })
        : Promise.resolve({
            kind: "err",
            error: new Error("Invalid token"),
          }),
    refreshSession: () => Promise.resolve({ kind: "ok", value: authContext }),
  };
}

/**
 * Create a mock TelemetryPort for testing
 *
 * Provides mock implementations for telemetry port methods.
 * Captures logged events for assertion in tests.
 *
 * @returns Mock TelemetryPort with event tracking
 *
 * @example
 * ```typescript
 * const mockTelemetryPort = createMockTelemetryPort();
 *
 * container.register({
 *   telemetryPort: createMockPortFactory(mockTelemetryPort),
 * });
 *
 * // After use case execution
 * expect(mockTelemetryPort.getEvents()).toHaveLength(1);
 * expect(mockTelemetryPort.getEvents()[0].userAgent).toBe("TestApp/1.0");
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockTelemetryPort(): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events: any[] = [];

  return {
    log: (event: unknown) => {
      events.push(event);
      return Promise.resolve();
    },
    getEvents: () => [...events],
    getLastEvent: () => events[events.length - 1],
    clearEvents: () => {
      events.length = 0;
    },
  };
}
