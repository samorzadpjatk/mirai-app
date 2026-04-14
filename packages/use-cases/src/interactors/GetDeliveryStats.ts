import { Effect, Data } from "effect";
import {
  NotificationDeliveryRepositoryTag,
  type DeliveryStats,
  type DeliveryFilters,
} from "../ports/NotificationDeliveryRepository";

/**
 * Input for GetDeliveryStats use case
 */
export interface GetDeliveryStatsInput {
  filters?: Partial<DeliveryFilters>;
}

/**
 * Output for GetDeliveryStats use case
 */
export interface GetDeliveryStatsOutput extends DeliveryStats {}

/**
 * Error types for GetDeliveryStats use case
 */
export class GetDeliveryStatsError extends Data.TaggedError(
  "GetDeliveryStatsError",
)<{
  message: string;
  cause?: unknown;
}> {}

/**
 * GetDeliveryStats Use Case
 *
 * Retrieves comprehensive statistics about notification deliveries.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getDeliveryStatsUseCase(input).pipe(
 *   Effect.provideService(NotificationDeliveryRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getDeliveryStatsUseCase(
  input: GetDeliveryStatsInput,
): Effect.Effect<
  GetDeliveryStatsOutput,
  GetDeliveryStatsError,
  NotificationDeliveryRepositoryTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationDeliveryRepositoryTag;

    const stats = yield* repo.getStats(input.filters);

    return stats;
  }).pipe(
    Effect.catchAllCause((cause) =>
      Effect.fail(
        new GetDeliveryStatsError({
          message: `Failed to get delivery stats: ${cause}`,
          cause,
        }),
      ),
    ),
  );
}
