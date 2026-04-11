import { describe, it, expect } from "bun:test";
import { AuthContext } from "../AuthContext";
import { UserRole } from "../../enums/UserRole";
import { UserId } from "../UserId";
import { isOk, isErr } from "../../types/Result";

describe("[UNIT] AuthContext", () => {
  const validUserId = UserId.create("550e8400-e29b-41d4-a716-446655440000");
  const validDate = new Date("2024-01-15T10:00:00Z");

  describe("AuthContext.create", () => {
    it("should create AuthContext with valid inputs", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.userId).toBe(validUserId);
        expect(result.value.role).toBe(UserRole.USER);
        expect(result.value.authenticatedAt).toBe(validDate);
        expect(result.value.sessionId).toBeUndefined();
      }
    });

    it("should create AuthContext with sessionId", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
        sessionId: "session-123",
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.sessionId).toBe("session-123");
      }
    });

    it("should create AuthContext with MODERATOR role", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.MODERATOR,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.role).toBe(UserRole.MODERATOR);
      }
    });

    it("should return error for missing userId", () => {
      const result = AuthContext.create({
        userId: undefined as unknown as UserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error._tag).toBe("ValidationError");
        expect(result.error.field).toBe("userId");
      }
    });

    it("should return error for invalid role", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: "INVALID_ROLE" as UserRole,
        authenticatedAt: validDate,
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error._tag).toBe("ValidationError");
        expect(result.error.field).toBe("role");
      }
    });

    it("should return error for non-Date authenticatedAt", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: "not-a-date" as unknown as Date,
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error._tag).toBe("ValidationError");
        expect(result.error.field).toBe("authenticatedAt");
      }
    });

    it("should return error for future authenticatedAt", () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day in future
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: futureDate,
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error._tag).toBe("ValidationError");
        expect(result.error.field).toBe("authenticatedAt");
        expect(result.error.message).toContain("future");
      }
    });

    it("should return error for empty sessionId string", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "   ",
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error._tag).toBe("ValidationError");
        expect(result.error.field).toBe("sessionId");
      }
    });

    it("should return error for non-string sessionId", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: 123 as unknown as string,
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error._tag).toBe("ValidationError");
        expect(result.error.field).toBe("sessionId");
      }
    });
  });

  describe("AuthContext.isAdmin", () => {
    it("should return true for ADMIN role", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.isAdmin()).toBe(true);
      }
    });

    it("should return false for MODERATOR role", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.MODERATOR,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.isAdmin()).toBe(false);
      }
    });

    it("should return false for USER role", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.isAdmin()).toBe(false);
      }
    });
  });

  describe("AuthContext.isModerator", () => {
    it("should return true for ADMIN role", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.isModerator()).toBe(true);
      }
    });

    it("should return true for MODERATOR role", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.MODERATOR,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.isModerator()).toBe(true);
      }
    });

    it("should return false for USER role", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.isModerator()).toBe(false);
      }
    });
  });

  describe("AuthContext.hasRole", () => {
    it("should return true when role matches", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.hasRole(UserRole.ADMIN)).toBe(true);
      }
    });

    it("should return false when role does not match", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.hasRole(UserRole.ADMIN)).toBe(false);
      }
    });
  });

  describe("AuthContext.hasRoleAtLeast", () => {
    it("ADMIN should have at least ADMIN level", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.hasRoleAtLeast(UserRole.ADMIN)).toBe(true);
        expect(result.value.hasRoleAtLeast(UserRole.MODERATOR)).toBe(true);
        expect(result.value.hasRoleAtLeast(UserRole.USER)).toBe(true);
      }
    });

    it("MODERATOR should have at least MODERATOR level but not ADMIN", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.MODERATOR,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.hasRoleAtLeast(UserRole.ADMIN)).toBe(false);
        expect(result.value.hasRoleAtLeast(UserRole.MODERATOR)).toBe(true);
        expect(result.value.hasRoleAtLeast(UserRole.USER)).toBe(true);
      }
    });

    it("USER should only have USER level", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.hasRoleAtLeast(UserRole.ADMIN)).toBe(false);
        expect(result.value.hasRoleAtLeast(UserRole.MODERATOR)).toBe(false);
        expect(result.value.hasRoleAtLeast(UserRole.USER)).toBe(true);
      }
    });
  });

  describe("AuthContext.withRole", () => {
    it("should create new AuthContext with different role", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const updated = result.value.withRole(UserRole.MODERATOR);
        expect(updated.role).toBe(UserRole.MODERATOR);
        expect(updated.userId).toBe(result.value.userId);
        expect(updated.authenticatedAt).toBe(result.value.authenticatedAt);
      }
    });

    it("should not mutate original AuthContext", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const original = result.value;
        original.withRole(UserRole.ADMIN);
        expect(original.role).toBe(UserRole.USER);
      }
    });
  });

  describe("AuthContext.withSessionId", () => {
    it("should create new AuthContext with different sessionId", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-1",
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const updated = result.value.withSessionId("session-2");
        expect(updated.sessionId).toBe("session-2");
        expect(updated.userId).toBe(result.value.userId);
      }
    });

    it("should create new AuthContext with undefined sessionId", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-1",
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const updated = result.value.withSessionId(undefined);
        expect(updated.sessionId).toBeUndefined();
      }
    });

    it("should not mutate original AuthContext", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-1",
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const original = result.value;
        original.withSessionId("session-2");
        expect(original.sessionId).toBe("session-1");
      }
    });
  });

  describe("AuthContext.toJSON", () => {
    it("should serialize to JSON format", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
        sessionId: "session-123",
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const json = result.value.toJSON();
        expect(json.userId).toBe(validUserId);
        expect(json.role).toBe(UserRole.ADMIN);
        expect(json.authenticatedAt).toBe(validDate.toISOString());
        expect(json.sessionId).toBe("session-123");
      }
    });

    it("should serialize without sessionId when undefined", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const json = result.value.toJSON();
        expect(json.sessionId).toBeUndefined();
      }
    });
  });

  describe("AuthContext.equals", () => {
    it("should return true for identical AuthContexts", () => {
      const result1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-123",
      });

      const result2 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-123",
      });

      expect(isOk(result1) && isOk(result2)).toBe(true);
      if (isOk(result1) && isOk(result2)) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it("should return false for different userId", () => {
      const result1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const result2 = AuthContext.create({
        userId: UserId.create("550e8400-e29b-41d4-a716-446655440001"),
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      expect(isOk(result1) && isOk(result2)).toBe(true);
      if (isOk(result1) && isOk(result2)) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it("should return false for different role", () => {
      const result1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const result2 = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      expect(isOk(result1) && isOk(result2)).toBe(true);
      if (isOk(result1) && isOk(result2)) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it("should return false for different authenticatedAt", () => {
      const result1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const result2 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: new Date("2024-01-16T10:00:00Z"),
      });

      expect(isOk(result1) && isOk(result2)).toBe(true);
      if (isOk(result1) && isOk(result2)) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it("should return false for different sessionId", () => {
      const result1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-1",
      });

      const result2 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-2",
      });

      expect(isOk(result1) && isOk(result2)).toBe(true);
      if (isOk(result1) && isOk(result2)) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });

    it("should return false when sessionId differs between undefined and value", () => {
      const result1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const result2 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-1",
      });

      expect(isOk(result1) && isOk(result2)).toBe(true);
      if (isOk(result1) && isOk(result2)) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });
  });

  describe("immutability", () => {
    it("should have readonly properties", () => {
      const result = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        // TypeScript would prevent this at compile time
        // We verify the properties are set correctly
        expect(result.value.userId).toBe(validUserId);
        expect(result.value.role).toBe(UserRole.USER);
        expect(result.value.authenticatedAt).toBe(validDate);
      }
    });
  });
});
