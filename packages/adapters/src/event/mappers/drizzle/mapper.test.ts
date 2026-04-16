import { describe, it, expect } from "bun:test";
import { EventDrizzleMapper } from "./mapper";
import { EventType, EventStatus } from "@mirai-app/use-cases";
import type { EventSelect } from "@mirai-app/frameworks/drizzle";

describe("[UNIT] EventDrizzleMapper", () => {
  const mapper = EventDrizzleMapper.instance;

  // Factory for creating mock Drizzle Event records
  const createMockEventSelect = (
    overrides: Partial<EventSelect> = {},
  ): EventSelect => ({
    id: "event-123",
    creatorId: "user-456",
    organizerGroupId: "group-789",
    title: "Test Event",
    description: "A test event description",
    location: "Test Location",
    startTime: new Date("2024-01-15T10:00:00Z"),
    endTime: new Date("2024-01-15T12:00:00Z"),
    createdAt: new Date("2024-01-10T08:00:00Z"),
    updatedAt: new Date("2024-01-10T08:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to EventDTO", () => {
      const record = createMockEventSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("event-123");
      expect(dto.tripId).toBe("user-456");
      expect(dto.groupId).toBe("group-789");
      expect(dto.title).toBe("Test Event");
      expect(dto.description).toBe("A test event description");
      expect(dto.location).toBe("Test Location");
      expect(dto.startTime).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.endTime).toEqual(new Date("2024-01-15T12:00:00Z"));
      expect(dto.type).toBe(EventType.OTHER);
      expect(dto.status).toBe(EventStatus.DRAFT);
      expect(dto.maxParticipants).toBeNull();
      expect(dto.createdById).toBe("user-456");
      expect(dto.createdAt).toEqual(new Date("2024-01-10T08:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-10T08:00:00Z"));
    });

    it("handles null description", () => {
      const record = createMockEventSelect({
        description: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.description).toBeNull();
    });

    it("handles null location", () => {
      const record = createMockEventSelect({
        location: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.location).toBeNull();
    });

    it("handles null endTime", () => {
      const record = createMockEventSelect({
        endTime: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.endTime).toBeNull();
    });

    it("handles null organizerGroupId", () => {
      const record = createMockEventSelect({
        organizerGroupId: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.groupId).toBeNull();
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts EventDTO to Drizzle insert input", () => {
      const dto = mapper.toDTO(createMockEventSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("event-123");
      expect(insert.creatorId).toBe("user-456");
      expect(insert.organizerGroupId).toBe("group-789");
      expect(insert.title).toBe("Test Event");
      expect(insert.startTime).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.endTime).toEqual(new Date("2024-01-15T12:00:00Z"));
      expect(insert.location).toBe("Test Location");
      expect(insert.description).toBe("A test event description");
      expect(insert.createdAt).toEqual(new Date("2024-01-10T08:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-10T08:00:00Z"));
    });

    it("defaults endTime to one hour after startTime when null", () => {
      const record = createMockEventSelect({
        endTime: null,
      });
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      // Should default to startTime + 1 hour (3600000 ms)
      expect(insert.endTime).toEqual(new Date("2024-01-15T11:00:00Z"));
    });

    it("converts null location to empty string", () => {
      const record = createMockEventSelect({
        location: null,
      });
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.location).toBe("");
    });

    it("converts null description to empty string", () => {
      const record = createMockEventSelect({
        description: null,
      });
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.description).toBe("");
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts EventDTO to Drizzle update input", () => {
      const dto = mapper.toDTO(createMockEventSelect());

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id or createdAt
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("createdAt");

      // Should include updatable fields
      expect(update.organizerGroupId).toBe("group-789");
      expect(update.title).toBe("Test Event");
      expect(update.startTime).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(update.endTime).toEqual(new Date("2024-01-15T12:00:00Z"));
      expect(update.location).toBe("Test Location");
      expect(update.description).toBe("A test event description");
    });

    it("defaults endTime to one hour after startTime when null", () => {
      const record = createMockEventSelect({
        endTime: null,
      });
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.endTime).toEqual(new Date("2024-01-15T11:00:00Z"));
    });

    it("converts null location to empty string in update", () => {
      const record = createMockEventSelect({
        location: null,
      });
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.location).toBe("");
    });

    it("converts null description to empty string in update", () => {
      const record = createMockEventSelect({
        description: null,
      });
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.description).toBe("");
    });

    it("updates updatedAt to current time", () => {
      const dto = mapper.toDTO(createMockEventSelect());
      const beforeUpdate = new Date();

      const update = mapper.toDrizzleUpdate(dto);

      const afterUpdate = new Date();
      expect(update.updatedAt).toBeInstanceOf(Date);
      expect(update.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(update.updatedAt.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = EventDrizzleMapper.instance;
      const instance2 = EventDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});
