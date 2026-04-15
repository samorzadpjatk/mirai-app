/**
 * Challenge Enums
 *
 * Enums for challenges, submissions, and scoring.
 *
 * @module enums/challenge
 */

/**
 * Challenge submission types
 */
export enum SubmissionType {
  IMAGE = "IMAGE",
  MULTI_IMAGE = "MULTI_IMAGE",
  VIDEO = "VIDEO",
  TEXT = "TEXT",
  IMAGE_LOCATION = "IMAGE_LOCATION",
  LOCATION = "LOCATION",
  QR_CODE = "QR_CODE",
}

/**
 * Challenge scoring categories
 */
export enum ScoringCategory {
  SPEED = "SPEED",
  UNLIMITED = "UNLIMITED",
  JUDGED_STAFF = "JUDGED_STAFF",
  PEER_VOTING = "PEER_VOTING",
}

/**
 * Challenge status workflow
 * HIDDEN -> VISIBLE -> ACTIVE -> [VOTING_PHASE] -> COMPLETED
 *                            -> CANCELLED
 */
export enum ChallengeStatus {
  HIDDEN = "HIDDEN",
  VISIBLE = "VISIBLE",
  ACTIVE = "ACTIVE",
  VOTING_PHASE = "VOTING_PHASE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

/**
 * Submission status values
 */
export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Valid submission statuses
 */
export const SUBMISSION_STATUSES: SubmissionStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
];

/**
 * Type guard to check if a string is a valid SubmissionType
 */
export function isSubmissionType(value: string): value is SubmissionType {
  return Object.values(SubmissionType).includes(value as SubmissionType);
}

/**
 * Type guard to check if a string is a valid ScoringCategory
 */
export function isScoringCategory(value: string): value is ScoringCategory {
  return Object.values(ScoringCategory).includes(value as ScoringCategory);
}

/**
 * Type guard to check if a string is a valid ChallengeStatus
 */
export function isChallengeStatus(value: string): value is ChallengeStatus {
  return Object.values(ChallengeStatus).includes(value as ChallengeStatus);
}

/**
 * Type guard to check if a string is a valid SubmissionStatus
 */
export function isSubmissionStatus(value: string): value is SubmissionStatus {
  return SUBMISSION_STATUSES.includes(value as SubmissionStatus);
}

/**
 * Check if a challenge status is terminal (cannot transition further)
 */
export function isTerminalChallengeStatus(status: ChallengeStatus): boolean {
  return (
    status === ChallengeStatus.COMPLETED || status === ChallengeStatus.CANCELLED
  );
}
