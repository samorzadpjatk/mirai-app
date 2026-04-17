import type {
  ChallengeId,
  ChallengeSubmissionId,
  ChallengeVoteId,
  UserId,
} from "@mirai-app/domain";

/**
 * DTO for challenge vote
 */
export interface ChallengeVoteDTO {
  id: ChallengeVoteId;
  submissionId: ChallengeSubmissionId;
  userId: UserId;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for vote with submission info
 */
export interface VoteWithSubmissionDTO extends ChallengeVoteDTO {
  submission: {
    id: ChallengeSubmissionId;
    challengeId: ChallengeId;
    groupId: string;
    imageIds: string[];
    videoId: string | null;
    voteCount: number;
    voteScore: number;
  } | null;
}

/**
 * DTO for paginated votes
 */
export interface PaginatedVotesDTO {
  votes: ChallengeVoteDTO[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * DTO for vote creation result
 */
export interface CreateVoteResultDTO {
  id: ChallengeVoteId;
  submissionId: ChallengeSubmissionId;
  userId: UserId;
  score: number;
  createdAt: Date;
}

/**
 * DTO for vote update result
 */
export interface UpdateVoteResultDTO {
  id: ChallengeVoteId;
  submissionId: ChallengeSubmissionId;
  score: number;
  updatedAt: Date;
}

/**
 * DTO for vote statistics
 */
export interface VoteStatsDTO {
  submissionId: ChallengeSubmissionId;
  totalVotes: number;
  averageScore: number;
  scoreDistribution: {
    score1: number;
    score2: number;
    score3: number;
    score4: number;
    score5: number;
  };
}

/**
 * DTO for voting eligibility
 */
export interface VotingEligibilityDTO {
  canVote: boolean;
  reason: string | null;
  alreadyVoted: boolean;
  existingVoteId: ChallengeVoteId | null;
}
