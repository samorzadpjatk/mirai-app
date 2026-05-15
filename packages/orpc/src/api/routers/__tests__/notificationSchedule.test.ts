import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORPCError } from "@orpc/server";
import { notificationScheduleRouter } from "../../routers/notificationSchedule";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { DB, User, NotificationSchedule, Trip } from "@mirai-app/db";

// Mock the authEmails utilities
vi.mock("../../../utils/authEmails", () => ({
  buildAuthEmailLookup: vi.fn().mockResolvedValue(new Map([["auth-123", "test@example.com"]])),
  resolveAuthEmail: vi.fn().mockReturnValue("test@example.com"),
}));

// Mock the validation utilities
vi.mock("../../../utils/notificactionSchedule-validation", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../utils/notificactionSchedule-validation")>();
  return {
    ...actual,
    validateDateRange: vi.fn(),
    validateFutureDates: vi.fn(),
    validateScheduleTime: vi.fn(),
    validateMinimumDuration: vi.fn(),
    validateNotificationContent: vi.fn(),
    validateReasonableDateRange: vi.fn(),
  };
});

// Mock the notification templates
vi.mock("../../../utils/notificationTemplates", () => ({
  getDailyRankingScheduleTemplate: vi.fn().mockReturnValue({
    name: "Daily Ranking",
    notificationType: "ranking",
    notificationTitle: "Ranking Update",
    notificationBody: "Check your ranking!",
    notificationUrl: "/ranking",
    hour: 9,
    minute: 0,
  }),
}));

