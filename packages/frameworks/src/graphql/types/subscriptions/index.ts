// =============================================================================
// GraphQL Subscriptions Module
// =============================================================================

/**
 * GraphQL Subscriptions Module
 *
 * Provides real-time subscriptions for:
 * - Friend location sharing updates
 * - Notification delivery
 * - Activity feed updates
 * - Challenge status changes
 * - Group ranking changes
 * - Submission reviews
 * - Join requests
 *
 * ## Usage
 *
 * ```graphql
 * subscription OnFriendLocation($filter: LocationSubscriptionFilter!) {
 *   friendLocationEvent(filter: $filter) {
 *     userId
 *     latitude
 *     longitude
 *     timestamp
 *   }
 * }
 * ```
 *
 * ## Publishing Events
 *
 * From mutations or use cases:
 * ```typescript
 * import { pubsub } from "@mirai-app/frameworks/graphql";
 *
 * pubsub.publish(PubSub.locationEvent(tripId), {
 *   userId: "123",
 *   latitude: 52.2297,
 *   longitude: 21.0122,
 *   timestamp: new Date(),
 * });
 * ```
 */

// =============================================================================
// Type Exports
// =============================================================================

export {
  FriendLocationEventType,
  NotificationReceivedEventType,
  ActivityFeedEventType,
  ChallengeStatusEventType,
  GroupRankingEventType,
  SubmissionReviewedEventType,
  JoinRequestEventType,
  LocationSubscriptionFilter,
  ActivityFeedSubscriptionFilter,
  ChallengeSubscriptionFilter,
  GroupSubscriptionFilter,
  SubmissionSubscriptionFilter,
  JoinRequestSubscriptionFilter,
} from "./types.js";

// =============================================================================
// Pub/Sub Export
// =============================================================================

export { pubsub } from "./subscriptions.js";

// =============================================================================
// Side-Effect Registration
// =============================================================================

import "./types.js";
import "./subscriptions.js";
