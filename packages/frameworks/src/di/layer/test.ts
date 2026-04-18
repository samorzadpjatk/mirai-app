/**
 * Test Layer - Mock layers and test utilities for Effect-based DI
 *
 * Provides utilities for creating test layers with mocked implementations.
 */

import { Layer, Effect, Context, Data } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { IAuthPort, IAuthNPort, IAuthZPort, IPortError, AccessCheckRequest } from "@mirai-app/domain";

// Use-cases ports - using available exports
import {
  UserPortTag,
  type IUserPort,
} from "@mirai-app/use-cases/user/ports/UserPort";
import {
  GroupPortTag,
  type IGroupPort,
} from "@mirai-app/use-cases/group/ports/GroupPort";
import {
  AuthPortTag,
  AuthNPortTag,
  AuthZPortTag,
  EventBusTag,
} from "@mirai-app/use-cases";

// In-memory implementations for testing
import { InMemoryUserGateway, InMemoryGroupGateway, InProcessEventBusGateway } from "@mirai-app/adapters";
import type { IEventBusPort } from "@mirai-app/domain";

// AuthContext from adapters layer
import { AuthContextTag, type AuthContext, type TripRole } from "@mirai-app/adapters/infrastructure/effect";

/**
 * Configuration for creating test layers
 */
export interface TestLayerConfig {
  /** Optional pre-configured database client */
  db?: DrizzleDb;
  /** Optional custom user port implementation */
  userPort?: IUserPort;
  /** Optional custom group port implementation */
  groupPort?: IGroupPort;
  /** Optional custom event bus implementation */
  eventBus?: IEventBusPort;
  /** Optional custom auth port implementation (backward compatibility) */
  authPort?: IAuthPort;
  /** Optional custom AuthN port implementation */
  authNPort?: IAuthNPort;
  /** Optional custom AuthZ port implementation */
  authZPort?: IAuthZPort;
}

// ============================================================================
// Auth Mock Helpers
// ============================================================================

/**
 * Mock Auth Errors for testing auth failures
 * 
 * These errors implement IPortError and can be used to simulate
 * different auth failure scenarios in tests.
 */
export class MockUnauthorizedError
  extends Data.TaggedError("MockUnauthorizedError")<{ message?: string }>
  implements IPortError
{
  override readonly message = "Unauthorized: Invalid or missing token";
}

export class MockPermissionDeniedError
  extends Data.TaggedError("MockPermissionDeniedError")<{ 
    message?: string;
    resourceType?: string;
    resourceId?: string;
  }>
  implements IPortError
{
  override readonly message = "Forbidden: Insufficient permissions";
}

export class MockSessionExpiredError
  extends Data.TaggedError("MockSessionExpiredError")<{ message?: string }>
  implements IPortError
{
  override readonly message = "Session expired: Please sign in again";
}

/**
 * Creates a mock IAuthPort that always succeeds (bypasses auth).
 * Use this for tests that don't need to verify auth behavior.
 *
 * @example
 * ```typescript
 * const mockAuth = createAlwaysAllowMockAuth();
 * const authLayer = mockLayerOf(AuthPortTag, mockAuth);
 * ```
 */
export const createAlwaysAllowMockAuth = (): IAuthPort => ({
  signInWithPassword: () =>
    Effect.succeed({
      user: { id: "test-user-id", email: "test@example.com" },
      session: { accessToken: "mock-token" },
    }),
  sendSignInOtp: () => Effect.succeed(void 0),
  signInWithOtp: () =>
    Effect.succeed({
      user: { id: "test-user-id", email: "test@example.com" },
      session: { accessToken: "mock-token" },
    }),
  signUp: () =>
    Effect.succeed({
      user: { id: "new-user-id", email: "new@example.com" },
    }),
  signOut: () => Effect.succeed(void 0),
  getSession: () =>
    Effect.succeed({
      user: { id: "test-user-id", email: "test@example.com" },
      accessToken: "mock-token",
    }),
  refreshSession: () =>
    Effect.succeed({
      session: { accessToken: "refreshed-mock-token" },
    }),
  verifyAccess: () => Effect.succeed(void 0),
});

/**
 * Creates a mock IAuthPort that always fails with a specific error.
 * Use this to test error handling in protected routes.
 *
 * @example
 * ```typescript
 * const mockAuth = createAlwaysDenyMockAuth(new MockUnauthorizedError({}));
 * const authLayer = mockLayerOf(AuthPortTag, mockAuth);
 *
 * // Test that protected operations fail
 * const result = await Effect.runPromise(Effect.either(
 *   program.pipe(Effect.provide(authLayer))
 * ));
 * expect(Either.isLeft(result)).toBe(true);
 * ```
 */
