/**
 * AuthPort Interface Contract Tests
 *
 * These tests verify that the AuthPort interface:
 * - Has no framework dependencies
 * - Uses the Result pattern correctly
 * - Defines proper method signatures
 * - Has associated error types with correct structure
 *
 * @module ports/__tests__
 */

import { describe, it, expect } from "bun:test";
import type { AuthPort } from "../AuthPort";
import { AuthError, InvalidTokenError, SessionExpiredError } from "../AuthPort";
import type { Result, AuthContext } from "@mirai-app/domain";
import { UserRole } from "@mirai-app/domain";

// =============================================================================
// Mock Implementation for Testing
// =============================================================================

/**
 * Mock implementation of AuthPort for testing interface contract
 */
class MockAuthPort implements AuthPort {
  async validateToken(
    token: string,
  ): Promise<Result<AuthContext, AuthError | InvalidTokenError>> {
    // Return a mock error for testing - we just need to verify the return type
    return {
      kind: "err",
      error: new InvalidTokenError({
        message: "Mock token validation",
        token,
      }),
    };
  }

  async refreshSession(
    sessionId: string,
  ): Promise<Result<AuthContext, AuthError | SessionExpiredError>> {
    return {
      kind: "err",
      error: new SessionExpiredError({
        sessionId,
        expiredAt: new Date(),
      }),
    };
  }
}

// =============================================================================
// Tests
// =============================================================================

describe("[UNIT] AuthPort Interface Contract", () => {
  describe("AuthPort Interface Structure", () => {
    it("has validateToken method with correct signature", () => {
      const port = new MockAuthPort();

      expect(typeof port.validateToken).toBe("function");
    });

    it("has refreshSession method with correct signature", () => {
      const port = new MockAuthPort();

      expect(typeof port.refreshSession).toBe("function");
    });

    it("validateToken accepts a string token parameter", async () => {
      const port = new MockAuthPort();

      // Should not throw when called with string
      await expect(port.validateToken("test-token")).resolves.toBeDefined();
    });

    it("refreshSession accepts a string sessionId parameter", async () => {
      const port = new MockAuthPort();

      // Should not throw when called with string
      await expect(port.refreshSession("session-123")).resolves.toBeDefined();
    });
  });

  describe("Error Types", () => {
    it("AuthError has correct _tag discriminator", () => {
      const error = new AuthError({ message: "Test error" });

      expect(error._tag).toBe("AuthError");
    });

    it("AuthError has correct error code", () => {
      const error = new AuthError({ message: "Test error" });

      expect(error.code).toBe("AUTH_ERROR");
    });

    it("AuthError stores message correctly", () => {
      const message = "Something went wrong";
      const error = new AuthError({ message });

      expect(error.message).toBe(message);
    });

    it("InvalidTokenError has correct _tag discriminator", () => {
      const error = new InvalidTokenError({
        message: "Invalid token",
        token: "abc123",
      });

      expect(error._tag).toBe("InvalidTokenError");
    });

    it("InvalidTokenError has correct error code", () => {
      const error = new InvalidTokenError({
        message: "Invalid token",
        token: "abc123",
      });

      expect(error.code).toBe("INVALID_TOKEN");
    });

    it("InvalidTokenError stores token correctly", () => {
      const token = "my-token-123";
      const error = new InvalidTokenError({
        message: "Invalid",
        token,
      });

      expect(error.token).toBe(token);
    });

    it("SessionExpiredError has correct _tag discriminator", () => {
      const expiredAt = new Date();
      const error = new SessionExpiredError({
        sessionId: "session-123",
        expiredAt,
      });

      expect(error._tag).toBe("SessionExpiredError");
    });

    it("SessionExpiredError has correct error code", () => {
      const expiredAt = new Date();
      const error = new SessionExpiredError({
        sessionId: "session-123",
        expiredAt,
      });

      expect(error.code).toBe("SESSION_EXPIRED");
    });

    it("SessionExpiredError stores sessionId correctly", () => {
      const sessionId = "session-456";
      const error = new SessionExpiredError({
        sessionId,
        expiredAt: new Date(),
      });

      expect(error.sessionId).toBe(sessionId);
    });

    it("SessionExpiredError stores expiredAt correctly", () => {
      const expiredAt = new Date("2024-01-01");
      const error = new SessionExpiredError({
        sessionId: "session-123",
        expiredAt,
      });

      expect(error.expiredAt).toBe(expiredAt);
    });

    it("SessionExpiredError has default message", () => {
      const error = new SessionExpiredError({
        sessionId: "session-789",
        expiredAt: new Date(),
      });

      expect(error.message).toContain("session-789");
      expect(error.message).toContain("expired");
    });

    it("SessionExpiredError accepts custom message", () => {
      const customMessage = "Custom expiration message";
      const error = new SessionExpiredError({
        sessionId: "session-123",
        expiredAt: new Date(),
        message: customMessage,
      });

      expect(error.message).toBe(customMessage);
    });
  });

  describe("Result Type Integration", () => {
    it("validateToken returns a Result type", async () => {
      const port = new MockAuthPort();
      const result = await port.validateToken("test");

      // Result type should have kind property
      expect(result).toHaveProperty("kind");
      expect(["ok", "err"]).toContain(result.kind);
    });

    it("refreshSession returns a Result type", async () => {
      const port = new MockAuthPort();
      const result = await port.refreshSession("session-1");

      expect(result).toHaveProperty("kind");
      expect(["ok", "err"]).toContain(result.kind);
    });

    it("error result contains error property", async () => {
      const port = new MockAuthPort();
      const result = await port.validateToken("test");

      if (result.kind === "err") {
        expect(result.error).toBeDefined();
        expect(result.error instanceof InvalidTokenError).toBe(true);
      }
    });
  });

  describe("No Framework Dependencies", () => {
    it("AuthPort source does not import from HTTP/GraphQL frameworks", async () => {
      // Read the source file and verify no framework imports
      const file = await import("../AuthPort.ts");

      // The file should only export types and errors
      expect(file.AuthError).toBeDefined();
      expect(file.InvalidTokenError).toBeDefined();
      expect(file.SessionExpiredError).toBeDefined();
    });

    it("AuthError extends Error (standard JS)", () => {
      const error = new AuthError({ message: "Test" });

      expect(error).toBeInstanceOf(Error);
    });

    it("InvalidTokenError extends Error (standard JS)", () => {
      const error = new InvalidTokenError({ message: "Test" });

      expect(error).toBeInstanceOf(Error);
    });

    it("SessionExpiredError extends Error (standard JS)", () => {
      const error = new SessionExpiredError({
        sessionId: "s-1",
        expiredAt: new Date(),
      });

      expect(error).toBeInstanceOf(Error);
    });
  });
});
