import type {
  ChallengeId,
  ChallengeSubmissionId,
  GroupId,
  UserId,
} from "@mirai-app/domain";

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";
export type Ranking = 1 | 2 | 3 | null;

/**
 * DTO for basic challenge submission
 */
export interface ChallengeSubmissionDTO {
  id: ChallengeSubmissionId;
  challengeId: ChallengeId;
  groupId: GroupId;
  imageIds: string[];
  videoId: string | null;
  textContent: string | null;
  latitude: number | null;
  longitude: number | null;
  status: SubmissionStatus;
  reviewedById: UserId | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  awardedPoints: number;
  bonusPoints: number;
  ranking: Ranking;
  voteCount: number;
  voteScore: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for submission with reviewer info
 */
export interface SubmissionWithReviewerDTO extends ChallengeSubmissionDTO {
  reviewedBy: {
    id: UserId;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
}

/**
 * DTO for submission with group info
 */
export interface SubmissionWithGroupDTO extends ChallengeSubmissionDTO {
  group: {
    id: GroupId;
    name: string;
    description: string | null;
    image: string | null;
  } | null;
}

/**
 * DTO for submission with full details
 */
export interface SubmissionWithDetailsDTO extends ChallengeSubmissionDTO {
  group: {
    id: GroupId;
    name: string;
    description: string | null;
    image: string | null;
  } | null;
  reviewedBy: {
    id: UserId;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  challenge: {
    id: ChallengeId;
    tripId: string;
    name: string;
  } | null;
}

/**
 * DTO for paginated submissions
 */
export interface PaginatedSubmissionsDTO {
  submissions: ChallengeSubmissionDTO[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * DTO for submission creation result
 */
export interface CreateSubmissionResultDTO {
  id: ChallengeSubmissionId;
  challengeId: ChallengeId;
  groupId: GroupId;
  status: SubmissionStatus;
  createdAt: Date;
}

/**
 * DTO for submission review result
 */
export interface ReviewSubmissionResultDTO {
  id: ChallengeSubmissionId;
  status: SubmissionStatus;
  awardedPoints: number;
  bonusPoints: number;
  ranking: Ranking;
  reviewedAt: Date;
  reviewedById: UserId;
}

/**
 * DTO for submission with media URLs
 */
export interface SubmissionWithMediaDTO extends ChallengeSubmissionDTO {
  imageUrls: string[];
  videoUrl: string | null;
}

/**
 * DTO for submission validation result
 */
export interface SubmissionValidationDTO {
  valid: boolean;
  errors: string[];
  distance: number | null;
  expectedLocation: {
    latitude: number;
    longitude: number;
  } | null;
}
