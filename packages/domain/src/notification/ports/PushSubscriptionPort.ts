import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { PushSubscription } from "../entities/PushSubscription";
import type { PushSubscriptionId } from "../value-objects/NotificationId";

/**
 * PushSubscription Port
 * Defines repository operations for push notification subscriptions
 */
export interface IPushSubscriptionPort {
  findByUserId(
    userId: string,
  ): Effect.Effect<PushSubscription[], IPortError, never>;
  findByToken(
    token: string,
  ): Effect.Effect<PushSubscription | null, IPortError, never>;
  findByUserIdAndToken(
    userId: string,
    token: string,
  ): Effect.Effect<PushSubscription | null, IPortError, never>;
  create(
    subscription: PushSubscription,
  ): Effect.Effect<PushSubscription, IPortError, never>;
  update(
    subscription: PushSubscription,
  ): Effect.Effect<PushSubscription, IPortError, never>;
  delete(id: PushSubscriptionId): Effect.Effect<void, IPortError, never>;
  deleteByTokenAndUserId(
    token: string,
    userId: string,
  ): Effect.Effect<number, IPortError, never>;
  deleteAllByUserId(userId: string): Effect.Effect<number, IPortError, never>;
  findAll(): Effect.Effect<PushSubscription[], IPortError, never>;
}
