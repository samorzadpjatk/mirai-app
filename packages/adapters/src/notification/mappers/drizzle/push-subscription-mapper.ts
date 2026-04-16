import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import type { PushSubscriptionDTO } from "@mirai-app/use-cases";
import type {
  pushSubscriptions,
  PushSubscriptionSelect,
  PushSubscriptionInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * PushSubscriptionDrizzleMapper
 *
 * Maps between Drizzle database records and PushSubscriptionDTOs.
 */
export class PushSubscriptionDrizzleMapper implements DrizzleEntityMapper<
  PushSubscriptionDTO,
  PushSubscriptionSelect,
  PushSubscriptionInsert
> {
  /**
   * Convert a Drizzle PushSubscription record to a PushSubscriptionDTO
   */
  toDTO(record: PushSubscriptionSelect): PushSubscriptionDTO {
    return {
      id: record.id,
      userId: record.userId,
      token: record.expoPushToken,
      platform: record.platform,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Convert a PushSubscriptionDTO to Drizzle insert input
   */
  toDrizzleInsert(dto: PushSubscriptionDTO): PushSubscriptionInsert {
    return {
      id: dto.id,
      userId: dto.userId,
      expoPushToken: dto.token,
      platform: dto.platform,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  /**
   * Convert a PushSubscriptionDTO to Drizzle update input
   */
  toDrizzleUpdate(dto: PushSubscriptionDTO): Partial<PushSubscriptionInsert> {
    return {
      expoPushToken: dto.token,
      platform: dto.platform,
      updatedAt: new Date(),
    };
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new PushSubscriptionDrizzleMapper();
}
