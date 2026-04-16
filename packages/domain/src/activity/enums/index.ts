/**
 * Activity Enums
 *
 * Enums for activity feed, reactions, and challenge events.
 *
 * @module enums/activity
 */

/**
 * Activity types in the feed
 */
export type ActivityType =
  | "custom"
  | "user_post"
  | "submission"
  | "challenge_event"
  | "rank_change";

/**
 * All valid activity types
 */
export const ACTIVITY_TYPES: ActivityType[] = [
  "custom",
  "user_post",
  "submission",
  "challenge_event",
  "rank_change",
];

/**
 * Challenge event types for challenge_event activities
 */
export type ChallengeEventType =
  | "challenge_started"
  | "voting_started"
  | "completed";

/**
 * All valid challenge event types
 */
export const CHALLENGE_EVENT_TYPES: ChallengeEventType[] = [
  "challenge_started",
  "voting_started",
  "completed",
];

/**
 * Reaction types for activity feed items
 */
export type ReactionType = "heart" | "fire" | "clap" | "star";

/**
 * All valid reaction types
 */
export const REACTION_TYPES: ReactionType[] = ["heart", "fire", "clap", "star"];

/**
 * Type guard to check if a string is a valid ActivityType
 */
export function isActivityType(value: string): value is ActivityType {
  return ACTIVITY_TYPES.includes(value as ActivityType);
}

/**
 * Type guard to check if a string is a valid ChallengeEventType
 */
export function isChallengeEventType(
  value: string,
): value is ChallengeEventType {
  return CHALLENGE_EVENT_TYPES.includes(value as ChallengeEventType);
}

/**
 * Type guard to check if a string is a valid ReactionType
 */
export function isReactionType(value: string): value is ReactionType {
  return REACTION_TYPES.includes(value as ReactionType);
}
