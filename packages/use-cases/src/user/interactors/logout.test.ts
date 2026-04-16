import { describe, it, expect, beforeEach } from "bun:test";
import {
  logoutUserUseCase,
  type LogoutUserInput,
  LogoutError,
} from "./logout";
import { Effect, Either } from "effect";
import { AuthPortTag, AuthError, SessionExpiredError } from "../../ports/auth/port";
import type { AuthContext } from "@mirai-app/domain";
import { UserRole, UserId as UserIdFactory } from "@mirai-app/domain";

// =============================================================================
// Mock AuthContext Factory
// =============================================================================

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
    sessionId: props?.sessionId ?? "session-123",
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
// Mock AuthPort for Effect-based testing
// =============================================================================

class MockAuthPort {
  private scenarios: Map<
    string,
    | { kind: "ok"; value: AuthContext }
    | { kind: "err"; error: AuthError | SessionExpiredError }
  > = new Map();

  setMockResponse(
    sessionId: string,
    result:
      | { kind: "ok"; value: AuthContext }
      | { kind: "err"; error: AuthError | SessionExpiredError },
  ): void {
    this.scenarios.set(sessionId, result);
  }

  clearMocks(): void {
    this.scenarios.clear();
  }

  refreshSession(sessionId: string) {
    const response = this.scenarios.get(sessionId);

    if (response) {
      if (response.kind === "ok") {
        return Effect.succeed(response.value);
      } else {
        return Effect.fail(response.error);
      }
    }

    // Default: return session expired error (common for logout of expired sessions)
    return Effect.fail(
      new SessionExpiredError({
        message: "Session not found or expired",
        sessionId,
        expiredAt: new Date(),
      }),
    );
  }
}

// =============================================================================
// Tests
// =============================================================================

