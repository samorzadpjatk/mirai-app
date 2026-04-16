import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { logoutUserUseCase, type LogoutUserInput, LogoutError } from "./logout";
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
    shouldFailRefresh?: boolean;
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
      if (options.shouldFailRefresh) {
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

describe("[UNIT] logoutUserUseCase", () => {
  it("should logout with valid session", async () => {
    const mockAuthPort = createMockAuthPort();
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: LogoutUserInput = {
      sessionId: "valid-session-123",
    };

    const program = logoutUserUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.sessionId).toBe("valid-session-123");
    expect(result.loggedOutAt).toBeInstanceOf(Date);
    expect(result.message).toBe("Session invalidated successfully");
  });

  it("should logout successfully even if session already expired", async () => {
    const mockAuthPort = createMockAuthPort({
      expiredSessions: ["expired-session"],
    });
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: LogoutUserInput = {
      sessionId: "expired-session",
    };

    const program = logoutUserUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.sessionId).toBe("expired-session");
    expect(result.message).toBe("Session was already expired");
  });

  it("should fail with LogoutError when sessionId is empty", async () => {
    const mockAuthPort = createMockAuthPort();
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: LogoutUserInput = {
      sessionId: "",
    };

    const program = logoutUserUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(LogoutError);
      expect(either.left.message).toBe("Session ID is required for logout");
    }
  });

  it("should fail with LogoutError when sessionId is whitespace", async () => {
    const mockAuthPort = createMockAuthPort();
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: LogoutUserInput = {
      sessionId: "   ",
    };

    const program = logoutUserUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(LogoutError);
    }
  });

  it("should propagate auth service errors", async () => {
    const mockAuthPort = createMockAuthPort({ shouldFailRefresh: true });
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: LogoutUserInput = {
      sessionId: "session-123",
    };

    const program = logoutUserUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(AuthError);
    }
  });

  it("should include userId in logout when provided", async () => {
    const mockAuthPort = createMockAuthPort();
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: LogoutUserInput = {
      sessionId: "session-with-user",
      userId: "user-456",
    };

    const program = logoutUserUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.sessionId).toBe("session-with-user");
  });

  it("should handle logout with userId for audit logging", async () => {
    const mockAuthPort = createMockAuthPort();
    const mockLayer = Layer.succeed(AuthPortTag, mockAuthPort);

    const input: LogoutUserInput = {
      sessionId: "audit-session",
      userId: "audit-user-123",
    };

    const program = logoutUserUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.loggedOutAt).toBeInstanceOf(Date);
  });
});
