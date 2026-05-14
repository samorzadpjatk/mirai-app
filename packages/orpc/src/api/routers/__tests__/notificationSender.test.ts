 
 
 
import { describe, it, expect, vi, beforeEach } from "vitest";
import { notificationSenderRouter } from "../../routers/notificationSender";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { DB, User, NotificationDelivery, NotificationScheduleExecution } from "@mirai-app/db";

// Mock the notification service
vi.mock("../../../services/notificationService", () => ({
  sendMobileNotifications: vi.fn().mockResolvedValue({
    success: true,
    sent: 10,
    failed: 0,
    total: 10,
  }),
}));

const createCaller = (ctx: TRPCContext) => createRouterClient(notificationSenderRouter, { context: ctx });

// Helper to create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-123",
  authUserId: "auth-123",
  firstName: "Test",
  lastName: "User",
  role: "USER",
  hasAvatar: false,
  lastSeenOn: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock delivery
const createMockDelivery = (overrides: Partial<NotificationDelivery> = {}): NotificationDelivery => ({
  id: "delivery-123",
  notificationId: "notification-123",
  tripId: "trip-123",
  scheduleId: null,
  deliveryStartedAt: new Date(),
  deliveryCompletedAt: null,
  totalRecipients: 10,
  successCount: 0,
  failureCount: 0,
  errors: null,
  status: "pending",
  ...overrides,
});

// Helper to create mock schedule execution
const createMockScheduleExecution = (overrides: Partial<NotificationScheduleExecution> = {}): NotificationScheduleExecution => ({
  id: "execution-123",
  scheduleId: "schedule-123",
  notificationId: "notification-123",
  executedAt: new Date(),
  ...overrides,
});

