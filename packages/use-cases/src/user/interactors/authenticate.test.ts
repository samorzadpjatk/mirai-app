import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import {
  authenticateUserUseCase,
  type AuthenticateUserInput,
} from "./authenticate";
import {
  AuthPortTag,
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
} from "../../auth/ports/port";
import type { AuthPort } from "../../auth/ports/port";
import type { AuthContext } from "@mirai-app/domain";

/**
 * Mock AuthPort for testing
 */
function createMockAuthPort(
  options: {
    validTokens?: string[];
    expiredSessions?: string[];
    shouldFail?: boolean;
  } = {},
): AuthPort {
  return {
    validateToken: (token: string) => {
      if (options.shouldFail) {
        return Effect.fail(
          new AuthError({ message: "Authentication service unavailable" }),
        );
      }

      if (options.expiredSessions?.includes(token)) {
        return Effect.fail(
          new SessionExpiredError({
            sessionId: token,
            expiredAt: new Date(Date.now() - 3600000),
            message: "Session has expired",
          }),
        );
      }

      if (options.validTokens?.includes(token) || token.startsWith("valid-")) {
        const authContext: AuthContext = {
          userId: "user-123",
          role: "USER",
          authenticatedAt: new Date(),
          sessionId: token,
        };
        return Effect.succeed(authContext);
      }

      return Effect.fail(
        new InvalidTokenError({
          message: "Invalid or malformed token",
          token,
        }),
      );
    },

    refreshSession: (sessionId: string) => {
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

describe("[UNIT] authenticateUserUseCase", () => {
  it("should authenticate with valid token", async () => {
    const mockAuthPort = createMockAuthPort({
      validTokens: ["valid-token-123"],
    });
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: AuthenticateUserInput = {
      token: "valid-token-123",
    };

    const program = authenticateUserUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("user-123");
    expect(result.role).toBe("USER");
    expect(result.authenticatedAt).toBeInstanceOf(Date);
    expect(result.sessionId).toBe("valid-token-123");
  });

  it("should fail with InvalidTokenError for invalid token", async () => {
    const mockAuthPort = createMockAuthPort();
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: AuthenticateUserInput = {
      token: "invalid-token",
    };

    const program = authenticateUserUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(InvalidTokenError);
    }
  });

  it("should fail with SessionExpiredError for expired session", async () => {
    const mockAuthPort = createMockAuthPort({
      expiredSessions: ["expired-session"],
    });
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: AuthenticateUserInput = {
      token: "expired-session",
    };

    const program = authenticateUserUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SessionExpiredError);
      expect(either.left.sessionId).toBe("expired-session");
    }
  });

  it("should handle auth service errors", async () => {
    const mockAuthPort = createMockAuthPort({ shouldFail: true });
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: AuthenticateUserInput = {
      token: "any-token",
    };

    const program = authenticateUserUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(AuthError);
    }
  });

  it("should authenticate any token starting with 'valid-'", async () => {
    const mockAuthPort = createMockAuthPort();
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: AuthenticateUserInput = {
      token: "valid-custom-token",
    };

    const program = authenticateUserUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("user-123");
    expect(result.sessionId).toBe("valid-custom-token");
  });

  it("should return correct auth context structure", async () => {
    const mockAuthPort = createMockAuthPort({
      validTokens: ["test-token"],
    });
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: AuthenticateUserInput = {
      token: "test-token",
    };

    const program = authenticateUserUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("role");
    expect(result).toHaveProperty("authenticatedAt");
    expect(result).toHaveProperty("sessionId");
  });
});
