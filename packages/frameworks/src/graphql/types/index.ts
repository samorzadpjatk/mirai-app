// =============================================================================
// GraphQL Types Barrel Export
// =============================================================================

/**
 * Types barrel export
 *
 * Re-exports all GraphQL type modules for convenient access.
 * Each domain module self-registers with Pothos via side-effects.
 */

export * from "./user/index.js";
export * from "./trip/index.js";
export * from "./group/index.js";
export * from "./challenge/index.js";
export * from "./challengeSubmission/index.js";
export * from "./challengeVote/index.js";
export * from "./coin/index.js";
export * from "./notification/index.js";
export * from "./reward/index.js";
export * from "./sponsor/index.js";
export * from "./activityFeed/index.js";
export * from "./storage/index.js";
export * from "./location/index.js";
