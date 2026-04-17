import {
  createBrandedId,
  type BrandedId,
  isValidCUID,
  isValidUUID,
} from "../../shared/value-objects/branded-id";

// Notification uses CUID
export const NotificationId = createBrandedId("NotificationId", {
  validate: isValidCUID,
});
export type NotificationId = BrandedId<"NotificationId">;

// NotificationSchedule uses CUID
export const NotificationScheduleId = createBrandedId(
  "NotificationScheduleId",
  { validate: isValidCUID },
);
export type NotificationScheduleId = BrandedId<"NotificationScheduleId">;

// NotificationDelivery uses CUID
export const NotificationDeliveryId = createBrandedId(
  "NotificationDeliveryId",
  { validate: isValidCUID },
);
export type NotificationDeliveryId = BrandedId<"NotificationDeliveryId">;

// PushSubscription uses CUID
export const PushSubscriptionId = createBrandedId("PushSubscriptionId", {
  validate: isValidCUID,
});
export type PushSubscriptionId = BrandedId<"PushSubscriptionId">;

// NotificationPush uses CUID
export const NotificationPushId = createBrandedId("NotificationPushId", {
  validate: isValidCUID,
});
export type NotificationPushId = BrandedId<"NotificationPushId">;

// NotificationScheduleExecution uses CUID
export const NotificationScheduleExecutionId = createBrandedId(
  "NotificationScheduleExecutionId",
  { validate: isValidCUID },
);
export type NotificationScheduleExecutionId = BrandedId<"NotificationScheduleExecutionId">;
