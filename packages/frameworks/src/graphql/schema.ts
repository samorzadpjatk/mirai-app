/**
 * GraphQL Schema Generation
 *
 * Builds the complete GraphQL schema from Pothos type definitions
 * and provides utilities for SDL generation and file output.
 *
 * ## Architecture
 *
 * 1. Import all type definitions (they register themselves with the builder)
 * 2. Build the executable schema
 * 3. Generate SDL (Schema Definition Language) string
 * 4. Optionally save to file for external SDK generation
 *
 * ## Usage
 *
 * ```typescript
 * import { schema, generateSDL } from "./schema";
 *
 * // Get executable schema for Yoga server
 * const yoga = createYoga({ schema });
 *
 * // Generate SDL for external clients
 * const sdl = generateSDL();
 * saveSchemaToFile(sdl, "./graphql-sdl/schema.graphql");
 * ```
 *
 * @module schema
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { printSchema } from "graphql";
import { builder } from "./builder";

// =============================================================================
// Import Type Definitions
// =============================================================================

/**
 * Import all GraphQL type definitions
 *
 * These imports have side effects - they register types with the builder.
 * The order doesn't matter as Pothos resolves type references lazily.
 */
import "./types/User";
import "./types/activityFeed";
import "./types/reward"; // Load before challenge (provides PaginationInput)
import "./types/challenge";
import "./types/notificationDelivery";
import "./types/notifications";
import "./types/challengeSubmission";
import "./types/submissionReport";
import "./types/challengeVote";
import "./types/coin";
import "./types/notificationSchedule";
import "./types/storage";
import "./types/location";
import "./types/sponsor";

/**
 * Import Subscription types
 *
 * This imports all subscription types including:
 * - activityFeedUpdated(tripId: ID!): Activity!
 * - locationUpdated(userIds: [ID!]!): FriendLocation!
 * - challengeVotingUpdated(challengeId: ID!): VotingProgress!
 */
import "./types/subscriptions";

/**
 * Import Query type and resolvers
 *
 * This imports all query fields including:
 * - user(id: ID!): User
 * - users(limit: Int, offset: Int): [User!]!
 * - me: User
 * - activitiesByTrip(input: GetByTripInput!): ActivityFeedResult!
 * - activity(id: ID!): Activity
 */
import "./types/Query";

/**
 * Import User resolvers
 *
 * This imports all User queries and mutations including:
 * - user(id: ID!): User
 * - users(limit: Int, offset: Int): [User!]!
 * - me: User
 * - createUser(input: CreateUserInput!): UserCreateResult
 * - updateUser(input: UpdateUserInput!): UserUpdateResult
 */
import "./resolvers/User";

/**
 * Import notification sender resolvers
 *
 * This imports all notification sender mutations including:
 * - sendMobileNotifications(input: SendMobileNotificationsInput!): SendMobileNotificationsPayload
 * - trackDeliveryStart(input: TrackDeliveryStartInput!): TrackDeliveryStartPayload
 * - trackDeliveryComplete(input: TrackDeliveryCompleteInput!): TrackDeliveryCompletePayload
 * - trackDeliveryFailure(input: TrackDeliveryFailureInput!): TrackDeliveryFailurePayload
 * - checkInactiveUsers: CheckInactiveUsersPayload
 */
import "./resolvers/notificationSender";

/**
 * Import reward resolvers
 *
 * This imports all reward queries and mutations including:
 * - rewardsByTrip(tripId: ID!, pagination: PaginationInput): RewardsConnection!
 * - rewardsByTripAdmin(tripId: ID!, pagination: PaginationInput): RewardsConnection!
 * - reward(id: ID!): Reward
 * - purchaseHistory(tripId: ID!, pagination: PaginationInput): PurchaseHistoryConnection!
 * - totalAvailablePoints(tripId: ID!): TotalAvailablePointsPayload!
 * - createReward(input: CreateRewardInput!): CreateRewardPayload!
 * - updateReward(input: UpdateRewardInput!): UpdateRewardPayload!
 * - setRewardHidden(input: SetRewardHiddenInput!): SetRewardHiddenPayload!
 * - deleteReward(id: ID!): DeleteRewardPayload!
 * - purchaseReward(input: PurchaseRewardInput!): PurchaseRewardPayload!
 * - updatePurchaseStatus(input: UpdatePurchaseStatusInput!): UpdatePurchaseStatusPayload!
 * - updateMyPurchaseStatus(input: UpdateMyPurchaseStatusInput!): UpdateMyPurchaseStatusPayload!
 */
import "./resolvers/reward";

/**
 * Import notifications resolvers
 *
 * This imports all notifications queries and mutations including:
 * - myNotifications(input: NotificationPaginationInput): MyNotificationsResult!
 * - allNotifications(input: GetAllNotificationsInput): AllNotificationsResult!
 * - notification(id: ID!): Notification
 * - createNotification(input: CreateNotificationInput!): CreateNotificationResult!
 * - updateNotification(input: UpdateNotificationInput!): UpdateNotificationResult!
 * - updateNotificationStatus(input: UpdateNotificationStatusInput!): UpdateNotificationStatusResult!
 * - deleteNotification(input: DeleteNotificationInput!): DeleteNotificationResult!
 */
import "./resolvers/notifications";

/**
 * Import coin resolvers
 *
 * This imports all coin mutations including:
 * - addCoins(input: AddCoinsInput!): CoinTransactionResult
 * - removeCoins(input: RemoveCoinsInput!): CoinTransactionResult
 */
import "./resolvers/coin";

