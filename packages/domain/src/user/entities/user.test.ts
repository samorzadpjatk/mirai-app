import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { User } from "./user";
import { ValidationError } from "../../system/errors";
import { UserRole } from "../../user/enums";

describe("[UNIT] User", () => {
  const validProps = {
    id: "user-123",
    authUserId: "auth-user-456",
    firstName: "John",
    lastName: "Doe",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  // ============================================================================
  // User.create() Factory Tests
  // ============================================================================
  describe("[UNIT] User.create", () => {
    it("creates user with valid data", async () => {
      const result = await Effect.runPromise(User.create(validProps));
      expect(result.id).toBe("user-123");
      expect(result.authUserId).toBe("auth-user-456");
      expect(result.firstName).toBe("John");
      expect(result.lastName).toBe("Doe");
    });

    it("fails for empty authUserId", async () => {
      const result = await Effect.runPromise(
        Effect.either(User.create({ ...validProps, authUserId: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("authUserId");
        expect(result.left.message).toBe("authUserId is required");
      }
    });

    it("fails for whitespace-only authUserId", async () => {
      const result = await Effect.runPromise(
        Effect.either(User.create({ ...validProps, authUserId: "   " })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("authUserId");
      }
    });

    it("fails for empty firstName", async () => {
      const result = await Effect.runPromise(
        Effect.either(User.create({ ...validProps, firstName: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("firstName");
        expect(result.left.message).toBe("firstName is required");
      }
    });

    it("fails for whitespace-only firstName", async () => {
      const result = await Effect.runPromise(
        Effect.either(User.create({ ...validProps, firstName: "   " })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("firstName");
      }
    });

    it("fails for empty lastName", async () => {
      const result = await Effect.runPromise(
        Effect.either(User.create({ ...validProps, lastName: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("lastName");
        expect(result.left.message).toBe("lastName is required");
      }
    });

    it("fails for whitespace-only lastName", async () => {
      const result = await Effect.runPromise(
        Effect.either(User.create({ ...validProps, lastName: "   " })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("lastName");
      }
    });

    it("fails for authUserId > 255 chars", async () => {
      const longAuthUserId = "a".repeat(256);
      const result = await Effect.runPromise(
        Effect.either(
          User.create({ ...validProps, authUserId: longAuthUserId }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("authUserId");
        expect(result.left.message).toBe(
          "authUserId must be at most 255 characters",
        );
      }
    });

    it("fails for firstName > 255 chars", async () => {
      const longFirstName = "a".repeat(256);
      const result = await Effect.runPromise(
        Effect.either(User.create({ ...validProps, firstName: longFirstName })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("firstName");
        expect(result.left.message).toBe(
          "firstName must be at most 255 characters",
        );
      }
    });

    it("fails for lastName > 255 chars", async () => {
      const longLastName = "a".repeat(256);
      const result = await Effect.runPromise(
        Effect.either(User.create({ ...validProps, lastName: longLastName })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("lastName");
        expect(result.left.message).toBe(
          "lastName must be at most 255 characters",
        );
      }
    });

    it("fails for invalid role", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          User.create({ ...validProps, role: "INVALID_ROLE" as UserRole }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("role");
        expect(result.left.message).toContain("Invalid role");
      }
    });

    it("trims authUserId on creation", async () => {
      const result = await Effect.runPromise(
        User.create({ ...validProps, authUserId: "  auth-user-456  " }),
      );
      expect(result.authUserId).toBe("auth-user-456");
    });

    it("trims firstName on creation", async () => {
      const result = await Effect.runPromise(
        User.create({ ...validProps, firstName: "  John  " }),
      );
      expect(result.firstName).toBe("John");
    });

    it("trims lastName on creation", async () => {
      const result = await Effect.runPromise(
        User.create({ ...validProps, lastName: "  Doe  " }),
      );
      expect(result.lastName).toBe("Doe");
    });

    it("defaults role to USER when not specified", async () => {
      const result = await Effect.runPromise(User.create(validProps));
      expect(result.role).toBe(UserRole.USER);
    });

    it("defaults hasAvatar to false when not specified", async () => {
      const result = await Effect.runPromise(User.create(validProps));
      expect(result.hasAvatar).toBe(false);
    });

    it("defaults lastSeenOn to null when not specified", async () => {
      const result = await Effect.runPromise(User.create(validProps));
      expect(result.lastSeenOn).toBeNull();
    });

    it("accepts all valid roles", async () => {
      for (const role of Object.values(UserRole)) {
        const result = await Effect.runPromise(
          User.create({ ...validProps, role }),
        );
        expect(result.role).toBe(role);
      }
    });
  });

  // ============================================================================
  // updateProfile() Tests
  // ============================================================================
  describe("[UNIT] User.updateProfile", () => {
    it("updates firstName", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = await Effect.runPromise(
        user.updateProfile({ firstName: "Jane" }),
      );
      expect(updated.firstName).toBe("Jane");
      expect(updated.lastName).toBe("Doe");
    });

    it("updates lastName", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = await Effect.runPromise(
        user.updateProfile({ lastName: "Smith" }),
      );
      expect(updated.firstName).toBe("John");
      expect(updated.lastName).toBe("Smith");
    });

    it("updates hasAvatar", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = await Effect.runPromise(
        user.updateProfile({ hasAvatar: true }),
      );
      expect(updated.hasAvatar).toBe(true);
    });

    it("updates multiple fields at once", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = await Effect.runPromise(
        user.updateProfile({
          firstName: "Jane",
          lastName: "Smith",
          hasAvatar: true,
        }),
      );
      expect(updated.firstName).toBe("Jane");
      expect(updated.lastName).toBe("Smith");
      expect(updated.hasAvatar).toBe(true);
    });

    it("trims firstName on update", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = await Effect.runPromise(
        user.updateProfile({ firstName: "  Jane  " }),
      );
      expect(updated.firstName).toBe("Jane");
    });

    it("trims lastName on update", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = await Effect.runPromise(
        user.updateProfile({ lastName: "  Smith  " }),
      );
      expect(updated.lastName).toBe("Smith");
    });

    it("fails for empty firstName on update", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(user.updateProfile({ firstName: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("firstName");
        expect(result.left.message).toBe("firstName cannot be empty");
      }
    });

    it("fails for whitespace-only firstName on update", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(user.updateProfile({ firstName: "   " })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("firstName");
      }
    });

    it("fails for empty lastName on update", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(user.updateProfile({ lastName: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("lastName");
        expect(result.left.message).toBe("lastName cannot be empty");
      }
    });

    it("fails for whitespace-only lastName on update", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(user.updateProfile({ lastName: "   " })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("lastName");
      }
    });

    it("fails for firstName > 255 chars on update", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(user.updateProfile({ firstName: "a".repeat(256) })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("firstName");
      }
    });

    it("fails for lastName > 255 chars on update", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(user.updateProfile({ lastName: "a".repeat(256) })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("lastName");
      }
    });

    it("updates updatedAt timestamp", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const beforeUpdate = new Date();
      const updated = await Effect.runPromise(
        user.updateProfile({ firstName: "Jane" }),
      );
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        user.updatedAt.getTime(),
      );
    });

    it("preserves unchanged fields", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = await Effect.runPromise(
        user.updateProfile({ firstName: "Jane" }),
      );
      expect(updated.id).toBe(user.id);
      expect(updated.authUserId).toBe(user.authUserId);
      expect(updated.role).toBe(user.role);
      expect(updated.lastSeenOn).toBe(user.lastSeenOn);
      expect(updated.createdAt).toBe(user.createdAt);
    });

    it("returns immutable instance (original unchanged)", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      await Effect.runPromise(user.updateProfile({ firstName: "Jane" }));
      expect(user.firstName).toBe("John");
    });
  });

  // ============================================================================
  // updateRole() Tests
  // ============================================================================
  describe("[UNIT] User.updateRole", () => {
    it("updates role to ADMIN", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = await Effect.runPromise(user.updateRole(UserRole.ADMIN));
      expect(updated.role).toBe(UserRole.ADMIN);
    });

    it("updates role to MODERATOR", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = await Effect.runPromise(
        user.updateRole(UserRole.MODERATOR),
      );
      expect(updated.role).toBe(UserRole.MODERATOR);
    });

    it("updates role to USER", async () => {
      const adminUser = await Effect.runPromise(
        User.create({ ...validProps, role: UserRole.ADMIN }),
      );
      const updated = await Effect.runPromise(
        adminUser.updateRole(UserRole.USER),
      );
      expect(updated.role).toBe(UserRole.USER);
    });

    it("updates role to SERVICE", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = await Effect.runPromise(
        user.updateRole(UserRole.SERVICE),
      );
      expect(updated.role).toBe(UserRole.SERVICE);
    });

    it("fails for invalid role", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(user.updateRole("INVALID_ROLE" as UserRole)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("role");
        expect(result.left.message).toContain("Invalid role");
      }
    });

    it("updates updatedAt timestamp", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = await Effect.runPromise(user.updateRole(UserRole.ADMIN));
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        user.updatedAt.getTime(),
      );
    });

    it("preserves other fields", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = await Effect.runPromise(user.updateRole(UserRole.ADMIN));
      expect(updated.id).toBe(user.id);
      expect(updated.firstName).toBe(user.firstName);
      expect(updated.lastName).toBe(user.lastName);
      expect(updated.hasAvatar).toBe(user.hasAvatar);
    });

    it("returns immutable instance (original unchanged)", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      await Effect.runPromise(user.updateRole(UserRole.ADMIN));
      expect(user.role).toBe(UserRole.USER);
    });
  });

  // ============================================================================
  // markAsSeen() Tests
  // ============================================================================
  describe("[UNIT] User.markAsSeen", () => {
    it("updates lastSeenOn to current time", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const beforeMark = Date.now();
      const updated = user.markAsSeen();
      const afterMark = Date.now();
      expect(updated.lastSeenOn).not.toBeNull();
      expect(updated.lastSeenOn!.getTime()).toBeGreaterThanOrEqual(beforeMark);
      expect(updated.lastSeenOn!.getTime()).toBeLessThanOrEqual(afterMark);
    });

    it("updates updatedAt timestamp", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const beforeMark = Date.now();
      const updated = user.markAsSeen();
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeMark);
    });

    it("preserves other fields", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = user.markAsSeen();
      expect(updated.id).toBe(user.id);
      expect(updated.firstName).toBe(user.firstName);
      expect(updated.lastName).toBe(user.lastName);
      expect(updated.role).toBe(user.role);
      expect(updated.hasAvatar).toBe(user.hasAvatar);
      expect(updated.createdAt).toBe(user.createdAt);
    });

    it("returns immutable instance (original unchanged)", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      user.markAsSeen();
      expect(user.lastSeenOn).toBeNull();
    });

    it("can mark again after first seen", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const firstSeen = user.markAsSeen();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const secondSeen = firstSeen.markAsSeen();
      expect(secondSeen.lastSeenOn!.getTime()).toBeGreaterThan(
        firstSeen.lastSeenOn!.getTime(),
      );
    });
  });

  // ============================================================================
  // setHasAvatar() Tests
  // ============================================================================
  describe("[UNIT] User.setHasAvatar", () => {
    it("sets hasAvatar to true", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = user.setHasAvatar(true);
      expect(updated.hasAvatar).toBe(true);
    });

    it("sets hasAvatar to false", async () => {
      const userWithAvatar = await Effect.runPromise(
        User.create({ ...validProps, hasAvatar: true }),
      );
      const updated = userWithAvatar.setHasAvatar(false);
      expect(updated.hasAvatar).toBe(false);
    });

    it("updates updatedAt timestamp", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const beforeSet = Date.now();
      const updated = user.setHasAvatar(true);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeSet);
    });

    it("preserves other fields", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      const updated = user.setHasAvatar(true);
      expect(updated.id).toBe(user.id);
      expect(updated.firstName).toBe(user.firstName);
      expect(updated.lastName).toBe(user.lastName);
      expect(updated.role).toBe(user.role);
      expect(updated.lastSeenOn).toBe(user.lastSeenOn);
      expect(updated.createdAt).toBe(user.createdAt);
    });

    it("returns immutable instance (original unchanged)", async () => {
      const user = await Effect.runPromise(User.create(validProps));
      user.setHasAvatar(true);
      expect(user.hasAvatar).toBe(false);
    });
  });

  // ============================================================================
  // Query Method Tests
  // ============================================================================
  describe("[UNIT] User Query Methods", () => {
    describe("getFullName", () => {
      it("returns first and last name combined", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.getFullName()).toBe("John Doe");
      });

      it("works with single character names", async () => {
        const user = await Effect.runPromise(
          User.create({ ...validProps, firstName: "A", lastName: "B" }),
        );
        expect(user.getFullName()).toBe("A B");
      });
    });

    describe("getInitials", () => {
      it("returns uppercase initials", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.getInitials()).toBe("JD");
      });

      it("handles lowercase input", async () => {
        const user = await Effect.runPromise(
          User.create({ ...validProps, firstName: "john", lastName: "doe" }),
        );
        expect(user.getInitials()).toBe("JD");
      });

      it("handles mixed case input", async () => {
        const user = await Effect.runPromise(
          User.create({ ...validProps, firstName: "John", lastName: "DOE" }),
        );
        expect(user.getInitials()).toBe("JD");
      });

      it("works with single character names", async () => {
        const user = await Effect.runPromise(
          User.create({ ...validProps, firstName: "A", lastName: "B" }),
        );
        expect(user.getInitials()).toBe("AB");
      });
    });

    describe("hasProfileAvatar", () => {
      it("returns true when hasAvatar is true", async () => {
        const user = await Effect.runPromise(
          User.create({ ...validProps, hasAvatar: true }),
        );
        expect(user.hasProfileAvatar()).toBe(true);
      });

      it("returns false when hasAvatar is false", async () => {
        const user = await Effect.runPromise(
          User.create({ ...validProps, hasAvatar: false }),
        );
        expect(user.hasProfileAvatar()).toBe(false);
      });

      it("returns false by default", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.hasProfileAvatar()).toBe(false);
      });
    });

    describe("matchesAuthUserId", () => {
      it("returns true for matching authUserId", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.matchesAuthUserId("auth-user-456")).toBe(true);
      });

      it("returns false for non-matching authUserId", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.matchesAuthUserId("different-id")).toBe(false);
      });

      it("returns false for empty string", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.matchesAuthUserId("")).toBe(false);
      });
    });
  });

  // ============================================================================
  // Role Check Method Tests
  // ============================================================================
  describe("[UNIT] User Role Check Methods", () => {
    describe("hasRole", () => {
      it("returns true for matching role", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.hasRole(UserRole.USER)).toBe(true);
      });

      it("returns false for non-matching role", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.hasRole(UserRole.ADMIN)).toBe(false);
      });

      it("works for all role types", async () => {
        const adminUser = await Effect.runPromise(
          User.create({ ...validProps, role: UserRole.ADMIN }),
        );
        expect(adminUser.hasRole(UserRole.ADMIN)).toBe(true);
        expect(adminUser.hasRole(UserRole.USER)).toBe(false);
      });
    });

    describe("isAdmin", () => {
      it("returns true for ADMIN role", async () => {
        const admin = await Effect.runPromise(
          User.create({ ...validProps, role: UserRole.ADMIN }),
        );
        expect(admin.isAdmin()).toBe(true);
      });

      it("returns false for USER role", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.isAdmin()).toBe(false);
      });

      it("returns false for MODERATOR role", async () => {
        const mod = await Effect.runPromise(
          User.create({ ...validProps, role: UserRole.MODERATOR }),
        );
        expect(mod.isAdmin()).toBe(false);
      });

      it("returns false for SERVICE role", async () => {
        const service = await Effect.runPromise(
          User.create({ ...validProps, role: UserRole.SERVICE }),
        );
        expect(service.isAdmin()).toBe(false);
      });
    });

    describe("isModerator", () => {
      it("returns true for MODERATOR role", async () => {
        const mod = await Effect.runPromise(
          User.create({ ...validProps, role: UserRole.MODERATOR }),
        );
        expect(mod.isModerator()).toBe(true);
      });

      it("returns true for ADMIN role", async () => {
        const admin = await Effect.runPromise(
          User.create({ ...validProps, role: UserRole.ADMIN }),
        );
        expect(admin.isModerator()).toBe(true);
      });

      it("returns false for USER role", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.isModerator()).toBe(false);
      });

      it("returns false for SERVICE role", async () => {
        const service = await Effect.runPromise(
          User.create({ ...validProps, role: UserRole.SERVICE }),
        );
        expect(service.isModerator()).toBe(false);
      });
    });

    describe("isService", () => {
      it("returns true for SERVICE role", async () => {
        const service = await Effect.runPromise(
          User.create({ ...validProps, role: UserRole.SERVICE }),
        );
        expect(service.isService()).toBe(true);
      });

      it("returns false for USER role", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.isService()).toBe(false);
      });

      it("returns false for ADMIN role", async () => {
        const admin = await Effect.runPromise(
          User.create({ ...validProps, role: UserRole.ADMIN }),
        );
        expect(admin.isService()).toBe(false);
      });

      it("returns false for MODERATOR role", async () => {
        const mod = await Effect.runPromise(
          User.create({ ...validProps, role: UserRole.MODERATOR }),
        );
        expect(mod.isService()).toBe(false);
      });
    });

    describe("isRegularUser", () => {
      it("returns true for USER role", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.isRegularUser()).toBe(true);
      });

      it("returns false for ADMIN role", async () => {
        const admin = await Effect.runPromise(
          User.create({ ...validProps, role: UserRole.ADMIN }),
        );
        expect(admin.isRegularUser()).toBe(false);
      });

      it("returns false for MODERATOR role", async () => {
        const mod = await Effect.runPromise(
          User.create({ ...validProps, role: UserRole.MODERATOR }),
        );
        expect(mod.isRegularUser()).toBe(false);
      });

      it("returns false for SERVICE role", async () => {
        const service = await Effect.runPromise(
          User.create({ ...validProps, role: UserRole.SERVICE }),
        );
        expect(service.isRegularUser()).toBe(false);
      });
    });
  });

  // ============================================================================
  // Time-Based Method Tests
  // ============================================================================
  describe("[UNIT] User Time-Based Methods", () => {
    describe("wasSeenRecently", () => {
      it("returns false when lastSeenOn is null", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.wasSeenRecently(60000)).toBe(false);
      });

      it("returns true when seen within threshold", async () => {
        const user = await Effect.runPromise(
          User.create({ ...validProps, lastSeenOn: new Date() }),
        );
        expect(user.wasSeenRecently(60000)).toBe(true);
      });

      it("returns false when seen outside threshold", async () => {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const user = await Effect.runPromise(
          User.create({ ...validProps, lastSeenOn: tenMinutesAgo }),
        );
        expect(user.wasSeenRecently(5 * 60 * 1000)).toBe(false);
      });

      it("handles edge case at exact threshold", async () => {
        const justAtThreshold = new Date(Date.now() - 30000);
        const user = await Effect.runPromise(
          User.create({ ...validProps, lastSeenOn: justAtThreshold }),
        );
        expect(user.wasSeenRecently(30000)).toBe(false);
      });
    });

    describe("isOnline", () => {
      it("returns false when lastSeenOn is null", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.isOnline()).toBe(false);
      });

      it("returns true when seen within 5 minutes", async () => {
        const fourMinutesAgo = new Date(Date.now() - 4 * 60 * 1000);
        const user = await Effect.runPromise(
          User.create({ ...validProps, lastSeenOn: fourMinutesAgo }),
        );
        expect(user.isOnline()).toBe(true);
      });

      it("returns false when seen more than 5 minutes ago", async () => {
        const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
        const user = await Effect.runPromise(
          User.create({ ...validProps, lastSeenOn: sixMinutesAgo }),
        );
        expect(user.isOnline()).toBe(false);
      });
    });

    describe("wasCreatedBefore", () => {
      it("returns true when created before given date", async () => {
        const user = await Effect.runPromise(
          User.create({ ...validProps, createdAt: new Date("2024-01-01") }),
        );
        expect(user.wasCreatedBefore(new Date("2024-06-01"))).toBe(true);
      });

      it("returns false when created after given date", async () => {
        const user = await Effect.runPromise(
          User.create({ ...validProps, createdAt: new Date("2024-06-01") }),
        );
        expect(user.wasCreatedBefore(new Date("2024-01-01"))).toBe(false);
      });

      it("returns false when created at same time", async () => {
        const date = new Date("2024-01-01");
        const user = await Effect.runPromise(
          User.create({ ...validProps, createdAt: date }),
        );
        expect(user.wasCreatedBefore(date)).toBe(false);
      });
    });

    describe("wasCreatedAfter", () => {
      it("returns true when created after given date", async () => {
        const user = await Effect.runPromise(
          User.create({ ...validProps, createdAt: new Date("2024-06-01") }),
        );
        expect(user.wasCreatedAfter(new Date("2024-01-01"))).toBe(true);
      });

      it("returns false when created before given date", async () => {
        const user = await Effect.runPromise(
          User.create({ ...validProps, createdAt: new Date("2024-01-01") }),
        );
        expect(user.wasCreatedAfter(new Date("2024-06-01"))).toBe(false);
      });

      it("returns false when created at same time", async () => {
        const date = new Date("2024-01-01");
        const user = await Effect.runPromise(
          User.create({ ...validProps, createdAt: date }),
        );
        expect(user.wasCreatedAfter(date)).toBe(false);
      });
    });

    describe("getAccountAgeMs", () => {
      it("returns positive number for past creation", async () => {
        const user = await Effect.runPromise(
          User.create({
            ...validProps,
            createdAt: new Date(Date.now() - 1000),
          }),
        );
        expect(user.getAccountAgeMs()).toBeGreaterThan(0);
      });

      it("returns larger number for older accounts", async () => {
        const oldUser = await Effect.runPromise(
          User.create({
            ...validProps,
            createdAt: new Date(Date.now() - 10000),
          }),
        );
        const olderUser = await Effect.runPromise(
          User.create({
            ...validProps,
            createdAt: new Date(Date.now() - 20000),
          }),
        );
        expect(olderUser.getAccountAgeMs()).toBeGreaterThan(
          oldUser.getAccountAgeMs(),
        );
      });
    });

    describe("getTimeSinceLastSeenMs", () => {
      it("returns null when never seen", async () => {
        const user = await Effect.runPromise(User.create(validProps));
        expect(user.getTimeSinceLastSeenMs()).toBeNull();
      });

      it("returns positive number when seen", async () => {
        const user = await Effect.runPromise(
          User.create({
            ...validProps,
            lastSeenOn: new Date(Date.now() - 1000),
          }),
        );
        expect(user.getTimeSinceLastSeenMs()).toBeGreaterThan(0);
      });

      it("returns accurate time difference", async () => {
        const fiveSecondsAgo = new Date(Date.now() - 5000);
        const user = await Effect.runPromise(
          User.create({ ...validProps, lastSeenOn: fiveSecondsAgo }),
        );
        const diff = user.getTimeSinceLastSeenMs();
        expect(diff).toBeGreaterThanOrEqual(4900);
        expect(diff).toBeLessThanOrEqual(5100);
      });
    });
  });
});
