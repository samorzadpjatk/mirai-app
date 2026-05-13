 
 
 
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
    } as unknown as SupabaseClient;

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

       
      expect(mockDb.notificationDelivery.create).toHaveBeenCalledWith({
        data: {
          tripId: "trip-123",
          notificationId: "notification-123",
          scheduleId: "schedule-123",
           
          deliveryStartedAt: expect.any(Date),
          status: "pending",
        },
      });
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

       
      expect(mockDb.notificationDelivery.update).toHaveBeenCalledWith({
        where: { notificationId: "notification-123" },
        data: {
           
          deliveryCompletedAt: expect.any(Date),
          totalRecipients: 10,
          successCount: 10,
          failureCount: 0,
          errors: null,
          status: "success",
        },
      });
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

       
      expect(mockDb.notificationDelivery.update).toHaveBeenCalledWith(
         
        expect.objectContaining({
           
          data: expect.objectContaining({
            status: "partial_failure",
          }),
        })
      );
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

       
      expect(mockDb.notificationDelivery.update).toHaveBeenCalledWith(
         
        expect.objectContaining({
           
          data: expect.objectContaining({
            status: "failure",
            errors: "All tokens invalid",
          }),
        })
      );
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

       
      expect(mockDb.notificationDelivery.update).toHaveBeenCalledWith({
        where: { notificationId: "notification-123" },
        data: {
           
          deliveryCompletedAt: expect.any(Date),
          errors: "Network error",
          status: "failure",
        },
      });
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

       
      expect(mockDb.notificationDelivery.create).toHaveBeenCalledWith({
        data: {
          notificationId: "notification-123",
          scheduleId: "schedule-123",
          tripId: "trip-123",
           
          deliveryStartedAt: expect.any(Date),
           
          deliveryCompletedAt: expect.any(Date),
          errors: "Service unavailable",
          status: "failure",
        },
      });
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

       
      expect(mockDb.notificationDelivery.update).toHaveBeenCalledWith(
         
        expect.objectContaining({
           
          data: expect.objectContaining({
            errors: "Custom error message",
          }),
        })
      );
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
