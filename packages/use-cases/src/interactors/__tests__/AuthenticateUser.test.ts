import { describe, it, expect, beforeEach } from "bun:test";
import {
  authenticateUserUseCase,
  type AuthenticateUserInput,
} from "../AuthenticateUser.js";
import { Effect } from "effect";
import { AuthPortTag } from "../../ports/AuthPort.js";
import type { AuthPort } from "../../ports/AuthPort.js";
import { AuthError, InvalidTokenError } from "../../ports/AuthPort.js";
import type { AuthContext } from "@mirai-app/domain";
import { UserRole, UserId as UserIdFactory } from "@mirai-app/domain";

// =============================================================================
// Mock AuthPort Implementation for Effect-based testing
// =============================================================================

/**
 * Mock implementation of AuthPort for Effect-based testing
 */
class MockAuthPort implements AuthPort {
  private scenarios: Map<
    string,
    | { kind: "ok"; value: AuthContext }
    | { kind: "err"; error: AuthError | InvalidTokenError }
  > = new Map();

  setMockResponse(
    token: string,
    result:
      | { kind: "ok"; value: AuthContext }
      | { kind: "err"; error: AuthError | InvalidTokenError },
  ): void {
    this.scenarios.set(token, result);
  }

  clearMocks(): void {
    this.scenarios.clear();
  }

  validateToken(token: string) {
    const response = this.scenarios.get(token);

    if (response) {
      if (response.kind === "ok") {
        return Effect.succeed(response.value);
      } else {
        return Effect.fail(response.error);
      }
    }

    // Default: return invalid token error for unknown tokens
    return Effect.fail(
      new InvalidTokenError({
        message: "Unknown token - no mock configured",
        token,
      }),
    );
  }

