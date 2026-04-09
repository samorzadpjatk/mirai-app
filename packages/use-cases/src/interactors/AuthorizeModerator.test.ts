import { describe, it, expect, beforeEach } from "bun:test";
import {
  AuthorizeModeratorUseCase,
  type AuthorizeModeratorInput,
} from "./AuthorizeModerator";
import { AuthContext, UserRole, UserId, isOk, isErr } from "@mirai-app/domain";
import { UnauthorizedError } from "@mirai-app/domain/errors";

describe("[UNIT] AuthorizeModeratorUseCase", () => {
  let useCase: AuthorizeModeratorUseCase;
  let adminAuthContext: AuthContext;
  let moderatorAuthContext: AuthContext;
  let userAuthContext: AuthContext;

  // Valid UUIDs for testing
  const ADMIN_USER_ID = "550e8400-e29b-41d4-a716-446655440001";
  const MODERATOR_USER_ID = "550e8400-e29b-41d4-a716-446655440002";
  const REGULAR_USER_ID = "550e8400-e29b-41d4-a716-446655440003";

  beforeEach(() => {
    useCase = new AuthorizeModeratorUseCase();

    const now = new Date();
    const adminUserId = UserId.create(ADMIN_USER_ID);
    const moderatorUserId = UserId.create(MODERATOR_USER_ID);
    const regularUserId = UserId.create(REGULAR_USER_ID);

    // Create auth contexts for each role
    const adminResult = AuthContext.create({
      userId: adminUserId,
      role: UserRole.ADMIN,
      authenticatedAt: now,
    });
    const moderatorResult = AuthContext.create({
      userId: moderatorUserId,
      role: UserRole.MODERATOR,
      authenticatedAt: now,
    });
    const userResult = AuthContext.create({
      userId: regularUserId,
      role: UserRole.USER,
      authenticatedAt: now,
    });

    if (isErr(adminResult) || isErr(moderatorResult) || isErr(userResult)) {
      throw new Error("Failed to create test auth contexts");
    }

    adminAuthContext = adminResult.value;
    moderatorAuthContext = moderatorResult.value;
    userAuthContext = userResult.value;
  });

  describe("execute", () => {
    describe("ADMIN role", () => {
      it("should return ok result when user has ADMIN role", () => {
        // Arrange
        const input: AuthorizeModeratorInput = {
          authContext: adminAuthContext,
        };

        // Act
        const result = useCase.execute(input);

        // Assert
        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toBeUndefined();
        }
      });

      it("should allow admin to perform moderator operations with custom context", () => {
        // Arrange
        const input: AuthorizeModeratorInput = {
          authContext: adminAuthContext,
          resource: "Report",
          action: "resolve",
        };

        // Act
        const result = useCase.execute(input);

        // Assert
        expect(isOk(result)).toBe(true);
      });
    });

    describe("MODERATOR role", () => {
      it("should return ok result when user has MODERATOR role", () => {
        // Arrange
        const input: AuthorizeModeratorInput = {
          authContext: moderatorAuthContext,
        };

        // Act
        const result = useCase.execute(input);

        // Assert
        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toBeUndefined();
        }
      });

      it("should allow moderator with custom resource and action", () => {
        // Arrange
        const input: AuthorizeModeratorInput = {
          authContext: moderatorAuthContext,
          resource: "Submission",
          action: "approve",
        };

        // Act
        const result = useCase.execute(input);

        // Assert
        expect(isOk(result)).toBe(true);
      });
    });

    describe("USER role", () => {
      it("should return error when user has USER role", () => {
        // Arrange
        const input: AuthorizeModeratorInput = {
          authContext: userAuthContext,
        };

        // Act
        const result = useCase.execute(input);

        // Assert
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toBeInstanceOf(UnauthorizedError);
          expect(result.error._tag).toBe("UnauthorizedError");
          expect(result.error.code).toBe("UNAUTHORIZED");
          expect(result.error.userId).toBe(REGULAR_USER_ID);
          expect(result.error.resource).toBe("moderator operation");
          expect(result.error.action).toBe("execute");
        }
      });

      it("should include custom resource and action in error", () => {
        // Arrange
        const input: AuthorizeModeratorInput = {
          authContext: userAuthContext,
          resource: "Content",
          action: "moderate",
        };

        // Act
        const result = useCase.execute(input);

        // Assert
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error.resource).toBe("Content");
          expect(result.error.action).toBe("moderate");
          expect(result.error.message).toContain("Content");
          expect(result.error.message).toContain("moderate");
        }
      });

      it("should include userId in error message", () => {
        // Arrange
        const input: AuthorizeModeratorInput = {
          authContext: userAuthContext,
        };

        // Act
        const result = useCase.execute(input);

        // Assert
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error.message).toContain(REGULAR_USER_ID);
        }
      });
    });

    describe("role hierarchy behavior", () => {
      it("ADMIN should be able to perform all moderator operations (higher privilege)", () => {
        // This test documents that ADMIN > MODERATOR in the role hierarchy
        const operations = [
          { resource: "Submission", action: "moderate" },
          { resource: "Report", action: "review" },
          { resource: "User", action: "suspend" },
        ];

        for (const op of operations) {
          const result = useCase.execute({
            authContext: adminAuthContext,
            resource: op.resource,
            action: op.action,
          });

          expect(isOk(result)).toBe(true);
        }
      });

      it("MODERATOR should be able to perform moderator operations", () => {
        const operations = [
          { resource: "Submission", action: "moderate" },
          { resource: "Report", action: "review" },
        ];

        for (const op of operations) {
          const result = useCase.execute({
            authContext: moderatorAuthContext,
            resource: op.resource,
            action: op.action,
          });

          expect(isOk(result)).toBe(true);
        }
      });
    });

    describe("singleton instance", () => {
      it("should export a singleton instance", async () => {
        // Import the singleton
        const { authorizeModeratorUseCase } =
          await import("./AuthorizeModerator");
        expect(authorizeModeratorUseCase).toBeInstanceOf(
          AuthorizeModeratorUseCase,
        );
      });

      it("singleton should work correctly for all role combinations", async () => {
        const { authorizeModeratorUseCase } =
          await import("./AuthorizeModerator");

        // Test ADMIN (should succeed)
        const adminResult = authorizeModeratorUseCase.execute({
          authContext: adminAuthContext,
        });
        expect(isOk(adminResult)).toBe(true);

        // Test MODERATOR (should succeed)
        const moderatorResult = authorizeModeratorUseCase.execute({
          authContext: moderatorAuthContext,
        });
        expect(isOk(moderatorResult)).toBe(true);

        // Test USER (should fail)
        const userResult = authorizeModeratorUseCase.execute({
          authContext: userAuthContext,
        });
        expect(isErr(userResult)).toBe(true);
      });
    });
  });
});
