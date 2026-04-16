import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer, Data } from "effect";
import { NotificationScheduleController } from "./schedule-controller";
import {
  NotificationScheduleGatewayTag,
  type NotificationScheduleGateway,
  type NotificationScheduleExecutionRecord,
} from "@mirai-app/use-cases";
import {
  NotificationSchedule,
  NotificationScheduleType,
  type PaginatedResult,
  type PaginationOptions,
  type NotificationScheduleFilter,
} from "@mirai-app/domain";

/**
 * Summary
 *
 * Unit tests for NotificationScheduleController
 * Tests comprehensive schedule management operations including:
 * - getAll: List schedules with filtering and pagination
 * - getById: Retrieve single schedule by ID
 * - getActive: Get currently active schedules
 * - getUpcoming: Get schedules starting soon
 * - create: Create new notification schedules
 * - update: Modify existing schedules
 * - delete: Remove single schedule
 * - bulkDelete: Remove multiple schedules
 * - toggleActive: Toggle single schedule active state
 * - bulkToggleActive: Toggle multiple schedules active state
 * - duplicate: Clone existing schedule
 * - updateLastRun: Update last execution timestamp
 * - getExecutionHistory: Retrieve execution history
 *
 * Test coverage includes:
 * - Input validation (valid/invalid inputs, edge cases)
 * - Successful operations
 * - Error handling (not found, database errors, validation failures)
 * - Boundary conditions (empty lists, pagination limits)
 * - Effect Layer mocking patterns
 */

// ============================================================================
// Mock Factories
// ============================================================================

/**
 * Create a mock NotificationSchedule domain entity
 */
