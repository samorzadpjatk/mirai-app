import { Effect, Data } from "effect";
import { NotificationSenderGatewayTag } from "../../ports/sender/gateway";

/**
 * Input for trackDeliveryStart use case
 */
export interface TrackDeliveryStartInput {
  notificationId: string;
}

/**
 * Output for trackDeliveryStart use case
 */
export interface TrackDeliveryStartOutput {
  success: true;
  deliveryId: string;
}

/**
 * Error types for trackDeliveryStart use case
 */
export class TrackDeliveryStartError extends Data.TaggedError(
  "TrackDeliveryStartError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * TrackDeliveryStart Use Case
 *
 * Initiates tracking for a notification delivery by creating a pending
 * delivery record. This is called when a notification begins sending.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = trackDeliveryStartUseCase(input).pipe(
 *   Effect.provideService(NotificationSenderGatewayTag, gateway)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function trackDeliveryStartUseCase(
  input: TrackDeliveryStartInput,
): Effect.Effect<
  TrackDeliveryStartOutput,
  TrackDeliveryStartError,
  NotificationSenderGatewayTag
> {
  return Effect.gen(function* () {
    const gateway = yield* NotificationSenderGatewayTag;

    const result = yield* gateway
      .trackDeliveryStart({
        notificationId: input.notificationId,
      })
      .pipe(
        Effect.mapError(
          (error) =>
            new TrackDeliveryStartError({
              message: "Failed to track delivery start",
              cause: error,
            }),
        ),
      );

    return result;
  });
}
