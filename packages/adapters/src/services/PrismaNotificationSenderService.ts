import type { Prisma, PrismaClient } from "@repo/frameworks/prisma";

/**
 * PrismaNotificationSenderService
 *
 * Handles notification delivery tracking operations.
 * Encapsulates Prisma queries for delivery creation and updates.
 */
export class PrismaNotificationSenderService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Track delivery start for a notification
   */
  async trackDeliveryStart(input: {
    notificationId: string;
  }): Promise<{ success: true } | { success: false; error: string }> {
    try {
      const scheduleExecution =
        await this.prisma.notificationScheduleExecution.findFirst({
          where: { notificationId: input.notificationId },
          select: { schedule: { select: { id: true, tripId: true } } },
        });

      await this.prisma.notificationDelivery.create({
        data: {
          tripId: scheduleExecution?.schedule.tripId,
          notificationId: input.notificationId,
          scheduleId: scheduleExecution?.schedule.id,
          deliveryStartedAt: new Date(),
          status: "pending",
        },
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to track delivery start" };
    }
  }

  /**
   * Track delivery completion for a notification
   */
  async trackDeliveryComplete(input: {
    notificationId: string;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    errors: string | null;
  }): Promise<{ success: true } | { success: false; error: string }> {
    try {
      const status =
        input.failureCount === 0
          ? "success"
          : input.successCount === 0
            ? "failure"
            : "partial_failure";

      await this.prisma.notificationDelivery.update({
        where: { notificationId: input.notificationId },
        data: {
          deliveryCompletedAt: new Date(),
          totalRecipients: input.totalRecipients,
          successCount: input.successCount,
          failureCount: input.failureCount,
          errors: input.errors,
          status,
        },
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to track delivery completion" };
    }
  }

  /**
   * Track delivery failure for a notification
   */
  async trackDeliveryFailure(input: {
    notificationId: string;
    error: string | Error;
  }): Promise<{ success: true } | { success: false; error: string }> {
    try {
      const errorMessage =
        input.error instanceof Error
          ? input.error.message
          : String(input.error);

      const existing = await this.prisma.notificationDelivery.findUnique({
        where: { notificationId: input.notificationId },
      });

      if (existing) {
        await this.prisma.notificationDelivery.update({
          where: { notificationId: input.notificationId },
          data: {
            deliveryCompletedAt: new Date(),
            errors: errorMessage,
            status: "failure",
          },
        });
      } else {
        const scheduleExecution =
          await this.prisma.notificationScheduleExecution.findFirst({
            where: { notificationId: input.notificationId },
            select: { schedule: { select: { id: true, tripId: true } } },
          });

        await this.prisma.notificationDelivery.create({
          data: {
            notificationId: input.notificationId,
            scheduleId: scheduleExecution?.schedule.id,
            tripId: scheduleExecution?.schedule.tripId,
            deliveryStartedAt: new Date(),
            deliveryCompletedAt: new Date(),
            errors: errorMessage,
            status: "failure",
          },
        });
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: "Failed to track delivery failure" };
    }
  }
}
