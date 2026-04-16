import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import {
  refreshTokenUseCase,
  type RefreshTokenInput,
  TokenRefreshError,
} from "./refresh-token";
import {
  AuthPortTag,
  AuthError,
  SessionExpiredError,
} from "../../auth/ports/port";
import type { AuthPort } from "../../auth/ports/port";
import type { AuthContext } from "@mirai-app/domain";

/**
 * Mock AuthPort for testing
 */
function createMockAuthPort(
  options: {
    expiredSessions?: string[];
    shouldFail?: boolean;
  } = {},
): AuthPort {
  return {
    validateToken: (token: string) => {
      const authContext: AuthContext = {
        userId: "user-123",
        role: "USER",
        authenticatedAt: new Date(),
        sessionId: token,
      };
      return Effect.succeed(authContext);
    },

    refreshSession: (sessionId: string) => {
      if (options.shouldFail) {
        return Effect.fail(
          new AuthError({ message: "Failed to refresh session" }),
        );
      }

      if (options.expiredSessions?.includes(sessionId)) {
        return Effect.fail(
          new SessionExpiredError({
            sessionId,
            expiredAt: new Date(Date.now() - 3600000),
          }),
        );
      }

      const authContext: AuthContext = {
        userId: "user-123",
        role: "USER",
        authenticatedAt: new Date(),
        sessionId,
      };
      return Effect.succeed(authContext);
    },
  };
}

describe("[UNIT] refreshTokenUseCase", () => {
  it("should refresh token successfully", async () => {
    const mockAuthPort = createMockAuthPort();
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: RefreshTokenInput = {
      sessionId: "valid-session-123",
    };

    const program = refreshTokenUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("user-123");
    expect(result.role).toBe("USER");
    expect(result.authenticatedAt).toBeInstanceOf(Date);
    expect(result.sessionId).toBe("valid-session-123");
  });

  it("should fail with SessionExpiredError for expired session", async () => {
    const mockAuthPort = createMockAuthPort({
      expiredSessions: ["expired-session"],
    });
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: RefreshTokenInput = {
      sessionId: "expired-session",
    };

    const program = refreshTokenUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SessionExpiredError);
      expect(either.left.sessionId).toBe("expired-session");
    }
  });

  it("should fail with TokenRefreshError when sessionId is empty", async () => {
    const mockAuthPort = createMockAuthPort();
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: RefreshTokenInput = {
      sessionId: "",
    };

    const program = refreshTokenUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(TokenRefreshError);
      expect(either.left.message).toBe(
        "Session ID is required for token refresh",
      );
    }
  });

  it("should fail with TokenRefreshError when sessionId is whitespace", async () => {
    const mockAuthPort = createMockAuthPort();
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: RefreshTokenInput = {
      sessionId: "   ",
    };

    const program = refreshTokenUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(TokenRefreshError);
    }
  });

  it("should handle auth service errors", async () => {
    const mockAuthPort = createMockAuthPort({ shouldFail: true });
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: RefreshTokenInput = {
      sessionId: "session-123",
    };

    const program = refreshTokenUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(AuthError);
    }
  });

  it("should return refreshed auth context with correct structure", async () => {
    const mockAuthPort = createMockAuthPort();
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: RefreshTokenInput = {
      sessionId: "refresh-test",
    };

    const program = refreshTokenUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("role");
    expect(result).toHaveProperty("authenticatedAt");
    expect(result).toHaveProperty("sessionId");
  });

  it("should preserve sessionId in output when refresh succeeds", async () => {
    const mockAuthPort = createMockAuthPort();
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: RefreshTokenInput = {
      sessionId: "preserve-this-id",
    };

    const program = refreshTokenUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.sessionId).toBe("preserve-this-id");
  });
});
