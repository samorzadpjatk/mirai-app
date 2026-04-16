import { Effect, Data } from "effect";
import { NotificationSenderGatewayTag } from "../../ports/sender/gateway";

/**
 * Input for trackDeliveryComplete use case
 */
export interface TrackDeliveryCompleteInput {
  notificationId: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  errors: string | null;
}

/**
 * Output for trackDeliveryComplete use case
 */
export interface TrackDeliveryCompleteOutput {
  success: true;
}

/**
 * Error types for trackDeliveryComplete use case
 */
export class TrackDeliveryCompleteError extends Data.TaggedError(
  "TrackDeliveryCompleteError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}>() {}

/**
 * TrackDeliveryComplete Use Case
 *
 * Finalizes tracking for a notification delivery by updating the delivery
 * record with final status and recipient counts. This is called after
 * a notification has been fully processed.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = trackDeliveryCompleteUseCase(input).pipe(
 *   Effect.provideService(NotificationSenderGatewayTag, gateway)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function trackDeliveryCompleteUseCase(
  input: TrackDeliveryCompleteInput,
): Effect.Effect<
  TrackDeliveryCompleteOutput,
  TrackDeliveryCompleteError,
  NotificationSenderGatewayTag
> {
  return Effect.gen(function* () {
    const gateway = yield* NotificationSenderGatewayTag;

    yield* gateway
      .trackDeliveryComplete({
        notificationId: input.notificationId,
        totalRecipients: input.totalRecipients,
        successCount: input.successCount,
        failureCount: input.failureCount,
        errors: input.errors,
      })
      .pipe(
        Effect.mapError(
          (error) =>
            new TrackDeliveryCompleteError({
              message: "Failed to track delivery completion",
              cause: error,
            }),
        ),
      );

    return { success: true };
  });
}
