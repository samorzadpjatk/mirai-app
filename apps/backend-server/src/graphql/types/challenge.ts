/**
 * Challenge GraphQL Type
 *
 * Pothos type definition for the Challenge domain entity.
 * Maps from GetChallengeOutput DTO to GraphQL schema type.
 *
 * ## Fields
 *
 * - id: Unique challenge ID (UUID)
 * - tripId: Associated trip ID
 * - name: Challenge name
 * - description: Challenge description (nullable)
 * - image: Challenge image URL (nullable)
 * - submissionType: Type of submission required
 * - scoringCategory: How the challenge is scored
 * - isRecurring: Whether challenge repeats daily
 * - basePoints: Base points awarded for completion
 * - status: Current challenge status
 * - startTime/endTime: Challenge availability window
 * - targetLatitude/targetLongitude: Location requirements
 * - expectedValue: Expected answer for QR/text challenges
 * - autoApprove: Whether submissions are auto-approved
 * - createdAt: When challenge was created
 * - computed fields: isActive, isOpenForSubmission, requiresLocation, etc.
 *
 * @module Challenge
 */

import { builder } from "../builder";
import type {
  CreateChallengeOutput,
  UpdateChallengeOutput,
  UpdateChallengeStatusOutput,
} from "@mirai-app/use-cases";
import type {
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";

// =============================================================================
// Enum Types
// =============================================================================

/**
 * Challenge submission types
 */
export const SubmissionTypeEnum = builder.enumType("SubmissionType", {
  description: "Type of submission required for a challenge",
  values: {
    IMAGE: { value: "IMAGE" as SubmissionType },
    MULTI_IMAGE: { value: "MULTI_IMAGE" as SubmissionType },
    VIDEO: { value: "VIDEO" as SubmissionType },
    TEXT: { value: "TEXT" as SubmissionType },
    IMAGE_LOCATION: { value: "IMAGE_LOCATION" as SubmissionType },
    LOCATION: { value: "LOCATION" as SubmissionType },
    QR_CODE: { value: "QR_CODE" as SubmissionType },
  },
});

/**
 * Challenge scoring categories
 */
export const ScoringCategoryEnum = builder.enumType("ScoringCategory", {
  description: "How points are awarded for a challenge",
  values: {
    SPEED: { value: "SPEED" as ScoringCategory },
    UNLIMITED: { value: "UNLIMITED" as ScoringCategory },
    JUDGED_STAFF: { value: "JUDGED_STAFF" as ScoringCategory },
    PEER_VOTING: { value: "PEER_VOTING" as ScoringCategory },
  },
});

/**
 * Challenge status workflow
 */
export const ChallengeStatusEnum = builder.enumType("ChallengeStatus", {
  description: "Current status of a challenge in its lifecycle",
  values: {
    HIDDEN: { value: "HIDDEN" as ChallengeStatus },
    VISIBLE: { value: "VISIBLE" as ChallengeStatus },
    ACTIVE: { value: "ACTIVE" as ChallengeStatus },
    VOTING_PHASE: { value: "VOTING_PHASE" as ChallengeStatus },
    COMPLETED: { value: "COMPLETED" as ChallengeStatus },
    CANCELLED: { value: "CANCELLED" as ChallengeStatus },
  },
});

// =============================================================================
// Challenge Object Type
// =============================================================================

/**
 * Challenge type for GraphQL schema
 *
 * Derived from GetChallengeOutput DTO to maintain type safety
 * between domain layer and API layer.
 */
export const ChallengeType = builder.objectType("Challenge", {
  description: "A challenge/task within a trip",
  authScopes: {
    public: true, // Challenge info is publicly viewable
  },
  fields: (t) => ({
    // -------------------------------------------------------------------------
    // Identity Fields
    // -------------------------------------------------------------------------

    id: t.exposeID("id", {
      description: "Unique identifier for the challenge (UUID)",
      nullable: false,
    }),

    tripId: t.exposeID("tripId", {
      description: "ID of the trip this challenge belongs to",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Basic Fields
    // -------------------------------------------------------------------------

    name: t.exposeString("name", {
      description: "Challenge name/title",
      nullable: false,
    }),

    description: t.exposeString("description", {
      description: "Challenge description (optional)",
      nullable: true,
    }),

    image: t.exposeString("image", {
      description: "Challenge image URL (optional)",
      nullable: true,
    }),

    // -------------------------------------------------------------------------
    // Type & Scoring Fields
    // -------------------------------------------------------------------------

    submissionType: t.field({
      type: SubmissionTypeEnum,
      description: "Type of submission required",
      nullable: false,
      resolve: (challenge) => challenge.submissionType as SubmissionType,
    }),

    scoringCategory: t.field({
      type: ScoringCategoryEnum,
      description: "How points are awarded for this challenge",
      nullable: false,
      resolve: (challenge) => challenge.scoringCategory as ScoringCategory,
    }),

    isRecurring: t.exposeBoolean("isRecurring", {
      description: "Whether this challenge repeats daily",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Points Fields
    // -------------------------------------------------------------------------

    basePoints: t.exposeInt("basePoints", {
      description: "Base points awarded for completing this challenge",
      nullable: false,
    }),

    firstPlacePoints: t.exposeInt("firstPlacePoints", {
      description: "Bonus points for 1st place (speed challenges)",
      nullable: true,
    }),

    secondPlacePoints: t.exposeInt("secondPlacePoints", {
      description: "Bonus points for 2nd place (speed challenges)",
      nullable: true,
    }),

    thirdPlacePoints: t.exposeInt("thirdPlacePoints", {
      description: "Bonus points for 3rd place (speed challenges)",
      nullable: true,
    }),

    // -------------------------------------------------------------------------
    // Status & Schedule Fields
    // -------------------------------------------------------------------------

    status: t.field({
      type: ChallengeStatusEnum,
      description: "Current status of the challenge",
      nullable: false,
      resolve: (challenge) => challenge.status as ChallengeStatus,
    }),

    startTime: t.field({
      type: "DateTime",
      description: "When the challenge becomes available",
      nullable: true,
      resolve: (challenge) => challenge.startTime,
    }),

    endTime: t.field({
      type: "DateTime",
      description: "When the challenge closes",
      nullable: true,
      resolve: (challenge) => challenge.endTime,
    }),

    dailyStartTime: t.exposeString("dailyStartTime", {
      description: "Daily opening time (HH:MM) for recurring challenges",
      nullable: true,
    }),

    dailyEndTime: t.exposeString("dailyEndTime", {
      description: "Daily closing time (HH:MM) for recurring challenges",
      nullable: true,
    }),

    // -------------------------------------------------------------------------
    // Location Fields
    // -------------------------------------------------------------------------

    targetLatitude: t.exposeFloat("targetLatitude", {
      description: "Target latitude for location-based challenges",
      nullable: true,
    }),

    targetLongitude: t.exposeFloat("targetLongitude", {
      description: "Target longitude for location-based challenges",
      nullable: true,
    }),

    // -------------------------------------------------------------------------
    // Validation Fields
    // -------------------------------------------------------------------------

    expectedValue: t.exposeString("expectedValue", {
      description: "Expected answer for QR code or text challenges",
      nullable: true,
    }),

    autoApprove: t.exposeBoolean("autoApprove", {
      description: "Whether submissions are automatically approved",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Timestamp Fields
    // -------------------------------------------------------------------------

    createdAt: t.field({
      type: "DateTime",
      description: "When the challenge was created",
      nullable: false,
      resolve: (challenge) => challenge.createdAt,
    }),

    // -------------------------------------------------------------------------
    // Computed Fields
    // -------------------------------------------------------------------------

    isActive: t.boolean({
      description: "Whether the challenge is currently active",
      nullable: false,
      resolve: (challenge) => challenge.isActive,
    }),

    isOpenForSubmission: t.boolean({
      description: "Whether submissions are currently accepted",
      nullable: false,
      resolve: (challenge) => challenge.isOpenForSubmission,
    }),

    requiresLocation: t.boolean({
      description: "Whether this challenge requires location data",
      nullable: false,
      resolve: (challenge) => challenge.requiresLocation,
    }),

    requiresQRCode: t.boolean({
      description: "Whether this challenge requires a QR code scan",
      nullable: false,
      resolve: (challenge) => challenge.requiresQRCode,
    }),

    hasVotingPhase: t.boolean({
      description: "Whether this challenge has a peer voting phase",
      nullable: false,
      resolve: (challenge) => challenge.hasVotingPhase,
    }),
  }),
});

// =============================================================================
// Simplified Challenge Type (for list views)
// =============================================================================

/**
 * Simplified challenge type for list views
 * Used when returning lists of challenges with fewer fields
 */
export const ChallengeSummaryType = builder.objectType("ChallengeSummary", {
  description: "A simplified view of a challenge for list displays",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Unique identifier for the challenge",
      nullable: false,
    }),

    tripId: t.exposeID("tripId", {
      description: "ID of the associated trip",
      nullable: false,
    }),

    name: t.exposeString("name", {
      description: "Challenge name",
      nullable: false,
    }),

    description: t.exposeString("description", {
      description: "Challenge description",
      nullable: true,
    }),

    submissionType: t.field({
      type: SubmissionTypeEnum,
      description: "Type of submission required",
      nullable: false,
      resolve: (challenge) =>
        (challenge as { submissionType: string })
          .submissionType as SubmissionType,
    }),

    scoringCategory: t.field({
      type: ScoringCategoryEnum,
      description: "How points are awarded",
      nullable: false,
      resolve: (challenge) =>
        (challenge as { scoringCategory: string })
          .scoringCategory as ScoringCategory,
    }),

    status: t.field({
      type: ChallengeStatusEnum,
      description: "Current challenge status",
      nullable: false,
      resolve: (challenge) =>
        (challenge as { status: string }).status as ChallengeStatus,
    }),

    basePoints: t.exposeInt("basePoints", {
      description: "Base points for completion",
      nullable: false,
    }),

    createdAt: t.field({
      type: "DateTime",
      description: "When the challenge was created",
      nullable: false,
      resolve: (challenge) => (challenge as { createdAt: Date }).createdAt,
    }),
  }),
});

// =============================================================================
// Mutation Output Types
// =============================================================================

/**
 * Output type for create challenge mutation
 */
export const CreateChallengePayloadType = builder.objectType(
  "CreateChallengePayload",
  {
    description: "Result of creating a new challenge",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      challenge: t.field({
        type: ChallengeSummaryType,
        description: "The newly created challenge",
        nullable: false,
        resolve: (payload) =>
          (payload as { challenge: CreateChallengeOutput }).challenge,
      }),
    }),
  },
);

/**
 * Output type for update challenge mutation
 */
export const UpdateChallengePayloadType = builder.objectType(
  "UpdateChallengePayload",
  {
    description: "Result of updating a challenge",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      challenge: t.field({
        type: ChallengeSummaryType,
        description: "The updated challenge",
        nullable: false,
        resolve: (payload) =>
          (payload as { challenge: UpdateChallengeOutput }).challenge,
      }),
    }),
  },
);

