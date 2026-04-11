import { describe, it, expect } from "bun:test";
import { GroupDrizzleMapper } from "../drizzle/group";
import { Group, GroupStatus } from "@mirai-app/domain";
import type { GroupSelect, GroupInsert } from "@mirai-app/frameworks/drizzle";

describe("[UNIT] GroupDrizzleMapper", () => {
  const mapper = GroupDrizzleMapper.instance;

  // Helper to create a valid Drizzle Group record
  const createMockGroupSelect = (
    overrides?: Partial<GroupSelect>,
  ): GroupSelect => ({
    id: overrides?.id ?? "group-123",
    tripId: overrides?.tripId ?? "trip-123",
    name: overrides?.name ?? "Test Group",
    description: overrides?.description ?? "A test group",
    image: overrides?.image ?? "https://example.com/image.png",
    organizerId: overrides?.organizerId ?? "user-123",
    code: overrides?.code ?? "TEST123",
    coins: overrides?.coins ?? 100,
    isDeleted: overrides?.isDeleted ?? false,
    createdAt: overrides?.createdAt ?? new Date("2026-01-01"),
    updatedAt: overrides?.updatedAt ?? new Date("2026-01-15"),
  });

  describe("toDomain", () => {
    it("should map Drizzle record to domain entity", () => {
      const record = createMockGroupSelect();

      const domain = mapper.toDomain(record);

      expect(domain.id).toBe("group-123");
      expect(domain.tripId).toBe("trip-123");
      expect(domain.name).toBe("Test Group");
      expect(domain.description).toBe("A test group");
      expect(domain.image).toBe("https://example.com/image.png");
      expect(domain.organizerId).toBe("user-123");
      expect(domain.code).toBe("TEST123");
      expect(domain.coins).toBe(100);
      expect(domain.status).toBe(GroupStatus.ACTIVE);
      expect(domain.createdAt).toBeInstanceOf(Date);
      expect(domain.updatedAt).toBeInstanceOf(Date);
    });

    it("should map deleted group to DELETED status", () => {
      const record = createMockGroupSelect({ isDeleted: true });

      const domain = mapper.toDomain(record);

      expect(domain.status).toBe(GroupStatus.DELETED);
    });

    it("should throw on invalid data", () => {
      const record = createMockGroupSelect({ name: "" });

      expect(() => mapper.toDomain(record)).toThrow();
    });
  });

  describe("toDrizzleInsert", () => {
    it("should map domain entity to Drizzle insert", () => {
      const domainResult = Group.create({
        id: "group-456",
        tripId: "trip-456",
        name: "New Group",
        description: "A new group",
        image: null,
        organizerId: "user-456",
        code: "NEW456",
        coins: 500,
        status: GroupStatus.ACTIVE,
        createdAt: new Date("2026-02-01"),
        updatedAt: new Date("2026-02-15"),
      });
      if (domainResult.kind === "err") {
        throw new Error("Failed to create test group");
      }
      const domain = domainResult.value;

      const insert = mapper.toDrizzleInsert(domain);

      expect(insert.id).toBe("group-456");
      expect(insert.tripId).toBe("trip-456");
      expect(insert.name).toBe("New Group");
      expect(insert.description).toBe("A new group");
      expect(insert.image).toBeNull();
      expect(insert.organizerId).toBe("user-456");
      expect(insert.code).toBe("NEW456");
      expect(insert.coins).toBe(500);
      expect(insert.isDeleted).toBe(false);
      expect(insert.createdAt).toBeInstanceOf(Date);
      expect(insert.updatedAt).toBeInstanceOf(Date);
    });

    it("should set isDeleted true for DELETED status", () => {
      const domainResult = Group.create({
        id: "group-deleted",
        tripId: "trip-123",
        name: "Deleted Group",
        description: null,
        image: null,
        organizerId: "user-123",
        code: "DELETED",
        coins: 0,
        status: GroupStatus.DELETED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      if (domainResult.kind === "err") {
        throw new Error("Failed to create test group");
      }
      const domain = domainResult.value;

      const insert = mapper.toDrizzleInsert(domain);

      expect(insert.isDeleted).toBe(true);
    });
  });

  describe("toDrizzleUpdate", () => {
    it("should map domain entity to Drizzle update", () => {
      const domainResult = Group.create({
        id: "group-789",
        tripId: "trip-789",
        name: "Updated Group",
        description: "Updated description",
        image: "https://example.com/updated.png",
        organizerId: "user-789",
        code: "UPD789",
        coins: 1000,
        status: GroupStatus.ACTIVE,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-03-01"),
      });
      if (domainResult.kind === "err") {
        throw new Error("Failed to create test group");
      }
      const domain = domainResult.value;

      const update = mapper.toDrizzleUpdate(domain);

      expect(update.id).toBeUndefined(); // id should not be in update
      expect(update.name).toBe("Updated Group");
      expect(update.description).toBe("Updated description");
      expect(update.image).toBe("https://example.com/updated.png");
      expect(update.coins).toBe(1000);
      expect(update.isDeleted).toBe(false);
      expect(update.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("round-trip conversion", () => {
    it("should preserve data through domain -> drizzle -> domain", () => {
      const originalResult = Group.create({
        id: "group-roundtrip",
        tripId: "trip-roundtrip",
        name: "Roundtrip Group",
        description: "Testing roundtrip",
        image: "https://example.com/roundtrip.png",
        organizerId: "user-roundtrip",
        code: "ROUND123",
        coins: 750,
        status: GroupStatus.ACTIVE,
        createdAt: new Date("2026-04-01"),
        updatedAt: new Date("2026-04-15"),
      });
      if (originalResult.kind === "err") {
        throw new Error("Failed to create test group");
      }
      const original = originalResult.value;

      // Domain -> Drizzle
      const drizzle = mapper.toDrizzleInsert(original);

      // Drizzle -> Domain (simulate DB record)
      const restored = mapper.toDomain(drizzle as GroupSelect);

      expect(restored.id).toBe(original.id);
      expect(restored.tripId).toBe(original.tripId);
      expect(restored.name).toBe(original.name);
      expect(restored.code).toBe(original.code);
      expect(restored.coins).toBe(original.coins);
    });
  });
});
