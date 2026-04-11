import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  AuthenticateUserUseCase,
  type AuthenticateUserInput,
} from "./AuthenticateUser";
import type { AuthPort } from "../ports/AuthPort";
import type { AuthContext, Result } from "@mirai-app/domain";

// Mock AuthContext
const createMockAuthContext = (overrides?: Partial<AuthContext>): AuthContext =>
  ({
    userId: "user-123",
    role: "admin",
    authenticatedAt: new Date("2024-01-01"),
    sessionId: "session-123",
    ...overrides,
  }) as AuthContext;

describe("[UNIT] AuthenticateUserUseCase", () => {
  let useCase: AuthenticateUserUseCase;
  let mockAuthPort: AuthPort;

  beforeEach(() => {
    mockAuthPort = {
      validateToken: mock(() =>
        Promise.resolve({
          kind: "ok",
          value: createMockAuthContext(),
        } as Result<AuthContext, Error>),
      ),
    } as unknown as AuthPort;

    useCase = new AuthenticateUserUseCase(mockAuthPort);
  });

  describe("execute", () => {
    it("should return auth context on successful validation", async () => {
      const input: AuthenticateUserInput = {
        token: "valid-jwt-token",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.userId).toBe("user-123");
        expect(result.value.role).toBe("admin");
        expect(result.value.authenticatedAt).toBeInstanceOf(Date);
      }
    });

    it("should delegate to auth port for validation", async () => {
      const input: AuthenticateUserInput = {
        token: "some-token",
      };

      await useCase.execute(input);

      expect(mockAuthPort.validateToken).toHaveBeenCalledWith("some-token");
    });

    it("should propagate error from auth port", async () => {
      const authError = {
        _tag: "InvalidTokenError",
        message: "Token is invalid",
        name: "InvalidTokenError",
      };

      mockAuthPort.validateToken = mock(() =>
        Promise.resolve({
          kind: "err",
          error: authError,
        } as Result<AuthContext, Error>),
      );

      const input: AuthenticateUserInput = {
        token: "invalid-token",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error._tag).toBe("InvalidTokenError");
        expect(result.error.message).toBe("Token is invalid");
      }
    });

    it("should handle expired session error", async () => {
      const sessionExpiredError = {
        _tag: "SessionExpiredError",
        message: "Session has expired",
        name: "SessionExpiredError",
      };

      mockAuthPort.validateToken = mock(() =>
        Promise.resolve({
          kind: "err",
          error: sessionExpiredError,
        } as Result<AuthContext, Error>),
      );

      const input: AuthenticateUserInput = {
        token: "expired-token",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error._tag).toBe("SessionExpiredError");
      }
    });

    it("should handle different user roles", async () => {
      const roles = ["admin", "moderator", "participant"];

      for (const role of roles) {
        mockAuthPort.validateToken = mock(() =>
          Promise.resolve({
            kind: "ok",
            value: createMockAuthContext({ role }),
          } as Result<AuthContext, Error>),
        );

        const input: AuthenticateUserInput = {
          token: `token-${role}`,
        };

        const result = await useCase.execute(input);

        expect(result.kind).toBe("ok");
        if (result.kind === "ok") {
          expect(result.value.role).toBe(role);
        }
      }
    });

    it("should handle auth context without sessionId", async () => {
      mockAuthPort.validateToken = mock(() =>
        Promise.resolve({
          kind: "ok",
          value: createMockAuthContext({ sessionId: undefined }),
        } as Result<AuthContext, Error>),
      );

      const input: AuthenticateUserInput = {
        token: "token-without-session",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.sessionId).toBeUndefined();
      }
    });

    it("should pass token through to port unchanged", async () => {
      const complexToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

      const input: AuthenticateUserInput = {
        token: complexToken,
      };

      await useCase.execute(input);

      expect(mockAuthPort.validateToken).toHaveBeenCalledWith(complexToken);
    });
  });
});
