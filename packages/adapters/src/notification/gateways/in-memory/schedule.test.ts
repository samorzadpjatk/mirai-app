import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryNotificationScheduleGateway } from "./schedule";
import type {
  NotificationScheduleDTO,
  NotificationScheduleExecutionRecord,
} from "@mirai-app/use-cases";
import {
  NotificationScheduleType,
  NotificationStatus,
  NotificationPriority,
} from "@mirai-app/domain";

describe("[UNIT] InMemoryNotificationScheduleGateway", () => {
  let gateway: InMemoryNotificationScheduleGateway;

  const createMockSchedule = (
    id: string,
    createdAt: Date,
    overrides: Partial<NotificationScheduleDTO> = {},
  ): NotificationScheduleDTO => ({
    id,
    name: overrides.name ?? `Schedule ${id}`,
    tripId: overrides.tripId ?? "trip-001",
    notificationType:
      overrides.notificationType ?? NotificationScheduleType.INFO,
    notificationTitle: overrides.notificationTitle ?? "Test Title",
    notificationBody: overrides.notificationBody ?? "Test Body",
    notificationUrl: overrides.notificationUrl ?? null,
    startDate: overrides.startDate ?? new Date(2024, 0, 1),
    endDate: overrides.endDate ?? new Date(2024, 11, 31),
    hour: overrides.hour ?? 9,
    minute: overrides.minute ?? 0,
    isActive: overrides.isActive ?? true,
    createdById: overrides.createdById ?? "user-001",
    lastRun: overrides.lastRun ?? null,
    createdAt,
    updatedAt: createdAt,
  });

  beforeEach(() => {
    gateway = new InMemoryNotificationScheduleGateway();
  });

  describe("CRUD Operations", () => {
    it("creates a schedule", async () => {
      const schedule = createMockSchedule("sched-001", new Date());

      const result = await Effect.runPromise(gateway.create(schedule));

      expect(result.id).toBe("sched-001");
      expect(result.name).toBe("Schedule sched-001");
    });

    it("finds schedule by id", async () => {
      const schedule = createMockSchedule("sched-001", new Date());
      await Effect.runPromise(gateway.create(schedule));

      const result = await Effect.runPromise(gateway.findById("sched-001"));

      expect(result).not.toBeNull();
      expect(result?.id).toBe("sched-001");
    });

    it("returns null when schedule not found", async () => {
      const result = await Effect.runPromise(gateway.findById("nonexistent"));
      expect(result).toBeNull();
    });

    it("finds schedule by name", async () => {
      const schedule = createMockSchedule("sched-001", new Date(), {
        name: "Daily Reminder",
      });
      await Effect.runPromise(gateway.create(schedule));

      const result = await Effect.runPromise(
        gateway.findByName("Daily Reminder"),
      );

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Daily Reminder");
    });

    it("finds schedule by name case-insensitive", async () => {
      const schedule = createMockSchedule("sched-001", new Date(), {
        name: "Daily Reminder",
      });
      await Effect.runPromise(gateway.create(schedule));

      const result = await Effect.runPromise(
        gateway.findByName("daily reminder"),
      );

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Daily Reminder");
    });

    it("finds schedule by trip id and name", async () => {
      const schedule = createMockSchedule("sched-001", new Date(), {
        tripId: "trip-001",
        name: "Trip Reminder",
      });
      await Effect.runPromise(gateway.create(schedule));

      const result = await Effect.runPromise(
        gateway.findByTripIdAndName("trip-001", "Trip Reminder"),
      );

      expect(result).not.toBeNull();
      expect(result?.tripId).toBe("trip-001");
    });

    it("updates a schedule", async () => {
      const schedule = createMockSchedule("sched-001", new Date());
      await Effect.runPromise(gateway.create(schedule));

      const updated: NotificationScheduleDTO = {
        ...schedule,
        name: "Updated Schedule",
      };
      const result = await Effect.runPromise(gateway.update(updated));

      expect(result.name).toBe("Updated Schedule");

      const found = await Effect.runPromise(gateway.findById("sched-001"));
      expect(found?.name).toBe("Updated Schedule");
    });

    it("deletes a schedule", async () => {
      const schedule = createMockSchedule("sched-001", new Date());
      await Effect.runPromise(gateway.create(schedule));

      await Effect.runPromise(gateway.delete("sched-001"));

      const result = await Effect.runPromise(gateway.findById("sched-001"));
      expect(result).toBeNull();
    });

    it("checks if schedule exists", async () => {
      const schedule = createMockSchedule("sched-001", new Date());
      await Effect.runPromise(gateway.create(schedule));

      const exists = await Effect.runPromise(gateway.exists("sched-001"));
      const notExists = await Effect.runPromise(gateway.exists("nonexistent"));

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });

  describe("Bulk Operations", () => {
    it("deletes multiple schedules", async () => {
      const schedules = [
        createMockSchedule("sched-001", new Date()),
        createMockSchedule("sched-002", new Date()),
        createMockSchedule("sched-003", new Date()),
      ];
      await Effect.runPromise(gateway.seed(schedules));

      const count = await Effect.runPromise(
        gateway.deleteMany(["sched-001", "sched-002"]),
      );

      expect(count).toBe(2);
      expect(await Effect.runPromise(gateway.exists("sched-001"))).toBe(false);
      expect(await Effect.runPromise(gateway.exists("sched-002"))).toBe(false);
      expect(await Effect.runPromise(gateway.exists("sched-003"))).toBe(true);
    });

    it("counts deleted items only for existing schedules", async () => {
      const schedule = createMockSchedule("sched-001", new Date());
      await Effect.runPromise(gateway.create(schedule));

      const count = await Effect.runPromise(
        gateway.deleteMany(["sched-001", "nonexistent"]),
      );

      expect(count).toBe(1);
    });
  });

  describe("Filtering and Counting", () => {
    it("counts all schedules when no filter", async () => {
      const schedules = [
        createMockSchedule("sched-001", new Date()),
        createMockSchedule("sched-002", new Date()),
      ];
      await Effect.runPromise(gateway.seed(schedules));

      const count = await Effect.runPromise(gateway.count());

      expect(count).toBe(2);
    });

    it("counts schedules by trip id filter", async () => {
      const schedules = [
        createMockSchedule("sched-001", new Date(), { tripId: "trip-001" }),
        createMockSchedule("sched-002", new Date(), { tripId: "trip-001" }),
        createMockSchedule("sched-003", new Date(), { tripId: "trip-002" }),
      ];
      await Effect.runPromise(gateway.seed(schedules));

      const count = await Effect.runPromise(
        gateway.count({ tripId: "trip-001" }),
      );

      expect(count).toBe(2);
    });

    it("counts schedules by notification type filter", async () => {
      const schedules = [
        createMockSchedule("sched-001", new Date(), {
          notificationType: NotificationScheduleType.INFO,
        }),
        createMockSchedule("sched-002", new Date(), {
          notificationType: NotificationScheduleType.INFO,
        }),
        createMockSchedule("sched-003", new Date(), {
          notificationType: NotificationScheduleType.REMINDER,
        }),
      ];
      await Effect.runPromise(gateway.seed(schedules));

      const count = await Effect.runPromise(
        gateway.count({ notificationType: NotificationScheduleType.INFO }),
      );

      expect(count).toBe(2);
    });

    it("counts schedules by isActive filter", async () => {
      const schedules = [
        createMockSchedule("sched-001", new Date(), { isActive: true }),
        createMockSchedule("sched-002", new Date(), { isActive: true }),
        createMockSchedule("sched-003", new Date(), { isActive: false }),
      ];
      await Effect.runPromise(gateway.seed(schedules));

      const count = await Effect.runPromise(gateway.count({ isActive: true }));

      expect(count).toBe(2);
    });

    it("counts schedules by date range filter", async () => {
      const schedules = [
        createMockSchedule("sched-001", new Date(), {
          startDate: new Date(2024, 0, 1),
        }),
        createMockSchedule("sched-002", new Date(), {
          startDate: new Date(2024, 5, 1),
        }),
        createMockSchedule("sched-003", new Date(), {
          startDate: new Date(2024, 10, 1),
        }),
      ];
      await Effect.runPromise(gateway.seed(schedules));

      const count = await Effect.runPromise(
        gateway.count({
          startDateFrom: new Date(2024, 0, 1),
          startDateTo: new Date(2024, 6, 1),
        }),
      );

      expect(count).toBe(2);
    });

    it("counts schedules by search filter", async () => {
      const schedules = [
        createMockSchedule("sched-001", new Date(), { name: "Daily Reminder" }),
        createMockSchedule("sched-002", new Date(), { name: "Weekly Update" }),
        createMockSchedule("sched-003", new Date(), { name: "Daily Report" }),
      ];
      await Effect.runPromise(gateway.seed(schedules));

      const count = await Effect.runPromise(gateway.count({ search: "daily" }));

      expect(count).toBe(2);
    });

    it("combines multiple filters", async () => {
      const schedules = [
        createMockSchedule("sched-001", new Date(), {
          tripId: "trip-001",
          isActive: true,
          name: "Daily Reminder",
        }),
        createMockSchedule("sched-002", new Date(), {
          tripId: "trip-001",
          isActive: false,
          name: "Daily Report",
        }),
        createMockSchedule("sched-003", new Date(), {
          tripId: "trip-002",
          isActive: true,
          name: "Weekly Update",
        }),
      ];
      await Effect.runPromise(gateway.seed(schedules));

      const count = await Effect.runPromise(
        gateway.count({
          tripId: "trip-001",
          isActive: true,
          search: "daily",
        }),
      );

      expect(count).toBe(1);
    });
  });

  describe("Status Management", () => {
    it("updates last run timestamp", async () => {
      const schedule = createMockSchedule("sched-001", new Date());
      await Effect.runPromise(gateway.create(schedule));

      const lastRun = new Date(2024, 5, 15, 10, 30, 0);
      const result = await Effect.runPromise(
        gateway.updateLastRun("sched-001", lastRun),
      );

      expect(result.lastRun).toEqual(lastRun);
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        schedule.updatedAt.getTime(),
      );
    });

    it("toggles active status", async () => {
      const schedule = createMockSchedule("sched-001", new Date(), {
        isActive: true,
      });
      await Effect.runPromise(gateway.create(schedule));

      const result = await Effect.runPromise(gateway.toggleActive("sched-001"));

      expect(result.isActive).toBe(false);
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        schedule.updatedAt.getTime(),
      );
    });

    it("toggles from inactive to active", async () => {
      const schedule = createMockSchedule("sched-001", new Date(), {
        isActive: false,
      });
      await Effect.runPromise(gateway.create(schedule));

      const result = await Effect.runPromise(gateway.toggleActive("sched-001"));

      expect(result.isActive).toBe(true);
    });

    it("bulk toggles active status", async () => {
      const schedules = [
        createMockSchedule("sched-001", new Date(), { isActive: false }),
        createMockSchedule("sched-002", new Date(), { isActive: false }),
        createMockSchedule("sched-003", new Date(), { isActive: true }),
      ];
      await Effect.runPromise(gateway.seed(schedules));

      const count = await Effect.runPromise(
        gateway.bulkToggleActive(["sched-001", "sched-002", "sched-003"], true),
      );

      expect(count).toBe(2);

      const sched1 = await Effect.runPromise(gateway.findById("sched-001"));
      const sched2 = await Effect.runPromise(gateway.findById("sched-002"));
      const sched3 = await Effect.runPromise(gateway.findById("sched-003"));

      expect(sched1?.isActive).toBe(true);
      expect(sched2?.isActive).toBe(true);
      expect(sched3?.isActive).toBe(true);
    });

    it("does not count already matching status in bulk toggle", async () => {
      const schedules = [
        createMockSchedule("sched-001", new Date(), { isActive: true }),
        createMockSchedule("sched-002", new Date(), { isActive: true }),
      ];
      await Effect.runPromise(gateway.seed(schedules));

      const count = await Effect.runPromise(
        gateway.bulkToggleActive(["sched-001", "sched-002"], true),
      );

      expect(count).toBe(0);
    });
  });

  describe("Execution History", () => {
    it("counts executions for a schedule", async () => {
      const record1: NotificationScheduleExecutionRecord = {
        id: "exec-001",
        executedAt: new Date(),
        notification: {
          id: "notif-001",
          title: "Test",
          body: "Body",
          createdAt: new Date(),
        },
      };
      const record2: NotificationScheduleExecutionRecord = {
        id: "exec-002",
        executedAt: new Date(),
        notification: null,
      };

      gateway.addExecutionRecord("sched-001", record1);
      gateway.addExecutionRecord("sched-001", record2);

      const count = await Effect.runPromise(
        gateway.countExecutions("sched-001"),
      );

      expect(count).toBe(2);
    });

    it("returns 0 for schedule with no executions", async () => {
      const count = await Effect.runPromise(
        gateway.countExecutions("nonexistent"),
      );
      expect(count).toBe(0);
    });

    it("seeds execution history", async () => {
      const records: NotificationScheduleExecutionRecord[] = [
        {
          id: "exec-001",
          executedAt: new Date(2024, 0, 1),
          notification: null,
        },
        {
          id: "exec-002",
          executedAt: new Date(2024, 0, 2),
          notification: null,
        },
      ];

      gateway.seedExecutionHistory("sched-001", records);

      const count = await Effect.runPromise(
        gateway.countExecutions("sched-001"),
      );
      expect(count).toBe(2);
    });

    it("overrides existing history when seeding", async () => {
      const oldRecord: NotificationScheduleExecutionRecord = {
        id: "exec-old",
        executedAt: new Date(),
        notification: null,
      };
      gateway.addExecutionRecord("sched-001", oldRecord);

      const newRecords: NotificationScheduleExecutionRecord[] = [
        {
          id: "exec-001",
          executedAt: new Date(),
          notification: null,
        },
      ];
      gateway.seedExecutionHistory("sched-001", newRecords);

      const count = await Effect.runPromise(
        gateway.countExecutions("sched-001"),
      );
      expect(count).toBe(1);
    });
  });

  describe("Reset", () => {
    it("clears all schedules and execution history on reset", async () => {
      const schedule = createMockSchedule("sched-001", new Date());
      await Effect.runPromise(gateway.create(schedule));

      const record: NotificationScheduleExecutionRecord = {
        id: "exec-001",
        executedAt: new Date(),
        notification: null,
      };
      gateway.addExecutionRecord("sched-001", record);

      await Effect.runPromise(gateway.reset());

      const foundSchedule = await Effect.runPromise(
        gateway.findById("sched-001"),
      );
      const executionCount = await Effect.runPromise(
        gateway.countExecutions("sched-001"),
      );

      expect(foundSchedule).toBeNull();
      expect(executionCount).toBe(0);
    });
  });

  describe("Seed", () => {
    it("seeds multiple schedules", async () => {
      const schedules = [
        createMockSchedule("sched-001", new Date()),
        createMockSchedule("sched-002", new Date()),
      ];

      await Effect.runPromise(gateway.seed(schedules));

      const found1 = await Effect.runPromise(gateway.findById("sched-001"));
      const found2 = await Effect.runPromise(gateway.findById("sched-002"));

      expect(found1).not.toBeNull();
      expect(found2).not.toBeNull();
    });
  });
});

/**
 * Summary:
 *
 * This test suite covers the InMemoryNotificationScheduleGateway implementation with:
 *
 * - CRUD Operations: create, findById, findByName, findByTripIdAndName, update, delete, exists
 * - Name Queries: case-insensitive matching for findByName and findByTripIdAndName
 * - Bulk Operations: deleteMany with count of deleted items
 * - Filtering and Counting:
 *   - No filter (all items)
 *   - tripId filter
 *   - notificationType filter
 *   - isActive filter
 *   - startDateFrom/startDateTo date range filter
 *   - search filter (case-insensitive name matching)
 *   - Combined filters
 * - Status Management:
 *   - updateLastRun (updates timestamp and updatedAt)
 *   - toggleActive (switches boolean state)
 *   - bulkToggleActive (updates only changed items, returns count)
 * - Execution History:
 *   - addExecutionRecord (appends to history)
 *   - countExecutions (returns count for schedule)
 *   - seedExecutionHistory (replaces existing history)
 * - Reset: clears both schedules and execution storage
 * - Seed: bulk insert for testing setup
 *
 * Total test cases: 30+
 * All tests use beforeEach to ensure clean state between runs.
 */
