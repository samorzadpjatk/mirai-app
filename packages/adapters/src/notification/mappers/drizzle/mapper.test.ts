import { describe, it, expect } from "bun:test";
import { NotificationDrizzleMapper } from "./mapper";
import { NotificationPriority, NotificationStatus } from "@mirai-app/domain";
import type { NotificationSelect } from "@mirai-app/frameworks/drizzle";

describe("[UNIT] NotificationDrizzleMapper", () => {
  const mapper = NotificationDrizzleMapper.instance;

  // Factory for creating mock Drizzle Notification records
  const createMockNotificationSelect = (
    overrides: Partial<NotificationSelect> = {},
  ): NotificationSelect => ({
    id: "notif-123",
    tripId: "trip-456",
    title: "Test Notification",
    body: "This is a test notification content",
    url: "https://example.com/trip/456",
    status: "DRAFT",
    priority: "NORMAL",
    scheduledFor: new Date("2024-01-15T10:00:00Z"),
    sentAt: null,
    failureReason: null,
    createdById: "user-789",
    createdAt: new Date("2024-01-10T08:00:00Z"),
    updatedAt: new Date("2024-01-14T16:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to NotificationDTO", () => {
      const record = createMockNotificationSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("notif-123");
      expect(dto.tripId).toBe("trip-456");
      expect(dto.title).toBe("Test Notification");
      expect(dto.content).toBe("This is a test notification content");
      expect(dto.type).toBe("GENERAL");
      expect(dto.status).toBe(NotificationStatus.DRAFT);
      expect(dto.priority).toBe(NotificationPriority.NORMAL);
      expect(dto.scheduledAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.sentAt).toBeNull();
      expect(dto.createdById).toBe("user-789");
      expect(dto.createdAt).toEqual(new Date("2024-01-10T08:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-14T16:00:00Z"));
    });

    it("handles null values for optional fields", () => {
      const record = createMockNotificationSelect({
        tripId: null,
        url: null,
        scheduledFor: null,
        sentAt: null,
        failureReason: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.tripId).toBeNull();
      expect(dto.scheduledAt).toBeNull();
      expect(dto.sentAt).toBeNull();
    });

    it("maps body field to content property", () => {
      const record = createMockNotificationSelect({
        body: "Custom notification body text",
      });

      const dto = mapper.toDTO(record);

      expect(dto.content).toBe("Custom notification body text");
    });

    it("maps scheduledFor to scheduledAt property", () => {
      const scheduledDate = new Date("2024-12-25T12:00:00Z");
      const record = createMockNotificationSelect({
        scheduledFor: scheduledDate,
      });

      const dto = mapper.toDTO(record);

      expect(dto.scheduledAt).toEqual(scheduledDate);
    });

    it("maps priority enum values correctly", () => {
      expect(
        mapper.toDTO(createMockNotificationSelect({ priority: "LOW" }))
          .priority,
      ).toBe(NotificationPriority.LOW);
      expect(
        mapper.toDTO(createMockNotificationSelect({ priority: "NORMAL" }))
          .priority,
      ).toBe(NotificationPriority.NORMAL);
      expect(
        mapper.toDTO(createMockNotificationSelect({ priority: "HIGH" }))
          .priority,
      ).toBe(NotificationPriority.HIGH);
      expect(
        mapper.toDTO(createMockNotificationSelect({ priority: "URGENT" }))
          .priority,
      ).toBe(NotificationPriority.URGENT);
    });

    it("maps status enum values correctly", () => {
      expect(
        mapper.toDTO(createMockNotificationSelect({ status: "DRAFT" })).status,
      ).toBe(NotificationStatus.DRAFT);
      expect(
        mapper.toDTO(createMockNotificationSelect({ status: "READY" })).status,
      ).toBe(NotificationStatus.READY);
      expect(
        mapper.toDTO(createMockNotificationSelect({ status: "SENT" })).status,
      ).toBe(NotificationStatus.SENT);
      expect(
        mapper.toDTO(createMockNotificationSelect({ status: "FAILED" })).status,
      ).toBe(NotificationStatus.FAILED);
      expect(
        mapper.toDTO(createMockNotificationSelect({ status: "CANCELLED" }))
          .status,
      ).toBe(NotificationStatus.CANCELLED);
    });

    it("defaults unknown priority to NORMAL", () => {
      const dto = mapper.toDTO(
        createMockNotificationSelect({ priority: "UNKNOWN" as "LOW" }),
      );
      expect(dto.priority).toBe(NotificationPriority.NORMAL);
    });

    it("defaults unknown status to DRAFT", () => {
      const dto = mapper.toDTO(
        createMockNotificationSelect({ status: "UNKNOWN" as "DRAFT" }),
      );
      expect(dto.status).toBe(NotificationStatus.DRAFT);
    });

    it("handles sentAt date when present", () => {
      const sentDate = new Date("2024-01-20T14:30:00Z");
      const record = createMockNotificationSelect({
        sentAt: sentDate,
      });

      const dto = mapper.toDTO(record);

      expect(dto.sentAt).toEqual(sentDate);
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts NotificationDTO to Drizzle insert input", () => {
      const dto = mapper.toDTO(createMockNotificationSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("notif-123");
      expect(insert.tripId).toBe("trip-456");
      expect(insert.title).toBe("Test Notification");
      expect(insert.body).toBe("This is a test notification content");
      expect(insert.url).toBeNull();
      expect(insert.status).toBe(NotificationStatus.DRAFT);
      expect(insert.priority).toBe(NotificationPriority.NORMAL);
      expect(insert.scheduledFor).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.sentAt).toBeNull();
      expect(insert.failureReason).toBeNull();
      expect(insert.createdById).toBe("user-789");
      expect(insert.createdAt).toEqual(new Date("2024-01-10T08:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-14T16:00:00Z"));
    });

    it("maps content field to body property", () => {
      const dto = mapper.toDTO(
        createMockNotificationSelect({ body: "Custom content text" }),
      );

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.body).toBe("Custom content text");
    });

    it("maps scheduledAt to scheduledFor property", () => {
      const scheduledDate = new Date("2024-12-25T12:00:00Z");
      const dto = mapper.toDTO(
        createMockNotificationSelect({ scheduledFor: scheduledDate }),
      );

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.scheduledFor).toEqual(scheduledDate);
    });

    it("handles null tripId in insert", () => {
      const dto = mapper.toDTO(createMockNotificationSelect({ tripId: null }));

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.tripId).toBeNull();
    });

    it("sets url to null by default", () => {
      const dto = mapper.toDTO(createMockNotificationSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.url).toBeNull();
    });

    it("sets failureReason to null by default", () => {
      const dto = mapper.toDTO(createMockNotificationSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.failureReason).toBeNull();
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts NotificationDTO to Drizzle update input", () => {
      const dto = mapper.toDTO(createMockNotificationSelect());

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id, createdById, or createdAt
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("createdById");
      expect(update).not.toHaveProperty("createdAt");

      // Should include mutable fields
      expect(update.title).toBe("Test Notification");
      expect(update.body).toBe("This is a test notification content");
      expect(update.status).toBe(NotificationStatus.DRAFT);
      expect(update.priority).toBe(NotificationPriority.NORMAL);
      expect(update.scheduledFor).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(update.sentAt).toBeNull();
    });

    it("maps content to body in update", () => {
      const dto = mapper.toDTO(
        createMockNotificationSelect({ body: "Updated content" }),
      );

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.body).toBe("Updated content");
    });

    it("maps scheduledAt to scheduledFor in update", () => {
      const scheduledDate = new Date("2024-12-31T23:59:59Z");
      const dto = mapper.toDTO(
        createMockNotificationSelect({ scheduledFor: scheduledDate }),
      );

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.scheduledFor).toEqual(scheduledDate);
    });

    it("handles sentAt date in update", () => {
      const sentDate = new Date("2024-01-20T14:30:00Z");
      const dto = mapper.toDTO(
        createMockNotificationSelect({ sentAt: sentDate }),
      );

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.sentAt).toEqual(sentDate);
    });

    it("updates updatedAt to current time", () => {
      const dto = mapper.toDTO(createMockNotificationSelect());
      const beforeUpdate = new Date();

      const update = mapper.toDrizzleUpdate(dto);

      const afterUpdate = new Date();
      expect(update.updatedAt).toBeInstanceOf(Date);
      expect(update.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(update.updatedAt!.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("excludes immutable fields from update", () => {
      const dto = mapper.toDTO(createMockNotificationSelect());

      const update = mapper.toDrizzleUpdate(dto);

      // These should never be in update
      const updateKeys = Object.keys(update);
      expect(updateKeys).not.toContain("id");
      expect(updateKeys).not.toContain("createdById");
      expect(updateKeys).not.toContain("createdAt");
      expect(updateKeys).not.toContain("url");
      expect(updateKeys).not.toContain("failureReason");
    });
  });

  describe("toDomain", () => {
    it("converts Drizzle record to domain Notification entity", () => {
      const record = createMockNotificationSelect();

      const domain = mapper.toDomain(record);

      expect(domain.id).toBe("notif-123");
      expect(domain.tripId).toBe("trip-456");
      expect(domain.title).toBe("Test Notification");
      expect(domain.body).toBe("This is a test notification content");
      expect(domain.url).toBe("https://example.com/trip/456");
      expect(domain.status).toBe(NotificationStatus.DRAFT);
      expect(domain.priority).toBe(NotificationPriority.NORMAL);
      expect(domain.scheduledFor).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(domain.sentAt).toBeNull();
      expect(domain.failureReason).toBeNull();
      expect(domain.createdById).toBe("user-789");
      expect(domain.createdAt).toEqual(new Date("2024-01-10T08:00:00Z"));
      expect(domain.updatedAt).toEqual(new Date("2024-01-14T16:00:00Z"));
    });

    it("handles null values in domain mapping", () => {
      const record = createMockNotificationSelect({
        tripId: null,
        url: null,
        scheduledFor: null,
        sentAt: null,
        failureReason: null,
      });

      const domain = mapper.toDomain(record);

      expect(domain.tripId).toBeNull();
      expect(domain.url).toBeNull();
      expect(domain.scheduledFor).toBeNull();
      expect(domain.sentAt).toBeNull();
      expect(domain.failureReason).toBeNull();
    });

    it("throws error for invalid domain data", () => {
      // Create a record with invalid data that would fail domain validation
      // Title is required and must be at least 1 character
      const record = createMockNotificationSelect({
        title: "", // Empty title should fail validation
      });

      expect(() => mapper.toDomain(record)).toThrow(
        /Failed to map Notification from Drizzle/,
      );
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = NotificationDrizzleMapper.instance;
      const instance2 = NotificationDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});