function createMockScheduleDomainEntity(
  id: string,
  overrides: Partial<NotificationSchedule> = {},
): NotificationSchedule {
  const futureStart = new Date();
  futureStart.setDate(futureStart.getDate() + 1);
  const futureEnd = new Date(futureStart);
  futureEnd.setDate(futureEnd.getDate() + 7);

  const startDate = overrides.startDate ?? futureStart;
  const endDate = overrides.endDate ?? futureEnd;
  const hour = overrides.hour ?? 10;
  const minute = overrides.minute ?? 0;
  const isActive = overrides.isActive ?? true;

  return {
    id,
    name: overrides.name ?? `Schedule ${id}`,
    tripId: overrides.tripId ?? null,
    notificationType:
      overrides.notificationType ?? NotificationScheduleType.INFO,
    notificationTitle: overrides.notificationTitle ?? null,
    notificationBody: overrides.notificationBody ?? null,
    notificationUrl: overrides.notificationUrl ?? null,
    startDate,
    endDate,
    hour,
    minute,
    isActive,
    createdById: overrides.createdById ?? "admin-123",
    lastRun: overrides.lastRun ?? null,
    createdAt: overrides.createdAt ?? new Date("2024-12-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-12-01"),
    isCurrentlyActive: (now = new Date()) => {
      if (!isActive) return false;
      return now >= startDate && now <= endDate;
    },
    isExpired: (now = new Date()) => now > endDate,
    isUpcoming: (now = new Date()) => now < startDate,
    shouldRunAt: (date: Date) => {
      return date.getUTCHours() === hour && date.getUTCMinutes() === minute;
    },
    getNextRunTime: () => null,
    getDurationMs: () => endDate.getTime() - startDate.getTime(),
    getDurationDays: () =>
      Math.round(
        (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
      ),
    isDailyRanking: () =>
      overrides.notificationType === NotificationScheduleType.DAILY_RANKING,
    isTripSpecific: () => (overrides.tripId ?? null) !== null,
    hasContent: () => false,
    hasUrl: () => false,
    getFormattedTime: () => {
      const h = String(hour).padStart(2, "0");
      const m = String(minute).padStart(2, "0");
      return `${h}:${m}`;
    },
    getSummary: () => `Schedule ${id}`,
    toggleActive: function () {
      return createMockScheduleDomainEntity(id, {
        ...overrides,
        isActive: !isActive,
      });
    },
    updateLastRun: (lastRun: Date) =>
      createMockScheduleDomainEntity(id, { ...overrides, lastRun }),
    duplicate: () =>
      Effect.succeed(createMockScheduleDomainEntity("new-id", overrides)),
    update: () => Effect.succeed(createMockScheduleDomainEntity(id, overrides)),
  } as NotificationSchedule;
}

/**
 * Mock NotificationScheduleGateway for testing
 */
function createMockNotificationScheduleGateway(
  schedules: NotificationSchedule[] = [],
  executions: NotificationScheduleExecutionRecord[] = [],
  options: {
    shouldFailCreate?: boolean;
    shouldFailUpdate?: boolean;
    shouldFailDelete?: boolean;
    shouldFailFindById?: boolean;
  } = {},
): NotificationScheduleGateway {
  const scheduleMap = new Map(schedules.map((s) => [s.id, s]));

  return {
    create: (schedule) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new Data.TaggedError("DatabaseError")<{ cause: unknown }>({
            cause: new Error("Create failed"),
          }),
        );
      }
      scheduleMap.set(schedule.id, schedule);
      return Effect.succeed(schedule);
    },

    findById: (id) => {
      if (options.shouldFailFindById) {
        return Effect.fail(
          new Data.TaggedError("DatabaseError")<{ cause: unknown }>({
            cause: new Error("Find failed"),
          }),
        );
      }
      return Effect.succeed(scheduleMap.get(id) ?? null);
    },

    findByName: (name) => {
      const found = Array.from(scheduleMap.values()).find(
        (s) => s.name === name,
      );
      return Effect.succeed(found ?? null);
    },

    findByTripIdAndName: (tripId, name) => {
      const found = Array.from(scheduleMap.values()).find(
        (s) => s.tripId === tripId && s.name === name,
      );
      return Effect.succeed(found ?? null);
    },

    update: (schedule) => {
      if (options.shouldFailUpdate) {
        return Effect.fail(
          new Data.TaggedError("DatabaseError")<{ cause: unknown }>({
            cause: new Error("Update failed"),
          }),
        );
      }
      scheduleMap.set(schedule.id, schedule);
      return Effect.succeed(schedule);
    },

    delete: (id) => {
      if (options.shouldFailDelete) {
        return Effect.fail(
          new Data.TaggedError("DatabaseError")<{ cause: unknown }>({
            cause: new Error("Delete failed"),
          }),
        );
      }
      scheduleMap.delete(id);
      return Effect.succeed(void 0);
    },

    deleteMany: (ids) => {
      let count = 0;
      for (const id of ids) {
        if (scheduleMap.has(id)) {
          scheduleMap.delete(id);
          count++;
        }
      }
      return Effect.succeed(count);
    },

    exists: (id) => Effect.succeed(scheduleMap.has(id)),

    count: () => Effect.succeed(scheduleMap.size),

    updateLastRun: (id, lastRun) => {
      const schedule = scheduleMap.get(id);
      if (!schedule) {
        return Effect.fail(
          new Data.TaggedError("DatabaseError")<{ cause: unknown }>({
            cause: new Error("Schedule not found"),
          }),
        );
      }
      const updated = schedule.updateLastRun(lastRun);
      scheduleMap.set(id, updated);
      return Effect.succeed(updated);
    },

    toggleActive: (id) => {
      const schedule = scheduleMap.get(id);
      if (!schedule) {
        return Effect.fail(
          new Data.TaggedError("DatabaseError")<{ cause: unknown }>({
            cause: new Error("Schedule not found"),
          }),
        );
      }
      const updated = schedule.toggleActive();
      scheduleMap.set(id, updated);
      return Effect.succeed(updated);
    },

    bulkToggleActive: (ids, isActive) => {
      let count = 0;
      for (const id of ids) {
        const schedule = scheduleMap.get(id);
        if (schedule && schedule.isActive !== isActive) {
          const updated = schedule.toggleActive();
          scheduleMap.set(id, updated);
          count++;
        }
      }
      return Effect.succeed(count);
    },

    countExecutions: () => Effect.succeed(executions.length),

    findAllPaginated: (options?: {
      filter?: NotificationScheduleFilter;
      pagination?: PaginationOptions;
    }) => {
      let results = Array.from(scheduleMap.values());

      if (options?.filter) {
        const filter = options.filter;
        if (filter.tripId !== undefined) {
          results = results.filter((s) => s.tripId === filter.tripId);
        }
        if (filter.notificationType !== undefined) {
          results = results.filter(
            (s) => s.notificationType === filter.notificationType,
          );
        }
        if (filter.isActive !== undefined) {
          results = results.filter((s) => s.isActive === filter.isActive);
        }
        if (filter.search) {
          const search = filter.search.toLowerCase();
          results = results.filter((s) =>
            s.name.toLowerCase().includes(search),
          );
        }
      }

      const limit = options?.pagination?.limit ?? 20;
      const offset = options?.pagination?.offset ?? 0;
      const paginatedResults = results.slice(offset, offset + limit);

      return Effect.succeed({
        items: paginatedResults,
        pagination: {
          total: results.length,
          limit,
          offset,
          hasMore: offset + limit < results.length,
        },
      } as PaginatedResult<NotificationSchedule>);
    },

    findActive: () => {
      const now = new Date();
      const active = Array.from(scheduleMap.values()).filter((s) =>
        s.isCurrentlyActive(now),
      );
      return Effect.succeed(active);
    },

    findUpcoming: (days = 7) => {
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() + days);

      const upcoming = Array.from(scheduleMap.values()).filter((s) => {
        return s.isUpcoming(now) && s.startDate <= cutoff;
      });
      return Effect.succeed(upcoming);
    },

    getExecutionHistory: () => Effect.succeed(executions),
  };
}

