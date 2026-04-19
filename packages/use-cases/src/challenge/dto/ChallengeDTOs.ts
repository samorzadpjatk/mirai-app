import type { ChallengeId, TripId } from "@mirai-app/domain";

export type ChallengeStatus =
  | "HIDDEN"
  | "VISIBLE"
  | "ACTIVE"
  | "VOTING_PHASE"
  | "COMPLETED"
  | "CANCELLED";
export type ChallengeSubmissionType =
  | "IMAGE"
  | "MULTI_IMAGE"
  | "VIDEO"
  | "TEXT"
  | "IMAGE_LOCATION"
  | "LOCATION"
  | "QR_CODE";
export type ChallengeScoringCategory =
  | "SPEED"
  | "UNLIMITED"
  | "JUDGED_STAFF"
  | "PEER_VOTING";

/**
 * DTO for basic challenge info
 */
export interface ChallengeDTO {
  id: ChallengeId;
  tripId: TripId;
  name: string;
  description: string | null;
  image: string | null;
  submissionType: ChallengeSubmissionType;
  scoringCategory: ChallengeScoringCategory;
  isRecurring: boolean;
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  basePoints: number;
  firstPlacePoints: number | null;
  secondPlacePoints: number | null;
  thirdPlacePoints: number | null;
  status: ChallengeStatus;
  startTime: Date | null;
  endTime: Date | null;
  votingStartTime: Date | null;
  votingEndTime: Date | null;
  targetLatitude: number | null;
  targetLongitude: number | null;
  expectedValue: string | null;
  autoApprove: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for challenge with computed fields
 */
export interface ChallengeWithClientFieldsDTO extends ChallengeDTO {
  qrCodeValue: string | null;
}

/**
 * DTO for challenge with stats
 */
export interface ChallengeWithStatsDTO extends ChallengeDTO {
  submissionCount: number;
  approvedSubmissionCount: number;
  pendingSubmissionCount: number;
}

/**
 * DTO for challenge creation result
 */
export interface CreateChallengeResultDTO {
  id: ChallengeId;
  tripId: TripId;
  name: string;
  status: ChallengeStatus;
  isRecurring: boolean;
}

/**
 * DTO for challenge update result
 */
export interface UpdateChallengeResultDTO {
  id: ChallengeId;
  name: string;
  description: string | null;
  status: ChallengeStatus;
  updatedAt: Date;
}

/**
 * DTO for challenge status change
 */
export interface ChallengeStatusChangeDTO {
  id: ChallengeId;
  previousStatus: ChallengeStatus;
  newStatus: ChallengeStatus;
  changedAt: Date;
}

/**
 * DTO for recurring challenge instance
 */
export interface RecurringChallengeInstanceDTO {
  id: ChallengeId;
  templateId: ChallengeId;
  tripId: TripId;
  instanceDate: Date;
  startTime: Date;
  endTime: Date;
  status: ChallengeStatus;
}

/**
 * DTO for challenge with peer voting stats
 */
export interface ChallengeWithVotingStatsDTO extends ChallengeDTO {
  totalSubmissions: number;
  totalVotes: number;
  avgVoteScore: number | null;
  isVotingActive: boolean;
}

/**
 * DTO for paginated challenges with stats
 */
export interface PaginatedChallengesDTO {
  challenges: ChallengeWithStatsDTO[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