export const createAlwaysDenyMockAuth = (error: IPortError): IAuthPort => ({
  signInWithPassword: () => Effect.fail(error),
  sendSignInOtp: () => Effect.fail(error),
  signInWithOtp: () => Effect.fail(error),
  signUp: () => Effect.fail(error),
  signOut: () => Effect.fail(error),
  getSession: () => Effect.fail(error),
  refreshSession: () => Effect.fail(error),
  verifyAccess: () => Effect.fail(error),
});

/**
 * Creates a mock IAuthPort that conditionally succeeds or fails.
 * Useful for testing role-based access or conditional auth flows.
 * 
 * @example
 * ```typescript
 * const mockAuth = createConditionalMockAuth({
 *   isAllowed: (token) => token === "valid-token",
 *   error: new MockPermissionDeniedError({}),
 * });
 * ```
 */
export interface ConditionalMockAuthConfig {
  isAllowed: (token: string | undefined) => boolean;
  error: IPortError;
  mockUser?: { id: string; email: string };
}

export const createConditionalMockAuth = (
  config: ConditionalMockAuthConfig,
): IAuthPort => {
  const mockUser = config.mockUser ?? {
    id: "test-user-id",
    email: "test@example.com",
  };

  return {
    signInWithPassword: (email, password) => {
      if (config.isAllowed(`${email}:${password}`)) {
        return Effect.succeed({
          user: mockUser,
          session: { accessToken: "mock-token" },
        });
      }
      return Effect.fail(config.error);
    },
    sendSignInOtp: () => Effect.succeed(void 0),
    signInWithOtp: (email, otp) => {
      if (config.isAllowed(`${email}:${otp}`)) {
        return Effect.succeed({
          user: mockUser,
          session: { accessToken: "mock-token" },
        });
      }
      return Effect.fail(config.error);
    },
    signUp: () => Effect.succeed({ user: mockUser }),
    signOut: () => Effect.succeed(void 0),
    getSession: () => {
      if (config.isAllowed("mock-token")) {
        return Effect.succeed({
          user: mockUser,
          accessToken: "mock-token",
        });
      }
      return Effect.fail(config.error);
    },
    refreshSession: () =>
      Effect.succeed({ session: { accessToken: "refreshed-token" } }),
    verifyAccess: () => {
      // For verifyAccess, we check if the token is allowed
      if (config.isAllowed("mock-token")) {
        return Effect.succeed(void 0);
      }
      return Effect.fail(config.error);
    },
  };
};

/**
 * Test Layer type - combines all mock repository layers
 */
export type TestLayer = Layer.Layer<never>;

/**
 * Creates a test Layer with in-memory repositories.
 *
 * All repositories are empty by default - seed them in your tests.
 *
 * @example
 * ```typescript
 * const testLayer = createTestLayer();
 *
 * const program = Effect.gen(function* () {
 *   const userRepo = yield* UserPortTag;
 *   const user = yield* userRepo.findById("123");
 *   return user;
 * }).pipe(Effect.provide(testLayer));
 * ```
 */
// ============================================================================
// Mock Auth Layer
// ============================================================================

/**
 * Creates a mock auth layer for testing.
 * The mock auth layer provides an IAuthPort that always succeeds (bypasses auth).
 * This is useful for tests that don't need to verify auth behavior.
 *
 * @example
 * ```typescript
 * const mockAuthLayer = createMockAuthLayer();
 * const testLayer = Layer.mergeAll(mockAuthLayer, repoLayer);
 *
 * // Or use the test layer with auth:
 * const testLayer = createTestLayer(); // includes mock auth
 * ```
 */
export const createMockAuthLayer = () => {
  return Layer.succeed(AuthPortTag, {
    signInWithPassword: () =>
      Effect.succeed({
        user: { id: "test-user-id", email: "test@example.com" },
        session: { accessToken: "mock-token" },
      }),
    sendSignInOtp: () => Effect.succeed(void 0),
    signInWithOtp: () =>
      Effect.succeed({
        user: { id: "test-user-id", email: "test@example.com" },
        session: { accessToken: "mock-token" },
      }),
    signUp: () =>
      Effect.succeed({
        user: { id: "new-user-id", email: "new@example.com" },
      }),
    signOut: () => Effect.succeed(void 0),
    getSession: () =>
      Effect.succeed({
        user: { id: "test-user-id", email: "test@example.com" },
        accessToken: "mock-token",
      }),
    refreshSession: () =>
      Effect.succeed({
        session: { accessToken: "refreshed-mock-token" },
      }),
    verifyAccess: () => Effect.succeed(void 0),
  });
};

