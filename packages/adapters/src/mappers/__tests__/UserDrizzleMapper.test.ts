import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { UserDrizzleMapper } from "../drizzle/user";
import { User, UserRole } from "@mirai-app/domain";
import type { UserSelect, UserInsert } from "@mirai-app/frameworks/drizzle";

describe("[UNIT] UserDrizzleMapper", () => {
  const mapper = UserDrizzleMapper.instance;

  // Helper to create a valid Drizzle User record
  const createMockUserSelect = (
    overrides?: Partial<UserSelect>,
  ): UserSelect => ({
    id: overrides?.id ?? "user-123",
    authUserId: overrides?.authUserId ?? "auth-123",
    firstName: overrides?.firstName ?? "John",
    lastName: overrides?.lastName ?? "Doe",
    role: overrides?.role ?? "USER",
    hasAvatar: overrides?.hasAvatar ?? false,
    lastSeenOn: overrides?.lastSeenOn ?? null,
    createdAt: overrides?.createdAt ?? new Date("2026-01-01"),
    updatedAt: overrides?.updatedAt ?? new Date("2026-01-15"),
  });

  describe("[UNIT] toDomain", () => {
    it("should map Drizzle record to domain entity", () => {
      const record = createMockUserSelect();

      const domain = mapper.toDomain(record);

      expect(domain.id).toBe("user-123");
      expect(domain.authUserId).toBe("auth-123");
      expect(domain.firstName).toBe("John");
      expect(domain.lastName).toBe("Doe");
      expect(domain.role).toBe(UserRole.USER);
      expect(domain.hasAvatar).toBe(false);
      expect(domain.lastSeenOn).toBeNull();
      expect(domain.createdAt).toBeInstanceOf(Date);
      expect(domain.updatedAt).toBeInstanceOf(Date);
    });

    it("should map ADMIN role correctly", () => {
      const record = createMockUserSelect({ role: "ADMIN" });

      const domain = mapper.toDomain(record);

      expect(domain.role).toBe(UserRole.ADMIN);
    });

    it("should map MODERATOR role correctly", () => {
      const record = createMockUserSelect({ role: "MODERATOR" });

      const domain = mapper.toDomain(record);

      expect(domain.role).toBe(UserRole.MODERATOR);
    });

    it("should map SERVICE role correctly", () => {
      const record = createMockUserSelect({ role: "SERVICE" });

      const domain = mapper.toDomain(record);

      expect(domain.role).toBe(UserRole.SERVICE);
    });

    it("should throw on invalid authUserId", () => {
      const record = createMockUserSelect({ authUserId: "" });

      expect(() => mapper.toDomain(record)).toThrow();
    });
  });

  describe("[UNIT] toDrizzleInsert", () => {
    it("should map domain entity to Drizzle insert", () => {
      const effect = User.create({
        id: "user-456",
        authUserId: "auth-456",
        firstName: "Jane",
        lastName: "Smith",
        role: UserRole.ADMIN,
        hasAvatar: true,
        lastSeenOn: null,
        createdAt: new Date("2026-02-01"),
        updatedAt: new Date("2026-02-15"),
      });
      const exit = Effect.runSyncExit(effect);
      if (exit._tag === "Failure") {
        throw new Error("Failed to create test user");
      }
      const domain = exit.value;

      const insert = mapper.toDrizzleInsert(domain);

      expect(insert.id).toBe("user-456");
      expect(insert.authUserId).toBe("auth-456");
      expect(insert.firstName).toBe("Jane");
      expect(insert.lastName).toBe("Smith");
      expect(insert.role).toBe("ADMIN");
      expect(insert.hasAvatar).toBe(true);
      expect(insert.lastSeenOn).toBeNull();
      expect(insert.createdAt).toBeInstanceOf(Date);
      expect(insert.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("[UNIT] toDrizzleUpdate", () => {
    it("should map domain entity to Drizzle update", () => {
      const effect = User.create({
        id: "user-789",
        authUserId: "auth-789",
        firstName: "Updated",
        lastName: "Name",
        role: UserRole.MODERATOR,
        hasAvatar: true,
        lastSeenOn: new Date("2026-03-01"),
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-03-15"),
      });
      const exit = Effect.runSyncExit(effect);
      if (exit._tag === "Failure") {
        throw new Error("Failed to create test user");
      }
      const domain = exit.value;

      const update = mapper.toDrizzleUpdate(domain);

      expect(update.id).toBeUndefined(); // id should not be in update
      expect(update.authUserId).toBeUndefined(); // authUserId should not be in update
      expect(update.firstName).toBe("Updated");
      expect(update.lastName).toBe("Name");
      expect(update.role).toBe("MODERATOR");
      expect(update.hasAvatar).toBe(true);
      expect(update.lastSeenOn).toBeInstanceOf(Date);
      expect(update.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("[UNIT] round-trip conversion", () => {
    it("should preserve data through domain -> drizzle -> domain", () => {
      const effect = User.create({
        id: "user-roundtrip",
        authUserId: "auth-roundtrip",
        firstName: "Roundtrip",
        lastName: "User",
        role: UserRole.ADMIN,
        hasAvatar: true,
        lastSeenOn: null,
        createdAt: new Date("2026-04-01"),
        updatedAt: new Date("2026-04-15"),
      });
      const exit = Effect.runSyncExit(effect);
      if (exit._tag === "Failure") {
        throw new Error("Failed to create test user");
      }
      const original = exit.value;

      // Domain -> Drizzle
      const drizzle = mapper.toDrizzleInsert(original);

      // Drizzle -> Domain (simulate DB record)
      const restored = mapper.toDomain(drizzle as UserSelect);

      expect(restored.id).toBe(original.id);
      expect(restored.authUserId).toBe(original.authUserId);
      expect(restored.firstName).toBe(original.firstName);
      expect(restored.lastName).toBe(original.lastName);
      expect(restored.role).toBe(original.role);
      expect(restored.hasAvatar).toBe(original.hasAvatar);
    });
  });
});
