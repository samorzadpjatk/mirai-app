import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { BetterAuthGateway } from "./BetterAuthGateway";
import {
  AuthenticationError,
  AuthSessionExpiredError,
  PermissionDeniedError,
  RateLimitError,
  UserAlreadyExistsError,
  AuthServiceError,
} from "@mirai-app/domain";

/**
 * Mock Better Auth Instance
 *
 * Creates a mock Better Auth instance with configurable API responses
 * for testing all gateway methods.
 */
function createMockBetterAuth(config: {
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
} = {}) {
  return {
    api: {
      signInEmail: async (_params: { body: { email: string; password: string } }) => {
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
  } as unknown as import("@mirai-app/frameworks/better-auth").BetterAuthInstance;
}

describe("[UNIT] BetterAuthGateway", () => {
  describe("signInWithPassword", () => {
    it("should sign in successfully and return user and session", async () => {
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

    it("should fail with AuthenticationError for invalid credentials", async () => {
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

    it("should fail with RateLimitError when rate limited", async () => {
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
  });

  describe("sendSignInOtp", () => {
    it("should send OTP successfully", async () => {
      const mockAuth = createMockBetterAuth({
        sendVerificationOTPResult: {},
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.sendSignInOtp("test@example.com");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
    });

    it("should fail with RateLimitError when rate limited", async () => {
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

    it("should fail with AuthServiceError for general errors", async () => {
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
  });

  describe("signInWithOtp", () => {
    it("should sign in with OTP successfully", async () => {
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

    it("should fail with AuthenticationError for invalid OTP", async () => {
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

    it("should fail with AuthSessionExpiredError for expired OTP", async () => {
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
  });

  describe("signUp", () => {
    it("should sign up successfully and return user", async () => {
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

    it("should fail with UserAlreadyExistsError for duplicate email", async () => {
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

    it("should fail with RateLimitError when rate limited", async () => {
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
  });

  describe("signOut", () => {
    it("should sign out successfully", async () => {
      const mockAuth = createMockBetterAuth({
        signOutResult: {},
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signOut();
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
    });

    it("should fail with AuthSessionExpiredError for invalid session", async () => {
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

    it("should fail with AuthServiceError for general errors", async () => {
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

    it("should fail with AuthSessionExpiredError for expired session", async () => {
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

    it("should fail with AuthSessionExpiredError for invalid session", async () => {
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
  });

  describe("verifyAccess", () => {
    it("should allow ADMIN role full access", async () => {
      const mockAuth = createMockBetterAuth({});
      const gateway = new BetterAuthGateway(mockAuth);

      const request = {
        userId: "admin-123",
        role: "ADMIN" as const,
        tripRoles: {},
        resourceType: "trip" as const,
        resourceId: "trip-456",
        requiredPermission: "admin" as const,
      };

      const effect = gateway.verifyAccess(request);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
    });

    it("should allow MODERATOR read and write access", async () => {
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

    it("should allow SERVICE role access", async () => {
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

  describe("error mapping", () => {
    it("should map rate limit errors (429 status)", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: { status: 429, message: "Too many requests" } as unknown as Error,
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

    it("should map authentication errors (401 status)", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: { status: 401, message: "Unauthorized" } as unknown as Error,
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

    it("should map permission errors (403 status)", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: { status: 403, message: "Forbidden" } as unknown as Error,
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

    it("should map user exists by error code", async () => {
      const error = new Error("User exists");
      (error as unknown as Record<string, unknown>).code = "user_exists";

      const mockAuth = createMockBetterAuth({
        signUpEmailResult: {
          error,
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

    it("should default to AuthServiceError for unknown errors", async () => {
      const mockAuth = createMockBetterAuth({
        signInEmailResult: {
          error: { message: "Unknown error", code: "unknown" } as unknown as Error,
          user: null,
        },
      });
      const gateway = new BetterAuthGateway(mockAuth);

      const effect = gateway.signInWithPassword("test@example.com", "password");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(AuthServiceError);
      }
    });
  });
});
