/**
 * ChallengeVote GraphQL Types
 *
 * Pothos type definitions for ChallengeVote domain.
 * Maps from use case DTOs to GraphQL schema types.
 *
 * ## Types
 *
 * - ChallengeVote: Main vote type (from VoteDTO)
 * - ChallengeVoteList: List of votes with metadata
 * - SubmissionVoteCount: Vote count per submission
 * - VotingProgress: Progress for a challenge
 * - JudgedStaffVotingProgress: Admin voting progress
 * - AdminVotingInfo: Individual admin voting status
 * - SubmitVotePayload: Result from submitVote mutation
 * - SubmitVotesPayload: Result from submitVotes mutation
 * - ForceEndVotingPayload: Result from forceEndVoting mutation
 *
 * @module ChallengeVote/types
 */

import { builder } from "../builder";
import type {
  VoteDTO,
  ChallengeVoteDTO,
  SubmissionVoteCount,
  GetJudgedStaffVotingProgressOutput,
  AdminVotingInfo,
  SubmitVoteOutput,
  SubmitVotesOutput,
  ForceEndVotingOutput,
} from "@mirai-app/use-cases";

// =============================================================================
// Main ChallengeVote Type
// =============================================================================

/**
 * ChallengeVote type for GraphQL schema
 *
 * Represents a single vote cast by a user for a challenge submission.
 * Derived from VoteDTO and ChallengeVoteDTO.
 */
export const ChallengeVoteType = builder.objectType("ChallengeVote", {
  description: "A vote cast for a challenge submission",
  authScopes: { public: true },
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Unique identifier for the vote (UUID)",
      nullable: false,
    }),

    challengeId: t.exposeID("challengeId", {
      description: "ID of the challenge being voted on",
      nullable: false,
    }),

    submissionId: t.exposeID("submissionId", {
      description: "ID of the submission receiving the vote",
      nullable: false,
    }),

    voterId: t.exposeID("voterId", {
      description: "ID of the voter (trip participant)",
      nullable: false,
    }),

    votePosition: t.exposeInt("votePosition", {
      description: "Voting position (1st, 2nd, or 3rd place)",
      nullable: false,
    }),

    votePoints: t.exposeInt("votePoints", {
      description: "Points awarded for this vote",
      nullable: false,
    }),

    normalizedWeight: t.exposeFloat("normalizedWeight", {
      description: "Normalized weight of the vote (for weighted voting)",
      nullable: false,
    }),

    votedAt: t.field({
      type: "DateTime",
      description: "When the vote was cast",
      nullable: false,
      resolve: (vote: VoteDTO) => vote.votedAt,
    }),
  }),
});

// =============================================================================
// ChallengeVoteList Type (for myVotes query)
// =============================================================================

/**
 * List of votes for a challenge with metadata
 */
export const ChallengeVoteListType = builder.objectType("ChallengeVoteList", {
  description: "List of votes with metadata",
  authScopes: { public: true },
  fields: (t) => ({
    votes: t.field({
      type: [ChallengeVoteType],
      description: "The votes in the list",
      nullable: false,
      resolve: (result: { votes: VoteDTO[] }) => result.votes,
    }),

    totalVotes: t.exposeInt("totalVotes", {
      description: "Total number of votes",
      nullable: false,
    }),
  }),
});

// =============================================================================
// ChallengeVoteAdminList Type (for votesByChallenge query - admin view)
// =============================================================================

/**
 * Admin view of votes for a challenge
 * Includes unique voter count for analytics.
 */
export const ChallengeVoteAdminListType = builder.objectType(
  "ChallengeVoteAdminList",
  {
    description: "Admin view of votes with unique voter count",
    authScopes: { public: true },
    fields: (t) => ({
      votes: t.field({
        type: [ChallengeVoteType],
        description: "All votes for the challenge",
        nullable: false,
        resolve: (result: { votes: ChallengeVoteDTO[] }) => result.votes,
      }),

      totalVotes: t.exposeInt("totalVotes", {
        description: "Total number of votes cast",
        nullable: false,
      }),

      uniqueVoters: t.exposeInt("uniqueVoters", {
        description: "Number of unique voters",
        nullable: false,
      }),
    }),
  },
);

// =============================================================================
// SubmissionVoteCount Type
// =============================================================================

/**
 * Vote count statistics for a single submission
 */
export const SubmissionVoteCountType = builder.objectType(
  "SubmissionVoteCount",
  {
    description: "Vote statistics for a challenge submission",
    authScopes: { public: true },
    fields: (t) => ({
      submissionId: t.exposeID("submissionId", {
        description: "ID of the submission",
        nullable: false,
      }),

      voteCount: t.exposeInt("voteCount", {
        description: "Number of votes received",
        nullable: false,
      }),

      voteScore: t.exposeFloat("voteScore", {
        description: "Calculated vote score (weighted)",
        nullable: false,
      }),
    }),
  },
);

