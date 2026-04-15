/**
 * ChallengeSubmission GraphQL Types
 *
 * Pothos type definitions for ChallengeSubmission domain.
 * Maps from use case DTOs to GraphQL schema types.
 *
 * ## Types
 *
 * - ChallengeSubmission: Main submission type (from GetSubmissionOutput)
 * - ChallengeSubmissionCreateResult: Result from create mutation
 * - ChallengeSubmissionUpdateResult: Result from update mutation
 * - ChallengeSubmissionListResult: Paginated list result
 * - SubmissionGroupInfo: Group info embedded in submission
 * - SubmissionReviewerInfo: Reviewer info embedded in submission
 *
 * @module ChallengeSubmission/types
 */

import { builder } from "../builder";
import type {
  GetSubmissionOutput,
  CreateSubmissionOutput,
  UpdateSubmissionOutput,
  ListSubmissionsByChallengeOutput,
} from "@mirai-app/use-cases";

// =============================================================================
// Enums
// =============================================================================

/**
 * Submission status enum
 *
 * Represents the review state of a challenge submission.
 */
export const SubmissionStatusEnum = builder.enumType("SubmissionStatus", {
  description: "The review status of a challenge submission",
  values: ["PENDING", "APPROVED", "REJECTED"] as const,
});

/**
 * Review action enum for mutations
 */
export const ReviewActionEnum = builder.enumType("ReviewAction", {
  description: "Action to take when reviewing a submission",
  values: ["APPROVE", "REJECT"] as const,
});

/**
 * Order by field for submission listings
 */
export const SubmissionOrderByEnum = builder.enumType("SubmissionOrderBy", {
  description: "Field to order submissions by",
  values: ["voteScore", "createdAt"] as const,
});

/**
 * Order direction for sorting
 */
export const OrderDirectionEnum = builder.enumType("OrderDirection", {
  description: "Direction for ordering results",
  values: ["asc", "desc"] as const,
});

// =============================================================================
// Embedded Types
// =============================================================================

/**
 * Group information embedded in submission
 */
export const SubmissionGroupInfoType = builder.objectType(
  "SubmissionGroupInfo",
  {
    description: "Group information embedded in a submission",
    authScopes: { public: true },
    fields: (t) => ({
      id: t.exposeID("id", {
        description: "Group ID",
        nullable: false,
      }),
      name: t.exposeString("name", {
        description: "Group name",
        nullable: false,
      }),
      description: t.exposeString("description", {
        description: "Group description",
        nullable: true,
      }),
      image: t.exposeString("image", {
        description: "Group image URL",
        nullable: true,
      }),
    }),
  },
);

/**
 * Reviewer information embedded in submission
 */
export const SubmissionReviewerInfoType = builder.objectType(
  "SubmissionReviewerInfo",
  {
    description: "Reviewer information embedded in a submission",
    authScopes: { public: true },
    fields: (t) => ({
      id: t.exposeID("id", {
        description: "Reviewer user ID",
        nullable: false,
      }),
      firstName: t.exposeString("firstName", {
        description: "Reviewer's first name",
        nullable: false,
      }),
      lastName: t.exposeString("lastName", {
        description: "Reviewer's last name",
        nullable: false,
      }),
      email: t.exposeString("email", {
        description: "Reviewer's email",
        nullable: true,
      }),
    }),
  },
);

// =============================================================================
// Main ChallengeSubmission Type
// =============================================================================

/**
 * ChallengeSubmission type for GraphQL schema
 *
 * Derived from GetSubmissionOutput DTO to maintain type safety
 * between domain layer and API layer.
 */
