import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  authorizeModeratorUseCase,
  type AuthorizeModeratorInput,
  NotModeratorError,
} from "./authorize-moderator";
import { UserRole } from "@mirai-app/domain";
import type { AuthContext } from "@mirai-app/domain";

describe("[UNIT] authorizeModeratorUseCase", () => {
  it("should authorize moderator user successfully", async () => {
    const authContext: AuthContext = {
      userId: "mod-123",
      role: UserRole.MODERATOR,
      authenticatedAt: new Date(),
      sessionId: "session-123",
    };

    const input: AuthorizeModeratorInput = {
      authContext,
      resource: "Submission",
      action: "moderate",
    };

    const program = authorizeModeratorUseCase(input);
    const result = await Effect.runPromise(program);

    expect(result).toBeUndefined();
  });

  it("should authorize admin user as moderator", async () => {
    const authContext: AuthContext = {
      userId: "admin-456",
      role: UserRole.ADMIN,
      authenticatedAt: new Date(),
      sessionId: "session-456",
    };

    const input: AuthorizeModeratorInput = {
      authContext,
      resource: "Content",
      action: "review",
    };

    const program = authorizeModeratorUseCase(input);
    const result = await Effect.runPromise(program);

    expect(result).toBeUndefined();
  });

  it("should fail with NotModeratorError for regular user", async () => {
    const authContext: AuthContext = {
      userId: "user-789",
      role: UserRole.USER,
      authenticatedAt: new Date(),
      sessionId: "session-789",
    };

    const input: AuthorizeModeratorInput = {
      authContext,
      resource: "Submission",
      action: "moderate",
    };

    const program = authorizeModeratorUseCase(input);
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotModeratorError);
      expect(either.left.resource).toBe("Submission");
      expect(either.left.action).toBe("moderate");
      expect(either.left.userId).toBe("user-789");
    }
  });

  it("should use default resource and action when not provided", async () => {
    const authContext: AuthContext = {
      userId: "user-abc",
      role: UserRole.USER,
      authenticatedAt: new Date(),
      sessionId: "session-abc",
    };

    const input: AuthorizeModeratorInput = {
      authContext,
    };

    const program = authorizeModeratorUseCase(input);
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left.resource).toBe("moderator operation");
      expect(either.left.action).toBe("execute");
    }
  });

  it("should fail with NotModeratorError for service role", async () => {
    const authContext: AuthContext = {
      userId: "service-def",
      role: UserRole.SERVICE,
      authenticatedAt: new Date(),
      sessionId: "session-def",
    };

    const input: AuthorizeModeratorInput = {
      authContext,
      resource: "Report",
      action: "process",
    };

    const program = authorizeModeratorUseCase(input);
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotModeratorError);
      expect(either.left.userId).toBe("service-def");
    }
  });
});
