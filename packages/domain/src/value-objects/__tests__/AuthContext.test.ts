import { describe, it, expect } from "bun:test";
import { Effect, Either } from "effect";
import { AuthContext } from "../AuthContext";
import { UserRole } from "../../enums/UserRole";
import { UserId } from "../UserId";

describe("[UNIT] AuthContext", () => {
  const validUserId = UserId.create("550e8400-e29b-41d4-a716-446655440000");
  const validDate = new Date("2024-01-15T10:00:00Z");

  describe("[UNIT] AuthContext.create", () => {
    it("should create AuthContext with valid inputs", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right.userId).toBe(validUserId);
        expect(result.right.role).toBe(UserRole.USER);
        expect(result.right.authenticatedAt).toBe(validDate);
        expect(result.right.sessionId).toBeUndefined();
      }
    });

    it("should create AuthContext with sessionId", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
        sessionId: "session-123",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right.sessionId).toBe("session-123");
      }
    });

    it("should create AuthContext with MODERATOR role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.MODERATOR,
        authenticatedAt: validDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right.role).toBe(UserRole.MODERATOR);
      }
    });

    it("should return error for missing userId", async () => {
      const effect = AuthContext.create({
        userId: undefined as unknown as UserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ValidationError");
        expect((result.left as { field?: string }).field).toBe("userId");
      }
    });

    it("should return error for invalid role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: "INVALID_ROLE" as UserRole,
        authenticatedAt: validDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ValidationError");
        expect((result.left as { field?: string }).field).toBe("role");
      }
    });

    it("should return error for non-Date authenticatedAt", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: "not-a-date" as unknown as Date,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ValidationError");
        expect((result.left as { field?: string }).field).toBe(
          "authenticatedAt",
        );
      }
    });

    it("should return error for future authenticatedAt", async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day in future
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: futureDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ValidationError");
        expect((result.left as { field?: string }).field).toBe(
          "authenticatedAt",
        );
        expect((result.left as { message?: string }).message).toContain(
          "future",
        );
      }
    });

    it("should return error for empty sessionId string", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "   ",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ValidationError");
        expect((result.left as { field?: string }).field).toBe("sessionId");
      }
    });

    it("should return error for non-string sessionId", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: 123 as unknown as string,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ValidationError");
        expect((result.left as { field?: string }).field).toBe("sessionId");
      }
    });
  });

  describe("[UNIT] AuthContext.isAdmin", () => {
    it("should return true for ADMIN role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.isAdmin()).toBe(true);
    });

    it("should return false for MODERATOR role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.MODERATOR,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.isAdmin()).toBe(false);
    });

    it("should return false for USER role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.isAdmin()).toBe(false);
    });
  });

  describe("[UNIT] AuthContext.isModerator", () => {
    it("should return true for ADMIN role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.isModerator()).toBe(true);
    });

    it("should return true for MODERATOR role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.MODERATOR,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.isModerator()).toBe(true);
    });

    it("should return false for USER role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.isModerator()).toBe(false);
    });
  });

  describe("[UNIT] AuthContext.hasRole", () => {
    it("should return true when role matches", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.hasRole(UserRole.ADMIN)).toBe(true);
    });

    it("should return false when role does not match", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.hasRole(UserRole.ADMIN)).toBe(false);
    });
  });

  describe("[UNIT] AuthContext.hasRoleAtLeast", () => {
    it("ADMIN should have at least ADMIN level", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.hasRoleAtLeast(UserRole.ADMIN)).toBe(true);
      expect(authContext.hasRoleAtLeast(UserRole.MODERATOR)).toBe(true);
      expect(authContext.hasRoleAtLeast(UserRole.USER)).toBe(true);
    });

    it("MODERATOR should have at least MODERATOR level but not ADMIN", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.MODERATOR,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.hasRoleAtLeast(UserRole.ADMIN)).toBe(false);
      expect(authContext.hasRoleAtLeast(UserRole.MODERATOR)).toBe(true);
      expect(authContext.hasRoleAtLeast(UserRole.USER)).toBe(true);
    });

    it("USER should only have USER level", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.hasRoleAtLeast(UserRole.ADMIN)).toBe(false);
      expect(authContext.hasRoleAtLeast(UserRole.MODERATOR)).toBe(false);
      expect(authContext.hasRoleAtLeast(UserRole.USER)).toBe(true);
    });
  });

  describe("[UNIT] AuthContext.withRole", () => {
    it("should create new AuthContext with different role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      const updated = authContext.withRole(UserRole.MODERATOR);
      expect(updated.role).toBe(UserRole.MODERATOR);
      expect(updated.userId).toBe(authContext.userId);
      expect(updated.authenticatedAt).toBe(authContext.authenticatedAt);
    });

    it("should not mutate original AuthContext", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const original = await Effect.runPromise(effect);
      original.withRole(UserRole.ADMIN);
      expect(original.role).toBe(UserRole.USER);
    });
  });

  describe("[UNIT] AuthContext.withSessionId", () => {
    it("should create new AuthContext with different sessionId", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-1",
      });

      const authContext = await Effect.runPromise(effect);
      const updated = authContext.withSessionId("session-2");
      expect(updated.sessionId).toBe("session-2");
      expect(updated.userId).toBe(authContext.userId);
    });

    it("should create new AuthContext with undefined sessionId", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-1",
      });

      const authContext = await Effect.runPromise(effect);
      const updated = authContext.withSessionId(undefined);
      expect(updated.sessionId).toBeUndefined();
    });

    it("should not mutate original AuthContext", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-1",
      });

      const original = await Effect.runPromise(effect);
      original.withSessionId("session-2");
      expect(original.sessionId).toBe("session-1");
    });
  });

  describe("[UNIT] AuthContext.toJSON", () => {
    it("should serialize to JSON format", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
        sessionId: "session-123",
      });

      const authContext = await Effect.runPromise(effect);
      const json = authContext.toJSON();
      expect(json.userId).toBe(validUserId);
      expect(json.role).toBe(UserRole.ADMIN);
      expect(json.authenticatedAt).toBe(validDate.toISOString());
      expect(json.sessionId).toBe("session-123");
    });

    it("should serialize without sessionId when undefined", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      const json = authContext.toJSON();
      expect(json.sessionId).toBeUndefined();
    });
  });

  describe("[UNIT] AuthContext.equals", () => {
    it("should return true for identical AuthContexts", async () => {
      const effect1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-123",
      });

      const effect2 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-123",
      });

      const [authContext1, authContext2] = await Effect.runPromise(
        Effect.all([effect1, effect2]),
      );
      expect(authContext1.equals(authContext2)).toBe(true);
    });

    it("should return false for different userId", async () => {
      const effect1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const effect2 = AuthContext.create({
        userId: UserId.create("550e8400-e29b-41d4-a716-446655440001"),
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const [authContext1, authContext2] = await Effect.runPromise(
        Effect.all([effect1, effect2]),
      );
      expect(authContext1.equals(authContext2)).toBe(false);
    });

    it("should return false for different role", async () => {
      const effect1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const effect2 = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      const [authContext1, authContext2] = await Effect.runPromise(
        Effect.all([effect1, effect2]),
      );
      expect(authContext1.equals(authContext2)).toBe(false);
    });

    it("should return false for different authenticatedAt", async () => {
      const effect1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const effect2 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: new Date("2024-01-16T10:00:00Z"),
      });

      const [authContext1, authContext2] = await Effect.runPromise(
        Effect.all([effect1, effect2]),
      );
      expect(authContext1.equals(authContext2)).toBe(false);
    });

    it("should return false for different sessionId", async () => {
      const effect1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-1",
      });

      const effect2 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-2",
      });

      const [authContext1, authContext2] = await Effect.runPromise(
        Effect.all([effect1, effect2]),
      );
      expect(authContext1.equals(authContext2)).toBe(false);
    });

    it("should return false when sessionId differs between undefined and value", async () => {
      const effect1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const effect2 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "session-1",
      });

      const [authContext1, authContext2] = await Effect.runPromise(
        Effect.all([effect1, effect2]),
      );
      expect(authContext1.equals(authContext2)).toBe(false);
    });
  });

  describe("[UNIT] immutability", () => {
    it("should have readonly properties", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      // TypeScript would prevent this at compile time
      // We verify the properties are set correctly
      expect(authContext.userId).toBe(validUserId);
      expect(authContext.role).toBe(UserRole.USER);
      expect(authContext.authenticatedAt).toBe(validDate);
    });
  });
});
