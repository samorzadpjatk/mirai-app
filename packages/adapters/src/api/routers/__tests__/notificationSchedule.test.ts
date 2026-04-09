import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const createMockDb = () => ({
  user: {
    findFirst: mock(() => Promise.resolve(null)),
  },
  notificationSchedule: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve(null)),
    findFirst: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
    deleteMany: mock(() => Promise.resolve({})),
    updateMany: mock(() => Promise.resolve({})),
    count: mock(() => Promise.resolve({ count: 0 })),
  },
  notificationScheduleExecution: {
    findMany: mock(() => Promise.resolve([])),
  },
  trip: {
    findUnique: mock(() => Promise.resolve(null)),
  },
});

const createMockSupabase = () => {
  const getUserMock = mock(() =>
    Promise.resolve({ data: { user: null }, error: null }),
  );
  const adminGetUserByIdMock = mock(() =>
    Promise.resolve({
      data: { user: { id: "auth-admin-1", banned_until: null } },
      error: null,
    }),
  );
  return {
    auth: {
      getUser: getUserMock,
      admin: {
        getUserById: adminGetUserByIdMock,
      },
    },
  };
};

describe("[INTEGRATION] notificationSchedule router", () => {
  let mockCtx: any;

  const setupAdminMocks = () => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1" } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1" } },
      error: null,
    });
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1", banned_until: null } },
      error: null,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "admin-1",
      authUserId: "auth-admin-1",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "admin-1",
      authUserId: "auth-admin-1",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    });
  };

  beforeEach(() => {
    mockCtx = {
      db: createMockDb(),
      supabase: createMockSupabase(),
      headers: new Headers(),
      accessToken: "test-token",
      dbUser: {
        id: "admin-1",
        authUserId: "auth-admin-1",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN" as const,
      },
    };
  });

  describe("getAll", () => {
    test("returns paginated schedules", async () => {
      setupAdminMocks();
      mockCtx.db.notificationSchedule.findMany.mockResolvedValueOnce([
        {
          id: "schedule-1",
          name: "Morning Alert",
          createdBy: {
            id: "admin-1",
            firstName: "Admin",
            lastName: "User",
            authUserId: "auth-admin",
          },
        },
      ]);
      mockCtx.db.notificationSchedule.count.mockResolvedValueOnce(1);
      const caller = createCaller(mockCtx);
      const result = await caller.notificationSchedule.getAll({});
      expect(result.schedules).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe("getActiveSchedules", () => {
    test("returns active schedules", async () => {
      setupAdminMocks();
      const now = new Date();
      mockCtx.db.notificationSchedule.findMany.mockResolvedValueOnce([
        {
          id: "schedule-1",
          name: "Morning Alert",
          isActive: true,
          startDate: now,
          endDate: new Date(now.getTime() + 86400000),
        },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.notificationSchedule.getActiveSchedules();
      expect(result).toHaveLength(1);
    });
  });

  describe("getUpcoming", () => {
    test("returns upcoming schedules", async () => {
      setupAdminMocks();
      mockCtx.db.notificationSchedule.findMany.mockResolvedValueOnce([
        { id: "schedule-1", name: "Evening Alert" },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.notificationSchedule.getUpcoming({ days: 7 });
      expect(result).toHaveLength(1);
    });
  });

  describe("getById", () => {
    test("returns schedule when found", async () => {
      setupAdminMocks();
      mockCtx.db.notificationSchedule.findUnique.mockResolvedValueOnce({
        id: "schedule-1",
        name: "Morning Alert",
        createdBy: {
          id: "admin-1",
          firstName: "Admin",
          lastName: "User",
          authUserId: "auth-admin",
        },
        _count: { notificationExecutions: 5 },
      });
      const caller = createCaller(mockCtx);
      const result = await caller.notificationSchedule.getById({
        id: "schedule-1",
      });
      expect(result.name).toBe("Morning Alert");
    });

    test("throws NOT_FOUND when schedule not found", async () => {
      setupAdminMocks();
      mockCtx.db.notificationSchedule.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.notificationSchedule.getById({ id: "nonexistent" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getExecutionHistory", () => {
    test("returns execution history", async () => {
      setupAdminMocks();
      mockCtx.db.notificationScheduleExecution.findMany.mockResolvedValueOnce([
        {
          id: "exec-1",
          executedAt: new Date(),
          notification: { title: "Alert 1" },
        },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.notificationSchedule.getExecutionHistory({
        scheduleId: "schedule-1",
        limit: 10,
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("create", () => {
    test("creates schedule successfully", async () => {
      setupAdminMocks();
      const tomorrow = new Date(Date.now() + 86400000);
      const nextYear = new Date(Date.now() + 365 * 86400000);
      mockCtx.db.notificationSchedule.create.mockResolvedValueOnce({
        id: "new-schedule",
        name: "New Schedule",
        createdBy: {
          id: "admin-1",
          firstName: "Admin",
          lastName: "User",
          authUserId: "auth-admin",
        },
      });
      const caller = createCaller(mockCtx);
      const result = await caller.notificationSchedule.create({
        name: "New Schedule",
        tripId: "trip-1",
        notificationType: "custom",
        notificationTitle: "Title",
        notificationBody: "Body",
        notificationUrl: "/url",
        startDate: tomorrow,
        endDate: nextYear,
        hour: 9,
        minute: 0,
        isActive: true,
      });
      expect(result.name).toBe("New Schedule");
    });
  });

  describe("update", () => {
    test("updates schedule successfully", async () => {
      setupAdminMocks();
      mockCtx.db.notificationSchedule.findUnique.mockResolvedValueOnce({
        id: "schedule-1",
        name: "Old Name",
        notificationType: "custom",
        startDate: new Date(),
        endDate: new Date(),
        hour: 9,
        minute: 0,
      });
      mockCtx.db.notificationSchedule.update.mockResolvedValueOnce({
        id: "schedule-1",
        name: "Updated Name",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.notificationSchedule.update({
        id: "schedule-1",
        name: "Updated Name",
      });
      expect(result.name).toBe("Updated Name");
    });

    test("throws NOT_FOUND when schedule not found", async () => {
      setupAdminMocks();
      mockCtx.db.notificationSchedule.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.notificationSchedule.update({
          id: "nonexistent",
          name: "New Name",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("delete", () => {
    test("deletes schedule successfully", async () => {
      setupAdminMocks();
      mockCtx.db.notificationSchedule.findUnique.mockResolvedValueOnce({
        id: "schedule-1",
        name: "To Delete",
        _count: { notificationExecutions: 0 },
      });
      mockCtx.db.notificationSchedule.delete.mockResolvedValueOnce({
        id: "schedule-1",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.notificationSchedule.delete({
        id: "schedule-1",
      });
      expect(result.success).toBe(true);
    });

    test("throws NOT_FOUND when schedule not found", async () => {
      setupAdminMocks();
      mockCtx.db.notificationSchedule.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.notificationSchedule.delete({ id: "nonexistent" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("bulkDelete", () => {
    test("deletes multiple schedules", async () => {
      setupAdminMocks();
      mockCtx.db.notificationSchedule.findMany.mockResolvedValueOnce([
        { id: "schedule-1" },
        { id: "schedule-2" },
      ]);
      mockCtx.db.notificationSchedule.deleteMany.mockResolvedValueOnce({
        count: 2,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.notificationSchedule.bulkDelete({
        ids: ["schedule-1", "schedule-2"],
      });
      expect(result.deletedCount).toBe(2);
      expect(result.success).toBe(true);
    });
  });

  describe("toggleActive", () => {
    test("toggles schedule active status", async () => {
      setupAdminMocks();
      mockCtx.db.notificationSchedule.findUnique.mockResolvedValueOnce({
        id: "schedule-1",
        isActive: true,
      });
      mockCtx.db.notificationSchedule.update.mockResolvedValueOnce({
        id: "schedule-1",
        isActive: false,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.notificationSchedule.toggleActive({
        id: "schedule-1",
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe("bulkToggleActive", () => {
    test("toggles multiple schedules active status", async () => {
      setupAdminMocks();
      mockCtx.db.notificationSchedule.updateMany.mockResolvedValueOnce({
        count: 3,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.notificationSchedule.bulkToggleActive({
        ids: ["schedule-1", "schedule-2", "schedule-3"],
        isActive: false,
      });
      expect(result.updatedCount).toBe(3);
      expect(result.success).toBe(true);
    });
  });
});
