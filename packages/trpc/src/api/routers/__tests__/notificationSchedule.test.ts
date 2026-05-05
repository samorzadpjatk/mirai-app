import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { notificationScheduleRouter } from "../../routers/notificationSchedule";
import { createCallerFactory } from "../../trpc";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { PrismaClient, User, NotificationSchedule, Trip } from "@mirai-app/db";

// Mock the authEmails utilities
vi.mock("../../../utils/authEmails", () => ({
  buildAuthEmailLookup: vi.fn().mockResolvedValue(new Map([["auth-123", "test@example.com"]])),
  resolveAuthEmail: vi.fn().mockReturnValue("test@example.com"),
}));

// Mock the validation utilities
vi.mock("../../../utils/notificactionSchedule-validation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../utils/notificactionSchedule-validation")>();
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

const createCaller = createCallerFactory(notificationScheduleRouter);

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
const createMockSchedule = (overrides: Partial<NotificationSchedule> = {}): NotificationSchedule => ({
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
  let mockDb: PrismaClient;
  let mockSupabase: SupabaseClient;
  let mockModeratorUser: User;
  let mockAdminUser: User;

  beforeEach(() => {
    vi.clearAllMocks();

    mockModeratorUser = createMockUser({ id: "moderator-123", authUserId: "auth-123", role: "MODERATOR" });
    mockAdminUser = createMockUser({ id: "admin-123", authUserId: "auth-123", role: "ADMIN" });

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "moderator-123" } }, error: null }),
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
    } as unknown as SupabaseClient;

    // Setup mock database client
    mockDb = {
      user: {
        findFirst: vi.fn().mockResolvedValue(mockModeratorUser),
        findUnique: vi.fn().mockResolvedValue(mockModeratorUser),
      },
      notificationSchedule: {
        findMany: vi.fn().mockResolvedValue([createMockSchedule()]),
        findUnique: vi.fn().mockResolvedValue(createMockSchedule()),
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(1),
        create: vi.fn().mockResolvedValue(createMockSchedule()),
        update: vi.fn().mockResolvedValue(createMockSchedule()),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        delete: vi.fn().mockResolvedValue(createMockSchedule()),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      notificationScheduleExecution: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      trip: {
        findUnique: vi.fn().mockResolvedValue(createMockTrip()),
      },
    } as unknown as PrismaClient;
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

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(schedules);
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

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(schedules);
      (mockDb.notificationSchedule.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({
        filter: { tripId: "trip-123" },
      });

      expect(result.schedules).toHaveLength(1);
      expect(mockDb.notificationSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tripId: "trip-123" }),
        })
      );
    });

    it("should filter schedules by notification type", async () => {
      const schedules = [createMockSchedule({ id: "schedule-1", notificationType: "ranking" })];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(schedules);
      (mockDb.notificationSchedule.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({
        filter: { notificationType: "ranking" },
      });

      expect(result.schedules).toHaveLength(1);
      expect(mockDb.notificationSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ notificationType: "ranking" }),
        })
      );
    });

    it("should filter schedules by active status", async () => {
      const schedules = [createMockSchedule({ id: "schedule-1", isActive: true })];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(schedules);
      (mockDb.notificationSchedule.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({
        filter: { isActive: true },
      });

      expect(result.schedules).toHaveLength(1);
      expect(mockDb.notificationSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
    });

    it("should search schedules by name", async () => {
      const schedules = [createMockSchedule({ id: "schedule-1", name: "Daily Update" })];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(schedules);
      (mockDb.notificationSchedule.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({
        filter: { search: "daily" },
      });

      expect(result.schedules).toHaveLength(1);
      expect(mockDb.notificationSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: {
              contains: "daily",
              mode: "insensitive",
            },
          }),
        })
      );
    });
  });

  describe("getActiveSchedules", () => {
    it("should get currently active schedules", async () => {
      const schedules = [
        createMockSchedule({ id: "schedule-1", isActive: true }),
        createMockSchedule({ id: "schedule-2", isActive: true }),
      ];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(schedules);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getActiveSchedules();

      expect(result).toHaveLength(2);
      expect(mockDb.notificationSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            startDate: expect.any(Object),
            endDate: expect.any(Object),
          }),
        })
      );
    });

    it("should order schedules by hour and minute", async () => {
      const schedules = [
        createMockSchedule({ id: "schedule-1", hour: 8, minute: 0 }),
        createMockSchedule({ id: "schedule-2", hour: 9, minute: 30 }),
      ];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(schedules);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.getActiveSchedules();

      expect(mockDb.notificationSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ hour: "asc" }, { minute: "asc" }],
        })
      );
    });
  });

  describe("getUpcoming", () => {
    it("should get upcoming schedules for default 7 days", async () => {
      const schedules = [createMockSchedule({ id: "schedule-1" })];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(schedules);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getUpcoming();

      expect(result).toHaveLength(1);
      expect(mockDb.notificationSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            startDate: expect.any(Object),
            endDate: expect.any(Object),
          }),
        })
      );
    });

    it("should get upcoming schedules for custom days", async () => {
      const schedules = [createMockSchedule({ id: "schedule-1" })];

      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(schedules);

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

      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(schedule);

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

      await expect(caller.getById({ id: "non-existent" })).rejects.toThrow(TRPCError);
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

      (mockDb.notificationScheduleExecution.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(executions);

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

      (mockDb.notificationSchedule.create as ReturnType<typeof vi.fn>).mockResolvedValue(newSchedule);

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
      const { validateNotificationContent } = await import("../../../utils/notificactionSchedule-validation");

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
      (mockDb.notificationSchedule.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (mockDb.notificationSchedule.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockSchedule({ id: "template-schedule", name: "Daily Ranking" })
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
      (mockDb.notificationSchedule.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockSchedule({ id: "existing-schedule", name: "Daily Ranking" })
      );
      (mockDb.notificationSchedule.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockSchedule({ id: "existing-schedule", name: "Daily Ranking" })
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
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("update", () => {
    it("should update schedule successfully", async () => {
      const existingSchedule = createMockSchedule({ id: "schedule-123" });
      const updatedSchedule = createMockSchedule({
        id: "schedule-123",
        name: "Updated Name",
      });

      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existingSchedule);
      (mockDb.notificationSchedule.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedSchedule);

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
        })
      ).rejects.toThrow(TRPCError);
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

      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(schedule);
      (mockDb.notificationSchedule.delete as ReturnType<typeof vi.fn>).mockResolvedValue(schedule);

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

      await expect(caller.delete({ id: "non-existent" })).rejects.toThrow(TRPCError);
    });
  });

  describe("bulkDelete", () => {
    it("should delete multiple schedules", async () => {
      (mockDb.notificationSchedule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: "schedule-1" },
        { id: "schedule-2" },
      ]);
      (mockDb.notificationSchedule.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 2 });

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

      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(originalSchedule);
      (mockDb.notificationSchedule.create as ReturnType<typeof vi.fn>).mockResolvedValue(duplicatedSchedule);

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

      await expect(caller.duplicate({ id: "non-existent" })).rejects.toThrow(TRPCError);
    });
  });

  describe("toggleActive", () => {
    it("should toggle schedule active status to inactive", async () => {
      const schedule = createMockSchedule({ id: "schedule-123", isActive: true });
      const toggledSchedule = createMockSchedule({ id: "schedule-123", isActive: false });

      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(schedule);
      (mockDb.notificationSchedule.update as ReturnType<typeof vi.fn>).mockResolvedValue(toggledSchedule);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.toggleActive({ id: "schedule-123" });

      expect(result.isActive).toBe(false);
    });

    it("should toggle schedule active status to active", async () => {
      const schedule = createMockSchedule({ id: "schedule-123", isActive: false });
      const toggledSchedule = createMockSchedule({ id: "schedule-123", isActive: true });

      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(schedule);
      (mockDb.notificationSchedule.update as ReturnType<typeof vi.fn>).mockResolvedValue(toggledSchedule);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.toggleActive({ id: "schedule-123" });

      expect(result.isActive).toBe(true);
    });
  });

  describe("bulkToggleActive", () => {
    it("should bulk toggle schedules to active", async () => {
      (mockDb.notificationSchedule.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 3 });

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

      (mockDb.notificationSchedule.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(schedule);
      (mockDb.notificationSchedule.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedSchedule);

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
        })
      ).rejects.toThrow(TRPCError);
    });
  });
});