/**
 * Output type for update challenge status mutation
 */
export const UpdateChallengeStatusPayloadType = builder.objectType(
  "UpdateChallengeStatusPayload",
  {
    description: "Result of updating a challenge's status",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      challenge: t.field({
        type: ChallengeSummaryType,
        description: "The challenge with updated status",
        nullable: false,
        resolve: (payload) => {
          const output = (payload as { challenge: UpdateChallengeStatusOutput })
            .challenge;
          return {
            id: output.id,
            tripId: output.tripId,
            name: output.name,
            description: null,
            submissionType: "IMAGE",
            scoringCategory: "UNLIMITED",
            status: output.newStatus,
            basePoints: 0,
            createdAt: output.updatedAt,
          };
        },
      }),
      previousStatus: t.field({
        type: ChallengeStatusEnum,
        description: "The previous status before the update",
        nullable: false,
        resolve: (payload) =>
          (payload as { previousStatus: string })
            .previousStatus as ChallengeStatus,
      }),
    }),
  },
);

/**
 * Output type for delete challenge mutation
 */
export const DeleteChallengePayloadType = builder.objectType(
  "DeleteChallengePayload",
  {
    description: "Result of deleting (cancelling) a challenge",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      success: t.boolean({
        description: "Whether the deletion was successful",
        nullable: false,
        resolve: () => true,
      }),
    }),
  },
);