describe("[UNIT] logoutUserUseCase (Effect)", () => {
  let mockAuthPort: MockAuthPort;

  beforeEach(() => {
    mockAuthPort = new MockAuthPort();
  });

  // Helper to run use case with Effect
  const runUseCase = async (input: LogoutUserInput) => {
    const program = logoutUserUseCase(input).pipe(
      Effect.provideService(AuthPortTag, mockAuthPort),
    );
    return await Effect.runPromise(program);
  };

  // Helper to run use case and get Either result
  const runUseCaseEither = async (input: LogoutUserInput) => {
    const program = logoutUserUseCase(input).pipe(
      Effect.provideService(AuthPortTag, mockAuthPort),
    );
    return await Effect.runPromise(Effect.either(program));
  };

  describe("[UNIT] successful logout", () => {
    it("should return success for valid session", async () => {
      const sessionId = "valid-session-123";
      const mockAuthContext = createMockAuthContext({
        userId: "user-456",
        role: UserRole.USER,
        sessionId,
      });

      mockAuthPort.setMockResponse(sessionId, {
        kind: "ok",
        value: mockAuthContext,
      });

      const input: LogoutUserInput = { sessionId };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      expect(result.loggedOutAt).toBeInstanceOf(Date);
      expect(result.message).toContain("Session invalidated");
    });

    it("should handle logout with optional userId", async () => {
      const sessionId = "session-with-user";
      const userId = "user-789";
      const mockAuthContext = createMockAuthContext({
        userId,
        role: UserRole.USER,
        sessionId,
      });

      mockAuthPort.setMockResponse(sessionId, {
        kind: "ok",
        value: mockAuthContext,
      });

      const input: LogoutUserInput = { sessionId, userId };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
    });

    it("should succeed even for already expired sessions", async () => {
      const sessionId = "expired-session";

      mockAuthPort.setMockResponse(sessionId, {
        kind: "err",
        error: new SessionExpiredError({
          message: "Session already expired",
          sessionId,
          expiredAt: new Date(),
        }),
      });

      const input: LogoutUserInput = { sessionId };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      expect(result.message).toContain("already expired");
    });
  });

  describe("[UNIT] error handling", () => {
    it("should fail with LogoutError when sessionId is empty", async () => {
      const input: LogoutUserInput = { sessionId: "" };

      const either = await runUseCaseEither(input);

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(LogoutError);
        expect(either.left._tag).toBe("LogoutError");
        expect(either.left.message).toContain("Session ID is required");
      }
    });

    it("should fail with LogoutError when sessionId is whitespace only", async () => {
      const input: LogoutUserInput = { sessionId: "   " };

      const either = await runUseCaseEither(input);

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(LogoutError);
      }
    });

    it("should propagate non-session errors from auth port", async () => {
      const sessionId = "error-session";
      const authError = new AuthError({
        message: "Authentication service unavailable",
      });

      mockAuthPort.setMockResponse(sessionId, {
        kind: "err",
        error: authError,
      });

      const input: LogoutUserInput = { sessionId };

      await expect(runUseCase(input)).rejects.toThrow();
    });
  });

  describe("[UNIT] Effect patterns", () => {
    it("should work with Effect.either for error handling", async () => {
      const input: LogoutUserInput = { sessionId: "" };

      const program = logoutUserUseCase(input).pipe(
        Effect.provideService(AuthPortTag, mockAuthPort),
      );

      const either = await Effect.runPromise(Effect.either(program));

      const result = Either.match(either, {
        onLeft: (error) => ({ type: "error" as const, error }),
        onRight: (value) => ({ type: "success" as const, value }),
      });

      expect(result.type).toBe("error");
      if (result.type === "error") {
        expect(result.error._tag).toBe("LogoutError");
      }
    });

    it("should be composable with other effects", async () => {
      const sessionId = "composable-session";
      const mockAuthContext = createMockAuthContext({
        userId: "user-composable",
        role: UserRole.USER,
        sessionId,
      });

      mockAuthPort.setMockResponse(sessionId, {
        kind: "ok",
        value: mockAuthContext,
      });

      const program = logoutUserUseCase({ sessionId }).pipe(
        Effect.provideService(AuthPortTag, mockAuthPort),
        Effect.map((result) => ({
          ...result,
          auditLog: `User logged out at ${result.loggedOutAt.toISOString()}`,
        })),
      );

      const result = await Effect.runPromise(program);

      expect(result.success).toBe(true);
      expect(result.auditLog).toContain("User logged out at");
    });
  });

  describe("[UNIT] session handling", () => {
    it("should handle logout for admin sessions", async () => {
      const sessionId = "admin-session";
      const mockAuthContext = createMockAuthContext({
        userId: "admin-123",
        role: UserRole.ADMIN,
        sessionId,
      });

      mockAuthPort.setMockResponse(sessionId, {
        kind: "ok",
        value: mockAuthContext,
      });

      const result = await runUseCase({ sessionId });

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
    });

    it("should handle logout for moderator sessions", async () => {
      const sessionId = "moderator-session";
      const mockAuthContext = createMockAuthContext({
        userId: "moderator-456",
        role: UserRole.MODERATOR,
        sessionId,
      });

      mockAuthPort.setMockResponse(sessionId, {
        kind: "ok",
        value: mockAuthContext,
      });

      const result = await runUseCase({ sessionId });

      expect(result.success).toBe(true);
    });

    it("should set loggedOutAt to current date", async () => {
      const sessionId = "session-time-test";
      const mockAuthContext = createMockAuthContext({
        userId: "user-123",
        role: UserRole.USER,
        sessionId,
      });

      mockAuthPort.setMockResponse(sessionId, {
        kind: "ok",
        value: mockAuthContext,
      });

      const beforeTest = new Date();
      const result = await runUseCase({ sessionId });
      const afterTest = new Date();

      expect(result.loggedOutAt.getTime()).toBeGreaterThanOrEqual(
        beforeTest.getTime(),
      );
      expect(result.loggedOutAt.getTime()).toBeLessThanOrEqual(
        afterTest.getTime(),
      );
    });
  });
});