/**
 * Creates a mock IAuthPort implementation that always succeeds.
 * Use this for creating custom mock auth implementations.
 */
export const createMockAuthPort = (): IAuthPort => ({
  signInWithPassword: () =>
    Effect.succeed({
      user: { id: "test-user-id", email: "test@example.com" },
      session: { accessToken: "mock-token" },
    }),
  sendSignInOtp: () => Effect.succeed(void 0),
  signInWithOtp: () =>
    Effect.succeed({
      user: { id: "test-user-id", email: "test@example.com" },
      session: { accessToken: "mock-token" },
    }),
  signUp: () =>
    Effect.succeed({
      user: { id: "new-user-id", email: "new@example.com" },
    }),
  signOut: () => Effect.succeed(void 0),
  getSession: () =>
    Effect.succeed({
      user: { id: "test-user-id", email: "test@example.com" },
      accessToken: "mock-token",
    }),
  refreshSession: () =>
    Effect.succeed({
      session: { accessToken: "refreshed-mock-token" },
    }),
  verifyAccess: () => Effect.succeed(void 0),
});

// ============================================================================
// AuthN (Authentication) Mock Helpers
// ============================================================================

/**
 * Creates a mock IAuthNPort that always succeeds.
 * Use this for tests that don't need to verify authentication behavior.
 *
 * @example
 * ```typescript
 * const mockAuthN = createAlwaysAllowMockAuthN();
 * const authNLayer = mockLayerOf(AuthNPortTag, mockAuthN);
 * ```
 */
export const createAlwaysAllowMockAuthN = (): IAuthNPort => ({
  signInWithPassword: () =>
    Effect.succeed({
      user: { id: "test-user-id", email: "test@example.com" },
      session: { accessToken: "mock-token" },
    }),
  signInWithOtp: () =>
    Effect.succeed({
      user: { id: "test-user-id", email: "test@example.com" },
      session: { accessToken: "mock-token" },
    }),
  signUp: () =>
    Effect.succeed({
      user: { id: "new-user-id", email: "new@example.com" },
    }),
  signOut: () => Effect.succeed(void 0),
  getSession: () =>
    Effect.succeed({
      user: { id: "test-user-id", email: "test@example.com" },
      accessToken: "mock-token",
    }),
  refreshSession: () =>
    Effect.succeed({
      session: { accessToken: "refreshed-mock-token" },
    }),
});

/**
 * Creates a mock IAuthNPort that always fails with a specific error.
 * Use this to test error handling in authentication flows.
 */
export const createAlwaysDenyMockAuthN = (error: IPortError): IAuthNPort => ({
  signInWithPassword: () => Effect.fail(error),
  signInWithOtp: () => Effect.fail(error),
  signUp: () => Effect.fail(error),
  signOut: () => Effect.fail(error),
  getSession: () => Effect.fail(error),
  refreshSession: () => Effect.fail(error),
});

/**
 * Creates a mock AuthN layer for testing.
 * The mock auth layer provides an IAuthNPort that always succeeds.
 */
export const createMockAuthNLayer = () => {
  return Layer.succeed(AuthNPortTag, createAlwaysAllowMockAuthN());
};

// ============================================================================
// AuthZ (Authorization) Mock Helpers
// ============================================================================

/**
 * Creates a mock IAuthZPort that always succeeds (allows all access).
 * Use this for tests that don't need to verify authorization behavior.
 *
 * @example
 * ```typescript
 * const mockAuthZ = createAlwaysAllowMockAuthZ();
 * const authZLayer = mockLayerOf(AuthZPortTag, mockAuthZ);
 * ```
 */
export const createAlwaysAllowMockAuthZ = (): IAuthZPort => ({
  verifyAccess: () => Effect.succeed(void 0),
  checkRolePermission: () => Effect.succeed(true),
});

/**
 * Creates a mock IAuthZPort that always fails with a specific error.
 * Use this to test error handling in authorization flows.
 */