// =============================================================================
// Pagination Types
// =============================================================================

/**
 * Pagination info for challenge lists
 */
export const ChallengePaginationType = builder.objectType(
  "ChallengePagination",
  {
    description: "Pagination metadata for challenge lists",
    fields: (t) => ({
      total: t.exposeInt("total", {
        description: "Total number of challenges available",
        nullable: false,
      }),
      limit: t.exposeInt("limit", {
        description: "Number of items per page",
        nullable: false,
      }),
      offset: t.exposeInt("offset", {
        description: "Number of items skipped",
        nullable: false,
      }),
      hasMore: t.exposeBoolean("hasMore", {
        description: "Whether more items are available",
        nullable: false,
      }),
    }),
  },
);

/**
 * Paginated challenge list result
 */
export const ChallengesConnectionType = builder.objectType(
  "ChallengesConnection",
  {
    description: "A paginated list of challenges with metadata",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      challenges: t.field({
        type: [ChallengeSummaryType],
        description: "The challenges in this page",
        nullable: false,
        resolve: (conn) => (conn as { challenges: unknown[] }).challenges,
      }),
      pagination: t.field({
        type: ChallengePaginationType,
        description: "Pagination metadata",
        nullable: false,
        resolve: (conn) => (conn as { pagination: unknown }).pagination,
      }),
    }),
  },
);

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for pagination
 */
