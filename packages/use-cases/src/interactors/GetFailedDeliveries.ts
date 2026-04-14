import { Effect, Data } from "effect";
import {
  NotificationDeliveryRepositoryTag,
  type DeliveryPaginationOptions,
  type NotificationDelivery,
} from "../ports/NotificationDeliveryRepository";

/**
 * Input for GetFailedDeliveries use case
 */
export interface GetFailedDeliveriesInput {
  tripId: string;
  pagination?: Partial<DeliveryPaginationOptions>;
}

/**
 * Output for GetFailedDeliveries use case
 */
export interface GetFailedDeliveriesOutput {
  deliveries: NotificationDelivery[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Error types for GetFailedDeliveries use case
 */
export class GetFailedDeliveriesError extends Data.TaggedError(
  "GetFailedDeliveriesError",
)<{
  readonly cause: unknown;
}> {}

/**
 * GetFailedDeliveries Use Case
 *
 * Retrieves paginated list of failed or partially failed deliveries.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getFailedDeliveriesUseCase(input).pipe(
 *   Effect.provideService(NotificationDeliveryRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getFailedDeliveriesUseCase(
  input: GetFailedDeliveriesInput,
): Effect.Effect<
  GetFailedDeliveriesOutput,
  GetFailedDeliveriesError,
  NotificationDeliveryRepositoryTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationDeliveryRepositoryTag;

    const limit = input.pagination?.limit ?? 20;
    const offset = input.pagination?.offset ?? 0;

    const [deliveries, total] = yield* Effect.all([
      repo.findFailed(input.tripId, { limit, offset }),
      repo.countFailed(input.tripId),
    ]);

    return {
      deliveries,
      total,
      limit,
      offset,
    };
  }).pipe(
    Effect.catchAllCause((cause) =>
      Effect.fail(new GetFailedDeliveriesError({ cause })),
    ),
  );
}
