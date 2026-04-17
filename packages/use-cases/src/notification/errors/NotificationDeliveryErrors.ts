import { Data } from "effect";

/**
 * Notification delivery not found error
 */
export class NotificationDeliveryNotFoundError extends Data.TaggedError(
  "NotificationDeliveryNotFoundError",
)<{
  notificationId: string;
}>() {}
