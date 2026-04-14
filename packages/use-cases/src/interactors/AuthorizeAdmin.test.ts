import { describe, it, expect, beforeEach } from "bun:test";
import {
  authorizeAdminUseCase,
  type AuthorizeAdminInput,
  NotAdminError,
} from "./AuthorizeAdmin";
import { AuthContext, UserRole, UserId } from "@mirai-app/domain";
import { Effect } from "effect";

describe("[UNIT] AuthorizeAdminUseCase", () => {
  let adminAuthContext: AuthContext;
  let moderatorAuthContext: AuthContext;
  let userAuthContext: AuthContext;

  // Valid UUIDs for testing
  const ADMIN_USER_ID = "550e8400-e29b-41d4-a716-446655440001";
  const MODERATOR_USER_ID = "550e8400-e29b-41d4-a716-446655440002";
  const REGULAR_USER_ID = "550e8400-e29b-41d4-a716-446655440003";

  beforeEach(() => {
    const now = new Date();
    const adminUserId = UserId.create(ADMIN_USER_ID);
    const moderatorUserId = UserId.create(MODERATOR_USER_ID);
    const regularUserId = UserId.create(REGULAR_USER_ID);

    // Create auth contexts for each role using Effect.runSync
    const adminEffect = AuthContext.create({
      userId: adminUserId,
      role: UserRole.ADMIN,
      authenticatedAt: now,
    });
    const moderatorEffect = AuthContext.create({
      userId: moderatorUserId,
      role: UserRole.MODERATOR,
      authenticatedAt: now,
    });
    const userEffect = AuthContext.create({
      userId: regularUserId,
      role: UserRole.USER,
      authenticatedAt: now,
    });

    adminAuthContext = Effect.runSync(adminEffect);
    moderatorAuthContext = Effect.runSync(moderatorEffect);
    userAuthContext = Effect.runSync(userEffect);
  });

  describe("execute", () => {
    describe("ADMIN role", () => {
      it("should succeed when user has ADMIN role", async () => {
        // Arrange
        const input: AuthorizeAdminInput = {
          authContext: adminAuthContext,
        };

        // Act
        const program = authorizeAdminUseCase(input);
        const result = await Effect.runPromise(program);

        // Assert
        expect(result).toBeUndefined();
      });

      it("should succeed with custom resource and action", async () => {
        // Arrange
        const input: AuthorizeAdminInput = {
          authContext: adminAuthContext,
          resource: "Challenge",
          action: "delete",
        };

        // Act
        const program = authorizeAdminUseCase(input);
        const result = await Effect.runPromise(program);

        // Assert
        expect(result).toBeUndefined();
      });
    });

    describe("MODERATOR role", () => {
      it("should fail with NotAdminError when user has MODERATOR role", async () => {
        // Arrange
        const input: AuthorizeAdminInput = {
          authContext: moderatorAuthContext,
        };

        // Act & Assert
        const program = authorizeAdminUseCase(input);
        const either = await Effect.runPromise(Effect.either(program));

        expect(either._tag).toBe("Left");
        if (either._tag === "Left") {
          expect(either.left).toBeInstanceOf(NotAdminError);
          expect(either.left._tag).toBe("NotAdminError");
          expect(either.left.userId).toBe(MODERATOR_USER_ID);
          expect(either.left.resource).toBe("admin operation");
          expect(either.left.action).toBe("execute");
        }
      });

      it("should include custom resource and action in error", async () => {
        // Arrange
        const input: AuthorizeAdminInput = {
          authContext: moderatorAuthContext,
          resource: "User",
          action: "promote",
        };

        // Act & Assert
        const program = authorizeAdminUseCase(input);
        const either = await Effect.runPromise(Effect.either(program));

        expect(either._tag).toBe("Left");
        if (either._tag === "Left") {
          expect(either.left.resource).toBe("User");
          expect(either.left.action).toBe("promote");
        }
      });
    });

    describe("USER role", () => {
      it("should fail with NotAdminError when user has USER role", async () => {
        // Arrange
        const input: AuthorizeAdminInput = {
          authContext: userAuthContext,
        };

        // Act & Assert
        const program = authorizeAdminUseCase(input);
        const either = await Effect.runPromise(Effect.either(program));

        expect(either._tag).toBe("Left");
        if (either._tag === "Left") {
          expect(either.left).toBeInstanceOf(NotAdminError);
          expect(either.left._tag).toBe("NotAdminError");
          expect(either.left.userId).toBe(REGULAR_USER_ID);
          expect(either.left.resource).toBe("admin operation");
          expect(either.left.action).toBe("execute");
        }
      });

      it("should include userId in error", async () => {
        // Arrange
        const input: AuthorizeAdminInput = {
          authContext: userAuthContext,
          resource: "Settings",
          action: "modify",
        };

        // Act & Assert
        const program = authorizeAdminUseCase(input);
        const either = await Effect.runPromise(Effect.either(program));

        expect(either._tag).toBe("Left");
        if (either._tag === "Left") {
          expect(either.left.userId).toBe(REGULAR_USER_ID);
          expect(either.left.resource).toBe("Settings");
          expect(either.left.action).toBe("modify");
        }
      });
    });

    describe("function export", () => {
      it("should export a function (not a class)", async () => {
        // Verify it's a function, not a class
        expect(typeof authorizeAdminUseCase).toBe("function");
      });

      it("function should work correctly", async () => {
        // Test success case
        const successProgram = authorizeAdminUseCase({
          authContext: adminAuthContext,
        });
        const successResult = await Effect.runPromise(successProgram);
        expect(successResult).toBeUndefined();

        // Test failure case
        const failProgram = authorizeAdminUseCase({
          authContext: userAuthContext,
        });
        const failEither = await Effect.runPromise(Effect.either(failProgram));
        expect(failEither._tag).toBe("Left");
      });
    });
  });
});
