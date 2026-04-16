import { Context, Effect } from "effect";
import type { DatabaseError } from "../errors";
import type { PushSubscriptionDTO, PushSubscriptionConnection } from "./dto";
import type { ForwardPaginationArgs } from "@mirai-app/domain";

/**
 * PushSubscriptionGateway Port
 *
 * This interface defines what operations the application needs
 * from any push subscription gateway implementation.
 *
 * All methods return DTOs instead of domain entities.
 *
 * Implementations (in adapters layer):
 * - DrizzlePushSubscriptionGateway: Uses Drizzle ORM
 * - InMemoryPushSubscriptionGateway: For testing
 */
export interface PushSubscriptionGateway {
  /**
   * Create a new push subscription
   */
  create(
    subscription: PushSubscriptionDTO,
  ): Effect.Effect<PushSubscriptionDTO, DatabaseError, never>;

  /**
   * Find push subscription by ID
   * @returns PushSubscriptionDTO or null if not found
   */
  findById(
    id: string,
  ): Effect.Effect<PushSubscriptionDTO | null, DatabaseError, never>;

  /**
   * Find push subscriptions for a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByUserIdConnection(
    userId: string,
    args: ForwardPaginationArgs,
  ): Effect.Effect<PushSubscriptionConnection, DatabaseError, never>;

  /**
   * Find push subscriptions by platform with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByPlatformConnection(
    platform: string,
    args: ForwardPaginationArgs,
  ): Effect.Effect<PushSubscriptionConnection, DatabaseError, never>;

  /**
   * Update push subscription
   */
  update(
    subscription: PushSubscriptionDTO,
  ): Effect.Effect<PushSubscriptionDTO, DatabaseError, never>;

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

/**
 * PushSubscriptionGateway Context.Tag for Effect dependency injection
 */
export class PushSubscriptionGatewayTag extends Context.Tag(
  "PushSubscriptionGateway",
)<PushSubscriptionGatewayTag, PushSubscriptionGateway>() {}
