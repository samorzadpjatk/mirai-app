/**
 * SupabaseAuthGateway Unit Tests
 *
 * Unit tests for the SupabaseAuthGateway AuthN (authentication) methods.
 * Tests signInWithPassword, signInWithOtp, signUp, signOut, getSession, refreshSession.
 *
 * Note: Authorization tests (verifyAccess) have been moved to UserDrizzleGateway.test.ts
 * which implements IAuthZPort.
 *
 * ## Test Tagging
 *
 * - [UNIT]: Tests with mocked Supabase client (no external dependencies)
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { SupabaseAuthGateway } from "./SupabaseAuthGateway";
import { ApplicationError } from "@mirai-app/domain";
import type { SupabaseClient } from "../../../infrastructure/supabase";
import { AuthContextTag, type AuthContext } from "../../../infrastructure/effect";
import { AuthZPortTag } from "@mirai-app/use-cases";
import type { IAuthZPort } from "@mirai-app/domain";

// ============================================================================
// Mock AuthContext Helper
// ============================================================================

/**
 * Creates a mock AuthContext for testing
 *
 * @param overrides - Optional overrides for AuthContext properties
 * @returns AuthContext with test data
 */
const createMockAuthContext = (overrides?: Partial<AuthContext>): AuthContext => ({
  userId: overrides?.userId ?? "user-test",
  role: overrides?.role ?? "USER",
  tripRoles: overrides?.tripRoles ?? {},
  isAuthenticated: overrides?.isAuthenticated ?? true,
  accessToken: overrides?.accessToken ?? "mock-access-token",
});

// ============================================================================
// Mock Auth Layer Helpers
// ============================================================================

/**
 * Creates a mock IAuthZPort that always allows access
 */
const createMockAuthZPort = (): IAuthZPort => ({
  verifyAccess: () => Effect.succeed(void 0),
  checkRolePermission: () => Effect.succeed(true),
});

/**
 * Creates a test layer with mocked AuthContext and AuthZPort
 */
const createAuthTestLayer = (authContext?: AuthContext) =>
  Layer.mergeAll(
    Layer.succeed(AuthContextTag, authContext ?? createMockAuthContext()),
    Layer.succeed(AuthZPortTag, createMockAuthZPort()),
  );

// ============================================================================
// Mock Supabase Client Factory
// ============================================================================

/**
 * Creates a mock Supabase client with configurable auth behavior
 */
