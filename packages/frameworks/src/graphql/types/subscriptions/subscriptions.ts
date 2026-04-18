// =============================================================================
// GraphQL Subscriptions
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth } from "../../context.js";
import {
  NotificationReceivedEventType,
  ActivityFeedEventType,
  ChallengeStatusEventType,
  GroupRankingEventType,
  SubmissionReviewedEventType,
  JoinRequestEventType,
  ActivityFeedSubscriptionFilter,
  ChallengeSubscriptionFilter,
  GroupSubscriptionFilter,
  SubmissionSubscriptionFilter,
  JoinRequestSubscriptionFilter,
} from "./types.js";

// =============================================================================
// Pub/Sub Implementation
// =============================================================================

/**
 * Simple in-memory pub/sub for development.
 * In production, use Redis PubSub or similar.
 */
class PubSub {
  private subscribers: Map<string, Set<(data: unknown) => void>> = new Map();

  subscribe(event: string, callback: (data: unknown) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);

    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  publish(event: string, data: unknown): void {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  // Helper to create event names
  static locationEvent(userId: string): string {
    return `location:${userId}`;
  }

  static notificationEvent(userId: string): string {
    return `notification:${userId}`;
  }

  static activityFeedEvent(tripId: string): string {
    return `activity:${tripId}`;
  }

  static challengeEvent(challengeId: string): string {
    return `challenge:${challengeId}`;
  }

  static groupRankingEvent(tripId: string): string {
    return `ranking:${tripId}`;
  }

  static submissionEvent(groupId: string): string {
    return `submission:${groupId}`;
  }

  static joinRequestEvent(groupId: string): string {
    return `joinrequest:${groupId}`;
  }
}

// Global pubsub instance
export const pubsub = new PubSub();

// =============================================================================
// Subscription Fields
// =============================================================================

builder.subscriptionFields((t) => ({
  // ==========================================================================
  // Notifications
  // ==========================================================================

  /**
   * Subscribe to real-time notifications
   */
  notificationReceived: t.field({
    type: NotificationReceivedEventType,
    nullable: true,
    subscribe: async function* (_parent, _args, context: GraphQLContext) {
      const auth = requireAuth(context);
      
      const eventName = PubSub.notificationEvent(auth.userId);
      
      const queue: unknown[] = [];
      let resolve: (() => void) | null = null;
      
      const unsubscribe = pubsub.subscribe(eventName, (data) => {
        queue.push(data);
        if (resolve) {
          resolve();
          resolve = null;
        }
      });

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift();
          } else {
            await new Promise<void>((r) => { resolve = r; });
          }
        }
      } finally {
        unsubscribe();
      }
    },
    resolve: (payload) => payload as {
      id: string;
      type: string;
      priority: string;
      title: string;
      body: string;
      data: unknown;
      receivedAt: Date;
    },
  }),

  // ==========================================================================
  // Activity Feed
  // ==========================================================================

