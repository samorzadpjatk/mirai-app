import type { TripId } from "../../trip/value-objects/TripId";
import type { NotificationId, NotificationScheduleId, NotificationDeliveryId } from "../value-objects/NotificationId";

/**
 * NotificationDelivery entity interface
 * Represents the delivery status of a notification to all recipients
 */
export interface NotificationDelivery {
  id: NotificationDeliveryId;
  notificationId: NotificationId;
  tripId: TripId | null;
  scheduleId: NotificationScheduleId | null;
  status: "pending" | "success" | "partial_failure" | "failure";
  deliveryStartedAt: Date;
  deliveryCompletedAt: Date | null;
  totalRecipients: number | null;
  successCount: number | null;
  failureCount: number | null;
  errors: string | null;
}
