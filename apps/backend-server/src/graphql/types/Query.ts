/**
 * Root Query Type
 *
 * Defines the root Query type for the GraphQL schema.
 * Individual query fields are registered by importing resolver files
 * that use builder.queryField().
 *
 * @module Query
 */

import { builder } from "../builder";

// =============================================================================
// Import Resolvers
// =============================================================================

/**
 * Import Query type and resolvers
 *
 * This imports all query fields including:
 * - user(id: ID!): User
 * - users(limit: Int, offset: Int): [User!]!
 * - me: User
 * - challengeSubmission(id: ID!): ChallengeSubmission
 * - challengeSubmissionByChallengeAndGroup(challengeId: ID!, groupId: ID!): ChallengeSubmission
 * - challengeSubmissions(challengeId: ID!, ...): ChallengeSubmissionListResult
 * - activitiesByTrip(input: GetByTripInput!): ActivityFeedResult!
 * - activitiesByTripModeration(input: GetByTripModerationInput!): ActivityFeedModerationResult!
 * - activity(id: ID!): Activity
 */
import "../resolvers/User";
import "../resolvers/challengeSubmission";
import "../resolvers/activityFeed";

// =============================================================================
// Query Type Extension (if needed)
// =============================================================================

/**
 * Extend the Query type if additional root fields are needed.
 * Individual domain resolvers should prefer builder.queryField().
 */
builder.queryType({
  description: "Root query type for fetching data",
  authScopes: {
    public: true,
  },
});

// =============================================================================
// Export
// =============================================================================

// Query type is automatically built by the schema
export {};
