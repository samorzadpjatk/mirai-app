import { describe, it, expect, beforeEach } from "bun:test";
import {
  authorizeModeratorUseCase,
  type AuthorizeModeratorInput,
  NotModeratorError,
} from "./authorize-moderator";
import { AuthContext, UserRole, UserId } from "@mirai-app/domain";
import { Effect } from "effect";

describe("[UNIT] AuthorizeModeratorUseCase", () => {
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
        const input: AuthorizeModeratorInput = {
          authContext: adminAuthContext,
        };

        // Act
        const program = authorizeModeratorUseCase(input);
        const result = await Effect.runPromise(program);

        // Assert
        expect(result).toBeUndefined();
      });

      it("should allow admin to perform moderator operations with custom context", async () => {
        // Arrange
        const input: AuthorizeModeratorInput = {
          authContext: adminAuthContext,
          resource: "Report",
          action: "resolve",
        };

        // Act
        const program = authorizeModeratorUseCase(input);
        const result = await Effect.runPromise(program);

        // Assert
        expect(result).toBeUndefined();
      });
    });

    describe("MODERATOR role", () => {
      it("should succeed when user has MODERATOR role", async () => {
        // Arrange
        const input: AuthorizeModeratorInput = {
          authContext: moderatorAuthContext,
        };

        // Act
        const program = authorizeModeratorUseCase(input);
        const result = await Effect.runPromise(program);

        // Assert
        expect(result).toBeUndefined();
      });

      it("should allow moderator with custom resource and action", async () => {
        // Arrange
        const input: AuthorizeModeratorInput = {
          authContext: moderatorAuthContext,
          resource: "Submission",
          action: "approve",
        };

        // Act
        const program = authorizeModeratorUseCase(input);
        const result = await Effect.runPromise(program);

        // Assert
        expect(result).toBeUndefined();
      });
    });

    describe("USER role", () => {
      it("should fail with NotModeratorError when user has USER role", async () => {
        // Arrange
        const input: AuthorizeModeratorInput = {
          authContext: userAuthContext,
        };

        // Act & Assert
        const program = authorizeModeratorUseCase(input);
        const either = await Effect.runPromise(Effect.either(program));

        expect(either._tag).toBe("Left");
        if (either._tag === "Left") {
          expect(either.left).toBeInstanceOf(NotModeratorError);
          expect(either.left._tag).toBe("NotModeratorError");
          expect(either.left.userId).toBe(REGULAR_USER_ID);
          expect(either.left.resource).toBe("moderator operation");
          expect(either.left.action).toBe("execute");
        }
      });

      it("should include custom resource and action in error", async () => {
        // Arrange
        const input: AuthorizeModeratorInput = {
          authContext: userAuthContext,
          resource: "Content",
          action: "moderate",
        };

        // Act & Assert
        const program = authorizeModeratorUseCase(input);
        const either = await Effect.runPromise(Effect.either(program));

        expect(either._tag).toBe("Left");
        if (either._tag === "Left") {
          expect(either.left.resource).toBe("Content");
          expect(either.left.action).toBe("moderate");
        }
      });

      it("should include userId in error", async () => {
        // Arrange
        const input: AuthorizeModeratorInput = {
          authContext: userAuthContext,
        };

        // Act & Assert
        const program = authorizeModeratorUseCase(input);
        const either = await Effect.runPromise(Effect.either(program));

        expect(either._tag).toBe("Left");
        if (either._tag === "Left") {
          expect(either.left.userId).toBe(REGULAR_USER_ID);
        }
      });
    });

    describe("role hierarchy behavior", () => {
      it("ADMIN should be able to perform all moderator operations (higher privilege)", async () => {
        // This test documents that ADMIN > MODERATOR in the role hierarchy
        const operations = [
          { resource: "Submission", action: "moderate" },
          { resource: "Report", action: "review" },
          { resource: "User", action: "suspend" },
        ];

        for (const op of operations) {
          const program = authorizeModeratorUseCase({
            authContext: adminAuthContext,
            resource: op.resource,
            action: op.action,
          });

          const result = await Effect.runPromise(program);
          expect(result).toBeUndefined();
        }
      });

      it("MODERATOR should be able to perform moderator operations", async () => {
        const operations = [
          { resource: "Submission", action: "moderate" },
          { resource: "Report", action: "review" },
        ];

        for (const op of operations) {
          const program = authorizeModeratorUseCase({
            authContext: moderatorAuthContext,
            resource: op.resource,
            action: op.action,
          });

          const result = await Effect.runPromise(program);
          expect(result).toBeUndefined();
        }
      });
    });

    describe("function export", () => {
      it("should export a function (not a class)", async () => {
        // Verify it's a function, not a class
        expect(typeof authorizeModeratorUseCase).toBe("function");
      });

      it("function should work correctly for all role combinations", async () => {
        // Test ADMIN (should succeed)
        const adminProgram = authorizeModeratorUseCase({
          authContext: adminAuthContext,
        });
        const adminResult = await Effect.runPromise(adminProgram);
        expect(adminResult).toBeUndefined();

        // Test MODERATOR (should succeed)
        const moderatorProgram = authorizeModeratorUseCase({
          authContext: moderatorAuthContext,
        });
        const moderatorResult = await Effect.runPromise(moderatorProgram);
        expect(moderatorResult).toBeUndefined();

        // Test USER (should fail)
        const userProgram = authorizeModeratorUseCase({
          authContext: userAuthContext,
        });
        const userEither = await Effect.runPromise(Effect.either(userProgram));
        expect(userEither._tag).toBe("Left");
      });
    });
  });
});
