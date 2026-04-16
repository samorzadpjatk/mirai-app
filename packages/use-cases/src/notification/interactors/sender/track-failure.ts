import { Effect, Data } from "effect";
import { NotificationSenderGatewayTag } from "../../ports/sender/gateway";

/**
 * Input for trackDeliveryFailure use case
 */
export interface TrackDeliveryFailureInput {
  notificationId: string;
  error: string | Error;
}

/**
 * Output for trackDeliveryFailure use case
 */
export interface TrackDeliveryFailureOutput {
  success: true;
}

/**
 * Error types for trackDeliveryFailure use case
 */
export class TrackDeliveryFailureError extends Data.TaggedError(
  "TrackDeliveryFailureError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}>() {}

/**
 * TrackDeliveryFailure Use Case
 *
 * Records a delivery failure for a notification. Updates an existing delivery
 * record if one exists, or creates a new one with failure status.
 * This is called when a notification delivery fails completely.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = trackDeliveryFailureUseCase(input).pipe(
 *   Effect.provideService(NotificationSenderGatewayTag, gateway)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function trackDeliveryFailureUseCase(
  input: TrackDeliveryFailureInput,
): Effect.Effect<
  TrackDeliveryFailureOutput,
  TrackDeliveryFailureError,
  NotificationSenderGatewayTag
> {
  return Effect.gen(function* () {
    const gateway = yield* NotificationSenderGatewayTag;

    yield* gateway
      .trackDeliveryFailure({
        notificationId: input.notificationId,
        error: input.error,
      })
      .pipe(
        Effect.mapError(
          (error) =>
            new TrackDeliveryFailureError({
              message: "Failed to track delivery failure",
              cause: error,
            }),
        ),
      );

    return { success: true };
  });
}
