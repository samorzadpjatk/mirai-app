import { describe, it, expect } from "bun:test";
import {
  AuthPortTag,
  AuthPort,
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
} from "./port";
import type { AuthContext } from "@mirai-app/domain";
import { Effect, Context } from "effect";

describe("[UNIT] AuthPort Interface", () => {
  it("AuthPortTag should be a valid Context.Tag", () => {
    expect(AuthPortTag).toBeDefined();
  });

  it("should create AuthError with correct properties", () => {
    const error = new AuthError({ message: "Test error" });
    expect(error._tag).toBe("AuthError");
    expect(error.code).toBe("AUTH_ERROR");
    expect(error.message).toBe("Test error");
  });

  it("should create InvalidTokenError with correct properties", () => {
    const error = new InvalidTokenError({
      message: "Invalid token",
      token: "abc123",
    });
    expect(error._tag).toBe("InvalidTokenError");
    expect(error.code).toBe("INVALID_TOKEN");
    expect(error.token).toBe("abc123");
  });

  it("should create SessionExpiredError with correct properties", () => {
    const expiredAt = new Date("2024-01-01");
    const error = new SessionExpiredError({
      sessionId: "session-123",
      expiredAt,
    });
    expect(error._tag).toBe("SessionExpiredError");
    expect(error.code).toBe("SESSION_EXPIRED");
    expect(error.sessionId).toBe("session-123");
    expect(error.expiredAt).toBe(expiredAt);
    expect(error.message).toContain("session-123");
  });

  it("should allow custom message in SessionExpiredError", () => {
    const error = new SessionExpiredError({
      sessionId: "session-456",
      expiredAt: new Date(),
      message: "Custom message",
    });
    expect(error.message).toBe("Custom message");
  });
});

describe("[UNIT] AuthPort Mock Implementation", () => {
  const mockAuthContext: AuthContext = {
    userId: "user-123",
    role: "USER",
    sessionId: "session-123",
  };

  it("validateToken should return Effect<AuthContext>", async () => {
    const mockPort: AuthPort = {
      validateToken: () => Effect.succeed(mockAuthContext),
      refreshSession: () => Effect.succeed(mockAuthContext),
    };

    const result = await Effect.runPromise(
      mockPort.validateToken("valid-token"),
    );
    expect(result.userId).toBe("user-123");
  });

  it("validateToken should fail with InvalidTokenError", async () => {
    const mockPort: AuthPort = {
      validateToken: () =>
        Effect.fail(
          new InvalidTokenError({ message: "Invalid", token: "bad-token" }),
        ),
      refreshSession: () => Effect.succeed(mockAuthContext),
    };

    const effect = mockPort.validateToken("bad-token");
    const either = await Effect.runPromise(Effect.either(effect));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(InvalidTokenError);
    }
  });

  it("refreshSession should return Effect<AuthContext>", async () => {
    const mockPort: AuthPort = {
      validateToken: () => Effect.succeed(mockAuthContext),
      refreshSession: () => Effect.succeed(mockAuthContext),
    };

    const result = await Effect.runPromise(
      mockPort.refreshSession("session-123"),
    );
    expect(result.userId).toBe("user-123");
  });

  it("refreshSession should fail with SessionExpiredError", async () => {
    const mockPort: AuthPort = {
      validateToken: () => Effect.succeed(mockAuthContext),
      refreshSession: () =>
        Effect.fail(
          new SessionExpiredError({
            sessionId: "expired-session",
            expiredAt: new Date(),
          }),
        ),
    };

    const effect = mockPort.refreshSession("expired-session");
    const either = await Effect.runPromise(Effect.either(effect));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SessionExpiredError);
    }
  });
});
