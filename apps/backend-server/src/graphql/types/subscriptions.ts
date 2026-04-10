/**
 * GraphQL Subscription Types
 *
 * Pothos subscription type definitions for real-time features.
 * Implements the graphql-ws protocol for WebSocket subscriptions.
 *
 * ## Subscriptions
 *
 * - `activityFeedUpdated(tripId: ID!): Activity!` - New activity in trip feed
 * - `locationUpdated(userIds: [ID!]!): FriendLocation!` - Friend location update
 * - `challengeVotingUpdated(challengeId: ID!): VotingProgress!` - Voting progress
 *
 * ## Authentication
 *
 * All subscriptions require authentication via WebSocket connection.
 * The auth token is extracted from the cookie during the connection handshake.
 *
 * @module subscriptions
 */

import { builder } from "../builder";
import type { GetChallengeVotingProgressOutput } from "@mirai-app/use-cases";

// =============================================================================
// Types
// =============================================================================

/**
 * FriendLocation type for subscription payload
 * Matches the structure from location types
 */
export const FriendLocationSubscriptionType = builder.objectType(
  "FriendLocationSubscription",
  {
    description: "Real-time friend location update",
    fields: (t) => ({
      id: t.exposeID("id", {
        description: "Location record ID",
        nullable: false,
      }),
      userId: t.exposeID("userId", {
        description: "User ID whose location is being shared",
        nullable: false,
      }),
      latitude: t.exposeFloat("latitude", {
        description: "Latitude coordinate",
        nullable: true,
      }),
      longitude: t.exposeFloat("longitude", {
        description: "Longitude coordinate",
        nullable: true,
      }),
      accuracy: t.exposeFloat("accuracy", {
        description: "Accuracy in meters",
        nullable: true,
      }),
      altitude: t.exposeFloat("altitude", {
        description: "Altitude in meters",
        nullable: true,
      }),
      heading: t.exposeFloat("heading", {
        description: "Heading in degrees (0-360)",
        nullable: true,
      }),
      speed: t.exposeFloat("speed", {
        description: "Speed in meters per second",
        nullable: true,
      }),
      isSharingLocation: t.exposeBoolean("isSharingLocation", {
        description: "Whether user is currently sharing location",
        nullable: false,
      }),
      timestamp: t.field({
        type: "DateTime",
        description: "When the location was recorded",
        nullable: false,
        resolve: (loc: { timestamp: Date }) => loc.timestamp,
      }),
      distanceKm: t.exposeFloat("distanceKm", {
        description: "Distance from current user in kilometers",
        nullable: true,
      }),
    }),
  },
);

/**
 * Voting progress type for challenge subscriptions
 */
export const VotingProgressSubscriptionType = builder.objectType(
  "VotingProgressSubscription",
  {
    description: "Real-time voting progress for a challenge",
    fields: (t) => ({
      challengeId: t.exposeID("challengeId", {
        description: "Challenge ID",
        nullable: false,
      }),
      totalVotes: t.exposeInt("totalVotes", {
        description: "Total number of votes cast",
        nullable: false,
      }),
      uniqueVoters: t.exposeInt("uniqueVoters", {
        description: "Number of unique voters",
        nullable: false,
      }),
      submissions: t.field({
        type: [
          builder.objectType("VotingProgressSubmission", {
            description: "Vote count for a specific submission",
            fields: (st) => ({
              submissionId: st.exposeID("submissionId", {
                description: "Submission ID",
                nullable: false,
              }),
              voteCount: st.exposeInt("voteCount", {
                description: "Number of votes for this submission",
                nullable: false,
              }),
              voteScore: st.exposeFloat("voteScore", {
                description: "Calculated vote score",
                nullable: false,
              }),
              rank: st.exposeInt("rank", {
                description: "Current rank based on votes",
                nullable: true,
              }),
            }),
          }),
        ],
        description: "Vote counts per submission",
        nullable: false,
        resolve: (result: GetChallengeVotingProgressOutput) =>
          result.submissions ?? [],
      }),
      isComplete: t.exposeBoolean("isComplete", {
        description: "Whether voting is complete",
        nullable: false,
      }),
      endsAt: t.field({
        type: "DateTime",
        description: "When voting ends",
        nullable: true,
        resolve: (result: GetChallengeVotingProgressOutput) =>
          result.endsAt ?? null,
      }),
      updatedAt: t.field({
        type: "DateTime",
        description: "When this progress was last updated",
        nullable: false,
        resolve: () => new Date(),
      }),
    }),
  },
);

// =============================================================================
// Subscription Fields
// =============================================================================

/**
 * Subscription: activityFeedUpdated
 *
 * Emits when a new activity is created in a trip's feed.
 * Requires authentication and trip participant access.
 */
