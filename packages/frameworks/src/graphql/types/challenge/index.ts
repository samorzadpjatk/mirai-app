// Challenge domain module - exports and side-effect registration
// Importing this module registers all Challenge types with the Pothos builder

// Side-effect imports for type registration
import "./types.js";
import "./queries.js";
import "./mutations.js";

// Re-export all types and helpers for use in other modules
export {
  ChallengeType,
  ChallengeEdgeType,
  ChallengeConnectionType,
  ChallengeStatusEnum,
  SubmissionTypeEnum,
  SubmissionStatusEnum,
  ChallengeSubmissionType,
  ChallengeSubmissionEdgeType,
  ChallengeSubmissionConnectionType,
  ChallengeVoteType,
  ChallengeVoteEdgeType,
  ChallengeVoteConnectionType,
  encodeChallengeCursor,
  encodeChallengeSubmissionCursor,
  encodeChallengeVoteCursor,
  buildChallengeConnection,
  buildChallengeSubmissionConnection,
  buildChallengeVoteConnection,
} from "./types.js";