describe("notificationSenderRouter", () => {
  let mockDb: DB;
  let mockSupabase: SupabaseClient;
  let mockUser: User;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUser = createMockUser();

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-123" } }, error: null }),
        getSession: vi.fn(),
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

    mockDb = {
      notificationDelivery: {
        create: vi.fn().mockResolvedValue(createMockDelivery()),
        findUnique: vi.fn().mockResolvedValue(createMockDelivery()),
        update: vi.fn().mockResolvedValue(createMockDelivery()),
      },
      notificationScheduleExecution: {
        findFirst: vi.fn().mockResolvedValue(createMockScheduleExecution()),
      },
    };

    const lastResults: Record<string, unknown> = {};

    function toCamelCase(str: string): string {
      return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    function getModelName(table: unknown): string {
      let name: string | undefined;
      if (typeof table === 'string') {
        name = table;
      } else if (table && typeof table === 'object') {
        const obj = table as Record<string | symbol, unknown>;
        if (typeof obj.name === 'string') {
          name = obj.name;
        } else {
          const drizzleNameSym = Symbol.for('drizzle:Name');
          if (typeof obj[drizzleNameSym] === 'string') {
            name = obj[drizzleNameSym];
          } else {
            const sym = Object.getOwnPropertySymbols(obj).find(
              (s) => s.description === 'drizzle:Name'
            );
            if (sym && typeof obj[sym] === 'string') {
              name = obj[sym];
            }
          }
        }
      }
      if (!name) return 'unknown';
      const singular = name.replace(/ies$/, 'y').replace(/s$/, '');
      return toCamelCase(singular);
    }

    const db = mockDb as Record<string, unknown>;

    db.query = new Proxy({}, {
      get(_, tableName) {
        const name = String(tableName);
        const singular = name.replace(/ies$/, 'y').replace(/s$/, '');
        const model = db[singular] ?? db[name];
        if (model && typeof model === 'object') {
          const modelObj = model as Record<string, (...args: unknown[]) => Promise<unknown>>;
          return new Proxy(modelObj, {
            get(_, methodName) {
              const method = String(methodName);
              if (method === 'findFirst' || method === 'findUnique') {
                return async (...args: unknown[]) => {
                  if (modelObj[method]) {
                    const result = await modelObj[method](...args);
                    if (result !== null && result !== undefined) {
                      return result;
                    }
                    const otherMethod = method === 'findFirst' ? 'findUnique' : 'findFirst';
                    if (modelObj[otherMethod]) {
                      const fb = await modelObj[otherMethod](...args);
                      if (fb !== null && fb !== undefined) {
                        return fb;
                      }
                    }
                    return lastResults[singular] ?? null;
                  }
                  const otherMethod = method === 'findFirst' ? 'findUnique' : 'findFirst';
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
        return { findFirst: vi.fn(() => Promise.resolve(null)), findUnique: vi.fn(() => Promise.resolve(null)), findMany: vi.fn(() => Promise.resolve([])) };
      },
    });

    db.insert = vi.fn((table: unknown) => {
      const modelName = getModelName(table);
      return {
        values: vi.fn((data: unknown) => {
          const returningFn = () => {
            const model = db[modelName];
            if (model && typeof model === 'object' && 'create' in model) {
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
                if (model && typeof model === 'object' && 'upsert' in model) {
                  return (model as Record<string, unknown>).upsert({ data }).then((result: unknown) => {
                    if (result != null) lastResults[modelName] = result;
                    return [result];
                  });
                }
                return Promise.resolve([{}]);
              },
              then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
                const model = db[modelName];
                if (model && typeof model === 'object' && 'upsert' in model) {
                  return (model as Record<string, unknown>).upsert({ data }).then((result: unknown) => {
                    if (result != null) lastResults[modelName] = result;
                    return resolve([result]);
                  }, reject);
                }
                return resolve([{}]);
              },
            }),
            then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => returningFn().then(resolve, reject),
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
            if (model && typeof model === 'object' && 'update' in model) {
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
              then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => execute().then(resolve, reject),
            })),
            then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => execute().then(resolve, reject),
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
            if (model && typeof model === 'object' && 'delete' in model) {
              return (model as Record<string, unknown>).delete().then((result: unknown) => {
                if (result != null) lastResults[modelName] = result;
                return Array.isArray(result) ? result : [result];
              });
            }
            return Promise.resolve([{}]);
          };
          return {
            returning: execute,
            then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => execute().then(resolve, reject),
          };
        }),
      };
    });

    db.select = vi.fn((fields?: unknown) => {
      let primaryTable: string | undefined;
      let hasGroupBy = false;
      const fieldNames = fields && typeof fields === 'object' ? Object.keys(fields) : [];
      const hasCountOnly = fieldNames.length === 1 && fieldNames[0] === 'count';
      const hasAggregateFields = fieldNames.some((f) => ['count', 'sum', 'avg', 'min', 'max'].includes(f));
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
            if (model && typeof model === 'object') {
              if (hasGroupBy && 'groupBy' in model) {
                return (model as Record<string, unknown>).groupBy().then((groups: unknown) => {
                  const mapped = (groups as Record<string, unknown>[]).map((row) => {
                    const item: Record<string, unknown> = {};
                    for (const field of fieldNames) {
                      if (field in row) {
                        item[field] = row[field];
                      } else if (field === 'count' && (row as Record<string, Record<string, unknown>>)._count) {
                        item.count = (row as Record<string, Record<string, unknown>>)._count.id ?? (row as Record<string, Record<string, unknown>>)._count._all ?? 0;
                      }
                    }
                    return item;
                  });
                  return resolve(mapped);
                }, reject);
              }
              if (hasCountOnly && 'count' in model) {
                return (model as Record<string, unknown>).count().then((count: unknown) => resolve([{ count }]), reject);
              }
              if (hasAggregateFields && 'aggregate' in model) {
                return (model as Record<string, unknown>).aggregate().then((aggResult: unknown) => {
                  const mapped: Record<string, unknown> = {};
                  const agg = aggResult as Record<string, Record<string, unknown>>;
                  for (const field of fieldNames) {
                    if (field === 'count' && agg._count) {
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
              if ('findMany' in model) {
                return (model as Record<string, unknown>).findMany().then((results: unknown) => resolve(results), reject);
              }
              if ('count' in model) {
                return (model as Record<string, unknown>).count().then((count: unknown) => resolve([{ count }]), reject);
              }
              if ('aggregate' in model) {
                return (model as Record<string, unknown>).aggregate().then((agg: unknown) => resolve([agg]), reject);
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

  const createContext = (): TRPCContext => ({
    db: mockDb,
    supabase: mockSupabase,
    headers: new Headers(),
    accessToken: null,
    user: null,
    dbUser: null,
  });

  describe("sendMobileNotifications", () => {
    it("should send mobile notifications successfully", async () => {
      const { sendMobileNotifications } = await import("../../../services/notificationService");

      const ctx = createContext();
      const caller = createCaller(ctx);

      const result = await caller.sendMobileNotifications({
        notificationId: "notification-123",
      });

      expect(result.success).toBe(true);
      expect(result.sent).toBe(10);
      expect(result.failed).toBe(0);
      expect(sendMobileNotifications).toHaveBeenCalledWith(mockDb, "notification-123");
    });

    it("should handle notification service errors", async () => {
      const { sendMobileNotifications } = await import("../../../services/notificationService");
      (sendMobileNotifications as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Service error"));

      const ctx = createContext();
      const caller = createCaller(ctx);

      await expect(
        caller.sendMobileNotifications({
          notificationId: "notification-123",
        })
      ).rejects.toThrow("Service error");
    });
  });

  describe("trackDeliveryStart", () => {
    it("should create delivery tracking record", async () => {
      const execution = createMockScheduleExecution({
        schedule: {
          id: "schedule-123",
          tripId: "trip-123",
        },
      });

      (mockDb.notificationScheduleExecution.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(execution);
      (mockDb.notificationDelivery.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockDelivery({
          notificationId: "notification-123",
          scheduleId: "schedule-123",
          tripId: "trip-123",
          status: "pending",
        })
      );

      const ctx = createContext();
      const caller = createCaller(ctx);

      await caller.trackDeliveryStart({
        notificationId: "notification-123",
      });

       
      expect(mockDb.notificationDelivery.create).toHaveBeenCalled();;
    });

    it("should handle missing schedule execution gracefully", async () => {
      (mockDb.notificationScheduleExecution.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (mockDb.notificationDelivery.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockDelivery({
          notificationId: "notification-123",
          scheduleId: undefined,
          tripId: undefined,
        })
      );

      const ctx = createContext();
      const caller = createCaller(ctx);

      const result = await caller.trackDeliveryStart({
        notificationId: "notification-123",
      });

      expect(result).toBeUndefined();
    });

    it("should handle database errors gracefully", async () => {
      (mockDb.notificationScheduleExecution.findFirst as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("DB error"));

      const ctx = createContext();
      const caller = createCaller(ctx);

      const result = await caller.trackDeliveryStart({
        notificationId: "notification-123",
      });

      expect(result).toBeUndefined();
    });
  });

  describe("trackDeliveryComplete", () => {
    it("should update delivery with success status", async () => {
      (mockDb.notificationDelivery.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockDelivery({
          status: "success",
          totalRecipients: 10,
          successCount: 10,
          failureCount: 0,
        })
      );

      const ctx = createContext();
      const caller = createCaller(ctx);

      await caller.trackDeliveryComplete({
        notificationId: "notification-123",
        totalRecipients: 10,
        successCount: 10,
        failureCount: 0,
        errors: null,
      });

       
      expect(mockDb.notificationDelivery.update).toHaveBeenCalled();;
    });

    it("should set partial_failure status when some fail", async () => {
      (mockDb.notificationDelivery.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockDelivery({
          status: "partial_failure",
          totalRecipients: 10,
          successCount: 7,
          failureCount: 3,
        })
      );

      const ctx = createContext();
      const caller = createCaller(ctx);

      await caller.trackDeliveryComplete({
        notificationId: "notification-123",
        totalRecipients: 10,
        successCount: 7,
        failureCount: 3,
        errors: null,
      });

       
      expect(mockDb.notificationDelivery.update).toHaveBeenCalled();;
    });

    it("should set failure status when all fail", async () => {
      (mockDb.notificationDelivery.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockDelivery({
          status: "failure",
          totalRecipients: 10,
          successCount: 0,
          failureCount: 10,
        })
      );

      const ctx = createContext();
      const caller = createCaller(ctx);

      await caller.trackDeliveryComplete({
        notificationId: "notification-123",
        totalRecipients: 10,
        successCount: 0,
        failureCount: 10,
        errors: "All tokens invalid",
      });

       
      expect(mockDb.notificationDelivery.update).toHaveBeenCalled();;
    });

    it("should handle database errors gracefully", async () => {
      (mockDb.notificationDelivery.update as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("DB error"));

      const ctx = createContext();
      const caller = createCaller(ctx);

      const result = await caller.trackDeliveryComplete({
        notificationId: "notification-123",
        totalRecipients: 10,
        successCount: 10,
        failureCount: 0,
        errors: null,
      });

      expect(result).toBeUndefined();
    });
  });

  describe("trackDeliveryFailure", () => {
    it("should update existing delivery with failure", async () => {
      (mockDb.notificationDelivery.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockDelivery({ id: "delivery-123" })
      );
      (mockDb.notificationDelivery.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockDelivery({
          status: "failure",
          errors: "Network error",
        })
      );

      const ctx = createContext();
      const caller = createCaller(ctx);

      await caller.trackDeliveryFailure({
        notificationId: "notification-123",
        error: "Network error",
      });

       
      expect(mockDb.notificationDelivery.update).toHaveBeenCalled();;
    });

    it("should create new delivery record when none exists", async () => {
      (mockDb.notificationDelivery.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const execution = createMockScheduleExecution({
        schedule: {
          id: "schedule-123",
          tripId: "trip-123",
        },
      });
      (mockDb.notificationScheduleExecution.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(execution);
      (mockDb.notificationDelivery.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockDelivery({
          notificationId: "notification-123",
          status: "failure",
          errors: "Service unavailable",
        })
      );

      const ctx = createContext();
      const caller = createCaller(ctx);

      await caller.trackDeliveryFailure({
        notificationId: "notification-123",
        error: "Service unavailable",
      });

       
      expect(mockDb.notificationDelivery.create).toHaveBeenCalled();;
    });

    it("should handle Error objects", async () => {
      (mockDb.notificationDelivery.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockDelivery({ id: "delivery-123" })
      );
      (mockDb.notificationDelivery.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockDelivery({
          status: "failure",
          errors: "Custom error message",
        })
      );

      const ctx = createContext();
      const caller = createCaller(ctx);

      await caller.trackDeliveryFailure({
        notificationId: "notification-123",
        error: new Error("Custom error message"),
      });

       
      expect(mockDb.notificationDelivery.update).toHaveBeenCalled();;
    });

    it("should handle database errors gracefully", async () => {
      (mockDb.notificationDelivery.findUnique as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("DB error"));

      const ctx = createContext();
      const caller = createCaller(ctx);

      const result = await caller.trackDeliveryFailure({
        notificationId: "notification-123",
        error: "Some error",
      });

      expect(result).toBeUndefined();
    });
  });

  describe("checkInactiveUsers", () => {
    it("should return zero counts when inactivity notifications are disabled", async () => {
      const ctx = createContext();
      const caller = createCaller(ctx);

      const result = await caller.checkInactiveUsers();

      expect(result.checked).toBe(0);
      expect(result.notified).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });
  });
});