// Mock @mirai-app/auth
vi.mock("@mirai-app/auth", () => ({
  requireModerator: vi.fn().mockResolvedValue({
    id: "moderator-123",
    authUserId: "auth-123",
    email: "moderator@example.com",
    firstName: "Test",
    lastName: "Moderator",
    hasAvatar: false,
    wristNumber: null,
    houseNumber: null,
    role: "MODERATOR",
    groupId: null,
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  requireAdmin: vi.fn().mockResolvedValue({
    id: "admin-123",
    authUserId: "auth-123",
    email: "admin@example.com",
    firstName: "Test",
    lastName: "Admin",
    hasAvatar: false,
    wristNumber: null,
    houseNumber: null,
    role: "ADMIN",
    groupId: null,
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
}));

const createCaller = (ctx: TRPCContext) =>
  createRouterClient(notificationScheduleRouter, { context: ctx });

// Helper to create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "moderator-123",
  authUserId: "auth-123",
  firstName: "Test",
  lastName: "Moderator",
  role: "MODERATOR",
  hasAvatar: false,
  lastSeenOn: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock schedule
const createMockSchedule = (
  overrides: Partial<NotificationSchedule> = {},
): NotificationSchedule => ({
  id: "schedule-123",
  name: "Test Schedule",
  tripId: "trip-123",
  notificationType: "custom",
  notificationTitle: "Test Title",
  notificationBody: "Test Body",
  notificationUrl: "/test",
  startDate: new Date("2024-12-01"),
  endDate: new Date("2024-12-31"),
  hour: 9,
  minute: 0,
  isActive: true,
  lastRun: null,
  createdById: "moderator-123",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock trip
const createMockTrip = (overrides: Partial<Trip> = {}): Trip => ({
  id: "trip-123",
  name: "Test Trip",
  description: "A test trip",
  startDate: new Date(),
  endDate: new Date(),
  isActive: true,
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("notificationScheduleRouter", () => {
  let mockDb: DB;
  let mockSupabase: SupabaseClient;
  let mockModeratorUser: User;
  let mockAdminUser: User;

  beforeEach(() => {
    vi.clearAllMocks();

    mockModeratorUser = createMockUser({
      id: "moderator-123",
      authUserId: "auth-123",
      role: "MODERATOR",
    });
    mockAdminUser = createMockUser({ id: "admin-123", authUserId: "auth-123", role: "ADMIN" });

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "moderator-123" } }, error: null }),
        getSession: vi.fn(),
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { id: "auth-123", email: "test@example.com" } },
            error: null,
          }),
        },
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    } satisfies SupabaseClient;

    // Setup mock database client
    mockDb = {
      user: {
        findUnique: vi.fn().mockResolvedValue(mockModeratorUser),
      },
      notificationSchedule: {
        findMany: vi.fn().mockResolvedValue([createMockSchedule()]),
        findUnique: vi.fn().mockResolvedValue(createMockSchedule()),
        count: vi.fn().mockResolvedValue(1),
        create: vi.fn().mockResolvedValue(createMockSchedule()),
        update: vi.fn().mockResolvedValue(createMockSchedule()),
        delete: vi.fn().mockResolvedValue(createMockSchedule()),
      },
      notificationScheduleExecution: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
      trip: {
        findUnique: vi.fn().mockResolvedValue(createMockTrip()),
      },
    };

    const lastResults: Record<string, unknown> = {};

    function toCamelCase(str: string): string {
      return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    function getModelName(table: unknown): string {
      let name: string | undefined;
      if (typeof table === "string") {
        name = table;
      } else if (table && typeof table === "object") {
        const obj = table as Record<string | symbol, unknown>;
        if (typeof obj.name === "string") {
          name = obj.name;
        } else {
          const drizzleNameSym = Symbol.for("drizzle:Name");
          if (typeof obj[drizzleNameSym] === "string") {
            name = obj[drizzleNameSym];
          } else {
            const sym = Object.getOwnPropertySymbols(obj).find(
              (s) => s.description === "drizzle:Name",
            );
            if (sym && typeof obj[sym] === "string") {
              name = obj[sym];
            }
          }
        }
      }
      if (!name) return "unknown";
      const singular = name.replace(/ies$/, "y").replace(/s$/, "");
      return toCamelCase(singular);
    }

    const db = mockDb as Record<string, unknown>;

    db.query = new Proxy(
      {},
      {
        get(_, tableName) {
          const name = String(tableName);
          const singular = name.replace(/ies$/, "y").replace(/s$/, "");
          const model = db[singular] ?? db[name];
          if (model && typeof model === "object") {
            const modelObj = model as Record<string, (...args: unknown[]) => Promise<unknown>>;
            return new Proxy(modelObj, {
              get(_, methodName) {
                const method = String(methodName);
                if (method === "findFirst" || method === "findUnique") {
                  return async (...args: unknown[]) => {
                    if (modelObj[method]) {
                      const result = await modelObj[method](...args);
                      if (result !== null && result !== undefined) {
                        return result;
                      }
                      const otherMethod = method === "findFirst" ? "findUnique" : "findFirst";
                      if (modelObj[otherMethod]) {
                        const fb = await modelObj[otherMethod](...args);
                        if (fb !== null && fb !== undefined) {
                          return fb;
                        }
                      }
                      return lastResults[singular] ?? null;
                    }
                    const otherMethod = method === "findFirst" ? "findUnique" : "findFirst";
                    if (modelObj[otherMethod]) {
                      const fb = await modelObj[otherMethod](...args);
                      if (fb !== null && fb !== undefined) {
                        return fb;
                      }
                    }
                    return lastResults[singular] ?? null;
                  };
                }
                return modelObj[method];
              },
            });
          }
          return {
            findFirst: vi.fn(() => Promise.resolve(null)),
            findUnique: vi.fn(() => Promise.resolve(null)),
            findMany: vi.fn(() => Promise.resolve([])),
          };
        },
      },
    );

    db.insert = vi.fn((table: unknown) => {
      const modelName = getModelName(table);
      return {
        values: vi.fn((data: unknown) => {
          const returningFn = () => {
            const model = db[modelName];
            if (model && typeof model === "object" && "create" in model) {
              return (model as Record<string, unknown>).create({ data }).then((result: unknown) => {
                if (result != null) lastResults[modelName] = result;
                return Array.isArray(result) ? result : [result];
              });
            }
            return Promise.resolve([{}]);
          };
          return {
            returning: returningFn,
            onConflictDoNothing: returningFn,
            onConflictDoUpdate: (_opts: unknown) => ({
              returning: () => {
                const model = db[modelName];
                if (model && typeof model === "object" && "upsert" in model) {
                  return (model as Record<string, unknown>)
                    .upsert({ data })
                    .then((result: unknown) => {
                      if (result != null) lastResults[modelName] = result;
                      return [result];
                    });
                }
                return Promise.resolve([{}]);
              },
              then: (
                resolve: (value: unknown) => unknown,
                reject?: (reason: unknown) => unknown,
              ) => {
                const model = db[modelName];
                if (model && typeof model === "object" && "upsert" in model) {
                  return (model as Record<string, unknown>)
                    .upsert({ data })
                    .then((result: unknown) => {
                      if (result != null) lastResults[modelName] = result;
                      return resolve([result]);
                    }, reject);
                }
                return resolve([{}]);
              },
            }),
            then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
              returningFn().then(resolve, reject),
          };
        }),
      };
    });

    db.update = vi.fn((table: unknown) => {
      const modelName = getModelName(table);
      return {
        set: vi.fn((data: unknown) => {
          const execute = () => {
            const model = db[modelName];
            if (model && typeof model === "object" && "update" in model) {
              return (model as Record<string, unknown>).update({ data }).then((result: unknown) => {
                if (result != null) lastResults[modelName] = result;
                return Array.isArray(result) ? result : [result];
              });
            }
            return Promise.resolve([{}]);
          };
          return {
            where: vi.fn(() => ({
              returning: execute,
              then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
                execute().then(resolve, reject),
            })),
            then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
              execute().then(resolve, reject),
          };
        }),
      };
    });

    db.delete = vi.fn((table: unknown) => {
      const modelName = getModelName(table);
      return {
        where: vi.fn(() => {
          const execute = () => {
            const model = db[modelName];
            if (model && typeof model === "object" && "delete" in model) {
              return (model as Record<string, unknown>).delete().then((result: unknown) => {
                if (result != null) lastResults[modelName] = result;
                return Array.isArray(result) ? result : [result];
              });
            }
            return Promise.resolve([{}]);
          };
          return {
            returning: execute,
            then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
              execute().then(resolve, reject),
          };
        }),
      };
    });

    db.select = vi.fn((fields?: unknown) => {
      let primaryTable: string | undefined;
      let hasGroupBy = false;
      const fieldNames = fields && typeof fields === "object" ? Object.keys(fields) : [];
      const hasCountOnly = fieldNames.length === 1 && fieldNames[0] === "count";
      const hasAggregateFields = fieldNames.some((f) =>
        ["count", "sum", "avg", "min", "max"].includes(f),
      );
      const chainable: any = {
        from: (table: unknown) => {
          primaryTable = getModelName(table);
          return chainable;
        },
        innerJoin: () => chainable,
        leftJoin: () => chainable,
        where: () => chainable,
        orderBy: () => chainable,
        limit: () => chainable,
        offset: () => chainable,
        groupBy: () => {
          hasGroupBy = true;
          return chainable;
        },
        having: () => chainable,
        then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
          if (primaryTable) {
            const model = db[primaryTable];
            if (model && typeof model === "object") {
              if (hasGroupBy && "groupBy" in model) {
                return (model as Record<string, unknown>).groupBy().then((groups: unknown) => {
                  const mapped = (groups as Record<string, unknown>[]).map((row) => {
                    const item: Record<string, unknown> = {};
                    for (const field of fieldNames) {
                      if (field in row) {
                        item[field] = row[field];
                      } else if (
                        field === "count" &&
                        (row as Record<string, Record<string, unknown>>)._count
                      ) {
                        item.count =
                          (row as Record<string, Record<string, unknown>>)._count.id ??
                          (row as Record<string, Record<string, unknown>>)._count._all ??
                          0;
                      }
                    }
                    return item;
                  });
                  return resolve(mapped);
                }, reject);
              }
              if (hasCountOnly && "count" in model) {
                return (model as Record<string, unknown>)
                  .count()
                  .then((count: unknown) => resolve([{ count }]), reject);
              }
              if (hasAggregateFields && "aggregate" in model) {
                return (model as Record<string, unknown>).aggregate().then((aggResult: unknown) => {
                  const mapped: Record<string, unknown> = {};
                  const agg = aggResult as Record<string, Record<string, unknown>>;
                  for (const field of fieldNames) {
                    if (field === "count" && agg._count) {
                      mapped.count = agg._count.id ?? agg._count._all ?? 0;
                    } else if (agg._sum && field in agg._sum) {
                      mapped[field] = agg._sum[field];
                    } else if (agg._avg && field in agg._avg) {
                      mapped[field] = agg._avg[field];
                    }
                  }
                  return resolve([mapped]);
                }, reject);
              }
              if ("findMany" in model) {
                return (model as Record<string, unknown>)
                  .findMany()
                  .then((results: unknown) => resolve(results), reject);
              }
              if ("count" in model) {
                return (model as Record<string, unknown>)
                  .count()
                  .then((count: unknown) => resolve([{ count }]), reject);
              }
              if ("aggregate" in model) {
                return (model as Record<string, unknown>)
                  .aggregate()
                  .then((agg: unknown) => resolve([agg]), reject);
              }
            }
          }
          return resolve([]);
        },
      };
      return chainable;
    });

    db.transaction = vi.fn(async (callback: unknown) => {
      if (typeof callback === "function") {
        return await (callback as (db: typeof db) => unknown)(db);
      }
      return Promise.all(callback as unknown[]);
    });

    db.$transaction = vi.fn(async (callback: unknown) => {
      if (typeof callback === "function") {
        return await (callback as (db: typeof db) => unknown)(db);
      }
      return Promise.all(callback as unknown[]);
    });

    mockDb = db as unknown as DB;
  });

  // Helper to create authenticated context
  const createAuthContext = (user: User, token = "test-token"): TRPCContext => ({
    db: mockDb,
    supabase: mockSupabase,
    headers: new Headers({ Authorization: `Bearer ${token}` }),
    accessToken: token,
    user: { id: user.authUserId || "auth-123" },
    dbUser: user,
  });

  describe("getAll", () => {
    it("should get all schedules with pagination", async () => {
      const schedules = [
        createMockSchedule({ id: "schedule-1" }),
        createMockSchedule({ id: "schedule-2" }),
      ];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        schedules,
      );
      (mockDb.notificationSchedule.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.schedules).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });

    it("should filter schedules by tripId", async () => {
      const schedules = [createMockSchedule({ id: "schedule-1", tripId: "trip-123" })];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        schedules,
      );
      (mockDb.notificationSchedule.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({
        filter: { tripId: "trip-123" },
      });

      expect(result.schedules).toHaveLength(1);
    });

    it("should filter schedules by notification type", async () => {
      const schedules = [createMockSchedule({ id: "schedule-1", notificationType: "ranking" })];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        schedules,
      );
      (mockDb.notificationSchedule.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({
        filter: { notificationType: "ranking" },
      });

      expect(result.schedules).toHaveLength(1);
    });

    it("should filter schedules by active status", async () => {
      const schedules = [createMockSchedule({ id: "schedule-1", isActive: true })];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        schedules,
      );
      (mockDb.notificationSchedule.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({
        filter: { isActive: true },
      });

      expect(result.schedules).toHaveLength(1);
    });

    it("should search schedules by name", async () => {
      const schedules = [createMockSchedule({ id: "schedule-1", name: "Daily Update" })];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        schedules,
      );
      (mockDb.notificationSchedule.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({
        filter: { search: "daily" },
      });

      expect(result.schedules).toHaveLength(1);
    });
  });

  describe("getActiveSchedules", () => {
    it("should get currently active schedules", async () => {
      const schedules = [
        createMockSchedule({ id: "schedule-1", isActive: true }),
        createMockSchedule({ id: "schedule-2", isActive: true }),
      ];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        schedules,
      );

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getActiveSchedules();

      expect(result).toHaveLength(2);
    });

    it("should order schedules by hour and minute", async () => {
      const schedules = [
        createMockSchedule({ id: "schedule-1", hour: 8, minute: 0 }),
        createMockSchedule({ id: "schedule-2", hour: 9, minute: 30 }),
      ];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        schedules,
      );

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.getActiveSchedules();
    });
  });

  describe("getUpcoming", () => {
    it("should get upcoming schedules for default 7 days", async () => {
      const schedules = [createMockSchedule({ id: "schedule-1" })];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        schedules,
      );

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getUpcoming();

      expect(result).toHaveLength(1);
    });

    it("should get upcoming schedules for custom days", async () => {
      const schedules = [createMockSchedule({ id: "schedule-1" })];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        schedules,
      );

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getUpcoming({ days: 14 });

      expect(result).toHaveLength(1);
    });
  });

  describe("getById", () => {
    it("should get schedule by id with creator email", async () => {
      const schedule = createMockSchedule({
        id: "schedule-123",
        createdBy: {
          id: "moderator-123",
          firstName: "Test",
          lastName: "Moderator",
          authUserId: "auth-123",
        },
      });

      (mockDb.notificationSchedule as any).findFirst = vi.fn().mockResolvedValue(schedule);
      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        schedule,
      );

      const { buildAuthEmailLookup, resolveAuthEmail } = await import("../../../utils/authEmails");

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getById({ id: "schedule-123" });

      expect(result.id).toBe("schedule-123");
      expect(buildAuthEmailLookup).toHaveBeenCalled();
      expect(resolveAuthEmail).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when schedule does not exist", async () => {
      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(caller.getById({ id: "non-existent" })).rejects.toThrow(ORPCError);
    });
  });

  describe("getExecutionHistory", () => {
    it("should get execution history for a schedule", async () => {
      const executions = [
        {
          id: "execution-1",
          scheduleId: "schedule-123",
          executedAt: new Date(),
          notification: {
            id: "notification-1",
            title: "Test",
            body: "Test body",
            createdAt: new Date(),
          },
        },
      ];

      (mockDb.notificationScheduleExecution.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        executions,
      );

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getExecutionHistory({
        scheduleId: "schedule-123",
        limit: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].scheduleId).toBe("schedule-123");
    });
  });

  describe("create", () => {
    it("should create a new schedule successfully", async () => {
      const newSchedule = createMockSchedule({
        id: "new-schedule",
        name: "New Schedule",
      });

      (mockDb.notificationSchedule.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        newSchedule,
      );
      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        newSchedule,
      );

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const result = await caller.create({
        name: "New Schedule",
        tripId: "trip-123",
        notificationType: "custom",
        notificationTitle: "Test Title",
        notificationBody: "Test Body",
        notificationUrl: "/test",
        startDate: futureDate,
        endDate: endDate,
        hour: 9,
        minute: 0,
        isActive: true,
      });

      expect(result.id).toBe("new-schedule");
      expect(mockDb.notificationSchedule.create).toHaveBeenCalled();
    });

    it("should validate notification content for custom type", async () => {
      const { validateNotificationContent } =
        await import("../../../utils/notificactionSchedule-validation");

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      await caller.create({
        name: "New Schedule",
        notificationType: "custom",
        notificationTitle: "Test Title",
        notificationBody: "Test Body",
        startDate: futureDate,
        endDate: endDate,
        hour: 9,
        minute: 0,
        isActive: true,
      });

      expect(validateNotificationContent).toHaveBeenCalled();
    });
  });

  describe("upsertTemplate", () => {
    it("should create new template schedule", async () => {
      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (mockDb.notificationSchedule.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockSchedule({ id: "template-schedule", name: "Daily Ranking" }),
      );

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.upsertTemplate({
        tripId: "trip-123",
        templateKey: "daily_morning",
      });

      expect(result.action).toBe("created");
      expect(result.schedule.id).toBe("template-schedule");
    });

    it("should update existing template schedule", async () => {
      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockSchedule({ id: "existing-schedule", name: "Daily Ranking" }),
      );
      (mockDb.notificationSchedule.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockSchedule({ id: "existing-schedule", name: "Daily Ranking" }),
      );

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.upsertTemplate({
        tripId: "trip-123",
        templateKey: "daily_morning",
      });

      expect(result.action).toBe("updated");
    });

    it("should throw NOT_FOUND when trip does not exist", async () => {
      (mockDb.trip.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(
        caller.upsertTemplate({
          tripId: "non-existent",
          templateKey: "daily_morning",
        }),
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("update", () => {
    it("should update schedule successfully", async () => {
      const existingSchedule = createMockSchedule({ id: "schedule-123" });
      const updatedSchedule = createMockSchedule({
        id: "schedule-123",
        name: "Updated Name",
      });

      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        existingSchedule,
      );
      (mockDb.notificationSchedule.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        updatedSchedule,
      );

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.update({
        id: "schedule-123",
        name: "Updated Name",
      });

      expect(result.id).toBe("schedule-123");

      expect(mockDb.notificationSchedule.update).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when schedule does not exist", async () => {
      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(
        caller.update({
          id: "non-existent",
          name: "Updated Name",
        }),
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("delete", () => {
    it("should delete schedule successfully", async () => {
      const schedule = createMockSchedule({
        id: "schedule-123",
        name: "To Delete",
        _count: {
          notificationExecutions: 5,
        },
      });

      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        schedule,
      );
      (mockDb.notificationSchedule.delete as ReturnType<typeof vi.fn>).mockResolvedValue(schedule);
      (mockDb.notificationScheduleExecution.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.delete({ id: "schedule-123" });

      expect(result.success).toBe(true);
      expect(result.message).toContain("To Delete");
      expect(result.message).toContain("5 execution records");
    });

    it("should throw NOT_FOUND when schedule does not exist", async () => {
      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(caller.delete({ id: "non-existent" })).rejects.toThrow(ORPCError);
    });
  });

  describe("bulkDelete", () => {
    it("should delete multiple schedules", async () => {
      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: "schedule-1" },
        { id: "schedule-2" },
      ]);
      (mockDb.notificationSchedule.delete as ReturnType<typeof vi.fn>).mockResolvedValue([
        createMockSchedule({ id: "schedule-1" }),
        createMockSchedule({ id: "schedule-2" }),
      ]);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.bulkDelete({
        ids: ["schedule-1", "schedule-2", "schedule-3"],
      });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
      expect(result.requestedCount).toBe(3);
      expect(result.notFoundIds).toEqual(["schedule-3"]);
    });
  });

  describe("duplicate", () => {
    it("should duplicate a schedule", async () => {
      const originalSchedule = createMockSchedule({
        id: "original-123",
        name: "Original Schedule",
        tripId: "trip-123",
        hour: 10,
        minute: 30,
      });

      const duplicatedSchedule = createMockSchedule({
        id: "new-123",
        name: "Original Schedule (Copy)",
        tripId: "trip-123",
        isActive: false,
      });

      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(originalSchedule)
        .mockResolvedValueOnce(duplicatedSchedule);
      (mockDb.notificationSchedule.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        duplicatedSchedule,
      );

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.duplicate({
        id: "original-123",
      });

      expect(result.id).toBe("new-123");
      expect(result.name).toBe("Original Schedule (Copy)");
      expect(result.isActive).toBe(false);
    });

    it("should throw NOT_FOUND when original schedule does not exist", async () => {
      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(caller.duplicate({ id: "non-existent" })).rejects.toThrow(ORPCError);
    });
  });

  describe("toggleActive", () => {
    it("should toggle schedule active status to inactive", async () => {
      const schedule = createMockSchedule({ id: "schedule-123", isActive: true });
      const toggledSchedule = createMockSchedule({ id: "schedule-123", isActive: false });

      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(schedule)
        .mockResolvedValueOnce(toggledSchedule);
      (mockDb.notificationSchedule.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        toggledSchedule,
      );

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.toggleActive({ id: "schedule-123" });

      expect(result.isActive).toBe(false);
    });

    it("should toggle schedule active status to active", async () => {
      const schedule = createMockSchedule({ id: "schedule-123", isActive: false });
      const toggledSchedule = createMockSchedule({ id: "schedule-123", isActive: true });

      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(schedule)
        .mockResolvedValueOnce(toggledSchedule);
      (mockDb.notificationSchedule.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        toggledSchedule,
      );

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.toggleActive({ id: "schedule-123" });

      expect(result.isActive).toBe(true);
    });
  });

  describe("bulkToggleActive", () => {
    it("should bulk toggle schedules to active", async () => {
      (mockDb.notificationSchedule.update as ReturnType<typeof vi.fn>).mockResolvedValue([
        createMockSchedule({ id: "schedule-1", isActive: true }),
        createMockSchedule({ id: "schedule-2", isActive: true }),
        createMockSchedule({ id: "schedule-3", isActive: true }),
      ]);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.bulkToggleActive({
        ids: ["schedule-1", "schedule-2", "schedule-3"],
        isActive: true,
      });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(3);
    });
  });

  describe("updateLastRun", () => {
    it("should update last run timestamp", async () => {
      const schedule = createMockSchedule({ id: "schedule-123", lastRun: null });
      const updatedSchedule = createMockSchedule({
        id: "schedule-123",
        lastRun: new Date(),
      });

      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        schedule,
      );
      (mockDb.notificationSchedule.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        updatedSchedule,
      );

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const lastRun = new Date();
      const result = await caller.updateLastRun({
        id: "schedule-123",
        lastRun,
      });

      expect(result.lastRun).toBeDefined();
    });

    it("should throw NOT_FOUND when schedule does not exist", async () => {
      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(
        caller.updateLastRun({
          id: "non-existent",
          lastRun: new Date(),
        }),
      ).rejects.toThrow(ORPCError);
    });
  });
});
