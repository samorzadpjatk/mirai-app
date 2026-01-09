import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Prisma } from "@integral-2025-app/db";
import {
  trackDeliveryStart,
  trackDeliveryComplete,
  trackDeliveryFailure,
} from "../../services/deliveryTracker";

describe("DeliveryTracker", () => {
  let mockTx: Prisma.TransactionClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = {
      notificationScheduleExecution: {
        findFirst: vi.fn(),
      },
      notificationDelivery: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
    } as unknown as Prisma.TransactionClient;
  });

  describe("trackDeliveryStart", () => {
    it("should create delivery record with schedule link", async () => {
      const mockFindFirst = vi
        .fn()
        .mockResolvedValue({ scheduleId: "schedule-123" });
      const mockCreate = vi.fn().mockResolvedValue({
        id: "delivery-1",
        notificationId: "notif-123",
        scheduleId: "schedule-123",
        status: "pending",
      });

      mockTx.notificationScheduleExecution.findFirst = mockFindFirst;
      mockTx.notificationDelivery.create = mockCreate;

      await trackDeliveryStart(mockTx, "notif-123");

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: { notificationId: "notif-123" },
        select: { scheduleId: true },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          notificationId: "notif-123",
          scheduleId: "schedule-123",
          deliveryStartedAt: expect.any(Date),
          status: "pending",
        },
      });
    });

    it("should create delivery record without schedule link", async () => {
      const mockFindFirst = vi.fn().mockResolvedValue(null);
      const mockCreate = vi.fn().mockResolvedValue({
        id: "delivery-1",
        notificationId: "notif-456",
        scheduleId: null,
        status: "pending",
      });

      mockTx.notificationScheduleExecution.findFirst = mockFindFirst;
      mockTx.notificationDelivery.create = mockCreate;

      await trackDeliveryStart(mockTx, "notif-456");

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          notificationId: "notif-456",
          scheduleId: undefined,
          deliveryStartedAt: expect.any(Date),
          status: "pending",
        },
      });
    });

    it("should handle errors gracefully", async () => {
      const mockFindFirst = vi.fn().mockRejectedValue(new Error("DB error"));

      mockTx.notificationScheduleExecution.findFirst = mockFindFirst;

      // Should not throw
      await expect(
        trackDeliveryStart(mockTx, "notif-789"),
      ).resolves.not.toThrow();
    });
  });

  describe("trackDeliveryComplete", () => {
    it("should update delivery with success status when no failures", async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        id: "delivery-1",
        status: "success",
      });

      mockTx.notificationDelivery.update = mockUpdate;

      await trackDeliveryComplete(mockTx, {
        notificationId: "notif-123",
        totalRecipients: 10,
        successCount: 10,
        failureCount: 0,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { notificationId: "notif-123" },
        data: {
          deliveryCompletedAt: expect.any(Date),
          totalRecipients: 10,
          successCount: 10,
          failureCount: 0,
          errors: undefined,
          status: "success",
        },
      });
    });

    it("should update delivery with partial_failure status", async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        id: "delivery-1",
        status: "partial_failure",
      });

      mockTx.notificationDelivery.update = mockUpdate;

      await trackDeliveryComplete(mockTx, {
        notificationId: "notif-456",
        totalRecipients: 10,
        successCount: 7,
        failureCount: 3,
        errors: "3 tokens invalid",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { notificationId: "notif-456" },
        data: {
          deliveryCompletedAt: expect.any(Date),
          totalRecipients: 10,
          successCount: 7,
          failureCount: 3,
          errors: "3 tokens invalid",
          status: "partial_failure",
        },
      });
    });

    it("should update delivery with failure status when all failed", async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        id: "delivery-1",
        status: "failure",
      });

      mockTx.notificationDelivery.update = mockUpdate;

      await trackDeliveryComplete(mockTx, {
        notificationId: "notif-789",
        totalRecipients: 5,
        successCount: 0,
        failureCount: 5,
        errors: "All tokens invalid",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { notificationId: "notif-789" },
        data: {
          deliveryCompletedAt: expect.any(Date),
          totalRecipients: 5,
          successCount: 0,
          failureCount: 5,
          errors: "All tokens invalid",
          status: "failure",
        },
      });
    });

    it("should handle errors gracefully", async () => {
      const mockUpdate = vi.fn().mockRejectedValue(new Error("DB error"));

      mockTx.notificationDelivery.update = mockUpdate;

      // Should not throw
      await expect(
        trackDeliveryComplete(mockTx, {
          notificationId: "notif-123",
          totalRecipients: 10,
          successCount: 10,
          failureCount: 0,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("trackDeliveryFailure", () => {
    it("should update existing delivery record with failure", async () => {
      const mockFindUnique = vi.fn().mockResolvedValue({
        id: "delivery-1",
        notificationId: "notif-123",
        status: "pending",
      });
      const mockUpdate = vi.fn().mockResolvedValue({
        id: "delivery-1",
        status: "failure",
      });

      mockTx.notificationDelivery.findUnique = mockFindUnique;
      mockTx.notificationDelivery.update = mockUpdate;

      const error = new Error("Network timeout");
      await trackDeliveryFailure(mockTx, "notif-123", error);

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { notificationId: "notif-123" },
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { notificationId: "notif-123" },
        data: {
          deliveryCompletedAt: expect.any(Date),
          errors: "Network timeout",
          status: "failure",
        },
      });
    });

    it("should create new delivery record if not exists", async () => {
      const mockFindUnique = vi.fn().mockResolvedValue(null);
      const mockFindFirst = vi
        .fn()
        .mockResolvedValue({ scheduleId: "schedule-123" });
      const mockCreate = vi.fn().mockResolvedValue({
        id: "delivery-1",
        status: "failure",
      });

      mockTx.notificationDelivery.findUnique = mockFindUnique;
      mockTx.notificationScheduleExecution.findFirst = mockFindFirst;
      mockTx.notificationDelivery.create = mockCreate;

      await trackDeliveryFailure(
        mockTx,
        "notif-456",
        "Database connection lost",
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          notificationId: "notif-456",
          scheduleId: "schedule-123",
          deliveryStartedAt: expect.any(Date),
          deliveryCompletedAt: expect.any(Date),
          errors: "Database connection lost",
          status: "failure",
        },
      });
    });

    it("should handle Error objects", async () => {
      const mockFindUnique = vi.fn().mockResolvedValue({
        id: "delivery-1",
      });
      const mockUpdate = vi.fn().mockResolvedValue({});

      mockTx.notificationDelivery.findUnique = mockFindUnique;
      mockTx.notificationDelivery.update = mockUpdate;

      const error = new Error("Expo API error");
      await trackDeliveryFailure(mockTx, "notif-789", error);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { notificationId: "notif-789" },
        data: expect.objectContaining({
          errors: "Expo API error",
        }),
      });
    });

    it("should handle string errors", async () => {
      const mockFindUnique = vi.fn().mockResolvedValue({
        id: "delivery-1",
      });
      const mockUpdate = vi.fn().mockResolvedValue({});

      mockTx.notificationDelivery.findUnique = mockFindUnique;
      mockTx.notificationDelivery.update = mockUpdate;

      await trackDeliveryFailure(mockTx, "notif-101", "Simple error message");

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { notificationId: "notif-101" },
        data: expect.objectContaining({
          errors: "Simple error message",
        }),
      });
    });

    it("should handle errors gracefully", async () => {
      const mockFindUnique = vi.fn().mockRejectedValue(new Error("DB error"));

      mockTx.notificationDelivery.findUnique = mockFindUnique;

      // Should not throw
      await expect(
        trackDeliveryFailure(mockTx, "notif-999", "Some error"),
      ).resolves.not.toThrow();
    });
  });
});