export const createAlwaysDenyMockAuthZ = (error: IPortError): IAuthZPort => ({
  verifyAccess: () => Effect.fail(error),
  checkRolePermission: () => Effect.fail(error),
});

/**
 * Creates a mock IAuthZPort that conditionally succeeds or fails.
 * Useful for testing role-based access or conditional authorization.
 */
export interface ConditionalMockAuthZConfig {
  isAllowed: (request: AccessCheckRequest) => boolean;
  error: IPortError;
}

export const createConditionalMockAuthZ = (
  config: ConditionalMockAuthZConfig,
): IAuthZPort => ({
  verifyAccess: (request) => {
    if (config.isAllowed(request)) {
      return Effect.succeed(void 0);
    }
    return Effect.fail(config.error);
  },
  checkRolePermission: () => Effect.succeed(true),
});

/**
 * Creates a mock auth layer for testing.
 * The mock auth layer provides an IAuthZPort that always succeeds.
 */
export const createMockAuthZLayer = () => {
  return Layer.succeed(AuthZPortTag, createAlwaysAllowMockAuthZ());
};

// ============================================================================
// AuthContext Mock Helpers
// ============================================================================

/**
 * Creates a mock AuthContext for testing.
 *
 * This helper creates a complete AuthContext object with sensible defaults
 * for testing. Use the overrides parameter to customize specific properties.
 *
 * @example
 * ```typescript
 * // Default mock context (authenticated as USER)
 * const mockAuth = createMockAuthContext();
 *
 * // Custom mock context (admin user)
 * const adminAuth = createMockAuthContext({
 *   userId: "admin-123",
 *   role: "ADMIN",
 *   tripRoles: { "trip-456": "LEADER" },
 * });
 *
 * // Unauthenticated context
 * const publicAuth = createMockAuthContext({
 *   userId: "",
 *   isAuthenticated: false,
 * });
 * ```
 *
 * @param overrides - Optional overrides for AuthContext properties
 * @returns A complete AuthContext object
 */
export const createMockAuthContext = (overrides?: Partial<AuthContext>): AuthContext => ({
  userId: overrides?.userId ?? "user-test-123",
  role: overrides?.role ?? "USER",
  tripRoles: overrides?.tripRoles ?? {},
  isAuthenticated: overrides?.isAuthenticated ?? true,
  accessToken: overrides?.accessToken ?? "mock-jwt-token",
});

/**
 * Creates a mock AuthContext for an admin user.
 *
 * @example
 * ```typescript
 * const adminLayer = Layer.succeed(
 *   AuthContextTag,
 *   createMockAdminContext({ userId: "admin-456" })
 * );
 * ```
 */
export const createMockAdminContext = (overrides?: Partial<AuthContext>): AuthContext =>
  createMockAuthContext({
    userId: overrides?.userId ?? "admin-test",
    role: "ADMIN",
    ...overrides,
  });

/**
 * Creates a mock AuthContext for a moderator user.
 */
export const createMockModeratorContext = (overrides?: Partial<AuthContext>): AuthContext =>
  createMockAuthContext({
    userId: overrides?.userId ?? "moderator-test",
    role: "MODERATOR",
    ...overrides,
  });

/**
 * Creates a mock AuthContext for an unauthenticated/public user.
 */
export const createMockPublicContext = (overrides?: Partial<AuthContext>): AuthContext =>
  createMockAuthContext({
    userId: overrides?.userId ?? "",
    role: "USER",
    isAuthenticated: false,
    accessToken: undefined,
    ...overrides,
  });

/**
 * Creates a mock AuthContext with specific trip roles.
 *
 * @example
 * ```typescript
 * const leaderContext = createMockTripLeaderContext("trip-123");
 * const memberContext = createMockTripMemberContext("trip-456");
 * ```
 */
export const createMockTripLeaderContext = (
  tripId: string,
  overrides?: Partial<AuthContext>,
): AuthContext =>
  createMockAuthContext({
    tripRoles: { [tripId]: "LEADER" },
    ...overrides,
  });

export const createMockTripMemberContext = (
  tripId: string,
  overrides?: Partial<AuthContext>,
): AuthContext =>
  createMockAuthContext({
    tripRoles: { [tripId]: "MEMBER" },
    ...overrides,
  });

/**
 * Creates a Layer with mocked AuthContext for testing.
 *
 * @example
 * ```typescript
 * const authLayer = createMockAuthContextLayer({
 *   userId: "custom-user",
 *   role: "ADMIN",
 * });
 * const testLayer = Layer.mergeAll(authLayer, repoLayer, authZLayer);
 * ```
 */
