import { describe, it, expect } from "bun:test";
import {
  ActivityFeedDrizzleMapper,
  ActivityReactionDrizzleMapper,
} from "./mapper";
import type {
  ActivityFeedSelect,
  ActivityReactionSelect,
} from "@mirai-app/frameworks/drizzle";

describe("[UNIT] ActivityFeedDrizzleMapper", () => {
  const mapper = ActivityFeedDrizzleMapper.instance;

  // Factory for creating mock Drizzle ActivityFeed records
  const createMockActivityFeedSelect = (
    overrides: Partial<ActivityFeedSelect> = {},
  ): ActivityFeedSelect => ({
    id: "activity-123",
    tripId: "trip-456",
    activityType: "POST",
    title: "Test Activity",
    description: "This is a test activity description",
    isPinned: false,
    isHidden: false,
    hiddenByAdmin: null,
    hiddenAt: null,
    hiddenReason: null,
    createdByAdmin: null,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to ActivityFeedDTO", () => {
      const record = createMockActivityFeedSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("activity-123");
      expect(dto.tripId).toBe("trip-456");
      expect(dto.userId).toBe("");
      expect(dto.activityType).toBe("POST");
      expect(dto.content).toBe("This is a test activity description");
      expect(dto.isPinned).toBe(false);
      expect(dto.isHidden).toBe(false);
      expect(dto.hiddenByAdmin).toBeNull();
      expect(dto.hiddenAt).toBeNull();
      expect(dto.hiddenReason).toBeNull();
      expect(dto.metadata).toBeUndefined();
      expect(dto.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("uses title as content when description is null", () => {
      const record = createMockActivityFeedSelect({
        description: null,
        title: "Title Only",
      });

      const dto = mapper.toDTO(record);

      expect(dto.content).toBe("Title Only");
    });

    it("handles hidden activity status", () => {
      const record = createMockActivityFeedSelect({
        isHidden: true,
        hiddenByAdmin: "admin-123",
        hiddenAt: new Date("2024-01-16T12:00:00Z"),
        hiddenReason: "Inappropriate content",
      });

      const dto = mapper.toDTO(record);

      expect(dto.isHidden).toBe(true);
      expect(dto.hiddenByAdmin).toBe("admin-123");
      expect(dto.hiddenAt).toEqual(new Date("2024-01-16T12:00:00Z"));
      expect(dto.hiddenReason).toBe("Inappropriate content");
    });

    it("handles pinned activity", () => {
      const record = createMockActivityFeedSelect({
        isPinned: true,
      });

      const dto = mapper.toDTO(record);

      expect(dto.isPinned).toBe(true);
    });

    it("delegates to toDTO for toDomain method", () => {
      const record = createMockActivityFeedSelect();

      const domainResult = mapper.toDomain(record);
      const dtoResult = mapper.toDTO(record);

      expect(domainResult).toEqual(dtoResult);
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts ActivityFeedDTO to Drizzle insert input", () => {
      const dto = mapper.toDTO(createMockActivityFeedSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("activity-123");
      expect(insert.tripId).toBe("trip-456");
      expect(insert.activityType).toBe("POST");
      expect(insert.title).toBe(dto.content);
      expect(insert.description).toBe(dto.content);
      expect(insert.isPinned).toBe(false);
      expect(insert.isHidden).toBe(false);
      expect(insert.hiddenByAdmin).toBeNull();
      expect(insert.hiddenAt).toBeNull();
      expect(insert.hiddenReason).toBeNull();
      expect(insert.createdByAdmin).toBeNull();
      expect(insert.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts ActivityFeedDTO to Drizzle update input", () => {
      const dto = mapper.toDTO(createMockActivityFeedSelect());

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id or createdAt
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("createdAt");

      // Should include updatable fields
      expect(update.title).toBe(dto.content);
      expect(update.description).toBe(dto.content);
      expect(update.isPinned).toBe(false);
      expect(update.isHidden).toBe(false);
      expect(update.hiddenByAdmin).toBeNull();
      expect(update.hiddenAt).toBeNull();
      expect(update.hiddenReason).toBeNull();
    });

    it("updates updatedAt to current time", () => {
      const dto = mapper.toDTO(createMockActivityFeedSelect());
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
      const instance1 = ActivityFeedDrizzleMapper.instance;
      const instance2 = ActivityFeedDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});

describe("[UNIT] ActivityReactionDrizzleMapper", () => {
  const mapper = ActivityReactionDrizzleMapper.instance;

  // Factory for creating mock Drizzle ActivityReaction records
  const createMockActivityReactionSelect = (
    overrides: Partial<ActivityReactionSelect> = {},
  ): ActivityReactionSelect => ({
    id: "reaction-123",
    activityId: "activity-456",
    userId: "user-789",
    reactionType: "LIKE",
    createdAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to ActivityReactionDTO", () => {
      const record = createMockActivityReactionSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("reaction-123");
      expect(dto.activityId).toBe("activity-456");
      expect(dto.userId).toBe("user-789");
      expect(dto.reactionType).toBe("LIKE");
      expect(dto.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("handles different reaction types", () => {
      const likeReaction = createMockActivityReactionSelect({
        reactionType: "LIKE",
      });
      const loveReaction = createMockActivityReactionSelect({
        reactionType: "LOVE",
      });

      expect(mapper.toDTO(likeReaction).reactionType).toBe("LIKE");
      expect(mapper.toDTO(loveReaction).reactionType).toBe("LOVE");
    });

    it("delegates to toDTO for toDomain method", () => {
      const record = createMockActivityReactionSelect();

      const domainResult = mapper.toDomain(record);
      const dtoResult = mapper.toDTO(record);

      expect(domainResult).toEqual(dtoResult);
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts ActivityReactionDTO to Drizzle insert input", () => {
      const dto = mapper.toDTO(createMockActivityReactionSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("reaction-123");
      expect(insert.activityId).toBe("activity-456");
      expect(insert.userId).toBe("user-789");
      expect(insert.reactionType).toBe("LIKE");
      expect(insert.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts ActivityReactionDTO to Drizzle update input", () => {
      const dto = mapper.toDTO(createMockActivityReactionSelect());

      const update = mapper.toDrizzleUpdate(dto);

      // Only reactionType is updatable
      expect(update).toEqual({
        reactionType: "LIKE",
      });
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = ActivityReactionDrizzleMapper.instance;
      const instance2 = ActivityReactionDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});
