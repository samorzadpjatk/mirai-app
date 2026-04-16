import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { AuthContext } from "./auth-context";
import { Id } from "./id";
import { UserRole } from "../enums";
import { ValidationError } from "../../system/errors";

describe("[UNIT] AuthContext", () => {
  const validUserId = Id.create("550e8400-e29b-41d4-a716-446655440000");
  const validDate = new Date("2024-01-01T00:00:00.000Z");
  const validSessionId = "session-123";

  describe("[UNIT] AuthContext.create", () => {
    it("creates AuthContext with all valid props including sessionId", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: validSessionId,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.userId).toBe(validUserId);
      expect(authContext.role).toBe(UserRole.USER);
      expect(authContext.authenticatedAt).toBe(validDate);
      expect(authContext.sessionId).toBe(validSessionId);
    });

    it("creates AuthContext without sessionId", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.userId).toBe(validUserId);
      expect(authContext.role).toBe(UserRole.ADMIN);
      expect(authContext.authenticatedAt).toBe(validDate);
      expect(authContext.sessionId).toBeUndefined();
    });

    it("creates AuthContext with current date", async () => {
      const now = new Date();
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.MODERATOR,
        authenticatedAt: now,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.authenticatedAt).toBe(now);
    });

    it("fails when userId is missing", async () => {
      const effect = AuthContext.create({
        userId: undefined as unknown as Id,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("userId");
        expect(result.left.message).toBe("UserId is required");
      }
    });

    it("fails when userId is null", async () => {
      const effect = AuthContext.create({
        userId: null as unknown as Id,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("userId");
      }
    });

    it("fails for invalid role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: "INVALID_ROLE" as UserRole,
        authenticatedAt: validDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("role");
        expect(result.left.message).toContain("Invalid role");
      }
    });

    it("fails when authenticatedAt is not a Date", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: "2024-01-01" as unknown as Date,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("authenticatedAt");
        expect(result.left.message).toBe(
          "authenticatedAt must be a valid Date",
        );
      }
    });

    it("fails when authenticatedAt is in the future", async () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: futureDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("authenticatedAt");
        expect(result.left.message).toBe(
          "authenticatedAt cannot be in the future",
        );
      }
    });

    it("fails when sessionId is not a string", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: 123 as unknown as string,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("sessionId");
        expect(result.left.message).toBe("sessionId must be a string");
      }
    });

    it("fails when sessionId is empty string", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("sessionId");
        expect(result.left.message).toBe("sessionId cannot be empty");
      }
    });

    it("fails when sessionId is whitespace only", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "   ",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("sessionId");
        expect(result.left.message).toBe("sessionId cannot be empty");
      }
    });
  });

  describe("[UNIT] AuthContext.isAdmin", () => {
    it("returns true for ADMIN role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.isAdmin()).toBe(true);
    });

    it("returns false for MODERATOR role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.MODERATOR,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.isAdmin()).toBe(false);
    });

    it("returns false for USER role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.isAdmin()).toBe(false);
    });

    it("returns false for SERVICE role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.SERVICE,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.isAdmin()).toBe(false);
    });
  });

  describe("[UNIT] AuthContext.isModerator", () => {
    it("returns true for ADMIN role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.isModerator()).toBe(true);
    });

    it("returns true for MODERATOR role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.MODERATOR,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.isModerator()).toBe(true);
    });

    it("returns false for USER role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.isModerator()).toBe(false);
    });

    it("returns false for SERVICE role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.SERVICE,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.isModerator()).toBe(false);
    });
  });

  describe("[UNIT] AuthContext.hasRole", () => {
    it("returns true when role matches exactly", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.hasRole(UserRole.ADMIN)).toBe(true);
    });

    it("returns false when role does not match", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.hasRole(UserRole.ADMIN)).toBe(false);
    });

    it("returns true for each specific role", async () => {
      const roles = [
        UserRole.USER,
        UserRole.MODERATOR,
        UserRole.ADMIN,
        UserRole.SERVICE,
      ];

      for (const role of roles) {
        const effect = AuthContext.create({
          userId: validUserId,
          role,
          authenticatedAt: validDate,
        });

        const authContext = await Effect.runPromise(effect);
        expect(authContext.hasRole(role)).toBe(true);
      }
    });
  });

  describe("[UNIT] AuthContext.hasRoleAtLeast", () => {
    describe("ADMIN role hierarchy", () => {
      it("ADMIN has access to ADMIN level", async () => {
        const effect = AuthContext.create({
          userId: validUserId,
          role: UserRole.ADMIN,
          authenticatedAt: validDate,
        });

        const authContext = await Effect.runPromise(effect);
        expect(authContext.hasRoleAtLeast(UserRole.ADMIN)).toBe(true);
      });

      it("ADMIN has access to MODERATOR level", async () => {
        const effect = AuthContext.create({
          userId: validUserId,
          role: UserRole.ADMIN,
          authenticatedAt: validDate,
        });

        const authContext = await Effect.runPromise(effect);
        expect(authContext.hasRoleAtLeast(UserRole.MODERATOR)).toBe(true);
      });

      it("ADMIN has access to USER level", async () => {
        const effect = AuthContext.create({
          userId: validUserId,
          role: UserRole.ADMIN,
          authenticatedAt: validDate,
        });

        const authContext = await Effect.runPromise(effect);
        expect(authContext.hasRoleAtLeast(UserRole.USER)).toBe(true);
      });
    });

    describe("MODERATOR role hierarchy", () => {
      it("MODERATOR does not have access to ADMIN level", async () => {
        const effect = AuthContext.create({
          userId: validUserId,
          role: UserRole.MODERATOR,
          authenticatedAt: validDate,
        });

        const authContext = await Effect.runPromise(effect);
        expect(authContext.hasRoleAtLeast(UserRole.ADMIN)).toBe(false);
      });

      it("MODERATOR has access to MODERATOR level", async () => {
        const effect = AuthContext.create({
          userId: validUserId,
          role: UserRole.MODERATOR,
          authenticatedAt: validDate,
        });

        const authContext = await Effect.runPromise(effect);
        expect(authContext.hasRoleAtLeast(UserRole.MODERATOR)).toBe(true);
      });

      it("MODERATOR has access to USER level", async () => {
        const effect = AuthContext.create({
          userId: validUserId,
          role: UserRole.MODERATOR,
          authenticatedAt: validDate,
        });

        const authContext = await Effect.runPromise(effect);
        expect(authContext.hasRoleAtLeast(UserRole.USER)).toBe(true);
      });
    });

    describe("USER role hierarchy", () => {
      it("USER does not have access to ADMIN level", async () => {
        const effect = AuthContext.create({
          userId: validUserId,
          role: UserRole.USER,
          authenticatedAt: validDate,
        });

        const authContext = await Effect.runPromise(effect);
        expect(authContext.hasRoleAtLeast(UserRole.ADMIN)).toBe(false);
      });

      it("USER does not have access to MODERATOR level", async () => {
        const effect = AuthContext.create({
          userId: validUserId,
          role: UserRole.USER,
          authenticatedAt: validDate,
        });

        const authContext = await Effect.runPromise(effect);
        expect(authContext.hasRoleAtLeast(UserRole.MODERATOR)).toBe(false);
      });

      it("USER has access to USER level", async () => {
        const effect = AuthContext.create({
          userId: validUserId,
          role: UserRole.USER,
          authenticatedAt: validDate,
        });

        const authContext = await Effect.runPromise(effect);
        expect(authContext.hasRoleAtLeast(UserRole.USER)).toBe(true);
      });
    });

    describe("SERVICE role hierarchy", () => {
      it("SERVICE has access to ADMIN level", async () => {
        const effect = AuthContext.create({
          userId: validUserId,
          role: UserRole.SERVICE,
          authenticatedAt: validDate,
        });

        const authContext = await Effect.runPromise(effect);
        expect(authContext.hasRoleAtLeast(UserRole.ADMIN)).toBe(true);
      });

      it("SERVICE has access to MODERATOR level", async () => {
        const effect = AuthContext.create({
          userId: validUserId,
          role: UserRole.SERVICE,
          authenticatedAt: validDate,
        });

        const authContext = await Effect.runPromise(effect);
        expect(authContext.hasRoleAtLeast(UserRole.MODERATOR)).toBe(true);
      });

      it("SERVICE has access to USER level", async () => {
        const effect = AuthContext.create({
          userId: validUserId,
          role: UserRole.SERVICE,
          authenticatedAt: validDate,
        });

        const authContext = await Effect.runPromise(effect);
        expect(authContext.hasRoleAtLeast(UserRole.USER)).toBe(true);
      });
    });
  });

  describe("[UNIT] AuthContext.withRole", () => {
    it("returns new AuthContext with updated role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: validSessionId,
      });

      const authContext = await Effect.runPromise(effect);
      const updated = authContext.withRole(UserRole.ADMIN);

      expect(updated.role).toBe(UserRole.ADMIN);
      expect(updated.isAdmin()).toBe(true);
    });

    it("preserves other properties when updating role", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: validSessionId,
      });

      const authContext = await Effect.runPromise(effect);
      const updated = authContext.withRole(UserRole.MODERATOR);

      expect(updated.userId).toBe(validUserId);
      expect(updated.authenticatedAt).toBe(validDate);
      expect(updated.sessionId).toBe(validSessionId);
      expect(updated.role).toBe(UserRole.MODERATOR);
    });

    it("does not mutate original instance", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      const updated = authContext.withRole(UserRole.ADMIN);

      expect(authContext.role).toBe(UserRole.USER);
      expect(updated.role).toBe(UserRole.ADMIN);
    });

    it("allows role downgrade", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      const updated = authContext.withRole(UserRole.USER);

      expect(updated.role).toBe(UserRole.USER);
      expect(updated.isAdmin()).toBe(false);
    });
  });

  describe("[UNIT] AuthContext.withSessionId", () => {
    it("returns new AuthContext with updated sessionId", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "old-session",
      });

      const authContext = await Effect.runPromise(effect);
      const updated = authContext.withSessionId("new-session");

      expect(updated.sessionId).toBe("new-session");
    });

    it("preserves other properties when updating sessionId", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
        sessionId: "old-session",
      });

      const authContext = await Effect.runPromise(effect);
      const updated = authContext.withSessionId("new-session");

      expect(updated.userId).toBe(validUserId);
      expect(updated.role).toBe(UserRole.ADMIN);
      expect(updated.authenticatedAt).toBe(validDate);
      expect(updated.sessionId).toBe("new-session");
    });

    it("does not mutate original instance", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "original-session",
      });

      const authContext = await Effect.runPromise(effect);
      const updated = authContext.withSessionId("new-session");

      expect(authContext.sessionId).toBe("original-session");
      expect(updated.sessionId).toBe("new-session");
    });

    it("allows setting sessionId to undefined", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: "existing-session",
      });

      const authContext = await Effect.runPromise(effect);
      const updated = authContext.withSessionId(undefined);

      expect(updated.sessionId).toBeUndefined();
    });

    it("allows setting sessionId from undefined to value", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.sessionId).toBeUndefined();

      const updated = authContext.withSessionId("new-session");
      expect(updated.sessionId).toBe("new-session");
    });
  });

  describe("[UNIT] AuthContext.toJSON", () => {
    it("serializes AuthContext to plain object", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.ADMIN,
        authenticatedAt: validDate,
        sessionId: validSessionId,
      });

      const authContext = await Effect.runPromise(effect);
      const json = authContext.toJSON();

      expect(json.userId).toBe(Id.toString(validUserId));
      expect(json.role).toBe(UserRole.ADMIN);
      expect(json.authenticatedAt).toBe(validDate.toISOString());
      expect(json.sessionId).toBe(validSessionId);
    });

    it("serializes AuthContext without sessionId", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      const json = authContext.toJSON();

      expect(json.userId).toBe(Id.toString(validUserId));
      expect(json.role).toBe(UserRole.USER);
      expect(json.authenticatedAt).toBe(validDate.toISOString());
      expect(json.sessionId).toBeUndefined();
    });

    it("converts userId to string", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.MODERATOR,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      const json = authContext.toJSON();

      expect(typeof json.userId).toBe("string");
      expect(json.userId).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("converts authenticatedAt to ISO string", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      const json = authContext.toJSON();

      expect(typeof json.authenticatedAt).toBe("string");
      expect(json.authenticatedAt).toBe("2024-01-01T00:00:00.000Z");
    });
  });

  describe("[UNIT] AuthContext.equals", () => {
    it("returns true for identical AuthContexts", async () => {
      const effect1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: validSessionId,
      });

      const effect2 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
        sessionId: validSessionId,
      });

      const authContext1 = await Effect.runPromise(effect1);
      const authContext2 = await Effect.runPromise(effect2);

      expect(authContext1.equals(authContext2)).toBe(true);
    });

    it("returns true for same instance", async () => {
      const effect = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext = await Effect.runPromise(effect);
      expect(authContext.equals(authContext)).toBe(true);
    });

    it("returns false for different userId", async () => {
      const effect1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const differentUserId = Id.create("660e8400-e29b-41d4-a716-446655440001");
      const effect2 = AuthContext.create({
        userId: differentUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext1 = await Effect.runPromise(effect1);
      const authContext2 = await Effect.runPromise(effect2);

      expect(authContext1.equals(authContext2)).toBe(false);
    });

    it("returns false for different role", async () => {
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

      const authContext1 = await Effect.runPromise(effect1);
      const authContext2 = await Effect.runPromise(effect2);

      expect(authContext1.equals(authContext2)).toBe(false);
    });

    it("returns false for different authenticatedAt", async () => {
      const effect1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      const effect2 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: new Date("2024-01-02T00:00:00.000Z"),
      });

      const authContext1 = await Effect.runPromise(effect1);
      const authContext2 = await Effect.runPromise(effect2);

      expect(authContext1.equals(authContext2)).toBe(false);
    });

    it("returns false for different sessionId", async () => {
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

      const authContext1 = await Effect.runPromise(effect1);
      const authContext2 = await Effect.runPromise(effect2);

      expect(authContext1.equals(authContext2)).toBe(false);
    });

    it("returns false when one has sessionId and other does not", async () => {
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
      });

      const authContext1 = await Effect.runPromise(effect1);
      const authContext2 = await Effect.runPromise(effect2);

      expect(authContext1.equals(authContext2)).toBe(false);
    });

    it("returns true when both have undefined sessionId", async () => {
      const effect1 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const effect2 = AuthContext.create({
        userId: validUserId,
        role: UserRole.USER,
        authenticatedAt: validDate,
      });

      const authContext1 = await Effect.runPromise(effect1);
      const authContext2 = await Effect.runPromise(effect2);

      expect(authContext1.equals(authContext2)).toBe(true);
    });
  });
});