export const ChallengeSubmissionType = builder.objectType(
  "ChallengeSubmission",
  {
    description: "A challenge submission made by a group",
    authScopes: { public: true },
    fields: (t) => ({
      // -------------------------------------------------------------------------
      // Identity Fields
      // -------------------------------------------------------------------------

      id: t.field({
        type: "ID",
        description: "Unique identifier for the submission",
        nullable: false,
        resolve: (submission: GetSubmissionOutput) =>
          typeof submission.id === "string"
            ? submission.id
            : submission.id.value,
      }),

      challengeId: t.exposeID("challengeId", {
        description: "ID of the challenge this submission is for",
        nullable: false,
      }),

      groupId: t.exposeID("groupId", {
        description: "ID of the group that made this submission",
        nullable: false,
      }),

      // -------------------------------------------------------------------------
      // Content Fields
      // -------------------------------------------------------------------------

      imageIds: t.field({
        type: ["String"],
        description: "IDs of uploaded images",
        nullable: false,
        resolve: (submission: GetSubmissionOutput) => submission.imageIds,
      }),

      videoId: t.exposeString("videoId", {
        description: "ID of uploaded video (if any)",
        nullable: true,
      }),

      textContent: t.exposeString("textContent", {
        description: "Text content of the submission",
        nullable: true,
      }),

      // -------------------------------------------------------------------------
      // Location Fields
      // -------------------------------------------------------------------------

      latitude: t.exposeFloat("latitude", {
        description: "Latitude coordinate (optional)",
        nullable: true,
      }),

      longitude: t.exposeFloat("longitude", {
        description: "Longitude coordinate (optional)",
        nullable: true,
      }),

      // -------------------------------------------------------------------------
      // Status Fields
      // -------------------------------------------------------------------------

      status: t.field({
        type: SubmissionStatusEnum,
        description: "Current review status of the submission",
        nullable: false,
        resolve: (submission: GetSubmissionOutput) =>
          submission.status as "PENDING" | "APPROVED" | "REJECTED",
      }),

      // -------------------------------------------------------------------------
      // Review Fields
      // -------------------------------------------------------------------------

      reviewedById: t.exposeID("reviewedById", {
        description: "ID of user who reviewed this submission",
        nullable: true,
      }),

      reviewedAt: t.field({
        type: "DateTime",
        description: "When the submission was reviewed",
        nullable: true,
        resolve: (submission: GetSubmissionOutput) => submission.reviewedAt,
      }),

      rejectionReason: t.exposeString("rejectionReason", {
        description: "Reason for rejection (if rejected)",
        nullable: true,
      }),

      // -------------------------------------------------------------------------
      // Points & Ranking
      // -------------------------------------------------------------------------

      awardedPoints: t.exposeInt("awardedPoints", {
        description: "Points awarded for this submission",
        nullable: false,
      }),

      bonusPoints: t.exposeInt("bonusPoints", {
        description: "Bonus points awarded",
        nullable: false,
      }),

      ranking: t.exposeInt("ranking", {
        description: "Ranking position (1-3) if awarded",
        nullable: true,
      }),

      // -------------------------------------------------------------------------
      // Voting Fields
      // -------------------------------------------------------------------------

      voteCount: t.exposeInt("voteCount", {
        description: "Number of votes received",
        nullable: false,
      }),

      voteScore: t.exposeFloat("voteScore", {
        description: "Calculated vote score",
        nullable: false,
      }),

      // -------------------------------------------------------------------------
      // Timestamp Fields
      // -------------------------------------------------------------------------

      createdAt: t.field({
        type: "DateTime",
        description: "When the submission was created",
        nullable: false,
        resolve: (submission: GetSubmissionOutput) => submission.createdAt,
      }),

      updatedAt: t.field({
        type: "DateTime",
        description: "When the submission was last updated",
        nullable: false,
        resolve: (submission: GetSubmissionOutput) => submission.updatedAt,
      }),

      // -------------------------------------------------------------------------
      // Related Objects
      // -------------------------------------------------------------------------

      group: t.field({
        type: SubmissionGroupInfoType,
        description: "Group that made this submission",
        nullable: true,
        resolve: (submission: GetSubmissionOutput) => submission.group,
      }),

      reviewedBy: t.field({
        type: SubmissionReviewerInfoType,
        description: "User who reviewed this submission",
        nullable: true,
        resolve: (submission: GetSubmissionOutput) => submission.reviewedBy,
      }),

      // -------------------------------------------------------------------------
      // Computed Fields
      // -------------------------------------------------------------------------

      hasLocation: t.boolean({
        description: "Whether the submission has location coordinates",
        nullable: false,
        resolve: (submission: GetSubmissionOutput) =>
          submission.latitude !== null && submission.longitude !== null,
      }),

      hasMedia: t.boolean({
        description: "Whether the submission has images or video",
        nullable: false,
        resolve: (submission: GetSubmissionOutput) =>
          submission.imageIds.length > 0 || submission.videoId !== null,
      }),

      totalPoints: t.int({
        description: "Total points (awarded + bonus)",
        nullable: false,
        resolve: (submission: GetSubmissionOutput) =>
          submission.awardedPoints + submission.bonusPoints,
      }),
    }),
  },
);

