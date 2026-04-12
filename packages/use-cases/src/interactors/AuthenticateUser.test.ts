import { describe, it, expect, beforeEach } from "bun:test";
import {
  authenticateUserUseCase,
  type AuthenticateUserInput,
} from "./AuthenticateUser";
import { Effect, Either } from "effect";
import {
  AuthPortTag,
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
} from "../ports/AuthPort";
import type { AuthContext } from "@mirai-app/domain";

// Mock AuthContext
const createMockAuthContext = (overrides?: Partial<AuthContext>): AuthContext =>
  ({
    userId: "user-123",
    role: "admin",
    authenticatedAt: new Date("2024-01-01"),
    sessionId: "session-123",
    ...overrides,
  }) as AuthContext;

// Helper to create a mock auth port service for Effect
const createMockAuthPortService = (overrides?: {
  validateToken?: (token: string) => Promise<AuthContext>;
  refreshSession?: (sessionId: string) => Promise<AuthContext>;
}) => ({
  validateToken: (token: string) =>
    Effect.tryPromise({
      try: () =>
        overrides?.validateToken
          ? overrides.validateToken(token)
          : Promise.resolve(createMockAuthContext()),
      catch: (error) =>
        error as AuthError | InvalidTokenError | SessionExpiredError,
    }),
  refreshSession: (sessionId: string) =>
    Effect.tryPromise({
      try: () =>
        overrides?.refreshSession
          ? overrides.refreshSession(sessionId)
          : Promise.resolve(createMockAuthContext()),
      catch: (error) => error as AuthError | SessionExpiredError,
    }),
});

describe("[UNIT] authenticateUserUseCase (Effect)", () => {
  it("should return auth context on successful validation", async () => {
    const input: AuthenticateUserInput = {
      token: "valid-jwt-token",
    };

    const program = authenticateUserUseCase(input).pipe(
      Effect.provideService(AuthPortTag, createMockAuthPortService()),
    );

    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("user-123");
    expect(result.role).toBe("admin");
    expect(result.authenticatedAt).toBeInstanceOf(Date);
  });

  it("should delegate to auth port for validation", async () => {
    const validateCalls: string[] = [];

    const repoService = createMockAuthPortService({
      validateToken: (token) => {
        validateCalls.push(token);
        return Promise.resolve(createMockAuthContext());
      },
    });

    const input: AuthenticateUserInput = {
      token: "some-token",
    };

    const program = authenticateUserUseCase(input).pipe(
      Effect.provideService(AuthPortTag, repoService),
    );

    await Effect.runPromise(program);

    expect(validateCalls).toContain("some-token");
  });

  it("should propagate error from auth port", async () => {
    const authError = new InvalidTokenError({
      message: "Token is invalid",
    });

    const repoService = createMockAuthPortService({
      validateToken: () => Promise.reject(authError),
    });

    const input: AuthenticateUserInput = {
      token: "invalid-token",
    };

    const program = authenticateUserUseCase(input).pipe(
      Effect.provideService(AuthPortTag, repoService),
    );

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(InvalidTokenError);
    }
  });

  it("should handle expired session error", async () => {
    const sessionExpiredError = new SessionExpiredError({
      sessionId: "session-123",
      expiredAt: new Date(),
      message: "Session has expired",
    });

    const repoService = createMockAuthPortService({
      validateToken: () => Promise.reject(sessionExpiredError),
    });

    const input: AuthenticateUserInput = {
      token: "expired-token",
    };

    const program = authenticateUserUseCase(input).pipe(
      Effect.provideService(AuthPortTag, repoService),
    );

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(SessionExpiredError);
    }
  });

  it("should handle different user roles", async () => {
    const roles = ["admin", "moderator", "participant"];

    for (const role of roles) {
      const repoService = createMockAuthPortService({
        validateToken: () => Promise.resolve(createMockAuthContext({ role })),
      });

      const input: AuthenticateUserInput = {
        token: `token-${role}`,
      };

      const program = authenticateUserUseCase(input).pipe(
        Effect.provideService(AuthPortTag, repoService),
      );

      const result = await Effect.runPromise(program);
      expect(result.role).toBe(role);
    }
  });

  it("should handle auth context without sessionId", async () => {
    const repoService = createMockAuthPortService({
      validateToken: () =>
        Promise.resolve(createMockAuthContext({ sessionId: undefined })),
    });

    const input: AuthenticateUserInput = {
      token: "token-without-session",
    };

    const program = authenticateUserUseCase(input).pipe(
      Effect.provideService(AuthPortTag, repoService),
    );

    const result = await Effect.runPromise(program);

    expect(result.sessionId).toBeUndefined();
  });

  it("should pass token through to port unchanged", async () => {
    const validateCalls: string[] = [];
    const complexToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

    const repoService = createMockAuthPortService({
      validateToken: (token) => {
        validateCalls.push(token);
        return Promise.resolve(createMockAuthContext());
      },
    });

    const input: AuthenticateUserInput = {
      token: complexToken,
    };

    const program = authenticateUserUseCase(input).pipe(
      Effect.provideService(AuthPortTag, repoService),
    );

    await Effect.runPromise(program);

    expect(validateCalls).toContain(complexToken);
  });
});
