import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { notificationDeliveryRouter } from "../notificationDelivery";

describe("notificationDeliveryRouter", () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      db: {
        notificationDelivery: {
          findMany: vi.fn(),
          findUnique: vi.fn(),
          count: vi.fn(),
          aggregate: vi.fn(),
          groupBy: vi.fn(),
        },
      },
      dbUser: {
        id: "admin-user-id",
        role: "ADMIN",
      },
      session: {
        user: {
          id: "auth-user-123",
        },
      },
    };
  });

  describe("getDeliveries", () => {
    it("should return deliveries without filters", async () => {
      const mockDeliveries = [
        {
          id: "delivery-1",
          notificationId: "notif-1",
          scheduleId: null,
          deliveryStartedAt: new Date("2026-01-09T10:00:00Z"),
          deliveryCompletedAt: new Date("2026-01-09T10:00:05Z"),
          totalRecipients: 100,
          successCount: 95,
          failureCount: 5,
          errors: null,
          status: "partial_failure",
          notification: {
            id: "notif-1",
            title: "Test Notification",
            body: "Test body",
            createdAt: new Date("2026-01-09T09:59:00Z"),
          },
        },
      ];

      mockContext.db.notificationDelivery.findMany.mockResolvedValue(
        mockDeliveries,
      );
      mockContext.db.notificationDelivery.count.mockResolvedValue(1);

      const caller = notificationDeliveryRouter.createCaller(mockContext);
      const result = await caller.getDeliveries({ tripId: "trip-1" });

      expect(result).toEqual({
        deliveries: mockDeliveries,
        total: 1,
        limit: 50,
        offset: 0,
      });

      expect(mockContext.db.notificationDelivery.findMany).toHaveBeenCalledWith(
        {
          where: { tripId: "trip-1" },
          orderBy: {
            deliveryStartedAt: "desc",
          },
          take: 50,
          skip: 0,
          include: {
            notification: {
              select: {
                id: true,
                title: true,
                body: true,
                createdAt: true,
              },
            },
          },
        },
      );
    });

    it("should filter deliveries by status", async () => {
      mockContext.db.notificationDelivery.findMany.mockResolvedValue([]);
      mockContext.db.notificationDelivery.count.mockResolvedValue(0);

      const caller = notificationDeliveryRouter.createCaller(mockContext);
      await caller.getDeliveries({ status: "success", tripId: "trip-1" });

      expect(mockContext.db.notificationDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tripId: "trip-1", status: "success" },
        }),
      );
    });

    it("should filter deliveries by scheduleId", async () => {
      mockContext.db.notificationDelivery.findMany.mockResolvedValue([]);
      mockContext.db.notificationDelivery.count.mockResolvedValue(0);

      const caller = notificationDeliveryRouter.createCaller(mockContext);
      await caller.getDeliveries({
        scheduleId: "schedule-123",
        tripId: "trip-1",
      });

      expect(mockContext.db.notificationDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tripId: "trip-1", scheduleId: "schedule-123" },
        }),
      );
    });

    it("should filter deliveries by date range", async () => {
      mockContext.db.notificationDelivery.findMany.mockResolvedValue([]);
      mockContext.db.notificationDelivery.count.mockResolvedValue(0);

      const startDate = new Date("2026-01-01");
      const endDate = new Date("2026-01-09");

      const caller = notificationDeliveryRouter.createCaller(mockContext);
      await caller.getDeliveries({ startDate, endDate, tripId: "trip-1" });

      expect(mockContext.db.notificationDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tripId: "trip-1",
            deliveryStartedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
      );
    });

    it("should apply pagination", async () => {
      mockContext.db.notificationDelivery.findMany.mockResolvedValue([]);
      mockContext.db.notificationDelivery.count.mockResolvedValue(150);

      const caller = notificationDeliveryRouter.createCaller(mockContext);
      const result = await caller.getDeliveries({
        limit: 20,
        offset: 40,
        tripId: "trip-1",
      });

      expect(result).toMatchObject({
        limit: 20,
        offset: 40,
        total: 150,
      });

      expect(mockContext.db.notificationDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tripId: "trip-1" },
          take: 20,
          skip: 40,
        }),
      );
    });

    it("should handle database errors", async () => {
      mockContext.db.notificationDelivery.findMany.mockRejectedValue(
        new Error("DB connection lost"),
      );

      const caller = notificationDeliveryRouter.createCaller(mockContext);

      await expect(caller.getDeliveries()).rejects.toThrow(TRPCError);
    });
  });

  describe("getDeliveryByNotificationId", () => {
    it("should return delivery by notification ID", async () => {
      const mockDelivery = {
        id: "delivery-1",
        notificationId: "notif-123",
        scheduleId: "schedule-456",
        deliveryStartedAt: new Date("2026-01-09T10:00:00Z"),
        deliveryCompletedAt: new Date("2026-01-09T10:00:05Z"),
        totalRecipients: 50,
        successCount: 50,
        failureCount: 0,
        errors: null,
        status: "success",
        tripId: "trip-1",
        notification: {
          id: "notif-123",
          title: "Test",
          body: "Test body",
          url: "https://example.com",
          createdAt: new Date(),
          createdBy: {
            id: "user-1",
            firstName: "Admin",
            lastName: "User",
            email: "admin@example.com",
          },
        },
      };

      mockContext.db.notificationDelivery.findUnique.mockResolvedValue(
        mockDelivery,
      );

      const caller = notificationDeliveryRouter.createCaller(mockContext);
      const result = await caller.getDeliveryByNotificationId({
        notificationId: "notif-123",
        tripId: "trip-1",
      });

      expect(result).toEqual(mockDelivery);

      expect(
        mockContext.db.notificationDelivery.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          notificationId: "notif-123",
        },
        include: {
          notification: {
            select: {
              id: true,
              title: true,
              body: true,
              url: true,
              createdAt: true,
              tripId: true,
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    });

    it("should throw NOT_FOUND when delivery does not exist", async () => {
      mockContext.db.notificationDelivery.findUnique.mockResolvedValue(null);

      const caller = notificationDeliveryRouter.createCaller(mockContext);

      await expect(
        caller.getDeliveryByNotificationId({
          notificationId: "non-existent",
          tripId: "trip-1",
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: "NOT_FOUND",
          message: "Notification delivery not found",
        }),
      );
    });

    it("should handle database errors", async () => {
      mockContext.db.notificationDelivery.findUnique.mockRejectedValue(
        new Error("DB error"),
      );

      const caller = notificationDeliveryRouter.createCaller(mockContext);

      await expect(
        caller.getDeliveryByNotificationId({
          notificationId: "notif-123",
          tripId: "trip-1",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getDeliveryStats", () => {
    it("should return delivery statistics", async () => {
      const mockAggregateResult = {
        _count: {
          id: 100,
        },
        _sum: {
          totalRecipients: 5000,
          successCount: 4750,
          failureCount: 250,
        },
        _avg: {
          successCount: 47.5,
          failureCount: 2.5,
        },
      };

      const mockGroupByResult = [
        { status: "success", _count: { id: 80 } },
        { status: "partial_failure", _count: { id: 15 } },
        { status: "failure", _count: { id: 5 } },
      ];

      mockContext.db.notificationDelivery.aggregate.mockResolvedValue(
        mockAggregateResult,
      );
      mockContext.db.notificationDelivery.groupBy.mockResolvedValue(
        mockGroupByResult,
      );

      const caller = notificationDeliveryRouter.createCaller(mockContext);
      const result = await caller.getDeliveryStats({ tripId: "trip-1" });

      expect(result).toEqual({
        totalDeliveries: 100,
        totalRecipients: 5000,
        totalSuccess: 4750,
        totalFailures: 250,
        avgSuccessPerDelivery: 47.5,
        avgFailuresPerDelivery: 2.5,
        successRate: 95,
        statusBreakdown: {
          success: 80,
          partial_failure: 15,
          failure: 5,
        },
      });
    });

    it("should filter stats by date range", async () => {
      mockContext.db.notificationDelivery.aggregate.mockResolvedValue({
        _count: { id: 10 },
        _sum: { totalRecipients: 0, successCount: 0, failureCount: 0 },
        _avg: { successCount: 0, failureCount: 0 },
      });
      mockContext.db.notificationDelivery.groupBy.mockResolvedValue([]);

      const startDate = new Date("2026-01-01");
      const endDate = new Date("2026-01-09");

      const caller = notificationDeliveryRouter.createCaller(mockContext);
      await caller.getDeliveryStats({ startDate, endDate, tripId: "trip-1" });

      expect(
        mockContext.db.notificationDelivery.aggregate,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tripId: "trip-1",
            deliveryStartedAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        }),
      );
    });

    it("should filter stats by scheduleId", async () => {
      mockContext.db.notificationDelivery.aggregate.mockResolvedValue({
        _count: { id: 5 },
        _sum: { totalRecipients: 0, successCount: 0, failureCount: 0 },
        _avg: { successCount: 0, failureCount: 0 },
      });
      mockContext.db.notificationDelivery.groupBy.mockResolvedValue([]);

      const caller = notificationDeliveryRouter.createCaller(mockContext);
      await caller.getDeliveryStats({
        scheduleId: "schedule-123",
        tripId: "trip-1",
      });

      expect(
        mockContext.db.notificationDelivery.aggregate,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tripId: "trip-1",
            scheduleId: "schedule-123",
          }),
        }),
      );
    });

    it("should handle zero recipients correctly", async () => {
      mockContext.db.notificationDelivery.aggregate.mockResolvedValue({
        _count: { id: 10 },
        _sum: {
          totalRecipients: 0,
          successCount: 0,
          failureCount: 0,
        },
        _avg: {
          successCount: 0,
          failureCount: 0,
        },
      });
      mockContext.db.notificationDelivery.groupBy.mockResolvedValue([]);

      const caller = notificationDeliveryRouter.createCaller(mockContext);
      const result = await caller.getDeliveryStats({ tripId: "trip-1" });

      expect(result.successRate).toBe(0);
    });

    it("should handle database errors", async () => {
      mockContext.db.notificationDelivery.aggregate.mockRejectedValue(
        new Error("DB error"),
      );

      const caller = notificationDeliveryRouter.createCaller(mockContext);

      await expect(
        caller.getDeliveryStats({ tripId: "trip-1" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getFailedDeliveries", () => {
    it("should return failed and partial failure deliveries", async () => {
      const mockDeliveries = [
        {
          id: "delivery-1",
          notificationId: "notif-1",
          status: "failure",
          notification: {
            id: "notif-1",
            title: "Failed Notification",
            body: "This failed",
            createdAt: new Date(),
            createdBy: {
              id: "admin-1",
              firstName: "Admin",
              lastName: "User",
            },
          },
        },
        {
          id: "delivery-2",
          notificationId: "notif-2",
          status: "partial_failure",
          notification: {
            id: "notif-2",
            title: "Partially Failed",
            body: "Some failed",
            createdAt: new Date(),
            createdBy: {
              id: "admin-1",
              firstName: "Admin",
              lastName: "User",
            },
          },
        },
      ];

      mockContext.db.notificationDelivery.findMany.mockResolvedValue(
        mockDeliveries,
      );
      mockContext.db.notificationDelivery.count.mockResolvedValue(2);

      const caller = notificationDeliveryRouter.createCaller(mockContext);
      const result = await caller.getFailedDeliveries({ tripId: "trip-1" });

      expect(result).toEqual({
        deliveries: mockDeliveries,
        total: 2,
        limit: 20,
        offset: 0,
      });

      expect(mockContext.db.notificationDelivery.findMany).toHaveBeenCalledWith(
        {
          where: {
            tripId: "trip-1",
            OR: [{ status: "failure" }, { status: "partial_failure" }],
          },
          orderBy: {
            deliveryStartedAt: "desc",
          },
          take: 20,
          skip: 0,
          include: {
            notification: {
              select: {
                id: true,
                title: true,
                body: true,
                createdAt: true,
                createdBy: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      );
    });

    it("should apply pagination for failed deliveries", async () => {
      mockContext.db.notificationDelivery.findMany.mockResolvedValue([]);
      mockContext.db.notificationDelivery.count.mockResolvedValue(100);

      const caller = notificationDeliveryRouter.createCaller(mockContext);
      const result = await caller.getFailedDeliveries({
        tripId: "trip-1",
        limit: 10,
        offset: 20,
      });

      expect(result).toMatchObject({
        limit: 10,
        offset: 20,
        total: 100,
      });

      expect(mockContext.db.notificationDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tripId: "trip-1",
            OR: [{ status: "failure" }, { status: "partial_failure" }],
          },
          take: 10,
          skip: 20,
        }),
      );
    });

    it("should handle database errors", async () => {
      mockContext.db.notificationDelivery.findMany.mockRejectedValue(
        new Error("DB error"),
      );

      const caller = notificationDeliveryRouter.createCaller(mockContext);

      await expect(caller.getFailedDeliveries()).rejects.toThrow(TRPCError);
    });
  });
});
