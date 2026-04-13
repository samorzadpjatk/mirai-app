import { Effect } from "effect";
import {
  NotificationDeliveryRepositoryTag,
  type NotificationDelivery,
} from "../ports/NotificationDeliveryRepository";

/**
 * Input for GetDeliveryByNotificationId use case
 */
export interface GetDeliveryByNotificationIdInput {
  notificationId: string;
  tripId: string;
}

/**
 * Output for GetDeliveryByNotificationId use case
 */
export interface GetDeliveryByNotificationIdOutput {
  delivery: {
    id: string;
    notificationId: string;
    tripId: string;
    status: string;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    deliveryStartedAt: Date;
    deliveryCompletedAt?: Date | null;
    errorLog?: string | null;
    notification: {
      id: string;
      title: string;
      body: string;
      url?: string | null;
      createdAt: Date;
      tripId?: string;
      createdBy?: {
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        authUserId?: string;
      } | null;
    } | null;
  };
}

/**
 * Error types for GetDeliveryByNotificationId use case
 */
export class DeliveryNotFoundError extends Error {
  readonly _tag = "DeliveryNotFoundError";
  constructor() {
    super("Notification delivery not found");
  }
}

export class GetDeliveryError extends Error {
  readonly _tag = "GetDeliveryError";
  constructor(cause: unknown) {
    super(
      `Failed to get delivery: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }
}

/**
 * Helper function to convert NotificationDelivery to output DTO
 */
function toOutput(
  delivery: NotificationDelivery,
): GetDeliveryByNotificationIdOutput {
  return {
    delivery: {
      id: delivery.id,
      notificationId: delivery.notificationId,
      tripId: delivery.tripId,
      status: delivery.status,
      totalRecipients: delivery.totalRecipients,
      successCount: delivery.successCount,
      failureCount: delivery.failureCount,
      deliveryStartedAt: delivery.deliveryStartedAt,
      ...(delivery.deliveryCompletedAt !== undefined && {
        deliveryCompletedAt: delivery.deliveryCompletedAt,
      }),
      ...(delivery.errorLog !== undefined && {
        errorLog: delivery.errorLog,
      }),
      notification: delivery.notification ?? null,
    },
  };
}

/**
 * GetDeliveryByNotificationId Use Case
 *
 * Retrieves a single delivery by notification ID.
 * Verifies that the delivery belongs to the specified trip.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getDeliveryByNotificationIdUseCase(input).pipe(
 *   Effect.provideService(NotificationDeliveryRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getDeliveryByNotificationIdUseCase(
  input: GetDeliveryByNotificationIdInput,
): Effect.Effect<
  GetDeliveryByNotificationIdOutput,
  DeliveryNotFoundError,
  NotificationDeliveryRepositoryTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationDeliveryRepositoryTag;

    const delivery = yield* repo.findByNotificationId(input.notificationId);

    if (!delivery || delivery.tripId !== input.tripId) {
      return yield* Effect.fail(new DeliveryNotFoundError());
    }

    return toOutput(delivery);
  });
}