const createMockSupabaseClient = (config: {
  signInWithPasswordResult?:
    | { data: { user: { id: string; email: string }; session: { access_token: string } }; error: null }
    | { data: { user: null; session: null }; error: null }
    | { data: { user: null; session: null }; error: Error };
  signUpResult?:
    | { data: { user: { id: string; email: string } }; error: null }
    | { data: { user: null }; error: null }
    | { data: null; error: Error };
  signOutResult?: { error: null } | { error: Error };
  getSessionResult?:
    | { data: { session: { user: { id: string; email: string }; access_token: string } }; error: null }
    | { data: { session: null }; error: null }
    | { data: null; error: Error };
  refreshSessionResult?:
    | { data: { session: { access_token: string } }; error: null }
    | { data: { session: null }; error: null }
    | { data: null; error: Error };
  verifyOtpResult?:
    | { data: { user: { id: string; email: string }; session: { access_token: string } }; error: null }
    | { data: { user: null; session: null }; error: Error };
}): SupabaseClient => {
  return {
    auth: {
      signInWithPassword: async () => {
        if (config.signInWithPasswordResult) {
          return config.signInWithPasswordResult;
        }
        return {
          data: {
            user: { id: "user-123", email: "test@example.com" },
            session: { access_token: "mock-access-token" },
          },
          error: null,
        };
      },
      signUp: async () => {
        if (config.signUpResult) {
          return config.signUpResult;
        }
        return {
          data: { user: { id: "new-user-123", email: "new@example.com" } },
          error: null,
        };
      },
      signOut: async () => {
        if (config.signOutResult) {
          return config.signOutResult;
        }
        return { error: null };
      },
      getSession: async () => {
        if (config.getSessionResult) {
          return config.getSessionResult;
        }
        return {
          data: {
            session: {
              user: { id: "user-123", email: "test@example.com" },
              access_token: "mock-access-token",
            },
          },
          error: null,
        };
      },
      refreshSession: async () => {
        if (config.refreshSessionResult) {
          return config.refreshSessionResult;
        }
        return {
          data: { session: { access_token: "refreshed-token" } },
          error: null,
        };
      },
      verifyOtp: async () => {
        if (config.verifyOtpResult) {
          return config.verifyOtpResult;
        }
        return {
          data: {
            user: { id: "user-123", email: "test@example.com" },
            session: { access_token: "mock-access-token" },
          },
          error: null,
        };
      },
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
};

// ============================================================================
// Test Suite: AuthN Methods
// ============================================================================

describe("[UNIT] SupabaseAuthGateway - AuthN Methods", () => {
  describe("signInWithPassword", () => {
    it("should succeed with valid credentials", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({});
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.signInWithPassword("test@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.user.id).toBe("user-123");
        expect(either.right.user.email).toBe("test@example.com");
        expect(either.right.session.accessToken).toBe("mock-access-token");
      }
    });

    it("should fail with ApplicationError when Supabase returns error", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signInWithPasswordResult: {
          data: { user: null, session: null },
          error: new Error("Invalid login credentials"),
        },
      });
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.signInWithPassword("test@example.com", "wrongpassword");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ApplicationError);
      }
    });

    it("should fail when no user or session returned", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signInWithPasswordResult: {
          data: { user: null, session: null },
          error: null,
        },
      });
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.signInWithPassword("test@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
    });
  });

  describe("signInWithOtp", () => {
    it("should succeed with valid OTP", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({});
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.signInWithOtp("test@example.com", "123456");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.user.id).toBe("user-123");
        expect(either.right.session.accessToken).toBe("mock-access-token");
      }
    });

    it("should fail when OTP verification fails", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        verifyOtpResult: {
          data: { user: null, session: null },
          error: new Error("Invalid OTP"),
        },
      });
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.signInWithOtp("test@example.com", "wrong-otp");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
    });
  });

  describe("signUp", () => {
    it("should succeed and return user on successful registration", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({});
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.signUp("new@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.user).not.toBeNull();
        expect(either.right.user?.email).toBe("new@example.com");
      }
    });

    it("should succeed with null user when email confirmation required", async () => {
      // Arrange - Supabase returns null user when email confirmation is pending
      const mockSupabase = createMockSupabaseClient({
        signUpResult: { data: { user: null }, error: null },
      });
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.signUp("new@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.user).toBeNull();
      }
    });

    it("should fail when Supabase returns error", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signUpResult: {
          data: null,
          error: new Error("Email already registered"),
        },
      });
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.signUp("existing@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ApplicationError);
      }
    });
  });

  describe("signOut", () => {
    it("should succeed when sign out is successful", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({});
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.signOut();
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
    });

    it("should fail when Supabase returns error", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        signOutResult: { error: new Error("Session not found") },
      });
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.signOut();
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
    });
  });

  describe("getSession", () => {
    it("should succeed and return user and access token when session exists", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({});
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.getSession();
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.user?.id).toBe("user-123");
        expect(either.right.accessToken).toBe("mock-access-token");
      }
    });

    it("should succeed with null user and token when no session exists", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        getSessionResult: { data: { session: null }, error: null },
      });
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.getSession();
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.user).toBeNull();
        expect(either.right.accessToken).toBeNull();
      }
    });

    it("should fail when Supabase returns error", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        getSessionResult: {
          data: null,
          error: new Error("Database connection failed"),
        },
      });
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.getSession();
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
    });
  });

  describe("refreshSession", () => {
    it("should succeed and return new session when refresh is successful", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({});
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.refreshSession();
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.session?.accessToken).toBe("refreshed-token");
      }
    });

    it("should succeed with null session when refresh returns no session", async () => {
      // Arrange - Session expired, can't be refreshed
      const mockSupabase = createMockSupabaseClient({
        refreshSessionResult: { data: { session: null }, error: null },
      });
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.refreshSession();
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.session).toBeNull();
      }
    });

    it("should fail when Supabase returns error", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        refreshSessionResult: {
          data: null,
          error: new Error("Refresh token invalid"),
        },
      });
      const gateway = new SupabaseAuthGateway(mockSupabase);

      // Act
      const effect = gateway.refreshSession();
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
    });
  });
});

// ============================================================================
// Interface Compliance Tests
// ============================================================================

describe("[UNIT] SupabaseAuthGateway - IAuthNPort Compliance", () => {
  it("should implement all 6 IAuthNPort methods", () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({});
    const gateway = new SupabaseAuthGateway(mockSupabase);

    // Assert - All AuthN methods should be defined
    expect(typeof gateway.signInWithPassword).toBe("function");
    expect(typeof gateway.signInWithOtp).toBe("function");
    expect(typeof gateway.signUp).toBe("function");
    expect(typeof gateway.signOut).toBe("function");
    expect(typeof gateway.getSession).toBe("function");
    expect(typeof gateway.refreshSession).toBe("function");
  });

  it("should not have verifyAccess method (moved to UserDrizzleGateway)", () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({});
    const gateway = new SupabaseAuthGateway(mockSupabase);

    // Assert - verifyAccess should not exist on AuthN gateway
    expect("verifyAccess" in gateway).toBe(false);
  });
});
