import type { Prisma } from "@integral-2025-app/db";

export interface DeliveryMetrics {
  notificationId: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  errors?: string;
}

export async function trackDeliveryStart(
  db: Prisma.TransactionClient,
  notificationId: string,
): Promise<void> {
  try {
    const scheduleExecution = await db.notificationScheduleExecution.findFirst({
      where: { notificationId },
      select: { scheduleId: true },
    });

    await db.notificationDelivery.create({
      data: {
        notificationId,
        scheduleId: scheduleExecution?.scheduleId,
        deliveryStartedAt: new Date(),
        status: "pending",
      },
    });

    console.log(
      `[Delivery Tracker] Started tracking delivery for notification ${notificationId}`,
    );
  } catch (error) {
    console.error("[Delivery Tracker] Failed to track delivery start:", error);
  }
}

export async function trackDeliveryComplete(
  db: Prisma.TransactionClient,
  metrics: DeliveryMetrics,
): Promise<void> {
  try {
    const status =
      metrics.failureCount === 0
        ? "success"
        : metrics.successCount === 0
          ? "failure"
          : "partial_failure";

    await db.notificationDelivery.update({
      where: { notificationId: metrics.notificationId },
      data: {
        deliveryCompletedAt: new Date(),
        totalRecipients: metrics.totalRecipients,
        successCount: metrics.successCount,
        failureCount: metrics.failureCount,
        errors: metrics.errors,
        status,
      },
    });

    console.log(
      `[Delivery Tracker] Completed tracking for notification ${metrics.notificationId}: ${metrics.successCount}/${metrics.totalRecipients} successful`,
    );
  } catch (error) {
    console.error(
      "[Delivery Tracker] Failed to track delivery completion:",
      error,
    );
  }
}

export async function trackDeliveryFailure(
  db: Prisma.TransactionClient,
  notificationId: string,
  error: Error | string,
): Promise<void> {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);

    const existing = await db.notificationDelivery.findUnique({
      where: { notificationId },
    });

    if (existing) {
      await db.notificationDelivery.update({
        where: { notificationId },
        data: {
          deliveryCompletedAt: new Date(),
          errors: errorMessage,
          status: "failure",
        },
      });
    } else {
      const scheduleExecution =
        await db.notificationScheduleExecution.findFirst({
          where: { notificationId },
          select: { scheduleId: true },
        });

      await db.notificationDelivery.create({
        data: {
          notificationId,
          scheduleId: scheduleExecution?.scheduleId,
          deliveryStartedAt: new Date(),
          deliveryCompletedAt: new Date(),
          errors: errorMessage,
          status: "failure",
        },
      });
    }

    console.log(
      `[Delivery Tracker] Tracked failure for notification ${notificationId}`,
    );
  } catch (err) {
    console.error("[Delivery Tracker] Failed to track delivery failure:", err);
  }
}
