import { describe, it, expect, beforeEach } from "bun:test";
import {
  refreshTokenUseCase,
  type RefreshTokenInput,
  TokenRefreshError,
} from "./RefreshToken";
import { Effect, Either } from "effect";
import { AuthPortTag, AuthError, SessionExpiredError } from "../ports/AuthPort";
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

    // Default: return session expired error for unknown sessions
    return Effect.fail(
      new SessionExpiredError({
        message: "Unknown session - no mock configured",
        sessionId,
        expiredAt: new Date(),
      }),
    );
  }
}

// =============================================================================
// Tests
// =============================================================================

describe("[UNIT] refreshTokenUseCase (Effect)", () => {
  let mockAuthPort: MockAuthPort;

  beforeEach(() => {
    mockAuthPort = new MockAuthPort();
  });

  // Helper to run use case with Effect
  const runUseCase = async (input: RefreshTokenInput) => {
    const program = refreshTokenUseCase(input).pipe(
      Effect.provideService(AuthPortTag, mockAuthPort),
    );
    return await Effect.runPromise(program);
  };

  // Helper to run use case and get Either result
  const runUseCaseEither = async (input: RefreshTokenInput) => {
    const program = refreshTokenUseCase(input).pipe(
      Effect.provideService(AuthPortTag, mockAuthPort),
    );
    return await Effect.runPromise(Effect.either(program));
  };

  describe("successful refresh", () => {
    it("should return refreshed auth context on successful session refresh", async () => {
      const sessionId = "valid-session-123";
      const mockAuthContext = createMockAuthContext({
        userId: "user-456",
        role: UserRole.USER,
        sessionId,
        authenticatedAt: new Date("2024-01-15T10:00:00Z"),
      });

      mockAuthPort.setMockResponse(sessionId, {
        kind: "ok",
        value: mockAuthContext,
      });

      const input: RefreshTokenInput = { sessionId };

      const result = await runUseCase(input);

      expect(result.userId).toBe("user-456");
      expect(result.role).toBe(UserRole.USER);
      expect(result.sessionId).toBe(sessionId);
      expect(result.authenticatedAt).toBeInstanceOf(Date);
    });

    it("should handle admin role session refresh", async () => {
      const sessionId = "admin-session-789";
      const mockAuthContext = createMockAuthContext({
        userId: "admin-123",
        role: UserRole.ADMIN,
        sessionId,
      });

      mockAuthPort.setMockResponse(sessionId, {
        kind: "ok",
        value: mockAuthContext,
      });

      const input: RefreshTokenInput = { sessionId };

      const result = await runUseCase(input);

      expect(result.userId).toBe("admin-123");
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it("should handle moderator role session refresh", async () => {
      const sessionId = "moderator-session-456";
      const mockAuthContext = createMockAuthContext({
        userId: "moderator-789",
        role: UserRole.MODERATOR,
        sessionId,
      });

      mockAuthPort.setMockResponse(sessionId, {
        kind: "ok",
        value: mockAuthContext,
      });

      const input: RefreshTokenInput = { sessionId };

      const result = await runUseCase(input);

      expect(result.userId).toBe("moderator-789");
      expect(result.role).toBe(UserRole.MODERATOR);
    });
  });

  describe("error handling", () => {
    it("should fail with TokenRefreshError when sessionId is empty", async () => {
      const input: RefreshTokenInput = { sessionId: "" };

      const either = await runUseCaseEither(input);

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(TokenRefreshError);
        expect(either.left._tag).toBe("TokenRefreshError");
        expect(either.left.message).toContain("Session ID is required");
      }
    });

    it("should fail with TokenRefreshError when sessionId is whitespace only", async () => {
      const input: RefreshTokenInput = { sessionId: "   " };

      const either = await runUseCaseEither(input);

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(TokenRefreshError);
      }
    });

    it("should propagate SessionExpiredError from auth port", async () => {
      const sessionId = "expired-session";
      const sessionExpiredError = new SessionExpiredError({
        message: "Session has expired",
        sessionId,
        expiredAt: new Date(),
      });

      mockAuthPort.setMockResponse(sessionId, {
        kind: "err",
        error: sessionExpiredError,
      });

      const input: RefreshTokenInput = { sessionId };

      const either = await runUseCaseEither(input);

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SessionExpiredError);
        expect(either.left._tag).toBe("SessionExpiredError");
        expect(either.left.sessionId).toBe(sessionId);
      }
    });

    it("should propagate AuthError from auth port", async () => {
      const sessionId = "failed-session";
      const authError = new AuthError({
        message: "Authentication service unavailable",
      });

      mockAuthPort.setMockResponse(sessionId, {
        kind: "err",
        error: authError,
      });

      const input: RefreshTokenInput = { sessionId };

      await expect(runUseCase(input)).rejects.toThrow();
    });
  });

  describe("Effect patterns", () => {
    it("should work with Effect.either for error handling", async () => {
      const sessionId = "expired-session";
      mockAuthPort.setMockResponse(sessionId, {
        kind: "err",
        error: new SessionExpiredError({
          message: "Session expired",
          sessionId,
          expiredAt: new Date(),
        }),
      });

      const program = refreshTokenUseCase({ sessionId }).pipe(
        Effect.provideService(AuthPortTag, mockAuthPort),
      );

      const either = await Effect.runPromise(Effect.either(program));

      const result = Either.match(either, {
        onLeft: (error) => ({ type: "error" as const, error }),
        onRight: (value) => ({ type: "success" as const, value }),
      });

      expect(result.type).toBe("error");
      if (result.type === "error") {
        expect(result.error._tag).toBe("SessionExpiredError");
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

      const program = refreshTokenUseCase({ sessionId }).pipe(
        Effect.provideService(AuthPortTag, mockAuthPort),
        Effect.map((result) => ({
          ...result,
          refreshed: true,
        })),
      );

      const result = await Effect.runPromise(program);

      expect(result.userId).toBe("user-composable");
      expect(result.refreshed).toBe(true);
    });
  });

  describe("input validation", () => {
    it("should handle valid session ID", async () => {
      const sessionId = "valid-session-id-12345";
      const mockAuthContext = createMockAuthContext({
        userId: "user-123",
        role: UserRole.USER,
        sessionId,
      });

      mockAuthPort.setMockResponse(sessionId, {
        kind: "ok",
        value: mockAuthContext,
      });

      const result = await runUseCase({ sessionId });

      expect(result.userId).toBe("user-123");
      expect(result.sessionId).toBe(sessionId);
      expect(result.role).toBe(UserRole.USER);
    });
  });
});
