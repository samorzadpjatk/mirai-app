import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import type {
  NotificationDeliveryRepository,
  NotificationDelivery,
  PaginationOptions,
  DeliveryFilters,
} from "../ports/NotificationDeliveryRepository";

/**
 * Input for GetDeliveries use case
 */
export interface GetDeliveriesInput {
  filters?: Partial<DeliveryFilters>;
  pagination?: Partial<PaginationOptions>;
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
 * GetDeliveries Use Case
 *
 * Retrieves paginated list of notification deliveries with optional filters.
 */
export class GetDeliveriesUseCase {
  constructor(private deliveryRepo: NotificationDeliveryRepository) {}

  async execute(
    input: GetDeliveriesInput,
  ): Promise<Result<GetDeliveriesOutput, string>> {
    try {
      const limit = input.pagination?.limit ?? 50;
      const offset = input.pagination?.offset ?? 0;

      const [deliveries, total] = await Promise.all([
        this.deliveryRepo.findMany(input.filters ?? {}, { limit, offset }),
        this.deliveryRepo.count(input.filters),
      ]);

      return ok({
        deliveries,
        total,
        limit,
        offset,
      });
    } catch (error) {
      return err(
        `Failed to get deliveries: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