// =============================================================================
// VotingProgress Type
// =============================================================================

/**
 * Voting progress for a challenge
 */
export const VotingProgressType = builder.objectType("VotingProgress", {
  description: "Current voting progress for a challenge",
  authScopes: { public: true },
  fields: (t) => ({
    challengeId: t.exposeID("challengeId", {
      description: "ID of the challenge",
      nullable: false,
    }),

    totalVotes: t.exposeInt("totalVotes", {
      description: "Total number of votes cast across all submissions",
      nullable: false,
    }),

    submissionStats: t.field({
      type: [SubmissionVoteCountType],
      description: "Vote statistics per submission (sorted by score)",
      nullable: false,
      resolve: (result: { submissionStats: SubmissionVoteCount[] }) =>
        result.submissionStats,
    }),
  }),
});

// =============================================================================
// AdminVotingInfo Type
// =============================================================================

/**
 * Individual admin voting progress info
 */
export const AdminVotingInfoType = builder.objectType("AdminVotingInfo", {
  description: "Voting progress for a single admin",
  authScopes: { public: true },
  fields: (t) => ({
    participantId: t.exposeID("participantId", {
      description: "ID of the admin participant",
      nullable: false,
    }),

    votedPositions: t.field({
      type: ["Int"],
      description: "Positions this admin has voted for (1-3)",
      nullable: false,
      resolve: (info: AdminVotingInfo) => info.votedPositions,
    }),

    hasVotedAll: t.boolean({
      description: "Whether this admin has voted all required positions",
      nullable: false,
      resolve: (info: AdminVotingInfo) => info.hasVotedAll,
    }),
  }),
});

// =============================================================================
// JudgedStaffVotingProgress Type
// =============================================================================

/**
 * Judged staff voting progress with admin tracking
 */
export const JudgedStaffVotingProgressType = builder.objectType(
  "JudgedStaffVotingProgress",
  {
    description: "Voting progress for judged staff challenges",
    authScopes: { public: true },
    fields: (t) => ({
      requiredPositions: t.exposeInt("requiredPositions", {
        description: "Number of positions required per admin (1-3)",
        nullable: false,
      }),

      eligibleSubmissionsCount: t.exposeInt("eligibleSubmissionsCount", {
        description: "Number of submissions eligible for voting",
        nullable: false,
      }),

      totalAdmins: t.exposeInt("totalAdmins", {
        description: "Total number of admin participants",
        nullable: false,
      }),

      votedAdmins: t.exposeInt("votedAdmins", {
        description: "Number of admins who have completed voting",
        nullable: false,
      }),

      pendingAdmins: t.exposeInt("pendingAdmins", {
        description: "Number of admins who haven't completed voting",
        nullable: false,
      }),

      allAdminsVoted: t.boolean({
        description: "Whether all admins have completed voting",
        nullable: false,
        resolve: (result: GetJudgedStaffVotingProgressOutput) =>
          result.allAdminsVoted,
      }),

      adminProgress: t.field({
        type: [AdminVotingInfoType],
        description: "Voting progress for each admin",
        nullable: false,
        resolve: (result: GetJudgedStaffVotingProgressOutput) =>
          result.adminProgress,
      }),
    }),
  },
);

// =============================================================================
// Mutation Payload Types
// =============================================================================

/**
 * Result of submitting a single vote
 */
export const SubmitVotePayloadType = builder.objectType("SubmitVotePayload", {
  description: "Result of submitting a single vote",
  authScopes: { public: true },
  fields: (t) => ({
    vote: t.field({
      type: ChallengeVoteType,
      description: "The submitted vote",
      nullable: false,
      resolve: (result: SubmitVoteOutput) => result,
    }),
  }),
});

/**
 * Result of submitting multiple votes
 */
export const SubmitVotesPayloadType = builder.objectType("SubmitVotesPayload", {
  description: "Result of submitting multiple votes",
  authScopes: { public: true },
  fields: (t) => ({
    votes: t.field({
      type: [ChallengeVoteType],
      description: "The submitted votes",
      nullable: false,
      resolve: (result: SubmitVotesOutput) => result.votes,
    }),

    totalVotesCast: t.exposeInt("totalVotesCast", {
      description: "Total number of votes cast",
      nullable: false,
    }),
  }),
});

/**
 * Result of forcing end of voting
 */
