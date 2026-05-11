 
 
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORPCError } from "@orpc/server";
import { ORPCError } from "@orpc/server";
import { notificationDeliveryRouter } from "../../routers/notificationDelivery";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { PrismaClient, User, NotificationDelivery, Notification } from "@mirai-app/db";

// Mock the authEmails utilities
vi.mock("../../../utils/authEmails", () => ({
  buildAuthEmailLookup: vi.fn().mockResolvedValue(new Map([["auth-123", "test@example.com"]])),
  resolveAuthEmail: vi.fn().mockReturnValue("test@example.com"),
}));

// Mock @mirai-app/auth
vi.mock("@mirai-app/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    id: "admin-123",
    authUserId: "admin-123",
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

const createCaller = (ctx: TRPCContext) => createRouterClient(notificationDeliveryRouter, { context: ctx });

// Helper to create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "admin-123",
  authUserId: "auth-123",
  firstName: "Test",
  lastName: "Admin",
  role: "ADMIN",
  hasAvatar: false,
  lastSeenOn: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock notification delivery
const createMockDelivery = (overrides: Partial<NotificationDelivery> = {}): NotificationDelivery => ({
  id: "delivery-123",
  notificationId: "notification-123",
  tripId: "trip-123",
  scheduleId: null,
  deliveryStartedAt: new Date(),
  deliveryCompletedAt: null,
  totalRecipients: 10,
  successCount: 8,
  failureCount: 2,
  errors: null,
  status: "success",
  ...overrides,
});

// Helper to create mock notification
const createMockNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: "notification-123",
  title: "Test Notification",
  body: "Test body",
  url: "/test",
  createdById: "admin-123",
  tripId: "trip-123",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("notificationDeliveryRouter", () => {
  let mockDb: PrismaClient;
  let mockSupabase: SupabaseClient;
  let mockAdminUser: User;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdminUser = createMockUser({ id: "admin-123", authUserId: "auth-123", role: "ADMIN" });

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-123" } }, error: null }),
        getSession: vi.fn(),
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-123", email: "admin@example.com" } },
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
        findFirst: vi.fn().mockResolvedValue(mockAdminUser),
        findUnique: vi.fn().mockResolvedValue(mockAdminUser),
      },
      notificationDelivery: {
        findMany: vi.fn().mockResolvedValue([createMockDelivery()]),
        findUnique: vi.fn().mockResolvedValue(createMockDelivery()),
        count: vi.fn().mockResolvedValue(1),
        aggregate: vi.fn().mockResolvedValue({
          _count: { id: 1 },
          _sum: { totalRecipients: 10, successCount: 8, failureCount: 2 },
          _avg: { successCount: 8, failureCount: 2 },
        }),
        groupBy: vi.fn().mockResolvedValue([{ status: "success", _count: { id: 1 } }]),
      },
      notification: {
        findUnique: vi.fn().mockResolvedValue(createMockNotification()),
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

  describe("getDeliveries", () => {
    it("should get deliveries with pagination", async () => {
      const deliveries = [
        createMockDelivery({ id: "delivery-1", status: "success" }),
        createMockDelivery({ id: "delivery-2", status: "failure" }),
      ];

      (mockDb.notificationDelivery.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(deliveries);
      (mockDb.notificationDelivery.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.getDeliveries({
        tripId: "trip-123",
        limit: 10,
        offset: 0,
      });

      expect(result.deliveries).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it("should filter deliveries by status", async () => {
      const deliveries = [createMockDelivery({ id: "delivery-1", status: "success" })];

      (mockDb.notificationDelivery.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(deliveries);
      (mockDb.notificationDelivery.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.getDeliveries({
        tripId: "trip-123",
        status: "success",
      });

      expect(result.deliveries).toHaveLength(1);
      expect(result.deliveries[0].status).toBe("success");
    });

    it("should filter deliveries by date range", async () => {
      const deliveries = [createMockDelivery({ id: "delivery-1" })];

      (mockDb.notificationDelivery.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(deliveries);
      (mockDb.notificationDelivery.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");

      const result = await caller.getDeliveries({
        tripId: "trip-123",
        startDate,
        endDate,
      });

      expect(result.deliveries).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.notificationDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
           
          where: expect.objectContaining({
            tripId: "trip-123",
            deliveryStartedAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it("should filter deliveries by scheduleId", async () => {
      const deliveries = [createMockDelivery({ id: "delivery-1", scheduleId: "schedule-123" })];

      (mockDb.notificationDelivery.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(deliveries);
      (mockDb.notificationDelivery.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.getDeliveries({
        tripId: "trip-123",
        scheduleId: "schedule-123",
      });

      expect(result.deliveries).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.notificationDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
           
          where: expect.objectContaining({
            tripId: "trip-123",
            scheduleId: "schedule-123",
          }),
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      (mockDb.notificationDelivery.findMany as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Database error"));

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(
        caller.getDeliveries({
          tripId: "trip-123",
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("getDeliveryByNotificationId", () => {
    it("should get delivery by notification id with creator email", async () => {
      const delivery = createMockDelivery({
        id: "delivery-1",
        notificationId: "notification-123",
        notification: {
          id: "notification-123",
          title: "Test",
          body: "Test body",
          url: "/test",
          createdAt: new Date(),
          tripId: "trip-123",
          createdBy: {
            id: "admin-123",
            firstName: "Test",
            lastName: "Admin",
            authUserId: "auth-123",
          },
        },
      });

      (mockDb.notificationDelivery.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(delivery);

      const { buildAuthEmailLookup, resolveAuthEmail } = await import("../../../utils/authEmails");

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.getDeliveryByNotificationId({
        notificationId: "notification-123",
        tripId: "trip-123",
      });

      expect(result.notificationId).toBe("notification-123");
      expect(buildAuthEmailLookup).toHaveBeenCalled();
      expect(resolveAuthEmail).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when delivery belongs to different trip", async () => {
      const delivery = createMockDelivery({
        id: "delivery-1",
        tripId: "different-trip",
        notificationId: "notification-123",
      });

      (mockDb.notificationDelivery.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(delivery);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(
        caller.getDeliveryByNotificationId({
          notificationId: "notification-123",
          tripId: "trip-123",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND when delivery does not exist", async () => {
      (mockDb.notificationDelivery.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(
        caller.getDeliveryByNotificationId({
          notificationId: "non-existent",
          tripId: "trip-123",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should return delivery without email when creator has no authUserId", async () => {
      const delivery = createMockDelivery({
        id: "delivery-1",
        notificationId: "notification-123",
        notification: {
          id: "notification-123",
          title: "Test",
          body: "Test body",
          url: "/test",
          createdAt: new Date(),
          tripId: "trip-123",
          createdBy: {
            id: "admin-123",
            firstName: "Test",
            lastName: "Admin",
            authUserId: null,
          },
        },
      });

      (mockDb.notificationDelivery.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(delivery);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.getDeliveryByNotificationId({
        notificationId: "notification-123",
        tripId: "trip-123",
      });

      expect(result.notificationId).toBe("notification-123");
    });
  });

  describe("getDeliveryStats", () => {
    it("should get delivery statistics", async () => {
      (mockDb.notificationDelivery.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
        _count: { id: 5 },
        _sum: { totalRecipients: 50, successCount: 45, failureCount: 5 },
        _avg: { successCount: 9, failureCount: 1 },
      });
      (mockDb.notificationDelivery.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { status: "success", _count: { id: 3 } },
        { status: "failure", _count: { id: 1 } },
        { status: "partial_failure", _count: { id: 1 } },
      ]);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.getDeliveryStats({
        tripId: "trip-123",
      });

      expect(result.totalDeliveries).toBe(5);
      expect(result.totalRecipients).toBe(50);
      expect(result.totalSuccess).toBe(45);
      expect(result.totalFailures).toBe(5);
      expect(result.successRate).toBe(90);
      expect(result.statusBreakdown).toEqual({
        success: 3,
        failure: 1,
        partial_failure: 1,
      });
    });

    it("should calculate success rate as 0 when no recipients", async () => {
      (mockDb.notificationDelivery.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
        _count: { id: 0 },
        _sum: { totalRecipients: 0, successCount: 0, failureCount: 0 },
        _avg: { successCount: 0, failureCount: 0 },
      });
      (mockDb.notificationDelivery.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.getDeliveryStats({
        tripId: "trip-123",
      });

      expect(result.totalDeliveries).toBe(0);
      expect(result.totalRecipients).toBe(0);
      expect(result.successRate).toBe(0);
    });

    it("should filter stats by date range", async () => {
      (mockDb.notificationDelivery.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
        _count: { id: 2 },
        _sum: { totalRecipients: 20, successCount: 18, failureCount: 2 },
        _avg: { successCount: 9, failureCount: 1 },
      });
      (mockDb.notificationDelivery.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { status: "success", _count: { id: 2 } },
      ]);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-06-30");

      const result = await caller.getDeliveryStats({
        tripId: "trip-123",
        startDate,
        endDate,
      });

      expect(result.totalDeliveries).toBe(2);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.notificationDelivery.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
           
          where: expect.objectContaining({
            tripId: "trip-123",
            deliveryStartedAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it("should filter stats by scheduleId", async () => {
      (mockDb.notificationDelivery.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
        _count: { id: 3 },
        _sum: { totalRecipients: 30, successCount: 30, failureCount: 0 },
        _avg: { successCount: 10, failureCount: 0 },
      });
      (mockDb.notificationDelivery.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { status: "success", _count: { id: 3 } },
      ]);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.getDeliveryStats({
        tripId: "trip-123",
        scheduleId: "schedule-123",
      });

      expect(result.totalDeliveries).toBe(3);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.notificationDelivery.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
           
          where: expect.objectContaining({
            tripId: "trip-123",
            scheduleId: "schedule-123",
          }),
        })
      );
    });
  });

  describe("getFailedDeliveries", () => {
    it("should get failed and partial failure deliveries", async () => {
      const failedDeliveries = [
        createMockDelivery({ id: "delivery-1", status: "failure" }),
        createMockDelivery({ id: "delivery-2", status: "partial_failure" }),
      ];

      (mockDb.notificationDelivery.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(failedDeliveries);
      (mockDb.notificationDelivery.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.getFailedDeliveries({
        tripId: "trip-123",
      });

      expect(result.deliveries).toHaveLength(2);
      expect(result.total).toBe(2);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.notificationDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
           
          where: expect.objectContaining({
            tripId: "trip-123",
            OR: [{ status: "failure" }, { status: "partial_failure" }],
          }),
        })
      );
    });

    it("should paginate failed deliveries", async () => {
      const failedDeliveries = [createMockDelivery({ id: "delivery-1", status: "failure" })];

      (mockDb.notificationDelivery.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(failedDeliveries);
      (mockDb.notificationDelivery.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.getFailedDeliveries({
        tripId: "trip-123",
        limit: 1,
        offset: 0,
      });

      expect(result.deliveries).toHaveLength(1);
      expect(result.total).toBe(5);
      expect(result.limit).toBe(1);
      expect(result.offset).toBe(0);
    });

    it("should include notification details in failed deliveries", async () => {
      const failedDelivery = createMockDelivery({
        id: "delivery-1",
        status: "failure",
        notification: {
          id: "notification-123",
          title: "Failed Notification",
          body: "Test body",
          createdAt: new Date(),
          createdBy: {
            id: "admin-123",
            firstName: "Test",
            lastName: "Admin",
          },
        },
      });

      (mockDb.notificationDelivery.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([failedDelivery]);
      (mockDb.notificationDelivery.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.getFailedDeliveries({
        tripId: "trip-123",
      });

      expect(result.deliveries[0].notification).toBeDefined();
      expect(result.deliveries[0].notification.title).toBe("Failed Notification");
    });

    it("should handle database errors", async () => {
      (mockDb.notificationDelivery.findMany as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Database error"));

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(
        caller.getFailedDeliveries({
          tripId: "trip-123",
        })
      ).rejects.toThrow(ORPCError);
    });
  });
});
