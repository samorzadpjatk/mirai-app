// =============================================================================
// GraphQL Location Module
// =============================================================================

/**
 * Location GraphQL Module
 *
 * Provides GraphQL types and subscriptions for location sharing features:
 * - FriendLocationEvent: Real-time location updates via subscriptions
 * - friendLocationEvent: Subscription for receiving friend location updates
 *
 * ## Usage
 *
 * Types are automatically registered when this module is imported via schema.ts.
 * The subscription resolver uses the LocationBroadcastService for real-time updates.
 */

// =============================================================================
// Type Exports
// =============================================================================

export {
  FriendLocationEventType,
  type FriendLocationEvent,
} from "./types.js";

// =============================================================================
// Side-Effect Registration
// =============================================================================

// Import types and subscriptions to register with Pothos builder
import "./types.js";
import "./subscriptions.js";
