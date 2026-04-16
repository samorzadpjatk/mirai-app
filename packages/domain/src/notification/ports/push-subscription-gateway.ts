import type { PushSubscription } from "../entities/push-subscription";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type {
  Connection,
  ForwardPaginationArgs,
} from "../../value-objects/pagination";

/**
 * PushSubscriptionGateway Port
 *
 * This interface defines what operations the application needs
 * from any push subscription gateway implementation.
 * Push subscriptions represent user notification preferences/tokens.
 */
export interface PushSubscriptionGateway {
  /**
   * Create a new push subscription
   */
  create(
    subscription: PushSubscription,
  ): Effect.Effect<PushSubscription, DatabaseError, never>;

  /**
   * Find push subscription by ID
   * @returns PushSubscription or null if not found
   */
  findById(
    id: string,
  ): Effect.Effect<PushSubscription | null, DatabaseError, never>;

  /**
   * Find push subscriptions for a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByUserIdConnection(
    userId: string,
    args: ForwardPaginationArgs,
  ): Effect.Effect<Connection<PushSubscription>, DatabaseError, never>;

  /**
   * Find push subscriptions by platform with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByPlatformConnection(
    platform: string,
    args: ForwardPaginationArgs,
  ): Effect.Effect<Connection<PushSubscription>, DatabaseError, never>;

  /**
   * Update push subscription
   */
  update(
    subscription: PushSubscription,
  ): Effect.Effect<PushSubscription, DatabaseError, never>;

  /**
   * Delete push subscription by ID
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Delete all push subscriptions for a user
   */
  deleteByUserId(userId: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if push subscription exists
   */
  exists(id: string): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Check if user has any push subscriptions
   */
  hasSubscriptions(
    userId: string,
  ): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Count push subscriptions for a user
   */
  countByUserId(userId: string): Effect.Effect<number, DatabaseError, never>;
}
