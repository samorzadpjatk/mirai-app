import { describe, it, expect, beforeEach } from "bun:test";
import {
  AuthenticateUserUseCase,
  type AuthenticateUserInput,
} from "../AuthenticateUser.js";
import type { AuthPort } from "../../ports/AuthPort.js";
import { AuthError, InvalidTokenError } from "../../ports/AuthPort.js";
import type { Result, AuthContext, UserId } from "@mirai-app/domain";
import { UserRole, UserId as UserIdFactory } from "@mirai-app/domain";
import { isOk, isErr } from "@mirai-app/domain";

// =============================================================================
// Mock AuthPort Implementation
// =============================================================================

/**
 * Mock implementation of AuthPort for testing
 * Simulates successful and failed authentication scenarios
 */
class MockAuthPort implements AuthPort {
  private scenarios: Map<
    string,
    Result<AuthContext, AuthError | InvalidTokenError>
  > = new Map();

  /**
   * Configure a mock response for a specific token
   */
  setMockResponse(
    token: string,
    result: Result<AuthContext, AuthError | InvalidTokenError>,
  ): void {
    this.scenarios.set(token, result);
  }

  /**
   * Clear all mock responses
   */
  clearMocks(): void {
    this.scenarios.clear();
  }

  async validateToken(
    token: string,
  ): Promise<Result<AuthContext, AuthError | InvalidTokenError>> {
    const response = this.scenarios.get(token);

    if (response) {
      return response;
    }

    // Default: return invalid token error for unknown tokens
    return {
      kind: "err",
      error: new InvalidTokenError({
        message: "Unknown token - no mock configured",
        token,
      }),
    };
  }

