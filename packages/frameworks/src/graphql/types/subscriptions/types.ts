// =============================================================================
// Subscription Types
// =============================================================================

import { builder } from "../../builder.js";
import { FriendLocationEventType } from "../location/types.js";

// =============================================================================
// Event Types - Location (imported from location module)
// =============================================================================

export { FriendLocationEventType } from "../location/types.js";

// =============================================================================
// Event Types - Notifications
// =============================================================================

/**
 * Notification received event
 */
export const NotificationReceivedEventType = builder.objectType("NotificationReceivedEvent", {
  description: "Real-time notification delivery",
  fields: (t) => ({
    id: t.exposeID("id"),
    type: t.exposeString("type"),
    priority: t.exposeString("priority"),
    title: t.exposeString("title"),
    body: t.exposeString("body"),
    data: t.field({ type: "JSON", nullable: true, resolve: (n) => n.data }),
    receivedAt: t.field({ type: "DateTime", resolve: (n) => n.receivedAt }),
  }),
});

// =============================================================================
// Event Types - Activity Feed
// =============================================================================

/**
 * Activity feed item event
 */
export const ActivityFeedEventType = builder.objectType("ActivityFeedEvent", {
  description: "New activity feed item event",
  fields: (t) => ({
    id: t.exposeID("id"),
    type: t.exposeString("type"),
    title: t.exposeString("title"),
    description: t.exposeString("description", { nullable: true }),
    groupId: t.exposeID("groupId", { nullable: true }),
    userId: t.exposeID("userId", { nullable: true }),
    metadata: t.field({ type: "JSON", nullable: true, resolve: (e) => e.metadata }),
    createdAt: t.field({ type: "DateTime", resolve: (e) => e.createdAt }),
  }),
});

// =============================================================================
// Event Types - Challenge
// =============================================================================

/**
 * Challenge status change event
 */
export const ChallengeStatusEventType = builder.objectType("ChallengeStatusEvent", {
  description: "Challenge status change notification",
  fields: (t) => ({
    challengeId: t.exposeID("challengeId"),
    tripId: t.exposeID("tripId"),
    previousStatus: t.exposeString("previousStatus"),
    newStatus: t.exposeString("newStatus"),
    changedAt: t.field({ type: "DateTime", resolve: (e) => e.changedAt }),
  }),
});

// =============================================================================
// Event Types - Group
// =============================================================================

/**
 * Group ranking change event
 */
export const GroupRankingEventType = builder.objectType("GroupRankingEvent", {
  description: "Group ranking position change",
  fields: (t) => ({
    groupId: t.exposeID("groupId"),
    tripId: t.exposeID("tripId"),
    previousRank: t.exposeInt("previousRank"),
    newRank: t.exposeInt("newRank"),
    coinChange: t.exposeInt("coinChange"),
    changedAt: t.field({ type: "DateTime", resolve: (e) => e.changedAt }),
  }),
});

// =============================================================================
// Event Types - Submission
// =============================================================================

/**
 * Submission review event
 */
export const SubmissionReviewedEventType = builder.objectType("SubmissionReviewedEvent", {
  description: "Challenge submission review notification",
  fields: (t) => ({
    submissionId: t.exposeID("submissionId"),
    challengeId: t.exposeID("challengeId"),
    groupId: t.exposeID("groupId"),
    status: t.exposeString("status"),
    awardedPoints: t.exposeInt("awardedPoints", { nullable: true }),
    reviewedAt: t.field({ type: "DateTime", resolve: (e) => e.reviewedAt }),
  }),
});

// =============================================================================
// Event Types - Join Requests
// =============================================================================

/**
 * Join request event
 */
export const JoinRequestEventType = builder.objectType("JoinRequestEvent", {
  description: "Group join request notification",
  fields: (t) => ({
    requestId: t.exposeID("requestId"),
    groupId: t.exposeID("groupId"),
    userId: t.exposeID("userId"),
    userName: t.exposeString("userName"),
    eventType: t.exposeString("eventType"), // CREATED, ACCEPTED, REJECTED, CANCELLED
    createdAt: t.field({ type: "DateTime", resolve: (e) => e.createdAt }),
  }),
});

// =============================================================================
// Subscription Filter Input Types
// =============================================================================

export const LocationSubscriptionFilter = builder.inputType("LocationSubscriptionFilter", {
  fields: (t) => ({
    tripId: t.string({ required: true }),
    friendIds: t.stringList({ required: false }),
  }),
});

export const ActivityFeedSubscriptionFilter = builder.inputType("ActivityFeedSubscriptionFilter", {
  fields: (t) => ({
    tripId: t.string({ required: true }),
    groupId: t.string({ required: false }),
  }),
});

export const ChallengeSubscriptionFilter = builder.inputType("ChallengeSubscriptionFilter", {
  fields: (t) => ({
    tripId: t.string({ required: true }),
    challengeIds: t.stringList({ required: false }),
  }),
});

export const GroupSubscriptionFilter = builder.inputType("GroupSubscriptionFilter", {
  fields: (t) => ({
    tripId: t.string({ required: true }),
    groupId: t.string({ required: false }),
  }),
});

export const SubmissionSubscriptionFilter = builder.inputType("SubmissionSubscriptionFilter", {
  fields: (t) => ({
    groupId: t.string({ required: true }),
    challengeId: t.string({ required: false }),
  }),
});

export const JoinRequestSubscriptionFilter = builder.inputType("JoinRequestSubscriptionFilter", {
  fields: (t) => ({
    groupId: t.string({ required: false }),
    tripId: t.string({ required: false }),
  }),
});