export const ChallengePaginationInput = builder.inputType("ChallengePaginationInput", {
  description: "Pagination parameters for list queries",
  fields: (t) => ({
    limit: t.int({
      description: "Maximum number of items to return (1-100)",
      required: false,
      defaultValue: 30,
    }),
    offset: t.int({
      description: "Number of items to skip",
      required: false,
      defaultValue: 0,
    }),
  }),
});

/**
 * Input for creating a challenge
 */
export const CreateChallengeInput = builder.inputType("CreateChallengeInput", {
  description: "Input for creating a new challenge",
  fields: (t) => ({
    tripId: t.id({
      description: "ID of the trip this challenge belongs to",
      required: true,
    }),
    name: t.string({
      description: "Challenge name (1-200 characters)",
      required: true,
    }),
    description: t.string({
      description: "Challenge description (max 2000 characters)",
      required: false,
    }),
    image: t.string({
      description: "Challenge image URL",
      required: false,
    }),
    submissionType: t.field({
      type: SubmissionTypeEnum,
      description: "Type of submission required",
      required: true,
    }),
    scoringCategory: t.field({
      type: ScoringCategoryEnum,
      description: "How points are awarded",
      required: true,
    }),
    basePoints: t.int({
      description: "Base points for completion (0-10000)",
      required: false,
      defaultValue: 100,
    }),
    firstPlacePoints: t.int({
      description: "Bonus points for 1st place (speed challenges)",
      required: false,
    }),
    secondPlacePoints: t.int({
      description: "Bonus points for 2nd place (speed challenges)",
      required: false,
    }),
    thirdPlacePoints: t.int({
      description: "Bonus points for 3rd place (speed challenges)",
      required: false,
    }),
    status: t.field({
      type: ChallengeStatusEnum,
      description: "Initial challenge status",
      required: false,
    }),
    startTime: t.field({
      type: "DateTime",
      description: "When the challenge becomes available",
      required: false,
    }),
    endTime: t.field({
      type: "DateTime",
      description: "When the challenge closes",
      required: false,
    }),
    targetLatitude: t.float({
      description: "Target latitude for location challenges",
      required: false,
    }),
    targetLongitude: t.float({
      description: "Target longitude for location challenges",
      required: false,
    }),
    expectedValue: t.string({
      description: "Expected answer for QR/text challenges",
      required: false,
    }),
    autoApprove: t.boolean({
      description: "Whether to auto-approve submissions",
      required: false,
      defaultValue: false,
    }),
  }),
});

/**
 * Input for updating a challenge
 */
export const UpdateChallengeInput = builder.inputType("UpdateChallengeInput", {
  description: "Input for updating an existing challenge",
  fields: (t) => ({
    id: t.id({
      description: "ID of the challenge to update",
      required: true,
    }),
    tripId: t.id({
      description: "ID of the trip (for validation)",
      required: true,
    }),
    name: t.string({
      description: "New challenge name (1-200 characters)",
      required: false,
    }),
    description: t.string({
      description: "New description (max 2000 characters)",
      required: false,
    }),
    image: t.string({
      description: "New image URL",
      required: false,
    }),
    basePoints: t.int({
      description: "New base points (0-10000)",
      required: false,
    }),
    firstPlacePoints: t.int({
      description: "New 1st place bonus points",
      required: false,
    }),
    secondPlacePoints: t.int({
      description: "New 2nd place bonus points",
      required: false,
    }),
    thirdPlacePoints: t.int({
      description: "New 3rd place bonus points",
      required: false,
    }),
    startTime: t.field({
      type: "DateTime",
      description: "New start time",
      required: false,
    }),
    endTime: t.field({
      type: "DateTime",
      description: "New end time",
      required: false,
    }),
    targetLatitude: t.float({
      description: "New target latitude",
      required: false,
    }),
    targetLongitude: t.float({
      description: "New target longitude",
      required: false,
    }),
    expectedValue: t.string({
      description: "New expected value",
      required: false,
    }),
    autoApprove: t.boolean({
      description: "New auto-approve setting",
      required: false,
    }),
  }),
});

/**
 * Input for updating challenge status
 */
export const UpdateChallengeStatusInput = builder.inputType(
  "UpdateChallengeStatusInput",
  {
    description: "Input for updating a challenge's status",
    fields: (t) => ({
      id: t.id({
        description: "ID of the challenge",
        required: true,
      }),
      tripId: t.id({
        description: "ID of the trip (for validation)",
        required: true,
      }),
      newStatus: t.field({
        type: ChallengeStatusEnum,
        description: "New status to transition to",
        required: true,
      }),
    }),
  },
);

// =============================================================================
// Export
// =============================================================================

export default ChallengeType;
