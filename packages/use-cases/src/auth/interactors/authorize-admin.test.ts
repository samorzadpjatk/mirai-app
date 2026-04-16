import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  authorizeAdminUseCase,
  type AuthorizeAdminInput,
  NotAdminError,
} from "./authorize-admin";
import { UserRole } from "@mirai-app/domain";
import type { AuthContext } from "@mirai-app/domain";

describe("[UNIT] authorizeAdminUseCase", () => {
  it("should authorize admin user successfully", async () => {
    const authContext: AuthContext = {
      userId: "admin-123",
      role: UserRole.ADMIN,
      authenticatedAt: new Date(),
      sessionId: "session-123",
    };

    const input: AuthorizeAdminInput = {
      authContext,
      resource: "Challenge",
      action: "delete",
    };

    const program = authorizeAdminUseCase(input);
    const result = await Effect.runPromise(program);

    expect(result).toBeUndefined();
  });

  it("should fail with NotAdminError for non-admin user", async () => {
    const authContext: AuthContext = {
      userId: "user-456",
      role: UserRole.USER,
      authenticatedAt: new Date(),
      sessionId: "session-456",
    };

    const input: AuthorizeAdminInput = {
      authContext,
      resource: "Challenge",
      action: "delete",
    };

    const program = authorizeAdminUseCase(input);
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotAdminError);
      expect(either.left.resource).toBe("Challenge");
      expect(either.left.action).toBe("delete");
      expect(either.left.userId).toBe("user-456");
    }
  });

  it("should fail with NotAdminError for moderator user", async () => {
    const authContext: AuthContext = {
      userId: "mod-789",
      role: UserRole.MODERATOR,
      authenticatedAt: new Date(),
      sessionId: "session-789",
    };

    const input: AuthorizeAdminInput = {
      authContext,
      resource: "User",
      action: "update",
    };

    const program = authorizeAdminUseCase(input);
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotAdminError);
      expect(either.left.userId).toBe("mod-789");
    }
  });

  it("should use default resource and action when not provided", async () => {
    const authContext: AuthContext = {
      userId: "user-abc",
      role: UserRole.USER,
      authenticatedAt: new Date(),
      sessionId: "session-abc",
    };

    const input: AuthorizeAdminInput = {
      authContext,
    };

    const program = authorizeAdminUseCase(input);
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left.resource).toBe("admin operation");
      expect(either.left.action).toBe("execute");
    }
  });

  it("should authorize service role users", async () => {
    const authContext: AuthContext = {
      userId: "service-def",
      role: UserRole.SERVICE,
      authenticatedAt: new Date(),
      sessionId: "session-def",
    };

    const input: AuthorizeAdminInput = {
      authContext,
      resource: "System",
      action: "maintain",
    };

    const program = authorizeAdminUseCase(input);
    const either = await Effect.runPromise(Effect.either(program));

    // SERVICE role is not ADMIN, so it should fail
    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotAdminError);
    }
  });
});
