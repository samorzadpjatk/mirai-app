import type { ChallengeId, ChallengeSubmissionId, ChallengeVoteId } from "../value-objects/ChallengeId";
import type { UserId } from "../../user/value-objects/UserId";

/**
 * ChallengeVote entity interface
 * Represents a vote cast by a user on a challenge submission
 */
export interface ChallengeVote {
  id: ChallengeVoteId;
  challengeId: ChallengeId;
  submissionId: ChallengeSubmissionId;
  voterId: UserId;
  votePosition: number;
  votePoints: number;
  normalizedWeight: number;
  votedAt: Date;
}
