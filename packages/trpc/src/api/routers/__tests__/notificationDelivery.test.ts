import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const mockDb = () => ({
  user: {
    findFirst: mock(() =>
      Promise.resolve({
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
      }),
    ),
  },
  notificationDelivery: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve(null)),
    count: mock(() => Promise.resolve(0)),
    aggregate: mock(() =>
      Promise.resolve({ _count: { id: 0 }, _sum: {}, _avg: {} }),
    ),
    groupBy: mock(() => Promise.resolve([])),
  },
  notification: {
    findUnique: mock(() => Promise.resolve(null)),
  },
  notificationScheduleExecution: {
    findFirst: mock(() => Promise.resolve(null)),
  },
});

const mockSupabase = () => ({
  auth: {
    getUser: mock(() =>
      Promise.resolve({
        data: { user: { id: "auth-user-1" } },
        error: null,
      }),
    ),
    admin: {
      getUserById: mock(() =>
        Promise.resolve({
          data: { user: { id: "auth-user-1", banned_until: null } },
          error: null,
        }),
      ),
    },
  },
});

describe("notificationDelivery router", () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      db: mockDb(),
      supabase: mockSupabase(),
      headers: new Headers(),
      accessToken: "test-token",
      dbUser: {
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN" as const,
      },
    };
  });

  describe("getDeliveries", () => {
    test("returns paginated deliveries", async () => {
      mockCtx.db.notificationDelivery.findMany.mockResolvedValueOnce([
        {
          id: "del-1",
          notificationId: "notif-1",
          status: "success",
          totalRecipients: 100,
        },
      ]);
      mockCtx.db.notificationDelivery.count.mockResolvedValueOnce(1);
      const caller = createCaller(mockCtx);
      const result = await caller.notificationDelivery.getDeliveries({
        tripId: "trip-1",
      });
      expect(result.deliveries).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    test("returns deliveries with optional filters", async () => {
      mockCtx.db.notificationDelivery.findMany.mockResolvedValueOnce([]);
      mockCtx.db.notificationDelivery.count.mockResolvedValueOnce(0);
      const caller = createCaller(mockCtx);
      const result = await caller.notificationDelivery.getDeliveries({
        tripId: "trip-1",
        status: "failure",
        limit: 20,
        offset: 0,
      });
      expect(result.deliveries).toHaveLength(0);
    });

    test("returns deliveries with date range", async () => {
      mockCtx.db.notificationDelivery.findMany.mockResolvedValueOnce([]);
      mockCtx.db.notificationDelivery.count.mockResolvedValueOnce(0);
      const caller = createCaller(mockCtx);
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      const result = await caller.notificationDelivery.getDeliveries({
        tripId: "trip-1",
        startDate,
        endDate,
      });
      expect(result.deliveries).toHaveLength(0);
    });

    test("throws INTERNAL_SERVER_ERROR on database failure", async () => {
      mockCtx.db.notificationDelivery.findMany.mockRejectedValueOnce(
        new Error("DB connection failed"),
      );
      const caller = createCaller(mockCtx);
      await expect(
        caller.notificationDelivery.getDeliveries({ tripId: "trip-1" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getDeliveryByNotificationId", () => {
    test("returns delivery for valid notification", async () => {
      mockCtx.db.notificationDelivery.findUnique.mockResolvedValueOnce({
        id: "del-1",
        notificationId: "notif-1",
        tripId: "trip-1",
        notification: {
          id: "notif-1",
          title: "Test",
          body: "Body",
          createdBy: {
            id: "user-1",
            firstName: "Admin",
            lastName: "User",
            authUserId: "auth-user-1",
          },
        },
      });
      mockCtx.supabase = {
        ...mockCtx.supabase,
        storage: {
          from: mock().mockReturnValue({
            createSignedUrl: mock().mockResolvedValue({
              data: { signedUrl: "https://example.com" },
            }),
          }),
        },
      };
      const caller = createCaller(mockCtx);
      const result =
        await caller.notificationDelivery.getDeliveryByNotificationId({
          notificationId: "notif-1",
          tripId: "trip-1",
        });
      expect(result.notificationId).toBe("notif-1");
    });

    test("throws NOT_FOUND when tripId mismatch", async () => {
      mockCtx.db.notificationDelivery.findUnique.mockResolvedValueOnce({
        id: "del-1",
        notificationId: "notif-1",
        tripId: "trip-2",
        notification: { id: "notif-1" },
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.notificationDelivery.getDeliveryByNotificationId({
          notificationId: "notif-1",
          tripId: "trip-1",
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("returns delivery when no createdBy", async () => {
      mockCtx.db.notificationDelivery.findUnique.mockResolvedValueOnce({
        id: "del-1",
        notificationId: "notif-1",
        tripId: "trip-1",
        notification: { id: "notif-1" },
      });
      const caller = createCaller(mockCtx);
      const result =
        await caller.notificationDelivery.getDeliveryByNotificationId({
          notificationId: "notif-1",
          tripId: "trip-1",
        });
      expect(result.notificationId).toBe("notif-1");
    });
  });

  describe("getDeliveryStats", () => {
    test("returns aggregated statistics", async () => {
      mockCtx.db.notificationDelivery.aggregate.mockResolvedValueOnce({
        _count: { id: 10 },
        _sum: { totalRecipients: 1000, successCount: 950, failureCount: 50 },
        _avg: { successCount: 95, failureCount: 5 },
      });
      mockCtx.db.notificationDelivery.groupBy.mockResolvedValueOnce([
        { status: "success", _count: { id: 8 } },
        { status: "failure", _count: { id: 2 } },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.notificationDelivery.getDeliveryStats({
        tripId: "trip-1",
      });
      expect(result.totalDeliveries).toBe(10);
      expect(result.totalRecipients).toBe(1000);
      expect(result.totalSuccess).toBe(950);
      expect(result.successRate).toBe(95);
    });

    test("returns 0 success rate when no recipients", async () => {
      mockCtx.db.notificationDelivery.aggregate.mockResolvedValueOnce({
        _count: { id: 0 },
        _sum: { totalRecipients: null, successCount: null, failureCount: null },
        _avg: { successCount: null, failureCount: null },
      });
      mockCtx.db.notificationDelivery.groupBy.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.notificationDelivery.getDeliveryStats({
        tripId: "trip-1",
      });
      expect(result.successRate).toBe(0);
    });

    test("throws INTERNAL_SERVER_ERROR on database failure", async () => {
      mockCtx.db.notificationDelivery.aggregate.mockRejectedValueOnce(
        new Error("DB error"),
      );
      const caller = createCaller(mockCtx);
      await expect(
        caller.notificationDelivery.getDeliveryStats({ tripId: "trip-1" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getFailedDeliveries", () => {
    test("returns failed deliveries", async () => {
      mockCtx.db.notificationDelivery.findMany.mockResolvedValueOnce([
        {
          id: "del-1",
          status: "failure",
          notification: { id: "notif-1", title: "Failed" },
        },
      ]);
      mockCtx.db.notificationDelivery.count.mockResolvedValueOnce(1);
      const caller = createCaller(mockCtx);
      const result = await caller.notificationDelivery.getFailedDeliveries({
        tripId: "trip-1",
      });
      expect(result.deliveries).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    test("returns partial failures", async () => {
      mockCtx.db.notificationDelivery.findMany.mockResolvedValueOnce([
        {
          id: "del-1",
          status: "partial_failure",
          notification: { id: "notif-1", title: "Partial" },
        },
      ]);
      mockCtx.db.notificationDelivery.count.mockResolvedValueOnce(1);
      const caller = createCaller(mockCtx);
      const result = await caller.notificationDelivery.getFailedDeliveries({
        tripId: "trip-1",
      });
      expect(result.deliveries).toHaveLength(1);
    });

    test("throws INTERNAL_SERVER_ERROR on database failure", async () => {
      mockCtx.db.notificationDelivery.findMany.mockRejectedValueOnce(
        new Error("DB error"),
      );
      const caller = createCaller(mockCtx);
      await expect(
        caller.notificationDelivery.getFailedDeliveries({ tripId: "trip-1" }),
      ).rejects.toThrow(TRPCError);
    });
  });
});