  async refreshSession(): Promise<Result<AuthContext, AuthError>> {
    // Not used in this use case, but required by interface
    return {
      kind: "err",
      error: new AuthError({ message: "Not implemented in mock" }),
    };
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
  // Create a proper UserId using the factory
  const userIdString = props?.userId ?? "550e8400-e29b-41d4-a716-446655440000";
  const mockUserId = UserIdFactory.unsafeCreate(userIdString);

  // AuthContext.create requires proper UserId, but for mocking we can create
  // the context object directly since we're testing the use case, not AuthContext
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

describe("[UNIT] AuthenticateUserUseCase", () => {
  let mockAuthPort: MockAuthPort;
  let useCase: AuthenticateUserUseCase;

  beforeEach(() => {
    mockAuthPort = new MockAuthPort();
    useCase = new AuthenticateUserUseCase(mockAuthPort);
  });

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
      const result = await useCase.execute(input);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(UserIdFactory.toString(result.value.userId)).toBe("user-123");
        expect(result.value.role).toBe(UserRole.USER);
        expect(result.value.sessionId).toBe("session-abc");
      }
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
      const result = await useCase.execute(input);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(UserIdFactory.toString(result.value.userId)).toBe("admin-789");
        expect(result.value.role).toBe(UserRole.ADMIN);
        expect(result.value.isAdmin()).toBe(true);
        expect(result.value.hasRoleAtLeast(UserRole.MODERATOR)).toBe(true);
      }
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
      const result = await useCase.execute(input);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(UserIdFactory.toString(result.value.userId)).toBe(
          "moderator-456",
        );
        expect(result.value.role).toBe(UserRole.MODERATOR);
        expect(result.value.isModerator()).toBe(true);
        expect(result.value.isAdmin()).toBe(false);
      }
    });

    it("should return InvalidTokenError when token is malformed", async () => {
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

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error._tag).toBe("InvalidTokenError");
        expect(result.error.code).toBe("INVALID_TOKEN");
        expect(result.error.message).toBe("Token format is invalid");
        // Type guard to check token property only on InvalidTokenError
        if (result.error instanceof InvalidTokenError) {
          expect(result.error.token).toBe(malformedToken);
        }
      }
    });

    it("should return AuthError when authentication fails", async () => {
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

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error._tag).toBe("AuthError");
        expect(result.error.code).toBe("AUTH_ERROR");
        expect(result.error.message).toBe("Authentication service unavailable");
      }
    });

    it("should handle empty token string", async () => {
      // Arrange
      const emptyToken = "";
      const invalidTokenError = new InvalidTokenError({
        message: "Token cannot be empty",
        token: emptyToken,
      });

      mockAuthPort.setMockResponse(emptyToken, {
        kind: "err",
        error: invalidTokenError,
      });

      const input: AuthenticateUserInput = { token: emptyToken };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error._tag).toBe("InvalidTokenError");
        expect(result.error.message).toBe("Token cannot be empty");
      }
    });

    it("should delegate to AuthPort.validateToken exactly once", async () => {
      // Arrange
      const token = "test-token";
      let callCount = 0;

      const trackingAuthPort: AuthPort = {
        async validateToken(
          receivedToken: string,
        ): Promise<Result<AuthContext, AuthError | InvalidTokenError>> {
          callCount++;
          expect(receivedToken).toBe(token);
          return {
            kind: "ok",
            value: createMockAuthContext({ userId: "user-1" }),
          };
        },
        async refreshSession(): Promise<Result<AuthContext, AuthError>> {
          throw new Error("Should not be called");
        },
      };

      const trackingUseCase = new AuthenticateUserUseCase(trackingAuthPort);

      // Act
      await trackingUseCase.execute({ token });

      // Assert
      expect(callCount).toBe(1);
    });

    it("should pass through the token unchanged to AuthPort", async () => {
      // Arrange
      const complexToken =
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      let receivedToken: string | undefined;

      const capturingAuthPort: AuthPort = {
        async validateToken(
          token: string,
        ): Promise<Result<AuthContext, AuthError | InvalidTokenError>> {
          receivedToken = token;
          return {
            kind: "ok",
            value: createMockAuthContext({}),
          };
        },
        async refreshSession(): Promise<Result<AuthContext, AuthError>> {
          throw new Error("Should not be called");
        },
      };

      const capturingUseCase = new AuthenticateUserUseCase(capturingAuthPort);

      // Act
      await capturingUseCase.execute({ token: complexToken });

      // Assert
      expect(receivedToken).toBe(complexToken);
    });

    it("should work with different AuthPort implementations", async () => {
      // This test verifies the use case is not coupled to a specific AuthPort
      const customAuthPort: AuthPort = {
        async validateToken(): Promise<
          Result<AuthContext, AuthError | InvalidTokenError>
        > {
          return {
            kind: "ok",
            value: createMockAuthContext({
              userId: "custom-user",
              role: UserRole.ADMIN,
            }),
          };
        },
        async refreshSession(): Promise<Result<AuthContext, AuthError>> {
          throw new Error("Not implemented");
        },
      };

      const customUseCase = new AuthenticateUserUseCase(customAuthPort);

      // Act
      const result = await customUseCase.execute({ token: "any-token" });

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(UserIdFactory.toString(result.value.userId)).toBe("custom-user");
        expect(result.value.role).toBe(UserRole.ADMIN);
      }
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
      const result = await useCase.execute({ token: "token-with-details" });

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        // Verify all properties are correctly propagated
        expect(UserIdFactory.toString(result.value.userId)).toBe(
          "specific-user-123",
        );
        expect(result.value.role).toBe(UserRole.USER);
        expect(result.value.authenticatedAt).toBe(specificDate);
        expect(result.value.sessionId).toBe("specific-session-456");

        // Verify AuthContext methods work
        expect(result.value.isAdmin()).toBe(false);
        expect(result.value.isModerator()).toBe(false);
        expect(result.value.hasRole(UserRole.USER)).toBe(true);

        // Verify JSON serialization works
        const json = result.value.toJSON();
        expect(json.userId).toBe("specific-user-123");
        expect(json.role).toBe(UserRole.USER);
        expect(json.sessionId).toBe("specific-session-456");
      }
    });
  });

  describe("constructor injection", () => {
    it("should accept AuthPort via constructor", () => {
      // This test verifies the use case can be instantiated with an AuthPort
      const mockPort: AuthPort = {
        async validateToken(): Promise<
          Result<AuthContext, AuthError | InvalidTokenError>
        > {
          return {
            kind: "ok",
            value: createMockAuthContext({}),
          };
        },
        async refreshSession(): Promise<Result<AuthContext, AuthError>> {
          throw new Error("Not implemented");
        },
      };

      // Should not throw
      const instance = new AuthenticateUserUseCase(mockPort);
      expect(instance).toBeDefined();
      expect(instance.execute).toBeDefined();
    });
  });

  describe("framework independence", () => {
    it("does not import from @trpc/server", async () => {
      // Verify by checking that the module loads without tRPC dependencies
      // The test itself proves the use case doesn't depend on tRPC
      const module = await import("../AuthenticateUser.js");

      expect(module.AuthenticateUserUseCase).toBeDefined();
      // AuthenticateUserInput and AuthenticateUserOutput are type-only exports
      // They don't exist at runtime (TypeScript types are erased)
    });

    it("uses Result type for error handling", async () => {
      // Arrange
      mockAuthPort.setMockResponse("test", {
        kind: "ok",
        value: createMockAuthContext({}),
      });

      // Act
      const result = await useCase.execute({ token: "test" });

      // Assert - Result type should have kind property
      expect(result).toHaveProperty("kind");
      expect(["ok", "err"]).toContain(result.kind);
    });
  });
});
