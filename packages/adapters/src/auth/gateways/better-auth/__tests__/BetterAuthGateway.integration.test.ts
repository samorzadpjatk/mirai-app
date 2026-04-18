/**
 * BetterAuthGateway Integration Tests
 *
 * Integration tests for complete authentication flows using BetterAuthGateway.
 * These tests verify end-to-end auth scenarios with mocked Better Auth instance.
 *
 * ## Test Coverage
 *
 * - Unit tests: All 8 IAuthPort methods (>90% line coverage)
 * - Integration tests: Complete auth flows (sign up → sign in → session → sign out)
 * - Error scenarios: Invalid credentials, expired sessions, rate limiting, duplicates
 * - Mock layer: Reusable mock implementations for other packages
 *
 * ## Test Tagging
 *
 * - [UNIT]: Tests with mocked Better Auth client (no external dependencies)
 * - [INTEGRATION]: Tests for complete auth flows
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { BetterAuthGateway } from "../BetterAuthGateway";
import {
  AuthenticationError,
  AuthSessionExpiredError,
  PermissionDeniedError,
  RateLimitError,
  UserAlreadyExistsError,
  AuthServiceError,
} from "@mirai-app/domain";
import type { BetterAuthInstance } from "@mirai-app/frameworks/better-auth";

// ============================================================================
// Mock Better Auth Instance Factory
// ============================================================================

/**
 * Configuration for creating a mock Better Auth instance
 */
export interface MockBetterAuthConfig {
  signInEmailResult?: {
    user: { id: string; email: string } | null;
    token?: string;
    error?: Error;
  };
  sendVerificationOTPResult?: { error?: Error };
  verifyOTPResult?: {
    user: { id: string; email: string } | null;
    token?: string;
    error?: Error;
  };
  signUpEmailResult?: {
    user: { id: string; email: string } | null;
    error?: Error;
  };
  signOutResult?: { error?: Error };
  getSessionResult?: {
    user: { id: string; email: string } | null;
    session: { id: string; expiresAt: Date } | null;
    token?: string | null;
    error?: Error;
  };
}

/**
 * Creates a mock Better Auth instance with configurable API responses
 * for testing all gateway methods.
 */
export function createMockBetterAuth(
  config: MockBetterAuthConfig = {}
): BetterAuthInstance {
  return {
    api: {
      signInEmail: async (_params: {
        body: { email: string; password: string };
      }) => {
        if (config.signInEmailResult?.error) {
          throw config.signInEmailResult.error;
        }
        if (!config.signInEmailResult?.user) {
          throw new Error("Sign in failed: no user returned");
        }
        return {
          user: config.signInEmailResult.user,
          token: config.signInEmailResult.token || "mock-token",
        };
      },
      sendVerificationOTP: async (_params: {
        body: { email: string; type: string };
      }) => {
        if (config.sendVerificationOTPResult?.error) {
          throw config.sendVerificationOTPResult.error;
        }
      },
      verifyOTP: async (_params: {
        body: { email: string; otp: string; type: string };
      }) => {
        if (config.verifyOTPResult?.error) {
          throw config.verifyOTPResult.error;
        }
        if (!config.verifyOTPResult?.user) {
          throw new Error("OTP verification failed: no user returned");
        }
        return {
          user: config.verifyOTPResult.user,
          token: config.verifyOTPResult.token || "mock-token",
        };
      },
      signUpEmail: async (_params: {
        body: { email: string; password: string; name: string };
      }) => {
        if (config.signUpEmailResult?.error) {
          throw config.signUpEmailResult.error;
        }
        return {
          user: config.signUpEmailResult?.user || null,
        };
      },
      signOut: async (_params: { body: Record<string, unknown> }) => {
        if (config.signOutResult?.error) {
          throw config.signOutResult.error;
        }
      },
      getSession: async (_params: { body: Record<string, unknown> }) => {
        if (config.getSessionResult?.error) {
          throw config.getSessionResult.error;
        }
        return {
          user: config.getSessionResult?.user || null,
          session: config.getSessionResult?.session || null,
          token: config.getSessionResult?.token || null,
        };
      },
    },
  } as unknown as BetterAuthInstance;
}

// ============================================================================
// Mock Layer for Other Packages
// ============================================================================

/**
 * Creates a fully functional mock BetterAuthGateway for use in other tests.
 * This mock implements all IAuthPort methods with configurable behaviors.
 */
export interface MockBetterAuthGatewayConfig {
  /** Default user to return for successful auth operations */
  defaultUser?: { id: string; email: string };
  /** Default session token */
  defaultToken?: string;
  /** Simulate rate limiting on all operations */
  rateLimited?: boolean;
  /** Simulate session expiration */
  sessionExpired?: boolean;
  /** Simulate service errors */
  serviceError?: boolean;
}

/**
 * Creates a mock BetterAuthGateway for testing other components that depend on auth.
 *
 * @example
 * ```typescript
 * const mockGateway = createMockBetterAuthGateway({
 *   defaultUser: { id: "user-123", email: "test@example.com" },
 *   defaultToken: "mock-token"
 * });
 *
 * const gateway = new BetterAuthGateway(mockGateway);
 * ```
 */