  /**
   * Subscribe to activity feed updates
   */
  activityFeedEvent: t.field({
    type: ActivityFeedEventType,
    nullable: true,
    args: {
      filter: t.arg({ type: ActivityFeedSubscriptionFilter, required: true }),
    },
    subscribe: async function* (_parent, args, context: GraphQLContext) {
      requireAuth(context);
      
      const eventName = PubSub.activityFeedEvent(args.filter.tripId);
      
      const queue: unknown[] = [];
      let resolve: (() => void) | null = null;
      
      const unsubscribe = pubsub.subscribe(eventName, (data) => {
        queue.push(data);
        if (resolve) {
          resolve();
          resolve = null;
        }
      });

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift();
          } else {
            await new Promise<void>((r) => { resolve = r; });
          }
        }
      } finally {
        unsubscribe();
      }
    },
    resolve: (payload) => payload as {
      id: string;
      type: string;
      title: string;
      description: string | null;
      groupId: string | null;
      userId: string | null;
      metadata: unknown;
      createdAt: Date;
    },
  }),

  // ==========================================================================
  // Challenge Status
  // ==========================================================================

  /**
   * Subscribe to challenge status changes
   */
  challengeStatusEvent: t.field({
    type: ChallengeStatusEventType,
    nullable: true,
    args: {
      filter: t.arg({ type: ChallengeSubscriptionFilter, required: true }),
    },
    subscribe: async function* (_parent, args, context: GraphQLContext) {
      requireAuth(context);
      
      const eventName = PubSub.challengeEvent(args.filter.tripId);
      
      const queue: unknown[] = [];
      let resolve: (() => void) | null = null;
      
      const unsubscribe = pubsub.subscribe(eventName, (data) => {
        queue.push(data);
        if (resolve) {
          resolve();
          resolve = null;
        }
      });

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift();
          } else {
            await new Promise<void>((r) => { resolve = r; });
          }
        }
      } finally {
        unsubscribe();
      }
    },
    resolve: (payload) => payload as {
      challengeId: string;
      tripId: string;
      previousStatus: string;
      newStatus: string;
      changedAt: Date;
    },
  }),

  // ==========================================================================
  // Group Rankings
  // ==========================================================================

  /**
   * Subscribe to group ranking changes
   */
  groupRankingEvent: t.field({
    type: GroupRankingEventType,
    nullable: true,
    args: {
      filter: t.arg({ type: GroupSubscriptionFilter, required: true }),
    },
    subscribe: async function* (_parent, args, context: GraphQLContext) {
      requireAuth(context);
      
      const eventName = PubSub.groupRankingEvent(args.filter.tripId);
      
      const queue: unknown[] = [];
      let resolve: (() => void) | null = null;
      
      const unsubscribe = pubsub.subscribe(eventName, (data) => {
        queue.push(data);
        if (resolve) {
          resolve();
          resolve = null;
        }
      });

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift();
          } else {
            await new Promise<void>((r) => { resolve = r; });
          }
        }
      } finally {
        unsubscribe();
      }
    },
    resolve: (payload) => payload as {
      groupId: string;
      tripId: string;
      previousRank: number;
      newRank: number;
      coinChange: number;
      changedAt: Date;
    },
  }),

  // ==========================================================================
  // Submission Reviews
  // ==========================================================================

  /**
   * Subscribe to submission review notifications
   */
  submissionReviewed: t.field({
    type: SubmissionReviewedEventType,
    nullable: true,
    args: {
      filter: t.arg({ type: SubmissionSubscriptionFilter, required: true }),
    },
    subscribe: async function* (_parent, args, context: GraphQLContext) {
      requireAuth(context);
      
      const eventName = PubSub.submissionEvent(args.filter.groupId);
      
      const queue: unknown[] = [];
      let resolve: (() => void) | null = null;
      
      const unsubscribe = pubsub.subscribe(eventName, (data) => {
        queue.push(data);
        if (resolve) {
          resolve();
          resolve = null;
        }
      });

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift();
          } else {
            await new Promise<void>((r) => { resolve = r; });
          }
        }
      } finally {
        unsubscribe();
      }
    },
    resolve: (payload) => payload as {
      submissionId: string;
      challengeId: string;
      groupId: string;
      status: string;
      awardedPoints: number | null;
      reviewedAt: Date;
    },
  }),

  // ==========================================================================
  // Join Requests
  // ==========================================================================

  /**
   * Subscribe to join request notifications
   */
  joinRequestEvent: t.field({
    type: JoinRequestEventType,
    nullable: true,
    args: {
      filter: t.arg({ type: JoinRequestSubscriptionFilter, required: false }),
    },
    subscribe: async function* (_parent, args, context: GraphQLContext) {
      requireAuth(context);
      
      // If groupId provided, subscribe to that group's requests
      // Otherwise subscribe to all groups the user organizes
      const groupId = args.filter?.groupId || "all";
      const eventName = PubSub.joinRequestEvent(groupId);
      
      const queue: unknown[] = [];
      let resolve: (() => void) | null = null;
      
      const unsubscribe = pubsub.subscribe(eventName, (data) => {
        queue.push(data);
        if (resolve) {
          resolve();
          resolve = null;
        }
      });

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift();
          } else {
            await new Promise<void>((r) => { resolve = r; });
          }
        }
      } finally {
        unsubscribe();
      }
    },
    resolve: (payload) => payload as {
      requestId: string;
      groupId: string;
      userId: string;
      userName: string;
      eventType: string;
      createdAt: Date;
    },
  }),
}));