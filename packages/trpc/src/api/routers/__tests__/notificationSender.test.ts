import { describe, expect, test, mock, beforeEach } from "bun:test";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const mockDb = () => ({
  notification: {
    findUnique: mock(() =>
      Promise.resolve({
        id: "notif-1",
        tripId: "trip-1",
        title: "Test",
        body: "Body",
        url: "/test",
      }),
    ),
  },
  notificationPush: {
    findMany: mock(() => Promise.resolve([])),
  },
  pushSubscription: {
    findMany: mock(() => Promise.resolve([])),
  },
  tripParticipant: {
    findMany: mock(() => Promise.resolve([])),
  },
  notificationScheduleExecution: {
    findFirst: mock(() => Promise.resolve(null)),
  },
  notificationDelivery: {
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
    findUnique: mock(() => Promise.resolve(null)),
  },
});

const mockSupabase = () => ({
  auth: {
    getUser: mock().mockResolvedValue({
      data: { user: { id: "auth-user-1" } },
    }),
  },
});

describe("notificationSender router", () => {
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

  describe("sendMobileNotifications", () => {
    test("sends mobile notifications", async () => {
      const sendMobileNotifications = mock().mockResolvedValueOnce({
        success: true,
        sent: 100,
      });
      mockCtx.db = {
        ...mockCtx.db,
        $executeRaw: mock(),
      };
      const caller = createCaller(mockCtx);
      const result = await caller.notificationSender.sendMobileNotifications({
        notificationId: "notif-1",
      });
      expect(result).toBeDefined();
    });
  });

  describe("trackDeliveryStart", () => {
    test("creates delivery record", async () => {
      mockCtx.db.notificationScheduleExecution.findFirst.mockResolvedValueOnce({
        schedule: { id: "sched-1", tripId: "trip-1" },
      });
      mockCtx.db.notificationDelivery.create.mockResolvedValueOnce({
        id: "del-1",
        notificationId: "notif-1",
        status: "pending",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.notificationSender.trackDeliveryStart({
        notificationId: "notif-1",
      });
      expect(mockCtx.db.notificationDelivery.create).toHaveBeenCalled();
    });

    test("handles missing schedule gracefully", async () => {
      mockCtx.db.notificationScheduleExecution.findFirst.mockResolvedValueOnce(
        null,
      );
      mockCtx.db.notificationDelivery.create.mockResolvedValueOnce({
        id: "del-1",
      });
      const caller = createCaller(mockCtx);
      await caller.notificationSender.trackDeliveryStart({
        notificationId: "notif-1",
      });
      expect(mockCtx.db.notificationDelivery.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          notificationId: "notif-1",
          scheduleId: undefined,
          tripId: undefined,
        }),
      });
    });

    test("handles database errors gracefully", async () => {
      mockCtx.db.notificationScheduleExecution.findFirst.mockRejectedValueOnce(
        new Error("DB error"),
      );
      const caller = createCaller(mockCtx);
      await caller.notificationSender.trackDeliveryStart({
        notificationId: "notif-1",
      });
    });
  });

  describe("trackDeliveryComplete", () => {
    test("updates delivery with success status", async () => {
      mockCtx.db.notificationDelivery.update.mockResolvedValueOnce({
        id: "del-1",
        status: "success",
      });
      const caller = createCaller(mockCtx);
      await caller.notificationSender.trackDeliveryComplete({
        notificationId: "notif-1",
        totalRecipients: 100,
        successCount: 100,
        failureCount: 0,
        errors: null,
      });
      expect(mockCtx.db.notificationDelivery.update).toHaveBeenCalledWith({
        where: { notificationId: "notif-1" },
        data: expect.objectContaining({
          status: "success",
          totalRecipients: 100,
          successCount: 100,
          failureCount: 0,
        }),
      });
    });

    test("updates delivery with failure status", async () => {
      mockCtx.db.notificationDelivery.update.mockResolvedValueOnce({
        id: "del-1",
        status: "failure",
      });
      const caller = createCaller(mockCtx);
      await caller.notificationSender.trackDeliveryComplete({
        notificationId: "notif-1",
        totalRecipients: 100,
        successCount: 0,
        failureCount: 100,
        errors: "Network error",
      });
      expect(mockCtx.db.notificationDelivery.update).toHaveBeenCalledWith({
        where: { notificationId: "notif-1" },
        data: expect.objectContaining({
          status: "failure",
        }),
      });
    });

    test("updates delivery with partial failure status", async () => {
      mockCtx.db.notificationDelivery.update.mockResolvedValueOnce({
        id: "del-1",
        status: "partial_failure",
      });
      const caller = createCaller(mockCtx);
      await caller.notificationSender.trackDeliveryComplete({
        notificationId: "notif-1",
        totalRecipients: 100,
        successCount: 50,
        failureCount: 50,
        errors: null,
      });
      expect(mockCtx.db.notificationDelivery.update).toHaveBeenCalledWith({
        where: { notificationId: "notif-1" },
        data: expect.objectContaining({
          status: "partial_failure",
        }),
      });
    });

    test("handles database errors gracefully", async () => {
      mockCtx.db.notificationDelivery.update.mockRejectedValueOnce(
        new Error("DB error"),
      );
      const caller = createCaller(mockCtx);
      await caller.notificationSender.trackDeliveryComplete({
        notificationId: "notif-1",
        totalRecipients: 100,
        successCount: 100,
        failureCount: 0,
        errors: null,
      });
    });
  });

  describe("trackDeliveryFailure", () => {
    test("updates existing delivery with failure", async () => {
      mockCtx.db.notificationDelivery.findUnique.mockResolvedValueOnce({
        id: "del-1",
      });
      mockCtx.db.notificationDelivery.update.mockResolvedValueOnce({
        id: "del-1",
        status: "failure",
      });
      const caller = createCaller(mockCtx);
      await caller.notificationSender.trackDeliveryFailure({
        notificationId: "notif-1",
        error: "Connection timeout",
      });
      expect(mockCtx.db.notificationDelivery.update).toHaveBeenCalled();
    });

    test("creates new delivery record when not found", async () => {
      mockCtx.db.notificationDelivery.findUnique.mockResolvedValueOnce(null);
      mockCtx.db.notificationScheduleExecution.findFirst.mockResolvedValueOnce({
        schedule: { id: "sched-1", tripId: "trip-1" },
      });
      mockCtx.db.notificationDelivery.create.mockResolvedValueOnce({
        id: "del-1",
        status: "failure",
      });
      const caller = createCaller(mockCtx);
      await caller.notificationSender.trackDeliveryFailure({
        notificationId: "notif-1",
        error: "Service unavailable",
      });
      expect(mockCtx.db.notificationDelivery.create).toHaveBeenCalled();
    });

    test("handles Error object as error input", async () => {
      mockCtx.db.notificationDelivery.findUnique.mockResolvedValueOnce({
        id: "del-1",
      });
      mockCtx.db.notificationDelivery.update.mockResolvedValueOnce({
        id: "del-1",
      });
      const error = new Error("Custom error message");
      const caller = createCaller(mockCtx);
      await caller.notificationSender.trackDeliveryFailure({
        notificationId: "notif-1",
        error,
      });
    });

    test("handles database errors gracefully", async () => {
      mockCtx.db.notificationDelivery.findUnique.mockRejectedValueOnce(
        new Error("DB error"),
      );
      const caller = createCaller(mockCtx);
      await caller.notificationSender.trackDeliveryFailure({
        notificationId: "notif-1",
        error: "Test error",
      });
    });
  });

  describe("checkInactiveUsers", () => {
    test("returns disabled check result", async () => {
      const caller = createCaller(mockCtx);
      const result = await caller.notificationSender.checkInactiveUsers();
      expect(result.checked).toBe(0);
      expect(result.notified).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });
  });
});