// ============================================================================
// NotificationScheduleController Tests
// ============================================================================

describe("[UNIT] NotificationScheduleController", () => {
  let controller: NotificationScheduleController;
  let mockLayer: Layer.Layer<unknown>;

  beforeEach(() => {
    const mockGateway = createMockNotificationScheduleGateway();
    mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    ) as Layer.Layer<unknown>;
    controller = new NotificationScheduleController(mockLayer);
  });

  // ============================================================================
  // getAll Tests
  // ============================================================================

  describe("getAll", () => {
    it("should return paginated schedules with default pagination", async () => {
      const schedules = [
        createMockScheduleDomainEntity("schedule-1", { name: "Schedule 1" }),
        createMockScheduleDomainEntity("schedule-2", { name: "Schedule 2" }),
      ];
      const mockGateway = createMockNotificationScheduleGateway(schedules);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.getAll({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schedules).toHaveLength(2);
        expect(result.data.pagination.total).toBe(2);
        expect(result.data.pagination.limit).toBe(20);
        expect(result.data.pagination.offset).toBe(0);
        expect(result.data.pagination.hasMore).toBe(false);
      }
    });

    it("should apply custom pagination", async () => {
      const schedules = Array.from({ length: 5 }, (_, i) =>
        createMockScheduleDomainEntity(`schedule-${i}`, {
          name: `Schedule ${i}`,
        }),
      );
      const mockGateway = createMockNotificationScheduleGateway(schedules);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.getAll({
        pagination: { limit: 2, offset: 0 },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schedules).toHaveLength(2);
        expect(result.data.pagination.limit).toBe(2);
        expect(result.data.pagination.hasMore).toBe(true);
      }
    });

    it("should filter by tripId", async () => {
      const tripId = "550e8400-e29b-41d4-a716-446655440010";
      const schedules = [
        createMockScheduleDomainEntity("schedule-1", {
          tripId,
          name: "Trip Schedule",
        }),
        createMockScheduleDomainEntity("schedule-2", {
          tripId: null,
          name: "Global Schedule",
        }),
      ];
      const mockGateway = createMockNotificationScheduleGateway(schedules);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.getAll({
        filter: { tripId },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schedules).toHaveLength(1);
        expect(result.data.schedules[0].tripId).toBe(tripId);
      }
    });

    it("should filter by notificationType", async () => {
      const schedules = [
        createMockScheduleDomainEntity("schedule-1", {
          notificationType: NotificationScheduleType.DAILY_RANKING,
        }),
        createMockScheduleDomainEntity("schedule-2", {
          notificationType: NotificationScheduleType.INFO,
        }),
      ];
      const mockGateway = createMockNotificationScheduleGateway(schedules);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.getAll({
        filter: { notificationType: NotificationScheduleType.DAILY_RANKING },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schedules).toHaveLength(1);
        expect(result.data.schedules[0].notificationType).toBe(
          NotificationScheduleType.DAILY_RANKING,
        );
      }
    });

    it("should filter by isActive", async () => {
      const schedules = [
        createMockScheduleDomainEntity("schedule-1", { isActive: true }),
        createMockScheduleDomainEntity("schedule-2", { isActive: false }),
      ];
      const mockGateway = createMockNotificationScheduleGateway(schedules);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.getAll({
        filter: { isActive: true },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schedules).toHaveLength(1);
        expect(result.data.schedules[0].isActive).toBe(true);
      }
    });

    it("should filter by search text", async () => {
      const schedules = [
        createMockScheduleDomainEntity("schedule-1", { name: "Daily Update" }),
        createMockScheduleDomainEntity("schedule-2", { name: "Weekly Report" }),
      ];
      const mockGateway = createMockNotificationScheduleGateway(schedules);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.getAll({
        filter: { search: "Daily" },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schedules).toHaveLength(1);
        expect(result.data.schedules[0].name).toBe("Daily Update");
      }
    });

    it("should return empty list when no schedules match", async () => {
      const mockGateway = createMockNotificationScheduleGateway([]);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.getAll({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schedules).toHaveLength(0);
        expect(result.data.pagination.total).toBe(0);
      }
    });

    it("should return error for invalid limit", async () => {
      const result = await controller.getAll({
        pagination: { limit: 0 },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for negative offset", async () => {
      const result = await controller.getAll({
        pagination: { offset: -1 },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for limit exceeding maximum", async () => {
      const result = await controller.getAll({
        pagination: { limit: 101 },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  // ============================================================================
  // getById Tests
  // ============================================================================

  describe("getById", () => {
    it("should return schedule when found by valid ID", async () => {
      const schedule = createMockScheduleDomainEntity(
        "550e8400-e29b-41d4-a716-446655440001",
        {
          name: "Test Schedule",
        },
      );
      const mockGateway = createMockNotificationScheduleGateway([schedule]);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.getById({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440001");
        expect(result.data.name).toBe("Test Schedule");
      }
    });

    it("should return error when schedule not found", async () => {
      const result = await controller.getById({
        id: "550e8400-e29b-41d4-a716-446655440999",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for invalid UUID format", async () => {
      const result = await controller.getById({ id: "invalid-id" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing id", async () => {
      const result = await controller.getById({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  // ============================================================================
  // getActive Tests
  // ============================================================================

  describe("getActive", () => {
    it("should return currently active schedules", async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const schedules = [
        createMockScheduleDomainEntity("active-1", {
          startDate: yesterday,
          endDate: tomorrow,
          isActive: true,
        }),
        createMockScheduleDomainEntity("inactive-1", {
          startDate: yesterday,
          endDate: tomorrow,
          isActive: false,
        }),
      ];
      const mockGateway = createMockNotificationScheduleGateway(schedules);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.getActive();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe("active-1");
      }
    });

    it("should return empty list when no active schedules", async () => {
      const mockGateway = createMockNotificationScheduleGateway([]);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.getActive();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  // ============================================================================
  // getUpcoming Tests
  // ============================================================================

  describe("getUpcoming", () => {
    it("should return upcoming schedules within default days", async () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const schedules = [
        createMockScheduleDomainEntity("upcoming-1", {
          startDate: tomorrow,
          endDate: nextWeek,
        }),
      ];
      const mockGateway = createMockNotificationScheduleGateway(schedules);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.getUpcoming({ days: 7 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeGreaterThan(0);
      }
    });

    it("should return error for days less than 1", async () => {
      const result = await controller.getUpcoming({ days: 0 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for days greater than 30", async () => {
      const result = await controller.getUpcoming({ days: 31 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should accept valid days within range", async () => {
      const result = await controller.getUpcoming({ days: 15 });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // create Tests
  // ============================================================================

  describe("create", () => {
    it("should create schedule with valid input", async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date(futureStart);
      futureEnd.setDate(futureEnd.getDate() + 7);

      const result = await controller.create({
        name: "New Schedule",
        notificationType: NotificationScheduleType.INFO,
        notificationTitle: "Test Title",
        notificationBody: "Test Body",
        notificationUrl: "https://example.com",
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        hour: 10,
        minute: 30,
        isActive: true,
        createdById: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Schedule");
        expect(result.data.notificationType).toBe(
          NotificationScheduleType.INFO,
        );
        expect(result.data.hour).toBe(10);
        expect(result.data.minute).toBe(30);
      }
    });

    it("should create schedule with minimal input", async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date(futureStart);
      futureEnd.setDate(futureEnd.getDate() + 7);

      // Use INFO type which doesn't require notificationTitle/notificationBody
      const result = await controller.create({
        name: "Minimal Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        hour: 9,
        minute: 0,
        createdById: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Minimal Schedule");
      }
    });

    it("should return error for missing name", async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date(futureStart);
      futureEnd.setDate(futureEnd.getDate() + 7);

      const result = await controller.create({
        notificationType: NotificationScheduleType.INFO,
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        hour: 10,
        minute: 0,
        createdById: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for empty name", async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date(futureStart);
      futureEnd.setDate(futureEnd.getDate() + 7);

      const result = await controller.create({
        name: "",
        notificationType: NotificationScheduleType.INFO,
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        hour: 10,
        minute: 0,
        createdById: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for name exceeding max length", async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date(futureStart);
      futureEnd.setDate(futureEnd.getDate() + 7);

      const result = await controller.create({
        name: "A".repeat(101),
        notificationType: NotificationScheduleType.INFO,
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        hour: 10,
        minute: 0,
        createdById: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for invalid URL", async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date(futureStart);
      futureEnd.setDate(futureEnd.getDate() + 7);

      const result = await controller.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        notificationUrl: "not-a-valid-url",
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        hour: 10,
        minute: 0,
        createdById: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for hour out of range", async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date(futureStart);
      futureEnd.setDate(futureEnd.getDate() + 7);

      const result = await controller.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        hour: 24,
        minute: 0,
        createdById: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for minute out of range", async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date(futureStart);
      futureEnd.setDate(futureEnd.getDate() + 7);

      const result = await controller.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        hour: 10,
        minute: 60,
        createdById: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for missing createdById", async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date(futureStart);
      futureEnd.setDate(futureEnd.getDate() + 7);

      const result = await controller.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        hour: 10,
        minute: 0,
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // update Tests
  // ============================================================================

  describe("update", () => {
    it("should update schedule successfully", async () => {
      const schedule = createMockScheduleDomainEntity(
        "550e8400-e29b-41d4-a716-446655440001",
        {
          name: "Old Name",
        },
      );
      const mockGateway = createMockNotificationScheduleGateway([schedule]);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date(futureStart);
      futureEnd.setDate(futureEnd.getDate() + 7);

      const result = await controller.update({
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "New Name",
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
      });

      expect(result.success).toBe(true);
    });

    it("should return error for invalid schedule ID", async () => {
      const result = await controller.update({
        id: "invalid-id",
        name: "New Name",
      });

      expect(result.success).toBe(false);
    });

    it("should return error when schedule not found", async () => {
      const result = await controller.update({
        id: "550e8400-e29b-41d4-a716-446655440999",
        name: "New Name",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for empty name in update", async () => {
      const result = await controller.update({
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "",
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // delete Tests
  // ============================================================================

  describe("delete", () => {
    it("should delete schedule successfully", async () => {
      const schedule = createMockScheduleDomainEntity(
        "550e8400-e29b-41d4-a716-446655440001",
      );
      const mockGateway = createMockNotificationScheduleGateway([schedule]);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.delete({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
      }
    });

    it("should return error for invalid ID", async () => {
      const result = await controller.delete({ id: "invalid-id" });

      expect(result.success).toBe(false);
    });

    it("should return error when schedule not found", async () => {
      const result = await controller.delete({
        id: "550e8400-e29b-41d4-a716-446655440999",
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // bulkDelete Tests
  // ============================================================================

  describe("bulkDelete", () => {
    it("should delete multiple schedules", async () => {
      const schedules = [
        createMockScheduleDomainEntity("550e8400-e29b-41d4-a716-446655440001"),
        createMockScheduleDomainEntity("550e8400-e29b-41d4-a716-446655440002"),
        createMockScheduleDomainEntity("550e8400-e29b-41d4-a716-446655440003"),
      ];
      const mockGateway = createMockNotificationScheduleGateway(schedules);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.bulkDelete({
        ids: [
          "550e8400-e29b-41d4-a716-446655440001",
          "550e8400-e29b-41d4-a716-446655440002",
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deletedCount).toBe(2);
        expect(result.data.requestedCount).toBe(2);
      }
    });

    it("should handle partial deletion with not found IDs", async () => {
      const schedule = createMockScheduleDomainEntity(
        "550e8400-e29b-41d4-a716-446655440001",
      );
      const mockGateway = createMockNotificationScheduleGateway([schedule]);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.bulkDelete({
        ids: [
          "550e8400-e29b-41d4-a716-446655440001",
          "550e8400-e29b-41d4-a716-446655440999",
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deletedCount).toBe(1);
        expect(result.data.requestedCount).toBe(2);
        expect(result.data.notFoundIds).toContain(
          "550e8400-e29b-41d4-a716-446655440999",
        );
      }
    });

    it("should return error for empty ids array", async () => {
      const result = await controller.bulkDelete({ ids: [] });

      expect(result.success).toBe(false);
    });

    it("should return error for invalid UUID in ids", async () => {
      const result = await controller.bulkDelete({
        ids: ["invalid-id"],
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // toggleActive Tests
  // ============================================================================

  describe("toggleActive", () => {
    it("should toggle schedule active status", async () => {
      const schedule = createMockScheduleDomainEntity(
        "550e8400-e29b-41d4-a716-446655440001",
        {
          isActive: true,
        },
      );
      const mockGateway = createMockNotificationScheduleGateway([schedule]);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.toggleActive({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(true);
    });

    it("should return error for invalid ID", async () => {
      const result = await controller.toggleActive({ id: "invalid-id" });

      expect(result.success).toBe(false);
    });

    it("should return error when schedule not found", async () => {
      const result = await controller.toggleActive({
        id: "550e8400-e29b-41d4-a716-446655440999",
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // bulkToggleActive Tests
  // ============================================================================

  describe("bulkToggleActive", () => {
    it("should toggle active status for multiple schedules", async () => {
      const schedules = [
        createMockScheduleDomainEntity("550e8400-e29b-41d4-a716-446655440001", {
          isActive: true,
        }),
        createMockScheduleDomainEntity("550e8400-e29b-41d4-a716-446655440002", {
          isActive: true,
        }),
      ];
      const mockGateway = createMockNotificationScheduleGateway(schedules);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.bulkToggleActive({
        ids: [
          "550e8400-e29b-41d4-a716-446655440001",
          "550e8400-e29b-41d4-a716-446655440002",
        ],
        isActive: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updatedCount).toBe(2);
      }
    });

    it("should return error for empty ids array", async () => {
      const result = await controller.bulkToggleActive({
        ids: [],
        isActive: false,
      });

      expect(result.success).toBe(false);
    });

    it("should return error for missing isActive", async () => {
      const result = await controller.bulkToggleActive({
        ids: ["550e8400-e29b-41d4-a716-446655440001"],
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // duplicate Tests
  // ============================================================================

  describe("duplicate", () => {
    it("should duplicate schedule successfully", async () => {
      const schedule = createMockScheduleDomainEntity(
        "550e8400-e29b-41d4-a716-446655440001",
        {
          name: "Original Schedule",
        },
      );
      const mockGateway = createMockNotificationScheduleGateway([schedule]);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date(futureStart);
      futureEnd.setDate(futureEnd.getDate() + 7);

      const result = await controller.duplicate({
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Duplicated Schedule",
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        newCreatedById: "550e8400-e29b-41d4-a716-446655440002",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schedule).toBeDefined();
      }
    });

    it("should return error for invalid ID", async () => {
      const result = await controller.duplicate({ id: "invalid-id" });

      expect(result.success).toBe(false);
    });

    it("should return error when schedule not found", async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date(futureStart);
      futureEnd.setDate(futureEnd.getDate() + 7);

      const result = await controller.duplicate({
        id: "550e8400-e29b-41d4-a716-446655440999",
        name: "New Name",
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
        newCreatedById: "550e8400-e29b-41d4-a716-446655440002",
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // updateLastRun Tests
  // ============================================================================

  describe("updateLastRun", () => {
    it("should update last run timestamp", async () => {
      const schedule = createMockScheduleDomainEntity(
        "550e8400-e29b-41d4-a716-446655440001",
      );
      const mockGateway = createMockNotificationScheduleGateway([schedule]);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const now = new Date();

      const result = await controller.updateLastRun({
        id: "550e8400-e29b-41d4-a716-446655440001",
        lastRun: now.toISOString(),
      });

      expect(result.success).toBe(true);
    });

    it("should return error for invalid ID", async () => {
      const result = await controller.updateLastRun({
        id: "invalid-id",
        lastRun: new Date().toISOString(),
      });

      expect(result.success).toBe(false);
    });

    it("should return error for invalid date", async () => {
      const result = await controller.updateLastRun({
        id: "550e8400-e29b-41d4-a716-446655440001",
        lastRun: "invalid-date",
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // getExecutionHistory Tests
  // ============================================================================

  describe("getExecutionHistory", () => {
    it("should return execution history for schedule", async () => {
      const now = new Date();
      const executions: NotificationScheduleExecutionRecord[] = [
        {
          id: "exec-1",
          executedAt: now,
          notification: {
            id: "notif-1",
            title: "Test Notification",
            body: "Test Body",
            createdAt: now,
          },
        },
      ];
      const schedule = createMockScheduleDomainEntity(
        "550e8400-e29b-41d4-a716-446655440001",
      );
      const mockGateway = createMockNotificationScheduleGateway(
        [schedule],
        executions,
      );
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.getExecutionHistory({
        scheduleId: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.executions).toHaveLength(1);
        expect(result.data.executions[0].notification?.title).toBe(
          "Test Notification",
        );
      }
    });

    it("should return error for invalid scheduleId", async () => {
      const result = await controller.getExecutionHistory({
        scheduleId: "invalid-id",
      });

      expect(result.success).toBe(false);
    });

    it("should accept custom limit", async () => {
      const schedule = createMockScheduleDomainEntity(
        "550e8400-e29b-41d4-a716-446655440001",
      );
      const mockGateway = createMockNotificationScheduleGateway([schedule], []);
      mockLayer = Layer.succeed(
        NotificationScheduleGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new NotificationScheduleController(mockLayer);

      const result = await controller.getExecutionHistory({
        scheduleId: "550e8400-e29b-41d4-a716-446655440001",
        limit: 50,
      });

      expect(result.success).toBe(true);
    });

    it("should return error for limit exceeding maximum", async () => {
      const result = await controller.getExecutionHistory({
        scheduleId: "550e8400-e29b-41d4-a716-446655440001",
        limit: 101,
      });

      expect(result.success).toBe(false);
    });
  });
});
