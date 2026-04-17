import { Data } from "effect";

/**
 * Notification not found error
 */
export class NotificationNotFoundError extends Data.TaggedError(
  "NotificationNotFoundError",
)<{
  notificationId: string;
}>() {}

/**
 * No failed pushes to retry error
 */
export class NoFailedPushesError extends Data.TaggedError(
  "NoFailedPushesError",
)<{
  notificationId: string;
}>() {}

/**
 * Push subscription not found error
 */
export class SubscriptionNotFoundError extends Data.TaggedError(
  "SubscriptionNotFoundError",
)<{
  token: string;
}>() {}

/**
 * Invalid notification token error
 */
export class InvalidTokenError extends Data.TaggedError("InvalidTokenError")<{
  token: string;
}>() {}

/**
 * Failed to send notification error
 */
export class SendNotificationError extends Data.TaggedError(
  "SendNotificationError",
)<{
  message: string;
  cause?: unknown;
}>() {}
