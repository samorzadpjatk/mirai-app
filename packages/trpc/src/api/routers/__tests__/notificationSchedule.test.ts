import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { notificationScheduleRouter } from "../notificationSchedule";

describe("notificationScheduleRouter", () => {
  let mockContext: any;
  let mockNow: Date;

  beforeEach(() => {
    mockNow = new Date("2026-01-10T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
    vi.clearAllMocks();

    mockContext = {
      db: {
        notificationSchedule: {
          findMany: vi.fn(),
          findUnique: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          updateMany: vi.fn(),
          delete: vi.fn(),
          deleteMany: vi.fn(),
          count: vi.fn(),
        },
        notificationScheduleExecution: {
          findMany: vi.fn(),
        },
      },
      dbUser: {
        id: "mock-user-id",
        isAdmin: true,
        isModerator: true,
      },
      session: {
        user: {
          id: "auth-user-123",
        },
      },
    };
  });

  describe("getAll", () => {
    it("should return schedules with pagination", async () => {
      const mockSchedules = [
        {
          id: "schedule-1",
          name: "Test Schedule 1",
          notificationType: "ranking",
          startDate: new Date("2026-01-15T10:00:00.000Z"),
          endDate: new Date("2026-01-20T10:00:00.000Z"),
          hour: 10,
          minute: 0,
          isActive: true,
          lastRun: null,
          createdAt: new Date("2026-01-05T10:00:00.000Z"),
          updatedAt: new Date("2026-01-05T10:00:00.000Z"),
          createdById: "mock-user-id",
          createdBy: {
            id: "mock-user-id",
            name: "Mock User",
            email: "mock@example.com",
          },
          _count: {
            notificationExecutions: 5,
          },
        },
      ];

      mockContext.db.notificationSchedule.findMany.mockResolvedValue(
        mockSchedules,
      );
      mockContext.db.notificationSchedule.count.mockResolvedValue(1);

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.getAll();

      expect(result.schedules).toEqual(mockSchedules);
      expect(result.pagination).toEqual({
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      });
    });

    it("should apply filters correctly", async () => {
      mockContext.db.notificationSchedule.findMany.mockResolvedValue([]);
      mockContext.db.notificationSchedule.count.mockResolvedValue(0);

      const caller = notificationScheduleRouter.createCaller(mockContext);
      await caller.getAll({
        filter: {
          notificationType: "custom",
          isActive: true,
          search: "test",
        },
      });

      expect(mockContext.db.notificationSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            notificationType: "custom",
            isActive: true,
            name: {
              contains: "test",
              mode: "insensitive",
            },
          }),
        }),
      );
    });

    it("should apply pagination correctly", async () => {
      mockContext.db.notificationSchedule.findMany.mockResolvedValue([]);
      mockContext.db.notificationSchedule.count.mockResolvedValue(150);

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.getAll({
        pagination: {
          limit: 20,
          offset: 40,
        },
      });

      expect(mockContext.db.notificationSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 40,
        }),
      );

      expect(result.pagination.hasMore).toBe(true);
    });
  });

  describe("getActiveSchedules", () => {
    it("should return only active schedules within date range", async () => {
      const mockSchedules = [
        {
          id: "schedule-1",
          name: "Active Schedule",
          isActive: true,
          startDate: new Date("2026-01-05T10:00:00.000Z"),
          endDate: new Date("2026-01-15T10:00:00.000Z"),
          createdBy: {
            id: "mock-user-id",
            name: "Mock User",
          },
        },
      ];

      mockContext.db.notificationSchedule.findMany.mockResolvedValue(
        mockSchedules,
      );

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.getActiveSchedules();

      expect(result).toEqual(mockSchedules);
      expect(mockContext.db.notificationSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            startDate: { lte: expect.any(Date) },
            endDate: { gte: expect.any(Date) },
          },
        }),
      );
    });
  });

  describe("getUpcoming", () => {
    it("should return upcoming schedules for default 7 days", async () => {
      mockContext.db.notificationSchedule.findMany.mockResolvedValue([]);

      const caller = notificationScheduleRouter.createCaller(mockContext);
      await caller.getUpcoming();

      const expectedFutureDate = new Date(mockNow);
      expectedFutureDate.setDate(expectedFutureDate.getDate() + 7);

      expect(mockContext.db.notificationSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            startDate: { lte: expect.any(Date) },
            endDate: { gte: expect.any(Date) },
          }),
        }),
      );
    });

    it("should respect custom days parameter", async () => {
      mockContext.db.notificationSchedule.findMany.mockResolvedValue([]);

      const caller = notificationScheduleRouter.createCaller(mockContext);
      await caller.getUpcoming({ days: 14 });

      expect(mockContext.db.notificationSchedule.findMany).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should return schedule by ID", async () => {
      const mockSchedule = {
        id: "schedule-1",
        name: "Test Schedule",
        notificationType: "custom",
        notificationTitle: "Test",
        notificationBody: "Test body",
        startDate: new Date("2026-01-15T10:00:00.000Z"),
        endDate: new Date("2026-01-20T10:00:00.000Z"),
        hour: 10,
        minute: 0,
        isActive: true,
        lastRun: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: "mock-user-id",
        createdBy: {
          id: "mock-user-id",
          name: "Mock User",
          email: "mock@example.com",
        },
        _count: {
          notificationExecutions: 0,
        },
      };

      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(
        mockSchedule,
      );

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.getById({ id: "schedule-1" });

      expect(result).toEqual(mockSchedule);
    });

    it("should throw error when schedule not found", async () => {
      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(null);

      const caller = notificationScheduleRouter.createCaller(mockContext);

      await expect(caller.getById({ id: "non-existent" })).rejects.toThrow(
        TRPCError,
      );
      await expect(caller.getById({ id: "non-existent" })).rejects.toThrow(
        /not found/,
      );
    });
  });

  describe("getExecutionHistory", () => {
    it("should return execution history for a schedule", async () => {
      const mockHistory = [
        {
          notificationId: "notif-1",
          scheduleId: "schedule-1",
          executedAt: new Date("2026-01-09T10:00:00.000Z"),
          notification: {
            id: "notif-1",
            title: "Daily Ranking",
            body: "Check rankings",
            createdAt: new Date("2026-01-09T10:00:00.000Z"),
          },
        },
      ];

      mockContext.db.notificationScheduleExecution.findMany.mockResolvedValue(
        mockHistory,
      );

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.getExecutionHistory({
        scheduleId: "schedule-1",
      });

      expect(result).toEqual(mockHistory);
      expect(
        mockContext.db.notificationScheduleExecution.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { scheduleId: "schedule-1" },
          take: 20,
        }),
      );
    });

    it("should respect limit parameter", async () => {
      mockContext.db.notificationScheduleExecution.findMany.mockResolvedValue(
        [],
      );

      const caller = notificationScheduleRouter.createCaller(mockContext);
      await caller.getExecutionHistory({
        scheduleId: "schedule-1",
        limit: 50,
      });

      expect(
        mockContext.db.notificationScheduleExecution.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });
  });

  describe("create", () => {
    it("should create a custom notification schedule", async () => {
      const mockSchedule = {
        id: "schedule-1",
        name: "Test Schedule",
        notificationType: "custom",
        notificationTitle: "Test Title",
        notificationBody: "Test Body",
        startDate: new Date("2026-01-15T10:00:00.000Z"),
        endDate: new Date("2026-01-20T10:00:00.000Z"),
        hour: 10,
        minute: 0,
        isActive: true,
        lastRun: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: "mock-user-id",
        createdBy: {
          id: "mock-user-id",
          name: "Mock User",
          email: "mock@example.com",
        },
      };

      mockContext.db.notificationSchedule.create.mockResolvedValue(
        mockSchedule,
      );

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.create({
        name: "Test Schedule",
        notificationType: "custom",
        notificationTitle: "Test Title",
        notificationBody: "Test Body",
        startDate: new Date("2026-01-15T10:00:00.000Z"),
        endDate: new Date("2026-01-20T10:00:00.000Z"),
        hour: 10,
        minute: 0,
        isActive: true,
      });

      expect(result).toEqual(mockSchedule);
      expect(mockContext.db.notificationSchedule.create).toHaveBeenCalled();
    });

    it("should create a ranking notification schedule", async () => {
      const mockSchedule = {
        id: "schedule-1",
        name: "Daily Ranking",
        notificationType: "ranking",
        notificationTitle: null,
        notificationBody: null,
        startDate: new Date("2026-01-15T10:00:00.000Z"),
        endDate: new Date("2026-02-15T10:00:00.000Z"),
        hour: 14,
        minute: 30,
        isActive: true,
        lastRun: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: "mock-user-id",
        createdBy: {
          id: "mock-user-id",
          name: "Mock User",
          email: "mock@example.com",
        },
      };

      mockContext.db.notificationSchedule.create.mockResolvedValue(
        mockSchedule,
      );

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.create({
        name: "Daily Ranking",
        notificationType: "ranking",
        startDate: new Date("2026-01-15T10:00:00.000Z"),
        endDate: new Date("2026-02-15T10:00:00.000Z"),
        hour: 14,
        minute: 30,
        isActive: true,
      });

      expect(result).toEqual(mockSchedule);
    });

    it("should throw error for custom type without title", async () => {
      const caller = notificationScheduleRouter.createCaller(mockContext);

      await expect(
        caller.create({
          name: "Test",
          notificationType: "custom",
          notificationBody: "Test Body",
          startDate: new Date("2026-01-15T10:00:00.000Z"),
          endDate: new Date("2026-01-20T10:00:00.000Z"),
          hour: 10,
          minute: 0,
        }),
      ).rejects.toThrow(/title is required/);
    });

    it("should throw error when end date is before start date", async () => {
      const caller = notificationScheduleRouter.createCaller(mockContext);

      await expect(
        caller.create({
          name: "Test",
          notificationType: "ranking",
          startDate: new Date("2026-01-20T10:00:00.000Z"),
          endDate: new Date("2026-01-15T10:00:00.000Z"),
          hour: 10,
          minute: 0,
        }),
      ).rejects.toThrow(/must be after start date/);
    });

    it("should throw error when start date is in the past", async () => {
      const caller = notificationScheduleRouter.createCaller(mockContext);

      await expect(
        caller.create({
          name: "Test",
          notificationType: "ranking",
          startDate: new Date("2026-01-05T10:00:00.000Z"),
          endDate: new Date("2026-01-20T10:00:00.000Z"),
          hour: 10,
          minute: 0,
        }),
      ).rejects.toThrow(/cannot be in the past/);
    });

    it("should throw error when duration is less than 24 hours", async () => {
      const caller = notificationScheduleRouter.createCaller(mockContext);

      await expect(
        caller.create({
          name: "Test",
          notificationType: "ranking",
          startDate: new Date("2026-01-15T10:00:00.000Z"),
          endDate: new Date("2026-01-15T20:00:00.000Z"),
          hour: 10,
          minute: 0,
        }),
      ).rejects.toThrow(/at least 24 hours/);
    });
  });

  describe("update", () => {
    it("should update a schedule", async () => {
      const existingSchedule = {
        id: "schedule-1",
        name: "Old Name",
        notificationType: "custom",
        notificationTitle: "Old Title",
        notificationBody: "Old Body",
        startDate: new Date("2026-01-15T10:00:00.000Z"),
        endDate: new Date("2026-01-20T10:00:00.000Z"),
        hour: 10,
        minute: 0,
        isActive: true,
        lastRun: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: "mock-user-id",
      };

      const updatedSchedule = {
        ...existingSchedule,
        name: "New Name",
        createdBy: {
          id: "mock-user-id",
          name: "Mock User",
          email: "mock@example.com",
        },
      };

      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(
        existingSchedule,
      );
      mockContext.db.notificationSchedule.update.mockResolvedValue(
        updatedSchedule,
      );

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.update({
        id: "schedule-1",
        name: "New Name",
      });

      expect(result.name).toBe("New Name");
      expect(mockContext.db.notificationSchedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "schedule-1" },
          data: { name: "New Name" },
        }),
      );
    });

    it("should throw error when schedule not found", async () => {
      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(null);

      const caller = notificationScheduleRouter.createCaller(mockContext);

      await expect(
        caller.update({
          id: "non-existent",
          name: "New Name",
        }),
      ).rejects.toThrow(/not found/);
    });

    it("should validate dates when updating", async () => {
      const existingSchedule = {
        id: "schedule-1",
        name: "Test",
        notificationType: "ranking",
        notificationTitle: null,
        notificationBody: null,
        startDate: new Date("2026-01-15T10:00:00.000Z"),
        endDate: new Date("2026-01-20T10:00:00.000Z"),
        hour: 10,
        minute: 0,
        isActive: true,
        lastRun: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: "mock-user-id",
      };

      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(
        existingSchedule,
      );

      const caller = notificationScheduleRouter.createCaller(mockContext);

      await expect(
        caller.update({
          id: "schedule-1",
          endDate: new Date("2026-01-14T10:00:00.000Z"),
        }),
      ).rejects.toThrow(/must be after start date/);
    });

    it("should reject empty string for custom notification title", async () => {
      const existingSchedule = {
        id: "schedule-1",
        name: "Test",
        notificationType: "custom",
        notificationTitle: "Valid Title",
        notificationBody: "Valid Body",
        startDate: new Date("2026-01-15T10:00:00.000Z"),
        endDate: new Date("2026-01-20T10:00:00.000Z"),
        hour: 10,
        minute: 0,
        isActive: true,
        lastRun: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: "mock-user-id",
      };

      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(
        existingSchedule,
      );

      const caller = notificationScheduleRouter.createCaller(mockContext);

      await expect(
        caller.update({
          id: "schedule-1",
          notificationTitle: "",
        }),
      ).rejects.toThrow(/title is required/);
    });

    it("should reject empty string for custom notification body", async () => {
      const existingSchedule = {
        id: "schedule-1",
        name: "Test",
        notificationType: "custom",
        notificationTitle: "Valid Title",
        notificationBody: "Valid Body",
        startDate: new Date("2026-01-15T10:00:00.000Z"),
        endDate: new Date("2026-01-20T10:00:00.000Z"),
        hour: 10,
        minute: 0,
        isActive: true,
        lastRun: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: "mock-user-id",
      };

      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(
        existingSchedule,
      );

      const caller = notificationScheduleRouter.createCaller(mockContext);

      await expect(
        caller.update({
          id: "schedule-1",
          notificationBody: "   ",
        }),
      ).rejects.toThrow(/body is required/);
    });
  });

  describe("delete", () => {
    it("should delete a schedule", async () => {
      const mockSchedule = {
        id: "schedule-1",
        name: "Test Schedule",
        _count: {
          notificationExecutions: 3,
        },
      };

      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(
        mockSchedule,
      );
      mockContext.db.notificationSchedule.delete.mockResolvedValue(
        mockSchedule,
      );

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.delete({ id: "schedule-1" });

      expect(result.success).toBe(true);
      expect(result.message).toContain("3 execution records");
      expect(mockContext.db.notificationSchedule.delete).toHaveBeenCalledWith({
        where: { id: "schedule-1" },
      });
    });

    it("should throw error when schedule not found", async () => {
      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(null);

      const caller = notificationScheduleRouter.createCaller(mockContext);

      await expect(caller.delete({ id: "non-existent" })).rejects.toThrow(
        /not found/,
      );
    });
  });

  describe("bulkDelete", () => {
    it("should delete multiple schedules", async () => {
      mockContext.db.notificationSchedule.findMany.mockResolvedValue([
        { id: "schedule-1" },
        { id: "schedule-2" },
        { id: "schedule-3" },
      ]);
      mockContext.db.notificationSchedule.deleteMany.mockResolvedValue({
        count: 3,
      });

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.bulkDelete({
        ids: ["schedule-1", "schedule-2", "schedule-3"],
      });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(3);
      expect(result.requestedCount).toBe(3);
      expect(result.notFoundIds).toBeUndefined();
    });

    it("should report non-existent IDs", async () => {
      mockContext.db.notificationSchedule.findMany.mockResolvedValue([
        { id: "schedule-1" },
        { id: "schedule-2" },
      ]);
      mockContext.db.notificationSchedule.deleteMany.mockResolvedValue({
        count: 2,
      });

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.bulkDelete({
        ids: ["schedule-1", "schedule-2", "non-existent"],
      });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
      expect(result.requestedCount).toBe(3);
      expect(result.notFoundIds).toEqual(["non-existent"]);
    });
  });

  describe("duplicate", () => {
    it("should duplicate a schedule with new dates", async () => {
      const originalSchedule = {
        id: "schedule-1",
        name: "Original Schedule",
        notificationType: "ranking",
        notificationTitle: null,
        notificationBody: null,
        startDate: new Date("2026-01-15T10:00:00.000Z"),
        endDate: new Date("2026-01-20T10:00:00.000Z"),
        hour: 10,
        minute: 0,
        isActive: true,
        lastRun: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: "mock-user-id",
      };

      const newSchedule = {
        ...originalSchedule,
        id: "schedule-2",
        name: "Original Schedule (Copy)",
        isActive: false,
        startDate: new Date("2026-01-25T10:00:00.000Z"),
        endDate: new Date("2026-01-30T10:00:00.000Z"),
        createdBy: {
          id: "mock-user-id",
          name: "Mock User",
          email: "mock@example.com",
        },
      };

      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(
        originalSchedule,
      );
      mockContext.db.notificationSchedule.create.mockResolvedValue(newSchedule);

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.duplicate({
        id: "schedule-1",
        startDate: new Date("2026-01-25T10:00:00.000Z"),
      });

      expect(result.name).toContain("(Copy)");
      expect(result.isActive).toBe(false);
    });

    it("should throw error when original schedule not found", async () => {
      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(null);

      const caller = notificationScheduleRouter.createCaller(mockContext);

      await expect(caller.duplicate({ id: "non-existent" })).rejects.toThrow(
        /not found/,
      );
    });
  });

  describe("toggleActive", () => {
    it("should toggle schedule active status", async () => {
      const schedule = {
        id: "schedule-1",
        isActive: true,
      };

      const updatedSchedule = {
        ...schedule,
        isActive: false,
        createdBy: {
          id: "mock-user-id",
          name: "Mock User",
          email: "mock@example.com",
        },
      };

      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(
        schedule,
      );
      mockContext.db.notificationSchedule.update.mockResolvedValue(
        updatedSchedule,
      );

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.toggleActive({ id: "schedule-1" });

      expect(result.isActive).toBe(false);
    });

    it("should throw error when schedule not found", async () => {
      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(null);

      const caller = notificationScheduleRouter.createCaller(mockContext);

      await expect(caller.toggleActive({ id: "non-existent" })).rejects.toThrow(
        /not found/,
      );
    });
  });

  describe("bulkToggleActive", () => {
    it("should toggle multiple schedules", async () => {
      mockContext.db.notificationSchedule.updateMany.mockResolvedValue({
        count: 5,
      });

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.bulkToggleActive({
        ids: [
          "schedule-1",
          "schedule-2",
          "schedule-3",
          "schedule-4",
          "schedule-5",
        ],
        isActive: false,
      });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(5);
    });
  });

  describe("updateLastRun", () => {
    it("should update last run timestamp", async () => {
      const schedule = {
        id: "schedule-1",
        lastRun: null,
      };

      const updatedSchedule = {
        ...schedule,
        lastRun: new Date("2026-01-10T10:00:00.000Z"),
      };

      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(
        schedule,
      );
      mockContext.db.notificationSchedule.update.mockResolvedValue(
        updatedSchedule,
      );

      const caller = notificationScheduleRouter.createCaller(mockContext);
      const result = await caller.updateLastRun({
        id: "schedule-1",
        lastRun: new Date("2026-01-10T10:00:00.000Z"),
      });

      expect(result.lastRun).toEqual(new Date("2026-01-10T10:00:00.000Z"));
    });

    it("should throw error when schedule not found", async () => {
      mockContext.db.notificationSchedule.findUnique.mockResolvedValue(null);

      const caller = notificationScheduleRouter.createCaller(mockContext);

      await expect(
        caller.updateLastRun({
          id: "non-existent",
          lastRun: new Date(),
        }),
      ).rejects.toThrow(/not found/);
    });
  });
});
