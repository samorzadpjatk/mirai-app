import { describe, it, expect } from "bun:test";
import { User, UserRole } from "./User";
import { ValidationError } from "../errors/domain-errors";

describe("[UNIT] User Entity", () => {
  describe("User.create", () => {
    it("should create user with valid data", () => {
      const result = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.authUserId).toBe("auth-123");
        expect(result.value.firstName).toBe("John");
        expect(result.value.lastName).toBe("Doe");
        expect(result.value.role).toBe(UserRole.USER);
        expect(result.value.hasAvatar).toBe(false);
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should create user with minimum required fields", () => {
      const result = User.create({
        authUserId: "auth-456",
        firstName: "",
        lastName: "",
        role: UserRole.USER,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.firstName).toBe("");
        expect(result.value.lastName).toBe("");
      }
    });

    it("should reject empty authUserId", () => {
      const result = User.create({
        authUserId: "",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("authUserId");
      }
    });

    it("should reject names with digits", () => {
      const result = User.create({
        authUserId: "auth-123",
        firstName: "John123",
        lastName: "Doe",
        role: UserRole.USER,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("firstName");
        expect(result.error.message).toContain("digits");
      }
    });

    it("should reject first name longer than 100 characters", () => {
      const result = User.create({
        authUserId: "auth-123",
        firstName: "a".repeat(101),
        lastName: "Doe",
        role: UserRole.USER,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("firstName");
      }
    });
  });

  describe("User.updateName", () => {
    it("should update first and last name", () => {
      const userResult = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      });

      expect(userResult.kind).toBe("ok");
      if (userResult.kind !== "ok") return;

      const user = userResult.value;
      const updated = user.updateName({ firstName: "Jane", lastName: "Smith" });

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.firstName).toBe("Jane");
        expect(updated.value.lastName).toBe("Smith");
        expect(updated.value.id).toBe(user.id); // Same ID
      }
    });

    it("should reject invalid name update", () => {
      const userResult = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      });

      expect(userResult.kind).toBe("ok");
      if (userResult.kind !== "ok") return;

      const user = userResult.value;
      const updated = user.updateName({
        firstName: "John123",
        lastName: "Doe",
      });

      expect(updated.kind).toBe("err");
      if (updated.kind === "err") {
        expect(updated.error).toBeInstanceOf(ValidationError);
        expect(updated.error.field).toBe("firstName");
      }
    });
  });

  describe("User.updateRole", () => {
    it("should update role", () => {
      const userResult = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      });

      expect(userResult.kind).toBe("ok");
      if (userResult.kind !== "ok") return;

      const user = userResult.value;
      const updated = user.updateRole(UserRole.ADMIN);

      expect(updated.role).toBe(UserRole.ADMIN);
      expect(updated.id).toBe(user.id);
    });
  });

  describe("User.setAvatar", () => {
    it("should mark user as having avatar", () => {
      const userResult = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      });

      expect(userResult.kind).toBe("ok");
      if (userResult.kind !== "ok") return;

      const user = userResult.value;
      const updated = user.setAvatar(true);

      expect(updated.hasAvatar).toBe(true);
    });
  });

  describe("User.getFullName", () => {
    it("should return full name with both names", () => {
      const userResult = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      });

      expect(userResult.kind).toBe("ok");
      if (userResult.kind === "ok") {
        expect(userResult.value.getFullName()).toBe("John Doe");
      }
    });

    it("should return only first name if last is empty", () => {
      const userResult = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "",
        role: UserRole.USER,
      });

      expect(userResult.kind).toBe("ok");
      if (userResult.kind === "ok") {
        expect(userResult.value.getFullName()).toBe("John");
      }
    });

    it("should return Unknown if both names are empty", () => {
      const userResult = User.create({
        authUserId: "auth-123",
        firstName: "",
        lastName: "",
        role: UserRole.USER,
      });

      expect(userResult.kind).toBe("ok");
      if (userResult.kind === "ok") {
        expect(userResult.value.getFullName()).toBe("Unknown");
      }
    });
  });

  describe("User.isBanned", () => {
    it("should return false for non-banned user", () => {
      const userResult = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      });

      expect(userResult.kind).toBe("ok");
      if (userResult.kind === "ok") {
        expect(userResult.value.isBanned()).toBe(false);
      }
    });
  });

  describe("User.hasRole", () => {
    it("should check if user has specific role", () => {
      const userResult = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.ADMIN,
      });

      expect(userResult.kind).toBe("ok");
      if (userResult.kind === "ok") {
        expect(userResult.value.hasRole(UserRole.ADMIN)).toBe(true);
        expect(userResult.value.hasRole(UserRole.USER)).toBe(false);
      }
    });

    it("should check for at least role level", () => {
      const adminResult = User.create({
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.ADMIN,
      });

      expect(adminResult.kind).toBe("ok");
      if (adminResult.kind === "ok") {
        // ADMIN is higher than USER
        expect(adminResult.value.hasAtLeastRole(UserRole.USER)).toBe(true);
        expect(adminResult.value.hasAtLeastRole(UserRole.ADMIN)).toBe(true);
        // ADMIN is NOT higher than SERVICE
        expect(adminResult.value.hasAtLeastRole(UserRole.SERVICE)).toBe(false);
      }
    });
  });
});