// =============================================================================
// Create Submission Result Type
// =============================================================================

/**
 * Result type for create submission mutation
 *
 * Derived from CreateSubmissionOutput DTO.
 */
export const ChallengeSubmissionCreateResultType = builder.objectType(
  "ChallengeSubmissionCreateResult",
  {
    description: "Result of creating a challenge submission",
    authScopes: { public: true },
    fields: (t) => ({
      id: t.field({
        type: "ID",
        description: "Unique identifier for the submission",
        nullable: false,
        resolve: (submission: CreateSubmissionOutput) =>
          typeof submission.id === "string"
            ? submission.id
            : submission.id.value,
      }),

      challengeId: t.exposeID("challengeId", {
        description: "ID of the challenge this submission is for",
        nullable: false,
      }),

      groupId: t.exposeID("groupId", {
        description: "ID of the group that made this submission",
        nullable: false,
      }),

      imageIds: t.field({
        type: ["String"],
        description: "IDs of uploaded images",
        nullable: false,
        resolve: (submission: CreateSubmissionOutput) => submission.imageIds,
      }),

      videoId: t.exposeString("videoId", {
        description: "ID of uploaded video (if any)",
        nullable: true,
      }),

      textContent: t.exposeString("textContent", {
        description: "Text content of the submission",
        nullable: true,
      }),

      latitude: t.exposeFloat("latitude", {
        description: "Latitude coordinate (optional)",
        nullable: true,
      }),

      longitude: t.exposeFloat("longitude", {
        description: "Longitude coordinate (optional)",
        nullable: true,
      }),

      status: t.field({
        type: SubmissionStatusEnum,
        description: "Current review status of the submission",
        nullable: false,
        resolve: (submission: CreateSubmissionOutput) =>
          submission.status as "PENDING" | "APPROVED" | "REJECTED",
      }),

      awardedPoints: t.exposeInt("awardedPoints", {
        description: "Points awarded for this submission",
        nullable: false,
      }),

      bonusPoints: t.exposeInt("bonusPoints", {
        description: "Bonus points awarded",
        nullable: false,
      }),

      ranking: t.exposeInt("ranking", {
        description: "Ranking position (1-3) if awarded",
        nullable: true,
      }),

      voteCount: t.exposeInt("voteCount", {
        description: "Number of votes received",
        nullable: false,
      }),

      voteScore: t.exposeFloat("voteScore", {
        description: "Calculated vote score",
        nullable: false,
      }),

      createdAt: t.field({
        type: "DateTime",
        description: "When the submission was created",
        nullable: false,
        resolve: (submission: CreateSubmissionOutput) => submission.createdAt,
      }),

      // Computed
      hasLocation: t.boolean({
        description: "Whether the submission has location coordinates",
        nullable: false,
        resolve: (submission: CreateSubmissionOutput) =>
          submission.latitude !== null && submission.longitude !== null,
      }),

      hasMedia: t.boolean({
        description: "Whether the submission has images or video",
        nullable: false,
        resolve: (submission: CreateSubmissionOutput) =>
          submission.imageIds.length > 0 || submission.videoId !== null,
      }),

      totalPoints: t.int({
        description: "Total points (awarded + bonus)",
        nullable: false,
        resolve: (submission: CreateSubmissionOutput) =>
          submission.awardedPoints + submission.bonusPoints,
      }),

      // Null fields for interface compatibility
      reviewedById: t.field({
        type: "ID",
        description: "ID of user who reviewed this submission",
        nullable: true,
        resolve: () => null,
      }),

      reviewedAt: t.field({
        type: "DateTime",
        description: "When the submission was reviewed",
        nullable: true,
        resolve: () => null,
      }),

      rejectionReason: t.field({
        type: "String",
        description: "Reason for rejection (if rejected)",
        nullable: true,
        resolve: () => null,
      }),

      updatedAt: t.field({
        type: "DateTime",
        description: "When the submission was last updated",
        nullable: false,
        resolve: (submission: CreateSubmissionOutput) => submission.createdAt,
      }),

      group: t.field({
        type: SubmissionGroupInfoType,
        description: "Group that made this submission",
        nullable: true,
        resolve: () => null,
      }),

      reviewedBy: t.field({
        type: SubmissionReviewerInfoType,
        description: "User who reviewed this submission",
        nullable: true,
        resolve: () => null,
      }),
    }),
  },
);

