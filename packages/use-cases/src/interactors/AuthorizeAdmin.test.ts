import { describe, it, expect, beforeEach } from "bun:test";
import {
  AuthorizeAdminUseCase,
  type AuthorizeAdminInput,
} from "./AuthorizeAdmin";
import { AuthContext, UserRole, UserId, isOk, isErr } from "@mirai-app/domain";
import { UnauthorizedError } from "@mirai-app/domain/errors";

describe("[UNIT] AuthorizeAdminUseCase", () => {
  let useCase: AuthorizeAdminUseCase;
  let adminAuthContext: AuthContext;
  let moderatorAuthContext: AuthContext;
  let userAuthContext: AuthContext;

  // Valid UUIDs for testing
  const ADMIN_USER_ID = "550e8400-e29b-41d4-a716-446655440001";
  const MODERATOR_USER_ID = "550e8400-e29b-41d4-a716-446655440002";
  const REGULAR_USER_ID = "550e8400-e29b-41d4-a716-446655440003";

  beforeEach(() => {
    useCase = new AuthorizeAdminUseCase();

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

  describe("[UNIT] execute", () => {
    describe("[UNIT] ""ADMIN role () => {
      it("should return ok result when user has ADMIN role", () => {
        // Arrange
        const input: AuthorizeAdminInput = {
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

      it("should return ok result with custom resource and action", () => {
        // Arrange
        const input: AuthorizeAdminInput = {
          authContext: adminAuthContext,
          resource: "Challenge",
          action: "delete",
        };

        // Act
        const result = useCase.execute(input);

        // Assert
        expect(isOk(result)).toBe(true);
      });
    });

    describe("[UNIT] MODERATOR role", () => {
      it("should return error when user has MODERATOR role", () => {
        // Arrange
        const input: AuthorizeAdminInput = {
          authContext: moderatorAuthContext,
        };

        // Act
        const result = useCase.execute(input);

        // Assert
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toBeInstanceOf(UnauthorizedError);
          expect(result.error._tag).toBe("UnauthorizedError");
          expect(result.error.code).toBe("UNAUTHORIZED");
          expect(result.error.userId).toBe(MODERATOR_USER_ID);
          expect(result.error.resource).toBe("admin operation");
          expect(result.error.action).toBe("execute");
        }
      });

      it("should include custom resource and action in error", () => {
        // Arrange
        const input: AuthorizeAdminInput = {
          authContext: moderatorAuthContext,
          resource: "User",
          action: "promote",
        };

        // Act
        const result = useCase.execute(input);

        // Assert
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error.resource).toBe("User");
          expect(result.error.action).toBe("promote");
          expect(result.error.message).toContain("User");
          expect(result.error.message).toContain("promote");
        }
      });
    });

    describe("[UNIT] USER role", () => {
      it("should return error when user has USER role", () => {
        // Arrange
        const input: AuthorizeAdminInput = {
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
          expect(result.error.resource).toBe("admin operation");
          expect(result.error.action).toBe("execute");
        }
      });

      it("should include userId in error message", () => {
        // Arrange
        const input: AuthorizeAdminInput = {
          authContext: userAuthContext,
          resource: "Settings",
          action: "modify",
        };

        // Act
        const result = useCase.execute(input);

        // Assert
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error.message).toContain(REGULAR_USER_ID);
          expect(result.error.message).toContain("Settings");
          expect(result.error.message).toContain("modify");
        }
      });
    });

    describe("[UNIT] singleton instance", () => {
      it("should export a singleton instance", async () => {
        // Import the singleton
        const { authorizeAdminUseCase } = await import("./AuthorizeAdmin");
        expect(authorizeAdminUseCase).toBeInstanceOf(AuthorizeAdminUseCase);
      });

      it("singleton should work correctly", async () => {
        const { authorizeAdminUseCase } = await import("./AuthorizeAdmin");

        // Test success case
        const successResult = authorizeAdminUseCase.execute({
          authContext: adminAuthContext,
        });
        expect(isOk(successResult)).toBe(true);

        // Test failure case
        const failResult = authorizeAdminUseCase.execute({
          authContext: userAuthContext,
        });
        expect(isErr(failResult)).toBe(true);
      });
    });
  });
});