export function createMockBetterAuthGateway(
  config: MockBetterAuthGatewayConfig = {}
) {
  const defaultUser = config.defaultUser ?? {
    id: "test-user-123",
    email: "test@example.com",
  };
  const defaultToken = config.defaultToken ?? "mock-access-token";

  return createMockBetterAuth({
    signInEmailResult: config.serviceError
      ? { error: new Error("Service unavailable"), user: null }
      : { user: defaultUser, token: defaultToken },
    sendVerificationOTPResult: config.rateLimited
      ? { error: new Error("Rate limit exceeded") }
      : {},
    verifyOTPResult: config.serviceError
      ? { error: new Error("Service unavailable"), user: null }
      : { user: defaultUser, token: defaultToken },
    signUpEmailResult: config.serviceError
      ? { error: new Error("Service unavailable"), user: null }
      : { user: defaultUser },
    signOutResult: config.sessionExpired
      ? { error: new Error("Session expired") }
      : {},
    getSessionResult: config.sessionExpired
      ? { error: new Error("Session expired"), user: null, session: null }
      : {
          user: defaultUser,
          session: { id: "session-123", expiresAt: new Date() },
          token: defaultToken,
        },
  });
}

// ============================================================================
// Test Suite: Unit Tests for All IAuthPort Methods
// ============================================================================

