import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type {
  NotificationDeliveryRepository,
  NotificationDelivery,
  PaginationOptions,
} from "../ports/NotificationDeliveryRepository";

/**
 * Input for GetFailedDeliveries use case
 */
export interface GetFailedDeliveriesInput {
  tripId: string;
  pagination?: Partial<PaginationOptions>;
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
 * GetFailedDeliveries Use Case
 *
 * Retrieves paginated list of failed or partially failed deliveries.
 */
export class GetFailedDeliveriesUseCase {
  constructor(private deliveryRepo: NotificationDeliveryRepository) {}

  async execute(
    input: GetFailedDeliveriesInput,
  ): Promise<Result<GetFailedDeliveriesOutput, string>> {
    try {
      const limit = input.pagination?.limit ?? 20;
      const offset = input.pagination?.offset ?? 0;

      const [deliveries, total] = await Promise.all([
        this.deliveryRepo.findFailed(input.tripId, { limit, offset }),
        this.deliveryRepo.countFailed(input.tripId),
      ]);

      return ok({
        deliveries,
        total,
        limit,
        offset,
      });
    } catch (error) {
      return err(
        `Failed to get failed deliveries: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