export const createMockAuthContextLayer = (overrides?: Partial<AuthContext>) => {
  return Layer.succeed(AuthContextTag, createMockAuthContext(overrides));
};

/**
 * Re-export AuthContextTag and types for convenience
 */
export { AuthContextTag, type AuthContext, type TripRole };

export const createTestLayer = (config: TestLayerConfig = {}) => {
  // Legacy auth layer (backward compatibility)
  const authLayer = config.authPort
    ? Layer.succeed(AuthPortTag, config.authPort)
    : createMockAuthLayer();

  // AuthN layer (authentication)
  const authNLayer = config.authNPort
    ? Layer.succeed(AuthNPortTag, config.authNPort)
    : createMockAuthNLayer();

  // AuthZ layer (authorization)
  const authZLayer = config.authZPort
    ? Layer.succeed(AuthZPortTag, config.authZPort)
    : createMockAuthZLayer();

  const userLayer = config.userPort
    ? Layer.succeed(UserPortTag, config.userPort)
    : Layer.succeed(UserPortTag, new InMemoryUserGateway());

  const groupLayer = config.groupPort
    ? Layer.succeed(GroupPortTag, config.groupPort)
    : Layer.succeed(GroupPortTag, new InMemoryGroupGateway());

  const eventBusLayer = config.eventBus
    ? Layer.succeed(EventBusTag, config.eventBus)
    : Layer.succeed(EventBusTag, new InProcessEventBusGateway());

  // Merge all layers: legacy auth + new AuthN/AuthZ + repos + event bus
  return Layer.mergeAll(authLayer, authNLayer, authZLayer, userLayer, groupLayer, eventBusLayer);
};

/**
 * Creates a mock Layer for a specific Context.Tag.
 *
 * @example
 * ```typescript
 * const mockUserLayer = mockLayerOf(UserPortTag, {
 *   findById: () => Effect.succeed(null),
 *   save: (user) => Effect.succeed(user),
 * });
 * ```
 */
export const mockLayerOf = <Self, Service>(
  tag: Context.Tag<Self, Service>,
  implementation: Service,
): Layer.Layer<Self> => {
  return Layer.succeed(tag, implementation);
};

/**
 * Creates a mock repository layer with only in-memory implementations.
 * This is a convenience function for tests that only need basic CRUD.
 */
export const createMockRepositoryLayer = () => {
  return createTestLayer();
};

/**
 * Runs an Effect program with a test layer.
 *
 * @example
 * ```typescript
 * const result = await runWithTestLayer(
 *   testLayer,
 *   Effect.gen(function* () {
 *     const repo = yield* UserPortTag;
 *     return yield* repo.findById("123");
 *   })
 * );
 * ```
 */
export const runWithTestLayer = <A, E>(
  layer: TestLayer,
  effect: Effect.Effect<A, E, never>,
) => {
  const provided = Effect.provide(effect, layer);
  return Effect.runPromise(provided);
};

// ============================================================================
// Effect.either Testing Patterns for Auth
// ============================================================================

