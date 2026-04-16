import { describe, it, expect } from "bun:test";
import { GroupDrizzleMapper } from "./mapper";
import { GroupStatus } from "@mirai-app/domain";
import type { GroupSelect } from "@mirai-app/frameworks/drizzle";

describe("[UNIT] GroupDrizzleMapper", () => {
  const mapper = GroupDrizzleMapper.instance;

  // Factory for creating mock Drizzle Group records
  const createMockGroupSelect = (
    overrides: Partial<GroupSelect> = {},
  ): GroupSelect => ({
    id: "group-123",
    tripId: "trip-456",
    name: "Test Group",
    code: "TEST001",
    description: "A test group description",
    image: "https://example.com/group-image.jpg",
    isDeleted: false,
    organizerId: "user-789",
    coins: 100,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to GroupDTO", () => {
      const record = createMockGroupSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("group-123");
      expect(dto.tripId).toBe("trip-456");
      expect(dto.name).toBe("Test Group");
      expect(dto.code).toBe("TEST001");
      expect(dto.description).toBe("A test group description");
      expect(dto.imageUrl).toBe("https://example.com/group-image.jpg");
      expect(dto.status).toBe(GroupStatus.ACTIVE);
      expect(dto.coins).toBe(100);
      expect(dto.maxMembers).toBeNull();
      expect(dto.createdById).toBe("user-789");
      expect(dto.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.deletedAt).toBeNull();
      expect(dto.deletedById).toBeNull();
    });

    it("handles null description and imageUrl", () => {
      const record = createMockGroupSelect({
        description: null,
        image: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.description).toBeNull();
      expect(dto.imageUrl).toBeNull();
    });

    it("maps status to ACTIVE when isDeleted is false", () => {
      const record = createMockGroupSelect({ isDeleted: false });

      const dto = mapper.toDTO(record);

      expect(dto.status).toBe(GroupStatus.ACTIVE);
    });

    it("maps status to DELETED when isDeleted is true", () => {
      const record = createMockGroupSelect({ isDeleted: true });

      const dto = mapper.toDTO(record);

      expect(dto.status).toBe(GroupStatus.DELETED);
    });

    it("handles undefined description (coalesced to null)", () => {
      const record = createMockGroupSelect({
        description: undefined as unknown as null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.description).toBeNull();
    });

    it("handles undefined image (coalesced to null)", () => {
      const record = createMockGroupSelect({
        image: undefined as unknown as null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.imageUrl).toBeNull();
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts GroupDTO to Drizzle insert input", () => {
      const record = createMockGroupSelect();
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("group-123");
      expect(insert.tripId).toBe("trip-456");
      expect(insert.name).toBe("Test Group");
      expect(insert.description).toBe("A test group description");
      expect(insert.image).toBe("https://example.com/group-image.jpg");
      expect(insert.isDeleted).toBe(false);
      expect(insert.organizerId).toBe("user-789");
      expect(insert.code).toBe("TEST001");
      expect(insert.coins).toBe(100);
      expect(insert.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("maps DELETED status to isDeleted true", () => {
      const record = createMockGroupSelect({ isDeleted: true });
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.isDeleted).toBe(true);
    });

    it("maps ACTIVE status to isDeleted false", () => {
      const record = createMockGroupSelect({ isDeleted: false });
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.isDeleted).toBe(false);
    });

    it("handles null description and image", () => {
      const record = createMockGroupSelect({
        description: null,
        image: null,
      });
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.description).toBeNull();
      expect(insert.image).toBeNull();
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts GroupDTO to Drizzle update input excluding id and createdAt", () => {
      const record = createMockGroupSelect();
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id or createdAt
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("createdAt");

      // Should include all other fields
      expect(update.name).toBe("Test Group");
      expect(update.description).toBe("A test group description");
      expect(update.image).toBe("https://example.com/group-image.jpg");
      expect(update.isDeleted).toBe(false);
      expect(update.organizerId).toBe("user-789");
      expect(update.code).toBe("TEST001");
      expect(update.coins).toBe(100);
    });

    it("updates updatedAt to current time", () => {
      const record = createMockGroupSelect();
      const dto = mapper.toDTO(record);
      const beforeUpdate = new Date();

      const update = mapper.toDrizzleUpdate(dto);

      const afterUpdate = new Date();
      // updatedAt should be a new Date (approximately now)
      expect(update.updatedAt).toBeInstanceOf(Date);
      expect(update.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(update.updatedAt!.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("maps DELETED status to isDeleted true", () => {
      const record = createMockGroupSelect({ isDeleted: true });
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.isDeleted).toBe(true);
    });

    it("maps ACTIVE status to isDeleted false", () => {
      const record = createMockGroupSelect({ isDeleted: false });
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.isDeleted).toBe(false);
    });

    it("handles null description and image", () => {
      const record = createMockGroupSelect({
        description: null,
        image: null,
      });
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.description).toBeNull();
      expect(update.image).toBeNull();
    });

    it("excludes tripId from update input", () => {
      const record = createMockGroupSelect();
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      expect(update).not.toHaveProperty("tripId");
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = GroupDrizzleMapper.instance;
      const instance2 = GroupDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});
