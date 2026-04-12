import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { User, UserRole } from "./User";
import { ValidationError } from "../errors/effect-errors";

describe("[UNIT] User Entity", () => {
  describe("User.create", () => {
    it("should create user with valid data", () => {
      const effect = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      });

      const user = Effect.runSync(effect);
      expect(user.id).toBeDefined();
      expect(user.authUserId).toBe("auth-123");
      expect(user.firstName).toBe("John");
      expect(user.lastName).toBe("Doe");
      expect(user.role).toBe(UserRole.USER);
      expect(user.hasAvatar).toBe(false);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it("should create user with minimum required fields", () => {
      const effect = User.create({
        authUserId: "auth-456",
        firstName: "",
        lastName: "",
        role: UserRole.USER,
      });

      const user = Effect.runSync(effect);
      expect(user.firstName).toBe("");
      expect(user.lastName).toBe("");
    });

    it("should reject empty authUserId", () => {
      const effect = User.create({
        authUserId: "",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error._tag).toBe("ValidationError");
        expect(error.field).toBe("authUserId");
      }
    });

    it("should reject names with digits", () => {
      const effect = User.create({
        authUserId: "auth-123",
        firstName: "John123",
        lastName: "Doe",
        role: UserRole.USER,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("firstName");
        expect(error.message).toContain("digits");
      }
    });

    it("should reject first name longer than 100 characters", () => {
      const effect = User.create({
        authUserId: "auth-123",
        firstName: "a".repeat(101),
        lastName: "Doe",
        role: UserRole.USER,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("firstName");
      }
    });
  });

  describe("User.updateName", () => {
    it("should update first and last name", () => {
      const userEffect = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      });

      const user = Effect.runSync(userEffect);
      const updatedEffect = user.updateName({
        firstName: "Jane",
        lastName: "Smith",
      });
      const updated = Effect.runSync(updatedEffect);

      expect(updated.firstName).toBe("Jane");
      expect(updated.lastName).toBe("Smith");
      expect(updated.id).toBe(user.id); // Same ID
    });

    it("should reject invalid name update", () => {
      const userEffect = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      });

      const user = Effect.runSync(userEffect);
      const effect = user.updateName({
        firstName: "John123",
        lastName: "Doe",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("firstName");
      }
    });
  });

  describe("User.updateRole", () => {
    it("should update role", () => {
      const userEffect = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      });

      const user = Effect.runSync(userEffect);
      const updated = user.updateRole(UserRole.ADMIN);

      expect(updated.role).toBe(UserRole.ADMIN);
      expect(updated.id).toBe(user.id);
    });
  });

  describe("User.setAvatar", () => {
    it("should mark user as having avatar", () => {
      const userEffect = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      });

      const user = Effect.runSync(userEffect);
      const updated = user.setAvatar(true);

      expect(updated.hasAvatar).toBe(true);
    });
  });

  describe("User.getFullName", () => {
    it("should return full name with both names", () => {
      const user = Effect.runSync(
        User.create({
          authUserId: "auth-123",
          firstName: "John",
          lastName: "Doe",
          role: UserRole.USER,
        }),
      );

      expect(user.getFullName()).toBe("John Doe");
    });

    it("should return only first name if last is empty", () => {
      const user = Effect.runSync(
        User.create({
          authUserId: "auth-123",
          firstName: "John",
          lastName: "",
          role: UserRole.USER,
        }),
      );

      expect(user.getFullName()).toBe("John");
    });

    it("should return Unknown if both names are empty", () => {
      const user = Effect.runSync(
        User.create({
          authUserId: "auth-123",
          firstName: "",
          lastName: "",
          role: UserRole.USER,
        }),
      );

      expect(user.getFullName()).toBe("Unknown");
    });
  });

  describe("User.isBanned", () => {
    it("should return false for non-banned user", () => {
      const user = Effect.runSync(
        User.create({
          authUserId: "auth-123",
          firstName: "John",
          lastName: "Doe",
          role: UserRole.USER,
        }),
      );

      expect(user.isBanned()).toBe(false);
    });
  });

  describe("User.hasRole", () => {
    it("should check if user has specific role", () => {
      const user = Effect.runSync(
        User.create({
          authUserId: "auth-123",
          firstName: "John",
          lastName: "Doe",
          role: UserRole.ADMIN,
        }),
      );

      expect(user.hasRole(UserRole.ADMIN)).toBe(true);
      expect(user.hasRole(UserRole.USER)).toBe(false);
    });

    it("should check for at least role level", () => {
      const admin = Effect.runSync(
        User.create({
          authUserId: "auth-123",
          firstName: "John",
          lastName: "Doe",
          role: UserRole.ADMIN,
        }),
      );

      // ADMIN is higher than USER
      expect(admin.hasAtLeastRole(UserRole.USER)).toBe(true);
      expect(admin.hasAtLeastRole(UserRole.ADMIN)).toBe(true);
      // ADMIN is NOT higher than SERVICE
      expect(admin.hasAtLeastRole(UserRole.SERVICE)).toBe(false);
    });
  });
});