export const ForceEndVotingPayloadType = builder.objectType(
  "ForceEndVotingPayload",
  {
    description: "Result of forcing the end of judged staff voting",
    authScopes: { public: true },
    fields: (t) => ({
      success: t.boolean({
        description: "Whether the operation succeeded",
        nullable: false,
        resolve: (result: ForceEndVotingOutput) => result.success,
      }),

      finalized: t.boolean({
        description: "Whether voting was finalized",
        nullable: false,
        resolve: (result: ForceEndVotingOutput) => result.finalized,
      }),

      challengeId: t.exposeID("challengeId", {
        description: "ID of the challenge",
        nullable: false,
      }),

      challengeStatus: t.string({
        description: "Final status of the challenge",
        nullable: false,
        resolve: (result: ForceEndVotingOutput) => result.challengeStatus,
      }),

      totalVotes: t.exposeInt("totalVotes", {
        description: "Total number of votes counted",
        nullable: false,
      }),
    }),
  },
);

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for fetching my votes
 */
export const GetMyVotesInput = builder.inputType("GetMyVotesInput", {
  description: "Input for fetching my votes for a challenge",
  fields: (t) => ({
    challengeId: t.id({
      description: "ID of the challenge",
      required: true,
    }),
    tripId: t.id({
      description: "ID of the trip (for participant validation)",
      required: true,
    }),
  }),
});

/**
 * Input for fetching votes by challenge
 */
export const GetVotesByChallengeInput = builder.inputType(
  "GetVotesByChallengeInput",
  {
    description: "Input for fetching all votes for a challenge",
    fields: (t) => ({
      challengeId: t.id({
        description: "ID of the challenge",
        required: true,
      }),
    }),
  },
);

/**
 * Input for fetching voting progress
 */
export const GetVotingProgressInput = builder.inputType(
  "GetVotingProgressInput",
  {
    description: "Input for fetching voting progress",
    fields: (t) => ({
      challengeId: t.id({
        description: "ID of the challenge",
        required: true,
      }),
    }),
  },
);

/**
 * Input for fetching judged staff voting progress
 */
export const GetJudgedStaffVotingProgressInput = builder.inputType(
  "GetJudgedStaffVotingProgressInput",
  {
    description: "Input for fetching judged staff voting progress",
    fields: (t) => ({
      challengeId: t.id({
        description: "ID of the challenge",
        required: true,
      }),
      tripId: t.id({
        description: "ID of the trip",
        required: true,
      }),
      adminParticipantIds: t.field({
        type: ["ID"],
        description: "IDs of admin participants",
        required: true,
      }),
      requiredPositions: t.int({
        description: "Number of positions required per admin (1-3)",
        required: true,
      }),
      eligibleSubmissionsCount: t.int({
        description: "Number of eligible submissions",
        required: true,
      }),
    }),
  },
);

/**
 * Single vote input for batch submission
 */
export const VoteInput = builder.inputType("VoteInput", {
  description: "Input for a single vote in a batch submission",
  fields: (t) => ({
    submissionId: t.id({
      description: "ID of the submission being voted for",
      required: true,
    }),
    votePosition: t.int({
      description: "Voting position (1, 2, or 3)",
      required: true,
    }),
    votePoints: t.int({
      description: "Points to award (optional)",
      required: false,
    }),
    normalizedWeight: t.float({
      description: "Normalized weight for weighted voting (optional)",
      required: false,
    }),
  }),
});

/**
 * Input for submitting a single vote
 */
export const SubmitVoteInput = builder.inputType("SubmitVoteInput", {
  description: "Input for submitting a single vote",
  fields: (t) => ({
    tripId: t.id({
      description: "ID of the trip (for participant validation)",
      required: true,
    }),
    challengeId: t.id({
      description: "ID of the challenge",
      required: true,
    }),
    submissionId: t.id({
      description: "ID of the submission being voted for",
      required: true,
    }),
    votePosition: t.int({
      description: "Voting position (1, 2, or 3)",
      required: true,
    }),
    votePoints: t.int({
      description: "Points to award (optional)",
      required: false,
    }),
    normalizedWeight: t.float({
      description: "Normalized weight for weighted voting (optional)",
      required: false,
    }),
  }),
});

/**
 * Input for submitting multiple votes
 */
export const SubmitVotesInput = builder.inputType("SubmitVotesInput", {
  description: "Input for submitting multiple votes at once",
  fields: (t) => ({
    tripId: t.id({
      description: "ID of the trip (for participant validation)",
      required: true,
    }),
    challengeId: t.id({
      description: "ID of the challenge",
      required: true,
    }),
    votes: t.field({
      type: [VoteInput],
      description: "List of votes to submit (at least 1 required)",
      required: true,
    }),
  }),
});

/**
 * Input for forcing end of voting
 */
export const ForceEndVotingInput = builder.inputType("ForceEndVotingInput", {
  description: "Input for forcing the end of judged staff voting",
  fields: (t) => ({
    challengeId: t.id({
      description: "ID of the challenge",
      required: true,
    }),
    tripId: t.id({
      description: "ID of the trip (for validation)",
      required: true,
    }),
  }),
});

// =============================================================================
// Export
// =============================================================================

export default ChallengeVoteType;
