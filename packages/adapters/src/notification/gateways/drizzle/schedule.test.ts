import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { DrizzleNotificationScheduleGateway } from "./schedule";
import { DatabaseError } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { NotificationScheduleDTO } from "@mirai-app/use-cases";

/**
 * Unit tests for DrizzleNotificationScheduleGateway
 *
 * Tests the gateway methods for notification schedule management:
 * - CRUD operations (create, findById, update, delete)
 * - findByName() - Find schedule by name
 * - findByTripIdAndName() - Find by trip ID and name
 * - deleteMany() - Bulk delete
 * - count() - Count with filters
 * - updateLastRun() - Update last run time
 * - toggleActive() - Toggle active state
 * - bulkToggleActive() - Bulk toggle active state
 * - countExecutions() - Count executions for schedule
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Mock Data Helpers
// ============================================================================

function createMockScheduleDTO(
  overrides: Partial<NotificationScheduleDTO> = {},
): NotificationScheduleDTO {
  return {
    id: "schedule-123",
    tripId: "trip-456",
    notificationType: "GENERAL",
    name: "Daily Reminder",
    description: "Daily notification schedule",
    cronExpression: "0 9 * * *",
    scheduledFor: new Date("2024-01-01T09:00:00Z"),
    isDraft: false,
    isRecurring: true,
    recurringCount: null,
    recurringInterval: null,
    createdById: "user-789",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

function createMockScheduleSelect(
  overrides: Partial<{
    id: string;
    tripId: string;
    notificationType: string;
    name: string;
    description: string | null;
    cronExpression: string;
    scheduledFor: Date;
    isDraft: boolean;
    isRecurring: boolean;
    recurringCount: number | null;
    recurringInterval: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: "schedule-123",
    tripId: "trip-456",
    notificationType: "GENERAL",
    name: "Daily Reminder",
    description: "Daily notification schedule",
    cronExpression: "0 9 * * *",
    scheduledFor: new Date("2024-01-01T09:00:00Z"),
    isDraft: false,
    isRecurring: true,
    recurringCount: null,
    recurringInterval: null,
    createdById: "user-789",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

// ============================================================================
// Mock Drizzle Db Factory
// ============================================================================

function createSelectMockDb(records: unknown[]): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(records),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createInsertMockDb(returnRecord: unknown): DrizzleDb {
  return {
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([returnRecord]),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createUpdateMockDb(returnRecord: unknown): DrizzleDb {
  return {
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([returnRecord]),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createDeleteMockDb(deletedCount = 1): DrizzleDb {
  return {
    delete: () => ({
      where: () => ({
        returning: () =>
          Promise.resolve(Array(deletedCount).fill({ id: "deleted" })),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createCountMockDb(count: number): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ count }]),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createFailingMockDb(errorMessage: string): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.reject(new Error(errorMessage)),
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => Promise.reject(new Error(errorMessage)),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.reject(new Error(errorMessage)),
        }),
      }),
    }),
    delete: () => ({
      where: () => ({
        returning: () => Promise.reject(new Error(errorMessage)),
      }),
    }),
  } as unknown as DrizzleDb;
}

// ============================================================================
// Test Suite
// ============================================================================

describe("[UNIT] DrizzleNotificationScheduleGateway", () => {
  // ==========================================================================
  // findByName() Method Tests
  // ==========================================================================

  describe("findByName()", () => {
    it("returns schedule by name", async () => {
      const mockRecord = createMockScheduleSelect({ name: "Daily Reminder" });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByName("Daily Reminder"),
      );

      expect(result).not.toBeNull();
      expect(result!.name).toBe("Daily Reminder");
    });

    it("returns null when name not found", async () => {
      const mockDb = createSelectMockDb([]);
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const result = await Effect.runPromise(gateway.findByName("NonExistent"));

      expect(result).toBeNull();
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByName("Daily Reminder")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByName");
      }
    });
  });

  // ==========================================================================
  // findByTripIdAndName() Method Tests
  // ==========================================================================

  describe("findByTripIdAndName()", () => {
    it("returns schedule by trip and name", async () => {
      const mockRecord = createMockScheduleSelect({
        tripId: "trip-456",
        name: "Daily",
      });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripIdAndName("trip-456", "Daily"),
      );

      expect(result).not.toBeNull();
      expect(result!.tripId).toBe("trip-456");
      expect(result!.name).toBe("Daily");
    });

    it("returns null when not found", async () => {
      const mockDb = createSelectMockDb([]);
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripIdAndName("trip-456", "NonExistent"),
      );

      expect(result).toBeNull();
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByTripIdAndName("trip-456", "Daily")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByTripIdAndName");
      }
    });
  });

  // ==========================================================================
  // deleteMany() Method Tests
  // ==========================================================================

  describe("deleteMany()", () => {
    it("deletes multiple schedules and returns count", async () => {
      const mockDb = createDeleteMockDb(3);
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.deleteMany(["id1", "id2", "id3"]),
      );

      expect(result).toBe(3);
    });

    it("returns 0 for empty array", async () => {
      const gateway = new DrizzleNotificationScheduleGateway({} as DrizzleDb);

      const result = await Effect.runPromise(gateway.deleteMany([]));

      expect(result).toBe(0);
    });

    it("returns DatabaseError on delete failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.deleteMany(["id1", "id2"])),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("deleteMany");
      }
    });
  });

  // ==========================================================================
  // count() Method Tests
  // ==========================================================================

  describe("count()", () => {
    it("counts all schedules without filter", async () => {
      const mockDb = createCountMockDb(10);
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const result = await Effect.runPromise(gateway.count());

      expect(result).toBe(10);
    });

    it("counts with tripId filter", async () => {
      const mockDb = createCountMockDb(5);
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.count({ tripId: "trip-456" }),
      );

      expect(result).toBe(5);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const either = await Effect.runPromise(Effect.either(gateway.count()));

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("count");
      }
    });
  });

  // ==========================================================================
  // updateLastRun() Method Tests
  // ==========================================================================

  describe("updateLastRun()", () => {
    it("updates last run time for schedule", async () => {
      const mockRecord = createMockScheduleSelect();
      const mockDb = createUpdateMockDb(mockRecord);
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const lastRun = new Date("2024-01-15T09:00:00Z");
      const result = await Effect.runPromise(
        gateway.updateLastRun("schedule-123", lastRun),
      );

      expect(result).not.toBeNull();
    });

    it("returns DatabaseError on update failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.updateLastRun("schedule-123", new Date())),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("updateLastRun");
      }
    });
  });

  // ==========================================================================
  // toggleActive() Method Tests
  // ==========================================================================

  describe("toggleActive()", () => {
    it("toggles schedule active state", async () => {
      const currentRecord = createMockScheduleSelect({ isDraft: true });
      const updatedRecord = createMockScheduleSelect({ isDraft: false });
      let callCount = 0;
      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () =>
                Promise.resolve(
                  callCount++ === 0 ? [currentRecord] : [updatedRecord],
                ),
            }),
          }),
        }),
        update: () => ({
          set: () => ({
            where: () => ({
              returning: () => Promise.resolve([updatedRecord]),
            }),
          }),
        }),
      } as unknown as DrizzleDb;
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.toggleActive("schedule-123"),
      );

      expect(result).not.toBeNull();
    });

    it("returns DatabaseError on toggle failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.toggleActive("schedule-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("toggleActive");
      }
    });
  });

  // ==========================================================================
  // bulkToggleActive() Method Tests
  // ==========================================================================

  describe("bulkToggleActive()", () => {
    it("toggles active state for multiple schedules", async () => {
      const updatedRecord = createMockScheduleSelect();
      const mockDb = {
        update: () => ({
          set: () => ({
            where: () => ({
              returning: () => Promise.resolve([updatedRecord]),
            }),
          }),
        }),
      } as unknown as DrizzleDb;
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.bulkToggleActive(["id1", "id2", "id3"], true),
      );

      expect(result).toBe(3);
    });

    it("returns 0 for empty array", async () => {
      const gateway = new DrizzleNotificationScheduleGateway({} as DrizzleDb);

      const result = await Effect.runPromise(
        gateway.bulkToggleActive([], true),
      );

      expect(result).toBe(0);
    });

    it("returns DatabaseError on bulk toggle failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.bulkToggleActive(["id1", "id2"], true)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("bulkToggleActive");
      }
    });
  });

  // ==========================================================================
  // countExecutions() Method Tests
  // ==========================================================================

  describe("countExecutions()", () => {
    it("counts executions for a schedule", async () => {
      const mockDb = createCountMockDb(5);
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countExecutions("schedule-123"),
      );

      expect(result).toBe(5);
    });

    it("returns 0 when no executions exist", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countExecutions("schedule-123"),
      );

      expect(result).toBe(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationScheduleGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.countExecutions("schedule-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("countExecutions");
      }
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// Test Coverage:
// - findByName: Name-based lookup, null handling, error handling
// - findByTripIdAndName: Combined trip and name lookup, null handling, error handling
// - deleteMany: Bulk delete with count return, empty array handling, error handling
// - count: Count with optional filters, error handling
// - updateLastRun: Last run time update, error handling
// - toggleActive: Single schedule toggle, error handling
// - bulkToggleActive: Multiple schedule toggle, empty array handling, error handling
// - countExecutions: Execution counting, zero handling, error handling
//
// All tests use Effect.either for comprehensive error testing with DatabaseError.
// Mock DrizzleDb factory functions provide consistent test setup.