/**
 * Import notification schedule resolvers
 *
 * This imports all notification schedule queries and mutations including:
 * - notificationSchedule(id: ID!): NotificationSchedule
 * - notificationSchedules(...): NotificationSchedulesConnection!
 * - activeNotificationSchedules(...): [NotificationSchedule!]!
 * - upcomingNotificationSchedules(...): [NotificationSchedule!]!
 * - notificationScheduleExecutionHistory(...): ExecutionHistoryResult!
 * - createNotificationSchedule(input: CreateNotificationScheduleInput!): CreateNotificationSchedulePayload!
 * - updateNotificationSchedule(input: UpdateNotificationScheduleInput!): UpdateNotificationSchedulePayload!
 * - toggleNotificationScheduleActive(id: ID!): ToggleScheduleActivePayload!
 * - duplicateNotificationSchedule(id: ID!): DuplicateNotificationSchedulePayload!
 * - deleteNotificationSchedule(id: ID!): DeleteNotificationSchedulePayload!
 * - bulkDeleteNotificationSchedules(ids: [ID!]!): BulkDeleteNotificationSchedulesPayload!
 * - bulkToggleNotificationScheduleActive(ids: [ID!]!, isActive: Boolean!): BulkToggleActivePayload!
 * - updateNotificationScheduleLastRun(input: UpdateLastRunInput!): UpdateLastRunPayload!
 */
import "./resolvers/notificationSchedule";

/**
 * Import challenge vote resolvers
 *
 * This imports all challenge vote queries and mutations including:
 * - myVotes(input: GetMyVotesInput!): ChallengeVoteList!
 * - votesByChallenge(input: GetVotesByChallengeInput!): ChallengeVoteAdminList!
 * - votingProgress(input: GetVotingProgressInput!): VotingProgress!
 * - judgedStaffVotingProgress(input: GetJudgedStaffVotingProgressInput!): JudgedStaffVotingProgress!
 * - submitVote(input: SubmitVoteInput!): SubmitVotePayload!
 * - submitVotes(input: SubmitVotesInput!): SubmitVotesPayload!
 * - forceEndVoting(input: ForceEndVotingInput!): ForceEndVotingPayload!
 */
import "./resolvers/challengeVote";

/**
 * Import storage resolvers
 *
 * This imports all storage queries and mutations including:
 * - createDownloadUrl(input: CreateDownloadUrlInput!): DownloadUrlResult
 * - createPublicUrl(input: CreatePublicUrlInput!): PublicUrlResult
 * - createUploadUrl(input: CreateUploadUrlInput!): UploadUrlResult
 */
import "./resolvers/storage";

/**
 * Import sponsor resolvers
 *
 * This imports all sponsor queries and mutations including:
 * - sponsors: SponsorListResult!
 * - sponsor(id: ID!): Sponsor
 * - sponsorsByTrip(tripId: ID!): [Sponsor!]!
 * - createSponsor(input: CreateSponsorInput!): CreateSponsorPayload!
 * - updateSponsor(input: UpdateSponsorInput!): UpdateSponsorPayload!
 * - deleteSponsor(id: ID!): DeleteSponsorPayload!
 * - linkSponsorToTrip(input: LinkSponsorToTripInput!): LinkSponsorToTripPayload!
 * - unlinkSponsorFromTrip(input: UnlinkSponsorFromTripInput!): UnlinkSponsorFromTripPayload!
 */
import "./resolvers/sponsor";

// =============================================================================
// Schema Building
// =============================================================================

/**
 * Build the executable GraphQL schema
 *
 * This creates a ready-to-use GraphQL schema from all registered
 * Pothos type definitions.
 */
export const schema = builder.toSchema();

// =============================================================================
// SDL Generation
// =============================================================================

/**
 * Generate GraphQL SDL (Schema Definition Language) string
 *
 * Converts the executable schema to a human-readable SDL document
 * suitable for external SDK generation and documentation.
 *
 * @returns GraphQL SDL string
 */
export function generateSDL(): string {
  return printSchema(schema);
}

// =============================================================================
// File Output
// =============================================================================

/**
 * Get default SDL output path
 *
 * Returns the absolute path to the schema.graphql file
 * in the graphql-client package for GraphQL Code Generator.
 */
function getDefaultOutputPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // Output to packages/graphql-client/src/generated/graphql/schema.graphql
  // for use by GraphQL Code Generator
  return resolve(
    __dirname,
    "../../../../packages/graphql-client/src/generated/graphql/schema.graphql",
  );
}

/**
 * Save SDL to file
 *
 * Writes the GraphQL schema to a file, creating directories if needed.
 *
 * @param sdl - The SDL string to save
 * @param filePath - Optional custom file path (defaults to graphql-sdl/schema.graphql)
 */
export function saveSchemaToFile(sdl: string, filePath?: string): void {
  const outputPath = filePath ?? getDefaultOutputPath();
  const outputDir = dirname(outputPath);

  // Create directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Write SDL file
  const content = `# GraphQL Schema - Mirai App API
# Generated automatically from Pothos type definitions
# Do not edit manually - changes will be overwritten

${sdl}`;

  writeFileSync(outputPath, content, "utf-8");
}

/**
 * Generate and save schema to file
 *
 * Convenience function that generates SDL and saves it to the default location.
 */
export function generateAndSaveSchema(): void {
  const sdl = generateSDL();
  saveSchemaToFile(sdl);
}

// =============================================================================
// CLI Support
// =============================================================================

/**
 * Main execution for CLI usage
 *
 * When run directly (e.g., `bun src/graphql/schema.ts`),
 * generates and saves the schema file.
 */
if (import.meta.main) {
  generateAndSaveSchema();
}

// =============================================================================
// Export
// =============================================================================

export default schema;