builder.subscriptionField("activityFeedUpdated", (t) =>
  t.field({
    description: "Subscribe to new activities in a trip feed",
    type: "Activity",
    nullable: false,
    args: {
      tripId: t.arg.id({
        description: "Trip ID to subscribe to",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    subscribe: async function* (_root, args, context) {
      // Get PubSub service from DI container
      const pubSubService =
        context.container.resolve<import("@mirai-app/use-cases").PubSubService>(
          "pubSubService",
        );

      // Subscribe to the activity feed channel for this trip
      const channel = `activity:feed:${args.tripId}`;
      const subscription = pubSubService.subscribe<{
        id: string;
        tripId: string;
        activityType: string;
        title: string;
        description: string | null;
        imageUrl: string | null;
        isPinned: boolean;
        isHidden: boolean;
        createdAt: Date;
        updatedAt: Date;
        admin: { id: string; firstName: string; lastName: string } | null;
      }>(channel);

      try {
        // Yield activities as they are published
        for await (const activity of subscription.asyncIterable) {
          yield activity;
        }
      } finally {
        // Clean up subscription when client disconnects
        subscription.unsubscribe();
      }
    },
    resolve: (payload) => payload,
  }),
);

/**
 * Subscription: locationUpdated
 *
 * Emits when a friend's location is updated.
 * Requires authentication and being in the user's sharing list.
 */
builder.subscriptionField("locationUpdated", (t) =>
  t.field({
    description: "Subscribe to location updates from specific users",
    type: "FriendLocationSubscription",
    nullable: false,
    args: {
      userIds: t.arg.idList({
        description: "User IDs to subscribe to location updates for",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    subscribe: async function* (_root, args, context) {
      // Get PubSub service from DI container
      const pubSubService =
        context.container.resolve<import("@mirai-app/use-cases").PubSubService>(
          "pubSubService",
        );

      // Subscribe to location channels for all specified users
      const subscriptions = args.userIds.map((userId) => {
        const channel = `location:${userId}`;
        return {
          userId,
          subscription: pubSubService.subscribe<{
            id: string;
            userId: string;
            latitude: number | null;
            longitude: number | null;
            accuracy: number | null;
            altitude: number | null;
            heading: number | null;
            speed: number | null;
            isSharingLocation: boolean;
            timestamp: Date;
            distanceKm?: number;
          }>(channel),
        };
      });

      try {
        // Use a simple round-robin approach for multiple subscriptions
        const iterators = subscriptions.map((s) =>
          s.subscription.asyncIterable[Symbol.asyncIterator](),
        );

        while (iterators.length > 0) {
          // Create race promises for all active iterators
          const promises = iterators.map(async (iterator, index) => {
            try {
              const result = await iterator.next();
              return { index, result };
            } catch {
              return { index, error: true };
            }
          });

          const winner = await Promise.race(promises);

          if ("error" in winner) {
            // Remove failed iterator
            iterators.splice(winner.index, 1);
            continue;
          }

          if (winner.result.done) {
            // Remove completed iterator
            iterators.splice(winner.index, 1);
          } else {
            // Yield the location update
            yield winner.result.value;
          }
        }
      } finally {
        // Clean up all subscriptions
        subscriptions.forEach((s) => s.subscription.unsubscribe());
      }
    },
    resolve: (payload) => payload,
  }),
);

/**
 * Subscription: challengeVotingUpdated
 *
 * Emits when voting progress changes for a challenge.
 * Requires authentication and being a participant in the challenge's trip.
 */
builder.subscriptionField("challengeVotingUpdated", (t) =>
  t.field({
    description: "Subscribe to voting progress updates for a challenge",
    type: "VotingProgressSubscription",
    nullable: false,
    args: {
      challengeId: t.arg.id({
        description: "Challenge ID to subscribe to voting updates for",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    subscribe: async function* (_root, args, context) {
      // Get PubSub service from DI container
      const pubSubService =
        context.container.resolve<import("@mirai-app/use-cases").PubSubService>(
          "pubSubService",
        );

      // Subscribe to the voting channel for this challenge
      const channel = `voting:${args.challengeId}`;
      const subscription = pubSubService.subscribe<{
        challengeId: string;
        totalVotes: number;
        uniqueVoters: number;
        submissions: Array<{
          submissionId: string;
          voteCount: number;
          voteScore: number;
          rank?: number;
        }>;
        isComplete: boolean;
        endsAt?: Date;
      }>(channel);

      try {
        // Yield voting progress updates as they are published
        for await (const progress of subscription.asyncIterable) {
          yield progress;
        }
      } finally {
        // Clean up subscription when client disconnects
        subscription.unsubscribe();
      }
    },
    resolve: (payload) => payload,
  }),
);
