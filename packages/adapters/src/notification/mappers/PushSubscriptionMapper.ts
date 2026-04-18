import type {
  PushSubscriptionSelect,
  PushSubscriptionInsert,
} from "../../infrastructure/drizzle";
import type { PushSubscription } from "@mirai-app/use-cases/notification/ports/NotificationPort";
import {
  PushSubscriptionId,
  UserId,
} from "@mirai-app/domain";

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
      id: PushSubscriptionId.unsafeCreate(dbRecord.id),
      userId: UserId.unsafeCreate(dbRecord.userId),
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
      id: PushSubscriptionId.toString(subscription.id),
      userId: UserId.toString(subscription.userId),
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
