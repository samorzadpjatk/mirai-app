// =============================================================================
// Challenge Domain Ports Barrel Export
// =============================================================================

export type {
  ChallengeGateway,
  ChallengeCursorData,
  ChallengeConnectionArgs,
} from "./challenge-gateway";

export type {
  ChallengeSubmissionGateway,
  ChallengeSubmissionCreatedAtCursorData,
  ChallengeSubmissionVoteScoreCursorData,
  ChallengeSubmissionCreatedAtConnectionArgs,
  ChallengeSubmissionVoteScoreConnectionArgs,
} from "./challenge-submission-gateway";

export type {
  ChallengeVoteGateway,
  ChallengeVoteCursorData,
  ChallengeVoteConnectionArgs,
} from "./challenge-vote-gateway";

export type {
  SubmissionReportGateway,
  SubmissionReportCursorData,
  SubmissionReportConnectionArgs,
} from "./submission-report-gateway";
