import { Context, Effect } from "effect";
import { DatabaseError } from "@mirai-app/domain/ports";

/**
 * Delivery status for tracking
 */
export type DeliveryStatus =
  | "pending"
  | "success"
  | "partial_failure"
  | "failure";

/**
 * NotificationSenderGateway Port
 *
 * This interface defines operations for tracking notification delivery lifecycle.
 * Handles delivery start, completion, and failure tracking.
 */
export interface NotificationSenderGateway {
  /**
   * Track the start of a notification delivery
   * Creates a delivery record with pending status
   */
  trackDeliveryStart(input: {
    notificationId: string;
  }): Effect.Effect<
    { success: true; deliveryId: string },
    DatabaseError,
    never
  >;

  /**
   * Track the completion of a notification delivery
   * Updates delivery record with final status and counts
   */
  trackDeliveryComplete(input: {
    notificationId: string;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    errors: string | null;
  }): Effect.Effect<{ success: true }, DatabaseError, never>;

  /**
   * Track a delivery failure
   * Updates existing record or creates new one with failure status
   */
  trackDeliveryFailure(input: {
    notificationId: string;
    error: string | Error;
  }): Effect.Effect<{ success: true }, DatabaseError, never>;
}

/**
 * NotificationSenderGateway Context.Tag for Effect dependency injection
 */
export class NotificationSenderGatewayTag extends Context.Tag(
  "NotificationSenderGateway",
)<NotificationSenderGatewayTag, NotificationSenderGateway>() {}