// =============================================================================
// Update Submission Result Type
// =============================================================================

/**
 * Result type for update submission mutation
 *
 * Derived from UpdateSubmissionOutput DTO.
 */
export const ChallengeSubmissionUpdateResultType = builder.objectType(
  "ChallengeSubmissionUpdateResult",
  {
    description: "Result of updating a challenge submission",
    authScopes: { public: true },
    fields: (t) => ({
      id: t.field({
        type: "ID",
        description: "Unique identifier for the submission",
        nullable: false,
        resolve: (submission: UpdateSubmissionOutput) =>
          typeof submission.id === "string"
            ? submission.id
            : submission.id.value,
      }),

      challengeId: t.exposeID("challengeId", {
        description: "ID of the challenge this submission is for",
        nullable: false,
      }),

      groupId: t.exposeID("groupId", {
        description: "ID of the group that made this submission",
        nullable: false,
      }),

      imageIds: t.field({
        type: ["String"],
        description: "IDs of uploaded images",
        nullable: false,
        resolve: (submission: UpdateSubmissionOutput) => submission.imageIds,
      }),

      videoId: t.exposeString("videoId", {
        description: "ID of uploaded video (if any)",
        nullable: true,
      }),

      textContent: t.exposeString("textContent", {
        description: "Text content of the submission",
        nullable: true,
      }),

      latitude: t.exposeFloat("latitude", {
        description: "Latitude coordinate (optional)",
        nullable: true,
      }),

      longitude: t.exposeFloat("longitude", {
        description: "Longitude coordinate (optional)",
        nullable: true,
      }),

      status: t.field({
        type: SubmissionStatusEnum,
        description: "Current review status of the submission",
        nullable: false,
        resolve: (submission: UpdateSubmissionOutput) =>
          submission.status as "PENDING" | "APPROVED" | "REJECTED",
      }),

      reviewedById: t.exposeID("reviewedById", {
        description: "ID of user who reviewed this submission",
        nullable: true,
      }),

      reviewedAt: t.field({
        type: "DateTime",
        description: "When the submission was reviewed",
        nullable: true,
        resolve: (submission: UpdateSubmissionOutput) => submission.reviewedAt,
      }),

      rejectionReason: t.exposeString("rejectionReason", {
        description: "Reason for rejection (if rejected)",
        nullable: true,
      }),

      awardedPoints: t.exposeInt("awardedPoints", {
        description: "Points awarded for this submission",
        nullable: false,
      }),

      bonusPoints: t.exposeInt("bonusPoints", {
        description: "Bonus points awarded",
        nullable: false,
      }),

      ranking: t.exposeInt("ranking", {
        description: "Ranking position (1-3) if awarded",
        nullable: true,
      }),

      voteCount: t.exposeInt("voteCount", {
        description: "Number of votes received",
        nullable: false,
      }),

      voteScore: t.exposeFloat("voteScore", {
        description: "Calculated vote score",
        nullable: false,
      }),

      updatedAt: t.field({
        type: "DateTime",
        description: "When the submission was last updated",
        nullable: false,
        resolve: (submission: UpdateSubmissionOutput) => submission.updatedAt,
      }),

      // Computed
      hasLocation: t.boolean({
        description: "Whether the submission has location coordinates",
        nullable: false,
        resolve: (submission: UpdateSubmissionOutput) =>
          submission.latitude !== null && submission.longitude !== null,
      }),

      hasMedia: t.boolean({
        description: "Whether the submission has images or video",
        nullable: false,
        resolve: (submission: UpdateSubmissionOutput) =>
          submission.imageIds.length > 0 || submission.videoId !== null,
      }),

      totalPoints: t.int({
        description: "Total points (awarded + bonus)",
        nullable: false,
        resolve: (submission: UpdateSubmissionOutput) =>
          submission.awardedPoints + submission.bonusPoints,
      }),

      // Interface compatibility fields
      createdAt: t.field({
        type: "DateTime",
        description: "When the submission was created",
        nullable: false,
        resolve: (submission: UpdateSubmissionOutput) => submission.updatedAt,
      }),

      group: t.field({
        type: SubmissionGroupInfoType,
        description: "Group that made this submission",
        nullable: true,
        resolve: () => null,
      }),

      reviewedBy: t.field({
        type: SubmissionReviewerInfoType,
        description: "User who reviewed this submission",
        nullable: true,
        resolve: () => null,
      }),
    }),
  },
);

