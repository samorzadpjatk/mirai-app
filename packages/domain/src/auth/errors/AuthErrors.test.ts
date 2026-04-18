import { describe, it, expect } from "bun:test";
import {
  AuthSessionExpiredError,
  PermissionDeniedError,
  UserAlreadyExistsError,
  RateLimitError,
  AuthenticationError,
  TokenMissingError,
  AuthServiceError,
  ForbiddenError,
} from "./AuthErrors";

describe("[UNIT] Auth Error Classes", () => {
  describe("AuthSessionExpiredError", () => {
    it("creates error with minimal fields", () => {
      const error = new AuthSessionExpiredError({});

      expect(error._tag).toBe("AuthSessionExpiredError");
      expect(error.message).toBe("Session has expired, please sign in again");
    });

    it("creates error with token and expiredAt", () => {
      const expiredAt = new Date("2024-01-15T10:00:00Z");
      const error = new AuthSessionExpiredError({
        token: "expired-token-123",
        expiredAt,
        cause: new Error("Token expired"),
      });

      expect(error._tag).toBe("AuthSessionExpiredError");
      expect(error.token).toBe("expired-token-123");
      expect(error.expiredAt).toBe(expiredAt);
      expect(error.cause).toBeInstanceOf(Error);
    });
  });

  describe("PermissionDeniedError", () => {
    it("creates error with required fields", () => {
      const error = new PermissionDeniedError({
        resourceType: "trip",
        requiredPermission: "write",
      });

      expect(error._tag).toBe("PermissionDeniedError");
      expect(error.resourceType).toBe("trip");
      expect(error.requiredPermission).toBe("write");
      expect(error.message).toBe("Permission denied: write access to trip");
    });

    it("creates error with all fields including resourceId", () => {
      const error = new PermissionDeniedError({
        resourceType: "group",
        resourceId: "group-123",
        requiredPermission: "admin",
        userId: "user-456",
      });

      expect(error._tag).toBe("PermissionDeniedError");
      expect(error.resourceId).toBe("group-123");
      expect(error.userId).toBe("user-456");
      expect(error.message).toBe(
        "Permission denied: admin access to group (group-123)"
      );
    });
  });

  describe("UserAlreadyExistsError", () => {
    it("creates error for duplicate email", () => {
      const error = new UserAlreadyExistsError({
        identifier: "user@example.com",
        identifierType: "email",
      });

      expect(error._tag).toBe("UserAlreadyExistsError");
      expect(error.identifier).toBe("user@example.com");
      expect(error.identifierType).toBe("email");
      expect(error.message).toBe(
        'User with email "user@example.com" already exists'
      );
    });

    it("creates error for duplicate username", () => {
      const error = new UserAlreadyExistsError({
        identifier: "johndoe",
        identifierType: "username",
      });

      expect(error.identifier).toBe("johndoe");
      expect(error.identifierType).toBe("username");
      expect(error.message).toBe('User with username "johndoe" already exists');
    });

    it("creates error for duplicate phone", () => {
      const error = new UserAlreadyExistsError({
        identifier: "+1234567890",
        identifierType: "phone",
      });

      expect(error.identifier).toBe("+1234567890");
      expect(error.identifierType).toBe("phone");
      expect(error.message).toBe('User with phone "+1234567890" already exists');
    });
  });

  describe("RateLimitError", () => {
    it("creates error with all rate limit details", () => {
      const error = new RateLimitError({
        operation: "login",
        retryAfter: 60,
        limit: 5,
        windowSeconds: 300,
      });

      expect(error._tag).toBe("RateLimitError");
      expect(error.operation).toBe("login");
      expect(error.retryAfter).toBe(60);
      expect(error.limit).toBe(5);
      expect(error.windowSeconds).toBe(300);
      expect(error.message).toBe(
        "Rate limit exceeded for login. Retry after 60 seconds"
      );
    });

    it("creates error for password reset rate limiting", () => {
      const error = new RateLimitError({
        operation: "password-reset",
        retryAfter: 900,
        limit: 3,
        windowSeconds: 3600,
      });

      expect(error.operation).toBe("password-reset");
      expect(error.retryAfter).toBe(900);
      expect(error.limit).toBe(3);
    });
  });

  describe("AuthenticationError", () => {
    it("creates error with operation only", () => {
      const error = new AuthenticationError({
        operation: "oauth-callback",
      });

      expect(error._tag).toBe("AuthenticationError");
      expect(error.operation).toBe("oauth-callback");
      expect(error.message).toBe("Authentication failed during oauth-callback");
    });

    it("creates error with cause and details", () => {
      const cause = new Error("Network timeout");
      const error = new AuthenticationError({
        operation: "sign-in",
        cause,
        details: { provider: "google", errorCode: "network_error" },
      });

      expect(error.operation).toBe("sign-in");
      expect(error.cause).toBe(cause);
      expect(error.details).toEqual({
        provider: "google",
        errorCode: "network_error",
      });
      expect(error.message).toBe("Authentication failed during sign-in");
    });
  });

  describe("TokenMissingError", () => {
    it("creates error with operation", () => {
      const error = new TokenMissingError({
        operation: "protected-request",
      });

      expect(error._tag).toBe("TokenMissingError");
      expect(error.operation).toBe("protected-request");
      expect(error.message).toBe("Authentication token is missing");
    });
  });

  describe("AuthServiceError", () => {
    it("creates error with operation and cause", () => {
      const cause = new Error("Database connection failed");
      const error = new AuthServiceError({
        operation: "validate-session",
        cause,
      });

      expect(error._tag).toBe("AuthServiceError");
      expect(error.operation).toBe("validate-session");
      expect(error.cause).toBe(cause);
      expect(error.message).toBe("Authentication service error");
    });
  });

  describe("ForbiddenError", () => {
    it("creates error with resource", () => {
      const error = new ForbiddenError({
        resource: "admin-panel",
      });

      expect(error._tag).toBe("ForbiddenError");
      expect(error.resource).toBe("admin-panel");
      expect(error.message).toBe("Access to this resource is forbidden");
    });

    it("creates error with resource and reason", () => {
      const error = new ForbiddenError({
        resource: "user-data",
        reason: "Insufficient privileges",
      });

      expect(error.resource).toBe("user-data");
      expect(error.reason).toBe("Insufficient privileges");
    });
  });

  describe("IPortError interface compliance", () => {
    it("all errors implement IPortError with _tag and message", () => {
      const errors = [
        new AuthSessionExpiredError({}),
        new PermissionDeniedError({
          resourceType: "test",
          requiredPermission: "read",
        }),
        new UserAlreadyExistsError({
          identifier: "test",
          identifierType: "email",
        }),
        new RateLimitError({
          operation: "test",
          retryAfter: 10,
          limit: 5,
          windowSeconds: 60,
        }),
        new AuthenticationError({ operation: "test" }),
        new TokenMissingError({ operation: "test" }),
        new AuthServiceError({ operation: "test" }),
        new ForbiddenError({ resource: "test" }),
      ];

      for (const error of errors) {
        expect(error._tag).toBeDefined();
        expect(typeof error._tag).toBe("string");
        expect(error.message).toBeDefined();
        expect(typeof error.message).toBe("string");
      }
    });
  });
});
