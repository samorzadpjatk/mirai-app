import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  NotificationSchedule,
  normalizeScheduleWindow,
  getNextScheduledStartDate,
} from "./notification-schedule";
import { NotificationScheduleType } from "../../notification/enums";
import { ValidationError } from "../../system/errors";

// Helper to create valid future dates
function getFutureDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(12, 0, 0, 0);
  return date;
}

// Helper to create valid props for NotificationSchedule
function createValidProps(
  overrides: Partial<Parameters<typeof NotificationSchedule.create>[0]> = {},
): Parameters<typeof NotificationSchedule.create>[0] {
  const startDate = getFutureDate(2);
  const endDate = getFutureDate(5);

  return {
    name: "Test Schedule",
    tripId: null,
    notificationType: NotificationScheduleType.INFO,
    notificationTitle: "Test Title",
    notificationBody: "Test Body Content",
    notificationUrl: null,
    startDate,
    endDate,
    hour: 10,
    minute: 30,
    isActive: true,
    createdById: "user-123",
    ...overrides,
  };
}

describe("[UNIT] NotificationSchedule", () => {
  // ============================================================================
  // normalizeScheduleWindow Tests
  // ============================================================================
  describe("normalizeScheduleWindow", () => {
    it("normalizes schedule window to UTC time", () => {
      const startDate = new Date("2024-06-15T10:00:00Z");
      const endDate = new Date("2024-06-20T10:00:00Z");

      const result = normalizeScheduleWindow({
        startDate,
        endDate,
        hour: 14,
        minute: 30,
      });

      expect(result.startDate.getUTCHours()).toBe(14);
      expect(result.startDate.getUTCMinutes()).toBe(30);
      expect(result.endDate.getTime()).toBeGreaterThan(
        result.startDate.getTime(),
      );
    });

    it("preserves duration between start and end dates", () => {
      const startDate = new Date("2024-06-15T10:00:00Z");
      const endDate = new Date("2024-06-20T10:00:00Z");
      const originalDuration = endDate.getTime() - startDate.getTime();

      const result = normalizeScheduleWindow({
        startDate,
        endDate,
        hour: 8,
        minute: 0,
      });

      const newDuration = result.endDate.getTime() - result.startDate.getTime();
      expect(newDuration).toBe(originalDuration);
    });

    it("returns normalized hour and minute", () => {
      const result = normalizeScheduleWindow({
        startDate: new Date("2024-06-15T10:00:00Z"),
        endDate: new Date("2024-06-16T10:00:00Z"),
        hour: 9,
        minute: 45,
      });

      expect(result.hour).toBe(result.startDate.getUTCHours());
      expect(result.minute).toBe(result.startDate.getUTCMinutes());
    });
  });

  // ============================================================================
  // getNextScheduledStartDate Tests
  // ============================================================================
  describe("getNextScheduledStartDate", () => {
    it("returns date with specified hour and minute", () => {
      const now = new Date("2024-06-15T10:00:00Z");

      const result = getNextScheduledStartDate(14, 30, now);

      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it("advances to next day if time would be less than 5 minutes in future", () => {
      const now = new Date("2024-06-15T10:00:00Z");

      const result = getNextScheduledStartDate(10, 1, now);

      expect(result.getDate()).toBe(16);
      expect(result.getHours()).toBe(10);
      expect(result.getMinutes()).toBe(1);
    });

    it("returns same day if time is at least 5 minutes in future", () => {
      const now = new Date("2024-06-15T10:00:00Z");

      const result = getNextScheduledStartDate(10, 10, now);

      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(10);
      expect(result.getMinutes()).toBe(10);
    });

    it("defaults to current time if no reference provided", () => {
      const result = getNextScheduledStartDate(12, 0);

      expect(result).toBeInstanceOf(Date);
      expect(result.getHours()).toBe(12);
      expect(result.getMinutes()).toBe(0);
    });
  });

  // ============================================================================
  // Factory Method Tests (create)
  // ============================================================================
  describe("create", () => {
    it("creates notification schedule with valid data", async () => {
      const props = createValidProps();

      const effect = NotificationSchedule.create(props);
      const schedule = await Effect.runPromise(effect);

      expect(schedule.name).toBe("Test Schedule");
      expect(schedule.notificationType).toBe(NotificationScheduleType.INFO);
      expect(schedule.hour).toBe(10);
      expect(schedule.minute).toBe(30);
      expect(schedule.isActive).toBe(true);
      expect(schedule.createdById).toBe("user-123");
      expect(schedule.tripId).toBeNull();
      expect(schedule.lastRun).toBeNull();
      expect(schedule.id).toBeDefined();
      expect(schedule.createdAt).toBeInstanceOf(Date);
      expect(schedule.updatedAt).toBeInstanceOf(Date);
    });

    it("creates schedule with all properties provided", async () => {
      const createdAt = new Date("2024-01-01T00:00:00Z");
      const updatedAt = new Date("2024-01-02T00:00:00Z");
      const startDate = getFutureDate(2);
      const endDate = getFutureDate(5);

      const effect = NotificationSchedule.create({
        id: "schedule-123",
        name: "Custom Schedule",
        tripId: "trip-456",
        notificationType: NotificationScheduleType.DAILY_RANKING,
        notificationTitle: "Daily Ranking",
        notificationBody: "Check your ranking!",
        notificationUrl: "https://example.com/ranking",
        startDate,
        endDate,
        hour: 9,
        minute: 0,
        isActive: false,
        createdById: "user-789",
        lastRun: new Date("2024-06-01T10:00:00Z"),
        createdAt,
        updatedAt,
      });

      const schedule = await Effect.runPromise(effect);

      expect(schedule.id).toBe("schedule-123");
      expect(schedule.name).toBe("Custom Schedule");
      expect(schedule.tripId).toBe("trip-456");
      expect(schedule.notificationType).toBe(
        NotificationScheduleType.DAILY_RANKING,
      );
      expect(schedule.notificationTitle).toBe("Daily Ranking");
      expect(schedule.notificationBody).toBe("Check your ranking!");
      expect(schedule.notificationUrl).toBe("https://example.com/ranking");
      expect(schedule.hour).toBe(9);
      expect(schedule.minute).toBe(0);
      expect(schedule.isActive).toBe(false);
      expect(schedule.createdById).toBe("user-789");
      expect(schedule.lastRun).toBeInstanceOf(Date);
      expect(schedule.createdAt).toBe(createdAt);
      expect(schedule.updatedAt).toBe(updatedAt);
    });

    it("creates INFO type schedule without title/body requirements", async () => {
      const effect = NotificationSchedule.create({
        name: "Info Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate: getFutureDate(2),
        endDate: getFutureDate(5),
        hour: 10,
        minute: 0,
        createdById: "user-123",
      });

      const schedule = await Effect.runPromise(effect);

      expect(schedule.notificationType).toBe(NotificationScheduleType.INFO);
      expect(schedule.notificationTitle).toBeNull();
      expect(schedule.notificationBody).toBeNull();
    });

    it("generates UUID when id not provided", async () => {
      const effect = NotificationSchedule.create(createValidProps());
      const schedule = await Effect.runPromise(effect);

      expect(schedule.id).toBeDefined();
      expect(typeof schedule.id).toBe("string");
      expect(schedule.id.length).toBeGreaterThan(10);
    });

    it("trims name whitespace", async () => {
      const effect = NotificationSchedule.create({
        ...createValidProps(),
        name: "  Test Schedule  ",
      });

      const schedule = await Effect.runPromise(effect);
      expect(schedule.name).toBe("Test Schedule");
    });

    // ============================================================================
    // Validation Tests
    // ============================================================================
    it("fails when name is empty", async () => {
      const effect = NotificationSchedule.create({
        ...createValidProps(),
        name: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("name");
      }
    });

    it("fails when name is whitespace only", async () => {
      const effect = NotificationSchedule.create({
        ...createValidProps(),
        name: "   ",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("name");
      }
    });

    it("fails when name exceeds max length", async () => {
      const effect = NotificationSchedule.create({
        ...createValidProps(),
        name: "a".repeat(101),
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("name");
      }
    });

    it("fails when notificationTitle is empty for non-INFO type", async () => {
      const effect = NotificationSchedule.create({
        ...createValidProps(),
        notificationType: NotificationScheduleType.DAILY_RANKING,
        notificationTitle: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("notificationTitle");
      }
    });

    it("fails when notificationTitle exceeds max length", async () => {
      const effect = NotificationSchedule.create({
        ...createValidProps(),
        notificationType: NotificationScheduleType.CHALLENGE,
        notificationTitle: "a".repeat(201),
        notificationBody: "Valid body",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("notificationTitle");
      }
    });

    it("fails when notificationBody is empty for non-INFO type", async () => {
      const effect = NotificationSchedule.create({
        ...createValidProps(),
        notificationType: NotificationScheduleType.REMINDER,
        notificationTitle: "Valid Title",
        notificationBody: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("notificationBody");
      }
    });

    it("fails when notificationBody exceeds max length", async () => {
      const effect = NotificationSchedule.create({
        ...createValidProps(),
        notificationType: NotificationScheduleType.ANNOUNCEMENT,
        notificationTitle: "Valid Title",
        notificationBody: "a".repeat(2001),
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("notificationBody");
      }
    });

    it("fails when notificationUrl exceeds max length", async () => {
      const effect = NotificationSchedule.create({
        ...createValidProps(),
        notificationType: NotificationScheduleType.CHALLENGE,
        notificationTitle: "Valid Title",
        notificationBody: "Valid body",
        notificationUrl: "https://example.com/" + "a".repeat(500),
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("notificationUrl");
      }
    });

    it("fails when hour is out of range", async () => {
      const effect = NotificationSchedule.create({
        ...createValidProps(),
        hour: 25,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("hour");
      }
    });

    it("fails when minute is out of range", async () => {
      const effect = NotificationSchedule.create({
        ...createValidProps(),
        minute: 60,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("minute");
      }
    });

    it("fails when startDate is after endDate", async () => {
      const effect = NotificationSchedule.create({
        ...createValidProps(),
        startDate: getFutureDate(10),
        endDate: getFutureDate(2),
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("startDate/endDate");
      }
    });

    it("fails when startDate equals endDate", async () => {
      const sameDate = getFutureDate(2);

      const effect = NotificationSchedule.create({
        ...createValidProps(),
        startDate: sameDate,
        endDate: sameDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("startDate/endDate");
      }
    });

    it("fails when duration is less than 1 day", async () => {
      const startDate = getFutureDate(2);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later

      const effect = NotificationSchedule.create({
        ...createValidProps(),
        startDate,
        endDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("startDate/endDate");
      }
    });

    it("fails when createdById is empty", async () => {
      const effect = NotificationSchedule.create({
        ...createValidProps(),
        createdById: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("createdById");
      }
    });

    it("fails when createdById is whitespace only", async () => {
      const effect = NotificationSchedule.create({
        ...createValidProps(),
        createdById: "   ",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("createdById");
      }
    });
  });

  // ============================================================================
  // Update Method Tests
  // ============================================================================
  describe("update", () => {
    async function createSchedule(props = {}): Promise<NotificationSchedule> {
      return Effect.runPromise(
        NotificationSchedule.create(createValidProps(props)),
      );
    }

    it("updates name", async () => {
      const schedule = await createSchedule();

      const updated = await Effect.runPromise(
        schedule.update({ name: "Updated Name" }),
      );

      expect(updated.name).toBe("Updated Name");
      expect(updated.id).toBe(schedule.id);
    });

    it("fails to update with empty name", async () => {
      const schedule = await createSchedule();

      const result = await Effect.runPromise(
        Effect.either(schedule.update({ name: "" })),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("name");
      }
    });

    it("updates notification content", async () => {
      const schedule = await createSchedule({
        notificationType: NotificationScheduleType.CHALLENGE,
        notificationTitle: "Old Title",
        notificationBody: "Old Body",
      });

      const updated = await Effect.runPromise(
        schedule.update({
          notificationTitle: "New Title",
          notificationBody: "New Body",
        }),
      );

      expect(updated.notificationTitle).toBe("New Title");
      expect(updated.notificationBody).toBe("New Body");
    });

    it("updates schedule timing", async () => {
      const schedule = await createSchedule();

      const updated = await Effect.runPromise(
        schedule.update({
          hour: 15,
          minute: 45,
        }),
      );

      expect(updated.hour).toBe(15);
      expect(updated.minute).toBe(45);
    });

    it("updates isActive status", async () => {
      const schedule = await createSchedule({ isActive: true });

      const updated = await Effect.runPromise(
        schedule.update({ isActive: false }),
      );

      expect(updated.isActive).toBe(false);
    });

    it("preserves unchanged properties", async () => {
      const schedule = await createSchedule({ name: "Original Name" });

      const updated = await Effect.runPromise(
        schedule.update({ isActive: false }),
      );

      expect(updated.name).toBe("Original Name");
      expect(updated.isActive).toBe(false);
    });

    it("updates updatedAt timestamp", async () => {
      const schedule = await createSchedule({
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      });

      const updated = await Effect.runPromise(
        schedule.update({ name: "New Name" }),
      );

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        schedule.updatedAt.getTime(),
      );
    });
  });

  // ============================================================================
  // toggleActive Tests
  // ============================================================================
  describe("toggleActive", () => {
    it("toggles from active to inactive", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({ isActive: true }),
      );
      const schedule = await Effect.runPromise(effect);

      const toggled = schedule.toggleActive();

      expect(toggled.isActive).toBe(false);
    });

    it("toggles from inactive to active", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({ isActive: false }),
      );
      const schedule = await Effect.runPromise(effect);

      const toggled = schedule.toggleActive();

      expect(toggled.isActive).toBe(true);
    });

    it("updates updatedAt when toggling", async () => {
      const effect = NotificationSchedule.create(createValidProps());
      const schedule = await Effect.runPromise(effect);

      const toggled = schedule.toggleActive();

      expect(toggled.updatedAt.getTime()).toBeGreaterThanOrEqual(
        schedule.updatedAt.getTime(),
      );
    });

    it("preserves original schedule", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({ isActive: true }),
      );
      const schedule = await Effect.runPromise(effect);

      schedule.toggleActive();

      expect(schedule.isActive).toBe(true);
    });
  });

  // ============================================================================
  // updateLastRun Tests
  // ============================================================================
  describe("updateLastRun", () => {
    it("updates last run timestamp", async () => {
      const effect = NotificationSchedule.create(createValidProps());
      const schedule = await Effect.runPromise(effect);

      const lastRun = new Date("2024-06-15T10:00:00Z");
      const updated = schedule.updateLastRun(lastRun);

      expect(updated.lastRun).toBe(lastRun);
    });

    it("updates updatedAt timestamp", async () => {
      const effect = NotificationSchedule.create(createValidProps());
      const schedule = await Effect.runPromise(effect);

      const updated = schedule.updateLastRun(new Date());

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        schedule.updatedAt.getTime(),
      );
    });

    it("preserves original schedule", async () => {
      const effect = NotificationSchedule.create(createValidProps());
      const schedule = await Effect.runPromise(effect);

      schedule.updateLastRun(new Date());

      expect(schedule.lastRun).toBeNull();
    });
  });

  // ============================================================================
  // Duplicate Tests
  // ============================================================================
  describe("duplicate", () => {
    it("creates duplicate with new id", async () => {
      const effect = NotificationSchedule.create(createValidProps());
      const schedule = await Effect.runPromise(effect);

      const duplicateEffect = schedule.duplicate({
        newCreatedById: "user-456",
      });
      const duplicate = await Effect.runPromise(duplicateEffect);

      expect(duplicate.id).not.toBe(schedule.id);
      expect(duplicate.name).toBe("Test Schedule (Copy)");
    });

    it("duplicates with custom name", async () => {
      const effect = NotificationSchedule.create(createValidProps());
      const schedule = await Effect.runPromise(effect);

      const duplicate = await Effect.runPromise(
        schedule.duplicate({
          name: "Custom Duplicate",
          newCreatedById: "user-456",
        }),
      );

      expect(duplicate.name).toBe("Custom Duplicate");
    });

    it("duplicates with new dates", async () => {
      const effect = NotificationSchedule.create(createValidProps());
      const schedule = await Effect.runPromise(effect);

      const newStart = getFutureDate(10);
      const newEnd = getFutureDate(15);

      const duplicate = await Effect.runPromise(
        schedule.duplicate({
          startDate: newStart,
          endDate: newEnd,
          newCreatedById: "user-456",
        }),
      );

      // Dates are normalized during creation (hour/minute are set from original schedule)
      // The day should match but time may differ due to normalization
      expect(duplicate.startDate.getDate()).toBe(newStart.getDate());
      expect(duplicate.endDate.getDate()).toBe(newEnd.getDate());
    });

    it("duplicates with same duration when only start date changes", async () => {
      const startDate = getFutureDate(2);
      const endDate = getFutureDate(5);

      const effect = NotificationSchedule.create(
        createValidProps({ startDate, endDate }),
      );
      const schedule = await Effect.runPromise(effect);
      const originalDuration = endDate.getTime() - startDate.getTime();

      const newStart = getFutureDate(10);
      const duplicate = await Effect.runPromise(
        schedule.duplicate({
          startDate: newStart,
          newCreatedById: "user-456",
        }),
      );

      const newDuration =
        duplicate.endDate.getTime() - duplicate.startDate.getTime();
      expect(newDuration).toBe(originalDuration);
    });

    it("duplicates are inactive by default", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({ isActive: true }),
      );
      const schedule = await Effect.runPromise(effect);

      const duplicate = await Effect.runPromise(
        schedule.duplicate({ newCreatedById: "user-456" }),
      );

      expect(duplicate.isActive).toBe(false);
    });

    it("preserves notification type and content", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          notificationType: NotificationScheduleType.CHALLENGE,
          notificationTitle: "Title",
          notificationBody: "Body",
        }),
      );
      const schedule = await Effect.runPromise(effect);

      const duplicate = await Effect.runPromise(
        schedule.duplicate({ newCreatedById: "user-456" }),
      );

      expect(duplicate.notificationType).toBe(schedule.notificationType);
      expect(duplicate.notificationTitle).toBe(schedule.notificationTitle);
      expect(duplicate.notificationBody).toBe(schedule.notificationBody);
    });

    it("preserves tripId", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({ tripId: "trip-123" }),
      );
      const schedule = await Effect.runPromise(effect);

      const duplicate = await Effect.runPromise(
        schedule.duplicate({ newCreatedById: "user-456" }),
      );

      expect(duplicate.tripId).toBe("trip-123");
    });

    it("uses new createdById", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({ createdById: "user-123" }),
      );
      const schedule = await Effect.runPromise(effect);

      const duplicate = await Effect.runPromise(
        schedule.duplicate({ newCreatedById: "user-789" }),
      );

      expect(duplicate.createdById).toBe("user-789");
    });
  });

  // ============================================================================
  // State Query Tests
  // ============================================================================
  describe("isCurrentlyActive", () => {
    it("returns true when isActive and within schedule window", async () => {
      // Use future dates relative to now
      const startDate = getFutureDate(2);
      const endDate = getFutureDate(10);
      // Mock "now" to be within the window (5 days from now)
      const now = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);

      const effect = NotificationSchedule.create(
        createValidProps({
          startDate,
          endDate,
          isActive: true,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.isCurrentlyActive(now)).toBe(true);
    });

    it("returns false when isActive is false", async () => {
      const startDate = getFutureDate(2);
      const endDate = getFutureDate(10);
      const now = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);

      const effect = NotificationSchedule.create(
        createValidProps({
          startDate,
          endDate,
          isActive: false,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.isCurrentlyActive(now)).toBe(false);
    });

    it("returns false when before startDate", async () => {
      const startDate = getFutureDate(5);
      const endDate = getFutureDate(10);
      // Mock "now" to be before startDate
      const now = new Date(startDate.getTime() - 2 * 24 * 60 * 60 * 1000);

      const effect = NotificationSchedule.create(
        createValidProps({
          startDate,
          endDate,
          isActive: true,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.isCurrentlyActive(now)).toBe(false);
    });

    it("returns false when after endDate", async () => {
      const startDate = getFutureDate(2);
      const endDate = getFutureDate(5);
      // Mock "now" to be after endDate
      const now = new Date(endDate.getTime() + 2 * 24 * 60 * 60 * 1000);

      const effect = NotificationSchedule.create(
        createValidProps({
          startDate,
          endDate,
          isActive: true,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.isCurrentlyActive(now)).toBe(false);
    });
  });

  describe("isExpired", () => {
    it("returns true when current time is past endDate", async () => {
      const startDate = getFutureDate(2);
      const endDate = getFutureDate(5);
      // Mock "now" to be after endDate
      const now = new Date(endDate.getTime() + 2 * 24 * 60 * 60 * 1000);

      const effect = NotificationSchedule.create(
        createValidProps({
          startDate,
          endDate,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.isExpired(now)).toBe(true);
    });

    it("returns false when current time is before endDate", async () => {
      const startDate = getFutureDate(2);
      const endDate = getFutureDate(10);
      // Mock "now" to be within the window
      const now = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);

      const effect = NotificationSchedule.create(
        createValidProps({
          startDate,
          endDate,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.isExpired(now)).toBe(false);
    });
  });

  describe("isUpcoming", () => {
    it("returns true when current time is before startDate", async () => {
      const startDate = getFutureDate(5);
      const endDate = getFutureDate(10);
      // Mock "now" to be before startDate
      const now = new Date(startDate.getTime() - 2 * 24 * 60 * 60 * 1000);

      const effect = NotificationSchedule.create(
        createValidProps({
          startDate,
          endDate,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.isUpcoming(now)).toBe(true);
    });

    it("returns false when current time is after startDate", async () => {
      const startDate = getFutureDate(2);
      const endDate = getFutureDate(10);
      // Mock "now" to be after startDate
      const now = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);

      const effect = NotificationSchedule.create(
        createValidProps({
          startDate,
          endDate,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.isUpcoming(now)).toBe(false);
    });
  });

  describe("shouldRunAt", () => {
    it("returns true when date matches schedule hour and minute", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          hour: 10,
          minute: 30,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      const checkDate = new Date("2024-06-15T10:30:00Z");
      expect(schedule.shouldRunAt(checkDate)).toBe(true);
    });

    it("returns false when hour does not match", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          hour: 10,
          minute: 30,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      const checkDate = new Date("2024-06-15T11:30:00Z");
      expect(schedule.shouldRunAt(checkDate)).toBe(false);
    });

    it("returns false when minute does not match", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          hour: 10,
          minute: 30,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      const checkDate = new Date("2024-06-15T10:45:00Z");
      expect(schedule.shouldRunAt(checkDate)).toBe(false);
    });
  });

  describe("getNextRunTime", () => {
    it("returns next run time after given date", async () => {
      const startDate = getFutureDate(2);
      const endDate = getFutureDate(30);

      const effect = NotificationSchedule.create(
        createValidProps({
          startDate,
          endDate,
          hour: 10,
          minute: 30,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      // "After" is a date between start and end, before the scheduled time
      const after = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      after.setUTCHours(8, 0, 0, 0); // Before 10:30
      const nextRun = schedule.getNextRunTime(after);

      expect(nextRun).not.toBeNull();
      expect(nextRun!.getUTCHours()).toBe(10);
      expect(nextRun!.getUTCMinutes()).toBe(30);
      expect(nextRun!.getTime()).toBeGreaterThan(after.getTime());
    });

    it("advances to next day when time already passed", async () => {
      const startDate = getFutureDate(2);
      const endDate = getFutureDate(30);

      const effect = NotificationSchedule.create(
        createValidProps({
          startDate,
          endDate,
          hour: 10,
          minute: 30,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      // "After" is after the scheduled time (10:30)
      const after = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      after.setUTCHours(12, 0, 0, 0); // After 10:30
      const originalDay = after.getDate();

      const nextRun = schedule.getNextRunTime(after);

      expect(nextRun).not.toBeNull();
      expect(nextRun!.getDate()).toBe(originalDay + 1);
    });

    it("returns null when schedule has expired", async () => {
      const startDate = getFutureDate(2);
      const endDate = getFutureDate(5);

      const effect = NotificationSchedule.create(
        createValidProps({
          startDate,
          endDate,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      // "After" is after endDate
      const after = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
      const nextRun = schedule.getNextRunTime(after);

      expect(nextRun).toBeNull();
    });

    it("returns null when next run would be after endDate", async () => {
      const startDate = getFutureDate(2);
      const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);

      const effect = NotificationSchedule.create(
        createValidProps({
          startDate,
          endDate,
          hour: 10,
          minute: 30,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      // "After" is late on the last day, past the scheduled time
      const after = new Date(endDate.getTime());
      after.setUTCHours(12, 0, 0, 0); // After 10:30

      const nextRun = schedule.getNextRunTime(after);

      expect(nextRun).toBeNull();
    });
  });

  describe("getDurationMs", () => {
    it("returns duration in milliseconds", async () => {
      const startDate = getFutureDate(2);
      const endDate = getFutureDate(5);
      const expectedDuration = 3 * 24 * 60 * 60 * 1000; // 3 days

      const effect = NotificationSchedule.create(
        createValidProps({
          startDate,
          endDate,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      const duration = schedule.getDurationMs();
      // Allow for some normalization difference (within 1 minute)
      expect(Math.abs(duration - expectedDuration)).toBeLessThan(60000);
    });
  });

  describe("getDurationDays", () => {
    it("returns duration in days", async () => {
      const startDate = getFutureDate(2);
      const endDate = getFutureDate(5);

      const effect = NotificationSchedule.create(
        createValidProps({
          startDate,
          endDate,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.getDurationDays()).toBe(3);
    });
  });

  describe("isDailyRanking", () => {
    it("returns true for DAILY_RANKING type", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          notificationType: NotificationScheduleType.DAILY_RANKING,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.isDailyRanking()).toBe(true);
    });

    it("returns false for other types", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          notificationType: NotificationScheduleType.INFO,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.isDailyRanking()).toBe(false);
    });
  });

  describe("isTripSpecific", () => {
    it("returns true when tripId is set", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          tripId: "trip-123",
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.isTripSpecific()).toBe(true);
    });

    it("returns false when tripId is null", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          tripId: null,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.isTripSpecific()).toBe(false);
    });
  });

  describe("hasContent", () => {
    it("returns true when both title and body are set", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          notificationType: NotificationScheduleType.CHALLENGE,
          notificationTitle: "Title",
          notificationBody: "Body",
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.hasContent()).toBe(true);
    });

    it("returns false when title is null", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          notificationType: NotificationScheduleType.INFO,
          notificationTitle: null,
          notificationBody: null,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.hasContent()).toBe(false);
    });
  });

  describe("hasUrl", () => {
    it("returns true when URL is set", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          notificationUrl: "https://example.com",
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.hasUrl()).toBe(true);
    });

    it("returns false when URL is null", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          notificationUrl: null,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.hasUrl()).toBe(false);
    });

    it("returns false when URL is empty string", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          notificationType: NotificationScheduleType.CHALLENGE,
          notificationTitle: "Title",
          notificationBody: "Body",
          notificationUrl: "",
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.hasUrl()).toBe(false);
    });
  });

  describe("getFormattedTime", () => {
    it("returns time in HH:MM format", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          hour: 9,
          minute: 5,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.getFormattedTime()).toBe("09:05");
    });

    it("pads single digit hour and minute", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          hour: 1,
          minute: 2,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.getFormattedTime()).toBe("01:02");
    });

    it("handles 24-hour format", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          hour: 23,
          minute: 59,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.getFormattedTime()).toBe("23:59");
    });
  });

  describe("getSummary", () => {
    it("returns formatted summary string", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          name: "Daily Update",
          notificationType: NotificationScheduleType.INFO,
          hour: 10,
          minute: 30,
          isActive: true,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.getSummary()).toBe(
        "Daily Update (INFO) at 10:30 - active",
      );
    });

    it("indicates inactive status", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({
          name: "Weekly Report",
          notificationType: NotificationScheduleType.ANNOUNCEMENT,
          isActive: false,
        }),
      );
      const schedule = await Effect.runPromise(effect);

      expect(schedule.getSummary()).toContain("inactive");
    });
  });

  // ============================================================================
  // Immutability Tests
  // ============================================================================
  describe("immutability", () => {
    it("original schedule unchanged after toggle", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({ isActive: true }),
      );
      const schedule = await Effect.runPromise(effect);

      const originalIsActive = schedule.isActive;
      schedule.toggleActive();

      expect(schedule.isActive).toBe(originalIsActive);
    });

    it("original schedule unchanged after update", async () => {
      const effect = NotificationSchedule.create(
        createValidProps({ name: "Original" }),
      );
      const schedule = await Effect.runPromise(effect);

      await Effect.runPromise(schedule.update({ name: "Updated" }));

      expect(schedule.name).toBe("Original");
    });
  });
});