// =============================================================================
// List Result Type
// =============================================================================

/**
 * Result type for paginated submission listings
 */
export const ChallengeSubmissionListResultType = builder.objectType(
  "ChallengeSubmissionListResult",
  {
    description: "Paginated list of challenge submissions",
    authScopes: { public: true },
    fields: (t) => ({
      submissions: t.field({
        type: [ChallengeSubmissionType],
        description: "List of submissions",
        nullable: false,
        resolve: (result: ListSubmissionsByChallengeOutput) =>
          result.submissions,
      }),

      totalCount: t.exposeInt("totalCount", {
        description: "Total number of submissions (for pagination)",
        nullable: false,
      }),
    }),
  },
);

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for creating a submission
 */
export const CreateSubmissionInput = builder.inputType(
  "CreateSubmissionInput",
  {
    description: "Input for creating a new challenge submission",
    fields: (t) => ({
      challengeId: t.id({
        description: "ID of the challenge to submit to",
        required: true,
      }),
      groupId: t.id({
        description: "ID of the group making the submission",
        required: true,
      }),
      imageIds: t.field({
        type: ["String"],
        description: "IDs of uploaded images (max 10)",
        required: false,
      }),
      videoId: t.string({
        description: "ID of uploaded video",
        required: false,
      }),
      textContent: t.string({
        description: "Text content of the submission",
        required: false,
      }),
      latitude: t.float({
        description: "Latitude coordinate",
        required: false,
      }),
      longitude: t.float({
        description: "Longitude coordinate",
        required: false,
      }),
    }),
  },
);

/**
 * Input for updating a submission
 */
export const UpdateSubmissionInput = builder.inputType(
  "UpdateSubmissionInput",
  {
    description: "Input for updating a challenge submission",
    fields: (t) => ({
      submissionId: t.id({
        description: "ID of the submission to update",
        required: true,
      }),
      // Content fields
      imageIds: t.field({
        type: ["String"],
        description: "New image IDs (replaces existing)",
        required: false,
      }),
      videoId: t.string({
        description: "New video ID (null to remove)",
        required: false,
      }),
      textContent: t.string({
        description: "New text content (null to remove)",
        required: false,
      }),
      latitude: t.float({
        description: "New latitude (null to remove)",
        required: false,
      }),
      longitude: t.float({
        description: "New longitude (null to remove)",
        required: false,
      }),
      // Review fields
      reviewAction: t.field({
        type: ReviewActionEnum,
        description: "Review action (APPROVE or REJECT)",
        required: false,
      }),
      reviewedById: t.id({
        description: "ID of reviewer (required for review actions)",
        required: false,
      }),
      rejectionReason: t.string({
        description: "Reason for rejection (required for REJECT)",
        required: false,
      }),
      awardedPoints: t.int({
        description: "Points to award (for APPROVE action)",
        required: false,
      }),
      bonusPoints: t.int({
        description: "Bonus points to award",
        required: false,
      }),
      ranking: t.int({
        description: "Ranking position 1-3 (for APPROVE action, null to clear)",
        required: false,
      }),
    }),
  },
);

// =============================================================================
// Export
// =============================================================================

export default ChallengeSubmissionType;
