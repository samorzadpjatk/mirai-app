import type {
  PushSubscriptionSelect,
  PushSubscriptionInsert,
} from "@mirai-app/frameworks/drizzle";
import type { PushSubscription } from "@mirai-app/use-cases/notification/ports/NotificationPort";

/**
 * PushSubscription Mapper
 *
 * Maps between Drizzle database records and PushSubscriptionPort interface types.
 * These are DTOs, not domain entities.
 */
export class PushSubscriptionMapper {
  /**
   * Convert database record to PushSubscription DTO
   */
  toDTO(dbRecord: PushSubscriptionSelect): PushSubscription {
    return {
      id: dbRecord.id,
      userId: dbRecord.userId,
      token: dbRecord.expoPushToken,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
    };
  }

  /**
   * Convert PushSubscription DTO to database insert format
   */
  toInsert(subscription: PushSubscription): PushSubscriptionInsert {
    return {
      id: subscription.id,
      userId: subscription.userId,
      expoPushToken: subscription.token,
      platform: "unknown", // Default value, should be provided elsewhere
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }

  /**
   * Convert PushSubscription DTO to database update format
   */
  toUpdate(subscription: PushSubscription): Partial<PushSubscriptionInsert> {
    return {
      expoPushToken: subscription.token,
      updatedAt: new Date(),
    };
  }
}

export const pushSubscriptionMapper = new PushSubscriptionMapper();
