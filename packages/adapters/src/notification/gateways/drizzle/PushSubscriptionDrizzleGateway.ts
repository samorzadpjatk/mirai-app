import { Effect } from "effect";
import { eq, and, count } from "drizzle-orm";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import { pushSubscriptions } from "../../../infrastructure/drizzle";
import {
  type IPushSubscriptionPort,
  type PushSubscription,
} from "@mirai-app/use-cases/notification/ports/NotificationPort";
import { DatabaseError } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { pushSubscriptionMapper } from "../../mappers/PushSubscriptionMapper";

/**
 * PushSubscription Drizzle Gateway
 *
 * Implements PushSubscriptionPort using Drizzle ORM for database operations.
 * Extends BaseDrizzleGateway for consistent error handling.
 */
export class PushSubscriptionDrizzleGateway
  extends BaseDrizzleGateway
  implements IPushSubscriptionPort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findByUserId(userId: string) {
    return this.tryPromise(
      "PushSubscriptionDrizzleGateway.findByUserId",
      async () => {
        const results = await this.db.query.pushSubscriptions.findMany({
          where: eq(pushSubscriptions.userId, userId),
        });
        return results.map((r) => pushSubscriptionMapper.toDTO(r));
      },
    );
  }

  findByToken(token: string) {
    return this.tryPromise(
      "PushSubscriptionDrizzleGateway.findByToken",
      async () => {
        const result = await this.db.query.pushSubscriptions.findFirst({
          where: eq(pushSubscriptions.expoPushToken, token),
        });
        return result ? pushSubscriptionMapper.toDTO(result) : null;
      },
    );
  }

  findByUserIdAndToken(userId: string, token: string) {
    return this.tryPromise(
      "PushSubscriptionDrizzleGateway.findByUserIdAndToken",
      async () => {
        const result = await this.db.query.pushSubscriptions.findFirst({
          where: and(
            eq(pushSubscriptions.userId, userId),
            eq(pushSubscriptions.expoPushToken, token),
          ),
        });
        return result ? pushSubscriptionMapper.toDTO(result) : null;
      },
    );
  }

  create(subscription: PushSubscription) {
    return this.tryPromise(
      "PushSubscriptionDrizzleGateway.create",
      async () => {
        const insert = pushSubscriptionMapper.toInsert(subscription);
        const [result] = await this.db
          .insert(pushSubscriptions)
          .values(insert)
          .returning();
        if (!result) throw new Error("Failed to create push subscription");
        return pushSubscriptionMapper.toDTO(result);
      },
      subscription.id,
    );
  }

  update(subscription: PushSubscription) {
    return this.tryPromise(
      "PushSubscriptionDrizzleGateway.update",
      async () => {
        const update = pushSubscriptionMapper.toUpdate(subscription);
        const [result] = await this.db
          .update(pushSubscriptions)
          .set(update)
          .where(eq(pushSubscriptions.id, subscription.id))
          .returning();
        if (!result)
          throw new Error(`PushSubscription not found: ${subscription.id}`);
        return pushSubscriptionMapper.toDTO(result);
      },
      subscription.id,
    );
  }

  delete(id: string) {
    return this.tryPromise(
      "PushSubscriptionDrizzleGateway.delete",
      async () => {
        await this.db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, id));
      },
      id,
    );
  }

  deleteByTokenAndUserId(token: string, userId: string) {
    return this.tryPromise(
      "PushSubscriptionDrizzleGateway.deleteByTokenAndUserId",
      async () => {
        const result = await this.db
          .delete(pushSubscriptions)
          .where(
            and(
              eq(pushSubscriptions.expoPushToken, token),
              eq(pushSubscriptions.userId, userId),
            ),
          )
          .returning();
        return result.length;
      },
    );
  }

  deleteAllByUserId(userId: string) {
    return this.tryPromise(
      "PushSubscriptionDrizzleGateway.deleteAllByUserId",
      async () => {
        const result = await this.db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.userId, userId))
          .returning();
        return result.length;
      },
    );
  }

  findAll() {
    return this.tryPromise(
      "PushSubscriptionDrizzleGateway.findAll",
      async () => {
        const results = await this.db.query.pushSubscriptions.findMany();
        return results.map((r) => pushSubscriptionMapper.toDTO(r));
      },
    );
  }
}
