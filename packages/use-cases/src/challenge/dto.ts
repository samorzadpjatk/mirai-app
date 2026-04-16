/**
 * Challenge DTOs
 *
 * Data Transfer Objects for Challenge domain.
 * Used by use-case gateways to return data to the presentation layer.
 */

import type { PaginatedResult } from "../system/shared/dto";
import type {
  ChallengeStatus,
  SubmissionStatus,
  ScoringCategory,
  SubmissionType,
} from "@mirai-app/domain";

/**
 * ChallengeDTO - Lightweight representation of a challenge
 */
export interface ChallengeDTO {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  status: ChallengeStatus;
  submissionType: SubmissionType;
  scoringCategory: ScoringCategory;
  points: number;
  maxPoints: number | null;
  startDate: Date | null;
  endDate: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ChallengeSubmissionDTO - Representation of a challenge submission
 */
export interface ChallengeSubmissionDTO {
  id: string;
  challengeId: string;
  userId: string;
  groupId: string | null;
  content: string | null;
  mediaUrls: string[];
  status: SubmissionStatus;
  score: number | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  submittedAt: Date;
  updatedAt: Date;
  voteCount: number;
  voteScore: number;
}

/**
 * ChallengeVoteDTO - Representation of a challenge vote
 */
export interface ChallengeVoteDTO {
  id: string;
  challengeId: string;
  submissionId: string;
  voterId: string;
  votePosition: number;
  votePoints: number;
  normalizedWeight: number;
  votedAt: Date;
}

/**
 * Paginated result for challenge queries
 */
export type ChallengePaginatedResult = PaginatedResult<ChallengeDTO>;

/**
 * Paginated result for submission queries
 */
export type SubmissionPaginatedResult = PaginatedResult<ChallengeSubmissionDTO>;

/**
 * Cursor data for challenge submission pagination by createdAt
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface ChallengeSubmissionCreatedAtCursorData {
  id: string;
  createdAt: string;
}

/**
 * Cursor data for challenge submission pagination by voteScore
 * Uses voteScore as the primary sort field with id as tiebreaker
 */
export interface ChallengeSubmissionVoteScoreCursorData {
  id: string;
  createdAt: string;
  voteScore: number;
}
