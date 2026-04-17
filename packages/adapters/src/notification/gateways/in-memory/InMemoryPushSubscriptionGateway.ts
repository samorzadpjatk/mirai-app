import { Effect } from "effect";
import {
  type IPushSubscriptionPort,
  type PushSubscription,
} from "@mirai-app/use-cases/notification/ports/NotificationPort";
import { DatabaseError } from "@mirai-app/domain";

/**
 * In-Memory PushSubscription Gateway
 *
 * Implements PushSubscriptionPort using in-memory Map storage for testing.
 */
export class InMemoryPushSubscriptionGateway implements IPushSubscriptionPort {
  private subscriptions: Map<string, PushSubscription> = new Map();

  findByUserId(
    userId: string,
  ): Effect.Effect<PushSubscription[], DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.subscriptions.values()).filter(
        (s) => s.userId === userId,
      );
    });
  }

  findByToken(
    token: string,
  ): Effect.Effect<PushSubscription | null, DatabaseError, never> {
    return Effect.sync(() => {
      const subscription = Array.from(this.subscriptions.values()).find(
        (s) => s.token === token,
      );
      return subscription ?? null;
    });
  }

  findByUserIdAndToken(
    userId: string,
    token: string,
  ): Effect.Effect<PushSubscription | null, DatabaseError, never> {
    return Effect.sync(() => {
      const subscription = Array.from(this.subscriptions.values()).find(
        (s) => s.userId === userId && s.token === token,
      );
      return subscription ?? null;
    });
  }

  create(
    subscription: PushSubscription,
  ): Effect.Effect<PushSubscription, DatabaseError, never> {
    return Effect.sync(() => {
      this.subscriptions.set(subscription.id, subscription);
      return subscription;
    });
  }

  update(
    subscription: PushSubscription,
  ): Effect.Effect<PushSubscription, DatabaseError, never> {
    return Effect.sync(() => {
      const existing = this.subscriptions.get(subscription.id);
      if (!existing) {
        throw new Error(`PushSubscription not found: ${subscription.id}`);
      }

      const updatedSubscription: PushSubscription = {
        ...subscription,
        updatedAt: new Date(),
      };

      this.subscriptions.set(subscription.id, updatedSubscription);
      return updatedSubscription;
    });
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      this.subscriptions.delete(id);
    });
  }

  deleteByTokenAndUserId(
    token: string,
    userId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.sync(() => {
      let deletedCount = 0;
      for (const [id, subscription] of this.subscriptions.entries()) {
        if (subscription.token === token && subscription.userId === userId) {
          this.subscriptions.delete(id);
          deletedCount++;
        }
      }
      return deletedCount;
    });
  }

  deleteAllByUserId(
    userId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.sync(() => {
      let deletedCount = 0;
      for (const [id, subscription] of this.subscriptions.entries()) {
        if (subscription.userId === userId) {
          this.subscriptions.delete(id);
          deletedCount++;
        }
      }
      return deletedCount;
    });
  }

  findAll(): Effect.Effect<PushSubscription[], DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.subscriptions.values());
    });
  }

  // Test helper method
  clear(): void {
    this.subscriptions.clear();
  }
}