/**
 * Testing Pattern: Effect.either with Auth Failures
 * 
 * Use Effect.either to convert Effect to Either for type-safe error testing.
 * This pattern is essential for testing auth-protected operations.
 * 
 * Pattern Overview:
 * -----------------
 * 1. Wrap your Effect with Effect.either
 * 2. Use Either.isLeft() to check for errors
 * 3. Use Either.isRight() to check for success
 * 4. Use instanceof for type-specific error assertions
 * 
 * Success Case Pattern:
 * ---------------------
 * ```typescript
 * const effect = program.pipe(Effect.provide(testLayer));
 * const either = await Effect.runPromise(Effect.either(effect));
 * 
 * expect(Either.isRight(either)).toBe(true);
 * if (Either.isRight(either)) {
 *   expect(either.right.id).toBe("expected-id");
 * }
 * ```
 * 
 * Auth Failure Case Pattern:
 * --------------------------
 * ```typescript
 * // Create mock auth that always denies
 * const mockAuth = createAlwaysDenyMockAuth(
 *   new MockUnauthorizedError({ message: "Token expired" })
 * );
 * const authLayer = mockLayerOf(AuthPortTag, mockAuth);
 * const testLayer = Layer.mergeAll(authLayer, repoLayer);
 * 
 * // Execute protected operation
 * const effect = protectedOperation.pipe(Effect.provide(testLayer));
 * const either = await Effect.runPromise(Effect.either(effect));
 * 
 * // Assert failure
 * expect(Either.isLeft(either)).toBe(true);
 * if (Either.isLeft(either)) {
 *   expect(either.left).toBeInstanceOf(MockUnauthorizedError);
 *   expect(either.left.message).toContain("Token expired");
 * }
 * ```
 * 
 * Conditional Auth Pattern:
 * -------------------------
 * ```typescript
 * const mockAuth = createConditionalMockAuth({
 *   isAllowed: (token) => token === "valid-token",
 *   error: new MockPermissionDeniedError({ resourceType: "trip" }),
 * });
 * 
 * // Test with valid token - succeeds
 * const validEffect = operationWithToken("valid-token").pipe(
 *   Effect.provide(mockLayerOf(AuthPortTag, mockAuth))
 * );
 * const validResult = await Effect.runPromise(Effect.either(validEffect));
 * expect(Either.isRight(validResult)).toBe(true);
 * 
 * // Test with invalid token - fails
 * const invalidEffect = operationWithToken("invalid-token").pipe(
 *   Effect.provide(mockLayerOf(AuthPortTag, mockAuth))
 * );
 * const invalidResult = await Effect.runPromise(Effect.either(invalidEffect));
 * expect(Either.isLeft(invalidResult)).toBe(true);
 * ```
 * 
 * Complete Auth Test Example:
 * --------------------------
 * ```typescript
 * describe("[UNIT] AuthProtectedGateway", () => {
 *   it("should allow access with valid token", async () => {
 *     // Arrange
 *     const mockAuth = createAlwaysAllowMockAuth();
 *     const authLayer = mockLayerOf(AuthPortTag, mockAuth);
 *     const testLayer = Layer.mergeAll(authLayer, createMockRepositoryLayer());
 *     
 *     // Act
 *     const program = Effect.gen(function* () {
 *       const repo = yield* TripPortTag;
 *       return yield* repo.findById("trip-123", "valid-token");
 *     });
 *     const either = await Effect.runPromise(
 *       Effect.either(program.pipe(Effect.provide(testLayer)))
 *     );
 *     
 *     // Assert
 *     expect(Either.isRight(either)).toBe(true);
 *   });
 *   
 *   it("should deny access with invalid token", async () => {
 *     // Arrange
 *     const mockAuth = createAlwaysDenyMockAuth(
 *       new MockUnauthorizedError({})
 *     );
 *     const authLayer = mockLayerOf(AuthPortTag, mockAuth);
 *     const testLayer = Layer.mergeAll(authLayer, createMockRepositoryLayer());
 *     
 *     // Act
 *     const program = Effect.gen(function* () {
 *       const repo = yield* TripPortTag;
 *       return yield* repo.findById("trip-123", "invalid-token");
 *     });
 *     const either = await Effect.runPromise(
 *       Effect.either(program.pipe(Effect.provide(testLayer)))
 *     );
 *     
 *     // Assert
 *     expect(Either.isLeft(either)).toBe(true);
 *     if (Either.isLeft(either)) {
 *       expect(either.left).toBeInstanceOf(MockUnauthorizedError);
 *     }
 *   });
 *   
 *   it("should skip auth when token not provided (public operations)", async () => {
 *     // Arrange - no auth layer needed
 *     const testLayer = createMockRepositoryLayer();
 *     
 *     // Act - call without token
 *     const program = Effect.gen(function* () {
 *       const repo = yield* TripPortTag;
 *       return yield* repo.findById("trip-123"); // no token
 *     });
 *     const either = await Effect.runPromise(
 *       Effect.either(program.pipe(Effect.provide(testLayer)))
 *     );
 *     
 *     // Assert - should succeed without auth check
 *     expect(Either.isRight(either)).toBe(true);
 *   });
 * });
 * ```
 * 
 * Key Testing Principles:
 * -----------------------
 * 1. Always use Effect.either for error testing - never use try/catch
 * 2. Use instanceof to check specific error types after Either.isLeft()
 * 3. Test both success and failure paths for protected operations
 * 4. Test optional auth (no token) for backward compatibility
 * 5. Create fresh mock layers for each test to avoid state leakage
 * 6. Use Either.isRight() before accessing either.right
 * 7. Use type guards (if statements) to narrow Either types
 * 
 * @see Effect.either
 * @see Either.isLeft
 * @see Either.isRight
 */
