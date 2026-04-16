import { describe, it, expect } from "bun:test";
import { NotificationScheduleDrizzleMapper } from "./schedule-mapper";
import { NotificationScheduleType } from "@mirai-app/domain";
import { NotificationSchedule } from "@mirai-app/domain";
import type { NotificationScheduleDTO } from "@mirai-app/use-cases";
import type { NotificationScheduleSelect } from "@mirai-app/frameworks/drizzle";
import { Effect } from "effect";

describe("[UNIT] NotificationScheduleDrizzleMapper", () => {
  const mapper = NotificationScheduleDrizzleMapper.instance;

  // Factory for creating mock Drizzle NotificationSchedule records
  const createMockScheduleSelect = (
    overrides: Partial<NotificationScheduleSelect> = {},
  ): NotificationScheduleSelect => ({
    id: "schedule-123",
    tripId: "trip-456",
    name: "Test Schedule",
    notificationType: "INFO",
    content: "This is a test notification",
    scheduledFor: new Date("2024-01-15T09:00:00Z"),
    sendToAll: false,
    targetGroupIds: null,
    isSent: false,
    isDraft: false,
    createdBy: "user-789",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-10T00:00:00Z"),
    ...overrides,
  });

  // Calculate future dates for entity creation (domain requires future dates)
  const getFutureDate = (daysFromNow: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(9, 0, 0, 0);
    return date;
  };

  // Factory for creating valid NotificationSchedule domain entities
  const createMockScheduleEntity = async (
    overrides: Partial<NotificationSchedule> = {},
  ): Promise<NotificationSchedule> => {
    const startDate = getFutureDate(7);
    const endDate = getFutureDate(37); // 30 days after start
    const effect = NotificationSchedule.create({
      id: "schedule-123",
      name: "Test Schedule",
      tripId: "trip-456",
      notificationType: NotificationScheduleType.INFO,
      notificationTitle: "Test Title",
      notificationBody: "This is a test notification",
      notificationUrl: null,
      startDate,
      endDate,
      hour: 9,
      minute: 0,
      isActive: true,
      createdById: "user-789",
      lastRun: null,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-10T00:00:00Z"),
      ...overrides,
    });
    return await Effect.runPromise(effect);
  };

  describe("toDTO", () => {
    it("converts Drizzle record to NotificationScheduleDTO", () => {
      const record = createMockScheduleSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("schedule-123");
      expect(dto.name).toBe("Test Schedule");
      expect(dto.tripId).toBe("trip-456");
      expect(dto.notificationType).toBe(NotificationScheduleType.INFO);
      expect(dto.notificationTitle).toBeNull();
      expect(dto.notificationBody).toBe("This is a test notification");
      expect(dto.notificationUrl).toBeNull();
      expect(dto.createdById).toBe("user-789");
      expect(dto.lastRun).toBeNull();
      expect(dto.createdAt).toEqual(new Date("2024-01-01T00:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-10T00:00:00Z"));
    });

    it("maps CHALLENGE type correctly", () => {
      const record = createMockScheduleSelect({
        notificationType: "CHALLENGE",
      });

      const dto = mapper.toDTO(record);

      expect(dto.notificationType).toBe(NotificationScheduleType.CHALLENGE);
    });

    it("maps REMINDER type correctly", () => {
      const record = createMockScheduleSelect({
        notificationType: "REMINDER",
      });

      const dto = mapper.toDTO(record);

      expect(dto.notificationType).toBe(NotificationScheduleType.REMINDER);
    });

    it("maps ANNOUNCEMENT type correctly", () => {
      const record = createMockScheduleSelect({
        notificationType: "ANNOUNCEMENT",
      });

      const dto = mapper.toDTO(record);

      expect(dto.notificationType).toBe(NotificationScheduleType.ANNOUNCEMENT);
    });

    it("maps DAILY_RANKING type correctly", () => {
      const record = createMockScheduleSelect({
        notificationType: "DAILY_RANKING",
      });

      const dto = mapper.toDTO(record);

      expect(dto.notificationType).toBe(NotificationScheduleType.DAILY_RANKING);
    });

    it("defaults unknown type to INFO", () => {
      const record = createMockScheduleSelect({
        notificationType: "UNKNOWN_TYPE" as string,
      });

      const dto = mapper.toDTO(record);

      expect(dto.notificationType).toBe(NotificationScheduleType.INFO);
    });

    it("derives hour and minute from scheduledFor UTC time", () => {
      const record = createMockScheduleSelect({
        scheduledFor: new Date("2024-01-15T14:30:00Z"),
      });

      const dto = mapper.toDTO(record);

      expect(dto.hour).toBe(14);
      expect(dto.minute).toBe(30);
    });

    it("calculates endDate as 1 year after startDate", () => {
      const scheduledFor = new Date("2024-06-15T09:00:00Z");
      const record = createMockScheduleSelect({
        scheduledFor,
      });

      const dto = mapper.toDTO(record);

      const expectedEndDate = new Date(
        scheduledFor.getTime() + 365 * 24 * 60 * 60 * 1000,
      );
      expect(dto.startDate).toEqual(scheduledFor);
      expect(dto.endDate).toEqual(expectedEndDate);
    });

    it("uses current date + 1 year as default when scheduledFor is null", () => {
      const record = createMockScheduleSelect({
        scheduledFor: undefined as unknown as Date,
      });

      const dto = mapper.toDTO(record);

      const expectedDefault = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      // Allow for some time difference due to test execution
      const timeDiff = Math.abs(
        dto.endDate.getTime() - expectedDefault.getTime(),
      );
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });

    it("uses defaults (9:00) when scheduledFor is null", () => {
      const record = createMockScheduleSelect({
        scheduledFor: undefined as unknown as Date,
      });

      const dto = mapper.toDTO(record);

      expect(dto.hour).toBe(9);
      expect(dto.minute).toBe(0);
    });

    it("derives isActive from isDraft (isActive = !isDraft)", () => {
      const activeRecord = createMockScheduleSelect({ isDraft: false });
      const draftRecord = createMockScheduleSelect({ isDraft: true });

      const activeDto = mapper.toDTO(activeRecord);
      const draftDto = mapper.toDTO(draftRecord);

      expect(activeDto.isActive).toBe(true);
      expect(draftDto.isActive).toBe(false);
    });

    it("always sets notificationTitle and notificationUrl to null", () => {
      const record = createMockScheduleSelect();

      const dto = mapper.toDTO(record);

      expect(dto.notificationTitle).toBeNull();
      expect(dto.notificationUrl).toBeNull();
    });
  });

  describe("toDomain", () => {
    it("converts Drizzle record to NotificationSchedule entity", () => {
      const record = createMockScheduleSelect();

      const entity = mapper.toDomain(record);

      expect(entity.id).toBe("schedule-123");
      expect(entity.name).toBe("Test Schedule");
      expect(entity.tripId).toBe("trip-456");
      expect(entity.notificationType).toBe(NotificationScheduleType.INFO);
      expect(entity.notificationBody).toBe("This is a test notification");
      expect(entity.createdById).toBe("user-789");
      expect(entity.lastRun).toBeNull();
    });

    it("uses defaults for missing fields in toDomain", () => {
      const record = createMockScheduleSelect();

      const entity = mapper.toDomain(record);

      // These are hardcoded defaults in the current implementation
      expect(entity.notificationTitle).toBeNull();
      expect(entity.notificationUrl).toBeNull();
      expect(entity.hour).toBe(9);
      expect(entity.minute).toBe(0);
      expect(entity.isActive).toBe(true);
    });

    it("maps all notification types correctly in toDomain", () => {
      const types: Array<{
        drizzle: string;
        domain: NotificationScheduleType;
      }> = [
        { drizzle: "CHALLENGE", domain: NotificationScheduleType.CHALLENGE },
        { drizzle: "REMINDER", domain: NotificationScheduleType.REMINDER },
        {
          drizzle: "ANNOUNCEMENT",
          domain: NotificationScheduleType.ANNOUNCEMENT,
        },
        {
          drizzle: "DAILY_RANKING",
          domain: NotificationScheduleType.DAILY_RANKING,
        },
        { drizzle: "INFO", domain: NotificationScheduleType.INFO },
      ];

      for (const { drizzle, domain } of types) {
        const record = createMockScheduleSelect({
          notificationType: drizzle,
        });
        const entity = mapper.toDomain(record);
        expect(entity.notificationType).toBe(domain);
      }
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts NotificationSchedule entity to Drizzle insert input", async () => {
      const entity = await createMockScheduleEntity();

      const insert = mapper.toDrizzleInsert(entity);

      expect(insert.id).toBe("schedule-123");
      expect(insert.tripId).toBe("trip-456");
      expect(insert.name).toBe("Test Schedule");
      expect(insert.notificationType).toBe("INFO");
      expect(insert.content).toBe("This is a test notification");
      expect(insert.scheduledFor).toEqual(entity.startDate);
      expect(insert.createdBy).toBe("user-789");
      expect(insert.createdAt).toEqual(new Date("2024-01-01T00:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-10T00:00:00Z"));
    });

    it("uses notificationBody for content field", async () => {
      const entity = await createMockScheduleEntity({
        notificationBody: "Custom notification content",
      });

      const insert = mapper.toDrizzleInsert(entity);

      expect(insert.content).toBe("Custom notification content");
    });

    it("falls back to name when notificationBody is null", async () => {
      const entity = await createMockScheduleEntity({
        name: "Fallback Name",
        notificationBody: null,
      });

      const insert = mapper.toDrizzleInsert(entity);

      expect(insert.content).toBe("Fallback Name");
    });

    it("casts notificationType to string", async () => {
      const entity = await createMockScheduleEntity({
        notificationType: NotificationScheduleType.CHALLENGE,
      });

      const insert = mapper.toDrizzleInsert(entity);

      expect(insert.notificationType).toBe("CHALLENGE");
      expect(typeof insert.notificationType).toBe("string");
    });

    it("handles null tripId by defaulting to empty string", async () => {
      const entity = await createMockScheduleEntity({
        tripId: null,
      });

      const insert = mapper.toDrizzleInsert(entity);

      expect(insert.tripId).toBe("");
    });

    it("maps all notification types to strings", async () => {
      const typeTests = [
        { type: NotificationScheduleType.CHALLENGE, expected: "CHALLENGE" },
        { type: NotificationScheduleType.REMINDER, expected: "REMINDER" },
        {
          type: NotificationScheduleType.ANNOUNCEMENT,
          expected: "ANNOUNCEMENT",
        },
        {
          type: NotificationScheduleType.DAILY_RANKING,
          expected: "DAILY_RANKING",
        },
        { type: NotificationScheduleType.INFO, expected: "INFO" },
      ];

      for (const { type, expected } of typeTests) {
        const entity = await createMockScheduleEntity({
          notificationType: type,
        });
        const insert = mapper.toDrizzleInsert(entity);
        expect(insert.notificationType).toBe(expected);
      }
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts NotificationSchedule entity to Drizzle update input", async () => {
      const entity = await createMockScheduleEntity();

      const update = mapper.toDrizzleUpdate(entity);

      // Should not include id or immutable fields
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("tripId");
      expect(update).not.toHaveProperty("createdBy");
      expect(update).not.toHaveProperty("createdAt");

      // Should include mutable fields
      expect(update.name).toBe("Test Schedule");
      expect(update.notificationType).toBe("INFO");
      expect(update.content).toBe("This is a test notification");
    });

    it("falls back to name when notificationBody is null", async () => {
      const entity = await createMockScheduleEntity({
        name: "Schedule Name",
        notificationBody: null,
      });

      const update = mapper.toDrizzleUpdate(entity);

      expect(update.content).toBe("Schedule Name");
    });

    it("updates updatedAt to current time", async () => {
      const entity = await createMockScheduleEntity();
      const beforeUpdate = new Date();

      const update = mapper.toDrizzleUpdate(entity);

      const afterUpdate = new Date();
      expect(update.updatedAt).toBeInstanceOf(Date);
      expect(update.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(update.updatedAt!.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("casts notificationType to string in update", async () => {
      const entity = await createMockScheduleEntity({
        notificationType: NotificationScheduleType.DAILY_RANKING,
      });

      const update = mapper.toDrizzleUpdate(entity);

      expect(update.notificationType).toBe("DAILY_RANKING");
    });
  });

  describe("fromPartial", () => {
    it("creates partial entity from Drizzle record with all fields", () => {
      const partial = mapper.fromPartial({
        id: "schedule-123",
        tripId: "trip-456",
        name: "Partial Schedule",
        notificationType: "CHALLENGE",
      });

      expect(partial.id).toBe("schedule-123");
      expect(partial.tripId).toBe("trip-456");
      expect(partial.name).toBe("Partial Schedule");
      expect(partial.notificationType).toBe(NotificationScheduleType.CHALLENGE);
    });

    it("creates partial entity with only provided fields", () => {
      const partial = mapper.fromPartial({
        id: "schedule-123",
        name: "Test",
      });

      expect(partial.id).toBe("schedule-123");
      expect(partial.name).toBe("Test");
      expect(partial.tripId).toBeUndefined();
      expect(partial.notificationType).toBeUndefined();
    });

    it("maps notificationType from Drizzle to domain enum", () => {
      const partial = mapper.fromPartial({
        notificationType: "REMINDER",
      });

      expect(partial.notificationType).toBe(NotificationScheduleType.REMINDER);
    });

    it("defaults unknown notificationType to INFO", () => {
      const partial = mapper.fromPartial({
        notificationType: "UNKNOWN",
      });

      expect(partial.notificationType).toBe(NotificationScheduleType.INFO);
    });

    it("returns empty object when no fields provided", () => {
      const partial = mapper.fromPartial({});

      expect(Object.keys(partial)).toHaveLength(0);
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = NotificationScheduleDrizzleMapper.instance;
      const instance2 = NotificationScheduleDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });

    it("is a NotificationScheduleDrizzleMapper", () => {
      const instance = NotificationScheduleDrizzleMapper.instance;

      expect(instance).toBeInstanceOf(NotificationScheduleDrizzleMapper);
    });
  });
});

/**
 * Summary
 *
 * This test suite covers the NotificationScheduleDrizzleMapper which handles
 * bidirectional mapping between Drizzle database records and NotificationSchedule
 * domain entities/DTOs.
 *
 * Test Coverage:
 * - toDTO: Converts Drizzle records to DTOs with proper type mapping, time
 *   extraction from scheduledFor, endDate calculation (1 year), and isActive
 *   derivation from isDraft
 * - toDomain: Converts Drizzle records to domain entities with hardcoded defaults
 *   for missing fields (hour=9, minute=0, isActive=true)
 * - toDrizzleInsert: Converts domain entities to insert format with string type
 *   casting, content fallback from notificationBody or name
 * - toDrizzleUpdate: Converts domain entities to update format with only mutable
 *   fields and fresh updatedAt timestamp
 * - fromPartial: Creates partial entities from partial records with type enum
 *   mapping
 * - Type mapping: Tests all NotificationScheduleType enum values (CHALLENGE,
 *   INFO, REMINDER, ANNOUNCEMENT, DAILY_RANKING) with fallback to INFO
 * - Singleton instance: Verifies proper singleton pattern implementation
 *
 * Key Implementation Details:
 * - notificationTitle and notificationUrl are always null in DTO (not in schema)
 * - hour/minute extracted from scheduledFor UTC time, default to 9:00
 * - endDate calculated as startDate + 365 days
 * - isActive = !isDraft
 * - Content field uses notificationBody with name as fallback
 * - notificationType is cast to string for Drizzle (enum stored as varchar)
 * - Update excludes id, tripId, createdBy, createdAt (immutable after creation)
 */