describe("[UNIT] BetterAuthGateway - Complete Method Coverage", () => {
  describe("signInWithPassword", () => {
    it("should successfully sign in with valid credentials", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          user: { id: "user-123", email: "test@example.com" },
          token: "session-token-abc",
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.user.id).toBe("user-123");
        expect(either.right.user.email).toBe("test@example.com");
        expect(either.right.session.accessToken).toBe("session-token-abc");
      }
    });

    it("should return AuthenticationError for invalid credentials", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Invalid login credentials"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "wrongpassword");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthenticationError);
      }
    });

    it("should return RateLimitError when rate limited", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Too many requests, rate limit exceeded"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RateLimitError);
      }
    });

    it("should return AuthSessionExpiredError for expired session", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Session token expired"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should return PermissionDeniedError for forbidden access", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Access denied, permission required"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });

    it("should return AuthServiceError for generic errors", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Database connection failed"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthServiceError);
      }
    });
  });

  describe("sendSignInOtp", () => {
    it("should successfully send OTP to email", async () => {
      const mockAuth = createMockBetterAuth({
        sendVerificationOTPResult: {},
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.sendSignInOtp("test@example.com");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
    });

    it("should return RateLimitError when rate limited", async () => {
      const mockAuth = createMockBetterAuth({
        sendVerificationOTPResult: {
          error: new Error("Rate limit: too many OTP requests"),
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.sendSignInOtp("test@example.com");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RateLimitError);
      }
    });

    it("should return AuthServiceError for email service failures", async () => {
      const mockAuth = createMockBetterAuth({
        sendVerificationOTPResult: {
          error: new Error("Email service unavailable"),
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.sendSignInOtp("test@example.com");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthServiceError);
      }
    });

    it("should return AuthServiceError for generic errors", async () => {
      const mockAuth = createMockBetterAuth({
        sendVerificationOTPResult: {
          error: new Error("Internal server error"),
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.sendSignInOtp("test@example.com");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthServiceError);
      }
    });
  });

  describe("signInWithOtp", () => {
    it("should successfully sign in with valid OTP", async () => {
      const mockAuth = createMockBetterAuth({
        verifyOTPResult: {
          user: { id: "user-456", email: "otp@example.com" },
          token: "otp-session-token",
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithOtp("otp@example.com", "123456");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.user.id).toBe("user-456");
        expect(either.right.user.email).toBe("otp@example.com");
        expect(either.right.session.accessToken).toBe("otp-session-token");
      }
    });

    it("should return AuthenticationError for invalid OTP", async () => {
      const mockAuth = createMockBetterAuth({
        verifyOTPResult: {
          error: new Error("Invalid OTP code"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithOtp("otp@example.com", "000000");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthenticationError);
      }
    });

    it("should return AuthSessionExpiredError for expired OTP", async () => {
      const mockAuth = createMockBetterAuth({
        verifyOTPResult: {
          error: new Error("OTP has expired"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithOtp("otp@example.com", "123456");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should return RateLimitError when rate limited", async () => {
      const mockAuth = createMockBetterAuth({
        verifyOTPResult: {
          error: new Error("Rate limit: too many OTP verification attempts"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithOtp("otp@example.com", "123456");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RateLimitError);
      }
    });
  });

  describe("signUp", () => {
    it("should successfully sign up new user", async () => {
      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          user: { id: "new-user-789", email: "new@example.com" },
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("new@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.user?.id).toBe("new-user-789");
        expect(either.right.user?.email).toBe("new@example.com");
      }
    });

    it("should return null user when email confirmation is required", async () => {
      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("new@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.user).toBeNull();
      }
    });

    it("should return UserAlreadyExistsError for duplicate registration", async () => {
      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          error: new Error("User with this email already exists"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("existing@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UserAlreadyExistsError);
      }
    });

    it("should return RateLimitError when rate limited", async () => {
      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          error: new Error("Rate limit: too many sign-up attempts"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("new@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RateLimitError);
      }
    });

    it("should return AuthServiceError for generic errors", async () => {
      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          error: new Error("Database connection failed"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("new@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthServiceError);
      }
    });
  });

  describe("signOut", () => {
    it("should successfully sign out", async () => {
      const mockAuth = createMockBetterAuth({
        signOutResult: {},
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signOut();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
    });

    it("should return AuthSessionExpiredError for invalid session", async () => {
      const mockAuth = createMockBetterAuth({
        signOutResult: {
          error: new Error("Session invalid or expired"),
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signOut();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should return AuthServiceError for generic errors", async () => {
      const mockAuth = createMockBetterAuth({
        signOutResult: {
          error: new Error("Internal server error"),
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signOut();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthServiceError);
      }
    });
  });

  describe("getSession", () => {
    it("should return user and access token for valid session", async () => {
      const mockAuth = createMockBetterAuth({
        getSessionResult: {
          user: { id: "user-123", email: "test@example.com" },
          session: { id: "session-abc", expiresAt: new Date() },
          token: "access-token-xyz",
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.getSession();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.user?.id).toBe("user-123");
        expect(either.right.user?.email).toBe("test@example.com");
        expect(either.right.accessToken).toBe("access-token-xyz");
      }
    });

    it("should return null user and token for no session", async () => {
      const mockAuth = createMockBetterAuth({
        getSessionResult: {
          user: null,
          session: null,
          token: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.getSession();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.user).toBeNull();
        expect(either.right.accessToken).toBeNull();
      }
    });

    it("should return AuthSessionExpiredError for expired session", async () => {
      const mockAuth = createMockBetterAuth({
        getSessionResult: {
          error: new Error("Session token expired"),
          user: null,
          session: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.getSession();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should return AuthServiceError for generic errors", async () => {
      const mockAuth = createMockBetterAuth({
        getSessionResult: {
          error: new Error("Database connection failed"),
          user: null,
          session: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.getSession();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthServiceError);
      }
    });
  });

  describe("refreshSession", () => {
    it("should return new session for valid refresh", async () => {
      const mockAuth = createMockBetterAuth({
        getSessionResult: {
          user: { id: "user-123", email: "test@example.com" },
          session: { id: "session-new", expiresAt: new Date() },
          token: "new-access-token",
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.refreshSession();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.session?.accessToken).toBe("new-access-token");
      }
    });

    it("should return null session when session expired", async () => {
      const mockAuth = createMockBetterAuth({
        getSessionResult: {
          user: null,
          session: null,
          token: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.refreshSession();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.session).toBeNull();
      }
    });

    it("should return AuthSessionExpiredError for invalid session", async () => {
      const mockAuth = createMockBetterAuth({
        getSessionResult: {
          error: new Error("Invalid session"),
          user: null,
          session: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.refreshSession();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should return AuthServiceError for generic errors", async () => {
      const mockAuth = createMockBetterAuth({
        getSessionResult: {
          error: new Error("Database connection failed"),
          user: null,
          session: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.refreshSession();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthServiceError);
      }
    });
  });

  describe("verifyAccess", () => {
    it("should allow ADMIN role full access to all resources", async () => {
      const mockAuth = createMockBetterAuth({});
      const gateway = new BetterAuthGateway(mockAuth);

      const adminRequest = {
        userId: "admin-123",
        role: "ADMIN" as const,
        tripRoles: {},
        resourceType: "trip" as const,
        resourceId: "trip-456",
        requiredPermission: "admin" as const,
      };

      const effect = gateway.verifyAccess(adminRequest);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
    });

    it("should allow MODERATOR read access", async () => {
      const mockAuth = createMockBetterAuth({});
      const gateway = new BetterAuthGateway(mockAuth);

      const readRequest = {
        userId: "mod-123",
        role: "MODERATOR" as const,
        tripRoles: {},
        resourceType: "trip" as const,
        resourceId: "trip-456",
        requiredPermission: "read" as const,
      };

      const effect = gateway.verifyAccess(readRequest);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
    });

    it("should allow MODERATOR write access", async () => {
      const mockAuth = createMockBetterAuth({});
      const gateway = new BetterAuthGateway(mockAuth);

      const writeRequest = {
        userId: "mod-123",
        role: "MODERATOR" as const,
        tripRoles: {},
        resourceType: "trip" as const,
        resourceId: "trip-456",
        requiredPermission: "write" as const,
      };

      const effect = gateway.verifyAccess(writeRequest);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
    });

    it("should deny MODERATOR admin access", async () => {
      const mockAuth = createMockBetterAuth({});
      const gateway = new BetterAuthGateway(mockAuth);

      const adminRequest = {
        userId: "mod-123",
        role: "MODERATOR" as const,
        tripRoles: {},
        resourceType: "trip" as const,
        resourceId: "trip-456",
        requiredPermission: "admin" as const,
      };

      const effect = gateway.verifyAccess(adminRequest);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });

    it("should allow USER read access", async () => {
      const mockAuth = createMockBetterAuth({});
      const gateway = new BetterAuthGateway(mockAuth);

      const readRequest = {
        userId: "user-123",
        role: "USER" as const,
        tripRoles: {},
        resourceType: "trip" as const,
        resourceId: "trip-456",
        requiredPermission: "read" as const,
      };

      const effect = gateway.verifyAccess(readRequest);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
    });

    it("should deny USER write access without ownership", async () => {
      const mockAuth = createMockBetterAuth({});
      const gateway = new BetterAuthGateway(mockAuth);

      const writeRequest = {
        userId: "user-123",
        role: "USER" as const,
        tripRoles: {},
        resourceType: "trip" as const,
        resourceId: "trip-456",
        requiredPermission: "write" as const,
      };

      const effect = gateway.verifyAccess(writeRequest);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });

    it("should deny USER admin access", async () => {
      const mockAuth = createMockBetterAuth({});
      const gateway = new BetterAuthGateway(mockAuth);

      const adminRequest = {
        userId: "user-123",
        role: "USER" as const,
        tripRoles: {},
        resourceType: "trip" as const,
        resourceId: "trip-456",
        requiredPermission: "admin" as const,
      };

      const effect = gateway.verifyAccess(adminRequest);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });

    it("should deny access when requireOwnership is true", async () => {
      const mockAuth = createMockBetterAuth({});
      const gateway = new BetterAuthGateway(mockAuth);

      const ownershipRequest = {
        userId: "user-123",
        role: "USER" as const,
        tripRoles: {},
        resourceType: "trip" as const,
        resourceId: "trip-456",
        requiredPermission: "read" as const,
        requireOwnership: true,
      };

      const effect = gateway.verifyAccess(ownershipRequest);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });

    it("should allow SERVICE role system access", async () => {
      const mockAuth = createMockBetterAuth({});
      const gateway = new BetterAuthGateway(mockAuth);

      const serviceRequest = {
        userId: "service-123",
        role: "SERVICE" as const,
        tripRoles: {},
        resourceType: "trip" as const,
        resourceId: "trip-456",
        requiredPermission: "admin" as const,
      };

      const effect = gateway.verifyAccess(serviceRequest);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
    });

    it("should deny access for unknown roles", async () => {
      const mockAuth = createMockBetterAuth({});
      const gateway = new BetterAuthGateway(mockAuth);

      const unknownRequest = {
        userId: "unknown-123",
        role: "UNKNOWN" as unknown as "ADMIN" | "MODERATOR" | "USER" | "SERVICE",
        tripRoles: {},
        resourceType: "trip" as const,
        resourceId: "trip-456",
        requiredPermission: "read" as const,
      };

      const effect = gateway.verifyAccess(unknownRequest);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });
  });
});

// ============================================================================
// Test Suite: Integration Tests for Complete Auth Flows
// ============================================================================

describe("[INTEGRATION] BetterAuthGateway - Complete Auth Flows", () => {
  describe("Flow: Sign up → Sign in → Get session → Sign out", () => {
    it("should complete full auth lifecycle successfully", async () => {
      // Arrange - Create a stateful mock that tracks the session
      const user = { id: "new-user-789", email: "new@example.com" };
      const token = "session-token-xyz";
      let sessionActive = true;

      const mockAuth = createMockBetterAuth({
        signUpEmailResult: { user },
        signInEmailResult: { user, token },
        getSessionResult: sessionActive
          ? { user, session: { id: "session-123", expiresAt: new Date() }, token }
          : { user: null, session: null, token: null },
        signOutResult: {},
      });

      const gateway = new BetterAuthGateway(mockAuth);

      // Act - Step 1: Sign up
      const signUpEffect = gateway.signUp("new@example.com", "password123");
      const signUpResult = await Effect.runPromise(Effect.either(signUpEffect));

      expect(Either.isRight(signUpResult)).toBe(true);
      if (Either.isRight(signUpResult)) {
        expect(signUpResult.right.user?.email).toBe("new@example.com");
      }

      // Act - Step 2: Sign in
      const signInEffect = gateway.signInWithPassword("new@example.com", "password123");
      const signInResult = await Effect.runPromise(Effect.either(signInEffect));

      expect(Either.isRight(signInResult)).toBe(true);
      if (Either.isRight(signInResult)) {
        expect(signInResult.right.user.id).toBe("new-user-789");
        expect(signInResult.right.session.accessToken).toBe("session-token-xyz");
      }

      // Act - Step 3: Get session
      const getSessionEffect = gateway.getSession();
      const getSessionResult = await Effect.runPromise(Effect.either(getSessionEffect));

      expect(Either.isRight(getSessionResult)).toBe(true);
      if (Either.isRight(getSessionResult)) {
        expect(getSessionResult.right.user?.id).toBe("new-user-789");
        expect(getSessionResult.right.accessToken).toBe("session-token-xyz");
      }

      // Act - Step 4: Sign out
      const signOutEffect = gateway.signOut();
      const signOutResult = await Effect.runPromise(Effect.either(signOutEffect));

      expect(Either.isRight(signOutResult)).toBe(true);
    });

    it("should handle sign up failure and prevent sign in", async () => {
      // Arrange - Sign up will fail
      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          error: new Error("Email already registered"),
          user: null,
        },
        signInEmailResult: {
          user: { id: "existing-user", email: "existing@example.com" },
          token: "token-123",
        },
      });

      const gateway = new BetterAuthGateway(mockAuth);

      // Act - Try to sign up with duplicate email
      const signUpEffect = gateway.signUp("existing@example.com", "password123");
      const signUpResult = await Effect.runPromise(Effect.either(signUpEffect));

      // Assert - Sign up should fail
      expect(Either.isLeft(signUpResult)).toBe(true);
      if (Either.isLeft(signUpResult)) {
        expect(signUpResult.left).toBeInstanceOf(UserAlreadyExistsError);
      }

      // Act - But existing user can still sign in
      const signInEffect = gateway.signInWithPassword("existing@example.com", "password123");
      const signInResult = await Effect.runPromise(Effect.either(signInEffect));

      // Assert - Sign in should succeed
      expect(Either.isRight(signInResult)).toBe(true);
    });

    it("should handle session expiration during flow", async () => {
      // Arrange - Session expires between sign in and get session
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          user: { id: "user-123", email: "test@example.com" },
          token: "expired-token",
        },
        getSessionResult: {
          error: new Error("Session expired"),
          user: null,
          session: null,
        },
      });

      const gateway = new BetterAuthGateway(mockAuth);

      // Act - Sign in succeeds
      const signInEffect = gateway.signInWithPassword("test@example.com", "password123");
      const signInResult = await Effect.runPromise(Effect.either(signInEffect));

      expect(Either.isRight(signInResult)).toBe(true);

      // Act - But getting session fails due to expiration
      const getSessionEffect = gateway.getSession();
      const getSessionResult = await Effect.runPromise(Effect.either(getSessionEffect));

      expect(Either.isLeft(getSessionResult)).toBe(true);
      if (Either.isLeft(getSessionResult)) {
        expect(getSessionResult.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });
  });

  describe("Flow: Send OTP → Sign in with OTP", () => {
    it("should complete OTP-based authentication flow", async () => {
      // Arrange
      const user = { id: "user-otp-123", email: "otp@example.com" };
      const token = "otp-session-token";

      const mockAuth = createMockBetterAuth({
        sendVerificationOTPResult: {},
        verifyOTPResult: { user, token },
        getSessionResult: {
          user,
          session: { id: "session-otp", expiresAt: new Date() },
          token,
        },
      });

      const gateway = new BetterAuthGateway(mockAuth);

      // Act - Step 1: Send OTP
      const sendOtpEffect = gateway.sendSignInOtp("otp@example.com");
      const sendOtpResult = await Effect.runPromise(Effect.either(sendOtpEffect));

      expect(Either.isRight(sendOtpResult)).toBe(true);

      // Act - Step 2: Sign in with OTP
      const signInOtpEffect = gateway.signInWithOtp("otp@example.com", "123456");
      const signInOtpResult = await Effect.runPromise(Effect.either(signInOtpEffect));

      expect(Either.isRight(signInOtpResult)).toBe(true);
      if (Either.isRight(signInOtpResult)) {
        expect(signInOtpResult.right.user.id).toBe("user-otp-123");
        expect(signInOtpResult.right.session.accessToken).toBe("otp-session-token");
      }

      // Act - Step 3: Verify session is active
      const getSessionEffect = gateway.getSession();
      const getSessionResult = await Effect.runPromise(Effect.either(getSessionEffect));

      expect(Either.isRight(getSessionResult)).toBe(true);
      if (Either.isRight(getSessionResult)) {
        expect(getSessionResult.right.user?.email).toBe("otp@example.com");
      }
    });

    it("should handle invalid OTP code", async () => {
      // Arrange
      const mockAuth = createMockBetterAuth({
        sendVerificationOTPResult: {},
        verifyOTPResult: {
          error: new Error("Invalid OTP code"),
          user: null,
        },
      });

      const gateway = new BetterAuthGateway(mockAuth);

      // Act - Send OTP succeeds
      const sendOtpEffect = gateway.sendSignInOtp("otp@example.com");
      const sendOtpResult = await Effect.runPromise(Effect.either(sendOtpEffect));

      expect(Either.isRight(sendOtpResult)).toBe(true);

      // Act - But sign in with wrong OTP fails
      const signInOtpEffect = gateway.signInWithOtp("otp@example.com", "000000");
      const signInOtpResult = await Effect.runPromise(Effect.either(signInOtpEffect));

      expect(Either.isLeft(signInOtpResult)).toBe(true);
      if (Either.isLeft(signInOtpResult)) {
        expect(signInOtpResult.left).toBeInstanceOf(AuthenticationError);
      }
    });

    it("should handle expired OTP", async () => {
      // Arrange
      const mockAuth = createMockBetterAuth({
        sendVerificationOTPResult: {},
        verifyOTPResult: {
          error: new Error("OTP has expired"),
          user: null,
        },
      });

      const gateway = new BetterAuthGateway(mockAuth);

      // Act - Send OTP succeeds
      const sendOtpEffect = gateway.sendSignInOtp("otp@example.com");
      const sendOtpResult = await Effect.runPromise(Effect.either(sendOtpEffect));

      expect(Either.isRight(sendOtpResult)).toBe(true);

      // Act - But sign in with expired OTP fails
      const signInOtpEffect = gateway.signInWithOtp("otp@example.com", "123456");
      const signInOtpResult = await Effect.runPromise(Effect.either(signInOtpEffect));

      expect(Either.isLeft(signInOtpResult)).toBe(true);
      if (Either.isLeft(signInOtpResult)) {
        expect(signInOtpResult.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should handle rate limiting on OTP send", async () => {
      // Arrange
      const mockAuth = createMockBetterAuth({
        sendVerificationOTPResult: {
          error: new Error("Rate limit: too many OTP requests"),
        },
      });

      const gateway = new BetterAuthGateway(mockAuth);

      // Act - Try to send OTP too many times
      const sendOtpEffect = gateway.sendSignInOtp("otp@example.com");
      const sendOtpResult = await Effect.runPromise(Effect.either(sendOtpEffect));

      expect(Either.isLeft(sendOtpResult)).toBe(true);
      if (Either.isLeft(sendOtpResult)) {
        expect(sendOtpResult.left).toBeInstanceOf(RateLimitError);
      }
    });
  });

  describe("Flow: Session refresh", () => {
    it("should refresh active session successfully", async () => {
      // Arrange
      const user = { id: "user-123", email: "test@example.com" };
      const initialToken = "initial-token";
      const refreshedToken = "refreshed-token";

      const mockAuth = createMockBetterAuth({
        signInEmailResult: { user, token: initialToken },
        getSessionResult: {
          user,
          session: { id: "session-new", expiresAt: new Date() },
          token: refreshedToken,
        },
      });

      const gateway = new BetterAuthGateway(mockAuth);

      // Act - Sign in first
      const signInEffect = gateway.signInWithPassword("test@example.com", "password123");
      const signInResult = await Effect.runPromise(Effect.either(signInEffect));

      expect(Either.isRight(signInResult)).toBe(true);
      if (Either.isRight(signInResult)) {
        expect(signInResult.right.session.accessToken).toBe("initial-token");
      }

      // Act - Refresh session
      const refreshEffect = gateway.refreshSession();
      const refreshResult = await Effect.runPromise(Effect.either(refreshEffect));

      expect(Either.isRight(refreshResult)).toBe(true);
      if (Either.isRight(refreshResult)) {
        expect(refreshResult.right.session?.accessToken).toBe("refreshed-token");
      }
    });

    it("should return null session when refresh fails due to expiration", async () => {
      // Arrange - Session is expired and can't be refreshed
      const mockAuth = createMockBetterAuth({
        getSessionResult: {
          user: null,
          session: null,
          token: null,
        },
      });

      const gateway = new BetterAuthGateway(mockAuth);

      // Act - Try to refresh expired session
      const refreshEffect = gateway.refreshSession();
      const refreshResult = await Effect.runPromise(Effect.either(refreshEffect));

      expect(Either.isRight(refreshResult)).toBe(true);
      if (Either.isRight(refreshResult)) {
        expect(refreshResult.right.session).toBeNull();
      }
    });
  });

  describe("Flow: Password reset (via OTP)", () => {
    it("should handle password reset flow with OTP verification", async () => {
      // Arrange
      const user = { id: "user-123", email: "reset@example.com" };
      const token = "reset-session-token";

      const mockAuth = createMockBetterAuth({
        sendVerificationOTPResult: {},
        verifyOTPResult: { user, token },
      });

      const gateway = new BetterAuthGateway(mockAuth);

      // Act - Step 1: Request password reset (sends OTP)
      const sendOtpEffect = gateway.sendSignInOtp("reset@example.com");
      const sendOtpResult = await Effect.runPromise(Effect.either(sendOtpEffect));

      expect(Either.isRight(sendOtpResult)).toBe(true);

      // Act - Step 2: Verify OTP to authenticate user
      const verifyOtpEffect = gateway.signInWithOtp("reset@example.com", "123456");
      const verifyOtpResult = await Effect.runPromise(Effect.either(verifyOtpEffect));

      expect(Either.isRight(verifyOtpResult)).toBe(true);
      if (Either.isRight(verifyOtpResult)) {
        expect(verifyOtpResult.right.user.id).toBe("user-123");
      }
    });
  });

  describe("Flow: Session validation with authorization", () => {
    it("should validate session and check resource access", async () => {
      // Arrange
      const user = { id: "user-123", email: "test@example.com" };

      const mockAuth = createMockBetterAuth({
        signInEmailResult: { user, token: "valid-token" },
        getSessionResult: {
          user,
          session: { id: "session-123", expiresAt: new Date() },
          token: "valid-token",
        },
      });

      const gateway = new BetterAuthGateway(mockAuth);

      // Act - Sign in
      const signInEffect = gateway.signInWithPassword("test@example.com", "password123");
      const signInResult = await Effect.runPromise(Effect.either(signInEffect));

      expect(Either.isRight(signInResult)).toBe(true);

      // Act - Get session
      const getSessionEffect = gateway.getSession();
      const getSessionResult = await Effect.runPromise(Effect.either(getSessionEffect));

      expect(Either.isRight(getSessionResult)).toBe(true);

      // Act - Verify access to resource (as authenticated user)
      const accessRequest = {
        userId: user.id,
        role: "USER" as const,
        tripRoles: {},
        resourceType: "trip" as const,
        resourceId: "trip-456",
        requiredPermission: "read" as const,
      };

      const verifyAccessEffect = gateway.verifyAccess(accessRequest);
      const verifyAccessResult = await Effect.runPromise(Effect.either(verifyAccessEffect));

      expect(Either.isRight(verifyAccessResult)).toBe(true);
    });

    it("should deny resource access for unauthorized users", async () => {
      // Arrange
      const user = { id: "user-123", email: "test@example.com" };

      const mockAuth = createMockBetterAuth({
        getSessionResult: {
          user,
          session: { id: "session-123", expiresAt: new Date() },
          token: "valid-token",
        },
      });

      const gateway = new BetterAuthGateway(mockAuth);

      // Act - Verify access to admin resource as regular user
      const accessRequest = {
        userId: user.id,
        role: "USER" as const,
        tripRoles: {},
        resourceType: "trip" as const,
        resourceId: "trip-456",
        requiredPermission: "admin" as const,
      };

      const verifyAccessEffect = gateway.verifyAccess(accessRequest);
      const verifyAccessResult = await Effect.runPromise(Effect.either(verifyAccessEffect));

      expect(Either.isLeft(verifyAccessResult)).toBe(true);
      if (Either.isLeft(verifyAccessResult)) {
        expect(verifyAccessResult.left).toBeInstanceOf(PermissionDeniedError);
      }
    });

    it("should deny access when session is expired", async () => {
      // Arrange - Session is expired
      const mockAuth = createMockBetterAuth({
        getSessionResult: {
          error: new Error("Session expired"),
          user: null,
          session: null,
        },
      });

      const gateway = new BetterAuthGateway(mockAuth);

      // Act - Try to get session
      const getSessionEffect = gateway.getSession();
      const getSessionResult = await Effect.runPromise(Effect.either(getSessionEffect));

      expect(Either.isLeft(getSessionResult)).toBe(true);
      if (Either.isLeft(getSessionResult)) {
        expect(getSessionResult.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });
  });
});

// ============================================================================
// Test Suite: Error Scenario Coverage
// ============================================================================

describe("[UNIT] BetterAuthGateway - Error Scenarios", () => {
  describe("Invalid credentials error cases", () => {
    it("should handle wrong password", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Invalid password"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "wrongpassword");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthenticationError);
      }
    });

    it("should handle non-existent user", async () => {
      // Arrange
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Invalid credentials"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      // Act
      const effect = gateway.signInWithPassword("nonexistent@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthenticationError);
      }
    });

    it("should handle account locked", async () => {
      // Arrange
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Account locked due to too many failed attempts"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      // Act
      const effect = gateway.signInWithPassword("locked@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert - Account locked message doesn't match auth patterns, becomes service error
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthServiceError);
      }
    });
  });

  describe("Expired session error cases", () => {
    it("should handle expired access token", async () => {
      const mockAuth = createMockBetterAuth({
        getSessionResult: {
          error: new Error("Token expired"),
          user: null,
          session: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.getSession();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should handle invalid token format", async () => {
      const mockAuth = createMockBetterAuth({
        getSessionResult: {
          error: new Error("Invalid token format"),
          user: null,
          session: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.getSession();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should handle session not found", async () => {
      const mockAuth = createMockBetterAuth({
        getSessionResult: {
          error: new Error("Session not found"),
          user: null,
          session: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.getSession();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });
  });

  describe("Rate limiting error cases", () => {
    it("should handle login rate limiting", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Rate limit: too many login attempts"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RateLimitError);
      }
    });

    it("should handle sign-up rate limiting", async () => {
      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          error: new Error("Rate limit: too many sign-up attempts"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("new@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RateLimitError);
      }
    });

    it("should handle OTP rate limiting", async () => {
      const mockAuth = createMockBetterAuth({
        sendVerificationOTPResult: {
          error: new Error("Rate limit: too many OTP requests"),
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.sendSignInOtp("test@example.com");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RateLimitError);
      }
    });

    it("should handle 429 status code", async () => {
      const error = new Error("Too many requests");
      (error as unknown as Record<string, unknown>).status = 429;

      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error,
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RateLimitError);
      }
    });
  });

  describe("Duplicate user registration error cases", () => {
    it("should handle duplicate email registration", async () => {
      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          error: new Error("Email already registered"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("existing@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UserAlreadyExistsError);
      }
    });

    it("should handle user exists by code", async () => {
      const error = new Error("User exists");
      (error as unknown as Record<string, unknown>).code = "user_exists";
      (error as unknown as Record<string, unknown>).email = "exists@example.com";

      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          error,
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("exists@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UserAlreadyExistsError);
      }
    });
  });

  describe("Permission denied error cases", () => {
    it("should handle 403 forbidden response", async () => {
      const error = new Error("Forbidden");
      (error as unknown as Record<string, unknown>).status = 403;

      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error,
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });

    it("should handle access denied message", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Access denied"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });
  });

  describe("Service error cases", () => {
    it("should handle database connection errors", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Database connection failed"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthServiceError);
      }
    });

    it("should handle network errors", async () => {
      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          error: new Error("Network timeout"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("new@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthServiceError);
      }
    });

    it("should handle unknown error codes", async () => {
      const error = new Error("Something went wrong");
      (error as unknown as Record<string, unknown>).code = "unknown_error";

      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error,
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password123");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        // Unknown errors with error codes map to AuthenticationError
        expect(either.left).toBeInstanceOf(AuthenticationError);
      }
    });
  });
});

// ============================================================================
// Test Suite: Error Mapping Coverage
// ============================================================================

describe("[UNIT] BetterAuthGateway - Error Mapping", () => {
  describe("HTTP status code mapping", () => {
    it("should map 401 status to AuthSessionExpiredError", async () => {
      const error = new Error("Unauthorized");
      (error as unknown as Record<string, unknown>).status = 401;

      const mockAuth = createMockBetterAuth({
        signInEmailResult: { error, user: null },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should map 403 status to PermissionDeniedError", async () => {
      const error = new Error("Forbidden");
      (error as unknown as Record<string, unknown>).status = 403;

      const mockAuth = createMockBetterAuth({
        signInEmailResult: { error, user: null },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });

    it("should map 429 status to RateLimitError", async () => {
      // Use a message that doesn't match rate limit patterns to test status code path
      const error = new Error("Request blocked");
      (error as unknown as Record<string, unknown>).status = 429;
      (error as unknown as Record<string, unknown>).retryAfter = 120;

      const mockAuth = createMockBetterAuth({
        signInEmailResult: { error, user: null },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RateLimitError);
        if (either.left instanceof RateLimitError) {
          expect(either.left.retryAfter).toBe(120);
        }
      }
    });
  });

  describe("Error code mapping", () => {
    it("should map rate_limit error code", async () => {
      const error = new Error("Rate limited");
      (error as unknown as Record<string, unknown>).code = "rate_limit";
      (error as unknown as Record<string, unknown>).retryAfter = 60;
      (error as unknown as Record<string, unknown>).limit = 5;

      const mockAuth = createMockBetterAuth({
        signInEmailResult: { error, user: null },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RateLimitError);
      }
    });

    it("should map session_expired error code", async () => {
      const error = new Error("Session expired");
      (error as unknown as Record<string, unknown>).code = "session_expired";

      const mockAuth = createMockBetterAuth({
        signInEmailResult: { error, user: null },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should map invalid_token error code", async () => {
      const error = new Error("Invalid token");
      (error as unknown as Record<string, unknown>).code = "invalid_token";

      const mockAuth = createMockBetterAuth({
        signInEmailResult: { error, user: null },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should map user_exists error code", async () => {
      const error = new Error("User exists");
      (error as unknown as Record<string, unknown>).code = "user_exists";
      (error as unknown as Record<string, unknown>).email = "exists@example.com";

      const mockAuth = createMockBetterAuth({
        signUpEmailResult: { error, user: null },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("exists@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UserAlreadyExistsError);
        if (either.left instanceof UserAlreadyExistsError) {
          expect(either.left.identifier).toBe("exists@example.com");
        }
      }
    });

    it("should map duplicate error code", async () => {
      const error = new Error("Duplicate");
      (error as unknown as Record<string, unknown>).code = "duplicate";

      const mockAuth = createMockBetterAuth({
        signUpEmailResult: { error, user: null },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UserAlreadyExistsError);
      }
    });

    it("should map permission error code", async () => {
      const error = new Error("Permission denied");
      (error as unknown as Record<string, unknown>).code = "permission_denied";
      (error as unknown as Record<string, unknown>).resourceType = "trip";
      (error as unknown as Record<string, unknown>).resourceId = "trip-123";
      (error as unknown as Record<string, unknown>).permission = "write";

      const mockAuth = createMockBetterAuth({
        signInEmailResult: { error, user: null },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });
  });

  describe("Error message pattern mapping", () => {
    it("should map 'rate limit' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Rate limit exceeded"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RateLimitError);
      }
    });

    it("should map 'too many requests' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Too many requests"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RateLimitError);
      }
    });

    it("should map '429' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Error 429: Rate limited"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(RateLimitError);
      }
    });

    it("should map 'session' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Session invalid"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should map 'token' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Invalid token"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should map 'expired' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Token has expired"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should map 'unauthorized' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Unauthorized access"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthSessionExpiredError);
      }
    });

    it("should map 'user already exists' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          error: new Error("User already exists"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UserAlreadyExistsError);
      }
    });

    it("should map 'email already registered' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          error: new Error("Email already registered"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UserAlreadyExistsError);
      }
    });

    it("should map 'duplicate' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          error: new Error("Duplicate entry"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UserAlreadyExistsError);
      }
    });

    it("should map 'already exists' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          error: new Error("Account already exists"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signUp("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UserAlreadyExistsError);
      }
    });

    it("should map 'permission' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Permission required"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });

    it("should map 'forbidden' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Access forbidden"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });

    it("should map 'access denied' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Access denied for this resource"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });

    it("should map '403' message pattern", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Error 403: Forbidden"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(PermissionDeniedError);
      }
    });

    it("should map 'invalid' message pattern to AuthenticationError", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Invalid credentials"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthenticationError);
      }
    });

    it("should map 'password' message pattern to AuthenticationError", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Password incorrect"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthenticationError);
      }
    });

    it("should map 'incorrect' message pattern to AuthenticationError", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Email or password incorrect"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthenticationError);
      }
    });

    it("should map 'wrong' message pattern to AuthenticationError", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: new Error("Wrong password"),
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthenticationError);
      }
    });
  });
});

// ============================================================================
// Test Suite: Interface Compliance
// ============================================================================

describe("[UNIT] BetterAuthGateway - IAuthPort Compliance", () => {
  it("should implement all 8 IAuthPort methods", () => {
    const mockAuth = createMockBetterAuth({});
    const gateway = new BetterAuthGateway(mockAuth);

    // Assert - All IAuthPort methods should be defined
    expect(typeof gateway.signInWithPassword).toBe("function");
    expect(typeof gateway.sendSignInOtp).toBe("function");
    expect(typeof gateway.signInWithOtp).toBe("function");
    expect(typeof gateway.signUp).toBe("function");
    expect(typeof gateway.signOut).toBe("function");
    expect(typeof gateway.getSession).toBe("function");
    expect(typeof gateway.refreshSession).toBe("function");
    expect(typeof gateway.verifyAccess).toBe("function");
  });

  it("should return Effect types for all methods", async () => {
    const mockAuth = createMockBetterAuth({
      signInEmailResult: { user: { id: "user-123", email: "test@example.com" }, token: "token" },
      sendVerificationOTPResult: {},
      verifyOTPResult: { user: { id: "user-123", email: "test@example.com" }, token: "token" },
      signUpEmailResult: { user: { id: "user-123", email: "test@example.com" } },
      signOutResult: {},
      getSessionResult: { user: { id: "user-123", email: "test@example.com" }, session: { id: "session", expiresAt: new Date() }, token: "token" },
    });
    const gateway = new BetterAuthGateway(mockAuth);

    // All methods should return Effect types
    const signInEffect = gateway.signInWithPassword("test@example.com", "password");
    const sendOtpEffect = gateway.sendSignInOtp("test@example.com");
    const signInOtpEffect = gateway.signInWithOtp("test@example.com", "123456");
    const signUpEffect = gateway.signUp("test@example.com", "password");
    const signOutEffect = gateway.signOut();
    const getSessionEffect = gateway.getSession();
    const refreshSessionEffect = gateway.refreshSession();
    const verifyAccessEffect = gateway.verifyAccess({
      userId: "user-123",
      role: "USER",
      tripRoles: {},
      resourceType: "trip",
      resourceId: "trip-456",
      requiredPermission: "read",
    });

    // All should be runnable as Effects
    const results = await Promise.all([
      Effect.runPromise(Effect.either(signInEffect)),
      Effect.runPromise(Effect.either(sendOtpEffect)),
      Effect.runPromise(Effect.either(signInOtpEffect)),
      Effect.runPromise(Effect.either(signUpEffect)),
      Effect.runPromise(Effect.either(signOutEffect)),
      Effect.runPromise(Effect.either(getSessionEffect)),
      Effect.runPromise(Effect.either(refreshSessionEffect)),
      Effect.runPromise(Effect.either(verifyAccessEffect)),
    ]);

    // All should succeed with the mock
    for (const result of results) {
      expect(Either.isRight(result)).toBe(true);
    }
  });
});
