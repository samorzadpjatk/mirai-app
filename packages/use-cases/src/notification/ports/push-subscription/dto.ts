/**
 * PushSubscription DTOs
 *
 * Data Transfer Objects for PushSubscription domain.
 * Used by use-case gateways to return data to the presentation layer.
 */

import type { Connection } from "@mirai-app/domain";

/**
 * PushSubscriptionDTO - Lightweight representation of a push subscription
 */
export interface PushSubscriptionDTO {
  id: string;
  userId: string;
  token: string;
  platform: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated result for push subscription connection queries
 */
export type PushSubscriptionConnection = Connection<PushSubscriptionDTO>;