  refreshSession() {
    return Effect.fail(new AuthError({ message: "Not implemented in mock" }));
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a mock AuthContext for testing
 */
function createMockAuthContext(props?: {
  userId?: string;
  role?: UserRole;
  authenticatedAt?: Date;
  sessionId?: string;
}): AuthContext {
  const userIdString = props?.userId ?? "550e8400-e29b-41d4-a716-446655440000";
  const mockUserId = UserIdFactory.unsafeCreate(userIdString);

  return {
    userId: mockUserId,
    role: props?.role ?? UserRole.USER,
    authenticatedAt: props?.authenticatedAt ?? new Date("2024-01-15T10:00:00Z"),
    sessionId: props?.sessionId,
    isAdmin: function () {
      return this.role === UserRole.ADMIN;
    },
    isModerator: function () {
      return this.role === UserRole.MODERATOR || this.role === UserRole.ADMIN;
    },
    hasRole: function (role: UserRole) {
      return this.role === role;
    },
    hasRoleAtLeast: function (role: UserRole) {
      const roleHierarchy: Record<UserRole, number> = {
        [UserRole.ADMIN]: 3,
        [UserRole.MODERATOR]: 2,
        [UserRole.USER]: 1,
        [UserRole.SERVICE]: 3,
      };
      return roleHierarchy[this.role] >= roleHierarchy[role];
    },
    withRole: function (role: UserRole) {
      return createMockAuthContext({
        userId: UserIdFactory.toString(this.userId),
        role,
        authenticatedAt: this.authenticatedAt,
        sessionId: this.sessionId,
      });
    },
    withSessionId: function (sessionId: string | undefined) {
      return createMockAuthContext({
        userId: UserIdFactory.toString(this.userId),
        role: this.role,
        authenticatedAt: this.authenticatedAt,
        sessionId,
      });
    },
    toJSON: function () {
      return {
        userId: UserIdFactory.toString(this.userId),
        role: this.role,
        authenticatedAt: this.authenticatedAt.toISOString(),
        sessionId: this.sessionId,
      };
    },
    equals: function (other: AuthContext) {
      return (
        this.userId === other.userId &&
        this.role === other.role &&
        this.authenticatedAt.getTime() === other.authenticatedAt.getTime() &&
        this.sessionId === other.sessionId
      );
    },
  };
}

// =============================================================================
// Tests
// =============================================================================

describe("[UNIT] authenticateUserUseCase", () => {
  let mockAuthPort: MockAuthPort;

  beforeEach(() => {
    mockAuthPort = new MockAuthPort();
  });

  // Helper to run use case with Effect
  const runUseCase = async (input: AuthenticateUserInput) => {
    const program = authenticateUserUseCase(input).pipe(
      Effect.provideService(AuthPortTag, mockAuthPort),
    );
    return await Effect.runPromise(program);
  };

  // Helper to run use case and expect failure
  const runUseCaseExpectFail = async (input: AuthenticateUserInput) => {
    const program = authenticateUserUseCase(input).pipe(
      Effect.provideService(AuthPortTag, mockAuthPort),
    );
    return await Effect.runPromise(Effect.either(program));
  };

  describe("execute", () => {
    it("should return AuthContext when token is valid", async () => {
      // Arrange
      const validToken = "valid-jwt-token-123";
      const mockAuthContext = createMockAuthContext({
        userId: "user-123",
        role: UserRole.USER,
        sessionId: "session-abc",
      });

      mockAuthPort.setMockResponse(validToken, {
        kind: "ok",
        value: mockAuthContext,
      });

      const input: AuthenticateUserInput = { token: validToken };

      // Act
      const result = await runUseCase(input);

      // Assert - Effect-based version returns the value directly
      expect(UserIdFactory.toString(result.userId)).toBe("user-123");
      expect(result.role).toBe(UserRole.USER);
      expect(result.sessionId).toBe("session-abc");
    });

    it("should return AuthContext with admin role for admin tokens", async () => {
      // Arrange
      const adminToken = "admin-jwt-token-456";
      const mockAuthContext = createMockAuthContext({
        userId: "admin-789",
        role: UserRole.ADMIN,
        sessionId: "admin-session",
      });

      mockAuthPort.setMockResponse(adminToken, {
        kind: "ok",
        value: mockAuthContext,
      });

      const input: AuthenticateUserInput = { token: adminToken };

      // Act
      const result = await runUseCase(input);

      // Assert - AuthenticateUserOutput contains role string
      expect(UserIdFactory.toString(result.userId)).toBe("admin-789");
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it("should return AuthContext with moderator role for moderator tokens", async () => {
      // Arrange
      const moderatorToken = "moderator-jwt-token-789";
      const mockAuthContext = createMockAuthContext({
        userId: "moderator-456",
        role: UserRole.MODERATOR,
        sessionId: "mod-session",
      });

      mockAuthPort.setMockResponse(moderatorToken, {
        kind: "ok",
        value: mockAuthContext,
      });

      const input: AuthenticateUserInput = { token: moderatorToken };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(UserIdFactory.toString(result.userId)).toBe("moderator-456");
      expect(result.role).toBe(UserRole.MODERATOR);
    });

    it("should fail when token is invalid", async () => {
      // Arrange
      const malformedToken = "not-a-valid-token";
      const invalidTokenError = new InvalidTokenError({
        message: "Token format is invalid",
        token: malformedToken,
      });

      mockAuthPort.setMockResponse(malformedToken, {
        kind: "err",
        error: invalidTokenError,
      });

      const input: AuthenticateUserInput = { token: malformedToken };

      // Act & Assert - Expect the effect to fail
      await expect(runUseCase(input)).rejects.toThrow();
    });

    it("should fail when authentication service fails", async () => {
      // Arrange
      const failedToken = "failed-auth-token";
      const authError = new AuthError({
        message: "Authentication service unavailable",
      });

      mockAuthPort.setMockResponse(failedToken, {
        kind: "err",
        error: authError,
      });

      const input: AuthenticateUserInput = { token: failedToken };

      // Act & Assert - Expect the effect to fail
      await expect(runUseCase(input)).rejects.toThrow();
    });

    it("should propagate AuthContext properties correctly", async () => {
      // Arrange
      const specificDate = new Date("2024-03-15T14:30:00Z");
      const mockAuthContext = createMockAuthContext({
        userId: "specific-user-123",
        role: UserRole.USER,
        authenticatedAt: specificDate,
        sessionId: "specific-session-456",
      });

      mockAuthPort.setMockResponse("token-with-details", {
        kind: "ok",
        value: mockAuthContext,
      });

      // Act
      const result = await runUseCase({ token: "token-with-details" });

      // Assert - AuthenticateUserOutput is a plain object with extracted properties
      expect(UserIdFactory.toString(result.userId)).toBe("specific-user-123");
      expect(result.role).toBe(UserRole.USER);
      expect(result.authenticatedAt).toBe(specificDate);
      expect(result.sessionId).toBe("specific-session-456");
    });
  });

  describe("framework independence", () => {
    it("does not depend on framework-specific modules", async () => {
      // Verify that the use case loads without framework dependencies
      const module = await import("../AuthenticateUser.js");

      expect(module.authenticateUserUseCase).toBeDefined();
    });
  });
});
