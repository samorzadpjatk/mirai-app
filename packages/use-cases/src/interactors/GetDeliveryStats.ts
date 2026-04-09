import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import type {
  NotificationDeliveryRepository,
  DeliveryStats,
  DeliveryFilters,
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
 * GetDeliveryStats Use Case
 *
 * Retrieves comprehensive statistics about notification deliveries.
 */
export class GetDeliveryStatsUseCase {
  constructor(private deliveryRepo: NotificationDeliveryRepository) {}

  async execute(
    input: GetDeliveryStatsInput,
  ): Promise<Result<GetDeliveryStatsOutput, string>> {
    try {
      const stats = await this.deliveryRepo.getStats(input.filters);

      return ok(stats);
    } catch (error) {
      return err(
        `Failed to get delivery stats: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
