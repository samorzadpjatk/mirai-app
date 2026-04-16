import { Effect, Data } from "effect";
import {
  NotificationDeliveryGatewayTag,
  type DeliveryPaginationOptions,
  type DeliveryFilters,
  type NotificationDelivery,
} from "../../ports/delivery/gateway";

/**
 * Input for GetDeliveries use case
 */
export interface GetDeliveriesInput {
  filters?: Partial<DeliveryFilters>;
  pagination?: Partial<DeliveryPaginationOptions>;
}

/**
 * Output for GetDeliveries use case
 */
export interface GetDeliveriesOutput {
  deliveries: NotificationDelivery[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Error types for GetDeliveries use case
 */
export class GetDeliveriesError extends Data.TaggedError("GetDeliveriesError")<{
  readonly cause: unknown;
}> {}

/**
 * GetDeliveries Use Case
 *
 * Retrieves paginated list of notification deliveries with optional filters.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getDeliveriesUseCase(input).pipe(
 *   Effect.provideService(NotificationDeliveryGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getDeliveriesUseCase(
  input: GetDeliveriesInput,
): Effect.Effect<
  GetDeliveriesOutput,
  GetDeliveriesError,
  NotificationDeliveryGatewayTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationDeliveryGatewayTag;

    const limit = input.pagination?.limit ?? 50;
    const offset = input.pagination?.offset ?? 0;

    const [deliveries, total] = yield* Effect.all([
      repo.findMany(input.filters ?? {}, { limit, offset }),
      repo.count(input.filters),
    ]);

    return {
      deliveries,
      total,
      limit,
      offset,
    };
  }).pipe(
    Effect.catchAllCause((cause) =>
      Effect.fail(new GetDeliveriesError({ cause })),
    ),
  );
}
